from __future__ import annotations

import json
from threading import Lock
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine
from app.models.briefing import Briefing


_table_init_lock = Lock()
_table_initialized = False


def _ensure_table_exists() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        Briefing.__table__.create(bind=engine, checkfirst=True)
        with engine.begin() as conn:
            rows = conn.execute(text("PRAGMA table_info(briefings)")).fetchall()
            column_names = {str(row[1]) for row in rows}
            if "brief_payload_json" not in column_names:
                conn.execute(text("ALTER TABLE briefings ADD COLUMN brief_payload_json TEXT"))
            if "generated_at" not in column_names:
                conn.execute(text("ALTER TABLE briefings ADD COLUMN generated_at TEXT"))
        _table_initialized = True


def _serialize_payload(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False)


def _deserialize_payload(payload_json: str | None) -> dict[str, Any] | None:
    if not payload_json:
        return None
    try:
        data = json.loads(payload_json)
    except Exception:
        return None
    return data if isinstance(data, dict) else None


def get_briefing_result(
    db: Session,
    *,
    user_id: int,
    brief_date: str,
    brief_type: str,
) -> dict[str, Any] | None:
    _ensure_table_exists()
    row = (
        db.query(Briefing)
        .filter(
            Briefing.user_id == user_id,
            Briefing.brief_date == brief_date,
            Briefing.brief_type == brief_type,
        )
        .order_by(Briefing.id.desc())
        .first()
    )
    if row is None:
        return None
    return _deserialize_payload(row.brief_payload_json)


def upsert_briefing_result(
    db: Session,
    *,
    user_id: int,
    brief_date: str,
    brief_type: str,
    issue_number: int | None,
    title: str,
    summary_text: str | None,
    status: str,
    generated_at: str | None,
    payload: dict[str, Any],
) -> Briefing:
    _ensure_table_exists()
    row = (
        db.query(Briefing)
        .filter(
            Briefing.user_id == user_id,
            Briefing.brief_date == brief_date,
            Briefing.brief_type == brief_type,
        )
        .order_by(Briefing.id.desc())
        .first()
    )
    if row is None:
        row = Briefing(
            user_id=user_id,
            brief_date=brief_date,
            brief_type=brief_type,
            issue_number=issue_number,
            title=title,
            summary_text=summary_text,
            status=status,
            generated_at=generated_at,
            brief_payload_json=_serialize_payload(payload),
        )
        db.add(row)
        db.flush()
        return row

    row.issue_number = issue_number
    row.title = title
    row.summary_text = summary_text
    row.status = status
    row.generated_at = generated_at
    row.brief_payload_json = _serialize_payload(payload)
    db.flush()
    return row
