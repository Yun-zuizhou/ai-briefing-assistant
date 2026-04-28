export interface ApiListResponse<T> {
  total: number
  items: T[]
}

export interface HotTopicListItem {
  id: number
  title: string
  summary: string | null
  source: string
  source_url: string
  categories: string[]
  tags: string[]
  hot_value: number
  quality_score: number
  published_at: string | null
}

export interface OpportunityListItem {
  id: number
  title: string
  type: string
  status: string
  source: string
  source_url: string
  summary: string | null
  reward: string | null
  location: string | null
  is_remote: number
  deadline: string | null
  tags: string[]
  quality_score: number
}

export interface TodoApiItem {
  id: number
  content: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: string | null
  related_type?: string | null
  related_id?: number | null
  related_title?: string | null
  tags: string[]
  created_at: string
}

export interface FavoriteApiItem {
  id: number
  item_type: string
  item_id: number
  content_ref: string | null;
  item_title: string
  item_summary?: string | null
  item_source?: string | null
  item_url?: string | null
  created_at: string
}

export interface NoteApiItem {
  id: number
  content: string
  source_type: string
  source_id?: number | null
  tags: string[]
  created_at: string
}

export interface HistoryApiItem {
  id: number
  event_type: string
  title: string
  summary?: string | null
  ref_type?: string | null
  ref_id?: number | null
  content_ref?: string | null;
  created_at: string
}

export interface TodaySummaryData {
  summaryTitle: string
  summaryText: string
  moodTag?: string
}

