/**
 * @fileoverview 行为数据构建工具模块
 *
 * 提供用户画像、雷达图指标、成长关键词等数据构建函数。
 * 所有函数均支持 null/undefined 输入，具有防御性编程特性。
 */

import type { ActionsOverviewData, GrowthOverviewData, JournalOverviewData } from '../../types/page-data'
import { getAiPlatformDefinition, maskApiKey } from '../ai-provider'
import type {
  ActionReminderSettingsRow,
  BriefingScheduleRow,
  FollowingItemRow,
  FavoriteRow,
  HistoryRow,
  LatestBriefingRecord,
  LatestNoteRecord,
  LatestOpportunityFollowRecord,
  NoteRow,
  ProfileCounts,
  ResolvedUserAiProviderSettings,
  ResolvedUserSettings,
  SavedItemRow,
  TodoRow,
  UserSettingRow,
  BriefingScheduleState,
} from './types'

/**
 * 构建成长关键词列表
 *
 * 从用户兴趣中提取最多6个关键词，不足3个时补充默认关键词。
 * 支持 null/undefined 输入，返回安全默认值。
 *
 * @param interests - 用户兴趣标签数组，可为空
 * @returns 最多6个成长关键词
 */
export function buildGrowthKeywords(interests: string[] | null | undefined): string[] {
  const safeInterests = Array.isArray(interests) ? interests : []
  const keywords = safeInterests.slice(0, 6)

  if (keywords.length < 3) {
    keywords.push('持续探索', '记录成长', '行动实践')
  }

  return keywords.slice(0, 6)
}

/**
 * 构建用户画像描述文本
 *
 * 基于用户兴趣和统计数据生成个性化描述。
 * 支持 null/undefined 输入，使用安全默认值。
 *
 * @param interests - 用户兴趣标签数组
 * @param counts - 用户统计数据
 * @returns 用户画像描述字符串
 */
export function buildPersonaSummary(
  interests: string[] | null | undefined,
  counts: ProfileCounts | null | undefined
): string {
  const safeInterests = Array.isArray(interests) ? interests : []
  const safeCounts = counts || {
    notes_count: 0,
    favorites_count: 0,
    completed_todos: 0,
    history_count: 0,
    total_todos: 0,
  }

  const interestText = safeInterests.length > 0 ? safeInterests.slice(0, 3).join('、') : '多个主题'
  return `你是一位持续关注${interestText}的探索者，已经留下${safeCounts.notes_count || 0}条真实记录、收藏${safeCounts.favorites_count || 0}条内容，并完成${safeCounts.completed_todos || 0}项待办。当前最明显的特征是从信息浏览逐步走向记录、行动与回顾。`
}

/**
 * 构建雷达图指标数据
 *
 * 计算活跃度、收藏量、任务完成率等6个维度的指标值（0-100）。
 * 支持 null/undefined 输入，使用安全默认值避免除零错误。
 *
 * @param interests - 用户兴趣标签数组
 * @param counts - 用户统计数据
 * @returns 6维雷达图指标对象
 */
export function buildRadarMetrics(
  interests: string[] | null | undefined,
  counts: ProfileCounts | null | undefined
) {
  const safeInterests = Array.isArray(interests) ? interests : []
  const safeCounts = counts || {
    notes_count: 0,
    favorites_count: 0,
    completed_todos: 0,
    history_count: 0,
    total_todos: 0,
  }

  return {
    活跃度: Math.min(100, (safeCounts.history_count || 0) * 10),
    收藏量: Math.min(100, (safeCounts.favorites_count || 0) * 15),
    任务完成: (safeCounts.total_todos || 0) > 0
      ? Math.round(((safeCounts.completed_todos || 0) / safeCounts.total_todos) * 100)
      : 0,
    关注广度: Math.min(100, safeInterests.length * 15),
    连续打卡: Math.min(100, Math.max((safeCounts.history_count || 0) * 8, 20)),
    互动深度: Math.min(100, (safeCounts.notes_count || 0) * 12),
  }
}

