from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.models.todo import TodoStatus
from app.services.d1_behavior_store import D1BehaviorStore


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except Exception:
        try:
            return datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
        except Exception:
            try:
                return datetime.strptime(text, "%Y-%m-%d %H:%M:%S.%f")
            except Exception:
                return None


@dataclass
class ReportUser:
    id: int
    interests: str = "[]"


@dataclass
class ReportNote:
    id: int
    content: str
    tags: list[str] = field(default_factory=list)
    created_at: datetime | None = None


@dataclass
class ReportFavorite:
    id: int
    item_type: str
    item_id: int
    item_title: str
    item_summary: str | None = None
    item_source: str | None = None
    item_url: str | None = None
    created_at: datetime | None = None


@dataclass
class ReportTodo:
    id: int
    status: TodoStatus | str
    created_at: datetime | None = None


@dataclass
class ReportHistory:
    id: int
    title: str
    summary: str | None = None
    event_type: str | None = None
    ref_type: str | None = None
    ref_id: int | None = None
    created_at: datetime | None = None


class D1ReportsStore:
    def __init__(self, behavior_store: D1BehaviorStore | None = None) -> None:
        self.behavior_store = behavior_store or D1BehaviorStore()

    def _get_user(self, user_id: int) -> ReportUser:
        row = self.behavior_store._ensure_user(user_id)
        return ReportUser(id=int(row["id"]), interests=str(row.get("interests") or "[]"))

    def get_report_availability(self, user_id: int) -> dict[str, int | bool]:
        notes = self.behavior_store.list_notes(user_id)
        favorites = self.behavior_store.list_favorites(user_id)
        history = self.behavior_store.list_history(user_id)
        return {
            "note_count": len(notes),
            "favorite_count": len(favorites),
            "history_count": len(history),
            "available": bool(notes or favorites or history),
        }

    def get_report_context(
        self,
        user_id: int,
        *,
        note_limit: int,
        favorite_limit: int,
        history_limit: int,
        include_all_todos: bool = True,
    ) -> dict[str, object]:
        user = self._get_user(user_id)
        interests = self.behavior_store.get_user_interests(user_id)

        notes = [
            ReportNote(
                id=int(row["id"]),
                content=str(row.get("content") or ""),
                tags=list(row.get("tags") or []),
                created_at=_parse_datetime(row.get("created_at")),
            )
            for row in self.behavior_store.list_notes(user_id)[:note_limit]
        ]

        favorites = [
            ReportFavorite(
                id=int(row["id"]),
                item_type=str(row.get("item_type") or ""),
                item_id=int(row.get("item_id") or 0),
                item_title=str(row.get("item_title") or ""),
                item_summary=row.get("item_summary"),
                item_source=row.get("item_source"),
                item_url=row.get("item_url"),
                created_at=_parse_datetime(row.get("created_at")),
            )
            for row in self.behavior_store.list_favorites(user_id)[:favorite_limit]
        ]

        todos = [
            ReportTodo(
                id=int(row["id"]),
                status=TodoStatus(str(row["status"])) if row.get("status") in {item.value for item in TodoStatus} else str(row.get("status") or ""),
                created_at=_parse_datetime(row.get("created_at")),
            )
            for row in self.behavior_store.list_todos(user_id)
        ]
        if not include_all_todos:
            todos = todos[:]

        history = [
            ReportHistory(
                id=int(row["id"]),
                title=str(row.get("title") or ""),
                summary=row.get("summary"),
                event_type=row.get("event_type"),
                ref_type=row.get("ref_type"),
                ref_id=int(row["ref_id"]) if row.get("ref_id") is not None else None,
                created_at=_parse_datetime(row.get("created_at")),
            )
            for row in self.behavior_store.list_history(user_id)[:history_limit]
        ]

        return {
            "user": user,
            "interests": interests,
            "notes": notes,
            "favorites": favorites,
            "todos": todos,
            "history_items": history,
        }
