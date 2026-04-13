from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.api.v1.page_schemas import (
    AnnualReportData,
    PeriodicReportResponse,
    ReportAnnualStats,
    ReportEntryItem,
    ReportGrowthComparison,
    ReportGrowthData,
    ReportGrowthStats,
    ReportGrowthTrajectory,
    ReportOverviewData,
    ReportsAvailabilityResponse,
    ReportThoughtItem,
    ReportTopicTrend,
)
from app.database import get_db
from app.models.favorite import Favorite
from app.models.history import HistoryEntry
from app.models.note import Note
from app.models.todo import Todo, TodoStatus
from app.models.user import User
from app.models.user_interest import UserInterest
from app.services.content_projection import (
    build_content_ref,
    build_report_attention_change,
    build_report_topic_trend,
)
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.d1_client import D1Client, D1ClientError
from app.services.d1_report_store import D1ReportStore
from app.services.report_processing import (
    build_report_attention_change_payload,
    build_report_fallback_insights,
    build_report_trend_candidates,
    build_report_trend_insights,
    calculate_report_trend_metrics,
)
from app.services.d1_reports_store import D1ReportsStore
from app.services.report_store import (
    get_report_result,
    get_report_result_by_id,
    list_report_entries,
    upsert_report_result,
)


router = APIRouter()


def _build_period_bounds(report_type: str) -> tuple[str | None, str | None]:
    now = datetime.now()
    if report_type == "weekly":
        return (now - timedelta(days=6)).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    if report_type == "monthly":
        return (now - timedelta(days=29)).strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")
    return None, None


def _build_annual_bounds(year: int | None = None) -> tuple[str, str]:
    target_year = year or datetime.now().year
    return f"{target_year}-01-01", f"{target_year}-12-31"


def _build_report_title(report_type: str, period_label: str) -> str:
    if report_type == "weekly":
        return f"{period_label}回顾周报"
    if report_type == "monthly":
        return f"{period_label}回顾月报"
    return f"{period_label}回顾报告"


def _build_periodic_report_summary(response: PeriodicReportResponse) -> str:
    return (
        f"{response.overview.period}内共浏览 {response.overview.viewed} 条、记录 {response.overview.recorded} 条、"
        f"收藏 {response.overview.collected} 条、完成 {response.overview.completed} 项；"
        f"{response.growth.trajectory.description}"
    )


def _maybe_load_cached_periodic_report(
    db: Session,
    *,
    user_id: int,
    report_type: str,
    client: D1Client | None = None,
) -> PeriodicReportResponse | None:
    period_start, period_end = _build_period_bounds(report_type)
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            payload = D1ReportStore(client).get_report_result(
                user_id=user_id,
                report_type=report_type,
                period_start=period_start,
                period_end=period_end,
            )
        else:
            payload = get_report_result(
                db,
                user_id=user_id,
                report_type=report_type,
                period_start=period_start,
                period_end=period_end,
            )
    except D1ClientError:
        return None
    except Exception:
        return None
    if payload is None:
        return None
    return PeriodicReportResponse.model_validate(payload)


def _persist_periodic_report(
    db: Session,
    *,
    user_id: int,
    report_type: str,
    response: PeriodicReportResponse,
    client: D1Client | None = None,
) -> None:
    period_start, period_end = _build_period_bounds(report_type)
    payload = response.model_dump(mode="json")
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            D1ReportStore(client).upsert_report_result(
                user_id=user_id,
                report_type=report_type,
                period_start=period_start,
                period_end=period_end,
                title=_build_report_title(report_type, response.overview.period),
                summary_text=_build_periodic_report_summary(response),
                status="ready",
                generated_at=datetime.now().isoformat(),
                payload=payload,
            )
            return
        upsert_report_result(
            db,
            user_id=user_id,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            title=_build_report_title(report_type, response.overview.period),
            summary_text=_build_periodic_report_summary(response),
            status="ready",
            generated_at=datetime.now().isoformat(),
            payload=payload,
        )
    except D1ClientError:
        return
    except Exception:
        return


def _maybe_load_cached_annual_report(
    db: Session,
    *,
    user_id: int,
    client: D1Client | None = None,
) -> AnnualReportData | None:
    period_start, period_end = _build_annual_bounds()
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            payload = D1ReportStore(client).get_report_result(
                user_id=user_id,
                report_type="annual",
                period_start=period_start,
                period_end=period_end,
            )
        else:
            payload = get_report_result(
                db,
                user_id=user_id,
                report_type="annual",
                period_start=period_start,
                period_end=period_end,
            )
    except D1ClientError:
        return None
    except Exception:
        return None
    if payload is None:
        return None
    return AnnualReportData.model_validate(payload)


