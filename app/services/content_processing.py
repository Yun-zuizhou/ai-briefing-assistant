from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from app.api.v1.page_schemas import RelatedContentItem
from app.services.processing_common import build_weighted_ranking_score


@dataclass(slots=True)
class RankedMatch:
    item: Any
    match_score: int
    ranking_score: float


@dataclass(slots=True)
class RelatedCandidate:
    matched_count: int
    quality_score: float
    item: RelatedContentItem


@dataclass(slots=True)
class RelatedMatchInput:
    candidate_values: list[str]
    quality_score: float
    item: RelatedContentItem


__all__ = [
    "RankedMatch",
    "RelatedCandidate",
    "RelatedMatchInput",
    "normalize_text_values",
    "contains_interest",
    "match_interest_score",
    "build_topic_ranking_score",
    "build_opportunity_ranking_score",
    "build_worth_knowing_ranking_score",
    "build_worth_acting_ranking_score",
    "rank_interest_matches",
    "shared_keyword_count",
    "dedupe_related_candidates",
    "collect_related_candidates",
]


def normalize_text_values(*values: object) -> list[str]:
    normalized: list[str] = []
    for value in values:
        if isinstance(value, list):
            normalized.extend(normalize_text_values(*value))
            continue
        if value is None:
            continue
        text = str(value).strip()
        if text:
            normalized.append(text)
    return normalized


def contains_interest(values: list[str], interest: str) -> bool:
    interest_lower = interest.lower()
    return any(interest_lower in value.lower() for value in values if value)


def match_interest_score(values: list[str], interests: list[str]) -> int:
    score = 0
    lowered_values = [value.lower() for value in values if value]
    for interest in interests:
        interest_lower = interest.lower()
        if any(interest_lower in value for value in lowered_values):
            score += 1
    return score


def build_topic_ranking_score(*, quality_score: float, hot_value: float, match_score: int) -> float:
    return build_weighted_ranking_score(
        quality_score=quality_score,
        match_score=match_score,
        match_weight=25,
        additive_score=hot_value,
    )


def build_opportunity_ranking_score(*, quality_score: float, match_score: int) -> float:
    return build_weighted_ranking_score(
        quality_score=quality_score,
        match_score=match_score,
        match_weight=30,
    )


def build_worth_knowing_ranking_score(*, quality_score: float, hot_value: float, match_score: int) -> float:
    return build_weighted_ranking_score(
        quality_score=quality_score,
        match_score=match_score,
        match_weight=20,
        additive_score=hot_value,
    )


def build_worth_acting_ranking_score(*, quality_score: float, match_score: int) -> float:
    return build_weighted_ranking_score(
        quality_score=quality_score,
        match_score=match_score,
        match_weight=25,
    )


def rank_interest_matches(
    items: Iterable[Any],
    *,
    interest: str,
    values_getter,
    ranking_getter,
) -> list[RankedMatch]:
    matched_items: list[RankedMatch] = []
    for item in items:
        values = values_getter(item)
        if contains_interest(values, interest):
            match_score = match_interest_score(values, [interest])
            ranking_score = ranking_getter(item, match_score)
            matched_items.append(
                RankedMatch(
                    item=item,
                    match_score=match_score,
                    ranking_score=ranking_score,
                )
            )
    matched_items.sort(key=lambda item: item.ranking_score, reverse=True)
    return matched_items


def shared_keyword_count(seed_values: list[str], candidate_values: list[str]) -> int:
    seed_terms = {value.lower() for value in seed_values if value}
    candidate_terms = {value.lower() for value in candidate_values if value}
    return len(seed_terms & candidate_terms)


def dedupe_related_candidates(
    candidates: list[RelatedCandidate],
    *,
    limit: int = 3,
) -> list[RelatedContentItem]:
    candidates.sort(key=lambda item: (item.matched_count, item.quality_score), reverse=True)
    deduped: list[RelatedContentItem] = []
    seen_refs: set[str] = set()
    for candidate in candidates:
        if candidate.item.content_ref in seen_refs:
            continue
        seen_refs.add(candidate.item.content_ref)
        deduped.append(candidate.item)
        if len(deduped) >= limit:
            break
    return deduped


def collect_related_candidates(
    seed_values: list[str],
    inputs: Iterable[RelatedMatchInput],
) -> list[RelatedCandidate]:
    candidates: list[RelatedCandidate] = []
    for candidate in inputs:
        matched_count = shared_keyword_count(seed_values, candidate.candidate_values)
        if matched_count <= 0:
            continue
        candidates.append(
            RelatedCandidate(
                matched_count=matched_count,
                quality_score=candidate.quality_score,
                item=candidate.item,
            )
        )
    return candidates
