import type {
  ApiListResponse,
  HotTopicListItem,
  OpportunityListItem,
  TodoApiItem,
  FavoriteApiItem,
  NoteApiItem,
  HistoryApiItem,
  ChatExecuteResult,
  ChatSessionMessagesData,
  ChatSessionSummary,
  GrowthOverviewData,
  JournalOverviewData,
  ActionsOverviewData,
  ActionCheckInData,
  TodayPageData,
  UnifiedContentDetailData,
  PeriodicReportData,
  AnnualReportData,
  ReportEntryItem,
} from '../types/page-data';
import type { IntentType } from '../utils/intentParser';

const DEFAULT_API_ORIGIN = import.meta.env.DEV
  ? ''
  : 'https://ai-briefing-assistant.aibriefing2026.workers.dev';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;
const API_CONFIG_BASE_URL = `${API_ORIGIN}/api-config`;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface ContentListResponse<T> {
  total: number;
  data: T[];
}

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  nickname?: string | null;
}

export interface AuthEnvelope {
  user: AuthUser;
}

export interface IntentResponse {
  type: IntentType;
  entities: Record<string, string | string[]>;
  confidence: number;
  matchedBy: 'exact' | 'synonym' | 'fuzzy' | 'pattern';
  candidateIntents?: IntentType[];
  requiresConfirmation?: boolean;
  suggestedPayload?: Record<string, string | string[]>;
  sourceContext?: string;
}

export interface FavoriteCreatePayload {
  item_type?: string;
  item_id?: number;
  content_ref?: string;
  item_title: string;
  item_summary?: string | null;
  item_source?: string | null;
  item_url?: string | null;
}

export interface NoteCreatePayload {
  content: string;
  source_type?: string;
  source_id?: number | null;
  tags?: string[];
}

export interface FeedbackCreatePayload {
  feedback_type: 'bug' | 'suggestion' | 'other';
  content: string;
  source_page?: string | null;
}

export interface FeedbackSubmission {
  id: number;
  feedbackType: 'bug' | 'suggestion' | 'other';
  content: string;
  sourcePage?: string | null;
  status: string;
  createdAt: string;
}

