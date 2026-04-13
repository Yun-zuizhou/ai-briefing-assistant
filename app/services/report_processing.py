from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Iterable

from app.services.processing_common import clamp_int, take_first


@dataclass(slots=True)
class ReportTrendMetrics:
    current_heat: int
    previous_heat: int
    change: int
    trend: str
    discussion_count: int
    user_participation: int
    favorite_hits: int


__all__ = [
    "ReportTrendMetrics",
    "build_report_trend_candidates",
    "calculate_report_trend_metrics",
    "build_report_attention_change_payload",
    "build_report_trend_insights",
    "build_report_fallback_insights",
]


def build_report_trend_candidates(
    interests: list[str],
    note_tags: Iterable[str],
    *,
    limit: int = 3,
) -> list[str]:
    candidates = [interest for interest in interests if str(interest).strip()][:limit]
    if candidates:
        return candidates

    tag_counter: Counter[str] = Counter()
    for tag in note_tags:
        if tag:
            tag_counter[str(tag)] += 1
    return [item[0] for item in take_first(tag_counter.most_common(limit), limit=limit)]


def calculate_report_trend_metrics(
    *,
    interest: str,
    note_texts: list[str],
    favorite_titles: list[str],
    history_titles: list[str],
    fallback_index: int,
) -> ReportTrendMetrics:
    discussion_count = sum(1 for text in note_texts if interest in text) + sum(
        1 for text in history_titles if interest in text
    )
    user_participation = sum(1 for text in note_texts if interest in text)
    favorite_hits = sum(1 for text in favorite_titles if interest in text)
    current_heat = clamp_int(discussion_count * 18 + favorite_hits * 12 + 22, lower=18, upper=100)
    previous_heat = max(10, current_heat - (8 + fallback_index * 3))
    change = current_heat - previous_heat
    trend = "up" if change > 0 else "stable" if change == 0 else "down"
    return ReportTrendMetrics(
        current_heat=current_heat,
        previous_heat=previous_heat,
        change=change,
        trend=trend,
        discussion_count=discussion_count,
        user_participation=user_participation,
        favorite_hits=favorite_hits,
    )


def build_report_attention_change_payload(
    *,
    favorite_hits: int,
    user_participation: int,
    new_topics: list[str],
) -> tuple[int, list[str]]:
    return (
        clamp_int(10 + favorite_hits * 5 + user_participation * 4, lower=6, upper=35),
        take_first(new_topics, limit=2),
    )


def build_report_trend_insights(*, title: str, period_label: str) -> list[str]:
    return [
        f"{title} 在{period_label}内不再只是浏览主题，已经开始进入你的记录与收藏。",
        f"当前与 {title} 相关的内容主要来自真实笔记、历史痕迹与收藏行为聚合。",
        f"后续若接入统一内容层，{title} 的热点解释和内容来源还可以进一步真实化。",
    ]


def build_report_fallback_insights() -> list[str]:
    return [
        "当前报告已经切到真实接口过渡态。",
        "趋势标题与热点解释仍是聚合生成，不是最终正式内容层。",
    ]
