from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock
from typing import Any

from app.services.content_projection import (
    build_content_ref,
    normalize_datetime,
    normalize_label_list,
    normalize_score,
    normalize_summary,
)
from app.services.content_result_observer import content_result_observer


@dataclass(slots=True)
class ContentProcessingResult:
    source_content_ref: str
    source_content_type: str
    source_item_id: int | str
    normalized_title: str
    normalized_summary: str | None
    normalized_category_labels: list[str]
    normalized_tags: list[str]
    quality_score: float
    published_at: str | None
    processing_version: str
    processed_at: str
    is_stale: bool = False


_article_result_cache_lock = Lock()
_article_result_cache: dict[tuple[Any, ...], ContentProcessingResult] = {}


def project_article_result_payload(result: ContentProcessingResult, article: Any) -> dict[str, Any]:
    summary = result.normalized_summary or ""
    source_item_id = getattr(result, "source_item_id", None)
    if source_item_id is None:
        source_item_id = getattr(result, "source_article_id", None)
    return {
        "id": source_item_id,
        "title": result.normalized_title,
        "summary": summary,
        "source_name": getattr(article, "source_name", None),
        "source_url": getattr(article, "source_url", None),
        "author": getattr(article, "author", None),
        "category": (result.normalized_category_labels or [None])[0],
        "tags": result.normalized_tags,
        "publish_time": result.published_at,
        "processing_version": result.processing_version,
    }


def observe_article_processing_result(result: ContentProcessingResult, *, source: str) -> None:
    content_result_observer.record(
        source=source,
        processing_version=result.processing_version,
    )


def observe_hot_topic_processing_result(result: ContentProcessingResult, *, source: str) -> None:
    content_result_observer.record(
        source=source,
        processing_version=result.processing_version,
    )


def build_article_processing_result(
    article: Any,
    *,
    processing_version: str = "article-v1",
    processed_at: datetime | None = None,
) -> ContentProcessingResult:
    resolved_processed_at = processed_at or datetime.now(UTC)
    item_id = getattr(article, "id", None)
    return ContentProcessingResult(
        source_content_ref=build_content_ref("article", item_id) or "article:unknown",
        source_content_type="article",
        source_item_id=item_id if item_id is not None else "unknown",
        normalized_title=str(getattr(article, "title", "") or ""),
        normalized_summary=normalize_summary(getattr(article, "summary", None)),
        normalized_category_labels=normalize_label_list(getattr(article, "category", None)),
        normalized_tags=normalize_label_list(getattr(article, "tags", None)),
        quality_score=normalize_score(getattr(article, "quality_score", None)),
        published_at=normalize_datetime(getattr(article, "publish_time", None)),
        processing_version=processing_version,
        processed_at=resolved_processed_at.isoformat(),
        is_stale=False,
    )


def build_hot_topic_processing_result(
    topic: Any,
    *,
    processing_version: str = "hot-topic-v1",
    processed_at: datetime | None = None,
) -> ContentProcessingResult:
    resolved_processed_at = processed_at or datetime.now(UTC)
    item_id = getattr(topic, "id", None)
    return ContentProcessingResult(
        source_content_ref=build_content_ref("hot_topic", item_id) or "hot_topic:unknown",
        source_content_type="hot_topic",
        source_item_id=item_id if item_id is not None else "unknown",
        normalized_title=str(getattr(topic, "title", "") or ""),
        normalized_summary=normalize_summary(getattr(topic, "summary", None)),
        normalized_category_labels=normalize_label_list(getattr(topic, "categories", None)),
        normalized_tags=normalize_label_list(getattr(topic, "tags", None)),
        quality_score=normalize_score(getattr(topic, "quality_score", None)),
        published_at=normalize_datetime(getattr(topic, "published_at", None)),
        processing_version=processing_version,
        processed_at=resolved_processed_at.isoformat(),
        is_stale=False,
    )


def _article_result_cache_key(article: Any, processing_version: str) -> tuple[Any, ...]:
    return (
        getattr(article, "id", None),
        str(getattr(article, "title", "") or ""),
        normalize_summary(getattr(article, "summary", None)),
        tuple(normalize_label_list(getattr(article, "category", None))),
        tuple(normalize_label_list(getattr(article, "tags", None))),
        normalize_score(getattr(article, "quality_score", None)),
        normalize_datetime(getattr(article, "publish_time", None)),
        processing_version,
    )


def _hot_topic_result_cache_key(topic: Any, processing_version: str) -> tuple[Any, ...]:
    return (
        getattr(topic, "id", None),
        str(getattr(topic, "title", "") or ""),
        normalize_summary(getattr(topic, "summary", None)),
        tuple(normalize_label_list(getattr(topic, "categories", None))),
        tuple(normalize_label_list(getattr(topic, "tags", None))),
        normalize_score(getattr(topic, "quality_score", None)),
        normalize_datetime(getattr(topic, "published_at", None)),
        processing_version,
    )


def get_article_processing_result(
    article: Any,
    *,
    processing_version: str = "article-v1",
) -> ContentProcessingResult:
    cache_key = _article_result_cache_key(article, processing_version)
    with _article_result_cache_lock:
        cached = _article_result_cache.get(cache_key)
        if cached is not None:
            return cached
        result = build_article_processing_result(article, processing_version=processing_version)
        _article_result_cache[cache_key] = result
        return result


def get_hot_topic_processing_result(
    topic: Any,
    *,
    processing_version: str = "hot-topic-v1",
) -> ContentProcessingResult:
    cache_key = _hot_topic_result_cache_key(topic, processing_version)
    with _article_result_cache_lock:
        cached = _article_result_cache.get(cache_key)
        if cached is not None:
            return cached
        result = build_hot_topic_processing_result(topic, processing_version=processing_version)
        _article_result_cache[cache_key] = result
        return result
