import json
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.api.v1.page_schemas import (
    GrowthKeywordItem,
    GrowthOverviewResponse,
    HistoryPreviewItem,
    PersonaSnapshot,
    ReportEntryItem,
    WeeklyGrowthSummary,
)
from app.database import get_db, engine
from app.models.briefing import Briefing
from app.models.opportunity_follow import OpportunityFollow
from app.models.user import User
from app.models.user_interest import UserInterest
from app.models.user_profile import UserProfile
from app.models.user_setting import UserSetting
from app.models.favorite import Favorite
from app.models.note import Note
from app.models.opportunity_follow import OpportunityFollow
from app.models.todo import Todo, TodoStatus
from app.models.history import HistoryEntry
from app.services.activity_streak import calc_streak_from_timestamps
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.d1_briefing_store import D1BriefingStore
from app.services.d1_client import D1Client, D1ClientError
from app.services.d1_reports_store import D1ReportsStore
from app.services.d1_opportunity_follow_store import D1OpportunityFollowStore
from app.services.d1_user_profile_store import D1UserProfileStore
from app.services.persona_keywords import build_growth_keywords, sanitize_growth_keywords
from app.services.user_profile_store import get_user_profile_result, upsert_user_profile_result


router = APIRouter()


def _ensure_user_settings_table() -> None:
    UserSetting.__table__.create(bind=engine, checkfirst=True)


def _ensure_user_interests_table() -> None:
    UserInterest.__table__.create(bind=engine, checkfirst=True)


def _load_user_interests(user: User) -> list[str]:
    try:
        data = json.loads(user.interests or "[]")
        return [str(item) for item in data] if isinstance(data, list) else []
    except Exception:
        return []


def _save_user_interests(user: User, interests: list[str]) -> None:
    deduped: list[str] = []
    for item in interests:
        name = str(item).strip()
        if name and name not in deduped:
            deduped.append(name)
    user.interests = json.dumps(deduped, ensure_ascii=False)


def _sync_user_interests_rows(db: Session, user_id: int, interests: list[str]) -> None:
    _ensure_user_interests_table()
    normalized: list[str] = []
    for item in interests:
        name = str(item).strip()
        if name and name not in normalized:
            normalized.append(name)

    existing_rows = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    existing_map = {row.interest_name: row for row in existing_rows}

    for row in existing_rows:
        if row.interest_name in normalized:
            row.status = "active"
        else:
            row.status = "inactive"

    for name in normalized:
        if name not in existing_map:
            db.add(
                UserInterest(
                    user_id=user_id,
                    interest_name=name,
                    status="active",
                )
            )


def _load_user_interests_from_rows(db: Session, user_id: int) -> list[str]:
    _ensure_user_interests_table()
    rows = (
        db.query(UserInterest)
        .filter(UserInterest.user_id == user_id, UserInterest.status == "active")
        .order_by(UserInterest.id.asc())
        .all()
    )
    return [row.interest_name for row in rows if row.interest_name]


class UserInterestsResponse(BaseModel):
    interests: list[str]


class UserInterestsUpdateRequest(BaseModel):
    interests: list[str]


class UserSettingsResponse(BaseModel):
    morning_brief_time: str
    evening_brief_time: str
    do_not_disturb_enabled: bool
    do_not_disturb_start: str | None = None
    do_not_disturb_end: str | None = None
    sound_enabled: bool
    vibration_enabled: bool


class UserSettingsUpdateRequest(BaseModel):
    morning_brief_time: str = "08:00"
    evening_brief_time: str = "21:00"
    do_not_disturb_enabled: bool = False
    do_not_disturb_start: str | None = None
    do_not_disturb_end: str | None = None
    sound_enabled: bool = True
    vibration_enabled: bool = True


class UserProfileResponse(BaseModel):
    active_interests: list[str]
    notes_count: int
    favorites_count: int
    completed_todos: int
    total_todos: int
    history_count: int
    radar_metrics: dict[str, int]
    persona_summary: str
    growth_keywords: list[str]


