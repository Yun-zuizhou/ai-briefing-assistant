export interface ApiListResponse<T> {
  total: number;
  items: T[];
}

export interface HotTopicListItem {
  id: number;
  title: string;
  summary: string | null;
  source: string;
  source_url: string;
  categories: string[];
  tags: string[];
  hot_value: number;
  quality_score: number;
  published_at: string | null;
}

export interface OpportunityListItem {
  id: number;
  title: string;
  type: string;
  status: string;
  source: string;
  source_url: string;
  summary: string | null;
  reward: string | null;
  location: string | null;
  is_remote: number;
  deadline: string | null;
  tags: string[];
  quality_score: number;
}

export interface TodoApiItem {
  id: number;
  content: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string | null;
  tags: string[];
  created_at: string;
}

export interface FavoriteApiItem {
  id: number;
  item_type: string;
  item_id: number;
  content_ref: string;
  item_title: string;
  item_summary?: string | null;
  item_source?: string | null;
  item_url?: string | null;
  created_at: string;
}

export interface NoteApiItem {
  id: number;
  content: string;
  source_type: string;
  source_id?: number | null;
  tags: string[];
  created_at: string;
}

export interface HistoryApiItem {
  id: number;
  event_type: string;
  title: string;
  summary?: string | null;
  ref_type?: string | null;
  ref_id?: number | null;
  content_ref?: string | null;
  created_at: string;
}

export interface TodaySummaryData {
  summaryTitle: string;
  summaryText: string;
  moodTag?: string;
}

export interface RecommendedContentItem {
  contentRef: string;
  id: string | number;
  contentType: 'hot_topic' | 'article' | 'opportunity' | 'note';
  title: string;
  summary?: string;
  sourceName?: string;
  sourceUrl?: string;
  qualityScore?: number;
  matchScore?: number;
  rankingScore?: number;
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'transitional';
}

export interface RecommendationItem {
  interestName: string;
  recommendationReason: string;
  relatedContentCount?: number;
  processingNote?: string;
  topItems: RecommendedContentItem[];
}

export interface WorthKnowingItem {
  contentRef: string;
  id: string | number;
  contentType: 'hot_topic' | 'article';
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl?: string;
  categoryLabels?: string[];
  relevanceReason: string;
  publishedAt?: string;
  hotScore?: number;
  qualityScore?: number;
  matchScore?: number;
  rankingScore?: number;
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'transitional';
}

export interface WorthActingItem {
  contentRef: string;
  id: string | number;
  actionType: 'apply' | 'follow' | 'submit' | 'read_later' | 'create_todo';
  title: string;
  summary: string;
  deadline?: string;
  reward?: string;
  difficulty?: 'low' | 'medium' | 'high';
  whyRelevant: string;
  nextActionLabel: string;
  qualityScore?: number;
  matchScore?: number;
  rankingScore?: number;
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'transitional';
}

export interface TodayQuickNoteEntry {
  placeholderText: string;
  suggestedPrompt?: string;
  draftText?: string;
}

export interface TodayPageData {
  dateLabel: string;
  issueNumber: number;
  pageTitle: string;
  pageSubtitle: string;
  summary: TodaySummaryData;
  recommendedForYou: RecommendationItem[];
  worthKnowing: WorthKnowingItem[];
  worthActing: WorthActingItem[];
  quickNoteEntry: TodayQuickNoteEntry;
}

export interface UnifiedContentDetailData {
  contentRef: string;
  contentType: 'hot_topic' | 'article' | 'opportunity';
  id: string | number;
  title: string;
  summary?: string | null;
  content?: string | null;
  sourceName?: string;
  sourceUrl?: string;
  author?: string;
  categoryLabels: string[];
  tags: string[];
  publishedAt?: string;
  qualityScore?: number;
  detailState: 'formal' | 'transitional';
  relatedItems: Array<{
    contentRef: string;
    contentType: 'hot_topic' | 'article' | 'opportunity';
    id: string | number;
    title: string;
    summary?: string | null;
    sourceName?: string;
    sourceUrl?: string;
    relationReason?: string | null;
  }>;
}

export interface ChatShortcutItem {
  text: string;
  exampleType: 'interest' | 'todo' | 'note' | 'settings';
}

export interface ChatShortcutGroup {
  id: string;
  title: string;
  items: ChatShortcutItem[];
}

export interface ChatUiMessage {
  messageId: number;
  role: 'assistant' | 'user';
  content: string;
  createdAt?: string;
  status?: 'pending' | 'sent' | 'failed';
  intentType?: string;
}

export interface ChatQuickAction {
  label: string;
  action: string;
  deepLink?: string;
  targetIntent?: string;
  correctionFrom?: string;
}

export interface ChatSessionSummary {
  sessionId: number;
  sessionTitle?: string | null;
  status: string;
  sourceContext?: string | null;
  lastMessageAt?: string | null;
  messageCount?: number | null;
}

export interface ChatSessionMessage {
  messageId: number;
  role: 'assistant' | 'user';
  content: string;
  createdAt?: string | null;
  messageState?: string | null;
  intentType?: string | null;
  candidateIntents?: string[];
  confidence?: number | null;
  sourceContext?: string | null;
  matchedBy?: string | null;
  confirmedType?: string | null;
  actionType?: string | null;
  resultSummary?: string | null;
  deepLink?: string | null;
  nextPageLabel?: string | null;
  affectedEntityType?: string | null;
  affectedEntityId?: number | string | null;
  changeLog?: ChatObjectChange[];
}

export interface ChatSessionMessagesData {
  sessionId: number;
  sessionTitle?: string | null;
  status: string;
  sourceContext?: string | null;
  lastMessageAt?: string | null;
  messages: ChatSessionMessage[];
}

