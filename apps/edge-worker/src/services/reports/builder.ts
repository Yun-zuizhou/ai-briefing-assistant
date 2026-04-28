/**
 * @fileoverview 报告数据构建工具模块
 *
 * 提供周期报告、年度报告的数据构建函数，包括时间范围计算、
 * 连续活跃天数统计、数据质量评估、主题趋势分析等功能。
 * 所有函数均支持 null/undefined 输入，具有防御性编程特性。
 */

/** 报告相关的笔记记录类型 */
export interface ReportNoteRow {
  id: number
  user_id: number
  content: string
  tags: string | null
  created_at: string
}

/** 报告相关的收藏记录类型 */
export interface ReportFavoriteRow {
  id: number
  user_id: number
  item_type: string
  item_id: number
  item_title: string | null
  created_at: string
}

/** 报告相关的待办记录类型 */
export interface ReportTodoRow {
  id: number
  user_id: number
  content: string
  status: string
  created_at: string
}

/** 报告相关的历史行为记录类型 */
export interface ReportHistoryRow {
  id: number
  user_id: number
  event_type: string
  title: string
  ref_type: string | null
  ref_id: number | null
  created_at: string
}

/**
 * 计算报告周期的时间范围
 *
 * @param reportType - 报告类型：'weekly' | 'monthly'
 * @returns [开始日期, 结束日期] 元组，格式为 YYYY-MM-DD
 */
export function buildPeriodBounds(reportType: string): [string | null, string | null] {
  const now = new Date()
  if (reportType === 'weekly') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    return [start.toISOString().split('T')[0], now.toISOString().split('T')[0]]
  }
  if (reportType === 'monthly') {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    return [start.toISOString().split('T')[0], now.toISOString().split('T')[0]]
  }
  return [null, null]
}

/**
 * 构建报告标题
 *
 * @param reportType - 报告类型
 * @param periodLabel - 周期标签
 * @returns 本地化报告标题
 */
export function buildReportTitle(reportType: string, periodLabel: string): string {
  if (reportType === 'weekly') {
    return `${periodLabel}回顾周报`
  }
  if (reportType === 'monthly') {
    return `${periodLabel}回顾月报`
  }
  return `${periodLabel}回顾报告`
}

/**
 * 计算连续活跃天数
 *
 * 基于历史行为记录计算用户从今日倒推的连续活跃天数。
 * 支持 null/undefined 输入，返回安全默认值0。
 *
 * @param historyItems - 历史行为记录数组
 * @returns 连续活跃天数
 */
