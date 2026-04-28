from typing import Generic, List, Literal, Optional, TypeVar, Union

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


T = TypeVar("T")


class ApiListResponse(CamelModel, Generic[T]):
    total: int
    items: List[T]


class HotTopicListItem(CamelModel):
    id: int
    title: str
    summary: Optional[str] = None
    source: str
    source_url: str
    categories: List[str] = []
    tags: List[str] = []
    hot_value: int
    quality_score: float
    published_at: Optional[str] = None


class OpportunityListItem(CamelModel):
    id: int
    title: str
    type: str
    status: str
    source: str
    source_url: str
    summary: Optional[str] = None
    reward: Optional[str] = None
    location: Optional[str] = None
    is_remote: int
    deadline: Optional[str] = None
    tags: List[str] = []
    quality_score: float


class TodaySummaryData(CamelModel):
    summary_title: str
    summary_text: str
    mood_tag: Optional[str] = None


class RecommendedContentItem(CamelModel):
    content_ref: str
    id: Union[int, str]
    content_type: Literal["hot_topic", "article", "opportunity", "note"]
    title: str
    summary: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    quality_score: Optional[float] = None
    match_score: Optional[int] = None
    ranking_score: Optional[float] = None
    processing_stage: Optional[Literal["raw", "aggregated", "ranked", "partial"]] = None


class RecommendationItem(CamelModel):
    interest_name: str
    recommendation_reason: str
    related_content_count: Optional[int] = None
    processing_note: Optional[str] = None
    top_items: List[RecommendedContentItem]


class WorthKnowingItem(CamelModel):
    content_ref: str
    id: Union[int, str]
    content_type: Literal["hot_topic", "article"]
    title: str
    summary: str
    source_name: str
    source_url: Optional[str] = None
    category_labels: Optional[List[str]] = None
    relevance_reason: str
    published_at: Optional[str] = None
    hot_score: Optional[int] = None
    quality_score: Optional[float] = None
    match_score: Optional[int] = None
    ranking_score: Optional[float] = None
    processing_stage: Optional[Literal["raw", "aggregated", "ranked", "partial"]] = None


class WorthActingItem(CamelModel):
    content_ref: str
    id: Union[int, str]
    action_type: Literal["apply", "follow", "submit", "read_later", "create_todo"]
    title: str
    summary: str
    deadline: Optional[str] = None
    reward: Optional[str] = None
    difficulty: Optional[Literal["low", "medium", "high"]] = None
    why_relevant: str
    next_action_label: str
    quality_score: Optional[float] = None
    match_score: Optional[int] = None
    ranking_score: Optional[float] = None
    processing_stage: Optional[Literal["raw", "aggregated", "ranked", "partial"]] = None


class TodayQuickNoteEntry(CamelModel):
    placeholder_text: str
    suggested_prompt: Optional[str] = None
    draft_text: Optional[str] = None


class TodayPageResponse(CamelModel):
    date_label: str
    issue_number: int
    page_title: str
    page_subtitle: str
    summary: TodaySummaryData
    recommended_for_you: List[RecommendationItem]
    worth_knowing: List[WorthKnowingItem]
    worth_acting: List[WorthActingItem]
    quick_note_entry: TodayQuickNoteEntry


class RelatedContentItem(CamelModel):
    content_ref: str
    content_type: Literal["hot_topic", "article", "opportunity"]
    id: Union[int, str]
    title: str
    summary: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    relation_reason: Optional[str] = None


class UnifiedContentDetailResponse(CamelModel):
    content_ref: str
    content_type: Literal["hot_topic", "article", "opportunity"]
    id: Union[int, str]
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    author: Optional[str] = None
    category_labels: List[str] = []
    tags: List[str] = []
    published_at: Optional[str] = None
    quality_score: Optional[float] = None
    detail_state: Literal["formal", "partial"] = "partial"
    related_items: List[RelatedContentItem] = []


class ChatShortcutItem(CamelModel):
    text: str
    example_type: Literal["interest", "todo", "note", "settings"]


class ChatShortcutGroup(CamelModel):
    id: str
    title: str
    items: List[ChatShortcutItem]


