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


class D1UserProfileStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def get_user_profile_result(self, *, user_id: int) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT profile_data
            FROM user_profiles
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id],
        )
        if not rows:
            return None
        return _deserialize_payload(rows[0].get("profile_data"))

    def upsert_user_profile_result(
        self,
        *,
        user_id: int,
        persona_summary: str,
        profile_version: str,
        generated_at: str | None,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        payload_json = json.dumps(payload, ensure_ascii=False)
        existing = self.client.query(
            """
            SELECT id
            FROM user_profiles
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            [user_id],
        )
        if existing:
            profile_id = int(existing[0]["id"])
            self.client.execute(
                """
                UPDATE user_profiles
                SET summary = ?,
                    version = ?,
                    generated_at = ?,
                    profile_data = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                [persona_summary, profile_version, generated_at, payload_json, profile_id],
            )
            return {"id": profile_id}

        rows = self.client.query(
            """
            INSERT INTO user_profiles (
                user_id, summary, version, generated_at, profile_data
            )
            VALUES (?, ?, ?, ?, ?)
            RETURNING id
            """,
            [user_id, persona_summary, profile_version, generated_at, payload_json],
        )
        return rows[0]
