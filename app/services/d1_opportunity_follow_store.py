from __future__ import annotations

from app.services.d1_client import D1Client, D1ClientError


class D1OpportunityFollowStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def list_opportunity_follows(self, *, user_id: int, limit: int = 20) -> list[dict]:
        try:
            rows = self.client.query(
                """
                SELECT
                    f.id AS follow_id,
                    o.title AS title,
                    f.status AS follow_status,
                    o.deadline AS deadline,
                    f.note AS progress_text,
                    f.next_step AS next_step
                FROM opportunity_follows f
                JOIN opportunities o ON o.id = f.opportunity_id
                WHERE f.user_id = ?
                ORDER BY f.updated_at DESC, f.id DESC
                LIMIT ?
                """,
                [user_id, limit],
            )
        except D1ClientError:
            return []
        return rows