class ChatUiMessage(CamelModel):
    message_id: int
    role: Literal["assistant", "user"]
    content: str
    created_at: Optional[str] = None
    status: Optional[Literal["pending", "sent", "failed"]] = None
    intent_type: Optional[str] = None


class IntentRecognitionData(CamelModel):
    recognized_intent: str
    candidate_intents: List[str] = []
    confidence: float
    requires_confirmation: bool = False
    extracted_entities: dict
    suggested_payload: Optional[dict] = None
    source_context: Optional[str] = None
    matched_by: Optional[Literal["exact", "synonym", "fuzzy", "pattern"]] = None


class ChatExecuteAffectedEntity(CamelModel):
    type: Literal["todo", "note", "interest", "settings", "unknown"]
    id: Optional[Union[int, str]] = None


class ChatQuickAction(CamelModel):
    label: str
    action: str
    deep_link: Optional[str] = None
    target_intent: Optional[str] = None


class ChatObjectChange(CamelModel):
    entity_type: Literal["todo", "note", "history", "favorite", "unknown"]
    entity_id: Optional[Union[int, str]] = None
    change: Literal["created", "kept", "cancelled", "retagged", "repointed"]
    summary: str


class ChatExecuteResponse(CamelModel):
    success: bool
    action_type: str
    candidate_intents: List[str] = []
    requires_confirmation: bool = False
    affected_entity: Optional[ChatExecuteAffectedEntity] = None
    confirmed_type: Optional[str] = None
    success_message: str
    result_summary: Optional[str] = None
    next_page_label: Optional[str] = None
    deep_link: Optional[str] = None
    source_context: Optional[str] = None
    quick_actions: Optional[List[ChatQuickAction]] = None
    change_log: Optional[List[ChatObjectChange]] = None


class ChatSessionListItem(CamelModel):
    session_id: int
    session_title: Optional[str] = None
    status: str
    source_context: Optional[str] = None
    last_message_at: Optional[str] = None
    message_count: Optional[int] = None


class ChatSessionMessageItem(CamelModel):
    message_id: int
    role: Literal["assistant", "user"]
    content: str
    created_at: Optional[str] = None
    message_state: Optional[str] = None
    intent_type: Optional[str] = None
    candidate_intents: List[str] = []
    confidence: Optional[float] = None
    source_context: Optional[str] = None
    matched_by: Optional[str] = None
    confirmed_type: Optional[str] = None
    action_type: Optional[str] = None
    result_summary: Optional[str] = None
    deep_link: Optional[str] = None
    next_page_label: Optional[str] = None
    affected_entity_type: Optional[str] = None
    affected_entity_id: Optional[Union[int, str]] = None
    change_log: Optional[List[ChatObjectChange]] = None


class ChatSessionMessagesResponse(CamelModel):
    session_id: int
    session_title: Optional[str] = None
    status: str
    source_context: Optional[str] = None
    last_message_at: Optional[str] = None
    messages: List[ChatSessionMessageItem]


class ChatPageResponse(CamelModel):
    input_text: str
    active_interests: List[str]
    messages: List[ChatUiMessage]
    example_groups: List[ChatShortcutGroup]
    latest_recognition: Optional[IntentRecognitionData] = None
    latest_execution: Optional[ChatExecuteResponse] = None


class ActionTodoItem(CamelModel):
    todo_id: int
    title: str
    source_type: Optional[Literal["chat", "content", "manual"]] = None
    source_ref_id: Optional[Union[int, str]] = None
    due_label: Optional[str] = None
    priority: Literal["low", "medium", "high", "urgent"]
    done: bool


class SavedItem(CamelModel):
    saved_id: int
    title: str
    content_type: Literal["hot_topic", "article", "opportunity"]
    source_name: Optional[str] = None
    saved_at: Optional[str] = None
    urgency_label: Optional[str] = None


class FollowingItem(CamelModel):
    follow_id: int
    title: str
    follow_status: Literal["new", "watching", "applied", "waiting", "completed"]
    deadline: Optional[str] = None
    progress_text: Optional[str] = None
    next_step: Optional[str] = None


class ReminderSummaryItem(CamelModel):
    id: Union[int, str]
    title: str
    remind_at: Optional[str] = None
    type: Literal["todo", "opportunity", "digest"]