export interface IntentRecognitionData {
  recognizedIntent: string;
  candidateIntents: string[];
  confidence: number;
  requiresConfirmation: boolean;
  extractedEntities: Record<string, string | string[]>;
  suggestedPayload?: Record<string, string | string[]>;
  sourceContext?: string;
  matchedBy?: 'exact' | 'synonym' | 'fuzzy' | 'pattern';
}

export interface ChatExecuteAffectedEntity {
  type: 'todo' | 'note' | 'interest' | 'settings' | 'unknown';
  id?: number | string;
}

export interface ChatObjectChange {
  entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown';
  entityId?: number | string;
  change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed';
  summary: string;
}

export interface ChatExecuteResult {
  success: boolean;
  actionType: string;
  candidateIntents?: string[];
  requiresConfirmation?: boolean;
  affectedEntity?: ChatExecuteAffectedEntity;
  confirmedType?: string;
  successMessage: string;
  resultSummary?: string;
  nextPageLabel?: string;
  deepLink?: string;
  sourceContext?: string;
  quickActions?: ChatQuickAction[];
  changeLog?: ChatObjectChange[];
}

export interface ChatPageData {
  inputText: string;
  activeInterests: string[];
  messages: ChatUiMessage[];
  exampleGroups: ChatShortcutGroup[];
  latestRecognition?: IntentRecognitionData;
  latestExecution?: ChatExecuteResult;
}

export interface ActionTodoItem {
  todoId: number;
  title: string;
  sourceType?: 'chat' | 'content' | 'manual';
  sourceRefId?: number | string;
  dueLabel?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  done: boolean;
}

export interface SavedItem {
  savedId: number;
  title: string;
  contentType: 'hot_topic' | 'article' | 'opportunity';
  sourceName?: string;
  savedAt?: string;
  urgencyLabel?: string;
}

export interface FollowingItem {
  followId: number;
  title: string;
  followStatus: 'new' | 'watching' | 'applied' | 'waiting' | 'completed';
  deadline?: string;
  progressText?: string;
  nextStep?: string;
}

export interface ReminderSummaryItem {
  id: number | string;
  title: string;
  remindAt?: string;
  type: 'todo' | 'opportunity' | 'digest';
}

export interface ReminderSummaryData {
  pushTime: string;
  upcomingReminders: ReminderSummaryItem[];
  doNotDisturb?: boolean;
}

export interface ActionsOverviewData {
  filterType?: 'today' | 'future' | 'completed';
  loading?: boolean;
  error?: string | null;
  todayTodos: ActionTodoItem[];
  futureTodos: ActionTodoItem[];
  completedTodos: ActionTodoItem[];
  savedForLater: SavedItem[];
  followingItems: FollowingItem[];
  reminderSummary: ReminderSummaryData;
  streakDays?: number;
  checkedInToday: boolean;
}

export interface ActionCheckInData {
  success: boolean;
  checkedInToday: boolean;
  streakDays: number;
  message: string;
}

export interface WeeklyGrowthSummary {
  weekLabel: string;
  activeInterestChanges?: string;
  completedActions?: number;
  newNotesCount?: number;
  growthSummary: string;
}

export interface GrowthKeywordItem {
  keyword: string;
  weight?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface PersonaSnapshot {
  personaSummary: string;
  personaVersion?: string;
  updatedAt?: string;
}

export interface HistoryPreviewItem {
  historyType: 'briefing' | 'journal' | 'action';
  historyTitle: string;
  historyDate: string;
}

export interface ReportEntryItem {
  reportId?: number;
  reportType: 'weekly' | 'monthly' | 'annual';
  reportTitle: string;
  generatedAt?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  available: boolean;
}

export interface GrowthOverviewData {
  userName: string;
  streakDays?: number;
  totalThoughts?: number;
  weeklySummary: WeeklyGrowthSummary;
  keywords: GrowthKeywordItem[];
  persona: PersonaSnapshot;
  recentHistoryItems: HistoryPreviewItem[];
  reports: ReportEntryItem[];
}

export interface ReportOverviewData {
  period: string;
  viewed: number;
  recorded: number;
  collected: number;
  completed: number;
  streak: number;
}

export interface ReportHeatData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportHotSpot {
  title: string;
  contentRef?: string;
  discussionCount: number;
  userParticipation: number;
  summary: string;
}

export interface ReportAttentionChange {
  change: number;
  newTopics: string[];
}

export interface ReportTopicTrend {
  id: string;
  icon: string;
  title: string;
  heatData: ReportHeatData;
  hotSpot: ReportHotSpot;
  insights: string[];
  userAttentionChange?: ReportAttentionChange;
}

export interface ReportGrowthStats {
  viewed: number;
  recorded: number;
  collected: number;
  completed: number;
}

export interface ReportGrowthComparison {
  current: number[];
  previous: number[];
  change: number[];
}

export interface ReportGrowthTrajectory {
  title: string;
  description: string;
  keywords: string[];
}

export interface ReportThoughtItem {
  id: number;
  date: string;
  content: string;
}

export interface ReportGrowthData {
  stats: ReportGrowthStats;
  comparison?: ReportGrowthComparison;
  trajectory: ReportGrowthTrajectory;
  selectedThoughts: ReportThoughtItem[];
  suggestions: string[];
}

export interface PeriodicReportData {
  reportType: 'weekly' | 'monthly';
  overview: ReportOverviewData;
  topicTrends: ReportTopicTrend[];
  growth: ReportGrowthData;
}

export interface AnnualReportStats {
  topicsViewed: number;
  opinionsPosted: number;
  plansCompleted: number;
  daysActive: number;
}

export interface AnnualReportData {
  year: number;
  stats: AnnualReportStats;
  keywords: string[];
  interests: string[];
  thinkingSection: string;
  actionSection: string;
  closing: string;
}
