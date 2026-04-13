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


class D1ReportStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def get_report_result(
        self,
        *,
        user_id: int,
        report_type: str,
        period_start: str | None,
        period_end: str | None,
    ) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT report_payload_json
            FROM reports
            WHERE user_id = ?
              AND report_type = ?
              AND (? IS NULL OR period_start = ?)
              AND (? IS NULL OR period_end = ?)
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id, report_type, period_start, period_start, period_end, period_end],
        )
        if not rows:
            return None
        return _deserialize_payload(rows[0].get("report_payload_json"))

    def get_report_result_by_id(
        self,
        *,
        user_id: int,
        report_id: int,
        report_type: str | None = None,
    ) -> dict[str, Any] | None:
        if report_type:
            rows = self.client.query(
                """
                SELECT report_payload_json
                FROM reports
                WHERE id = ?
                  AND user_id = ?
                  AND report_type = ?
                LIMIT 1
                """,
                [report_id, user_id, report_type],
            )
        else:
            rows = self.client.query(
                """
                SELECT report_payload_json
                FROM reports
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                """,
                [report_id, user_id],
            )
        if not rows:
            return None
        return _deserialize_payload(rows[0].get("report_payload_json"))

    def list_report_entries(
        self,
        *,
        user_id: int,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return self.client.query(
            """
            SELECT id, report_type, title, generated_at, period_start, period_end, status
            FROM reports
            WHERE user_id = ?
              AND status = 'ready'
            ORDER BY generated_at DESC, id DESC
            LIMIT ?
            """,
            [user_id, limit],
        )

    def upsert_report_result(
        self,
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
    ) -> dict[str, Any]:
        payload_json = json.dumps(payload, ensure_ascii=False)
        existing = self.client.query(
            """
            SELECT id
            FROM reports
            WHERE user_id = ?
              AND report_type = ?
              AND (? IS NULL OR period_start = ?)
              AND (? IS NULL OR period_end = ?)
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id, report_type, period_start, period_start, period_end, period_end],
        )
        if existing:
            report_id = int(existing[0]["id"])
            self.client.execute(
                """
                UPDATE reports
                SET title = ?,
                    summary_text = ?,
                    status = ?,
                    report_payload_json = ?,
                    generated_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                [title, summary_text, status, payload_json, generated_at, report_id],
            )
            return {"id": report_id}

        rows = self.client.query(
            """
            INSERT INTO reports (
                user_id, report_type, period_start, period_end,
                title, summary_text, status, report_payload_json, generated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            """,
            [user_id, report_type, period_start, period_end, title, summary_text, status, payload_json, generated_at],
        )
        return rows[0]