def _build_profile_payload(
    *,
    active_interests: list[str],
    persona_summary: str,
    growth_keywords: list[str],
) -> dict:
    return {
        "active_interests": active_interests,
        "persona_summary": persona_summary,
        "growth_keywords": growth_keywords,
    }


def _maybe_load_cached_user_profile(user_id: int, db: Session) -> dict | None:
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            return D1UserProfileStore().get_user_profile_result(user_id=user_id)
        return get_user_profile_result(db, user_id=user_id)
    except D1ClientError:
        return None
    except Exception:
        return None


def _persist_user_profile(
    db: Session,
    *,
    user_id: int,
    active_interests: list[str],
    persona_summary: str,
    growth_keywords: list[str],
) -> None:
    payload = _build_profile_payload(
        active_interests=active_interests,
        persona_summary=persona_summary,
        growth_keywords=growth_keywords,
    )
    generated_at = __import__("datetime").datetime.now().isoformat()
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            D1UserProfileStore().upsert_user_profile_result(
                user_id=user_id,
                persona_summary=persona_summary,
                profile_version="v1",
                generated_at=generated_at,
                payload=payload,
            )
            return
        upsert_user_profile_result(
            db,
            user_id=user_id,
            persona_summary=persona_summary,
            profile_version="v1",
            generated_at=generated_at,
            payload=payload,
        )
    except D1ClientError:
        return
    except Exception:
        return