def _persist_annual_report(
    db: Session,
    *,
    user_id: int,
    response: AnnualReportData,
    client: D1Client | None = None,
) -> None:
    payload = response.model_dump(mode="json")
    period_start, period_end = _build_annual_bounds(response.year)
    title = f"{response.year}年度报告"
    summary_text = response.thinking_section[:160]
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            D1ReportStore(client).upsert_report_result(
                user_id=user_id,
                report_type="annual",
                period_start=period_start,
                period_end=period_end,
                title=title,
                summary_text=summary_text,
                status="ready",
                generated_at=datetime.now().isoformat(),
                payload=payload,
            )
            return
        upsert_report_result(
            db,
            user_id=user_id,
            report_type="annual",
            period_start=period_start,
            period_end=period_end,
            title=title,
            summary_text=summary_text,
            status="ready",
            generated_at=datetime.now().isoformat(),
            payload=payload,
        )
    except D1ClientError:
        return
    except Exception:
        return


def _load_report_by_id(
    db: Session,
    *,
    user_id: int,
    report_id: int,
    report_type: str,
    client: D1Client | None = None,
) -> dict | None:
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            return D1ReportStore(client).get_report_result_by_id(
                user_id=user_id,
                report_id=report_id,
                report_type=report_type,
            )
        return get_report_result_by_id(
            db,
            user_id=user_id,
            report_id=report_id,
            report_type=report_type,
        )
    except D1ClientError:
        return None
    except Exception:
        return None


def _todo_status_value(todo: Todo | object) -> str | None:
    status = getattr(todo, "status", None)
    if isinstance(status, TodoStatus):
        return status.value
    if status is None:
        return None
    return str(status)


def _load_user_interests(user: User | None) -> list[str]:
    if not user or not user.interests:
        return []
    try:
        import json

        data = json.loads(user.interests)
        return [str(item).strip() for item in data if str(item).strip()] if isinstance(data, list) else []
    except Exception:
        return []


def _load_user_interests_from_rows(db: Session, user_id: int) -> list[str]:
    rows = (
        db.query(UserInterest)
        .filter(UserInterest.user_id == user_id, UserInterest.status == "active")
        .order_by(UserInterest.id.asc())
        .all()
    )
    return [row.interest_name for row in rows if row.interest_name]


def _format_date(value: datetime | None) -> str:
    if not value:
        return ""
    return value.strftime("%Y-%m-%d")


def _calc_streak(history_items: list[HistoryEntry]) -> int:
    days = sorted({_format_date(item.created_at) for item in history_items if item.created_at}, reverse=True)
    if not days:
        return 0

    streak = 0
    current = datetime.now().date()
    available = {datetime.strptime(day, "%Y-%m-%d").date() for day in days if day}
    while current in available:
        streak += 1
        current -= timedelta(days=1)
    return streak


def _build_trend_title(name: str, fallback_index: int) -> tuple[str, str]:
    icons = ["🧭", "🔥", "🌱", "📚", "💼", "📝"]
    cleaned = name.strip() or f"主题 {fallback_index}"
    return icons[(fallback_index - 1) % len(icons)], cleaned


