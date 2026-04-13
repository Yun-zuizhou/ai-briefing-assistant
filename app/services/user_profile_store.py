from __future__ import annotations

import json
from threading import Lock
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine
from app.models.user_profile import UserProfile


_table_init_lock = Lock()
_table_initialized = False


def _ensure_table_exists() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        UserProfile.__table__.create(bind=engine, checkfirst=True)
        with engine.begin() as conn:
            rows = conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()
            column_names = {str(row[1]) for row in rows}
            if "profile_payload_json" not in column_names:
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN profile_payload_json TEXT"))
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


def get_user_profile_result(
    db: Session,
    *,
    user_id: int,
) -> dict[str, Any] | None:
    _ensure_table_exists()
    row = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .order_by(UserProfile.id.desc())
        .first()
    )
    if row is None:
        return None
    return _deserialize_payload(row.profile_payload_json)


def upsert_user_profile_result(
    db: Session,
    *,
    user_id: int,
    persona_summary: str,
    profile_version: str,
    generated_at: str | None,
    payload: dict[str, Any],
) -> UserProfile:
    _ensure_table_exists()
    row = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .order_by(UserProfile.id.desc())
        .first()
    )
    if row is None:
        row = UserProfile(
            user_id=user_id,
            persona_summary=persona_summary,
            profile_version=profile_version,
            generated_at=generated_at,
            profile_payload_json=_serialize_payload(payload),
        )
        db.add(row)
        db.flush()
        return row

    row.persona_summary = persona_summary
    row.profile_version = profile_version
    row.generated_at = generated_at
    row.profile_payload_json = _serialize_payload(payload)
    db.flush()
    return row
