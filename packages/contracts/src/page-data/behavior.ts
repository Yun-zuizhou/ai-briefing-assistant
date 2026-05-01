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
  content_ref: string | null
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
  content_ref?: string | null
  created_at: string
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