export function calcStreak(historyItems: ReportHistoryRow[] | null | undefined): number {
  const safeItems = Array.isArray(historyItems) ? historyItems : []
  const days = new Set<string>()
  for (const item of safeItems) {
    if (item?.created_at) {
      days.add(item.created_at.substring(0, 10))
    }
  }

  if (days.size === 0) return 0

  const sortedDays = Array.from(days).sort().reverse()
  const today = new Date().toISOString().split('T')[0]

  let streak = 0
  let current = new Date(today)

  for (const day of sortedDays) {
    const expectedDate = current.toISOString().split('T')[0]
    if (day === expectedDate) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * 评估数据质量
 *
 * 基于各类事实数据的总数评估报告数据的可信度。
 * 支持 null/undefined 输入，使用安全默认值。
 *
 * @param factCounts - 各类事实数据的数量统计
 * @returns 数据质量评估结果，包含置信度和证据列表
 */
export function buildDataQuality(factCounts: {
  notes: number | null | undefined
  favorites: number | null | undefined
  history: number | null | undefined
  completedTodos: number | null | undefined
  interests: number | null | undefined
}) {
  const safeCounts = {
    notes: factCounts?.notes ?? 0,
    favorites: factCounts?.favorites ?? 0,
    history: factCounts?.history ?? 0,
    completedTodos: factCounts?.completedTodos ?? 0,
    interests: factCounts?.interests ?? 0,
  }

  const totalFacts =
    safeCounts.notes +
    safeCounts.favorites +
    safeCounts.history +
    safeCounts.completedTodos

  const insufficientData = totalFacts < 4
  let confidence: 'low' | 'medium' | 'high' = 'high'
  if (totalFacts < 4) {
    confidence = 'low'
  } else if (totalFacts < 12) {
    confidence = 'medium'
  }

  const evidence = [
    `记录 ${safeCounts.notes} 条`,
    `收藏 ${safeCounts.favorites} 条`,
    `历史行为 ${safeCounts.history} 条`,
    `完成事项 ${safeCounts.completedTodos} 项`,
    `关注主题 ${safeCounts.interests} 个`,
  ]

  return {
    confidence,
    insufficientData,
    evidence,
  }
}

export function buildTopicTrends(
  interests: string[],
  notes: ReportNoteRow[],
  favorites: ReportFavoriteRow[],
  historyItems: ReportHistoryRow[],
  periodLabel: string
): Array<Record<string, unknown>> {
  const trends: Array<Record<string, unknown>> = []
  const icons = ['🧭', '🔥', '🌱', '📚', '💼', '📝']

  const noteTexts = notes.map((n) => n.content)
  const favoriteTitles = favorites.map((f) => f.item_title || '')
  const historyTitles = historyItems.map((h) => h.title)

  for (let i = 0; i < Math.min(interests.length, 4); i++) {
    const interest = interests[i]
    const icon = icons[i % icons.length]

    const noteHits = noteTexts.filter((t) => t.includes(interest)).length
    const favoriteHits = favoriteTitles.filter((t) => t.includes(interest)).length
    const historyHits = historyTitles.filter((t) => t.includes(interest)).length
    const totalHits = noteHits + favoriteHits + historyHits

    if (totalHits === 0) {
      continue
    }

    const currentHeat = Math.min(100, noteHits * 10 + favoriteHits * 8 + historyHits * 5)
    const previousHeat = Math.max(0, Math.floor(currentHeat * 0.8))
    const change = currentHeat - previousHeat

    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

    const hotTitle =
      favoriteTitles.find((t) => t.includes(interest)) ||
      historyTitles.find((t) => t.includes(interest)) ||
      `${interest} 持续升温`

    trends.push({
      id: `${periodLabel}-${i + 1}`,
      icon,
      title: interest,
      heatData: {
        current: currentHeat,
        previous: previousHeat,
        change,
        trend,
      },
      hotSpot: {
        title: hotTitle,
        contentRef: undefined,
        discussionCount: totalHits,
        userParticipation: noteHits,
        summary: `该主题在${periodLabel}内持续出现于你的记录、收藏或历史行为中，已形成可回看的连续关注线索。`,
      },
      insights: [`保持对 ${interest} 的关注，继续记录相关想法和行动。`],
      userAttentionChange: undefined,
    })
  }

  if (trends.length === 0) {
    trends.push({
      id: `${periodLabel}-fallback`,
      icon: '🧭',
      title: '数据不足',
      heatData: {
        current: 0,
        previous: 0,
        change: 0,
        trend: 'stable',
      },
      hotSpot: {
        title: `${periodLabel}内暂时没有足够的真实主题证据`,
        contentRef: undefined,
        discussionCount: historyItems.length,
        userParticipation: notes.length,
        summary: `当前真实记录还不足以生成可信的主题热度判断，因此这里明确标记为数据不足。`,
      },
      insights: ['继续补充真实记录、收藏和行动，后续再生成趋势判断会更可信。'],
      userAttentionChange: undefined,
    })
  }

  return trends
}

/**
 * 构建周期报告（周报/月报）的完整数据载荷
 *
 * 整合所有数据源生成周期报告的完整数据结构。
 * 支持 null/undefined 输入，使用安全默认值。
 *
 * @param params - 报告构建参数
 * @returns 周期报告完整数据对象
 */
export function buildPeriodicReportPayload(params: {
  reportType: string
  interests: string[] | null | undefined
  notes: ReportNoteRow[] | null | undefined
  favorites: ReportFavoriteRow[] | null | undefined
  todos: ReportTodoRow[] | null | undefined
  historyItems: ReportHistoryRow[] | null | undefined
}) {
  const safeParams = {
    reportType: params?.reportType || 'weekly',
    interests: Array.isArray(params?.interests) ? params.interests : [],
    notes: Array.isArray(params?.notes) ? params.notes : [],
    favorites: Array.isArray(params?.favorites) ? params.favorites : [],
    todos: Array.isArray(params?.todos) ? params.todos : [],
    historyItems: Array.isArray(params?.historyItems) ? params.historyItems : [],
  }

  const { reportType, interests, notes, favorites, todos, historyItems } = safeParams
  const completedTodos = todos.filter((todo) => todo.status === 'completed').length
  const streak = calcStreak(historyItems)
  const periodLabel = reportType === 'weekly' ? '本周' : '本月'
  const previousFactor = reportType === 'monthly' ? 0.7 : 0.8
  const dataQuality = buildDataQuality({
    notes: notes.length,
    favorites: favorites.length,
    history: historyItems.length,
    completedTodos,
    interests: interests.length,
  })

  const currentStats = [historyItems.length, notes.length, favorites.length, completedTodos]
  const previousStats = currentStats.map((value) => Math.max(0, Math.floor(value * previousFactor)))
  const changes = currentStats.map((value, index) => value - previousStats[index])

  const allTags: string[] = []
  for (const note of notes) {
    if (note.tags) {
      try {
        const tags = JSON.parse(note.tags)
        if (Array.isArray(tags)) {
          allTags.push(...tags)
        }
      } catch {
        // ignore
      }
    }
  }

  const keywords = [...new Set([...allTags, ...interests])].slice(0, 4)
  if (keywords.length === 0) {
    keywords.push('记录', '行动', '回顾')
  }

  const selectedThoughts = notes.slice(0, 3).map((note) => ({
    id: note.id,
    date: note.created_at.substring(0, 10),
    content: note.content.substring(0, 60),
  }))

  const suggestions = [
    '把本期最常出现的关注主题继续沉淀为一条可执行计划。',
    '对已有收藏做一次筛选，避免信息只停留在"先存着"。',
    '保持记录频率，让后续 Today 与报告页有更真实的内容基础。',
  ]

  return {
    reportType,
    dataQuality,
    overview: {
      period: periodLabel,
      viewed: historyItems.length,
      recorded: notes.length,
      collected: favorites.length,
      completed: completedTodos,
      streak,
    },
    topicTrends: buildTopicTrends(interests, notes, favorites, historyItems, periodLabel),
    growth: {
      stats: {
        viewed: historyItems.length,
        recorded: notes.length,
        collected: favorites.length,
        completed: completedTodos,
      },
      comparison:
        reportType === 'monthly'
          ? {
              current: currentStats,
              previous: previousStats,
              change: changes,
            }
          : null,
      trajectory: {
        title: '从信息浏览走向记录与行动',
        description: dataQuality.insufficientData
          ? `${periodLabel}内的真实数据仍然偏少，当前回顾只展示已确认的记录、收藏与行动，不额外推断趋势。`
          : `${periodLabel}内，你留下了 ${notes.length} 条记录、完成了 ${completedTodos} 项待办，说明行为已经从单纯浏览逐步转向沉淀与执行。`,
        keywords,
      },
      selectedThoughts,
      suggestions,
    },
  }
}

/**
 * 构建年度报告的完整数据载荷
 *
 * 整合年度统计数据生成年度报告的完整数据结构。
 * 支持 null/undefined 输入，使用安全默认值。
 *
 * @param params - 年度报告构建参数
 * @returns 年度报告完整数据对象
 */
export function buildAnnualReportPayload(params: {
  notesCount: number | null | undefined
  favoritesCount: number | null | undefined
  completedTodoCount: number | null | undefined
  historyCount: number | null | undefined
  interests: string[] | null | undefined
  daysActive: number | null | undefined
}) {
  const safeParams = {
    notesCount: params?.notesCount ?? 0,
    favoritesCount: params?.favoritesCount ?? 0,
    completedTodoCount: params?.completedTodoCount ?? 0,
    historyCount: params?.historyCount ?? 0,
    interests: Array.isArray(params?.interests) ? params.interests : [],
    daysActive: params?.daysActive ?? 0,
  }

  const { notesCount, favoritesCount, completedTodoCount, historyCount, interests, daysActive } = safeParams
  const year = new Date().getFullYear()
  const dataQuality = buildDataQuality({
    notes: notesCount,
    favorites: favoritesCount,
    history: historyCount,
    completedTodos: completedTodoCount,
    interests: interests.length,
  })
  const keywords = [...new Set([...interests, '记录者', '行动者', '回顾者'])].slice(0, 3)
  const interestsTop = interests.slice(0, 3)

  return {
    year,
    dataQuality,
    stats: {
      topicsViewed: historyCount,
      opinionsPosted: notesCount,
      plansCompleted: completedTodoCount,
      daysActive,
    },
    keywords: keywords.length > 0 ? keywords : ['记录者', '行动者', '回顾者'],
    interests: interestsTop.length > 0 ? interestsTop : ['信息输入', '个人记录', '行动转化'],
    thinkingSection: dataQuality.insufficientData
      ? '年度思考部分目前仅基于有限的真实记录和历史行为汇总，暂不额外扩写推断性结论。'
      : `年度思考基于 ${notesCount} 条记录、${favoritesCount} 条收藏与 ${historyCount} 条历史行为自动聚合生成。`,
    actionSection: `年度完成待办 ${completedTodoCount} 项，收藏 ${favoritesCount} 条内容，累计形成 ${daysActive} 个活跃日。`,
    closing: dataQuality.insufficientData
      ? '当前年度报告已经切换到真实数据口径，但样本仍偏少，后续随着更多记录和行动沉淀，报告解释性会继续增强。'
      : '当前年度报告已进入真实数据聚合阶段，后续将继续补强可解释性与结果回收链路。',
  }
}
