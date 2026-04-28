import json
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.api.v1.page_schemas import (
    RecommendationItem,
    TodayPageResponse,
    TodayQuickNoteEntry,
    TodaySummaryData,
    WorthActingItem,
    WorthKnowingItem,
)
from app.database import get_db
from app.models.hot_topic import HotTopic
from app.models.opportunity import Opportunity, OpportunityStatus
from app.models.user import User
from app.models.user_interest import UserInterest
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.d1_content_store import D1ContentStore
from app.services.content_processing import (
    build_opportunity_ranking_score,
    build_topic_ranking_score,
    build_worth_acting_ranking_score,
    build_worth_knowing_ranking_score,
    contains_interest,
    match_interest_score,
    rank_interest_matches,
)
from app.services.content_projection import (
    build_recommended_content_item,
    build_worth_acting_item,
    build_worth_knowing_item,
    project_hot_topic_base,
    project_hot_topic_result_base,
    project_opportunity_base,
)
from app.services.d1_briefing_store import D1BriefingStore
from app.services.d1_client import D1Client, D1ClientError
from app.services.content_result import get_hot_topic_processing_result, observe_hot_topic_processing_result
from app.services.d1_hot_topic_processing_result_store import D1HotTopicProcessingResultStore
from app.services.hot_topic_processing_result_store import get_or_create_hot_topic_processing_results
from app.services.briefing_store import get_briefing_result, upsert_briefing_result
router = APIRouter()


def _date_label() -> str:
    now = datetime.now()
    week_days = ["一", "二", "三", "四", "五", "六", "日"]
    return f"{now.year}年{now.month}月{now.day}日 星期{week_days[now.weekday()]}"


def _brief_date() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _build_page_subtitle(issue_number: int, date_label: str) -> str:
    return f"第{issue_number}期 · {date_label}"


def _build_today_briefing_title() -> str:
    return "今日简报"


def _build_cached_today_response(payload: dict) -> TodayPageResponse:
    date_label = str(payload.get("date_label") or _date_label())
    issue_number = int(payload.get("issue_number") or 128)
    return TodayPageResponse(
        date_label=date_label,
        issue_number=issue_number,
        page_title="今日",
        page_subtitle=_build_page_subtitle(issue_number, date_label),
        summary=TodaySummaryData.model_validate(payload.get("summary") or {}),
        recommended_for_you=[
            RecommendationItem.model_validate(item)
            for item in (payload.get("recommended_for_you") or [])
        ],
        worth_knowing=[
            WorthKnowingItem.model_validate(item)
            for item in (payload.get("worth_knowing") or [])
        ],
        worth_acting=[
            WorthActingItem.model_validate(item)
            for item in (payload.get("worth_acting") or [])
        ],
        quick_note_entry=TodayQuickNoteEntry(
            placeholder_text="今天有什么想法值得记下来？",
            suggested_prompt="记下今天最值得以后回看的那句话。",
            draft_text=None,
        ),
    )


def _build_briefing_payload(response: TodayPageResponse) -> dict:
    return {
        "date_label": response.date_label,
        "issue_number": response.issue_number,
        "summary": response.summary.model_dump(mode="json"),
        "recommended_for_you": [item.model_dump(mode="json") for item in response.recommended_for_you],
        "worth_knowing": [item.model_dump(mode="json") for item in response.worth_knowing],
        "worth_acting": [item.model_dump(mode="json") for item in response.worth_acting],
    }


def _maybe_load_cached_today_briefing(
    db: Session,
    *,
    user_id: int,
    client: D1Client | None = None,
) -> TodayPageResponse | None:
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            payload = D1BriefingStore(client).get_briefing_result(
                user_id=user_id,
                brief_date=_brief_date(),
                brief_type="daily",
            )
        else:
            payload = get_briefing_result(
                db,
                user_id=user_id,
                brief_date=_brief_date(),
                brief_type="daily",
            )
    except D1ClientError:
        return None
    except Exception:
        return None
    if payload is None:
        return None
    return _build_cached_today_response(payload)


def _persist_today_briefing(
    db: Session,
    *,
    user_id: int,
    response: TodayPageResponse,
    client: D1Client | None = None,
) -> None:
    payload = _build_briefing_payload(response)
    try:
        if settings.D1_USE_CLOUD_AS_SOURCE:
            D1BriefingStore(client).upsert_briefing_result(
                user_id=user_id,
                brief_date=_brief_date(),
                brief_type="daily",
                issue_number=response.issue_number,
                title=_build_today_briefing_title(),
                summary_text=response.summary.summary_text,
                status="ready",
                generated_at=datetime.now().isoformat(),
                payload=payload,
            )
            return
        upsert_briefing_result(
            db,
            user_id=user_id,
            brief_date=_brief_date(),
            brief_type="daily",
            issue_number=response.issue_number,
            title=_build_today_briefing_title(),
            summary_text=response.summary.summary_text,
            status="ready",
            generated_at=datetime.now().isoformat(),
            payload=payload,
        )
    except D1ClientError:
        return
    except Exception:
        return


