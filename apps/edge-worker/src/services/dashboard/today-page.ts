// Today page loader is the route-facing boundary for the Today page.
// Route code should call loadTodayPageData() instead of assembling content,
// briefing payloads, refresh behavior, or fallback slots itself.
import {
  listHotTopics,
  listOpportunities,
  getUserInterests,
} from '../content'
import type { TodayPageData } from '../../types/page-data'
import {
  buildFallbackExtensionSlots,
  buildFallbackLeadItem,
  normalizeAiBriefing,
  normalizeExtensionSlots,
  normalizeLeadItem,
  parseBriefingPayload,
} from './today-briefing-payload'
import { generateAndPersistTodayBriefingForUser, type TodayBriefingEnv } from './today-briefing-generation'
import { buildRecommendations, buildWorthActing, buildWorthKnowing } from './today-content'
import { getLatestReadyBriefingPayload } from './today-briefing-store'

export type LoadTodayPageDataParams = {
  db: D1Database
  userId: number
  env: TodayBriefingEnv
  refreshBriefing?: boolean
}

function getDateLabel(): string {
  const now = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`
}

function buildPageSubtitle(issueNumber: number, dateLabel: string): string {
  return `第${issueNumber}期 · ${dateLabel}`
}

function hasLegacySummaryText(value: string | null | undefined): boolean {
  return /Today|真实热点|真实机会|机会池|值得行动|今天先看|再处理|过渡态|加工规则/.test(String(value || ''))
}

function truncateSummaryPart(value: string | null | undefined, limit: number): string {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}…`
}

function buildReportSummaryPart(item: {
  title: string
  summary?: string
}): string {
  const title = truncateSummaryPart(item.title, 36)
  const summary = truncateSummaryPart(item.summary, 56)
  return summary ? `“${title}”：${summary}` : `“${title}”`
}

function selectBriefingSummaryItems(params: {
  recommendedForYou: TodayPageData['recommendedForYou']
  worthKnowing: TodayPageData['worthKnowing']
}): Array<{ contentRef?: string; title: string; summary?: string }> {
  const seen = new Set<string>()
  const selected: Array<{ contentRef?: string; title: string; summary?: string }> = []

  const pushItem = (item: { contentRef?: string; title: string; summary?: string }) => {
    const key = item.contentRef || item.title
    if (!item.title || seen.has(key)) return
    seen.add(key)
    selected.push(item)
  }

  for (const group of params.recommendedForYou) {
    for (const item of group.topItems.filter((topItem) => topItem.contentType !== 'opportunity').slice(0, 1)) {
      pushItem(item)
    }
  }

  for (const item of params.worthKnowing) {
    pushItem(item)
  }

  return selected.slice(0, 3)
}

function buildBriefingOverviewSummary(params: {
  interests: string[]
  recommendedForYou: TodayPageData['recommendedForYou']
  worthKnowing: TodayPageData['worthKnowing']
  sourceCount: number
}): string {
  const focusNames = params.interests.slice(0, 2).filter(Boolean)
  const focusText = focusNames.length > 0 ? `围绕你关注的 ${focusNames.join('、')}` : '围绕今天收集到的新内容'
  const summaryItems = selectBriefingSummaryItems({
    recommendedForYou: params.recommendedForYou,
    worthKnowing: params.worthKnowing,
  })
  const reportParts = summaryItems.map(buildReportSummaryPart)
  const sourceText = params.sourceCount > 0 ? `本次共参考 ${params.sourceCount} 个候选来源。` : ''

  if (reportParts.length > 0) {
    return `${focusText}，今天的简报主要收录了${reportParts.join('；')}。${sourceText}你可以先通过摘要把握内容，再打开具体报道核对原文。`
  }

  return `${focusText}，今天暂时没有足够新内容形成简报摘要。你可以更新关注领域，或稍后等待下一次同步。`
}

