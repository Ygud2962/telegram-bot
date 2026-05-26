from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


class SmokeError(RuntimeError):
    pass


def api_path(base_url: str, path: str) -> str:
    """Map standalone /api routes to bot-mounted /zdnet_api routes when needed."""
    parsed = urlparse(base_url)
    if parsed.path.rstrip("/").endswith("/zdnet_api") and path.startswith("/api/"):
        return path.removeprefix("/api")
    return path


def request_json(
    base_url: str,
    method: str,
    path: str,
    *,
    token: str | None = None,
    body: dict[str, Any] | None = None,
    extra_headers: dict[str, str] | None = None,
    timeout: float = 10.0,
) -> dict[str, Any]:
    url = urljoin(base_url.rstrip("/") + "/", api_path(base_url, path).lstrip("/"))
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)

    req = Request(url=url, data=payload, headers=headers, method=method.upper())
    try:
        with urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise SmokeError(f"{method} {url} failed with HTTP {exc.code}: {raw}") from exc
    except URLError as exc:
        raise SmokeError(f"{method} {url} failed: {exc}") from exc


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeError(message)


def run(args: argparse.Namespace) -> dict[str, Any]:
    base_url = args.base_url.rstrip("/")
    user_id = int(args.dev_telegram_id)
    nickname = args.nickname

    auth = request_json(
        base_url,
        "POST",
        "/api/auth/telegram",
        body={
            "initData": "",
            "startParam": "smoke",
            "devTelegramId": user_id,
            "devNickname": nickname,
        },
    )
    token = auth.get("sessionToken")
    assert_true(bool(token), "auth did not return sessionToken")

    boot = request_json(base_url, "GET", "/api/bootstrap", token=token)
    threats = boot.get("activeThreats") or []
    assert_true(len(threats) > 0, "bootstrap returned no active threats")
    wallet_before = dict(boot.get("wallet") or {})
    fair_before_gameplay = dict(boot.get("fairScore") or {})
    energy_before = int((boot.get("energy") or {}).get("current") or 0)
    assert_true(energy_before > 0, "player has no energy for smoke attempt")

    threat = threats[0]
    start = request_json(base_url, "POST", f"/api/threats/{threat['id']}/start", token=token)
    attempt_id = start.get("attemptId")
    assert_true(bool(attempt_id), "start attempt did not return attemptId")

    finish = request_json(
        base_url,
        "POST",
        f"/api/attempts/{attempt_id}/finish",
        token=token,
        body={
            "gameType": threat["gameType"],
            "durationMs": 30000,
            "score": 1800,
            "accuracy": 0.92,
            "comboMax": 16,
            "inputSummary": {"swipes": 48, "mistakes": 2},
        },
    )
    assert_true(finish.get("accepted") is True, f"attempt was rejected: {finish}")

    boot_after_attempt = request_json(base_url, "GET", "/api/bootstrap", token=token)
    assert_true(
        int((boot_after_attempt.get("wallet") or {}).get("credits") or 0) > int(wallet_before.get("credits") or 0),
        "credits did not increase after accepted attempt",
    )

    cache = request_json(base_url, "POST", "/api/cache/open", token=token, body={"count": 1})
    assert_true(len(cache.get("results") or []) == 1, "cache did not return one card result")

    products = request_json(base_url, "GET", "/api/payments/products", token=token)
    product_ids = {product.get("productId") or product.get("id") for product in products.get("products", [])}
    assert_true(args.invoice_product in product_ids, f"product {args.invoice_product!r} not in payment catalog")

    pre_invoice_boot = request_json(base_url, "GET", "/api/bootstrap", token=token)
    keys_before_invoice = int((pre_invoice_boot.get("wallet") or {}).get("zeroKeys") or 0)
    fair_before_invoice = dict(pre_invoice_boot.get("fairScore") or {})

    invoice = request_json(
        base_url,
        "POST",
        "/api/payments/invoice",
        token=token,
        body={"productId": args.invoice_product},
    )
    payload = invoice.get("payload")
    assert_true(bool(payload), "invoice did not return payload")

    post_invoice_boot = request_json(base_url, "GET", "/api/bootstrap", token=token)
    assert_true(
        int((post_invoice_boot.get("wallet") or {}).get("zeroKeys") or 0) == keys_before_invoice,
        "invoice creation granted zero keys before payment confirmation",
    )

    webhook_headers = {}
    if args.webhook_secret:
        webhook_headers["X-ZDNET-Webhook-Secret"] = args.webhook_secret

    grant = request_json(
        base_url,
        "POST",
        "/api/payments/webhook/telegram",
        body={
            "payload": payload,
            "telegramPaymentChargeId": f"smoke_{int(time.time())}",
            "providerPaymentChargeId": "smoke_provider",
        },
        extra_headers=webhook_headers,
    )
    assert_true(grant.get("granted") is True, f"payment grant failed: {grant}")
    assert_true(
        dict(grant.get("fairScore") or {}) == fair_before_invoice,
        "payment changed fairScore",
    )

    duplicate = request_json(
        base_url,
        "POST",
        "/api/payments/webhook/telegram",
        body={
            "payload": payload,
            "telegramPaymentChargeId": "smoke_duplicate",
            "providerPaymentChargeId": "smoke_provider_duplicate",
        },
        extra_headers=webhook_headers,
    )
    assert_true(duplicate.get("idempotent") is True, f"duplicate payment was not idempotent: {duplicate}")

    history = request_json(base_url, "GET", "/api/payments/history", token=token)
    assert_true(
        any(payment.get("invoicePayload") == payload and payment.get("status") == "paid" for payment in history.get("payments", [])),
        "paid payment not found in history",
    )

    final_boot = request_json(base_url, "GET", "/api/bootstrap", token=token)
    return {
        "ok": True,
        "playerId": auth.get("player", {}).get("id"),
        "creditsBefore": wallet_before.get("credits"),
        "creditsAfter": (final_boot.get("wallet") or {}).get("credits"),
        "zeroKeysBeforeInvoice": keys_before_invoice,
        "zeroKeysAfterPayment": (final_boot.get("wallet") or {}).get("zeroKeys"),
        "fairScoreBeforeGameplay": fair_before_gameplay,
        "fairScoreBeforePayment": fair_before_invoice,
        "fairScoreAfterPayment": final_boot.get("fairScore"),
        "paymentPayload": payload,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ZERO_DAY MVP smoke test against a running dev API.")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("ZDNET_SMOKE_BASE_URL", "http://127.0.0.1:8090"),
        help="API base URL. Use http://host/zdnet_api for bot-mounted API.",
    )
    parser.add_argument("--dev-telegram-id", default=os.environ.get("ZDNET_SMOKE_USER_ID", "91001"))
    parser.add_argument("--nickname", default=os.environ.get("ZDNET_SMOKE_NICKNAME", "smoke_runner"))
    parser.add_argument("--invoice-product", default=os.environ.get("ZDNET_SMOKE_PRODUCT", "zero_keys_10"))
    parser.add_argument("--webhook-secret", default=os.environ.get("ZDNET_PAYMENT_WEBHOOK_SECRET", ""))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        result = run(args)
    except SmokeError as exc:
        print(f"SMOKE FAIL: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
