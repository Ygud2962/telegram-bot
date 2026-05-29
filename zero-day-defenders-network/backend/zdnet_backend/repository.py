from __future__ import annotations

import random
import time
import uuid
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from .economy import calculate_rewards, validate_attempt_summary
from .gacha import GachaState, open_zero_cache
from .payments import apply_product_grant, get_product, public_catalog
from .security import create_session_token


DAEMON_XP_THRESHOLDS = [0, 80, 200, 380, 620, 920, 1280, 1700, 2180, 2720]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


@dataclass
class PlayerState:
    player: dict[str, Any]
    wallet: dict[str, int]
    energy: dict[str, Any]
    progression: dict[str, int]
    map: list[dict[str, Any]]
    cards: dict[str, dict[str, Any]]
    tools: dict[str, dict[str, Any]]
    daemon: dict[str, Any]
    daily: dict[str, Any]
    gacha: GachaState
    fair_score: dict[str, int]
    threats: dict[str, dict[str, Any]] = field(default_factory=dict)
    attempts: dict[str, dict[str, Any]] = field(default_factory=dict)
    payments: list[dict[str, Any]] = field(default_factory=list)


class GameError(Exception):
    def __init__(self, code: str, status: int = 400):
        super().__init__(code)
        self.code = code
        self.status = status


