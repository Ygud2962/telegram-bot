from __future__ import annotations

import random
import sys
import unittest
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from zdnet_backend.content import load_content
from zdnet_backend.economy import calculate_rewards, validate_attempt_summary
from zdnet_backend.gacha import GachaState, open_zero_cache
from zdnet_backend.payments import public_catalog
from zdnet_backend.postgres_repository import snapshot_to_state, state_to_snapshot
from zdnet_backend.repository import InMemoryGameRepository


class EconomyTests(unittest.TestCase):
    def test_paid_multiplier_does_not_increase_fair_score(self):
        free = calculate_rewards(
            base_reward=100,
            difficulty=3,
            score=1200,
            accuracy=0.9,
            combo_max=8,
            paid_multiplier=1.0,
        )
        paid = calculate_rewards(
            base_reward=100,
            difficulty=3,
            score=1200,
            accuracy=0.9,
            combo_max=8,
            paid_multiplier=1.5,
        )
        self.assertGreater(paid.credits, free.credits)
        self.assertEqual(paid.fair_score_delta, free.fair_score_delta)

    def test_attempt_validation_rejects_impossible_score_rate(self):
        flags = validate_attempt_summary(
            game_type="packet_rain",
            duration_ms=5000,
            score=100000,
            accuracy=1.0,
            combo_max=100,
            input_summary={"swipes": 10},
        )
        self.assertIn("score_rate_too_high", flags)


class GachaTests(unittest.TestCase):
    def test_legendary_pity_forces_legendary(self):
        content = load_content()
        state = GachaState(legendary_pity=99)
        results = open_zero_cache(content, state, 1, random.Random(1))
        self.assertEqual(results[0]["rarity"], "legendary")
        self.assertEqual(state.legendary_pity, 0)

    def test_bad_cache_count_rejected(self):
        with self.assertRaises(ValueError):
            open_zero_cache(load_content(), GachaState(), 0, random.Random(1))


class PaymentCatalogTests(unittest.TestCase):
    def test_public_catalog_uses_frontend_product_id_contract(self):
        catalog = public_catalog()
        self.assertGreater(len(catalog), 0)
        product = catalog[0]
        self.assertIn("productId", product)
        self.assertNotIn("id", product)
        self.assertIn("amount", product)
        self.assertIn("currency", product)
        self.assertEqual(product["fairScoreImpact"], 0)


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.repo = InMemoryGameRepository(load_content())
        self.state = self.repo.get_or_create_player(telegram_id=1001, nickname="rookie")

    def test_bootstrap_contains_active_threats(self):
        boot = self.repo.bootstrap(self.state)
        self.assertGreaterEqual(len(boot["activeThreats"]), 1)
        self.assertEqual(boot["energy"]["current"], 12)

    def test_attempt_finish_is_idempotent(self):
        threat = self.repo.bootstrap(self.state)["activeThreats"][0]
        start = self.repo.start_attempt(self.state, threat["id"])
        credits_before = self.state.wallet["credits"]
        payload = {
            "gameType": start.get("gameType", threat["gameType"]),
            "durationMs": 30000,
            "score": 1200,
            "accuracy": 0.92,
            "comboMax": 12,
            "inputSummary": {"swipes": 42, "mistakes": 2},
        }
        result1 = self.repo.finish_attempt(self.state, start["attemptId"], payload)
        credits_after_first = self.state.wallet["credits"]
        result2 = self.repo.finish_attempt(self.state, start["attemptId"], payload)
        self.assertTrue(result1["accepted"])
        self.assertEqual(result1, result2)
        self.assertEqual(self.state.wallet["credits"], credits_after_first)
        self.assertGreater(credits_after_first, credits_before)

    def test_open_cache_spends_keys_and_grants_card(self):
        before_keys = self.state.wallet["zeroKeys"]
        result = self.repo.open_cache(self.state, 1, seed=5)
        self.assertEqual(result["zeroKeysLeft"], before_keys - 1)
        self.assertEqual(len(self.state.cards), 1)

    def test_tool_upgrade_spends_credits_without_fair_score_change(self):
        before_credits = self.state.wallet["credits"]
        before_fair = dict(self.state.fair_score)
        result = self.repo.upgrade_tool(self.state, "tool_scanner")
        self.assertEqual(result["tool"]["level"], 2)
        self.assertEqual(self.state.wallet["credits"], before_credits - 120)
        self.assertEqual(self.state.fair_score, before_fair)

    def test_tool_equip_uses_three_slots_and_replaces_existing_slot(self):
        self.state.tools["tool_crypto"] = {"toolId": "tool_crypto", "level": 1, "count": 1, "equipped": False}
        result = self.repo.equip_tool(self.state, "tool_crypto", 1)
        crypto = next(tool for tool in result["tools"] if tool["toolId"] == "tool_crypto")
        scanner = next(tool for tool in result["tools"] if tool["toolId"] == "tool_scanner")
        self.assertTrue(crypto["equipped"])
        self.assertEqual(crypto["slotIndex"], 1)
        self.assertFalse(scanner["equipped"])
        self.assertIsNone(scanner["slotIndex"])

    def test_snapshot_round_trip_preserves_core_state(self):
        self.repo.open_cache(self.state, 1, seed=7)
        snapshot = state_to_snapshot(self.state)
        restored = snapshot_to_state(snapshot)
        self.assertEqual(restored.player["telegramId"], self.state.player["telegramId"])
        self.assertEqual(restored.wallet["zeroKeys"], self.state.wallet["zeroKeys"])
        self.assertEqual(restored.gacha.open_count, self.state.gacha.open_count)
        self.assertEqual(set(restored.cards.keys()), set(self.state.cards.keys()))

    def test_invoice_creation_does_not_grant_reward(self):
        before_keys = self.state.wallet["zeroKeys"]
        invoice = self.repo.create_invoice(self.state, "zero_keys_10")
        self.assertEqual(self.state.wallet["zeroKeys"], before_keys)
        self.assertEqual(invoice["payment"]["status"], "created")
        self.assertIsNone(invoice["payment"]["grantedAt"])

    def test_payment_grant_is_idempotent_and_fair_score_neutral(self):
        before_keys = self.state.wallet["zeroKeys"]
        before_fair = dict(self.state.fair_score)
        invoice = self.repo.create_invoice(self.state, "zero_keys_10")
        payload = invoice["payload"]
        ok, reason = self.repo.validate_payment(payload, invoice["payment"]["amount"], invoice["payment"]["currency"])
        self.assertTrue(ok, reason)

        result1 = self.repo.grant_payment(payload, telegram_payment_charge_id="tg_1")
        result2 = self.repo.grant_payment(payload, telegram_payment_charge_id="tg_1")

        self.assertTrue(result1["granted"])
        self.assertFalse(result2["granted"])
        self.assertTrue(result2["idempotent"])
        self.assertEqual(self.state.wallet["zeroKeys"], before_keys + 10)
        self.assertEqual(self.state.fair_score, before_fair)


if __name__ == "__main__":
    unittest.main()
