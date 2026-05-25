from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .gacha import GachaState
from .repository import GameError, InMemoryGameRepository, PlayerState


SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schemas" / "database.sql"


def state_to_snapshot(state: PlayerState) -> dict[str, Any]:
    return {
        "player": state.player,
        "wallet": state.wallet,
        "energy": state.energy,
        "progression": state.progression,
        "map": state.map,
        "cards": state.cards,
        "tools": state.tools,
        "daemon": state.daemon,
        "daily": state.daily,
        "gacha": state.gacha.to_dict(),
        "fairScore": state.fair_score,
        "threats": state.threats,
        "attempts": state.attempts,
        "payments": state.payments,
    }


def snapshot_to_state(snapshot: dict[str, Any]) -> PlayerState:
    gacha = snapshot.get("gacha") or {}
    return PlayerState(
        player=dict(snapshot["player"]),
        wallet=dict(snapshot["wallet"]),
        energy=dict(snapshot["energy"]),
        progression=dict(snapshot["progression"]),
        map=list(snapshot["map"]),
        cards=dict(snapshot.get("cards") or {}),
        tools=dict(snapshot.get("tools") or {}),
        daemon=dict(snapshot["daemon"]),
        daily=dict(snapshot["daily"]),
        gacha=GachaState(
            rare_pity=int(gacha.get("rarePity") or gacha.get("rare_pity") or 0),
            epic_pity=int(gacha.get("epicPity") or gacha.get("epic_pity") or 0),
            legendary_pity=int(gacha.get("legendaryPity") or gacha.get("legendary_pity") or 0),
            open_count=int(gacha.get("openCount") or gacha.get("open_count") or 0),
        ),
        fair_score=dict(snapshot.get("fairScore") or snapshot.get("fair_score") or {"daily": 0, "weekly": 0, "season": 0}),
        threats=dict(snapshot.get("threats") or {}),
        attempts=dict(snapshot.get("attempts") or {}),
        payments=list(snapshot.get("payments") or []),
    )