export interface UserSettingsPayload {
  morning_brief_time: string;
  evening_brief_time: string;
  do_not_disturb_enabled: boolean;
  do_not_disturb_start?: string | null;
  do_not_disturb_end?: string | null;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

export interface UserAiProviderPayload {
  provider: string | null;
  provider_label: string | null;
  api_key_masked: string | null;
  has_api_key: boolean;
  is_configured: boolean;
  api_url: string | null;
  model: string | null;
  updated_at: string | null;
}

export interface UserProfilePayload {
  active_interests: string[];
  notes_count: number;
  favorites_count: number;
  completed_todos: number;
  total_todos: number;
  history_count: number;
  radar_metrics: Record<string, number>;
  persona_summary: string;
  growth_keywords: string[];
}

export interface DailyDigestItem {
  id: number;
  taskId: number;
  resultRef: string;
  profileId?: string | null;
  providerName?: string | null;
  modelName?: string | null;
  promptVersion?: string | null;
  summaryTitle?: string | null;
  summaryText?: string | null;
  keyPoints: string[];
  riskFlags: string[];
  citations: Array<{ title?: string; url?: string }>;
  sourceUrl?: string | null;
  sourceName?: string | null;
  title?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DailyDigestResponse {
  profileId: string;
  mode?: string;
  total: number;
  items: DailyDigestItem[];
}

export interface DigestConsultResponse {
  resultRef: string;
  question: string;
  answer: string;
  evidence: string[];
  uncertainties: string[];
  suggestedNextActions: string[];
  providerName: string;
  modelName: string;
}

type UnknownRecord = Record<string, unknown>;

const CONTENT_TYPES = new Set(['hot_topic', 'article', 'opportunity']);
const RECOMMENDED_CONTENT_TYPES = new Set(['hot_topic', 'article', 'opportunity', 'note']);
const WORTH_KNOWING_CONTENT_TYPES = new Set(['hot_topic', 'article']);
const TODAY_LEAD_ITEM_TYPES = new Set(['hot_topic', 'opportunity', 'briefing']);
const TODAY_EXTENSION_SLOT_TYPES = new Set(['ask', 'todo', 'save', 'review']);
const PERIODIC_REPORT_TYPES = new Set(['weekly', 'monthly']);
const ACTION_TYPES = new Set(['apply', 'follow', 'submit', 'read_later', 'create_todo']);
const TODO_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const TODO_SOURCE_TYPES = new Set(['chat', 'content', 'manual']);
const SUGGESTED_ACTION_SOURCES = new Set(['todo', 'opportunity_follow', 'saved_item']);
const FOLLOW_STATUSES = new Set(['new', 'watching', 'applied', 'waiting', 'completed']);
const REMINDER_TYPES = new Set(['todo', 'opportunity', 'digest']);
const REPORT_TYPES = new Set(['weekly', 'monthly', 'annual']);
const REPORT_TRENDS = new Set(['up', 'down', 'stable']);
const GROWTH_KEYWORD_TRENDS = new Set(['up', 'down', 'stable']);
const HISTORY_TYPES = new Set(['briefing', 'journal', 'action']);
const DETAIL_STATES = new Set(['formal', 'partial']);
const CHAT_ROLES = new Set(['assistant', 'user']);
const CHAT_OBJECT_ENTITY_TYPES = new Set(['todo', 'note', 'history', 'favorite', 'unknown']);
const CHAT_OBJECT_CHANGE_TYPES = new Set(['created', 'kept', 'cancelled', 'retagged', 'repointed']);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isStringOrNumber(value: unknown): value is string | number {
  return isString(value) || isNumber(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || isString(value);
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || value === null || isNumber(value);
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || value === null || isStringArray(value);
}

function isEnumValue<T extends string>(value: unknown, options: Set<T>): value is T {
  return isString(value) && options.has(value as T);
}

function isRecommendationItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.interestName) || !isString(value.recommendationReason)) return false;
  if (!Array.isArray(value.topItems)) return false;
  return value.topItems.every((item) => {
    if (!isRecord(item)) return false;
    return isString(item.contentRef)
      && isStringOrNumber(item.id)
      && isEnumValue(item.contentType, RECOMMENDED_CONTENT_TYPES)
      && isString(item.title);
  });
}

function isWorthKnowingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isStringOrNumber(value.id)
    && isEnumValue(value.contentType, WORTH_KNOWING_CONTENT_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && isString(value.sourceName)
    && isString(value.relevanceReason);
}

function isWorthActingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isStringOrNumber(value.id)
    && isEnumValue(value.actionType, ACTION_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && isString(value.whyRelevant)
    && isString(value.nextActionLabel);
}

function isTodayLeadItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (value.contentRef === undefined || isString(value.contentRef))
    && isEnumValue(value.itemType, TODAY_LEAD_ITEM_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && (value.sourceLabel === undefined || isString(value.sourceLabel))
    && (value.relevanceLabel === undefined || isString(value.relevanceLabel))
    && isString(value.primaryActionLabel)
    && (value.secondaryActionLabel === undefined || isString(value.secondaryActionLabel));
}

function isTodayExtensionSlot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.slotType, TODAY_EXTENSION_SLOT_TYPES)
    && isString(value.title)
    && isString(value.description)
    && isString(value.actionLabel)
    && (value.deepLink === undefined || isString(value.deepLink))
    && (value.sourceContentRef === undefined || isString(value.sourceContentRef));
}

