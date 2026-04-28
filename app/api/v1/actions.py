from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.page_schemas import (
    ActionCheckInResponse,
    ActionTodoItem,
    ActionsOverviewResponse,
    FollowingItem,
    ReminderSummaryData,
    SavedItem,
)
from app.config import settings
from app.database import get_db
from app.models.favorite import Favorite
from app.models.history import HistoryEntry
from app.models.note import Note
from app.models.opportunity_follow import OpportunityFollow
from app.models.todo import Todo, TodoStatus
from app.models.user_setting import UserSetting
from app.services.activity_streak import calc_streak_from_timestamps, is_checked_in_today
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.d1_client import D1Client
from app.services.opportunity_follow_store import list_opportunity_follows


router = APIRouter()


_ACTION_SAVED_TYPES = {"hot_topic", "article", "opportunity"}
_ACTIVE_TODO_STATUSES = {TodoStatus.PENDING.value, TodoStatus.IN_PROGRESS.value}


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    return value[:10]


def _collect_local_activity_timestamps(db: Session, user_id: int) -> list[datetime | None]:
    timestamps: list[datetime | None] = []
    timestamps.extend(
        item.created_at
        for item in db.query(HistoryEntry.created_at).filter(HistoryEntry.user_id == user_id).all()
    )
    timestamps.extend(
        item.created_at
        for item in db.query(Note.created_at).filter(Note.user_id == user_id).all()
    )
    timestamps.extend(
        item.created_at
        for item in db.query(Favorite.created_at).filter(Favorite.user_id == user_id).all()
    )
    timestamps.extend(
        item.created_at
        for item in db.query(Todo.created_at).filter(Todo.user_id == user_id).all()
    )
    timestamps.extend(
        (item.updated_at or item.created_at)
        for item in db.query(OpportunityFollow.created_at, OpportunityFollow.updated_at)
        .filter(OpportunityFollow.user_id == user_id)
        .all()
    )
    return timestamps


def _calc_local_activity_streak(db: Session, user_id: int) -> int:
    return calc_streak_from_timestamps(_collect_local_activity_timestamps(db, user_id), assume_utc=False)


def _is_local_checked_in_today(db: Session, user_id: int) -> bool:
    return is_checked_in_today(_collect_local_activity_timestamps(db, user_id), assume_utc=False)


def _to_action_todo_item(item: dict, *, done: bool) -> ActionTodoItem:
    return ActionTodoItem(
        todo_id=item["id"],
        title=item["content"],
        source_type="chat" if "chat" in (item.get("tags") or []) else "manual",
        source_ref_id=None,
        due_label=item.get("deadline"),
        priority=item.get("priority") or "medium",
        done=done,
    )


def _split_action_todos(rows: list[dict]) -> tuple[list[ActionTodoItem], list[ActionTodoItem], list[ActionTodoItem]]:
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_items: list[ActionTodoItem] = []
    future_items: list[ActionTodoItem] = []
    completed_items: list[ActionTodoItem] = []

    for item in rows:
        status = item.get("status")
        normalized_deadline = _normalize_date(item.get("deadline"))

        if status == TodoStatus.COMPLETED.value:
            completed_items.append(_to_action_todo_item(item, done=True))
            continue

        if status not in _ACTIVE_TODO_STATUSES:
            continue

        target = future_items if normalized_deadline and normalized_deadline > today_str else today_items
        target.append(_to_action_todo_item(item, done=False))

    return today_items[:10], future_items[:10], completed_items[:10]