def _load_user_interests(user: User | None) -> list[str]:
    if not user or not user.interests:
        return []
    try:
        data = json.loads(user.interests)
        if isinstance(data, list):
            return [str(item).strip() for item in data if str(item).strip()]
    except Exception:
        return []
    return []


def _load_user_interests_from_rows(db: Session, user_id: int) -> list[str]:
    rows = (
        db.query(UserInterest)
        .filter(UserInterest.user_id == user_id, UserInterest.status == "active")
        .order_by(UserInterest.id.asc())
        .all()
    )
    return [row.interest_name for row in rows if row.interest_name]


def _build_recommendations(
    interests: list[str],
    hot_topics: list[HotTopic],
    opportunities: list[Opportunity],
    *,
    hot_topic_results: dict[int, object] | None = None,
) -> list[RecommendationItem]:
    recommendations: list[RecommendationItem] = []

    for interest in interests[:4]:
        matched_topics = rank_interest_matches(
            hot_topics,
            interest=interest,
            values_getter=lambda topic: [topic.title, topic.summary or "", *(topic.categories or []), *(topic.tags or [])],
            ranking_getter=lambda topic, match_score: build_topic_ranking_score(
                quality_score=float(topic.quality_score or 0),
                hot_value=float(topic.hot_value or 0),
                match_score=match_score,
            ),
        )

        matched_opportunities = rank_interest_matches(
            opportunities,
            interest=interest,
            values_getter=lambda item: [item.title, item.summary or "", item.category or "", *(item.tags or [])],
            ranking_getter=lambda item, match_score: build_opportunity_ranking_score(
                quality_score=float(item.quality_score or 0),
                match_score=match_score,
            ),
        )

        top_items = [
            (
                observe_hot_topic_processing_result(
                    (hot_topic_results or {}).get(int(match.item.id)) or get_hot_topic_processing_result(match.item),
                    source="today.recommended",
                ),
                build_recommended_content_item(
                    project_hot_topic_result_base(
                        (hot_topic_results or {}).get(int(match.item.id)) or get_hot_topic_processing_result(match.item),
                        match.item,
                    ),
                    match_score=match.match_score,
                    ranking_score=match.ranking_score,
                ),
            )[1]
            for match in matched_topics[:2]
        ]
        top_items.extend(
            build_recommended_content_item(
                project_opportunity_base(match.item),
                match_score=match.match_score,
                ranking_score=match.ranking_score,
            )
            for match in matched_opportunities[:1]
        )

        if top_items:
            recommendations.append(
                RecommendationItem(
                    interest_name=interest,
                    recommendation_reason=f"因为你最近关注 {interest}，Today 现在优先从真实热点和真实机会里为你筛出相关内容。",
                    related_content_count=len(top_items),
                    processing_note="当前按兴趣命中 + 内容质量分做最小排序，仍属于过渡态加工规则。",
                    top_items=top_items,
                )
            )

    if recommendations:
        return recommendations

    fallback_topics = hot_topics[:2]
    if not fallback_topics:
        return []

    return [
        RecommendationItem(
            interest_name="今日重点",
            recommendation_reason="当前还没有稳定关注项，因此先按真实热点热度给你保留今日最值得看的内容。",
            related_content_count=len(fallback_topics),
            processing_note="当前按热点热度优先保留，尚未进入正式个性化排序。",
            top_items=[
                (
                    observe_hot_topic_processing_result(
                        (hot_topic_results or {}).get(int(topic.id)) or get_hot_topic_processing_result(topic),
                        source="today.recommended",
                    ),
                    build_recommended_content_item(
                        project_hot_topic_result_base(
                            (hot_topic_results or {}).get(int(topic.id)) or get_hot_topic_processing_result(topic),
                            topic,
                        ),
                        match_score=0,
                        ranking_score=round(float(topic.quality_score or 0) * 10 + float(topic.hot_value or 0), 2),
                    ),
                )[1]
                for topic in fallback_topics
            ],
        )
    ]


def _build_worth_knowing(
    hot_topics: list[HotTopic],
    interests: list[str],
    *,
    hot_topic_results: dict[int, object] | None = None,
) -> list[WorthKnowingItem]:
    items: list[WorthKnowingItem] = []

    for topic in hot_topics[:4]:
        result_row = (hot_topic_results or {}).get(int(topic.id)) or get_hot_topic_processing_result(topic)
        base = project_hot_topic_result_base(result_row, topic)
        values = [topic.title, topic.summary or "", *(topic.categories or []), *(topic.tags or [])]
        reason = "来自今日真实热点聚合"
        matched_interest = next(
            (
                interest for interest in interests
                if contains_interest(
                    values,
                    interest,
                )
            ),
            None,
        )
        if matched_interest:
            reason = f"与你关注的 {matched_interest} 直接相关"
        match_score = match_interest_score(values, interests)
        ranking_score = build_worth_knowing_ranking_score(
            quality_score=float(topic.quality_score or 0),
            hot_value=float(topic.hot_value or 0),
            match_score=match_score,
        )

        observe_hot_topic_processing_result(
            result_row,
            source="today.worth_knowing",
        )
        items.append(
            build_worth_knowing_item(
                base,
                relevance_reason=reason,
                match_score=match_score,
                ranking_score=ranking_score,
            )
        )

    return items


