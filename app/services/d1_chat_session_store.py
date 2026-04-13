from __future__ import annotations

import json
from typing import Any

from app.services.d1_client import D1Client


def _json_list(value: object) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    try:
        data = json.loads(str(value))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _build_session_title(user_message: str) -> str:
    text = str(user_message).strip()
    return text[:60] if text else "新对话"


def _to_session(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "session_id": int(row["id"]),
        "session_title": row.get("session_title"),
        "status": str(row.get("status") or "active"),
        "source_context": row.get("source_context"),
        "last_message_at": row.get("last_message_at"),
        "message_count": int(row.get("message_count") or 0),
    }


def _to_message(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "message_id": int(row["id"]),
        "role": str(row.get("role") or "assistant"),
        "content": str(row.get("content") or ""),
        "created_at": row.get("created_at"),
        "message_state": row.get("message_state"),
        "intent_type": row.get("intent_type"),
        "candidate_intents": _json_list(row.get("candidate_intents_json")),
        "confidence": row.get("confidence"),
        "source_context": row.get("source_context"),
        "matched_by": row.get("matched_by"),
        "confirmed_type": row.get("confirmed_type"),
        "action_type": row.get("action_type"),
        "result_summary": row.get("result_summary"),
        "deep_link": row.get("deep_link"),
        "next_page_label": row.get("next_page_label"),
        "affected_entity_type": row.get("affected_entity_type"),
        "affected_entity_id": row.get("affected_entity_id"),
        "change_log": _json_list(row.get("change_log_json")),
    }


class D1ChatSessionStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def get_or_create_active_session(self, *, user_id: int, source_context: str | None, user_message: str) -> dict[str, Any]:
        rows = self.client.query(
            """
            SELECT id, user_id, session_title, status, source_context, created_at, updated_at, last_message_at
            FROM chat_sessions
            WHERE user_id = ? AND status = 'active'
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id],
        )
        if rows:
            row = rows[0]
            if not row.get("source_context") and source_context:
                self.client.execute(
                    "UPDATE chat_sessions SET source_context = ? WHERE id = ?",
                    [source_context, row["id"]],
                )
                row["source_context"] = source_context
            return row

        return self.client.query(
            """
            INSERT INTO chat_sessions (user_id, session_title, status, source_context)
            VALUES (?, ?, 'active', ?)
            RETURNING id, user_id, session_title, status, source_context, created_at, updated_at, last_message_at
            """,
            [user_id, _build_session_title(user_message), source_context],
        )[0]

    def append_chat_message(
        self,
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
    ) -> dict[str, Any]:
        row = self.client.query(
            """
            INSERT INTO chat_messages (
                session_id, role, content, message_state, intent_type,
                candidate_intents_json, confidence, source_context, matched_by,
                confirmed_type, action_type, result_summary, deep_link, next_page_label,
                affected_entity_type, affected_entity_id, change_log_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id, session_id, role, content, message_state, intent_type,
                      candidate_intents_json, confidence, source_context, matched_by,
                      confirmed_type, action_type, result_summary, deep_link, next_page_label,
                      affected_entity_type, affected_entity_id, change_log_json, created_at
            """,
            [
                session_id,
                role,
                content,
                message_state,
                intent_type,
                json.dumps(candidate_intents or [], ensure_ascii=False),
                confidence,
                source_context,
                matched_by,
                confirmed_type,
                action_type,
                result_summary,
                deep_link,
                next_page_label,
                affected_entity_type,
                str(affected_entity_id) if affected_entity_id is not None else None,
                json.dumps(change_log or [], ensure_ascii=False),
            ],
        )[0]
        self.client.execute(
            "UPDATE chat_sessions SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [session_id],
        )
        row["candidate_intents"] = _json_list(row.get("candidate_intents_json"))
        row["change_log"] = _json_list(row.get("change_log_json"))
        return row

    def list_chat_sessions(self, *, user_id: int, limit: int = 20) -> list[dict[str, Any]]:
        rows = self.client.query(
            """
            SELECT
                s.id,
                s.session_title,
                s.status,
                s.source_context,
                s.last_message_at,
                COUNT(m.id) AS message_count
            FROM chat_sessions s
            LEFT JOIN chat_messages m ON m.session_id = s.id
            WHERE s.user_id = ?
            GROUP BY s.id, s.session_title, s.status, s.source_context, s.last_message_at
            ORDER BY s.last_message_at DESC, s.id DESC
            LIMIT ?
            """,
            [user_id, limit],
        )
        return [_to_session(row) for row in rows]

    def get_chat_session_messages(self, *, user_id: int, session_id: int) -> dict[str, Any] | None:
        sessions = self.client.query(
            """
            SELECT id, session_title, status, source_context, last_message_at
            FROM chat_sessions
            WHERE id = ? AND user_id = ?
            """,
            [session_id, user_id],
        )
        if not sessions:
            return None
        session = sessions[0]
        message_rows = self.client.query(
            """
            SELECT
                id, role, content, created_at, message_state, intent_type,
                candidate_intents_json, confidence, source_context, matched_by,
                confirmed_type, action_type, result_summary, deep_link, next_page_label,
                affected_entity_type, affected_entity_id, change_log_json
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            [session_id],
        )
        return {
            "session_id": int(session["id"]),
            "session_title": session.get("session_title"),
            "status": str(session.get("status") or "active"),
            "source_context": session.get("source_context"),
            "last_message_at": session.get("last_message_at"),
            "messages": [_to_message(row) for row in message_rows],
        }