class PostgresGameRepository:
    """Durable MVP repository backed by PostgreSQL snapshots.

    The game domain still runs through InMemoryGameRepository methods, but every mutation
    is persisted into zdnet.player_snapshots. This keeps the API stable while the schema
    and balance are still evolving.
    """

    def __init__(self, content: dict[str, Any], dsn: str, *, auto_migrate: bool = True):
        if not dsn:
            raise RuntimeError("Postgres storage requires DATABASE_URL or ZDNET_DATABASE_URL")
        self.content = content
        self.dsn = dsn
        self.logic = InMemoryGameRepository(content)
        self.sessions: dict[str, int] = {}
        self._psycopg2 = None
        self._json_adapter = None
        if auto_migrate:
            self.migrate()

    def _db(self):
        if self._psycopg2 is None:
            import psycopg2
            from psycopg2.extras import Json

            self._psycopg2 = psycopg2
            self._json_adapter = Json
        return self._psycopg2

    def _connect(self):
        return self._db().connect(self.dsn)

    def migrate(self) -> None:
        sql = SCHEMA_PATH.read_text(encoding="utf-8")
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)

    def get_or_create_player(self, telegram_id: int, nickname: str | None = None) -> PlayerState:
        telegram_id = int(telegram_id)
        nickname = nickname or f"rookie_{telegram_id}"
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO zdnet.players (telegram_id, nickname, username, first_name)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (telegram_id) DO UPDATE
                    SET nickname = COALESCE(EXCLUDED.nickname, zdnet.players.nickname),
                        last_seen_at = NOW()
                    RETURNING id
                    """,
                    (telegram_id, nickname, nickname, nickname),
                )
                player_id = int(cur.fetchone()[0])
                cur.execute(
                    "SELECT state_json FROM zdnet.player_snapshots WHERE player_id = %s",
                    (player_id,),
                )
                row = cur.fetchone()
                if row:
                    raw_snapshot = row[0]
                    snapshot = raw_snapshot if isinstance(raw_snapshot, dict) else json.loads(raw_snapshot)
                    state = snapshot_to_state(snapshot)
                    state.player["id"] = str(player_id)
                    state.player["telegramId"] = telegram_id
                    if nickname:
                        state.player["nickname"] = nickname
                    self._save_state_in_cursor(cur, player_id, state)
                    return state

        state = self.logic.get_or_create_player(telegram_id, nickname)
        state.player["id"] = str(player_id)
        self._save_state(player_id, state)
        return state

    def create_session(self, player_id: int) -> str:
        token = self.logic.create_session(player_id)
        self.sessions[token] = int(player_id)
        return token

    def get_by_session(self, token: str) -> PlayerState:
        player_id = self.sessions.get(token)
        if player_id is None:
            raise GameError("unauthorized", status=401)
        state = self._load_state(player_id)
        if state is None:
            raise GameError("unauthorized", status=401)
        return state

    def bootstrap(self, state: PlayerState) -> dict[str, Any]:
        result = self.logic.bootstrap(state)
        self._save_state(int(state.player["id"]), state)
        return result

    def start_attempt(self, state: PlayerState, threat_id: str) -> dict[str, Any]:
        result = self.logic.start_attempt(state, threat_id)
        self._save_state(int(state.player["id"]), state)
        return result

    def finish_attempt(self, state: PlayerState, attempt_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.logic.finish_attempt(state, attempt_id, payload)
        self._save_state(int(state.player["id"]), state)
        return result

    def open_cache(self, state: PlayerState, count: int, seed: int | None = None) -> dict[str, Any]:
        result = self.logic.open_cache(state, count, seed)
        self._save_state(int(state.player["id"]), state)
        return result

    def create_invoice(self, state: PlayerState, product_id: str) -> dict[str, Any]:
        result = self.logic.create_invoice(state, product_id)
        self._save_state(int(state.player["id"]), state)
        return result

    def payment_history(self, state: PlayerState) -> dict[str, Any]:
        return self.logic.payment_history(state)

    def _load_state(self, player_id: int) -> PlayerState | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT state_json FROM zdnet.player_snapshots WHERE player_id = %s",
                    (int(player_id),),
                )
                row = cur.fetchone()
                if not row:
                    return None
                raw_snapshot = row[0]
                snapshot = raw_snapshot if isinstance(raw_snapshot, dict) else json.loads(raw_snapshot)
                state = snapshot_to_state(snapshot)
                state.player["id"] = str(player_id)
                return state

    def _save_state(self, player_id: int, state: PlayerState) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                self._save_state_in_cursor(cur, player_id, state)

    def _save_state_in_cursor(self, cur, player_id: int, state: PlayerState) -> None:
        json_adapter = self._json_adapter
        if json_adapter is None:
            self._db()
            json_adapter = self._json_adapter
        snapshot = state_to_snapshot(state)
        cur.execute(
            """
            INSERT INTO zdnet.player_snapshots (player_id, state_json, schema_version, updated_at)
            VALUES (%s, %s, 1, NOW())
            ON CONFLICT (player_id) DO UPDATE
            SET state_json = EXCLUDED.state_json,
                schema_version = EXCLUDED.schema_version,
                updated_at = NOW()
            """,
            (int(player_id), json_adapter(snapshot)),
        )
        cur.execute(
            """
            INSERT INTO zdnet.player_wallet
                (player_id, credits, zero_keys, clean_fragments, updated_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (player_id) DO UPDATE
            SET credits = EXCLUDED.credits,
                zero_keys = EXCLUDED.zero_keys,
                clean_fragments = EXCLUDED.clean_fragments,
                updated_at = NOW()
            """,
            (
                int(player_id),
                int(state.wallet["credits"]),
                int(state.wallet["zeroKeys"]),
                int(state.wallet["cleanFragments"]),
            ),
        )
        cur.execute(
            """
            INSERT INTO zdnet.player_energy
                (player_id, current_energy, daily_max, last_reset_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (player_id) DO UPDATE
            SET current_energy = EXCLUDED.current_energy,
                daily_max = EXCLUDED.daily_max,
                last_reset_at = EXCLUDED.last_reset_at
            """,
            (
                int(player_id),
                int(state.energy["current"]),
                int(state.energy["dailyMax"]),
                state.energy["lastResetAt"],
            ),
        )
        cur.execute(
            """
            INSERT INTO zdnet.player_progress
                (player_id, soc_level, soc_xp, season_day, episode, story_mission, battle_pass_level, battle_pass_xp, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (player_id) DO UPDATE
            SET soc_level = EXCLUDED.soc_level,
                soc_xp = EXCLUDED.soc_xp,
                season_day = EXCLUDED.season_day,
                episode = EXCLUDED.episode,
                story_mission = EXCLUDED.story_mission,
                battle_pass_level = EXCLUDED.battle_pass_level,
                battle_pass_xp = EXCLUDED.battle_pass_xp,
                updated_at = NOW()
            """,
            (
                int(player_id),
                int(state.progression["socLevel"]),
                int(state.progression["socXp"]),
                int(state.progression["seasonDay"]),
                int(state.progression["episode"]),
                int(state.progression["storyMission"]),
                int(state.progression.get("battlePassLevel", 0)),
                int(state.progression.get("battlePassXp", 0)),
            ),
        )

