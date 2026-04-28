from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from bs4 import BeautifulSoup
from dateutil import parser as date_parser
from loguru import logger

from app.crawler.rss_parser import RSSParser
from app.crawler.sources.rss_sources import RSSCategory, RSSSourceConfig


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROFILE_DIR = ROOT / "tools" / "config" / "collection_profiles"


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _normalize_keyword(value: str) -> str:
    return _normalize_text(value).lower()


def _strip_html(value: str) -> str:
    if not value:
        return ""
    return _normalize_text(BeautifulSoup(value, "html.parser").get_text(" "))


def _truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[: max(limit - 1, 0)].rstrip() + "…"


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    try:
        parsed = date_parser.parse(str(value))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    except Exception:
        return None


def _safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "item"


@dataclass(slots=True)
class CollectionSource:
    source_id: str
    name: str
    type: str
    url: str
    category: str
    tags: list[str] = field(default_factory=list)
    enabled: bool = True
    trust_weight: int = 70
    fetch_interval: int = 60
    query: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class CollectionProfile:
    profile_id: str
    name: str
    description: str
    keyword_whitelist: list[str]
    keyword_blacklist: list[str]
    top_n_candidates: int
    top_n_summary: int
    max_consult_context_items: int
    prompt_version: str
    sources: list[CollectionSource]


@dataclass(slots=True)
class CollectedCandidate:
    candidate_id: str
    profile_id: str
    source_id: str
    source_name: str
    source_type: str
    title: str
    summary: str
    url: str
    published_at: str | None
    raw_tags: list[str]
    raw_signal: dict[str, Any]
    score_breakdown: dict[str, float] = field(default_factory=dict)
    total_score: float = 0.0

    @property
    def dedupe_key(self) -> str:
        return f"{_normalize_keyword(self.url)}|{_normalize_keyword(self.title)}"


def load_collection_profile(profile_name_or_path: str) -> CollectionProfile:
    profile_path = Path(profile_name_or_path)
    if not profile_path.exists():
        profile_path = DEFAULT_PROFILE_DIR / f"{profile_name_or_path}.json"
    if not profile_path.exists():
        raise FileNotFoundError(f"未找到 collection profile: {profile_name_or_path}")

    payload = json.loads(profile_path.read_text(encoding="utf-8"))
    sources: list[CollectionSource] = []
    for item in payload.get("sources", []):
        if not isinstance(item, dict):
            continue
        sources.append(
            CollectionSource(
                source_id=_normalize_text(item.get("source_id")),
                name=_normalize_text(item.get("name")),
                type=_normalize_text(item.get("type")) or "rss",
                url=_normalize_text(item.get("url")),
                category=_normalize_text(item.get("category")) or "ai_tech",
                tags=[_normalize_text(tag) for tag in item.get("tags", []) if _normalize_text(tag)],
                enabled=bool(item.get("enabled", True)),
                trust_weight=int(item.get("trust_weight", 70)),
                fetch_interval=int(item.get("fetch_interval", 60)),
                query=item.get("query") if isinstance(item.get("query"), dict) else {},
            )
        )

    return CollectionProfile(
        profile_id=_normalize_text(payload.get("profile_id")),
        name=_normalize_text(payload.get("name")),
        description=_normalize_text(payload.get("description")),
        keyword_whitelist=[_normalize_text(item) for item in payload.get("keyword_whitelist", []) if _normalize_text(item)],
        keyword_blacklist=[_normalize_text(item) for item in payload.get("keyword_blacklist", []) if _normalize_text(item)],
        top_n_candidates=int(payload.get("top_n_candidates", 30)),
        top_n_summary=int(payload.get("top_n_summary", 8)),
        max_consult_context_items=int(payload.get("max_consult_context_items", 3)),
        prompt_version=_normalize_text(payload.get("prompt_version")) or "ai-daily-v1",
        sources=sources,
    )


def _build_rss_source_config(source: CollectionSource) -> RSSSourceConfig:
    try:
        category = RSSCategory(source.category)
    except ValueError:
        category = RSSCategory.AI_TECH

    return RSSSourceConfig(
        name=source.name,
        url=source.url,
        category=category,
        tags=source.tags,
        enabled=source.enabled,
        description=f"阶段十六 profile 来源：{source.source_id}",
        fetch_interval=source.fetch_interval,
    )