function isTodayPageData(value: unknown): value is TodayPageData {
  if (!isRecord(value)) return false;
  if (!isString(value.dateLabel) || !isNumber(value.issueNumber) || !isString(value.pageTitle) || !isString(value.pageSubtitle)) {
    return false;
  }
  if (!isRecord(value.summary) || !isString(value.summary.summaryTitle) || !isString(value.summary.summaryText)) {
    return false;
  }
  if (!(value.leadItem === undefined || value.leadItem === null || isTodayLeadItem(value.leadItem))) {
    return false;
  }
  if (!(value.dailyAngle === undefined || isString(value.dailyAngle))) {
    return false;
  }
  if (value.freshness !== undefined) {
    if (!isRecord(value.freshness) || !isNumber(value.freshness.sourceCount)) return false;
    if (!(value.freshness.latestPublishedAt === undefined || isString(value.freshness.latestPublishedAt))) return false;
    if (!(value.freshness.generatedAt === undefined || isString(value.freshness.generatedAt))) return false;
  }
  if (!(value.extensionSlots === undefined || (Array.isArray(value.extensionSlots) && value.extensionSlots.every(isTodayExtensionSlot)))) {
    return false;
  }
  if (!Array.isArray(value.recommendedForYou) || !value.recommendedForYou.every(isRecommendationItem)) {
    return false;
  }
  if (!Array.isArray(value.worthKnowing) || !value.worthKnowing.every(isWorthKnowingItem)) {
    return false;
  }
  if (!Array.isArray(value.worthActing) || !value.worthActing.every(isWorthActingItem)) {
    return false;
  }
  if (!isRecord(value.quickNoteEntry) || !isString(value.quickNoteEntry.placeholderText)) {
    return false;
  }
  return true;
}

function isRelatedItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isOptionalString(value.summary)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.relationReason);
}

function isUnifiedContentDetailData(value: unknown): value is UnifiedContentDetailData {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isOptionalString(value.summary)
    && isOptionalString(value.content)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.author)
    && isStringArray(value.categoryLabels)
    && isStringArray(value.tags)
    && isOptionalString(value.publishedAt)
    && isOptionalNumber(value.qualityScore)
    && isEnumValue(value.detailState, DETAIL_STATES)
    && isOptionalString(value.detailStateReason)
    && isOptionalStringArray(value.missingFields)
    && Array.isArray(value.relatedItems)
    && value.relatedItems.every(isRelatedItem);
}

function isActionTodoItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.todoId)
    && isString(value.title)
    && isEnumValue(value.priority, TODO_PRIORITIES)
    && isBoolean(value.done)
    && (value.sourceType === undefined || isEnumValue(value.sourceType, TODO_SOURCE_TYPES))
    && (value.sourceRefId === undefined || isStringOrNumber(value.sourceRefId))
    && (value.dueLabel === undefined || isString(value.dueLabel));
}

function isSavedItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.savedId)
    && isString(value.title)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && (value.sourceName === undefined || isString(value.sourceName))
    && (value.savedAt === undefined || isString(value.savedAt))
    && (value.urgencyLabel === undefined || isString(value.urgencyLabel));
}

function isFollowingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.followId)
    && isString(value.title)
    && isEnumValue(value.followStatus, FOLLOW_STATUSES)
    && (value.deadline === undefined || isString(value.deadline))
    && (value.progressText === undefined || isString(value.progressText))
    && (value.nextStep === undefined || isString(value.nextStep));
}

function isReminderSummaryItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isStringOrNumber(value.id)
    && isString(value.title)
    && isEnumValue(value.type, REMINDER_TYPES)
    && (value.remindAt === undefined || isString(value.remindAt));
}

function isNoteApiItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && isString(value.content)
    && isString(value.source_type)
    && isOptionalNumber(value.source_id)
    && Array.isArray(value.tags)
    && value.tags.every(isString)
    && isString(value.created_at);
}

function isSuggestedActionItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.source, SUGGESTED_ACTION_SOURCES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isString(value.reason)
    && isString(value.primaryActionLabel)
    && (value.priorityLabel === undefined || isString(value.priorityLabel))
    && (value.dueLabel === undefined || isString(value.dueLabel))
    && (value.deepLink === undefined || isString(value.deepLink));
}

function isJournalProgressItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.title)
    && isString(value.meta)
    && isString(value.detail)
    && (value.deepLink === undefined || isString(value.deepLink));
}

function isJournalKeptItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.title)
    && isString(value.sourceLabel)
    && isString(value.detail)
    && (value.createdAt === undefined || isString(value.createdAt))
    && (value.deepLink === undefined || isString(value.deepLink));
}