export function buildRecentHistoryItems(params: {
  briefing: LatestBriefingRecord | null
  note: LatestNoteRecord | null
  follow: LatestOpportunityFollowRecord | null
}): GrowthOverviewData['recentHistoryItems'] {
  const items: GrowthOverviewData['recentHistoryItems'] = []

  if (params.briefing) {
    items.push({
      historyType: 'briefing',
      historyTitle: params.briefing.title,
      historyDate: params.briefing.briefing_date,
    })
  }

  if (params.note) {
    items.push({
      historyType: 'journal',
      historyTitle: params.note.content.substring(0, 40),
      historyDate: params.note.created_at.substring(0, 10),
    })
  }

  if (params.follow) {
    items.push({
      historyType: 'action',
      historyTitle: params.follow.next_step || params.follow.progress_text || '行动后续跟进',
      historyDate: (params.follow.updated_at || params.follow.created_at || '').substring(0, 10),
    })
  }

  return items
}

export function buildResolvedUserSettings(
  settings: UserSettingRow | null,
  schedule: BriefingScheduleState | null
): ResolvedUserSettings & {
  schedule_status: string | null
  schedule_next_run_at: string | null
} {
  return {
    morning_brief_time: settings?.morning_brief_time || '08:00',
    evening_brief_time: settings?.evening_brief_time || '21:00',
    do_not_disturb_enabled: Boolean(settings?.do_not_disturb_enabled),
    do_not_disturb_start: settings?.do_not_disturb_start || null,
    do_not_disturb_end: settings?.do_not_disturb_end || null,
    sound_enabled: settings ? Boolean(settings.sound_enabled) : true,
    vibration_enabled: settings ? Boolean(settings.vibration_enabled) : true,
    schedule_status: schedule?.status ?? null,
    schedule_next_run_at: schedule?.next_run_at ?? null,
  }
}

export function buildResolvedUserAiProviderSettings(
  settings: UserSettingRow | null
): ResolvedUserAiProviderSettings {
  const definition = getAiPlatformDefinition(settings?.ai_provider)
  const apiKey = String(settings?.ai_api_key || '').trim()
  const hasApiKey = Boolean(apiKey)

  return {
    provider: definition?.provider || null,
    provider_label: definition?.label || null,
    api_key_masked: maskApiKey(apiKey),
    has_api_key: hasApiKey,
    is_configured: Boolean(definition && hasApiKey),
    api_url: definition?.apiUrl || null,
    model: definition?.model || null,
    updated_at: settings?.updated_at || null,
  }
}

export function buildStatsSummary(counts: ProfileCounts, period: string): string {
  const periodLabelMap: Record<string, string> = {
    week: '本周',
    lastWeek: '上周',
    month: '本月',
    recent: '最近',
  }
  const label = periodLabelMap[period] || '最近'
  return `${label}你累计记录 ${counts.notes_count} 条想法、收藏 ${counts.favorites_count} 条内容、完成 ${counts.completed_todos}/${counts.total_todos} 项待办，历史行为共 ${counts.history_count} 条。`
}

export function parseTodoTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

export function mapTodoResponse(todo: TodoRow) {
  return {
    id: todo.id,
    content: todo.content,
    description: todo.description,
    status: todo.status,
    priority: todo.priority,
    deadline: todo.deadline,
    related_type: todo.related_type,
    related_id: todo.related_id,
    related_title: todo.related_title,
    tags: parseTodoTags(todo.tags),
    created_at: todo.created_at,
  }
}

export function buildContentRef(refType: string | null, refId: number | null): string | null {
  if (!refType || refId == null) return null
  if (!['hot_topic', 'article', 'opportunity'].includes(refType)) return null
  return `${refType}:${refId}`
}

export function parseContentRef(contentRef: string): { refType: string; refId: number } {
  const [refType, idText] = contentRef.split(':')
  const refId = Number.parseInt(idText || '', 10)
  if (!refType || Number.isNaN(refId)) {
    throw new Error('content_ref 格式无效，应为 type:id')
  }
  return { refType, refId }
}

export function parseFavoriteContentRef(contentRef: string): [string, number] {
  const parts = contentRef.split(':')
  if (parts.length !== 2) {
    throw new Error('content_ref 格式无效，应为 item_type:id')
  }
  const itemId = Number.parseInt(parts[1], 10)
  if (Number.isNaN(itemId)) {
    throw new Error('content_ref 中的 item_id 无效')
  }
  return [parts[0], itemId]
}

export function mapFavoriteResponse(favorite: FavoriteRow) {
  return {
    id: favorite.id,
    item_type: favorite.item_type,
    item_id: favorite.item_id,
    content_ref: buildContentRef(favorite.item_type, favorite.item_id),
    item_title: favorite.item_title,
    item_summary: favorite.item_summary,
    item_source: favorite.item_source,
    item_url: favorite.item_url,
    created_at: favorite.created_at,
  }
}

