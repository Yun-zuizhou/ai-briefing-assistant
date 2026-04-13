from __future__ import annotations

import re
from collections import Counter


_SYSTEM_NOISE_EXACT = {
    "D1",
    "验证",
    "测试",
    "纠偏",
    "日常",
    "联调",
    "验收",
    "主路径",
    "debug",
    "DEBUG",
}

_SYSTEM_NOISE_PATTERNS = (
    re.compile(r"^D1验证\d{6,}$", re.IGNORECASE),
    re.compile(r"^(验证|测试)\d{6,}$"),
)

_PROFILE_TOPIC_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("AI", ("ai", "openai", "gpt", "大模型", "模型", "prompt", "提示词", "智能")),
    ("写作", ("写作", "征稿", "博客", "文案", "内容创作", "创作")),
    ("远程工作", ("远程", "remote")),
    ("职场技能", ("职场", "求职", "简历", "面试", "岗位", "运营", "就业")),
    ("技术开发", ("前端", "后端", "react", "go", "算法", "工程师", "开发")),
    ("学习研究", ("学习", "研究", "论文", "方法论", "指南", "教程")),
    ("产品思维", ("产品", "用户", "增长")),
]


def _normalize_keyword(value: str | None) -> str:
    return str(value or "").strip()


def _is_system_noise(value: str) -> bool:
    if not value:
        return True
    if value in _SYSTEM_NOISE_EXACT:
        return True
    return any(pattern.match(value) for pattern in _SYSTEM_NOISE_PATTERNS)


def sanitize_growth_keywords(values: list[str] | None) -> list[str]:
    normalized: list[str] = []
    for raw in values or []:
        value = _normalize_keyword(raw)
        if not value or value in normalized:
            continue
        if _is_system_noise(value):
            continue
        normalized.append(value)
    return normalized


def _score_profile_topics(texts: list[str]) -> list[str]:
    counter: Counter[str] = Counter()
    for text in texts:
        lowered = text.lower()
        for label, patterns in _PROFILE_TOPIC_PATTERNS:
            if any(pattern.lower() in lowered for pattern in patterns):
                counter[label] += 1
    return [
        label
        for label, _ in counter.most_common()
    ]


def build_growth_keywords(
    *,
    active_interests: list[str] | None,
    note_tags: list[str] | None = None,
    note_contents: list[str] | None = None,
    favorite_titles: list[str] | None = None,
) -> list[str]:
    cleaned_interests = sanitize_growth_keywords(active_interests)
    cleaned_tags = sanitize_growth_keywords(note_tags)
    texts = [
        _normalize_keyword(item)
        for item in [*(note_contents or []), *(favorite_titles or []), *cleaned_interests, *cleaned_tags]
        if _normalize_keyword(item)
    ]
    scored_topics = _score_profile_topics(texts)

    result: list[str] = []
    for value in [*cleaned_interests, *scored_topics, *cleaned_tags]:
        if value and value not in result:
            result.append(value)

    if result:
        return result[:6]
    return ["记录", "行动", "回顾"]