function isJournalOverviewData(value: unknown): value is JournalOverviewData {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.review)) return false;
  return isNumber(value.summary.expressionCount)
    && isNumber(value.summary.progressCount)
    && isNumber(value.summary.keptCount)
    && isNumber(value.summary.reviewCount)
    && isString(value.summary.summaryText)
    && Array.isArray(value.recentNotes)
    && value.recentNotes.every(isNoteApiItem)
    && Array.isArray(value.progressItems)
    && value.progressItems.every(isJournalProgressItem)
    && Array.isArray(value.keptItems)
    && value.keptItems.every(isJournalKeptItem)
    && isNumber(value.review.availableCount)
    && Array.isArray(value.review.keywords)
    && value.review.keywords.every(isString)
    && isString(value.review.summaryText);
}

function isActionsOverviewData(value: unknown): value is ActionsOverviewData {
  if (!isRecord(value)) return false;
  return Array.isArray(value.todayTodos)
    && value.todayTodos.every(isActionTodoItem)
    && Array.isArray(value.futureTodos)
    && value.futureTodos.every(isActionTodoItem)
    && Array.isArray(value.completedTodos)
    && value.completedTodos.every(isActionTodoItem)
    && Array.isArray(value.savedForLater)
    && value.savedForLater.every(isSavedItem)
    && Array.isArray(value.followingItems)
    && value.followingItems.every(isFollowingItem)
    && isRecord(value.reminderSummary)
    && isString(value.reminderSummary.pushTime)
    && Array.isArray(value.reminderSummary.upcomingReminders)
    && value.reminderSummary.upcomingReminders.every(isReminderSummaryItem)
    && isBoolean(value.checkedInToday)
    && (value.topPriority === undefined || value.topPriority === null || isSuggestedActionItem(value.topPriority))
    && (value.suggestedNextActions === undefined
      || (Array.isArray(value.suggestedNextActions) && value.suggestedNextActions.every(isSuggestedActionItem)));
}

function isGrowthKeywordItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.keyword)
    && isOptionalNumber(value.weight)
    && (value.trend === undefined || value.trend === null || isEnumValue(value.trend, GROWTH_KEYWORD_TRENDS));
}

function isWeeklyGrowthSummary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.weekLabel)
    && isString(value.growthSummary)
    && (value.activeInterestChanges === undefined || isString(value.activeInterestChanges))
    && (value.completedActions === undefined || isNumber(value.completedActions))
    && (value.newNotesCount === undefined || isNumber(value.newNotesCount));
}

function isPersonaSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.personaSummary)
    && (value.personaVersion === undefined || isString(value.personaVersion))
    && (value.updatedAt === undefined || isString(value.updatedAt));
}

function isHistoryPreviewItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.historyType, HISTORY_TYPES)
    && isString(value.historyTitle)
    && isString(value.historyDate);
}

function isGrowthOverviewData(value: unknown): value is GrowthOverviewData {
  if (!isRecord(value)) return false;
  return isString(value.userName)
    && (value.streakDays === undefined || isNumber(value.streakDays))
    && (value.totalThoughts === undefined || isNumber(value.totalThoughts))
    && isWeeklyGrowthSummary(value.weeklySummary)
    && Array.isArray(value.keywords)
    && value.keywords.every(isGrowthKeywordItem)
    && isPersonaSnapshot(value.persona)
    && Array.isArray(value.recentHistoryItems)
    && value.recentHistoryItems.every(isHistoryPreviewItem)
    && Array.isArray(value.reports)
    && value.reports.every(isReportEntryItem);
}

function isDigestCitation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isOptionalString(value.title) && isOptionalString(value.url);
}

function isDailyDigestItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && isNumber(value.taskId)
    && isString(value.resultRef)
    && isOptionalString(value.profileId)
    && isOptionalString(value.providerName)
    && isOptionalString(value.modelName)
    && isOptionalString(value.promptVersion)
    && isOptionalString(value.summaryTitle)
    && isOptionalString(value.summaryText)
    && isStringArray(value.keyPoints)
    && isStringArray(value.riskFlags)
    && Array.isArray(value.citations)
    && value.citations.every(isDigestCitation)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.title)
    && isOptionalString(value.publishedAt)
    && isString(value.createdAt)
    && isOptionalString(value.updatedAt);
}