export function mapNoteResponse(note: NoteRow) {
  return {
    id: note.id,
    content: note.content,
    source_type: note.source_type,
    source_id: note.source_id,
    tags: parseTodoTags(note.tags),
    created_at: note.created_at,
  }
}

export function mapHistoryResponse(history: HistoryRow) {
  return {
    id: history.id,
    event_type: history.event_type,
    title: history.title,
    summary: history.summary,
    ref_type: history.ref_type,
    ref_id: history.ref_id,
    content_ref: buildContentRef(history.ref_type, history.ref_id),
    created_at: history.created_at,
  }
}

const actionSavedTypes = new Set(['hot_topic', 'article', 'opportunity'])
const todoPriorityRank: Record<ActionsOverviewData['todayTodos'][number]['priority'], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}
const todoPriorityLabel: Record<ActionsOverviewData['todayTodos'][number]['priority'], string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}
const followStatusLabel: Record<string, string> = {
  new: '新建',
  watching: '跟进中',
  applied: '已投递',
  waiting: '待反馈',
  completed: '已完成',
}
const eventTypeLabel: Record<string, string> = {
  read: '阅读',
  view: '查看',
  briefing_read: '简报回看',
  note_created: '记录',
  todo_created: '待办',
  daily_check_in: '打卡',
  interest_added: '新增关注',
  interest_removed: '取消关注',
  chat_reclassified: '对话修正',
  push_time_requested: '提醒调整',
}
const itemTypeLabel: Record<string, string> = {
  hot_topic: '热点',
  article: '文章',
  opportunity: '机会',
  learning_resource: '学习',
}

function safeDateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return String(value).slice(0, 10)
}

function mapTodoSource(relatedType: string | null): 'chat' | 'content' | 'manual' {
  if (!relatedType) return 'manual'
  if (relatedType === 'opportunity' || relatedType === 'article' || relatedType === 'hot_topic') {
    return 'content'
  }
  return 'chat'
}

function truncateText(value: string, length: number): string {
  if (value.length <= length) return value
  return `${value.slice(0, length).trim()}...`
}

function getDeadlineLabel(deadline: string | null | undefined): string {
  if (!deadline) return '未设截止'
  return safeDateOnly(deadline) || deadline
}

function getEventLabel(eventType: string): string {
  return eventTypeLabel[eventType] ?? eventType.replace(/_/g, ' ')
}

function getItemTypeLabel(itemType: string): string {
  return itemTypeLabel[itemType] ?? '内容'
}

function compareActionTodos(
  a: ActionsOverviewData['todayTodos'][number],
  b: ActionsOverviewData['todayTodos'][number]
): number {
  const priorityDiff = (todoPriorityRank[b.priority] ?? 0) - (todoPriorityRank[a.priority] ?? 0)
  if (priorityDiff !== 0) return priorityDiff
  if (a.dueLabel && b.dueLabel) return a.dueLabel.localeCompare(b.dueLabel)
  if (a.dueLabel) return -1
  if (b.dueLabel) return 1
  return a.todoId - b.todoId
}

function buildTodoSuggestion(todo: ActionsOverviewData['todayTodos'][number]): NonNullable<ActionsOverviewData['suggestedNextActions']>[number] {
  return {
    source: 'todo',
    id: todo.todoId,
    title: todo.title,
    reason: todo.dueLabel ? '待办已进入行动队列，可以提前推进。' : '高优先级待办，适合作为今天的主行动。',
    priorityLabel: `${todoPriorityLabel[todo.priority] ?? todo.priority}优先级`,
    dueLabel: todo.dueLabel,
    primaryActionLabel: '标记完成',
    deepLink: '/todo',
  }
}

function buildFollowSuggestion(item: ActionsOverviewData['followingItems'][number]): NonNullable<ActionsOverviewData['suggestedNextActions']>[number] {
  return {
    source: 'opportunity_follow',
    id: item.followId,
    title: item.title,
    reason: item.nextStep ? `下一步：${item.nextStep}` : '机会跟进已有进展，适合继续推进。',
    dueLabel: item.deadline,
    primaryActionLabel: '查看跟进',
    deepLink: '/todo',
  }
}

