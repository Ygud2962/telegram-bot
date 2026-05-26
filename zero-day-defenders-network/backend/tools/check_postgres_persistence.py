from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from zdnet_backend.content import load_content
from zdnet_backend.postgres_repository import PostgresGameRepository


class PersistenceError(RuntimeError):
    pass


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise PersistenceError(message)


def create_repo(dsn: str, *, auto_migrate: bool) -> PostgresGameRepository:
    try:
        return PostgresGameRepository(load_content(), dsn, auto_migrate=auto_migrate)
    except ModuleNotFoundError as exc:
        if exc.name == "psycopg2":
            raise PersistenceError(
                "psycopg2 is not installed. Install backend database dependencies before running this check."
            ) from exc
        raise


def finish_one_attempt(repo: PostgresGameRepository, state: Any) -> dict[str, Any]:
    boot = repo.bootstrap(state)
    threats = boot.get("activeThreats") or []
    assert_true(len(threats) > 0, "no active threats after bootstrap")
    threat = threats[0]
    start = repo.start_attempt(state, threat["id"])
    result = repo.finish_attempt(
        state,
        start["attemptId"],
        {
            "gameType": threat["gameType"],
            "durationMs": 30000,
            "score": 1800,
            "accuracy": 0.92,
            "comboMax": 16,
            "inputSummary": {"swipes": 48, "mistakes": 2},
        },
    )
    assert_true(result.get("accepted") is True, f"attempt rejected: {result}")
    return result


def run() -> dict[str, Any]:
    dsn = os.environ.get("ZDNET_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    if not dsn:
        raise PersistenceError("Set ZDNET_DATABASE_URL or DATABASE_URL before running this check.")

    telegram_id = int(os.environ.get("ZDNET_PG_CHECK_USER_ID") or (9_900_000_000 + int(time.time()) % 1_000_000))
    nickname = os.environ.get("ZDNET_PG_CHECK_NICKNAME") or f"pg_check_{telegram_id}"

    repo1 = create_repo(dsn, auto_migrate=True)
    state1 = repo1.get_or_create_player(telegram_id, nickname)
    initial_wallet = dict(state1.wallet)

    finish_one_attempt(repo1, state1)
    cache = repo1.open_cache(state1, 1, seed=17)
    assert_true(len(cache.get("results") or []) == 1, "cache opening did not grant a card")
    invoice = repo1.create_invoice(state1, "zero_keys_10")
    payload = invoice["payload"]

    expected_after_gameplay = {
        "playerId": state1.player["id"],
        "credits": state1.wallet["credits"],
        "zeroKeys": state1.wallet["zeroKeys"],
        "cards": sorted(state1.cards.keys()),
        "payments": len(state1.payments),
        "payload": payload,
    }

    repo2 = create_repo(dsn, auto_migrate=False)
    state2 = repo2.get_or_create_player(telegram_id, nickname)
    assert_true(state2.player["id"] == expected_after_gameplay["playerId"], "player id changed after repository restart")
    assert_true(state2.wallet["credits"] == expected_after_gameplay["credits"], "credits were not persisted")
    assert_true(state2.wallet["zeroKeys"] == expected_after_gameplay["zeroKeys"], "zero keys were not persisted")
    assert_true(sorted(state2.cards.keys()) == expected_after_gameplay["cards"], "cards were not persisted")
    assert_true(len(state2.payments) == expected_after_gameplay["payments"], "pending payment was not persisted")
    assert_true(
        any(payment.get("invoicePayload") == payload and payment.get("status") == "created" for payment in state2.payments),
        "created payment was not restored from snapshot",
    )

    before_paid_keys = int(state2.wallet["zeroKeys"])
    grant = repo2.grant_payment(payload, telegram_payment_charge_id="pg_check_paid")
    assert_true(grant.get("granted") is True, f"payment grant failed: {grant}")

    repo3 = create_repo(dsn, auto_migrate=False)
    state3 = repo3.get_or_create_player(telegram_id, nickname)
    assert_true(int(state3.wallet["zeroKeys"]) == before_paid_keys + 10, "paid zero keys were not persisted")
    assert_true(
        any(payment.get("invoicePayload") == payload and payment.get("status") == "paid" for payment in state3.payments),
        "paid payment was not persisted",
    )

    duplicate = repo3.grant_payment(payload, telegram_payment_charge_id="pg_check_duplicate")
    assert_true(duplicate.get("idempotent") is True, f"duplicate grant was not idempotent: {duplicate}")

    state4 = repo3.get_or_create_player(telegram_id, nickname)
    assert_true(int(state4.wallet["zeroKeys"]) == before_paid_keys + 10, "duplicate grant changed wallet")

    return {
        "ok": True,
        "telegramId": telegram_id,
        "playerId": state1.player["id"],
        "initialWallet": initial_wallet,
        "walletAfterPayment": state4.wallet,
        "cards": sorted(state4.cards.keys()),
        "paymentPayload": payload,
    }


def main() -> int:
    try:
        result = run()
    except PersistenceError as exc:
        print(f"POSTGRES PERSISTENCE FAIL: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