function isDailyDigestResponse(value: unknown): value is DailyDigestResponse {
  if (!isRecord(value)) return false;
  return isString(value.profileId)
    && (value.mode === undefined || isString(value.mode))
    && isNumber(value.total)
    && Array.isArray(value.items)
    && value.items.every(isDailyDigestItem);
}

function isChatObjectChange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.entityType, CHAT_OBJECT_ENTITY_TYPES)
    && (value.entityId === undefined || isStringOrNumber(value.entityId))
    && isEnumValue(value.change, CHAT_OBJECT_CHANGE_TYPES)
    && isString(value.summary);
}

function isChatSessionSummary(value: unknown): value is ChatSessionSummary {
  if (!isRecord(value)) return false;
  return isNumber(value.sessionId)
    && isString(value.status)
    && (value.sessionTitle === undefined || isOptionalString(value.sessionTitle))
    && (value.sourceContext === undefined || isOptionalString(value.sourceContext))
    && (value.lastMessageAt === undefined || isOptionalString(value.lastMessageAt))
    && (value.messageCount === undefined || isOptionalNumber(value.messageCount));
}

function isChatSessionSummaryList(value: unknown): value is ChatSessionSummary[] {
  return Array.isArray(value) && value.every(isChatSessionSummary);
}

function isChatSessionMessage(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.messageId)
    && isEnumValue(value.role, CHAT_ROLES)
    && isString(value.content)
    && isOptionalString(value.createdAt)
    && isOptionalString(value.messageState)
    && isOptionalString(value.intentType)
    && isOptionalStringArray(value.candidateIntents)
    && isOptionalNumber(value.confidence)
    && isOptionalString(value.sourceContext)
    && isOptionalString(value.matchedBy)
    && isOptionalString(value.confirmedType)
    && isOptionalString(value.actionType)
    && isOptionalString(value.resultSummary)
    && isOptionalString(value.deepLink)
    && isOptionalString(value.nextPageLabel)
    && isOptionalString(value.affectedEntityType)
    && (value.affectedEntityId === undefined || value.affectedEntityId === null || isStringOrNumber(value.affectedEntityId))
    && (value.changeLog === undefined || value.changeLog === null || (Array.isArray(value.changeLog) && value.changeLog.every(isChatObjectChange)));
}

function isChatSessionMessagesData(value: unknown): value is ChatSessionMessagesData {
  if (!isRecord(value)) return false;
  return isNumber(value.sessionId)
    && isString(value.status)
    && (value.sessionTitle === undefined || isOptionalString(value.sessionTitle))
    && (value.sourceContext === undefined || isOptionalString(value.sourceContext))
    && (value.lastMessageAt === undefined || isOptionalString(value.lastMessageAt))
    && Array.isArray(value.messages)
    && value.messages.every(isChatSessionMessage);
}