export async function loadTodayPageData(params: LoadTodayPageDataParams): Promise<TodayPageData> {
  const userInterests = await getUserInterests(params.db, params.userId)
  const [hotTopics, opportunities, initialLatestBriefing] = await Promise.all([
    listHotTopics(params.db, {
      limit: 8,
      interests: userInterests,
    }),
    listOpportunities(params.db, 6),
    getLatestReadyBriefingPayload(params.db, params.userId),
  ])

  const interests = userInterests
  const recommendedForYou = buildRecommendations(interests, hotTopics, opportunities)
  const worthKnowing = buildWorthKnowing(hotTopics, interests)
  const worthActing = buildWorthActing(opportunities, interests)
  let latestBriefing = initialLatestBriefing
  let briefingPayload = parseBriefingPayload(latestBriefing?.payload ?? null)
  const payloadLeadItem = normalizeLeadItem(briefingPayload?.leadItem)
  const leadItem = payloadLeadItem?.itemType === 'opportunity' ? null : payloadLeadItem || buildFallbackLeadItem(worthKnowing)
  const extensionSlots = normalizeExtensionSlots(briefingPayload?.extensionSlots)
  const fallbackExtensionSlots = extensionSlots.length > 0 ? extensionSlots : buildFallbackExtensionSlots(leadItem)

  if (params.refreshBriefing) {
    const generation = await generateAndPersistTodayBriefingForUser({
      db: params.db,
      userId: params.userId,
      env: params.env,
      force: true,
    })
    if (generation.generated) {
      latestBriefing = await getLatestReadyBriefingPayload(params.db, params.userId)
      briefingPayload = parseBriefingPayload(latestBriefing?.payload ?? null)
    }
  }

  const refreshedPayloadLeadItem = normalizeLeadItem(briefingPayload?.leadItem)
  const refreshedLeadItem = refreshedPayloadLeadItem?.itemType === 'opportunity'
    ? null
    : refreshedPayloadLeadItem || leadItem
  const refreshedExtensionSlots = normalizeExtensionSlots(briefingPayload?.extensionSlots)
  const aiBriefing = normalizeAiBriefing(briefingPayload?.aiBriefing)
  const latestPublishedAt = hotTopics
    .map((item) => item.published_at)
    .filter((item): item is string => Boolean(item))
    .sort()
    .reverse()[0]

  const dateLabel = getDateLabel()
  const issueNumber = latestBriefing?.issue_number || 128
  const fallbackSummaryText = buildBriefingOverviewSummary({
    interests,
    recommendedForYou,
    worthKnowing,
    sourceCount: hotTopics.length + opportunities.length,
  })
  const summaryText = latestBriefing?.summary_text && !hasLegacySummaryText(latestBriefing.summary_text)
    ? latestBriefing.summary_text
    : fallbackSummaryText

  return {
    dateLabel,
    issueNumber,
    pageTitle: '简报',
    pageSubtitle: buildPageSubtitle(issueNumber, dateLabel),
    summary: {
      summaryTitle: latestBriefing?.title || '今日内容摘要',
      summaryText,
      moodTag: 'focus',
    },
    leadItem: refreshedLeadItem,
    dailyAngle: typeof briefingPayload?.dailyAngle === 'string'
      ? briefingPayload.dailyAngle
      : refreshedLeadItem?.relevanceLabel,
    aiBriefing,
    freshness: {
      latestPublishedAt,
      sourceCount: hotTopics.length + opportunities.length,
      generatedAt: latestBriefing?.generated_at || latestBriefing?.created_at || undefined,
    },
    extensionSlots: refreshedExtensionSlots.length > 0 ? refreshedExtensionSlots : fallbackExtensionSlots,
    recommendedForYou,
    worthKnowing,
    worthActing,
    quickNoteEntry: {
      placeholderText: '今天有什么想法值得记下来？',
      suggestedPrompt: '记下今天最值得以后回看的那句话。',
    },
  }
}
