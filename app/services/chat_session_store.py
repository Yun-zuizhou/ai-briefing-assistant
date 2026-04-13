from __future__ import annotations

from datetime import UTC, datetime
from threading import Lock
from typing import Any

from sqlalchemy.orm import Session

from app.database import engine
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession


_table_init_lock = Lock()
_table_initialized = False


def _ensure_tables_exist() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        ChatSession.__table__.create(bind=engine, checkfirst=True)
        ChatMessage.__table__.create(bind=engine, checkfirst=True)
        _table_initialized = True


def _build_session_title(user_message: str) -> str:
    text = str(user_message).strip()
    return text[:60] if text else "新对话"


def _serialize_change_log(change_log: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    return change_log or []


def get_or_create_active_session(
    db: Session,
    *,
    user_id: int,
    source_context: str | None,
    user_message: str,
) -> ChatSession:
    _ensure_tables_exist()
    session = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id, ChatSession.status == "active")
        .order_by(ChatSession.id.desc())
        .first()
    )
    if session is not None:
        if not session.source_context and source_context:
            session.source_context = source_context
        return session

    session = ChatSession(
        user_id=user_id,
        session_title=_build_session_title(user_message),
        status="active",
        source_context=source_context,
    )
    db.add(session)
    db.flush()
    return session


def append_chat_message(
    db: Session,
    *,
    session_id: int,
    role: str,
    content: str,
    message_state: str | None = None,
    intent_type: str | None = None,
    candidate_intents: list[str] | None = None,
    confidence: float | None = None,
    source_context: str | None = None,
    matched_by: str | None = None,
    confirmed_type: str | None = None,
    action_type: str | None = None,
    result_summary: str | None = None,
    deep_link: str | None = None,
    next_page_label: str | None = None,
    affected_entity_type: str | None = None,
    affected_entity_id: int | str | None = None,
    change_log: list[dict[str, Any]] | None = None,
) -> ChatMessage:
    _ensure_tables_exist()
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        message_state=message_state,
        intent_type=intent_type,
        candidate_intents=candidate_intents or [],
        confidence=confidence,
        source_context=source_context,
        matched_by=matched_by,
        confirmed_type=confirmed_type,
        action_type=action_type,
        result_summary=result_summary,
        deep_link=deep_link,
        next_page_label=next_page_label,
        affected_entity_type=affected_entity_type,
        affected_entity_id=str(affected_entity_id) if affected_entity_id is not None else None,
        change_log=_serialize_change_log(change_log),
    )
    db.add(message)
    db.flush()

    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session is not None:
        session.last_message_at = datetime.now(UTC)
        session.updated_at = datetime.now(UTC)
    return message


def list_chat_sessions(
    db: Session,
    *,
    user_id: int,
    limit: int = 20,
) -> list[dict[str, Any]]:
    _ensure_tables_exist()
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.last_message_at.desc().nullslast(), ChatSession.id.desc())
        .limit(limit)
        .all()
    )
    items: list[dict[str, Any]] = []
    for session in sessions:
        message_count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()
        items.append(
            {
                "session_id": session.id,
                "session_title": session.session_title,
                "status": session.status,
                "source_context": session.source_context,
                "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None,
                "message_count": message_count,
            }
        )
    return items


def get_chat_session_messages(
    db: Session,
    *,
    user_id: int,
    session_id: int,
) -> dict[str, Any] | None:
    _ensure_tables_exist()
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if session is None:
        return None

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.id.asc())
        .all()
    )
    return {
        "session_id": session.id,
        "session_title": session.session_title,
        "status": session.status,
        "source_context": session.source_context,
        "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None,
        "messages": [
            {
                "message_id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat() if message.created_at else None,
                "message_state": message.message_state,
                "intent_type": message.intent_type,
                "candidate_intents": message.candidate_intents or [],
                "confidence": message.confidence,
                "source_context": message.source_context,
                "matched_by": message.matched_by,
                "confirmed_type": message.confirmed_type,
                "action_type": message.action_type,
                "result_summary": message.result_summary,
                "deep_link": message.deep_link,
                "next_page_label": message.next_page_label,
                "affected_entity_type": message.affected_entity_type,
                "affected_entity_id": message.affected_entity_id,
                "change_log": message.change_log or [],
            }
            for message in messages
        ],
    }
