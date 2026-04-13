from __future__ import annotations

from typing import Iterable, TypeVar


T = TypeVar("T")


def clamp_int(value: int, *, lower: int, upper: int) -> int:
    return min(upper, max(lower, value))


def take_first(items: Iterable[T], *, limit: int) -> list[T]:
    result: list[T] = []
    for item in items:
        result.append(item)
        if len(result) >= limit:
            break
    return result


def build_weighted_ranking_score(
    *,
    quality_score: float,
    match_score: int,
    match_weight: int,
    additive_score: float = 0.0,
) -> float:
    return round(quality_score * 10 + additive_score + match_score * match_weight, 2)
