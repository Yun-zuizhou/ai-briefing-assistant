from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MAPPING_FILE = ROOT / "tools" / "config" / "collection_profiles" / "interest_template_mapping.json"


def _normalize_text(value: str | None) -> str:
    return str(value or "").strip()


def _normalize_keyword(value: str | None) -> str:
    return _normalize_text(value).lower()


@dataclass(slots=True)
class InterestTemplateRule:
    rule_id: str
    match_keywords: list[str]
    template_ids: list[str]
    weight: int = 100
    reason: str = ""


@dataclass(slots=True)
class InterestTemplateMapping:
    version: str
    default_template_ids: list[str]
    rules: list[InterestTemplateRule]


@dataclass(slots=True)
class InterestTemplateResolution:
    template_id: str
    score: int
    matched_interests: list[str] = field(default_factory=list)
    matched_keywords: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)


def load_interest_template_mapping(mapping_path: str | Path | None = None) -> InterestTemplateMapping:
    target_path = Path(mapping_path) if mapping_path else DEFAULT_MAPPING_FILE
    if not target_path.exists():
        raise FileNotFoundError(f"未找到 interest template mapping 文件：{target_path}")

    payload = json.loads(target_path.read_text(encoding="utf-8"))
    rules: list[InterestTemplateRule] = []
    for item in payload.get("rules", []):
        if not isinstance(item, dict):
            continue
        template_ids = [_normalize_text(value) for value in item.get("template_ids", []) if _normalize_text(value)]
        keywords = [_normalize_text(value) for value in item.get("match_keywords", []) if _normalize_text(value)]
        if not template_ids or not keywords:
            continue
        rules.append(
            InterestTemplateRule(
                rule_id=_normalize_text(item.get("rule_id")),
                match_keywords=keywords,
                template_ids=template_ids,
                weight=int(item.get("weight", 100)),
                reason=_normalize_text(item.get("reason")),
            )
        )

    return InterestTemplateMapping(
        version=_normalize_text(payload.get("version")) or "v1",
        default_template_ids=[
            _normalize_text(value) for value in payload.get("default_template_ids", []) if _normalize_text(value)
        ],
        rules=rules,
    )


def resolve_templates_for_interests(
    interests: list[str],
    mapping: InterestTemplateMapping,
) -> tuple[list[InterestTemplateResolution], list[str]]:
    normalized_interests = [_normalize_text(value) for value in interests if _normalize_text(value)]
    resolution_map: dict[str, InterestTemplateResolution] = {}
    matched_interest_names: set[str] = set()

    for interest in normalized_interests:
        lower_interest = _normalize_keyword(interest)
        for rule in mapping.rules:
            matched_keywords = [keyword for keyword in rule.match_keywords if _normalize_keyword(keyword) in lower_interest]
            if not matched_keywords:
                continue

            matched_interest_names.add(interest)
            for template_id in rule.template_ids:
                existing = resolution_map.get(template_id)
                if existing is None:
                    existing = InterestTemplateResolution(template_id=template_id, score=0)
                    resolution_map[template_id] = existing

                existing.score += rule.weight + len(matched_keywords) * 5
                if interest not in existing.matched_interests:
                    existing.matched_interests.append(interest)
                for keyword in matched_keywords:
                    if keyword not in existing.matched_keywords:
                        existing.matched_keywords.append(keyword)
                if rule.reason and rule.reason not in existing.reasons:
                    existing.reasons.append(rule.reason)

    if not resolution_map and mapping.default_template_ids:
        for template_id in mapping.default_template_ids:
            resolution_map[template_id] = InterestTemplateResolution(
                template_id=template_id,
                score=1,
                matched_interests=[],
                matched_keywords=[],
                reasons=["fallback default template"],
            )

    unmatched_interests = [interest for interest in normalized_interests if interest not in matched_interest_names]
    resolutions = sorted(
        resolution_map.values(),
        key=lambda item: (-item.score, item.template_id),
    )
    return resolutions, unmatched_interests