def _build_topic_trends(
    interests: list[str],
    notes: list[Note],
    favorites: list[Favorite],
    history_items: list[HistoryEntry],
    period_label: str,
    include_attention: bool,
) -> list[ReportTopicTrend]:
    note_texts = [note.content for note in notes]
    favorite_titles = [item.item_title for item in favorites]
    history_titles = [item.title for item in history_items]

    trends: list[ReportTopicTrend] = []
    candidates = build_report_trend_candidates(
        interests,
        [tag for note in notes for tag in (note.tags or []) if tag],
    )

    for index, interest in enumerate(candidates, start=1):
        icon, title = _build_trend_title(interest, index)
        metrics = calculate_report_trend_metrics(
            interest=interest,
            note_texts=note_texts,
            favorite_titles=favorite_titles,
            history_titles=history_titles,
            fallback_index=index,
        )
        hot_title = next((text for text in favorite_titles + history_titles if interest in text), f"{interest} 持续升温")
        favorite_match = next((item for item in favorites if interest in (item.item_title or "")), None)
        history_match = next((item for item in history_items if interest in (item.title or "")), None)
        hot_spot_content_ref = None
        if favorite_match:
            hot_spot_content_ref = build_content_ref(favorite_match.item_type, favorite_match.item_id)
        elif history_match and history_match.ref_type in {"hot_topic", "article", "opportunity"}:
            hot_spot_content_ref = build_content_ref(history_match.ref_type, history_match.ref_id)

        attention_change = None
        if include_attention:
            change_value, new_topics = build_report_attention_change_payload(
                favorite_hits=metrics.favorite_hits,
                user_participation=metrics.user_participation,
                new_topics=[tag for note in notes for tag in (note.tags or []) if tag],
            )
            attention_change = build_report_attention_change(
                change=change_value,
                new_topics=new_topics,
            )

        trends.append(
            build_report_topic_trend(
                trend_id=f"{period_label}-{index}",
                icon=icon,
                title=title,
                current_heat=metrics.current_heat,
                previous_heat=metrics.previous_heat,
                change=metrics.change,
                trend=metrics.trend,
                hot_spot_title=hot_title,
                hot_spot_content_ref=hot_spot_content_ref,
                discussion_count=metrics.discussion_count or max(1, len(notes)),
                user_participation=metrics.user_participation or min(len(notes), 1),
                hot_spot_summary=f"该主题在{period_label}内持续出现于你的记录、收藏或历史行为中，已形成可回看的连续关注线索。",
                insights=build_report_trend_insights(title=title, period_label=period_label),
                attention_change=attention_change,
            )
        )

    if trends:
        return trends

    return [
        build_report_topic_trend(
            trend_id=f"{period_label}-fallback",
            icon="🧭",
            title="信息输入",
            current_heat=24,
            previous_heat=18,
            change=6,
            trend="up",
            hot_spot_title=f"{period_label}内的信息轨迹正在形成",
            hot_spot_content_ref=None,
            discussion_count=max(1, len(history_items)),
            user_participation=max(1, len(notes)),
            hot_spot_summary="当前还没有足够的主题标签，因此先按真实记录与历史行为生成基础趋势概览。",
            insights=build_report_fallback_insights(),
            attention_change=build_report_attention_change(change=8, new_topics=[]) if include_attention else None,
        )
    ]


def _build_periodic_report(
    report_type: str,
    db: Session,
    user_id: int,
    user: User | None,
    notes: list[Note],
    favorites: list[Favorite],
    todos: list[Todo],
    history_items: list[HistoryEntry],
    interests_override: list[str] | None = None,
) -> PeriodicReportResponse:
    interests = interests_override[:] if interests_override is not None else _load_user_interests_from_rows(db, user_id)
    if not interests:
        interests = _load_user_interests(user)
    completed_todos = sum(1 for todo in todos if _todo_status_value(todo) == TodoStatus.COMPLETED.value)
    streak = _calc_streak(history_items)
    period_label = "本周" if report_type == "weekly" else "本月"
    previous_factor = 0.7 if report_type == "monthly" else 0.8

    current_stats = [
        len(history_items),
        len(notes),
        len(favorites),
        completed_todos,
    ]
    previous_stats = [max(0, int(value * previous_factor)) for value in current_stats]
    changes = [value - prev for value, prev in zip(current_stats, previous_stats)]

    keywords = list(
        dict.fromkeys(
            [tag for note in notes for tag in (note.tags or []) if tag] + interests
        )
    )[:4]
    if not keywords:
        keywords = ["记录", "行动", "回顾"]

    selected_thoughts = [
        ReportThoughtItem(
            id=note.id,
            date=_format_date(note.created_at),
            content=note.content[:60],
        )
        for note in notes[:3]
    ]

    suggestions = [
        "把本期最常出现的关注主题继续沉淀为一条可执行计划。",
        "对已有收藏做一次筛选，避免信息只停留在“先存着”。",
        "保持记录频率，让后续 Today 与报告页有更真实的内容基础。",
    ]

    return PeriodicReportResponse(
        report_type=report_type,
        overview=ReportOverviewData(
            period=period_label,
            viewed=len(history_items),
            recorded=len(notes),
            collected=len(favorites),
            completed=completed_todos,
            streak=streak,
        ),
        topic_trends=_build_topic_trends(
            interests=interests,
            notes=notes,
            favorites=favorites,
            history_items=history_items,
            period_label=period_label,
            include_attention=report_type == "monthly",
        ),
        growth=ReportGrowthData(
            stats=ReportGrowthStats(
                viewed=len(history_items),
                recorded=len(notes),
                collected=len(favorites),
                completed=completed_todos,
            ),
            comparison=ReportGrowthComparison(
                current=current_stats,
                previous=previous_stats,
                change=changes,
            )
            if report_type == "monthly"
            else None,
            trajectory=ReportGrowthTrajectory(
                title="从信息浏览走向记录与行动",
                description=f"{period_label}内，你留下了 {len(notes)} 条记录、完成了 {completed_todos} 项待办，说明行为已经从单纯浏览逐步转向沉淀与执行。",
                keywords=keywords,
            ),
            selected_thoughts=selected_thoughts,
            suggestions=suggestions,
        ),
    )