function buildSavedSuggestion(item: ActionsOverviewData['savedForLater'][number]): NonNullable<ActionsOverviewData['suggestedNextActions']>[number] {
  return {
    source: 'saved_item',
    id: item.savedId,
    title: item.title,
    reason: '已收藏内容还没有处理，可以转成下一步行动。',
    dueLabel: item.savedAt ? safeDateOnly(item.savedAt) : undefined,
    primaryActionLabel: '查看收藏',
    deepLink: '/collections',
  }
}

function buildSuggestedActions(params: {
  todayTodos: ActionsOverviewData['todayTodos']
  futureTodos: ActionsOverviewData['futureTodos']
  followingItems: ActionsOverviewData['followingItems']
  savedForLater: ActionsOverviewData['savedForLater']
}): NonNullable<ActionsOverviewData['suggestedNextActions']> {
  const todoSuggestions = [...params.todayTodos, ...params.futureTodos]
    .filter((todo) => !todo.done)
    .sort(compareActionTodos)
    .map(buildTodoSuggestion)
  const followSuggestions = params.followingItems
    .filter((item) => item.followStatus !== 'completed')
    .sort((a, b) => {
      if (a.nextStep && !b.nextStep) return -1
      if (!a.nextStep && b.nextStep) return 1
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return a.followId - b.followId
    })
    .map(buildFollowSuggestion)
  const savedSuggestions = params.savedForLater.map(buildSavedSuggestion)

  return [...todoSuggestions, ...followSuggestions, ...savedSuggestions].slice(0, 3)
}

export function buildActionsOverview(params: {
  todos: Array<Pick<TodoRow, 'id' | 'content' | 'status' | 'priority' | 'deadline' | 'related_type' | 'related_id'>>
  checkedInToday: boolean
  streakDays: number
  settings: ActionReminderSettingsRow | null
  savedItems: SavedItemRow[]
  followingItems: FollowingItemRow[]
  schedules: BriefingScheduleRow[]
}): ActionsOverviewData {
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTodos: ActionsOverviewData['todayTodos'] = []
  const futureTodos: ActionsOverviewData['futureTodos'] = []
  const completedTodos: ActionsOverviewData['completedTodos'] = []

  for (const todo of params.todos) {
    if (todo.status === 'completed') {
      completedTodos.push({
        todoId: todo.id,
        title: todo.content,
        sourceType: mapTodoSource(todo.related_type),
        sourceRefId: todo.related_id ?? undefined,
        priority: todo.priority as 'low' | 'medium' | 'high' | 'urgent',
        done: true,
      })
      continue
    }

    if (todo.deadline && todo.deadline > todayStr) {
      futureTodos.push({
        todoId: todo.id,
        title: todo.content,
        sourceType: mapTodoSource(todo.related_type),
        sourceRefId: todo.related_id ?? undefined,
        dueLabel: todo.deadline,
        priority: todo.priority as 'low' | 'medium' | 'high' | 'urgent',
        done: false,
      })
      continue
    }

    todayTodos.push({
      todoId: todo.id,
      title: todo.content,
      sourceType: mapTodoSource(todo.related_type),
      sourceRefId: todo.related_id ?? undefined,
      priority: todo.priority as 'low' | 'medium' | 'high' | 'urgent',
      done: false,
    })
  }

  const savedForLater: ActionsOverviewData['savedForLater'] = params.savedItems
    .filter((item) => actionSavedTypes.has(item.item_type))
    .map((item) => ({
      savedId: item.id,
      title: item.item_title,
      contentType: item.item_type,
      sourceName: item.item_source || undefined,
      savedAt: item.created_at || undefined,
      urgencyLabel: undefined,
    }))
  const followingItems: ActionsOverviewData['followingItems'] = params.followingItems.map((item) => ({
    followId: item.follow_id,
    title: item.title,
    followStatus: item.follow_status,
    deadline: safeDateOnly(item.deadline),
    progressText: item.progress_text || undefined,
    nextStep: item.next_step || undefined,
  }))
  const limitedTodayTodos = todayTodos.slice(0, 10)
  const limitedFutureTodos = futureTodos.slice(0, 10)
  const suggestedNextActions = buildSuggestedActions({
    todayTodos: limitedTodayTodos,
    futureTodos: limitedFutureTodos,
    followingItems,
    savedForLater,
  })

  return {
    todayTodos: limitedTodayTodos,
    futureTodos: limitedFutureTodos,
    completedTodos: completedTodos.slice(0, 10),
    savedForLater,
    followingItems,
    reminderSummary: {
      pushTime: params.settings?.morning_brief_time || '08:00',
      upcomingReminders: params.schedules.map((item) => ({
        id: item.id,
        title: `${item.briefing_type === 'morning' ? '晨间' : '晚间'}简报调度`,
        remindAt: item.next_run_at || item.schedule_time || undefined,
        type: 'digest' as const,
      })),
      doNotDisturb: Boolean(params.settings?.do_not_disturb_enabled),
    },
    streakDays: params.streakDays,
    checkedInToday: params.checkedInToday,
    topPriority: suggestedNextActions[0] ?? null,
    suggestedNextActions,
  }
}