@router.get("/overview", response_model=ActionsOverviewResponse, summary="获取行动页概览")
async def get_actions_overview(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        client = D1Client()
        behavior_store = D1BehaviorStore(client)
        todos = behavior_store.list_action_todos_grouped(user_id=user_id)
        today_todos, future_todos, completed_todos = _split_action_todos(todos)
        bundle = behavior_store.get_actions_overview_bundle(user_id=user_id)
        return ActionsOverviewResponse(
            filter_type=None,
            loading=False,
            error=None,
            today_todos=today_todos,
            future_todos=future_todos,
            completed_todos=completed_todos,
            saved_for_later=[
                SavedItem(
                    saved_id=item["saved_id"],
                    title=item["title"],
                    content_type=item["content_type"],
                    source_name=item.get("source_name"),
                    saved_at=item.get("saved_at"),
                    urgency_label=None,
                )
                for item in bundle["saved_for_later"]
            ],
            following_items=[
                FollowingItem(
                    follow_id=item["follow_id"],
                    title=item["title"],
                    follow_status=item["follow_status"],
                    deadline=item.get("deadline"),
                    progress_text=item.get("progress_text"),
                    next_step=item.get("next_step"),
                )
                for item in bundle["following_items"]
            ],
            reminder_summary=ReminderSummaryData(
                push_time=bundle["morning_brief_time"],
                upcoming_reminders=[],
                do_not_disturb=bool(bundle.get("do_not_disturb_enabled")),
            ),
            streak_days=int(bundle.get("streak_days") or 0),
            checked_in_today=bool(bundle.get("checked_in_today")),
        )

    todos = (
        db.query(Todo)
        .filter(Todo.user_id == user_id, Todo.status.in_([TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]))
        .order_by(Todo.created_at.desc())
        .all()
    )
    todo_rows = [
        {
            "id": item.id,
            "content": item.content,
            "status": item.status.value if item.status else TodoStatus.PENDING.value,
            "priority": item.priority.value if item.priority else "medium",
            "deadline": item.deadline.isoformat() if item.deadline else None,
            "tags": item.tags or [],
        }
        for item in todos
    ]
    today_todos, future_todos, completed_todos = _split_action_todos(todo_rows)
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .limit(10)
        .all()
    )
    favorites = [item for item in favorites if item.item_type in _ACTION_SAVED_TYPES]
    user_settings = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    follows = list_opportunity_follows(db, user_id=user_id, limit=20)
    return ActionsOverviewResponse(
        filter_type=None,
        loading=False,
        error=None,
        today_todos=today_todos,
        future_todos=future_todos,
        completed_todos=completed_todos,
        saved_for_later=[
            SavedItem(
                saved_id=item.id,
                title=item.item_title,
                content_type=item.item_type,
                source_name=item.item_source,
                saved_at=item.created_at.isoformat() if item.created_at else None,
                urgency_label=None,
            )
            for item in favorites
        ],
        following_items=follows,
        reminder_summary=ReminderSummaryData(
            push_time=user_settings.morning_brief_time if user_settings else "08:00",
            upcoming_reminders=[],
            do_not_disturb=user_settings.do_not_disturb_enabled if user_settings else False,
        ),
        streak_days=_calc_local_activity_streak(db, user_id),
        checked_in_today=_is_local_checked_in_today(db, user_id),
    )


@router.post("/check-in", response_model=ActionCheckInResponse, summary="执行今日打卡")
async def check_in_today(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        store = D1BehaviorStore(D1Client())
        if store.get_checked_in_today(user_id):
            return ActionCheckInResponse(
                success=True,
                checked_in_today=True,
                streak_days=store.get_activity_streak(user_id),
                message="今天已经打过卡了",
            )
        store.append_history(
            user_id=user_id,
            event_type="daily_check_in",
            title="今日打卡",
            summary="已完成今日打卡",
        )
        return ActionCheckInResponse(
            success=True,
            checked_in_today=True,
            streak_days=store.get_activity_streak(user_id),
            message="今日打卡成功",
        )

    if _is_local_checked_in_today(db, user_id):
        return ActionCheckInResponse(
            success=True,
            checked_in_today=True,
            streak_days=_calc_local_activity_streak(db, user_id),
            message="今天已经打过卡了",
        )

    item = HistoryEntry(
        user_id=user_id,
        event_type="daily_check_in",
        title="今日打卡",
        summary="已完成今日打卡",
        created_at=datetime.now(),
    )
    db.add(item)
    db.commit()

    return ActionCheckInResponse(
        success=True,
        checked_in_today=True,
        streak_days=_calc_local_activity_streak(db, user_id),
        message="今日打卡成功",
    )