def _get_d1_hot_topic_results_readonly(
    store: D1HotTopicProcessingResultStore,
    hot_topics: list[object],
) -> dict[int, object]:
    existing = store.get_many_by_source_hot_topic_ids([
        int(topic.id)
        for topic in hot_topics
        if getattr(topic, "id", None) is not None
    ])
    return {
        int(topic.id): existing.get(int(topic.id)) or get_hot_topic_processing_result(topic)
        for topic in hot_topics
        if getattr(topic, "id", None) is not None
    }


def _build_worth_acting(opportunities: list[Opportunity], interests: list[str]) -> list[WorthActingItem]:
    items: list[WorthActingItem] = []

    for opportunity in opportunities[:3]:
        base = project_opportunity_base(opportunity)
        values = [opportunity.title, opportunity.summary or "", opportunity.category or "", *(opportunity.tags or [])]
        reason = "来自今日真实机会池"
        matched_interest = next(
            (
                interest for interest in interests
                if contains_interest(
                    values,
                    interest,
                )
            ),
            None,
        )
        if matched_interest:
            reason = f"与你关注的 {matched_interest} 方向一致"
        match_score = match_interest_score(values, interests)
        ranking_score = build_worth_acting_ranking_score(
            quality_score=float(opportunity.quality_score or 0),
            match_score=match_score,
        )

        action_type = "follow"
        if opportunity.is_remote:
            action_type = "apply"

        items.append(
            build_worth_acting_item(
                base,
                action_type=action_type,
                why_relevant=reason,
                next_action_label="转成待办",
                match_score=match_score,
                ranking_score=ranking_score,
            )
        )

    return items


@router.get("/today", response_model=TodayPageResponse, summary="获取今日页聚合数据")
async def get_today_dashboard(
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    d1_client = D1Client() if settings.D1_USE_CLOUD_AS_SOURCE else None
    cached = _maybe_load_cached_today_briefing(db, user_id=user_id, client=d1_client)
    if cached is not None:
        return cached

    if settings.D1_USE_CLOUD_AS_SOURCE:
        behavior_store = D1BehaviorStore(d1_client)
        content_store = D1ContentStore(d1_client)
        hot_topic_result_store = D1HotTopicProcessingResultStore(d1_client)
        interests = behavior_store.get_user_interests(user_id)
        hot_topics = content_store.list_hot_topics(limit=8)
        hot_topic_results = _get_d1_hot_topic_results_readonly(hot_topic_result_store, hot_topics)
        opportunities = content_store.list_opportunities(limit=6)
    else:
        interests = _load_user_interests_from_rows(db, user_id)

        hot_topics = (
            db.query(HotTopic)
            .order_by(HotTopic.hot_value.desc(), HotTopic.quality_score.desc())
            .limit(8)
            .all()
        )
        hot_topic_results = get_or_create_hot_topic_processing_results(db, hot_topics)
        opportunities = (
            db.query(Opportunity)
            .filter(Opportunity.status == OpportunityStatus.ACTIVE)
            .order_by(Opportunity.quality_score.desc(), Opportunity.deadline.asc().nullslast())
            .limit(6)
            .all()
        )

    recommended_for_you = _build_recommendations(
        interests,
        hot_topics,
        opportunities,
        hot_topic_results=hot_topic_results,
    )
    worth_knowing = _build_worth_knowing(
        hot_topics,
        interests,
        hot_topic_results=hot_topic_results,
    )
    worth_acting = _build_worth_acting(opportunities, interests)

    summary = TodaySummaryData(
        summary_title="今日总述",
        summary_text=(
            f"今天已经从真实热点中筛出 {len(worth_knowing)} 条值得知道的内容，"
            f"并从真实机会池中保留了 {len(worth_acting)} 条值得行动的机会。"
            " 当前 Today 已进入真实聚合过渡态，但推荐排序和内容加工仍未完全正式化。"
        ),
        mood_tag="focus",
    )

    date_label = _date_label()
    response = TodayPageResponse(
        date_label=date_label,
        issue_number=128,
        page_title="今日",
        page_subtitle=_build_page_subtitle(128, date_label),
        summary=summary,
        recommended_for_you=recommended_for_you,
        worth_knowing=worth_knowing,
        worth_acting=worth_acting,
        quick_note_entry=TodayQuickNoteEntry(
            placeholder_text="今天有什么想法值得记下来？",
            suggested_prompt="记下今天最值得以后回看的那句话。",
            draft_text=None,
        ),
    )
    _persist_today_briefing(db, user_id=user_id, response=response, client=d1_client)
    return response