function isPeriodicReportData(value: unknown): value is PeriodicReportData {
  if (!isRecord(value) || !isEnumValue(value.reportType, PERIODIC_REPORT_TYPES)) return false;
  if (!isRecord(value.overview)) return false;
  if (!isString(value.overview.period) || !isNumber(value.overview.viewed) || !isNumber(value.overview.recorded)
    || !isNumber(value.overview.collected) || !isNumber(value.overview.completed) || !isNumber(value.overview.streak)) {
    return false;
  }
  if (!Array.isArray(value.topicTrends)) return false;
  const trendsValid = value.topicTrends.every((trend) => {
    if (!isRecord(trend) || !isString(trend.id) || !isString(trend.icon) || !isString(trend.title)) return false;
    if (!isRecord(trend.heatData)
      || !isNumber(trend.heatData.current)
      || !isNumber(trend.heatData.previous)
      || !isNumber(trend.heatData.change)
      || !isEnumValue(trend.heatData.trend, REPORT_TRENDS)) {
      return false;
    }
    if (!isRecord(trend.hotSpot)
      || !isString(trend.hotSpot.title)
      || !isNumber(trend.hotSpot.discussionCount)
      || !isNumber(trend.hotSpot.userParticipation)
      || !isString(trend.hotSpot.summary)
      || (trend.hotSpot.contentRef !== undefined && !isString(trend.hotSpot.contentRef))) {
      return false;
    }
    return Array.isArray(trend.insights) && trend.insights.every(isString);
  });
  if (!trendsValid) return false;
  if (!isRecord(value.growth) || !isRecord(value.growth.stats) || !isRecord(value.growth.trajectory)) return false;
  if (!isNumber(value.growth.stats.viewed) || !isNumber(value.growth.stats.recorded)
    || !isNumber(value.growth.stats.collected) || !isNumber(value.growth.stats.completed)) {
    return false;
  }
  if (!(value.growth.comparison === null || (isRecord(value.growth.comparison)
    && Array.isArray(value.growth.comparison.current)
    && value.growth.comparison.current.every(isNumber)
    && Array.isArray(value.growth.comparison.previous)
    && value.growth.comparison.previous.every(isNumber)
    && Array.isArray(value.growth.comparison.change)
    && value.growth.comparison.change.every(isNumber)))) {
    return false;
  }
  if (!isString(value.growth.trajectory.title) || !isString(value.growth.trajectory.description) || !isStringArray(value.growth.trajectory.keywords)) {
    return false;
  }
  if (!Array.isArray(value.growth.selectedThoughts) || !value.growth.selectedThoughts.every((thought) => {
    return isRecord(thought) && isNumber(thought.id) && isString(thought.date) && isString(thought.content);
  })) {
    return false;
  }
  return Array.isArray(value.growth.suggestions) && value.growth.suggestions.every(isString);
}

function isAnnualReportData(value: unknown): value is AnnualReportData {
  if (!isRecord(value) || !isNumber(value.year) || !isRecord(value.stats)) return false;
  return isNumber(value.stats.topicsViewed)
    && isNumber(value.stats.opinionsPosted)
    && isNumber(value.stats.plansCompleted)
    && isNumber(value.stats.daysActive)
    && isStringArray(value.keywords)
    && isStringArray(value.interests)
    && isString(value.thinkingSection)
    && isString(value.actionSection)
    && isString(value.closing);
}

function isReportEntryItem(value: unknown): value is ReportEntryItem {
  if (!isRecord(value)) return false;
  return isEnumValue(value.reportType, REPORT_TYPES)
    && isString(value.reportTitle)
    && isBoolean(value.available)
    && (value.reportId === undefined || isNumber(value.reportId))
    && (value.generatedAt === undefined || isString(value.generatedAt))
    && (value.periodStart === undefined || value.periodStart === null || isString(value.periodStart))
    && (value.periodEnd === undefined || value.periodEnd === null || isString(value.periodEnd));
}

function isReportsEnvelope(value: unknown): value is { reports: ReportEntryItem[] } {
  return isRecord(value) && Array.isArray(value.reports) && value.reports.every(isReportEntryItem);
}

