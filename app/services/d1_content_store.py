from __future__ import annotations

import json
from datetime import datetime
from types import SimpleNamespace

from app.services.d1_client import D1Client


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    text = str(value).strip().replace("Z", "+00:00")
    for fmt in (None, "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f"):
        try:
            if fmt is None:
                return datetime.fromisoformat(text)
            return datetime.strptime(text, fmt)
        except Exception:
            continue
    return None


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


def _to_hot_topic(row: dict) -> SimpleNamespace:
    return SimpleNamespace(
        id=int(row["id"]),
        title=str(row.get("title") or ""),
        summary=row.get("summary"),
        content=row.get("content"),
        source=row.get("source"),
        source_url=row.get("source_url"),
        author=row.get("author"),
        categories=_json_list(row.get("categories")),
        tags=_json_list(row.get("tags")),
        keywords=_json_list(row.get("keywords")),
        hot_value=float(row.get("hot_value") or 0),
        quality_score=float(row.get("quality_score") or 0),
        relevance_score=float(row.get("relevance_score") or 0),
        published_at=_parse_datetime(row.get("published_at")),
        fetched_at=_parse_datetime(row.get("fetched_at")),
    )


def _to_opportunity(row: dict) -> SimpleNamespace:
    return SimpleNamespace(
        id=int(row["id"]),
        title=str(row.get("title") or ""),
        type=row.get("type"),
        status=row.get("status"),
        source=row.get("source"),
        source_url=row.get("source_url"),
        source_id=row.get("source_id"),
        content=row.get("content"),
        summary=row.get("summary"),
        requirements=_json_list(row.get("requirements")),
        published_at=_parse_datetime(row.get("published_at")),
        deadline=_parse_datetime(row.get("deadline")),
        start_time=_parse_datetime(row.get("start_time")),
        reward=row.get("reward"),
        reward_min=row.get("reward_min"),
        reward_max=row.get("reward_max"),
        reward_unit=row.get("reward_unit"),
        location=row.get("location"),
        is_remote=bool(row.get("is_remote")),
        tags=_json_list(row.get("tags")),
        category=row.get("category"),
        quality_score=float(row.get("quality_score") or 0),
        reliability_score=float(row.get("reliability_score") or 0),
    )


def _to_article(row: dict) -> SimpleNamespace:
    return SimpleNamespace(
        id=int(row["id"]),
        title=str(row.get("title") or ""),
        summary=row.get("summary"),
        content=row.get("content"),
        source_id=row.get("source_id"),
        source_name=row.get("source_name"),
        source_url=row.get("source_url"),
        author=row.get("author"),
        category=row.get("category"),
        tags=_json_list(row.get("tags")),
        publish_time=_parse_datetime(row.get("publish_time")),
        fetch_time=_parse_datetime(row.get("fetch_time")),
        guid=row.get("guid"),
        quality_score=float(row.get("quality_score") or 0),
        view_count=int(row.get("view_count") or 0),
    )


class D1ContentStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def list_hot_topics(self, limit: int = 12) -> list[SimpleNamespace]:
        rows = self.client.query(
            """
            SELECT id, title, summary, content, source, source_url, author,
                   categories, tags, keywords, hot_value, quality_score,
                   relevance_score, published_at, fetched_at
            FROM hot_topics
            ORDER BY hot_value DESC, quality_score DESC
            LIMIT ?
            """,
            [limit],
        )
        return [_to_hot_topic(row) for row in rows]

    def list_opportunities(self, limit: int = 12) -> list[SimpleNamespace]:
        rows = self.client.query(
            """
            SELECT id, title, type, status, source, source_url, source_id,
                   content, summary, requirements, published_at, deadline, start_time,
                   reward, reward_min, reward_max, reward_unit, location, is_remote,
                   tags, category, quality_score, reliability_score
            FROM opportunities
            WHERE lower(status) = 'active'
            ORDER BY quality_score DESC, published_at DESC
            LIMIT ?
            """,
            [limit],
        )
        return [_to_opportunity(row) for row in rows]

    def get_hot_topic(self, item_id: int) -> SimpleNamespace | None:
        rows = self.client.query(
            """
            SELECT id, title, summary, content, source, source_url, author,
                   categories, tags, keywords, hot_value, quality_score,
                   relevance_score, published_at, fetched_at
            FROM hot_topics
            WHERE id = ?
            """,
            [item_id],
        )
        return _to_hot_topic(rows[0]) if rows else None

    def get_opportunity(self, item_id: int) -> SimpleNamespace | None:
        rows = self.client.query(
            """
            SELECT id, title, type, status, source, source_url, source_id,
                   content, summary, requirements, published_at, deadline, start_time,
                   reward, reward_min, reward_max, reward_unit, location, is_remote,
                   tags, category, quality_score, reliability_score
            FROM opportunities
            WHERE id = ?
            """,
            [item_id],
        )
        return _to_opportunity(rows[0]) if rows else None

    def list_articles(
        self,
        limit: int = 12,
        *,
        offset: int = 0,
        category: str | None = None,
        source_id: int | None = None,
    ) -> list[SimpleNamespace]:
        conditions: list[str] = []
        params: list[object] = []
        if category:
            conditions.append("category = ?")
            params.append(category)
        if source_id:
            conditions.append("source_id = ?")
            params.append(source_id)
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        rows = self.client.query(
            f"""
            SELECT id, title, summary, content, source_id, source_name, source_url,
                   author, category, tags, publish_time, fetch_time, guid,
                   quality_score, view_count
            FROM rss_articles
            {where_clause}
            ORDER BY quality_score DESC, publish_time DESC
            LIMIT ? OFFSET ?
            """,
            [*params, limit, offset],
        )
        return [_to_article(row) for row in rows]

    def get_article(self, item_id: int) -> SimpleNamespace | None:
        rows = self.client.query(
            """
            SELECT id, title, summary, content, source_id, source_name, source_url,
                   author, category, tags, publish_time, fetch_time, guid,
                   quality_score, view_count
            FROM rss_articles
            WHERE id = ?
            """,
            [item_id],
        )
        return _to_article(rows[0]) if rows else None
