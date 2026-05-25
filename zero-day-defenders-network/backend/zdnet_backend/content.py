from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


CONTENT_PATH = Path(__file__).resolve().parents[1] / "data" / "seed_content.json"


@lru_cache(maxsize=1)
def load_content() -> dict[str, Any]:
    with CONTENT_PATH.open("r", encoding="utf-8") as fh:
        content = json.load(fh)
    _validate_content(content)
    return content


def _validate_content(content: dict[str, Any]) -> None:
    required = ("version", "mapObjects", "cards", "tools", "threats")
    missing = [key for key in required if key not in content]
    if missing:
        raise ValueError(f"seed content missing keys: {missing}")
    card_ids = [card["id"] for card in content["cards"]]
    if len(card_ids) != len(set(card_ids)):
        raise ValueError("duplicate card ids in seed content")
    tool_ids = [tool["id"] for tool in content["tools"]]
    if len(tool_ids) != len(set(tool_ids)):
        raise ValueError("duplicate tool ids in seed content")


def cards_by_rarity(content: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {
        "common": [],
        "rare": [],
        "epic": [],
        "legendary": [],
    }
    for card in content["cards"]:
        rarity = str(card.get("rarity", "common")).lower()
        result.setdefault(rarity, []).append(card)
    return result

