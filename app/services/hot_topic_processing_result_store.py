from __future__ import annotations

from datetime import UTC, datetime
from threading import Lock

from sqlalchemy.orm import Session

from app.database import engine
from app.models.hot_topic_processing_result import HotTopicProcessingResult


_table_init_lock = Lock()
_table_initialized = False


def _normalized_list(value: list[str] | None) -> list[str]:
    return value or []


def _ensure_table_exists() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        HotTopicProcessingResult.__table__.create(bind=engine, checkfirst=True)
        _table_initialized = True


def _needs_refresh(row: HotTopicProcessingResult, result) -> bool:
    return any(
        [
            row.processing_version != result.processing_version,
            row.is_stale,
            row.normalized_title != result.normalized_title,
            row.normalized_summary != result.normalized_summary,
            _normalized_list(row.normalized_category_labels) != _normalized_list(result.normalized_category_labels),
            _normalized_list(row.normalized_tags) != _normalized_list(result.normalized_tags),
            float(row.quality_score or 0) != float(result.quality_score or 0),
            row.published_at != result.published_at,
            row.source_content_ref != result.source_content_ref,
        ]
    )


def _apply_result(row: HotTopicProcessingResult, result) -> HotTopicProcessingResult:
    row.source_hot_topic_id = int(result.source_item_id)
    row.source_content_ref = result.source_content_ref
    row.normalized_title = result.normalized_title
    row.normalized_summary = result.normalized_summary
    row.normalized_category_labels = result.normalized_category_labels
    row.normalized_tags = result.normalized_tags
    row.quality_score = result.quality_score
    row.published_at = result.published_at
    row.processing_version = result.processing_version
    row.processed_at = datetime.now(UTC)
    row.is_stale = False
    return row


def get_or_create_hot_topic_processing_result(
    db: Session,
    topic,
    *,
    processing_version: str = "hot-topic-v1",
) -> HotTopicProcessingResult:
    from app.services.content_result import build_hot_topic_processing_result

    _ensure_table_exists()
    item_id = getattr(topic, "id", None)
    if item_id is None:
        raise ValueError("hot_topic 缺少 id，无法生成 processing result")

    result = build_hot_topic_processing_result(topic, processing_version=processing_version)
    row = (
        db.query(HotTopicProcessingResult)
        .filter(HotTopicProcessingResult.source_hot_topic_id == int(item_id))
        .first()
    )

    if row is None:
        row = _apply_result(HotTopicProcessingResult(), result)
        db.add(row)
        db.commit()
        db.refresh(row)
        return row

    if _needs_refresh(row, result):
        _apply_result(row, result)
        db.commit()
        db.refresh(row)

    return row


def get_or_create_hot_topic_processing_results(
    db: Session,
    topics: list,
    *,
    processing_version: str = "hot-topic-v1",
) -> dict[int, HotTopicProcessingResult]:
    from app.services.content_result import build_hot_topic_processing_result

    _ensure_table_exists()
    topic_ids = [int(getattr(topic, "id")) for topic in topics if getattr(topic, "id", None) is not None]
    if not topic_ids:
        return {}

    existing_rows = (
        db.query(HotTopicProcessingResult)
        .filter(HotTopicProcessingResult.source_hot_topic_id.in_(topic_ids))
        .all()
    )
    existing_by_id = {row.source_hot_topic_id: row for row in existing_rows}
    results: dict[int, HotTopicProcessingResult] = {}
    changed = False

    for topic in topics:
        item_id = getattr(topic, "id", None)
        if item_id is None:
            continue
        topic_id = int(item_id)
        result = build_hot_topic_processing_result(topic, processing_version=processing_version)
        row = existing_by_id.get(topic_id)
        if row is None:
            row = _apply_result(HotTopicProcessingResult(), result)
            db.add(row)
            existing_by_id[topic_id] = row
            changed = True
        elif _needs_refresh(row, result):
            _apply_result(row, result)
            changed = True
        results[topic_id] = row

    if changed:
        db.commit()
        for row in results.values():
            db.refresh(row)

    return results
