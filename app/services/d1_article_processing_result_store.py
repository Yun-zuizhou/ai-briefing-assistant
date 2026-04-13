from __future__ import annotations

import json
from types import SimpleNamespace

from app.services.d1_client import D1Client


def _json_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    try:
        data = json.loads(str(value))
        if isinstance(data, list):
            return [str(item) for item in data]
    except Exception:
        pass
    return []


def _to_result(row: dict) -> SimpleNamespace:
    return SimpleNamespace(
        id=int(row["id"]),
        source_article_id=int(row["source_article_id"]),
        source_content_ref=str(row.get("source_content_ref") or ""),
        normalized_title=str(row.get("normalized_title") or ""),
        normalized_summary=row.get("normalized_summary"),
        normalized_category_labels=_json_list(row.get("normalized_category_labels_json")),
        normalized_tags=_json_list(row.get("normalized_tags_json")),
        quality_score=float(row.get("quality_score") or 0),
        published_at=row.get("published_at"),
        processing_version=str(row.get("processing_version") or ""),
        processed_at=row.get("processed_at"),
        is_stale=bool(row.get("is_stale")),
    )


class D1ArticleProcessingResultStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def get_by_source_article_id(self, source_article_id: int) -> SimpleNamespace | None:
        rows = self.client.query(
            """
            SELECT id, source_article_id, source_content_ref,
                   normalized_title, normalized_summary,
                   normalized_category_labels_json, normalized_tags_json,
                   quality_score, published_at,
                   processing_version, processed_at, is_stale
            FROM article_processing_results
            WHERE source_article_id = ?
            """,
            [source_article_id],
        )
        return _to_result(rows[0]) if rows else None

    def get_many_by_source_article_ids(self, source_article_ids: list[int]) -> dict[int, SimpleNamespace]:
        if not source_article_ids:
            return {}
        placeholders = ", ".join("?" for _ in source_article_ids)
        rows = self.client.query(
            f"""
            SELECT id, source_article_id, source_content_ref,
                   normalized_title, normalized_summary,
                   normalized_category_labels_json, normalized_tags_json,
                   quality_score, published_at,
                   processing_version, processed_at, is_stale
            FROM article_processing_results
            WHERE source_article_id IN ({placeholders})
            """,
            source_article_ids,
        )
        return {int(row["source_article_id"]): _to_result(row) for row in rows}

    def upsert_article_result(self, article, *, processing_version: str = "article-v1") -> SimpleNamespace:
        from app.services.content_result import build_article_processing_result

        result = build_article_processing_result(article, processing_version=processing_version)
        self.client.execute(
            """
            INSERT INTO article_processing_results (
                source_article_id,
                source_content_ref,
                normalized_title,
                normalized_summary,
                normalized_category_labels_json,
                normalized_tags_json,
                quality_score,
                published_at,
                processing_version,
                processed_at,
                is_stale
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(source_article_id) DO UPDATE SET
                source_content_ref = excluded.source_content_ref,
                normalized_title = excluded.normalized_title,
                normalized_summary = excluded.normalized_summary,
                normalized_category_labels_json = excluded.normalized_category_labels_json,
                normalized_tags_json = excluded.normalized_tags_json,
                quality_score = excluded.quality_score,
                published_at = excluded.published_at,
                processing_version = excluded.processing_version,
                processed_at = excluded.processed_at,
                is_stale = excluded.is_stale
            """,
            [
                int(result.source_item_id),
                result.source_content_ref,
                result.normalized_title,
                result.normalized_summary,
                json.dumps(result.normalized_category_labels, ensure_ascii=False),
                json.dumps(result.normalized_tags, ensure_ascii=False),
                result.quality_score,
                result.published_at,
                result.processing_version,
                result.processed_at,
                1 if result.is_stale else 0,
            ],
        )
        stored = self.get_by_source_article_id(int(result.source_item_id))
        if stored is None:
            raise RuntimeError("D1 article_processing_results upsert 后未能读取到结果")
        return stored

    def get_or_create_article_result(self, article, *, processing_version: str = "article-v1") -> SimpleNamespace:
        from app.services.content_result import build_article_processing_result

        item_id = getattr(article, "id", None)
        if item_id is None:
            raise ValueError("article 缺少 id，无法生成 D1 processing result")
        row = self.get_by_source_article_id(int(item_id))
        if row is None:
            return self.upsert_article_result(article, processing_version=processing_version)

        fresh = build_article_processing_result(article, processing_version=processing_version)
        row_categories = _json_list(getattr(row, "normalized_category_labels", None))
        row_tags = _json_list(getattr(row, "normalized_tags", None))
        needs_refresh = any(
            [
                row.processing_version != fresh.processing_version,
                bool(row.is_stale),
                row.normalized_title != fresh.normalized_title,
                row.normalized_summary != fresh.normalized_summary,
                row_categories != fresh.normalized_category_labels,
                row_tags != fresh.normalized_tags,
                float(row.quality_score or 0) != float(fresh.quality_score or 0),
                row.published_at != fresh.published_at,
                row.source_content_ref != fresh.source_content_ref,
            ]
        )
        if needs_refresh:
            return self.upsert_article_result(article, processing_version=processing_version)
        return row

    def get_or_create_article_results(self, articles: list, *, processing_version: str = "article-v1") -> dict[int, SimpleNamespace]:
        from app.services.content_result import build_article_processing_result

        article_ids = [int(getattr(article, "id")) for article in articles if getattr(article, "id", None) is not None]
        existing = self.get_many_by_source_article_ids(article_ids)
        results: dict[int, SimpleNamespace] = {}

        for article in articles:
            item_id = getattr(article, "id", None)
            if item_id is None:
                continue
            article_id = int(item_id)
            row = existing.get(article_id)
            if row is None:
                row = self.upsert_article_result(article, processing_version=processing_version)
            else:
                fresh = build_article_processing_result(article, processing_version=processing_version)
                row_categories = _json_list(getattr(row, "normalized_category_labels", None))
                row_tags = _json_list(getattr(row, "normalized_tags", None))
                needs_refresh = any(
                    [
                        row.processing_version != fresh.processing_version,
                        bool(row.is_stale),
                        row.normalized_title != fresh.normalized_title,
                        row.normalized_summary != fresh.normalized_summary,
                        row_categories != fresh.normalized_category_labels,
                        row_tags != fresh.normalized_tags,
                        float(row.quality_score or 0) != float(fresh.quality_score or 0),
                        row.published_at != fresh.published_at,
                        row.source_content_ref != fresh.source_content_ref,
                    ]
                )
                if needs_refresh:
                    row = self.upsert_article_result(article, processing_version=processing_version)
            results[article_id] = row
        return results