function validateApiResponse<T>(
  endpoint: string,
  response: ApiResponse<unknown>,
  guard: (value: unknown) => value is T,
): ApiResponse<T> {
  if (response.error) {
    return { error: response.error };
  }
  if (response.data === undefined) {
    return { error: `Empty API response - ${endpoint}` };
  }
  if (!guard(response.data)) {
    return { error: `Invalid API response shape - ${endpoint}` };
  }
  return { data: response.data };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async parseResponseBody<T>(response: Response, endpoint: string): Promise<T | undefined> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return (await response.json()) as T;
      } catch {
        throw new Error(`Invalid JSON response - ${endpoint}`);
      }
    }

    try {
      const text = await response.text();
      return (text as unknown) as T;
    } catch {
      throw new Error(`Invalid text response - ${endpoint}`);
    }
  }

  private extractErrorMessage(payload: unknown): string | null {
    if (!payload) {
      return null;
    }
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof payload === 'object' && 'error' in payload) {
      const raw = (payload as { error?: unknown }).error;
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim();
      }
    }
    return null;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: options.credentials ?? 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const payload = await this.parseResponseBody<unknown>(response, endpoint);
      if (!response.ok) {
        const serverMessage = this.extractErrorMessage(payload);
        throw new Error(serverMessage || `HTTP error! status: ${response.status} - ${endpoint}`);
      }
      return { data: payload as T };
    } catch (error) {
      console.error('API request error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 热点资讯API
  async getHotTopics() {
    const response = await this.request<ContentListResponse<HotTopicListItem>>('/content/hot-topics');
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<ApiListResponse<HotTopicListItem>>;
    }
    return {
      data: {
        total: response.data.total,
        items: response.data.data.map((item) => ({
          ...item,
          categories: parseArrayField((item as unknown as Record<string, unknown>).categories),
          tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
        })),
      },
    } satisfies ApiResponse<ApiListResponse<HotTopicListItem>>;
  }

  async getHotTopic(id: number) {
    const response = await this.getContentDetailByRef(`hot_topic:${id}`);
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<HotTopicListItem>;
    }
    return {
      data: {
        id: Number(response.data.id),
        title: response.data.title,
        summary: response.data.summary ?? null,
        source: response.data.sourceName || '',
        source_url: response.data.sourceUrl || '',
        categories: response.data.categoryLabels,
        tags: response.data.tags,
        hot_value: 0,
        quality_score: response.data.qualityScore ?? 0,
        published_at: response.data.publishedAt ?? null,
      },
    } satisfies ApiResponse<HotTopicListItem>;
  }

  // 机会信息API
  async getOpportunities() {
    const response = await this.request<ContentListResponse<OpportunityListItem>>('/content/opportunities');
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<ApiListResponse<OpportunityListItem>>;
    }
    return {
      data: {
        total: response.data.total,
        items: response.data.data.map((item) => ({
          ...item,
          tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
        })),
      },
    } satisfies ApiResponse<ApiListResponse<OpportunityListItem>>;
  }

  async getOpportunity(id: number) {
    const response = await this.getContentDetailByRef(`opportunity:${id}`);
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<OpportunityListItem>;
    }
    return {
      data: {
        id: Number(response.data.id),
        title: response.data.title,
        type: 'opportunity',
        status: 'active',
        source: response.data.sourceName || '',
        source_url: response.data.sourceUrl || '',
        summary: response.data.summary ?? null,
        reward: null,
        location: null,
        is_remote: 0,
        deadline: null,
        tags: response.data.tags,
        quality_score: response.data.qualityScore ?? 0,
      },
    } satisfies ApiResponse<OpportunityListItem>;
  }

  // 待办与收藏 API
  async getTodos(params?: { status?: string; priority?: string }) {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.priority) search.set('priority', params.priority);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<TodoApiItem>>(`/todos${suffix}`);
  }

  async updateTodo(id: number, data: Partial<TodoApiItem>) {
    return this.request<TodoApiItem>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(id: number) {
    return this.request<{ success: boolean; message: string }>(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async getFavorites(params?: { itemType?: string }) {
    const search = new URLSearchParams();
    if (params?.itemType) search.set('item_type', params.itemType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<FavoriteApiItem>>(`/favorites${suffix}`);
  }

  async createFavorite(data: FavoriteCreatePayload) {
    return this.request<FavoriteApiItem>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFavorite(id: number) {
    return this.request<{ success: boolean; message: string }>(`/favorites/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotes(params?: { sourceType?: string }) {
    const search = new URLSearchParams();
    if (params?.sourceType) search.set('source_type', params.sourceType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<NoteApiItem>>(`/notes${suffix}`);
  }

  async createNote(data: NoteCreatePayload) {
    return this.request<NoteApiItem>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number) {
    return this.request<{ success: boolean; message: string }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async getHistory(params?: { eventType?: string }) {
    const search = new URLSearchParams();
    if (params?.eventType) search.set('event_type', params.eventType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<HistoryApiItem>>(`/history${suffix}`);
  }

  async submitFeedback(data: FeedbackCreatePayload) {
    return this.request<{ success: boolean; submission: FeedbackSubmission }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 意图识别API
  async recognizeIntent(input: string, currentInterests: string[] = []) {
    return this.request<IntentResponse>('/chat/recognize', {
      method: 'POST',
      body: JSON.stringify({ input, current_interests: currentInterests }),
    });
  }

  // 新聚合页面接口预留类型
  async getTodayPageData() {
    const endpoint = '/dashboard/today';
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isTodayPageData);
  }

  async getContentDetailByRef(contentRef: string) {
    const search = new URLSearchParams();
    search.set('content_ref', contentRef);
    const endpoint = `/content/by-ref?${search.toString()}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isUnifiedContentDetailData);
  }

  async getActionsOverview() {
    const endpoint = '/actions/overview';
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isActionsOverviewData);
  }

  async getJournalOverview() {
    const endpoint = '/journal/overview';
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isJournalOverviewData);
  }

  async checkInToday() {
    return this.request<ActionCheckInData>('/actions/check-in', {
      method: 'POST',
    });
  }

  async getGrowthOverview() {
    const endpoint = '/preferences/growth-overview';
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isGrowthOverviewData);
  }

  async getDailyDigest(profileId?: string | null, limit: number = 8) {
    const search = new URLSearchParams();
    if (profileId) {
      search.set('profile_id', profileId);
    }
    search.set('limit', String(limit));
    const endpoint = `/content/daily-digest?${search.toString()}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isDailyDigestResponse);
  }

  async consultDigest(data: { result_ref: string; question: string }) {
    return this.request<DigestConsultResponse>('/content/consult', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeChat(data: {
    input: string;
    current_interests?: string[];
    draft_type?: string;
    preferred_intent?: string;
    source_context?: string;
    source_content_ref?: string;
    source_title?: string;
    auto_commit?: boolean;
    confirmed_type?: string;
    correction_from?: string;
  }) {
    return this.request<ChatExecuteResult>('/chat/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reclassifyChat(data: {
    target_intent: string;
    correction_from: string;
    original_input?: string;
    source_context?: string;
  }) {
    return this.request<ChatExecuteResult>('/chat/reclassify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatSessions(limit: number = 20) {
    const endpoint = `/chat/sessions?limit=${limit}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isChatSessionSummaryList);
  }

  async getChatSessionMessages(sessionId: number) {
    const endpoint = `/chat/sessions/${sessionId}/messages`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isChatSessionMessagesData);
  }

  async getUserInterests() {
    return this.request<{ interests: string[] }>('/preferences/interests');
  }

  async updateUserInterests(interests: string[]) {
    return this.request<{ interests: string[] }>('/preferences/interests', {
      method: 'PUT',
      body: JSON.stringify({ interests }),
    });
  }

  async getUserSettings() {
    return this.request<UserSettingsPayload>('/preferences/settings');
  }

  async updateUserSettings(data: UserSettingsPayload) {
    return this.request<UserSettingsPayload>('/preferences/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserAiProviderSettings() {
    return this.request<UserAiProviderPayload>('/preferences/ai-provider');
  }

  async updateUserAiProviderSettings(data: { provider?: string | null; api_key?: string | null }) {
    return this.request<UserAiProviderPayload>('/preferences/ai-provider', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile() {
    return this.request<UserProfilePayload>('/preferences/profile');
  }

  async login(data: { identifier: string; password: string }) {
    return this.request<AuthEnvelope>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  }) {
    return this.request<AuthEnvelope>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<AuthEnvelope>('/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getReports() {
    const endpoint = '/reports';
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isReportsEnvelope);
  }

  async getWeeklyReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    const endpoint = `/reports/weekly${suffix}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isPeriodicReportData);
  }

  async getMonthlyReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    const endpoint = `/reports/monthly${suffix}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isPeriodicReportData);
  }

  async getAnnualReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    const endpoint = `/reports/annual${suffix}`;
    const response = await this.request<unknown>(endpoint);
    return validateApiResponse(endpoint, response, isAnnualReportData);
  }
}

class ApiConfigService extends ApiService {
  constructor() {
    super(API_CONFIG_BASE_URL);
  }

  async getCurrentProvider() {
    return this.request<{
      provider: string;
      model: string;
      api_url: string;
      is_configured: boolean;
    }>('/current');
  }
}

export const apiService = new ApiService(API_V1_BASE_URL);
export const apiConfigService = new ApiConfigService();