export interface RecommendedContentItem {
  contentRef: string
  id: string | number
  contentType: 'hot_topic' | 'article' | 'opportunity' | 'note'
  title: string
  summary?: string
  sourceName?: string
  sourceUrl?: string
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface RecommendationItem {
  interestName: string
  recommendationReason: string
  relatedContentCount?: number
  processingNote?: string
  topItems: RecommendedContentItem[]
}

export interface WorthKnowingItem {
  contentRef: string
  id: string | number
  contentType: 'hot_topic' | 'article'
  title: string
  summary: string
  sourceName: string
  sourceUrl?: string
  categoryLabels?: string[]
  relevanceReason: string
  publishedAt?: string
  hotScore?: number
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface WorthActingItem {
  contentRef: string
  id: string | number
  actionType: 'apply' | 'follow' | 'submit' | 'read_later' | 'create_todo'
  title: string
  summary: string
  deadline?: string
  reward?: string
  difficulty?: 'low' | 'medium' | 'high'
  whyRelevant: string
  nextActionLabel: string
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface TodayQuickNoteEntry {
  placeholderText: string
  suggestedPrompt?: string
  draftText?: string
}

export interface TodayLeadItem {
  contentRef?: string
  itemType: 'hot_topic' | 'opportunity' | 'briefing'
  title: string
  summary: string
  sourceLabel?: string
  relevanceLabel?: string
  primaryActionLabel: string
  secondaryActionLabel?: string
}

export interface TodayExtensionSlot {
  slotType: 'ask' | 'todo' | 'save' | 'review'
  title: string
  description: string
  actionLabel: string
  deepLink?: string
  sourceContentRef?: string
}

export interface TodayPageData {
  dateLabel: string
  issueNumber: number
  pageTitle: string
  pageSubtitle: string
  summary: TodaySummaryData
  leadItem?: TodayLeadItem | null
  dailyAngle?: string
  freshness?: {
    latestPublishedAt?: string
    sourceCount: number
    generatedAt?: string
  }
  extensionSlots?: TodayExtensionSlot[]
  recommendedForYou: RecommendationItem[]
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  quickNoteEntry: TodayQuickNoteEntry
}

export interface UnifiedContentDetailData {
  contentRef: string
  contentType: 'hot_topic' | 'article' | 'opportunity'
  id: string | number
  title: string
  summary?: string | null
  content?: string | null
  sourceName?: string
  sourceUrl?: string
  author?: string
  categoryLabels: string[]
  tags: string[]
  publishedAt?: string
  qualityScore?: number
  detailState: 'formal' | 'partial'
  detailStateReason?: string | null
  missingFields?: string[]
  relatedItems: Array<{
    contentRef: string
    contentType: 'hot_topic' | 'article' | 'opportunity'
    id: string | number
    title: string
    summary?: string | null
    sourceName?: string
    sourceUrl?: string
    relationReason?: string | null
  }>
}

export interface ChatShortcutItem {
  text: string
  exampleType: 'interest' | 'todo' | 'note' | 'settings'
}

export interface ChatShortcutGroup {
  id: string
  title: string
  items: ChatShortcutItem[]
}

export interface ChatUiMessage {
  messageId: number
  role: 'assistant' | 'user'
  content: string
  createdAt?: string
  status?: 'pending' | 'sent' | 'failed'
  intentType?: string
}

export interface ChatQuickAction {
  label: string
  action: string
  deepLink?: string
  targetIntent?: string;
  correctionFrom?: string
}

export interface ChatSessionSummary {
  sessionId: number
  sessionTitle?: string | null
  status: string
  sourceContext?: string | null
  lastMessageAt?: string | null
  messageCount?: number | null
}

export interface ChatObjectChange {
  entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown'
  entityId?: number | string
  change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed'
  summary: string
}

export interface ChatSessionMessage {
  messageId: number
  role: 'assistant' | 'user'
  content: string
  createdAt?: string | null
  messageState?: string | null
  intentType?: string | null
  candidateIntents?: string[]
  confidence?: number | null
  sourceContext?: string | null
  matchedBy?: string | null
  confirmedType?: string | null
  actionType?: string | null
  resultSummary?: string | null
  deepLink?: string | null
  nextPageLabel?: string | null
  affectedEntityType?: string | null
  affectedEntityId?: number | string | null
  changeLog?: ChatObjectChange[];
}

export interface ChatSessionMessagesData {
  sessionId: number
  sessionTitle?: string | null
  status: string
  sourceContext?: string | null
  lastMessageAt?: string | null
  messages: ChatSessionMessage[]
}

export interface IntentRecognitionData {
  recognizedIntent: string
  candidateIntents: string[]
  confidence: number
  requiresConfirmation: boolean
  extractedEntities: Record<string, string | string[]>
  suggestedPayload?: Record<string, string | string[]>
  sourceContext?: string
  matchedBy?: 'exact' | 'synonym' | 'fuzzy' | 'pattern'
}

export interface ChatExecuteAffectedEntity {
  type: 'todo' | 'note' | 'interest' | 'settings' | 'unknown'
  id?: number | string
}

export interface ChatExecuteResult {
  success: boolean
  actionType: string
  candidateIntents?: string[]
  requiresConfirmation?: boolean
  affectedEntity?: ChatExecuteAffectedEntity
  confirmedType?: string
  successMessage: string
  resultSummary?: string
  nextPageLabel?: string
  deepLink?: string
  sourceContext?: string
  quickActions?: ChatQuickAction[]
  changeLog?: ChatObjectChange[];
}

export interface ChatPageData {
  inputText: string
  activeInterests: string[]
  messages: ChatUiMessage[]
  exampleGroups: ChatShortcutGroup[]
  latestRecognition?: IntentRecognitionData
  latestExecution?: ChatExecuteResult
}

export interface ActionTodoItem {
  todoId: number
  title: string
  sourceType?: 'chat' | 'content' | 'manual'
  sourceRefId?: number | string
  dueLabel?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  done: boolean
}

export interface SavedItem {
  savedId: number
  title: string
  contentType: 'hot_topic' | 'article' | 'opportunity'
  sourceName?: string
  savedAt?: string
  urgencyLabel?: string
}

export interface FollowingItem {
  followId: number
  title: string
  followStatus: 'new' | 'watching' | 'applied' | 'waiting' | 'completed'
  deadline?: string
  progressText?: string
  nextStep?: string
}

export interface ReminderSummaryItem {
  id: number | string
  title: string
  remindAt?: string
  type: 'todo' | 'opportunity' | 'digest'
}

export interface ReminderSummaryData {
  pushTime: string
  upcomingReminders: ReminderSummaryItem[]
  doNotDisturb?: boolean
}

export interface SuggestedActionItem {
  source: 'todo' | 'opportunity_follow' | 'saved_item'
  id: number | string
  title: string
  reason: string
  priorityLabel?: string
  dueLabel?: string
  primaryActionLabel: string
  deepLink?: string
}

export interface ActionsOverviewData {
  filterType?: 'today' | 'future' | 'completed'
  loading?: boolean
  error?: string | null
  todayTodos: ActionTodoItem[]
  futureTodos: ActionTodoItem[]
  completedTodos: ActionTodoItem[]
  savedForLater: SavedItem[]
  followingItems: FollowingItem[]
  reminderSummary: ReminderSummaryData
  streakDays?: number
  checkedInToday: boolean
  topPriority?: SuggestedActionItem | null
  suggestedNextActions?: SuggestedActionItem[]
}

export interface JournalProgressItem {
  id: string
  title: string
  meta: string
  detail: string
  deepLink?: string
}

export interface JournalKeptItem {
  id: string
  title: string
  sourceLabel: string
  detail: string
  createdAt?: string
  deepLink?: string
}

export interface JournalOverviewData {
  summary: {
    expressionCount: number
    progressCount: number
    keptCount: number
    reviewCount: number
    summaryText: string
  }
  recentNotes: NoteApiItem[]
  progressItems: JournalProgressItem[]
  keptItems: JournalKeptItem[]
  review: {
    availableCount: number
    keywords: string[]
    summaryText: string
  }
}

export interface ActionCheckInData {
  success: boolean
  checkedInToday: boolean
  streakDays: number
  message: string
}

export interface GrowthKeywordItem {
  keyword: string
  weight?: number
  trend?: 'up' | 'down' | 'stable'
}

export interface PersonaSnapshot {
  personaSummary: string
  personaVersion?: string
  updatedAt?: string
}

export interface WeeklyGrowthSummary {
  weekLabel: string
  activeInterestChanges?: string
  completedActions?: number
  newNotesCount?: number
  growthSummary: string
}

export interface HistoryPreviewItem {
  historyType: 'briefing' | 'journal' | 'action'
  historyTitle: string
  historyDate: string
}

export interface ReportEntryItem {
  reportId?: number
  reportType: 'weekly' | 'monthly' | 'annual'
  reportTitle: string
  generatedAt?: string
  periodStart?: string | null
  periodEnd?: string | null
  available: boolean
}

export interface GrowthOverviewData {
  userName: string
  streakDays?: number
  totalThoughts?: number
  weeklySummary: WeeklyGrowthSummary
  keywords: GrowthKeywordItem[]
  persona: PersonaSnapshot
  recentHistoryItems: HistoryPreviewItem[]
  reports: ReportEntryItem[]
}

export interface PeriodicReportData {
  reportType: 'weekly' | 'monthly'
  dataQuality?: {
    confidence: 'low' | 'medium' | 'high'
    insufficientData: boolean
    evidence: string[]
  }
  overview: {
    period: string
    viewed: number
    recorded: number
    collected: number
    completed: number
    streak: number
  }
  topicTrends: Array<{
    id: string
    icon: string
    title: string
    heatData: {
      current: number
      previous: number
      change: number
      trend: 'up' | 'down' | 'stable'
    }
    hotSpot: {
      title: string
      contentRef?: string
      discussionCount: number
      userParticipation: number
      summary: string
    }
    insights: string[]
    userAttentionChange?: {
      change: number
      newTopics: string[]
    }
  }>
  growth: {
    stats: {
      viewed: number
      recorded: number
      collected: number
      completed: number
    }
    comparison:
      | {
          current: number[]
          previous: number[]
          change: number[]
        }
      | null
    trajectory: {
      title: string
      description: string
      keywords: string[]
    }
    selectedThoughts: Array<{
      id: number
      date: string
      content: string
    }>
    suggestions: string[]
  }
}

export interface AnnualReportData {
  year: number
  dataQuality?: {
    confidence: 'low' | 'medium' | 'high'
    insufficientData: boolean
    evidence: string[]
  }
  stats: {
    topicsViewed: number
    opinionsPosted: number
    plansCompleted: number
    daysActive: number
  }
  keywords: string[]
  interests: string[]
  thinkingSection: string
  actionSection: string
  closing: string
}

export type SummaryTaskStatus =
  | 'pending_provider'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'

export interface SummaryTaskData {
  id: number
  taskType: 'summary_generation'
  contentType?: string | null
  contentId?: number | null
  sourceUrl?: string | null
  title?: string | null
  summaryKind: string
  status: SummaryTaskStatus
  providerName?: string | null
  modelName?: string | null
  resultRef?: string | null
  errorMessage?: string | null
  requestedAt: string
  startedAt?: string | null
  finishedAt?: string | null
  updatedAt?: string | null
}
