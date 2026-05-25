from __future__ import annotations

from dataclasses import dataclass
from typing import Any


GAME_LIMITS = {
    "packet_rain": {"min_ms": 5_000, "max_ms": 60_000, "max_score_per_sec": 550},
    "phishing_stream": {"min_ms": 5_000, "max_ms": 90_000, "max_score_per_sec": 420},
    "crypto_lock": {"min_ms": 3_000, "max_ms": 120_000, "max_score_per_sec": 300},
}


@dataclass(frozen=True)
class RewardResult:
    credits: int
    soc_xp: int
    fair_score_delta: int
    paid_bonus_credits: int = 0


def validate_attempt_summary(
    game_type: str,
    duration_ms: int,
    score: int,
    accuracy: float,
    combo_max: int,
    input_summary: dict[str, Any] | None = None,
) -> list[str]:
    flags: list[str] = []
    limits = GAME_LIMITS.get(game_type)
    if limits is None:
        flags.append("unknown_game_type")
        return flags

    if duration_ms < limits["min_ms"]:
        flags.append("duration_too_short")
    if duration_ms > limits["max_ms"]:
        flags.append("duration_too_long")
    if score < 0:
        flags.append("negative_score")
    seconds = max(1.0, duration_ms / 1000)
    if score / seconds > limits["max_score_per_sec"]:
        flags.append("score_rate_too_high")
    if not (0 <= accuracy <= 1):
        flags.append("bad_accuracy")
    if combo_max < 0:
        flags.append("bad_combo")
    if input_summary is not None and len(str(input_summary)) > 2000:
        flags.append("input_summary_too_large")
    return flags


def calculate_rewards(
    *,
    base_reward: int,
    difficulty: int,
    score: int,
    accuracy: float,
    combo_max: int,
    paid_multiplier: float = 1.0,
) -> RewardResult:
    difficulty_multiplier = 1.0 + max(0, min(difficulty, 10) - 1) * 0.12
    accuracy_multiplier = 0.5 + max(0.0, min(accuracy, 1.0)) * 0.8
    combo_multiplier = 1.0 + min(max(combo_max, 0), 30) * 0.015
    score_bonus = min(max(score, 0) // 120, base_reward)

    fair_credits = int(
        (base_reward + score_bonus)
        * difficulty_multiplier
        * accuracy_multiplier
        * combo_multiplier
    )
    personal_credits = int(fair_credits * max(1.0, paid_multiplier))
    soc_xp = max(5, int(fair_credits * 0.24))
    fair_score_delta = int(score * max(0.0, min(accuracy, 1.0)) / 100)
    return RewardResult(
        credits=personal_credits,
        soc_xp=soc_xp,
        fair_score_delta=fair_score_delta,
        paid_bonus_credits=personal_credits - fair_credits,
    )