export function buildJournalOverview(params: {
  notes: NoteRow[]
  todos: TodoRow[]
  favorites: FavoriteRow[]
  historyItems: HistoryRow[]
  followingItems: FollowingItemRow[]
  keywords: string[]
  reviewCount: number
}): JournalOverviewData {
  const activeTodos = params.todos.filter((todo) => String(todo.status).toLowerCase() !== 'completed')
  const completedTodos = params.todos.filter((todo) => String(todo.status).toLowerCase() === 'completed')
  const summaryText = params.notes[0]?.content
    ? `最近留下的一句话是：“${truncateText(params.notes[0].content, 34)}”`
    : params.historyItems[0]?.title
      ? `最近的真实痕迹是：${truncateText(params.historyItems[0].title, 36)}`
      : '当前沉淀还在积累中，可以先从对话里留下一条想法。'

  const todoProgressItems: JournalOverviewData['progressItems'] = activeTodos.slice(0, 2).map((todo) => ({
    id: `todo-${todo.id}`,
    title: todo.content,
    meta: `${todo.priority === 'urgent' ? '紧急' : '待推进'} · ${getDeadlineLabel(todo.deadline)}`,
    detail: todo.related_type === 'chat' ? '从对话转成了待办' : '已经进入行动列表',
    deepLink: '/actions',
  }))
  const followProgressItems: JournalOverviewData['progressItems'] = params.followingItems.slice(0, 2).map((item) => ({
    id: `follow-${item.follow_id}`,
    title: item.title,
    meta: followStatusLabel[item.follow_status] ?? item.follow_status,
    detail: item.next_step || item.progress_text || '这条机会仍在跟进中',
    deepLink: '/actions',
  }))
  const favoriteKeptItems: JournalOverviewData['keptItems'] = params.favorites.slice(0, 2).map((item) => ({
    id: `favorite-${item.id}`,
    title: item.item_title || '未命名收藏',
    sourceLabel: getItemTypeLabel(item.item_type),
    detail: item.item_summary || item.item_source || '已收藏，后续可继续查看',
    createdAt: item.created_at,
    deepLink: '/collections',
  }))
  const historyKeptItems: JournalOverviewData['keptItems'] = params.historyItems.slice(0, 2).map((item) => ({
    id: `history-${item.id}`,
    title: item.title,
    sourceLabel: getEventLabel(item.event_type),
    detail: item.summary || '这是一条已经写入历史的真实痕迹',
    createdAt: item.created_at,
    deepLink: '/history-logs',
  }))
  const noteKeywords = Array.from(new Set(params.notes.flatMap((item) => parseTodoTags(item.tags)).filter(Boolean)))
  const keywords = (params.keywords.length > 0 ? params.keywords : noteKeywords).slice(0, 4)

  return {
    summary: {
      expressionCount: params.notes.length,
      progressCount: activeTodos.length + completedTodos.length + params.followingItems.length,
      keptCount: params.favorites.length + params.historyItems.length,
      reviewCount: params.reviewCount,
      summaryText,
    },
    recentNotes: params.notes.slice(0, 5).map(mapNoteResponse),
    progressItems: [...todoProgressItems, ...followProgressItems].slice(0, 3),
    keptItems: [...favoriteKeptItems, ...historyKeptItems].slice(0, 4),
    review: {
      availableCount: params.reviewCount,
      keywords,
      summaryText: params.reviewCount > 0
        ? `已有 ${params.reviewCount} 个可查看的周期回顾入口`
        : '周期回顾会留在成长和历史简报里，不压住当前记录。',
    },
  }
}
