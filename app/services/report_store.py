from __future__ import annotations

import json
from threading import Lock
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine
from app.models.report import Report


_table_init_lock = Lock()
_table_initialized = False


def _ensure_table_exists() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        Report.__table__.create(bind=engine, checkfirst=True)
        with engine.begin() as conn:
            rows = conn.execute(text("PRAGMA table_info(reports)")).fetchall()
            column_names = {str(row[1]) for row in rows}
            if "report_payload_json" not in column_names:
                conn.execute(text("ALTER TABLE reports ADD COLUMN report_payload_json TEXT"))
            if "generated_at" not in column_names:
                conn.execute(text("ALTER TABLE reports ADD COLUMN generated_at TEXT"))
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


def get_report_result(
    db: Session,
    *,
    user_id: int,
    report_type: str,
    period_start: str | None,
    period_end: str | None,
) -> dict[str, Any] | None:
    _ensure_table_exists()
    row = (
        db.query(Report)
        .filter(
            Report.user_id == user_id,
            Report.report_type == report_type,
            Report.period_start == period_start,
            Report.period_end == period_end,
        )
        .order_by(Report.id.desc())
        .first()
    )
    if row is None:
        return None
    return _deserialize_payload(row.report_payload_json)


def get_report_result_by_id(
    db: Session,
    *,
    user_id: int,
    report_id: int,
    report_type: str | None = None,
) -> dict[str, Any] | None:
    _ensure_table_exists()
    query = db.query(Report).filter(Report.user_id == user_id, Report.id == report_id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    row = query.order_by(Report.id.desc()).first()
    if row is None:
        return None
    return _deserialize_payload(row.report_payload_json)


def list_report_entries(
    db: Session,
    *,
    user_id: int,
    limit: int = 50,
) -> list[Report]:
    _ensure_table_exists()
    return (
        db.query(Report)
        .filter(Report.user_id == user_id, Report.status == "ready")
        .order_by(Report.generated_at.desc().nullslast(), Report.id.desc())
        .limit(limit)
        .all()
    )


def upsert_report_result(
    db: Session,
    *,
    user_id: int,
    report_type: str,
    period_start: str | None,
    period_end: str | None,
    title: str,
    summary_text: str | None,
    status: str,
    generated_at: str | None,
    payload: dict[str, Any],
) -> Report:
    _ensure_table_exists()
    row = (
        db.query(Report)
        .filter(
            Report.user_id == user_id,
            Report.report_type == report_type,
            Report.period_start == period_start,
            Report.period_end == period_end,
        )
        .order_by(Report.id.desc())
        .first()
    )
    if row is None:
        row = Report(
            user_id=user_id,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            title=title,
            summary_text=summary_text,
            status=status,
            generated_at=generated_at,
            report_payload_json=_serialize_payload(payload),
        )
        db.add(row)
        db.flush()
        return row

    row.title = title
    row.summary_text = summary_text
    row.status = status
    row.generated_at = generated_at
    row.report_payload_json = _serialize_payload(payload)
    db.flush()
    return row
