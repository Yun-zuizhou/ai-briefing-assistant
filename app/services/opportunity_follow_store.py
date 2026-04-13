from __future__ import annotations

from threading import Lock

from sqlalchemy.orm import Session

from app.database import engine
from app.models.opportunity import Opportunity
from app.models.opportunity_follow import OpportunityFollow


_table_init_lock = Lock()
_table_initialized = False


def _ensure_table_exists() -> None:
    global _table_initialized
    if _table_initialized:
        return
    with _table_init_lock:
        if _table_initialized:
            return
        OpportunityFollow.__table__.create(bind=engine, checkfirst=True)
        _table_initialized = True


def list_opportunity_follows(
    db: Session,
    *,
    user_id: int,
    limit: int = 20,
) -> list[dict]:
    _ensure_table_exists()
    rows = (
        db.query(OpportunityFollow, Opportunity)
        .join(Opportunity, Opportunity.id == OpportunityFollow.opportunity_id)
        .filter(OpportunityFollow.user_id == user_id)
        .order_by(OpportunityFollow.updated_at.desc().nullslast(), OpportunityFollow.id.desc())
        .limit(limit)
        .all()
    )
    items: list[dict] = []
    for follow, opportunity in rows:
        items.append(
            {
                "follow_id": follow.id,
                "title": opportunity.title,
                "follow_status": follow.status or "watching",
                "deadline": opportunity.deadline.isoformat() if opportunity.deadline else None,
                "progress_text": follow.note,
                "next_step": follow.next_step,
            }
        )
    return items
