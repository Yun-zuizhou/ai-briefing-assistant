from __future__ import annotations

from datetime import UTC, datetime
from threading import Lock

from sqlalchemy.orm import Session

from app.database import engine
from app.models.article_processing_result import ArticleProcessingResult


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
        ArticleProcessingResult.__table__.create(bind=engine, checkfirst=True)
        _table_initialized = True


def _needs_refresh(
    row: ArticleProcessingResult,
    result,
) -> bool:
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


def _apply_result(
    row: ArticleProcessingResult,
    result,
) -> ArticleProcessingResult:
    row.source_article_id = int(result.source_item_id)
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


def get_or_create_article_processing_result(
    db: Session,
    article,
    *,
    processing_version: str = "article-v1",
) -> ArticleProcessingResult:
    from app.services.content_result import build_article_processing_result

    _ensure_table_exists()
    item_id = getattr(article, "id", None)
    if item_id is None:
        raise ValueError("article 缺少 id，无法生成 processing result")

    result = build_article_processing_result(article, processing_version=processing_version)
    row = (
        db.query(ArticleProcessingResult)
        .filter(ArticleProcessingResult.source_article_id == int(item_id))
        .first()
    )

    if row is None:
        row = _apply_result(ArticleProcessingResult(), result)
        db.add(row)
        db.commit()
        db.refresh(row)
        return row

    if _needs_refresh(row, result):
        _apply_result(row, result)
        db.commit()
        db.refresh(row)

    return row


def get_or_create_article_processing_results(
    db: Session,
    articles: list,
    *,
    processing_version: str = "article-v1",
) -> dict[int, ArticleProcessingResult]:
    from app.services.content_result import build_article_processing_result

    _ensure_table_exists()
    article_ids = [int(getattr(article, "id")) for article in articles if getattr(article, "id", None) is not None]
    if not article_ids:
        return {}

    existing_rows = (
        db.query(ArticleProcessingResult)
        .filter(ArticleProcessingResult.source_article_id.in_(article_ids))
        .all()
    )
    existing_by_id = {row.source_article_id: row for row in existing_rows}
    results: dict[int, ArticleProcessingResult] = {}
    changed = False

    for article in articles:
        item_id = getattr(article, "id", None)
        if item_id is None:
            continue
        article_id = int(item_id)
        result = build_article_processing_result(article, processing_version=processing_version)
        row = existing_by_id.get(article_id)
        if row is None:
            row = _apply_result(ArticleProcessingResult(), result)
            db.add(row)
            existing_by_id[article_id] = row
            changed = True
        elif _needs_refresh(row, result):
            _apply_result(row, result)
            changed = True
        results[article_id] = row

    if changed:
        db.commit()
        for row in results.values():
            db.refresh(row)

    return results
