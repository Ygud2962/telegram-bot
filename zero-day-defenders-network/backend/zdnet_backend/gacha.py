from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any

from .content import cards_by_rarity


DROP_TABLE = (
    ("common", 0.60),
    ("rare", 0.25),
    ("epic", 0.12),
    ("legendary", 0.03),
)


@dataclass
class GachaState:
    rare_pity: int = 0
    epic_pity: int = 0
    legendary_pity: int = 0
    open_count: int = 0

    def to_dict(self) -> dict[str, int]:
        return {
            "rarePity": self.rare_pity,
            "epicPity": self.epic_pity,
            "legendaryPity": self.legendary_pity,
            "openCount": self.open_count,
        }


def roll_rarity(state: GachaState, rng: random.Random) -> str:
    if state.legendary_pity >= 99:
        return "legendary"
    if state.epic_pity >= 49:
        return "epic"
    if state.rare_pity >= 9:
        return "rare"

    value = rng.random()
    cursor = 0.0
    for rarity, chance in DROP_TABLE:
        cursor += chance
        if value <= cursor:
            return rarity
    return "common"


def update_pity(state: GachaState, rarity: str) -> None:
    state.open_count += 1
    state.rare_pity += 1
    state.epic_pity += 1
    state.legendary_pity += 1

    if rarity in {"rare", "epic", "legendary"}:
        state.rare_pity = 0
    if rarity in {"epic", "legendary"}:
        state.epic_pity = 0
    if rarity == "legendary":
        state.legendary_pity = 0


def open_zero_cache(
    content: dict[str, Any],
    state: GachaState,
    count: int,
    rng: random.Random | None = None,
) -> list[dict[str, str]]:
    if count < 1 or count > 10:
        raise ValueError("count must be 1..10")
    rng = rng or random.Random()
    by_rarity = cards_by_rarity(content)
    results: list[dict[str, str]] = []

    for _ in range(count):
        rarity = roll_rarity(state, rng)
        pool = by_rarity.get(rarity) or by_rarity["common"]
        card = rng.choice(pool)
        update_pity(state, rarity)
        results.append({"cardId": card["id"], "rarity": rarity, "name": card["name"]})
    return results