def _parse_json_array(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [_normalize_text(item) for item in raw if _normalize_text(item)]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [_normalize_text(item) for item in parsed if _normalize_text(item)]
        except json.JSONDecodeError:
            return [_normalize_text(raw)] if _normalize_text(raw) else []
    return []


def _build_opportunity_query(source: CollectionSource) -> tuple[str, list[Any]]:
    sql = """
        SELECT
            id, title, summary, content, source, source_url, published_at, deadline,
            type, status, is_remote, tags, quality_score
        FROM opportunities
        WHERE lower(status) = 'active'
    """
    params: list[Any] = []
    query = source.query

    if bool(query.get("is_remote")):
        sql += " AND is_remote = 1"

    types_any = [_normalize_text(item).lower() for item in query.get("types_any", []) if _normalize_text(item)]
    if types_any:
        placeholders = ", ".join(["?"] * len(types_any))
        sql += f" AND lower(type) IN ({placeholders})"
        params.extend(types_any)

    text_match_clauses: list[str] = []

    tags_any = [_normalize_text(item) for item in query.get("tags_any", []) if _normalize_text(item)]
    if tags_any:
        text_match_clauses.append("(" + " OR ".join(["tags LIKE ?"] * len(tags_any)) + ")")
        params.extend([f"%{tag}%" for tag in tags_any])

    keywords_any = [_normalize_text(item).lower() for item in query.get("keywords_any", []) if _normalize_text(item)]
    if keywords_any:
        keyword_blocks: list[str] = []
        for keyword in keywords_any:
            keyword_blocks.append(
                "("
                "lower(title) LIKE ? OR "
                "lower(COALESCE(summary, '')) LIKE ? OR "
                "lower(COALESCE(content, '')) LIKE ? OR "
                "lower(COALESCE(source, '')) LIKE ?"
                ")"
            )
            like_value = f"%{keyword}%"
            params.extend([like_value, like_value, like_value, like_value])
        text_match_clauses.append("(" + " OR ".join(keyword_blocks) + ")")

    if text_match_clauses:
        sql += f" AND ({' OR '.join(text_match_clauses)})"

    sql += " ORDER BY quality_score DESC, deadline ASC NULLS LAST, id DESC LIMIT ?"
    params.append(int(query.get("limit", 30)))
    return sql, params


def _collect_opportunity_candidates(
    profile: CollectionProfile,
    source: CollectionSource,
    rows: list[dict[str, Any]],
) -> list[CollectedCandidate]:
    candidates: list[CollectedCandidate] = []
    for row in rows:
        row_id = row.get("id")
        title = _normalize_text(row.get("title"))
        if row_id is None or not title:
            continue

        summary = _normalize_text(row.get("summary")) or _truncate(_normalize_text(row.get("content")), 280)
        url = _normalize_text(row.get("source_url"))
        if not url:
            continue

        raw_tags = _parse_json_array(row.get("tags"))
        published_at = _parse_datetime(row.get("published_at"))
        published_at_iso = published_at.isoformat() if published_at else None

        candidates.append(
            CollectedCandidate(
                candidate_id=f"{source.source_id}:{row_id}:{_safe_slug(title)[:48]}",
                profile_id=profile.profile_id,
                source_id=source.source_id,
                source_name=_normalize_text(row.get("source")) or source.name,
                source_type=source.type,
                title=title,
                summary=summary,
                url=url,
                published_at=published_at_iso,
                raw_tags=raw_tags,
                raw_signal={
                    "source_id": source.source_id,
                    "source_name": source.name,
                    "category": source.category,
                    "trust_weight": source.trust_weight,
                    "opportunity_id": row_id,
                    "opportunity_type": row.get("type"),
                    "is_remote": row.get("is_remote"),
                    "deadline": row.get("deadline"),
                    "tags": raw_tags,
                },
            )
        )
    return candidates


async def collect_profile_candidates(
    profile: CollectionProfile,
    *,
    d1_client=None,
) -> tuple[list[CollectedCandidate], list[dict[str, Any]]]:
    candidates: list[CollectedCandidate] = []
    errors: list[dict[str, Any]] = []

    for source in profile.sources:
        if not source.enabled:
            continue

        if source.type == "opportunity_query":
            if d1_client is None:
                errors.append(
                    {
                        "source_id": source.source_id,
                        "type": "missing_d1_client",
                        "message": "opportunity_query source requires d1_client",
                    }
                )
                continue
            try:
                sql, params = _build_opportunity_query(source)
                rows = d1_client.query(sql, params)
                candidates.extend(_collect_opportunity_candidates(profile, source, rows))
            except Exception as error:
                logger.warning(f"机会查询源执行失败: {source.source_id} | {error}")
                errors.append(
                    {
                        "source_id": source.source_id,
                        "type": "opportunity_query_error",
                        "message": str(error),
                    }
                )
            continue

        if source.type != "rss":
            logger.warning(f"阶段十六首版暂未实现 {source.type} source，已跳过: {source.source_id}")
            errors.append(
                {
                    "source_id": source.source_id,
                    "type": "unsupported_source_type",
                    "message": f"unsupported source type: {source.type}",
                }
            )
            continue

        config = _build_rss_source_config(source)
        async with RSSParser(config) as parser:
            result = await parser.run()

        for error in result.get("errors", []):
            errors.append(
                {
                    "source_id": source.source_id,
                    "type": error.get("type", "rss_error"),
                    "message": error.get("message", "unknown rss error"),
                }
            )

        for index, article in enumerate(result.get("articles", []), start=1):
            title = _normalize_text(article.get("title"))
            summary = _strip_html(article.get("summary", ""))
            url = _normalize_text(article.get("source_url"))
            if not title or not url:
                continue
            published_at = _parse_datetime(article.get("publish_time"))
            published_at_iso = published_at.isoformat() if published_at else None
            raw_tags = [
                _normalize_text(tag)
                for tag in article.get("tags", [])
                if _normalize_text(tag)
            ]
            candidates.append(
                CollectedCandidate(
                    candidate_id=f"{source.source_id}:{index}:{_safe_slug(title)[:48]}",
                    profile_id=profile.profile_id,
                    source_id=source.source_id,
                    source_name=source.name,
                    source_type=source.type,
                    title=title,
                    summary=summary,
                    url=url,
                    published_at=published_at_iso,
                    raw_tags=raw_tags,
                    raw_signal={
                        "source_id": source.source_id,
                        "source_name": source.name,
                        "category": source.category,
                        "tags": raw_tags,
                        "trust_weight": source.trust_weight,
                    },
                )
            )

    return candidates, errors


def _keyword_match_count(candidate: CollectedCandidate, keywords: list[str]) -> int:
    haystack = " ".join(
        [
            candidate.title,
            candidate.summary,
            " ".join(candidate.raw_tags),
            candidate.source_name,
        ]
    ).lower()
    return sum(1 for keyword in keywords if keyword.lower() in haystack)


def _freshness_score(published_at: str | None) -> float:
    if not published_at:
        return 30.0
    parsed = _parse_datetime(published_at)
    if not parsed:
        return 30.0
    delta_hours = max((datetime.now(UTC) - parsed).total_seconds() / 3600.0, 0.0)
    if delta_hours <= 6:
        return 100.0
    if delta_hours <= 24:
        return 85.0
    if delta_hours <= 72:
        return 60.0
    if delta_hours <= 168:
        return 35.0
    return 15.0


def score_profile_candidates(profile: CollectionProfile, candidates: list[CollectedCandidate]) -> list[CollectedCandidate]:
    trust_weight_by_source = {item.source_id: float(item.trust_weight) for item in profile.sources}
    whitelist = profile.keyword_whitelist
    blacklist = profile.keyword_blacklist
    scored: list[CollectedCandidate] = []

    for candidate in candidates:
        blacklist_hits = _keyword_match_count(candidate, blacklist)
        if blacklist_hits > 0:
            continue

        whitelist_hits = _keyword_match_count(candidate, whitelist)
        if whitelist and whitelist_hits <= 0:
            continue

        trust_score = trust_weight_by_source.get(candidate.source_id, 50.0)
        keyword_score = min(100.0, whitelist_hits * 18.0)
        freshness = _freshness_score(candidate.published_at)
        signal_bonus = 12.0 if "官方" in candidate.source_name or "OpenAI" in candidate.source_name else 0.0
        total_score = trust_score * 0.4 + keyword_score * 0.25 + freshness * 0.2 + signal_bonus * 0.15

        candidate.score_breakdown = {
            "trust_score": round(trust_score, 2),
            "keyword_score": round(keyword_score, 2),
            "freshness_score": round(freshness, 2),
            "signal_bonus": round(signal_bonus, 2),
            "blacklist_hits": float(blacklist_hits),
            "whitelist_hits": float(whitelist_hits),
        }
        candidate.total_score = round(total_score, 2)
        scored.append(candidate)

    deduped: dict[str, CollectedCandidate] = {}
    for candidate in sorted(scored, key=lambda item: item.total_score, reverse=True):
        existing = deduped.get(candidate.dedupe_key)
        if existing is None or candidate.total_score > existing.total_score:
            deduped[candidate.dedupe_key] = candidate

    return sorted(deduped.values(), key=lambda item: item.total_score, reverse=True)[: profile.top_n_candidates]


def select_summary_candidates(profile: CollectionProfile, candidates: list[CollectedCandidate]) -> list[CollectedCandidate]:
    return candidates[: profile.top_n_summary]


async def fetch_url_excerpt(url: str, *, limit: int = 4000) -> str:
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as error:
        logger.warning(f"抓取正文失败，已回退到摘要文本: {url} | {error}")
        return ""

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    article = soup.find("article")
    if article:
        text = article.get_text(" ", strip=True)
    else:
        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        text = " ".join(item for item in paragraphs if item)

    return _truncate(_normalize_text(text), limit)


def build_result_ref(profile: CollectionProfile, candidate: CollectedCandidate) -> str:
    title_part = _safe_slug(candidate.title)[:32]
    return f"summary:{profile.profile_id}:{candidate.source_id}:{title_part}"


def build_collection_manifest(profile: CollectionProfile, candidates: list[CollectedCandidate]) -> dict[str, Any]:
    return {
        "profile_id": profile.profile_id,
        "prompt_version": profile.prompt_version,
        "generated_at": datetime.now(UTC).isoformat(),
        "total": len(candidates),
        "items": [
            {
                "candidate_id": item.candidate_id,
                "source_id": item.source_id,
                "source_name": item.source_name,
                "source_type": item.source_type,
                "title": item.title,
                "summary": item.summary,
                "url": item.url,
                "published_at": item.published_at,
                "raw_tags": item.raw_tags,
                "score_breakdown": item.score_breakdown,
                "total_score": item.total_score,
                "result_ref": build_result_ref(profile, item),
            }
            for item in candidates
        ],
    }


def extract_provider_text(result: dict[str, Any]) -> str:
    if "choices" in result and result["choices"]:
        return _normalize_text(result["choices"][0].get("message", {}).get("content", ""))
    if "content" in result and result["content"]:
        first = result["content"][0]
        if isinstance(first, dict):
            return _normalize_text(first.get("text", ""))
    if "candidates" in result and result["candidates"]:
        parts = result["candidates"][0].get("content", {}).get("parts", [])
        if parts:
            return _normalize_text(parts[0].get("text", ""))
    if "message" in result and isinstance(result["message"], dict):
        return _normalize_text(result["message"].get("content", ""))
    if "response" in result:
        return _normalize_text(result["response"])
    return ""


def parse_model_json_payload(text: str) -> dict[str, Any]:
    normalized = _normalize_text(text)
    if not normalized:
        raise ValueError("模型返回为空")

    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", normalized, flags=re.DOTALL)
    if fenced_match:
        normalized = fenced_match.group(1).strip()

    start = normalized.find("{")
    end = normalized.rfind("}")
    if start >= 0 and end > start:
        normalized = normalized[start : end + 1]

    payload = json.loads(normalized)
    if not isinstance(payload, dict):
        raise ValueError("模型返回不是 JSON 对象")
    return payload