class InMemoryGameRepository:
    """MVP repository. Replace with PostgreSQL implementation after API stabilizes."""

    def __init__(self, content: dict[str, Any]):
        self.content = content
        self.players: dict[int, PlayerState] = {}
        self.telegram_to_player: dict[int, int] = {}
        self.sessions: dict[str, int] = {}
        self.next_player_id = 1

    def get_or_create_player(self, telegram_id: int, nickname: str | None = None) -> PlayerState:
        telegram_id = int(telegram_id)
        player_id = self.telegram_to_player.get(telegram_id)
        if player_id is not None:
            state = self.players[player_id]
            state.player["lastSeenAt"] = iso(utc_now())
            if nickname:
                state.player["nickname"] = nickname
            return state

        player_id = self.next_player_id
        self.next_player_id += 1
        self.telegram_to_player[telegram_id] = player_id

        now = utc_now()
        map_state = []
        for obj in self.content["mapObjects"]:
            map_state.append(
                {
                    "objectId": obj["id"],
                    "districtId": obj["districtId"],
                    "name": obj["name"],
                    "state": "protected",
                    "protectionLevel": 1,
                    "nodes": {"firewall": 0, "ids": 0, "honeypot": 0},
                    "lastThreatAt": None,
                }
            )

        state = PlayerState(
            player={
                "id": str(player_id),
                "telegramId": telegram_id,
                "nickname": nickname or f"rookie_{telegram_id}",
                "socLevel": 1,
                "createdAt": iso(now),
                "lastSeenAt": iso(now),
            },
            wallet={"credits": 500, "zeroKeys": 2, "cleanFragments": 0},
            energy={"current": 12, "dailyMax": 12, "lastResetAt": iso(now)},
            progression={
                "socLevel": 1,
                "socXp": 0,
                "seasonDay": 1,
                "episode": 1,
                "storyMission": 0,
                "battlePassLevel": 0,
                "battlePassXp": 0,
            },
            map=map_state,
            cards={},
            tools={
                "tool_scanner": {"toolId": "tool_scanner", "level": 1, "count": 1, "equipped": True, "slotIndex": 1},
                "tool_firewall": {"toolId": "tool_firewall", "level": 1, "count": 1, "equipped": True, "slotIndex": 2},
            },
            daemon={
                "level": 1,
                "xp": 0,
                "skinId": "default",
                "hungerState": "fed",
                "lastFedAt": iso(now),
                "autoFeedUntil": None,
            },
            daily={
                "streak": 1,
                "lastLoginDate": now.date().isoformat(),
                "dailyThreatDone": False,
                "comboProgress": 0,
                "spinnerClaimedDate": None,
                "streakRescueDeadline": None,
            },
            gacha=GachaState(),
            fair_score={"daily": 0, "weekly": 0, "season": 0},
        )
        self.players[player_id] = state
        self._spawn_initial_threats(state)
        return state

    def create_session(self, player_id: int) -> str:
        token = create_session_token()
        self.sessions[token] = int(player_id)
        return token

    def get_by_session(self, token: str) -> PlayerState:
        player_id = self.sessions.get(token)
        if player_id is None or player_id not in self.players:
            raise GameError("unauthorized", status=401)
        return self.players[player_id]

    def bootstrap(self, state: PlayerState) -> dict[str, Any]:
        self._reset_energy_if_needed(state)
        self._update_daemon_hunger(state)
        self._ensure_active_threat(state)
        return {
            "player": deepcopy(state.player),
            "wallet": deepcopy(state.wallet),
            "energy": deepcopy(state.energy),
            "progression": deepcopy(state.progression),
            "map": deepcopy(state.map),
            "activeThreats": [
                deepcopy(threat)
                for threat in state.threats.values()
                if threat["status"] == "active"
            ],
            "cards": list(deepcopy(state.cards).values()),
            "tools": list(deepcopy(state.tools).values()),
            "daemon": deepcopy(state.daemon),
            "daily": deepcopy(state.daily),
            "gacha": state.gacha.to_dict(),
            "fairScore": deepcopy(state.fair_score),
            "contentVersion": self.content["version"],
            "shopProducts": public_catalog(),
            "serverTime": iso(utc_now()),
        }

    def start_attempt(self, state: PlayerState, threat_id: str) -> dict[str, Any]:
        self._reset_energy_if_needed(state)
        threat = state.threats.get(threat_id)
        if threat is None or threat["status"] != "active":
            raise GameError("threat_not_active", status=404)
        if state.energy["current"] <= 0:
            raise GameError("not_enough_energy", status=409)

        state.energy["current"] -= 1
        attempt_id = str(uuid.uuid4())
        seed = uuid.uuid4().hex
        state.attempts[attempt_id] = {
            "id": attempt_id,
            "threatId": threat_id,
            "gameType": threat["gameType"],
            "difficulty": threat["difficulty"],
            "baseReward": threat["baseReward"],
            "seed": seed,
            "startedAt": iso(utc_now()),
            "finished": False,
            "response": None,
        }
        return {"attemptId": attempt_id, "seed": seed, "energyLeft": state.energy["current"]}

    def finish_attempt(self, state: PlayerState, attempt_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        attempt = state.attempts.get(attempt_id)
        if attempt is None:
            raise GameError("attempt_not_found", status=404)
        if attempt["finished"]:
            return deepcopy(attempt["response"])

        game_type = str(payload.get("gameType") or "")
        duration_ms = int(payload.get("durationMs") or 0)
        score = int(payload.get("score") or 0)
        accuracy = float(payload.get("accuracy") or 0)
        combo_max = int(payload.get("comboMax") or 0)
        input_summary = payload.get("inputSummary") or {}

        flags = validate_attempt_summary(
            game_type=game_type,
            duration_ms=duration_ms,
            score=score,
            accuracy=accuracy,
            combo_max=combo_max,
            input_summary=input_summary,
        )
        if game_type != attempt["gameType"]:
            flags.append("game_type_mismatch")

        accepted = not flags
        rewards = {"credits": 0, "socXp": 0, "daemonXp": 0, "cardDrops": []}
        fair_score_delta = 0
        map_delta: dict[str, Any] = {}

        if accepted:
            reward = calculate_rewards(
                base_reward=int(attempt["baseReward"]),
                difficulty=int(attempt["difficulty"]),
                score=score,
                accuracy=accuracy,
                combo_max=combo_max,
            )
            state.wallet["credits"] += reward.credits
            state.progression["socXp"] += reward.soc_xp
            state.fair_score["daily"] += reward.fair_score_delta
            state.fair_score["weekly"] += reward.fair_score_delta
            state.fair_score["season"] += reward.fair_score_delta
            rewards["credits"] = reward.credits
            rewards["socXp"] = reward.soc_xp
            fair_score_delta = reward.fair_score_delta
            daemon_gain = self._grant_daemon_xp(
                state,
                34 + int(attempt["difficulty"]) * 12 + min(60, score // 120),
            )
            rewards["daemonXp"] = daemon_gain["xp"]
            rewards["daemonLevel"] = daemon_gain["level"]
            rewards["daemonLevelUp"] = daemon_gain["levelUp"]

            card_drop = self._grant_attempt_card(state, score, accuracy)
            if card_drop:
                rewards["cardDrops"].append(card_drop)

            threat = state.threats.get(attempt["threatId"])
            if threat:
                threat["status"] = "neutralized"
                threat["resolvedAt"] = iso(utc_now())
                map_delta = self._mark_object_protected(state, threat["objectId"])
        else:
            threat = state.threats.get(attempt["threatId"])
            if threat:
                map_delta = self._mark_object_infected(state, threat["objectId"])

        response = {
            "accepted": accepted,
            "rewards": rewards,
            "fairScoreDelta": fair_score_delta,
            "mapDelta": map_delta,
            "antiCheatFlags": flags,
        }
        attempt["finished"] = True
        attempt["response"] = deepcopy(response)
        return response

    def open_cache(self, state: PlayerState, count: int, seed: int | None = None) -> dict[str, Any]:
        count = int(count)
        if count < 1 or count > 10:
            raise GameError("bad_cache_count")
        if state.wallet["zeroKeys"] < count:
            raise GameError("not_enough_zero_keys", status=409)
        state.wallet["zeroKeys"] -= count
        rng = random.Random(seed if seed is not None else time.time_ns())
        results = open_zero_cache(self.content, state.gacha, count, rng)
        for item in results:
            self._grant_card(state, item["cardId"])
        return {"results": results, "pity": state.gacha.to_dict(), "zeroKeysLeft": state.wallet["zeroKeys"]}

    def upgrade_tool(self, state: PlayerState, tool_id: str) -> dict[str, Any]:
        if not self._tool_exists(tool_id):
            raise GameError("unknown_tool", status=404)
        tool = state.tools.get(tool_id)
        if not tool:
            raise GameError("tool_not_owned", status=404)
        current_level = int(tool.get("level") or 1)
        if current_level >= 10:
            raise GameError("tool_max_level", status=409)
        cost = self.tool_upgrade_cost(current_level)
        if int(state.wallet.get("credits", 0)) < cost:
            raise GameError("not_enough_credits", status=409)
        state.wallet["credits"] = int(state.wallet["credits"]) - cost
        tool["level"] = current_level + 1
        return {
            "tool": deepcopy(tool),
            "wallet": deepcopy(state.wallet),
            "nextUpgradeCost": self.tool_upgrade_cost(int(tool["level"])) if int(tool["level"]) < 10 else None,
            "fairScore": deepcopy(state.fair_score),
        }

    def equip_tool(self, state: PlayerState, tool_id: str, slot_index: int) -> dict[str, Any]:
        if slot_index < 1 or slot_index > 3:
            raise GameError("bad_tool_slot")
        if not self._tool_exists(tool_id):
            raise GameError("unknown_tool", status=404)
        tool = state.tools.get(tool_id)
        if not tool:
            raise GameError("tool_not_owned", status=404)

        for owned in state.tools.values():
            if int(owned.get("slotIndex") or 0) == slot_index:
                owned["equipped"] = False
                owned["slotIndex"] = None
            if owned.get("toolId") == tool_id:
                owned["equipped"] = False
                owned["slotIndex"] = None

        tool["equipped"] = True
        tool["slotIndex"] = slot_index
        return {
            "tool": deepcopy(tool),
            "tools": list(deepcopy(state.tools).values()),
        }

    def tool_upgrade_cost(self, current_level: int) -> int:
        return 120 * int(current_level) * int(current_level)

    def create_invoice(self, state: PlayerState, product_id: str) -> dict[str, Any]:
        product = get_product(product_id)
        if not product:
            raise GameError("unknown_product", status=404)
        payload = f"zdnet:{state.player['id']}:{product_id}:{uuid.uuid4().hex}"
        payment = {
            "id": str(uuid.uuid4()),
            "productId": product_id,
            "title": product["title"],
            "description": product["description"],
            "amount": product["amount"],
            "amountMinor": product["amount"],
            "currency": product["currency"],
            "status": "created",
            "invoicePayload": payload,
            "grant": product["grant"],
            "createdAt": iso(utc_now()),
            "grantedAt": None,
            "telegramPaymentChargeId": None,
            "providerPaymentChargeId": None,
        }
        state.payments.append(payment)
        return {
            "invoiceUrl": None,
            "payload": payload,
            "payment": payment,
            "demoMode": False,
        }

    def payment_history(self, state: PlayerState) -> dict[str, Any]:
        return {"payments": deepcopy(state.payments)}

    def _tool_exists(self, tool_id: str) -> bool:
        return any(tool.get("id") == tool_id for tool in self.content.get("tools", []))

    def validate_payment(self, payload: str, amount: int | None = None, currency: str | None = None) -> tuple[bool, str]:
        found = self._find_payment_by_payload(payload)
        if not found:
            return False, "payment_not_found"
        _, payment = found
        if payment.get("status") not in {"created", "paid"}:
            return False, f"bad_payment_status:{payment.get('status')}"
        if amount is not None and int(payment.get("amount") or payment.get("amountMinor") or 0) != int(amount):
            return False, "amount_mismatch"
        if currency is not None and str(payment.get("currency") or "") != str(currency):
            return False, "currency_mismatch"
        return True, "ok"

    def grant_payment(
        self,
        payload: str,
        *,
        telegram_payment_charge_id: str | None = None,
        provider_payment_charge_id: str | None = None,
        raw: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        found = self._find_payment_by_payload(payload)
        if not found:
            raise GameError("payment_not_found", status=404)
        state, payment = found
        if payment.get("status") == "paid" and payment.get("grantedAt"):
            return {
                "granted": False,
                "idempotent": True,
                "payment": deepcopy(payment),
                "wallet": deepcopy(state.wallet),
                "fairScore": deepcopy(state.fair_score),
            }

        grant = apply_product_grant(state, str(payment["productId"]))
        payment["status"] = "paid"
        payment["grantedAt"] = iso(utc_now())
        payment["telegramPaymentChargeId"] = telegram_payment_charge_id
        payment["providerPaymentChargeId"] = provider_payment_charge_id
        payment["raw"] = raw or {}
        payment["appliedGrant"] = grant
        return {
            "granted": True,
            "idempotent": False,
            "payment": deepcopy(payment),
            "wallet": deepcopy(state.wallet),
            "fairScore": deepcopy(state.fair_score),
        }

    def fail_payment(self, payload: str, reason: str) -> dict[str, Any]:
        found = self._find_payment_by_payload(payload)
        if not found:
            raise GameError("payment_not_found", status=404)
        state, payment = found
        if payment.get("status") == "paid" and payment.get("grantedAt"):
            return {"changed": False, "payment": deepcopy(payment)}
        payment["status"] = "failed"
        payment["failedAt"] = iso(utc_now())
        payment["failReason"] = reason
        return {"changed": True, "payment": deepcopy(payment), "wallet": deepcopy(state.wallet)}

    def _find_payment_by_payload(self, payload: str) -> tuple[PlayerState, dict[str, Any]] | None:
        for state in self.players.values():
            for payment in state.payments:
                if payment.get("invoicePayload") == payload:
                    return state, payment
        return None

    def _spawn_initial_threats(self, state: PlayerState) -> None:
        if state.threats:
            return
        templates = self.content["threats"]
        self._spawn_threat(state, templates[0], "wifi", difficulty=3)
        self._spawn_threat(state, templates[1], "media", difficulty=2)

    def _ensure_active_threat(self, state: PlayerState) -> None:
        if any(threat["status"] == "active" for threat in state.threats.values()):
            return
        template = self.content["threats"][0]
        self._spawn_threat(state, template, "wifi", difficulty=3)

    def _spawn_threat(
        self,
        state: PlayerState,
        template: dict[str, Any],
        object_id: str,
        difficulty: int,
    ) -> dict[str, Any]:
        threat_id = str(uuid.uuid4())
        threat = {
            "id": threat_id,
            "objectId": object_id,
            "title": template["name"],
            "type": template["attackType"],
            "gameType": template["gameType"],
            "baseReward": template["baseReward"],
            "difficulty": difficulty,
            "status": "active",
            "spawnedAt": iso(utc_now()),
            "expiresAt": iso(utc_now() + timedelta(hours=24)),
        }
        state.threats[threat_id] = threat
        for obj in state.map:
            if obj["objectId"] == object_id:
                obj["state"] = "under_attack"
                obj["lastThreatAt"] = threat["spawnedAt"]
        return threat

    def _grant_attempt_card(self, state: PlayerState, score: int, accuracy: float) -> str | None:
        if accuracy < 0.75:
            return None
        rarity = "rare" if score >= 2500 else "common"
        pool = [card for card in self.content["cards"] if card["rarity"] == rarity]
        if not pool:
            return None
        card = pool[score % len(pool)]
        self._grant_card(state, card["id"])
        return card["id"]

    def _grant_daemon_xp(self, state: PlayerState, amount: int) -> dict[str, Any]:
        daemon = state.daemon
        before = max(1, min(10, int(daemon.get("level", 1) or 1)))
        daemon["xp"] = max(0, int(daemon.get("xp", 0) or 0) + int(amount))
        level = 1
        for index, threshold in enumerate(DAEMON_XP_THRESHOLDS, start=1):
            if daemon["xp"] >= threshold:
                level = index
        daemon["level"] = max(before, min(10, level))
        daemon["hungerState"] = "fed"
        daemon["lastFedAt"] = iso(utc_now())
        return {
            "xp": int(amount),
            "level": int(daemon["level"]),
            "levelUp": int(daemon["level"]) > before,
        }

    def _update_daemon_hunger(self, state: PlayerState) -> None:
        raw_last_fed = state.daemon.get("lastFedAt")
        if not raw_last_fed:
            return
        try:
            last_fed = datetime.fromisoformat(str(raw_last_fed)).astimezone(timezone.utc)
        except ValueError:
            return
        if utc_now() - last_fed > timedelta(hours=4):
            state.daemon["hungerState"] = "hungry"

    def _grant_card(self, state: PlayerState, card_id: str) -> None:
        owned = state.cards.get(card_id)
        if not owned:
            state.cards[card_id] = {
                "cardId": card_id,
                "level": 1,
                "duplicates": 0,
                "isHolo": False,
                "firstObtainedAt": iso(utc_now()),
            }
            return
        owned["duplicates"] += 1
        if owned["level"] < 4:
            needed = {1: 1, 2: 3, 3: 7}.get(owned["level"], 999)
            if owned["duplicates"] >= needed:
                owned["level"] += 1
                owned["duplicates"] = 0
                owned["isHolo"] = owned["level"] >= 4

    def _mark_object_protected(self, state: PlayerState, object_id: str) -> dict[str, Any]:
        for obj in state.map:
            if obj["objectId"] == object_id:
                obj["state"] = "protected"
                obj["protectionLevel"] = min(10, int(obj["protectionLevel"]) + 1)
                return {"objectId": object_id, "state": obj["state"], "protectionLevel": obj["protectionLevel"]}
        return {}

    def _mark_object_infected(self, state: PlayerState, object_id: str) -> dict[str, Any]:
        for obj in state.map:
            if obj["objectId"] == object_id:
                obj["state"] = "infected"
                return {"objectId": object_id, "state": obj["state"], "protectionLevel": obj["protectionLevel"]}
        return {}

    def _reset_energy_if_needed(self, state: PlayerState) -> None:
        today = utc_now().date().isoformat()
        last_reset_date = str(state.energy["lastResetAt"])[:10]
        if last_reset_date != today:
            state.energy["current"] = state.energy["dailyMax"]
            state.energy["lastResetAt"] = iso(utc_now())
            state.daily["dailyThreatDone"] = False
            state.daily["comboProgress"] = 0
