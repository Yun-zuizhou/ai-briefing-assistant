from __future__ import annotations

import json
from typing import Any

from app.services.d1_client import D1Client


def _deserialize_payload(payload_json: str | None) -> dict[str, Any] | None:
    if not payload_json:
        return None
    try:
        data = json.loads(payload_json)
    except Exception:
        return None
    return data if isinstance(data, dict) else None


class D1BriefingStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def get_briefing_result(
        self,
        *,
        user_id: int,
        brief_date: str,
        brief_type: str,
    ) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT payload
            FROM briefings
            WHERE user_id = ?
              AND briefing_date = ?
              AND briefing_type = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id, brief_date, brief_type],
        )
        if not rows:
            return None
        return _deserialize_payload(rows[0].get("payload"))

    def upsert_briefing_result(
        self,
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
    ) -> dict[str, Any]:
        payload_json = json.dumps(payload, ensure_ascii=False)
        existing = self.client.query(
            """
            SELECT id
            FROM briefings
            WHERE user_id = ?
              AND briefing_date = ?
              AND briefing_type = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id, brief_date, brief_type],
        )
        if existing:
            briefing_id = int(existing[0]["id"])
            self.client.execute(
                """
                UPDATE briefings
                SET issue_number = ?,
                    title = ?,
                    summary_text = ?,
                    payload = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                [issue_number, title, summary_text, payload_json, briefing_id],
            )
            return {"id": briefing_id}

        rows = self.client.query(
            """
            INSERT INTO briefings (
                user_id, briefing_date, briefing_type, issue_number,
                title, summary_text, payload
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            """,
            [user_id, brief_date, brief_type, issue_number, title, summary_text, payload_json],
        )
        return rows[0]

    def list_recent_briefings(self, *, user_id: int, limit: int = 5) -> list[dict]:
        return self.client.query(
            """
            SELECT id, title, briefing_date, briefing_type, issue_number, summary_text, created_at
            FROM briefings
            WHERE user_id = ?
            ORDER BY briefing_date DESC, id DESC
            LIMIT ?
            """,
            [user_id, limit],
        )