def _get_or_create_user_settings(db: Session, user_id: int) -> UserSetting:
    _ensure_user_settings_table()
    settings = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if settings:
        return settings

    settings = UserSetting(user_id=user_id)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _build_recent_history_items_local(db: Session, user_id: int) -> list[HistoryPreviewItem]:
    items: list[HistoryPreviewItem] = []

    latest_briefing = (
        db.query(Briefing)
        .filter(Briefing.user_id == user_id)
        .order_by(Briefing.brief_date.desc(), Briefing.id.desc())
        .first()
    )
    if latest_briefing:
        items.append(
            HistoryPreviewItem(
                history_type="briefing",
                history_title=latest_briefing.title,
                history_date=latest_briefing.brief_date,
            )
        )

    latest_note = (
        db.query(Note)
        .filter(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .first()
    )
    if latest_note:
        items.append(
            HistoryPreviewItem(
                history_type="journal",
                history_title=latest_note.content[:40],
                history_date=latest_note.created_at.strftime("%Y-%m-%d") if latest_note.created_at else "",
            )
        )

    latest_follow = (
        db.query(OpportunityFollow)
        .filter(OpportunityFollow.user_id == user_id)
        .order_by(OpportunityFollow.updated_at.desc().nullslast(), OpportunityFollow.id.desc())
        .first()
    )
    if latest_follow:
        items.append(
            HistoryPreviewItem(
                history_type="action",
                history_title=latest_follow.next_step or latest_follow.note or "行动后续跟进",
                history_date=(
                    latest_follow.updated_at.strftime("%Y-%m-%d")
                    if latest_follow.updated_at else (
                        latest_follow.created_at.strftime("%Y-%m-%d") if latest_follow.created_at else ""
                    )
                ),
            )
        )

    return items


def _build_recent_history_items_d1(
    user_id: int,
    *,
    behavior_store: D1BehaviorStore | None = None,
    briefing_store: D1BriefingStore | None = None,
    follow_store: D1OpportunityFollowStore | None = None,
    bundle: dict | None = None,
) -> list[HistoryPreviewItem]:
    items: list[HistoryPreviewItem] = []
    if bundle is not None:
        if bundle.get("latest_briefing_title"):
            items.append(
                HistoryPreviewItem(
                    history_type="briefing",
                    history_title=str(bundle.get("latest_briefing_title") or "今日简报"),
                    history_date=str(bundle.get("latest_briefing_date") or ""),
                )
            )
        if bundle.get("latest_note_content"):
            items.append(
                HistoryPreviewItem(
                    history_type="journal",
                    history_title=str(bundle.get("latest_note_content") or "")[:40],
                    history_date=str(bundle.get("latest_note_created_at") or "")[:10],
                )
            )
        if bundle.get("latest_follow_next_step") or bundle.get("latest_follow_note"):
            items.append(
                HistoryPreviewItem(
                    history_type="action",
                    history_title=str(bundle.get("latest_follow_next_step") or bundle.get("latest_follow_note") or "行动后续跟进"),
                    history_date=str(bundle.get("latest_follow_updated_at") or bundle.get("latest_follow_created_at") or "")[:10],
                )
            )
        return items

    resolved_behavior_store = behavior_store or D1BehaviorStore()
    resolved_briefing_store = briefing_store or D1BriefingStore()
    resolved_follow_store = follow_store or D1OpportunityFollowStore()

    briefings = resolved_briefing_store.list_recent_briefings(user_id=user_id, limit=1)
    if briefings:
        row = briefings[0]
        items.append(
            HistoryPreviewItem(
                history_type="briefing",
                history_title=str(row.get("title") or "今日简报"),
                history_date=str(row.get("briefing_date") or ""),
            )
        )

    notes = resolved_behavior_store.list_notes(user_id)[:1]
    if notes:
        row = notes[0]
        items.append(
            HistoryPreviewItem(
                history_type="journal",
                history_title=str(row.get("content") or "")[:40],
                history_date=str(row.get("created_at") or "")[:10],
            )
        )

    follows = resolved_follow_store.list_opportunity_follows(user_id=user_id, limit=1)
    if follows:
        row = follows[0]
        items.append(
            HistoryPreviewItem(
                history_type="action",
                history_title=str(row.get("next_step") or row.get("progress_text") or "行动后续跟进"),
                history_date=str(row.get("updated_at") or row.get("created_at") or "")[:10],
            )
        )

    return items


def _calc_local_activity_streak(db: Session, user_id: int) -> int:
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
    return calc_streak_from_timestamps(timestamps, assume_utc=False)


def _calc_d1_activity_streak(user_id: int, *, behavior_store: D1BehaviorStore | None = None) -> int:
    resolved_behavior_store = behavior_store or D1BehaviorStore()
    return resolved_behavior_store.get_activity_streak(user_id)


@router.get("/interests", response_model=UserInterestsResponse, summary="获取用户关注列表")
async def get_user_interests(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        return UserInterestsResponse(interests=D1BehaviorStore().get_user_interests(user_id))

    user = db.query(User).filter(User.id == user_id).first()
    row_interests = _load_user_interests_from_rows(db, user_id)
    if row_interests:
        return UserInterestsResponse(interests=row_interests)

    if not user:
        return UserInterestsResponse(interests=[])

    return UserInterestsResponse(interests=_load_user_interests(user))


@router.put("/interests", response_model=UserInterestsResponse, summary="更新用户关注列表")
async def update_user_interests(
    payload: UserInterestsUpdateRequest,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        return UserInterestsResponse(interests=D1BehaviorStore().replace_user_interests(user_id, payload.interests))

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            username=f"user_{user_id}",
            email=f"user_{user_id}@example.com",
            hashed_password="temporary",
        )
        db.add(user)
        db.flush()

    _save_user_interests(user, payload.interests)
    _sync_user_interests_rows(db, user_id, payload.interests)
    db.commit()
    return UserInterestsResponse(interests=_load_user_interests(user))


@router.get("/settings", response_model=UserSettingsResponse, summary="获取用户通知设置")
async def get_user_settings(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        data = D1BehaviorStore().get_or_create_user_settings(user_id)
        return UserSettingsResponse(
            morning_brief_time=data["morning_brief_time"],
            evening_brief_time=data["evening_brief_time"],
            do_not_disturb_enabled=bool(data["do_not_disturb_enabled"]),
            do_not_disturb_start=data.get("do_not_disturb_start"),
            do_not_disturb_end=data.get("do_not_disturb_end"),
            sound_enabled=bool(data["sound_enabled"]),
            vibration_enabled=bool(data["vibration_enabled"]),
        )

    user_settings = _get_or_create_user_settings(db, user_id)
    return UserSettingsResponse(
        morning_brief_time=user_settings.morning_brief_time,
        evening_brief_time=user_settings.evening_brief_time,
        do_not_disturb_enabled=user_settings.do_not_disturb_enabled,
        do_not_disturb_start=user_settings.do_not_disturb_start,
        do_not_disturb_end=user_settings.do_not_disturb_end,
        sound_enabled=user_settings.sound_enabled,
        vibration_enabled=user_settings.vibration_enabled,
    )


@router.put("/settings", response_model=UserSettingsResponse, summary="更新用户通知设置")
async def update_user_settings(
    payload: UserSettingsUpdateRequest,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        data = D1BehaviorStore().update_user_settings(user_id, payload.model_dump())
        return UserSettingsResponse(
            morning_brief_time=data["morning_brief_time"],
            evening_brief_time=data["evening_brief_time"],
            do_not_disturb_enabled=bool(data["do_not_disturb_enabled"]),
            do_not_disturb_start=data.get("do_not_disturb_start"),
            do_not_disturb_end=data.get("do_not_disturb_end"),
            sound_enabled=bool(data["sound_enabled"]),
            vibration_enabled=bool(data["vibration_enabled"]),
        )

    user_settings = _get_or_create_user_settings(db, user_id)
    user_settings.morning_brief_time = payload.morning_brief_time
    user_settings.evening_brief_time = payload.evening_brief_time
    user_settings.do_not_disturb_enabled = payload.do_not_disturb_enabled
    user_settings.do_not_disturb_start = payload.do_not_disturb_start
    user_settings.do_not_disturb_end = payload.do_not_disturb_end
    user_settings.sound_enabled = payload.sound_enabled
    user_settings.vibration_enabled = payload.vibration_enabled
    db.commit()
    db.refresh(user_settings)

    return UserSettingsResponse(
        morning_brief_time=user_settings.morning_brief_time,
        evening_brief_time=user_settings.evening_brief_time,
        do_not_disturb_enabled=user_settings.do_not_disturb_enabled,
        do_not_disturb_start=user_settings.do_not_disturb_start,
        do_not_disturb_end=user_settings.do_not_disturb_end,
        sound_enabled=user_settings.sound_enabled,
        vibration_enabled=user_settings.vibration_enabled,
    )


def _build_d1_user_profile_response(
    *,
    user_id: int,
    db: Session,
    cached: dict | None,
    behavior_store: D1BehaviorStore,
) -> UserProfileResponse:
    data = behavior_store.get_user_profile(user_id)
    if cached:
        data["active_interests"] = cached.get("active_interests") or data["active_interests"]
        data["persona_summary"] = cached.get("persona_summary") or data["persona_summary"]
        data["growth_keywords"] = sanitize_growth_keywords(cached.get("growth_keywords") or []) or data["growth_keywords"]
        return UserProfileResponse(**data)
    _persist_user_profile(
        db,
        user_id=user_id,
        active_interests=data["active_interests"],
        persona_summary=data["persona_summary"],
        growth_keywords=data["growth_keywords"],
    )
    return UserProfileResponse(**data)


def _build_growth_overview_profile_snapshot(
    *,
    user_id: int,
    db: Session,
    behavior_store: D1BehaviorStore | None = None,
    bundle: dict | None = None,
) -> tuple[dict[str, int], str, list[GrowthKeywordItem]]:
    if settings.D1_USE_CLOUD_AS_SOURCE:
        resolved_behavior_store = behavior_store or D1BehaviorStore()
        cached = _maybe_load_cached_user_profile(user_id, db) or {}
        counts = {
            "notes_count": int((bundle or {}).get("notes_count") or 0),
            "favorites_count": int((bundle or {}).get("favorites_count") or 0),
            "completed_todos": int((bundle or {}).get("completed_todos") or 0),
            "total_todos": int((bundle or {}).get("total_todos") or 0),
            "history_count": int((bundle or {}).get("history_count") or 0),
        }
        if not any(counts.values()):
            counts = resolved_behavior_store.get_profile_counts(user_id)
        live_profile = resolved_behavior_store.get_user_profile(user_id)
        persona_summary = str(
            cached.get("persona_summary")
            or live_profile.get("persona_summary")
            or "你正在从“被动关注者”转向“会记录、会行动、会回看的持续探索者”。"
        )
        keyword_values = (
            sanitize_growth_keywords(cached.get("growth_keywords") or [])
            or sanitize_growth_keywords(live_profile.get("growth_keywords") or [])
        )[:6]
        keywords = [GrowthKeywordItem(keyword=str(item), weight=None, trend=None) for item in keyword_values]
        return counts, persona_summary, keywords

    profile_response = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    notes_count = db.query(Note).filter(Note.user_id == user_id).count()
    if profile_response and profile_response.profile_payload_json:
        try:
            payload = json.loads(profile_response.profile_payload_json)
        except Exception:
            payload = {}
    else:
        payload = {}
    persona_summary = str(payload.get("persona_summary") or "你正在从“被动关注者”转向“会记录、会行动、会回看的持续探索者”。")
    keyword_values = list(payload.get("growth_keywords") or [])[:6]
    keywords = [GrowthKeywordItem(keyword=str(item), weight=None, trend=None) for item in keyword_values]
    return {
        "notes_count": notes_count,
        "favorites_count": db.query(Favorite).filter(Favorite.user_id == user_id).count(),
        "completed_todos": db.query(Todo).filter(Todo.user_id == user_id, Todo.status == TodoStatus.COMPLETED).count(),
        "total_todos": db.query(Todo).filter(Todo.user_id == user_id).count(),
        "history_count": db.query(HistoryEntry).filter(HistoryEntry.user_id == user_id).count(),
    }, persona_summary, keywords


@router.get("/profile", response_model=UserProfileResponse, summary="获取用户成长画像概览")
async def get_user_profile(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    cached = _maybe_load_cached_user_profile(user_id, db)
    if settings.D1_USE_CLOUD_AS_SOURCE:
        d1_client = D1Client()
        behavior_store = D1BehaviorStore(d1_client)
        return _build_d1_user_profile_response(
            user_id=user_id,
            db=db,
            cached=cached,
            behavior_store=behavior_store,
        )

    user = db.query(User).filter(User.id == user_id).first()
    row_interests = _load_user_interests_from_rows(db, user_id)
    if row_interests:
        active_interests = row_interests
    else:
        active_interests = _load_user_interests(user) if user else []

    notes = db.query(Note).filter(Note.user_id == user_id).all()
    favorites_count = db.query(Favorite).filter(Favorite.user_id == user_id).count()
    todos = db.query(Todo).filter(Todo.user_id == user_id).all()
    history_count = db.query(HistoryEntry).filter(HistoryEntry.user_id == user_id).count()

    completed_todos = sum(1 for todo in todos if todo.status == TodoStatus.COMPLETED)
    total_todos = len(todos)

    growth_keywords = build_growth_keywords(
        active_interests=active_interests,
        note_tags=[str(tag) for note in notes for tag in (note.tags or []) if tag],
        note_contents=[note.content for note in notes if note.content],
        favorite_titles=[item.item_title for item in db.query(Favorite).filter(Favorite.user_id == user_id).all() if item.item_title],
    )

    radar_metrics = {
        "活跃度": min(100, history_count * 10),
        "收藏量": min(100, favorites_count * 15),
        "任务完成": round((completed_todos / total_todos) * 100) if total_todos > 0 else 0,
        "关注广度": min(100, len(active_interests) * 15),
        "连续打卡": min(100, max(history_count * 8, 20)),
        "互动深度": min(100, len(notes) * 12),
    }

    interest_text = "、".join(active_interests[:3]) if active_interests else "多个主题"
    persona_summary = (
        f"你是一位持续关注{interest_text}的探索者，"
        f"已经留下{len(notes)}条真实记录、收藏{favorites_count}条内容，"
        f"并完成{completed_todos}项待办。当前最明显的特征是从信息浏览逐步走向记录、行动与回顾。"
    )

    response = UserProfileResponse(
        active_interests=active_interests,
        notes_count=len(notes),
        favorites_count=favorites_count,
        completed_todos=completed_todos,
        total_todos=total_todos,
        history_count=history_count,
        radar_metrics=radar_metrics,
        persona_summary=persona_summary,
        growth_keywords=growth_keywords,
    )
    if cached:
        response.active_interests = cached.get("active_interests") or response.active_interests
        response.persona_summary = cached.get("persona_summary") or response.persona_summary
        response.growth_keywords = sanitize_growth_keywords(cached.get("growth_keywords") or []) or response.growth_keywords
        return response
    _persist_user_profile(
        db,
        user_id=user_id,
        active_interests=active_interests,
        persona_summary=persona_summary,
        growth_keywords=growth_keywords,
    )
    return response


@router.get("/growth-overview", response_model=GrowthOverviewResponse, summary="获取成长页概览")
async def get_growth_overview(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        d1_client = D1Client()
        behavior_store = D1BehaviorStore(d1_client)
        bundle = behavior_store.get_growth_overview_bundle(user_id)
        counts, persona_summary, keywords = _build_growth_overview_profile_snapshot(
            user_id=user_id,
            db=db,
            behavior_store=behavior_store,
            bundle=bundle,
        )
        recent_history_items = _build_recent_history_items_d1(
            user_id,
            bundle=bundle,
        )
        streak_days = _calc_d1_activity_streak(user_id, behavior_store=behavior_store)
        reports = [
            ReportEntryItem(report_type="weekly", report_title="周报", generated_at=None, available=bool(counts["notes_count"] or counts["favorites_count"] or counts["history_count"])),
            ReportEntryItem(report_type="monthly", report_title="月报", generated_at=None, available=bool(counts["notes_count"] or counts["favorites_count"] or counts["history_count"])),
            ReportEntryItem(report_type="annual", report_title="年度报告", generated_at=None, available=bool(counts["notes_count"] or counts["favorites_count"] or counts["history_count"])),
        ]
        total_thoughts = counts["notes_count"]
        completed_actions = counts["completed_todos"]
    else:
        counts, persona_summary, keywords = _build_growth_overview_profile_snapshot(
            user_id=user_id,
            db=db,
        )
        recent_history_items = _build_recent_history_items_local(db, user_id)
        streak_days = _calc_local_activity_streak(db, user_id)
        available = bool(counts["history_count"] or counts["notes_count"] or counts["favorites_count"])
        reports = [
            ReportEntryItem(report_type="weekly", report_title="周报", generated_at=None, available=available),
            ReportEntryItem(report_type="monthly", report_title="月报", generated_at=None, available=available),
            ReportEntryItem(report_type="annual", report_title="年度报告", generated_at=None, available=available),
        ]
        total_thoughts = counts["notes_count"]
        completed_actions = counts["completed_todos"]

    return GrowthOverviewResponse(
        user_name=f"user_{user_id}",
        streak_days=streak_days,
        total_thoughts=total_thoughts,
        weekly_summary=WeeklyGrowthSummary(
            week_label="本周",
            active_interest_changes=None,
            completed_actions=completed_actions,
            new_notes_count=total_thoughts,
            growth_summary="本周你继续沿着记录、行动与回看的路径推进。",
        ),
        keywords=keywords,
        persona=PersonaSnapshot(
            persona_summary=persona_summary,
            persona_version="v1",
            updated_at=None,
        ),
        recent_history_items=recent_history_items,
        reports=reports,
    )
