from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any


PRODUCT_CATALOG: dict[str, dict[str, Any]] = {
    "zero_keys_10": {
        "title": "10 Ключей Зеро",
        "description": "10 открытий тайников ZERO_DAY. Не влияет на fair score.",
        "currency": "XTR",
        "amount": 99,
        "grant": {"zeroKeys": 10},
    },
    "zero_keys_55": {
        "title": "55 Ключей Зеро",
        "description": "55 открытий тайников ZERO_DAY. Бонус за набор, без влияния на рейтинг.",
        "currency": "XTR",
        "amount": 499,
        "grant": {"zeroKeys": 55},
    },
    "zero_keys_120": {
        "title": "120 Ключей Зеро",
        "description": "120 открытий тайников ZERO_DAY для коллекции. Fair score остается честным.",
        "currency": "XTR",
        "amount": 990,
        "grant": {"zeroKeys": 120},
    },
    "clean_fragments_5": {
        "title": "5 Чистых фрагментов",
        "description": "Материал для кастомных карточек.",
        "currency": "XTR",
        "amount": 100,
        "grant": {"cleanFragments": 5},
    },
    "clean_fragments_30": {
        "title": "30 Чистых фрагментов",
        "description": "Материал для кастомных карточек и коллекционирования.",
        "currency": "XTR",
        "amount": 500,
        "grant": {"cleanFragments": 30},
    },
    "spinner_extra": {
        "title": "Дополнительный спин",
        "description": "Один дополнительный спин Daily Zero Spinner.",
        "currency": "XTR",
        "amount": 50,
        "grant": {"extraSpins": 1},
    },
    "soc_elite_monthly": {
        "title": "SOC ELITE на 30 дней",
        "description": "Косметика и удобство. Платные множители не входят в fair score.",
        "currency": "XTR",
        "amount": 299,
        "grant": {"socEliteDays": 30},
    },
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def get_product(product_id: str) -> dict[str, Any] | None:
    product = PRODUCT_CATALOG.get(product_id)
    return deepcopy(product) if product else None


def public_catalog() -> list[dict[str, Any]]:
    return [
        {
            "productId": product_id,
            "title": product["title"],
            "description": product["description"],
            "currency": product["currency"],
            "amount": product["amount"],
            "grant": deepcopy(product["grant"]),
            "fairScoreImpact": 0,
        }
        for product_id, product in PRODUCT_CATALOG.items()
    ]


def apply_product_grant(state: Any, product_id: str) -> dict[str, Any]:
    product = PRODUCT_CATALOG.get(product_id)
    if not product:
        raise ValueError(f"unknown product: {product_id}")
    grant = deepcopy(product["grant"])

    if grant.get("zeroKeys"):
        state.wallet["zeroKeys"] = int(state.wallet.get("zeroKeys", 0)) + int(grant["zeroKeys"])
    if grant.get("cleanFragments"):
        state.wallet["cleanFragments"] = int(state.wallet.get("cleanFragments", 0)) + int(grant["cleanFragments"])
    if grant.get("extraSpins"):
        state.daily["extraSpins"] = int(state.daily.get("extraSpins", 0)) + int(grant["extraSpins"])
    if grant.get("socEliteDays"):
        current_raw = state.player.get("socEliteUntil")
        base = utc_now()
        if current_raw:
            try:
                parsed = datetime.fromisoformat(str(current_raw))
                if parsed > base:
                    base = parsed
            except Exception:
                base = utc_now()
        state.player["socEliteUntil"] = iso(base + timedelta(days=int(grant["socEliteDays"])))

    # Explicit invariant: paid grants never touch fair_score.
    return grant
