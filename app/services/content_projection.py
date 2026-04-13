from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Literal

from app.api.v1.page_schemas import (
    RecommendedContentItem,
    RelatedContentItem,
    ReportAttentionChange,
    ReportHeatData,
    ReportHotSpot,
    ReportTopicTrend,
    UnifiedContentDetailResponse,
    WorthActingItem,
    WorthKnowingItem,
)


ContentType = Literal["hot_topic", "opportunity", "article"]


@dataclass(slots=True)
class BaseContentProjection:
    content_ref: str | None
    id: int | str | None
    content_type: ContentType
    title: str
    summary: str | None
    content: str | None = None
    source_name: str | None = None
    source_url: str | None = None
    author: str | None = None
    category_labels: list[str] | None = None
    tags: list[str] | None = None
    quality_score: float = 0.0
    published_at: str | None = None
    hot_score: int | None = None
    deadline: str | None = None
    reward: str | None = None

    def as_payload(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["category_labels"] = self.category_labels or []
        payload["tags"] = self.tags or []
        return payload


def build_content_ref(content_type: str, item_id: int | str | None) -> str | None:
    if item_id is None:
        return None
    return f"{content_type}:{item_id}"


def normalize_label_list(values: Any, *, limit: int | None = None) -> list[str]:
    if values is None:
        return []
    if not isinstance(values, list):
        values = [values]
    result = [str(item) for item in values if str(item).strip()]
    return result[:limit] if limit is not None else result


def normalize_summary(value: Any, fallback: str | None = None) -> str | None:
    text = str(value).strip() if value is not None else ""
    if text:
        return text
    return fallback


def normalize_score(value: Any) -> float:
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def normalize_datetime(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _build_detail_fallback_content(base: BaseContentProjection) -> str:
    source_name = _normalize_text(base.source_name) or "未知来源"
    summary = _normalize_text(base.summary)
    category_text = "、".join(base.category_labels or [])
    tag_text = "、".join(base.tags or [])
    published_text = _normalize_text(base.published_at)[:10]
    deadline_text = _normalize_text(base.deadline)[:10]

    lines: list[str] = []
    if base.content_type == "hot_topic":
        lines.append(f"《{base.title}》来自 {source_name}。")
        if summary:
            lines.append(summary)
        if category_text:
            lines.append(f"当前归类：{category_text}。")
        if tag_text:
            lines.append(f"相关标签：{tag_text}。")
        if published_text:
            lines.append(f"发布时间：{published_text}。")
        lines.append("完整正文当前尚未接入，但最小事实层信息已经保留，可继续通过相关推荐或原文入口深入。")
        return "\n\n".join(lines)

    if base.content_type == "opportunity":
        lines.append(f"《{base.title}》是一条来自 {source_name} 的机会信息。")
        if summary:
            lines.append(summary)
        meta_parts: list[str] = []
        if _normalize_text(base.reward):
            meta_parts.append(f"回报：{_normalize_text(base.reward)}")
        if deadline_text:
            meta_parts.append(f"截止：{deadline_text}")
        if category_text:
            meta_parts.append(f"方向：{category_text}")
        if tag_text:
            meta_parts.append(f"标签：{tag_text}")
        if meta_parts:
            lines.append("；".join(meta_parts) + "。")
        lines.append("完整机会正文当前尚未接入，但这条内容已经具备最小可读详情，可继续转成待办或进入后续跟进。")
        return "\n\n".join(lines)

    lines.append(f"《{base.title}》来自 {source_name}。")
    if summary:
        lines.append(summary)
    if category_text:
        lines.append(f"主题归类：{category_text}。")
    if tag_text:
        lines.append(f"相关标签：{tag_text}。")
    if published_text:
        lines.append(f"发布时间：{published_text}。")
    lines.append("当前原文正文尚未接入，先保留最小可读内容层，后续可继续通过原文链接查看完整内容。")
    return "\n\n".join(lines)


def project_hot_topic_base(topic: Any) -> BaseContentProjection:
    return BaseContentProjection(
        content_ref=build_content_ref("hot_topic", getattr(topic, "id", None)),
        id=getattr(topic, "id", None),
        content_type="hot_topic",
        title=getattr(topic, "title", ""),
        summary=normalize_summary(getattr(topic, "summary", None)),
        content=getattr(topic, "content", None),
        source_name=getattr(topic, "source", None),
        source_url=getattr(topic, "source_url", None),
        author=getattr(topic, "author", None),
        category_labels=normalize_label_list(getattr(topic, "categories", None)),
        tags=normalize_label_list(getattr(topic, "tags", None)),
        quality_score=normalize_score(getattr(topic, "quality_score", None)),
        published_at=normalize_datetime(getattr(topic, "published_at", None)),
        hot_score=int(getattr(topic, "hot_value", 0) or 0),
    )


def project_opportunity_base(opportunity: Any) -> BaseContentProjection:
    return BaseContentProjection(
        content_ref=build_content_ref("opportunity", getattr(opportunity, "id", None)),
        id=getattr(opportunity, "id", None),
        content_type="opportunity",
        title=getattr(opportunity, "title", ""),
        summary=normalize_summary(getattr(opportunity, "summary", None)),
        content=getattr(opportunity, "content", None),
        source_name=getattr(opportunity, "source", None),
        source_url=getattr(opportunity, "source_url", None),
        category_labels=normalize_label_list(getattr(opportunity, "category", None)),
        tags=normalize_label_list(getattr(opportunity, "tags", None)),
        quality_score=normalize_score(getattr(opportunity, "quality_score", None)),
        published_at=normalize_datetime(getattr(opportunity, "published_at", None)),
        deadline=normalize_datetime(getattr(opportunity, "deadline", None)),
        reward=getattr(opportunity, "reward", None),
    )


def project_article_base(article: Any) -> BaseContentProjection:
    return BaseContentProjection(
        content_ref=build_content_ref("article", getattr(article, "id", None)),
        id=getattr(article, "id", None),
        content_type="article",
        title=getattr(article, "title", ""),
        summary=normalize_summary(getattr(article, "summary", None)),
        content=getattr(article, "content", None),
        source_name=getattr(article, "source_name", None),
        source_url=getattr(article, "source_url", None),
        author=getattr(article, "author", None),
        category_labels=normalize_label_list(getattr(article, "category", None)),
        tags=normalize_label_list(getattr(article, "tags", None)),
        quality_score=normalize_score(getattr(article, "quality_score", None)),
        published_at=normalize_datetime(getattr(article, "publish_time", None)),
    )


def project_content_result_base(result: Any, article: Any) -> BaseContentProjection:
    source_item_id = getattr(result, "source_item_id", None)
    if source_item_id is None:
        source_item_id = getattr(result, "source_article_id", None)
    return BaseContentProjection(
        content_ref=getattr(result, "source_content_ref", None),
        id=source_item_id,
        content_type="article",
        title=str(getattr(result, "normalized_title", "") or ""),
        summary=getattr(result, "normalized_summary", None),
        content=getattr(article, "content", None),
        source_name=getattr(article, "source_name", None),
        source_url=getattr(article, "source_url", None),
        author=getattr(article, "author", None),
        category_labels=normalize_label_list(getattr(result, "normalized_category_labels", None)),
        tags=normalize_label_list(getattr(result, "normalized_tags", None)),
        quality_score=normalize_score(getattr(result, "quality_score", None)),
        published_at=getattr(result, "published_at", None),
    )


def project_hot_topic_result_base(result: Any, topic: Any) -> BaseContentProjection:
    source_item_id = getattr(result, "source_item_id", None)
    if source_item_id is None:
        source_item_id = getattr(result, "source_hot_topic_id", None)
    return BaseContentProjection(
        content_ref=getattr(result, "source_content_ref", None),
        id=source_item_id,
        content_type="hot_topic",
        title=str(getattr(result, "normalized_title", "") or ""),
        summary=getattr(result, "normalized_summary", None),
        content=getattr(topic, "content", None),
        source_name=getattr(topic, "source", None),
        source_url=getattr(topic, "source_url", None),
        author=getattr(topic, "author", None),
        category_labels=normalize_label_list(getattr(result, "normalized_category_labels", None)),
        tags=normalize_label_list(getattr(result, "normalized_tags", None)),
        quality_score=normalize_score(getattr(result, "quality_score", None)),
        published_at=getattr(result, "published_at", None),
        hot_score=int(getattr(topic, "hot_value", 0) or 0),
    )


def project_hot_topic(topic: Any) -> dict[str, Any]:
    return project_hot_topic_base(topic).as_payload()


def project_opportunity(opportunity: Any) -> dict[str, Any]:
    return project_opportunity_base(opportunity).as_payload()


def project_article(article: Any) -> dict[str, Any]:
    return project_article_base(article).as_payload()


def build_recommended_content_item(
    base: BaseContentProjection,
    *,
    match_score: int,
    ranking_score: float,
    processing_stage: Literal["raw", "aggregated", "ranked", "transitional"] = "ranked",
) -> RecommendedContentItem:
    return RecommendedContentItem(
        content_ref=base.content_ref or "",
        id=base.id,
        content_type=base.content_type,
        title=base.title,
        summary=base.summary,
        source_name=base.source_name,
        source_url=base.source_url,
        quality_score=base.quality_score,
        match_score=match_score,
        ranking_score=ranking_score,
        processing_stage=processing_stage,
    )


def build_worth_knowing_item(
    base: BaseContentProjection,
    *,
    relevance_reason: str,
    match_score: int,
    ranking_score: float,
    processing_stage: Literal["raw", "aggregated", "ranked", "transitional"] = "ranked",
) -> WorthKnowingItem:
    return WorthKnowingItem(
        content_ref=base.content_ref or "",
        id=base.id,
        content_type=base.content_type,
        title=base.title,
        summary=base.summary or "暂无摘要",
        source_name=base.source_name or "",
        source_url=base.source_url,
        category_labels=(base.category_labels or [])[:3],
        relevance_reason=relevance_reason,
        published_at=base.published_at,
        hot_score=base.hot_score,
        quality_score=base.quality_score,
        match_score=match_score,
        ranking_score=ranking_score,
        processing_stage=processing_stage,
    )


def build_worth_acting_item(
    base: BaseContentProjection,
    *,
    action_type: Literal["apply", "follow", "submit", "read_later", "create_todo"],
    why_relevant: str,
    next_action_label: str,
    match_score: int,
    ranking_score: float,
    difficulty: Literal["low", "medium", "high"] = "medium",
    processing_stage: Literal["raw", "aggregated", "ranked", "transitional"] = "ranked",
) -> WorthActingItem:
    return WorthActingItem(
        content_ref=base.content_ref or "",
        id=base.id,
        action_type=action_type,
        title=base.title,
        summary=base.summary or "当前这条机会值得尽快转成待办进一步跟进。",
        deadline=base.deadline,
        reward=base.reward,
        difficulty=difficulty,
        why_relevant=why_relevant,
        next_action_label=next_action_label,
        quality_score=base.quality_score,
        match_score=match_score,
        ranking_score=ranking_score,
        processing_stage=processing_stage,
    )


def build_related_content_item(
    base: BaseContentProjection,
    *,
    relation_reason: str,
) -> RelatedContentItem:
    return RelatedContentItem(
        content_ref=base.content_ref or "",
        content_type=base.content_type,
        id=base.id,
        title=base.title,
        summary=base.summary,
        source_name=base.source_name,
        source_url=base.source_url,
        relation_reason=relation_reason,
    )


def build_content_detail_view(
    base: BaseContentProjection,
    *,
    related_items: list[RelatedContentItem],
    detail_state: Literal["formal", "transitional"] = "transitional",
) -> UnifiedContentDetailResponse:
    content = _normalize_text(base.content) or _build_detail_fallback_content(base)
    return UnifiedContentDetailResponse(
        content_ref=base.content_ref or "",
        content_type=base.content_type,
        id=base.id,
        title=base.title,
        summary=base.summary,
        content=content,
        source_name=base.source_name,
        source_url=base.source_url,
        author=base.author,
        category_labels=base.category_labels or [],
        tags=base.tags or [],
        published_at=base.published_at,
        quality_score=base.quality_score,
        detail_state=detail_state,
        related_items=related_items,
    )


def build_report_attention_change(*, change: int, new_topics: list[str]) -> ReportAttentionChange:
    return ReportAttentionChange(change=change, new_topics=new_topics)


def build_report_heat_data(
    *,
    current: int,
    previous: int,
    change: int,
    trend: Literal["up", "down", "stable"],
) -> ReportHeatData:
    return ReportHeatData(current=current, previous=previous, change=change, trend=trend)


def build_report_hot_spot(
    *,
    title: str,
    content_ref: str | None,
    discussion_count: int,
    user_participation: int,
    summary: str,
) -> ReportHotSpot:
    return ReportHotSpot(
        title=title,
        content_ref=content_ref,
        discussion_count=discussion_count,
        user_participation=user_participation,
        summary=summary,
    )


def build_report_topic_trend(
    *,
    trend_id: str,
    icon: str,
    title: str,
    current_heat: int,
    previous_heat: int,
    change: int,
    trend: Literal["up", "down", "stable"],
    hot_spot_title: str,
    hot_spot_content_ref: str | None,
    discussion_count: int,
    user_participation: int,
    hot_spot_summary: str,
    insights: list[str],
    attention_change: ReportAttentionChange | None = None,
) -> ReportTopicTrend:
    return ReportTopicTrend(
        id=trend_id,
        icon=icon,
        title=title,
        heat_data=build_report_heat_data(
            current=current_heat,
            previous=previous_heat,
            change=change,
            trend=trend,
        ),
        hot_spot=build_report_hot_spot(
            title=hot_spot_title,
            content_ref=hot_spot_content_ref,
            discussion_count=discussion_count,
            user_participation=user_participation,
            summary=hot_spot_summary,
        ),
        insights=insights,
        user_attention_change=attention_change,
    )