@router.get("", response_model=ReportsAvailabilityResponse, summary="获取报告可用情况")
async def get_reports(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        d1_client = D1Client()
        rows = D1ReportStore(d1_client).list_report_entries(user_id=user_id, limit=50)
        return ReportsAvailabilityResponse(
            reports=[
                ReportEntryItem(
                    report_id=int(row["id"]),
                    report_type=row["report_type"],
                    report_title=row["title"],
                    generated_at=row.get("generated_at"),
                    period_start=row.get("period_start"),
                    period_end=row.get("period_end"),
                    available=True,
                )
                for row in rows
            ]
        )

    return ReportsAvailabilityResponse(
        reports=[
            ReportEntryItem(
                report_id=row.id,
                report_type=row.report_type,
                report_title=row.title,
                generated_at=row.generated_at,
                period_start=row.period_start,
                period_end=row.period_end,
                available=True,
            )
            for row in list_report_entries(db, user_id=user_id, limit=50)
        ]
    )


@router.get("/weekly", response_model=PeriodicReportResponse, summary="获取周报")
async def get_weekly_report(
    user_id: int = Query(1, description="用户ID"),
    report_id: int | None = Query(None, description="历史报告ID"),
    db: Session = Depends(get_db),
):
    d1_client = D1Client() if settings.D1_USE_CLOUD_AS_SOURCE else None
    if report_id is not None:
        payload = _load_report_by_id(
            db,
            user_id=user_id,
            report_id=report_id,
            report_type="weekly",
            client=d1_client,
        )
        if payload is None:
            raise HTTPException(status_code=404, detail="报告不存在")
        return PeriodicReportResponse.model_validate(payload)
    cached = _maybe_load_cached_periodic_report(db, user_id=user_id, report_type="weekly", client=d1_client)
    if cached is not None:
        return cached

    if settings.D1_USE_CLOUD_AS_SOURCE:
        context = D1ReportsStore(D1BehaviorStore(d1_client)).get_report_context(
            user_id,
            note_limit=12,
            favorite_limit=12,
            history_limit=20,
        )
        response = _build_periodic_report(
            "weekly",
            db,
            user_id,
            context["user"],
            context["notes"],
            context["favorites"],
            context["todos"],
            context["history_items"],
            interests_override=context["interests"],
        )
        _persist_periodic_report(db, user_id=user_id, report_type="weekly", response=response, client=d1_client)
        return response

    user = db.query(User).filter(User.id == user_id).first()
    notes = (
        db.query(Note)
        .filter(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .limit(12)
        .all()
    )
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .limit(12)
        .all()
    )
    todos = db.query(Todo).filter(Todo.user_id == user_id).all()
    history_items = (
        db.query(HistoryEntry)
        .filter(HistoryEntry.user_id == user_id)
        .order_by(HistoryEntry.created_at.desc())
        .limit(20)
        .all()
    )
    response = _build_periodic_report("weekly", db, user_id, user, notes, favorites, todos, history_items)
    _persist_periodic_report(db, user_id=user_id, report_type="weekly", response=response, client=d1_client)
    return response


@router.get("/monthly", response_model=PeriodicReportResponse, summary="获取月报")
async def get_monthly_report(
    user_id: int = Query(1, description="用户ID"),
    report_id: int | None = Query(None, description="历史报告ID"),
    db: Session = Depends(get_db),
):
    d1_client = D1Client() if settings.D1_USE_CLOUD_AS_SOURCE else None
    if report_id is not None:
        payload = _load_report_by_id(
            db,
            user_id=user_id,
            report_id=report_id,
            report_type="monthly",
            client=d1_client,
        )
        if payload is None:
            raise HTTPException(status_code=404, detail="报告不存在")
        return PeriodicReportResponse.model_validate(payload)
    cached = _maybe_load_cached_periodic_report(db, user_id=user_id, report_type="monthly", client=d1_client)
    if cached is not None:
        return cached

    if settings.D1_USE_CLOUD_AS_SOURCE:
        context = D1ReportsStore(D1BehaviorStore(d1_client)).get_report_context(
            user_id,
            note_limit=30,
            favorite_limit=30,
            history_limit=60,
        )
        response = _build_periodic_report(
            "monthly",
            db,
            user_id,
            context["user"],
            context["notes"],
            context["favorites"],
            context["todos"],
            context["history_items"],
            interests_override=context["interests"],
        )
        _persist_periodic_report(db, user_id=user_id, report_type="monthly", response=response, client=d1_client)
        return response

    user = db.query(User).filter(User.id == user_id).first()
    notes = (
        db.query(Note)
        .filter(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .limit(30)
        .all()
    )
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
        .limit(30)
        .all()
    )
    todos = db.query(Todo).filter(Todo.user_id == user_id).all()
    history_items = (
        db.query(HistoryEntry)
        .filter(HistoryEntry.user_id == user_id)
        .order_by(HistoryEntry.created_at.desc())
        .limit(60)
        .all()
    )
    response = _build_periodic_report("monthly", db, user_id, user, notes, favorites, todos, history_items)
    _persist_periodic_report(db, user_id=user_id, report_type="monthly", response=response, client=d1_client)
    return response


@router.get("/annual", response_model=AnnualReportData, summary="获取年度报告")
async def get_annual_report(
    user_id: int = Query(1, description="用户ID"),
    report_id: int | None = Query(None, description="历史报告ID"),
    db: Session = Depends(get_db),
):
    d1_client = D1Client() if settings.D1_USE_CLOUD_AS_SOURCE else None
    if report_id is not None:
        payload = _load_report_by_id(
            db,
            user_id=user_id,
            report_id=report_id,
            report_type="annual",
            client=d1_client,
        )
        if payload is None:
            raise HTTPException(status_code=404, detail="报告不存在")
        return AnnualReportData.model_validate(payload)

    cached = _maybe_load_cached_annual_report(db, user_id=user_id, client=d1_client)
    if cached is not None:
        return cached

    if settings.D1_USE_CLOUD_AS_SOURCE:
        context = D1ReportsStore(D1BehaviorStore(d1_client)).get_report_context(
            user_id,
            note_limit=40,
            favorite_limit=1000,
            history_limit=5000,
        )
        user = context["user"]
        interests = context["interests"]
        notes = context["notes"]
        favorites = context["favorites"]
        todos = context["todos"]
        history_items = context["history_items"]
    else:
        user = db.query(User).filter(User.id == user_id).first()
        interests = _load_user_interests_from_rows(db, user_id)
        if not interests:
            interests = _load_user_interests(user)
        notes = db.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc()).limit(40).all()
        favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
        todos = db.query(Todo).filter(Todo.user_id == user_id).all()
        history_items = db.query(HistoryEntry).filter(HistoryEntry.user_id == user_id).all()

    completed_todos = sum(1 for todo in todos if _todo_status_value(todo) == TodoStatus.COMPLETED.value)
    keywords = list(
        dict.fromkeys(
            [tag for note in notes for tag in (note.tags or []) if tag] + interests + ["记录者", "行动者", "回顾者"]
        )
    )[:3]
    if not keywords:
        keywords = ["记录者", "行动者", "回顾者"]

    interest_text = "、".join(interests[:3]) if interests else "多个主题"
    note_excerpt = "；".join(note.content[:24] for note in notes[:2]) if notes else "当前记录仍在积累中"

    response = AnnualReportData(
        year=datetime.now().year,
        stats=ReportAnnualStats(
            topics_viewed=len(history_items),
            opinions_posted=len(notes),
            plans_completed=completed_todos,
            days_active=len({_format_date(item.created_at) for item in history_items if item.created_at}),
        ),
        keywords=keywords,
        interests=interests[:3] if interests else ["信息输入", "个人记录", "行动转化"],
        thinking_section=(
            f"这一年，你主要围绕 {interest_text} 持续留下痕迹。"
            f" 从真实记录里可以看到，你不再只是浏览信息，而是在逐步形成自己的表达。"
            f" 目前可见的代表性想法包括：{note_excerpt}。"
        ),
        action_section=(
            f"这一年，你累计完成了 {completed_todos} 项待办，收藏了 {len(favorites)} 条内容。"
            " 当前行动链路已经进入真实接口过渡态，但更深的机会跟进与结果沉淀仍需要后续补强。"
        ),
        closing=(
            "年度报告现在已经脱离前端硬编码，改为基于真实记录、收藏、待办与历史行为聚合生成。"
            " 但它仍属于真实接口过渡态，后续还需要统一内容层和正式报告事实层来提升真实性与可解释性。"
        ),
    )
    _persist_annual_report(db, user_id=user_id, response=response, client=d1_client)
    return response