class ReminderSummaryData(CamelModel):
    push_time: str
    upcoming_reminders: List[ReminderSummaryItem]
    do_not_disturb: Optional[bool] = None


class ActionsOverviewResponse(CamelModel):
    filter_type: Optional[Literal["today", "future", "completed"]] = None
    loading: Optional[bool] = None
    error: Optional[str] = None
    today_todos: List[ActionTodoItem]
    future_todos: List[ActionTodoItem]
    completed_todos: List[ActionTodoItem]
    saved_for_later: List[SavedItem]
    following_items: List[FollowingItem]
    reminder_summary: ReminderSummaryData
    streak_days: Optional[int] = None
    checked_in_today: bool = False


class ActionCheckInResponse(CamelModel):
    success: bool
    checked_in_today: bool
    streak_days: int
    message: str


class WeeklyGrowthSummary(CamelModel):
    week_label: str
    active_interest_changes: Optional[str] = None
    completed_actions: Optional[int] = None
    new_notes_count: Optional[int] = None
    growth_summary: str


class GrowthKeywordItem(CamelModel):
    keyword: str
    weight: Optional[int] = None
    trend: Optional[Literal["up", "down", "stable"]] = None


class PersonaSnapshot(CamelModel):
    persona_summary: str
    persona_version: Optional[str] = None
    updated_at: Optional[str] = None


class HistoryPreviewItem(CamelModel):
    history_type: Literal["briefing", "journal", "action"]
    history_title: str
    history_date: str


class ReportEntryItem(CamelModel):
    report_id: Optional[int] = None
    report_type: Literal["weekly", "monthly", "annual"]
    report_title: str
    generated_at: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    available: bool


class GrowthOverviewResponse(CamelModel):
    user_name: str
    streak_days: Optional[int] = None
    total_thoughts: Optional[int] = None
    weekly_summary: WeeklyGrowthSummary
    keywords: List[GrowthKeywordItem]
    persona: PersonaSnapshot
    recent_history_items: List[HistoryPreviewItem]
    reports: List[ReportEntryItem]


class ReportOverviewData(CamelModel):
    period: str
    viewed: int
    recorded: int
    collected: int
    completed: int
    streak: int


class ReportHeatData(CamelModel):
    current: int
    previous: int
    change: int
    trend: Literal["up", "down", "stable"]


class ReportHotSpot(CamelModel):
    title: str
    content_ref: Optional[str] = None
    discussion_count: int
    user_participation: int
    summary: str


class ReportAttentionChange(CamelModel):
    change: int
    new_topics: List[str]


class ReportTopicTrend(CamelModel):
    id: str
    icon: str
    title: str
    heat_data: ReportHeatData
    hot_spot: ReportHotSpot
    insights: List[str]
    user_attention_change: Optional[ReportAttentionChange] = None


class ReportGrowthStats(CamelModel):
    viewed: int
    recorded: int
    collected: int
    completed: int


class ReportGrowthComparison(CamelModel):
    current: List[int]
    previous: List[int]
    change: List[int]


class ReportGrowthTrajectory(CamelModel):
    title: str
    description: str
    keywords: List[str]


class ReportThoughtItem(CamelModel):
    id: int
    date: str
    content: str


class ReportGrowthData(CamelModel):
    stats: ReportGrowthStats
    comparison: Optional[ReportGrowthComparison] = None
    trajectory: ReportGrowthTrajectory
    selected_thoughts: List[ReportThoughtItem]
    suggestions: List[str]


class ReportAnnualStats(CamelModel):
    topics_viewed: int
    opinions_posted: int
    plans_completed: int
    days_active: int


class AnnualReportData(CamelModel):
    year: int
    stats: ReportAnnualStats
    keywords: List[str]
    interests: List[str]
    thinking_section: str
    action_section: str
    closing: str


class PeriodicReportResponse(CamelModel):
    report_type: Literal["weekly", "monthly"]
    overview: ReportOverviewData
    topic_trends: List[ReportTopicTrend]
    growth: ReportGrowthData


class ReportsAvailabilityResponse(CamelModel):
    reports: List[ReportEntryItem]
