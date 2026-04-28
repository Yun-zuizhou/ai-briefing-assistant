import { Hono } from 'hono'
import { queryOne } from '../utils/db'
import {
  listHotTopics,
  listOpportunities,
  getUserInterests,
  getHotTopicProcessingResults,
  containsInterest,
  matchInterestScore,
  buildTopicRankingScore,
  buildOpportunityRankingScore,
  buildWorthKnowingRankingScore,
  buildWorthActingRankingScore,
  rankInterestMatches,
  type HotTopic,
  type Opportunity,
} from '../services/content'
import { resolveUserId } from '../utils/request-user'
import type {
  TodayPageData,
  RecommendationItem,
  WorthKnowingItem,
  WorthActingItem,
  RecommendedContentItem,
} from '../types/page-data'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

type LatestBriefingPayloadRow = {
  issue_number: number | null
  title: string | null
  summary_text: string | null
  payload: string | null
  generated_at: string | null
  created_at: string | null
}

type UnknownRecord = Record<string, unknown>

function getDateLabel(): string {
  const now = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`
}

function buildPageSubtitle(issueNumber: number, dateLabel: string): string {
  return `第${issueNumber}期 · ${dateLabel}`
}

function getDateOnly(): string {
  return new Date().toISOString().split('T')[0]
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: string | null): UnknownRecord | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseJsonArray(str: string | null): string[] {
  if (!str) return []
  try {
    const arr = JSON.parse(str)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function buildRecommendedContentItem(
  topic: HotTopic,
  matchScore: number,
  rankingScore: number
): RecommendedContentItem {
  return {
    contentRef: `hot_topic:${topic.id}`,
    id: topic.id,
    contentType: 'hot_topic',
    title: topic.title,
    summary: topic.summary || undefined,
    sourceName: topic.source,
    sourceUrl: topic.source_url,
    qualityScore: topic.quality_score,
    matchScore,
    rankingScore,
    processingStage: 'partial',
  }
}

function buildRecommendedOpportunityItem(
  opp: Opportunity,
  matchScore: number,
  rankingScore: number
): RecommendedContentItem {
  return {
    contentRef: `opportunity:${opp.id}`,
    id: opp.id,
    contentType: 'opportunity',
    title: opp.title,
    summary: opp.summary || undefined,
    sourceName: opp.source,
    sourceUrl: opp.source_url,
    qualityScore: opp.quality_score,
    matchScore,
    rankingScore,
    processingStage: 'partial',
  }
}

function buildRecommendations(
  interests: string[],
  hotTopics: HotTopic[],
  opportunities: Opportunity[]
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = []

  for (const interest of interests.slice(0, 4)) {
    const matchedTopics = rankInterestMatches(
      hotTopics,
      interest,
      (topic) => [topic.title, topic.summary || '', ...parseJsonArray(topic.categories), ...parseJsonArray(topic.tags)],
      (topic, matchScore) => buildTopicRankingScore(topic.quality_score, topic.hot_value, matchScore)
    )

    const matchedOpportunities = rankInterestMatches(
      opportunities,
      interest,
      (opp) => [opp.title, opp.summary || '', ...parseJsonArray(opp.tags)],
      (opp, matchScore) => buildOpportunityRankingScore(opp.quality_score, matchScore)
    )

    const topItems: RecommendedContentItem[] = []

    for (const match of matchedTopics.slice(0, 2)) {
      topItems.push(buildRecommendedContentItem(match.item, match.matchScore, match.rankingScore))
    }

    for (const match of matchedOpportunities.slice(0, 1)) {
      topItems.push(buildRecommendedOpportunityItem(match.item, match.matchScore, match.rankingScore))
    }

    if (topItems.length > 0) {
      recommendations.push({
        interestName: interest,
        recommendationReason: `因为你最近关注 ${interest}，Today 现在优先从真实热点和真实机会里为你筛出相关内容。`,
        relatedContentCount: topItems.length,
        processingNote: '当前按兴趣命中 + 内容质量分做最小排序，仍属于过渡态加工规则。',
        topItems,
      })
    }
  }

  if (recommendations.length > 0) {
    return recommendations
  }

  const fallbackTopics = hotTopics.slice(0, 2)
  if (fallbackTopics.length === 0) {
    return []
  }

  return [
    {
      interestName: '今日重点',
      recommendationReason: '当前还没有稳定关注项，因此先按真实热点热度给你保留今日最值得看的内容。',
      relatedContentCount: fallbackTopics.length,
      processingNote: '当前按热点热度优先保留，尚未进入正式个性化排序。',
      topItems: fallbackTopics.map((topic) =>
        buildRecommendedContentItem(
          topic,
          0,
          Math.round(topic.quality_score * 10 + topic.hot_value * 0.1)
        )
      ),
    },
  ]
}

function buildWorthKnowing(
  hotTopics: HotTopic[],
  interests: string[]
): WorthKnowingItem[] {
  const items: WorthKnowingItem[] = []

  for (const topic of hotTopics.slice(0, 4)) {
    const values = [topic.title, topic.summary || '', ...parseJsonArray(topic.categories), ...parseJsonArray(topic.tags)]
    let reason = '来自今日真实热点聚合'

    const matchedInterest = interests.find((interest) => containsInterest(values, interest))
    if (matchedInterest) {
      reason = `与你关注的 ${matchedInterest} 直接相关`
    }

    const matchScore = matchInterestScore(values, interests)
    const rankingScore = buildWorthKnowingRankingScore(topic.quality_score, topic.hot_value, matchScore)

    items.push({
      contentRef: `hot_topic:${topic.id}`,
      id: topic.id,
      contentType: 'hot_topic',
      title: topic.title,
      summary: topic.summary || '',
      sourceName: topic.source,
      sourceUrl: topic.source_url,
      categoryLabels: parseJsonArray(topic.categories),
      relevanceReason: reason,
      publishedAt: topic.published_at || undefined,
      hotScore: topic.hot_value,
      qualityScore: topic.quality_score,
      matchScore,
      rankingScore,
      processingStage: 'partial',
    })
  }

  return items
}

function buildWorthActing(
  opportunities: Opportunity[],
  interests: string[]
): WorthActingItem[] {
  const items: WorthActingItem[] = []

  for (const opp of opportunities.slice(0, 3)) {
    const values = [opp.title, opp.summary || '', ...parseJsonArray(opp.tags)]
    let reason = '来自今日真实机会池'

    const matchedInterest = interests.find((interest) => containsInterest(values, interest))
    if (matchedInterest) {
      reason = `与你关注的 ${matchedInterest} 方向一致`
    }

    const matchScore = matchInterestScore(values, interests)
    const rankingScore = buildWorthActingRankingScore(opp.quality_score, matchScore)

    const actionType = opp.is_remote ? 'apply' : 'follow'

    items.push({
      contentRef: `opportunity:${opp.id}`,
      id: opp.id,
      actionType,
      title: opp.title,
      summary: opp.summary || '',
      deadline: opp.deadline || undefined,
      reward: opp.reward || undefined,
      whyRelevant: reason,
      nextActionLabel: '转成待办',
      qualityScore: opp.quality_score,
      matchScore,
      rankingScore,
      processingStage: 'partial',
    })
  }

  return items
}

async function getLatestReadyBriefingPayload(
  db: D1Database,
  userId: number
): Promise<LatestBriefingPayloadRow | null> {
  try {
    return await queryOne<LatestBriefingPayloadRow>(
      db,
      `
        SELECT issue_number, title, summary_text, payload, generated_at, created_at
        FROM briefings
        WHERE user_id = ?
          AND briefing_date <= ?
          AND lower(COALESCE(status, 'ready')) = 'ready'
        ORDER BY briefing_date DESC, datetime(COALESCE(generated_at, updated_at, created_at)) DESC, id DESC
        LIMIT 1
      `,
      [userId, getDateOnly()]
    )
  } catch (error) {
    console.warn('read latest briefing payload skipped:', error)
    return null
  }
}

function normalizeLeadItem(value: unknown): TodayPageData['leadItem'] {
  if (!isRecord(value)) return null
  const itemType = value.itemType
  if (itemType !== 'hot_topic' && itemType !== 'opportunity' && itemType !== 'briefing') {
    return null
  }
  if (typeof value.title !== 'string' || typeof value.summary !== 'string' || typeof value.primaryActionLabel !== 'string') {
    return null
  }
  return {
    contentRef: typeof value.contentRef === 'string' ? value.contentRef : undefined,
    itemType,
    title: value.title,
    summary: value.summary,
    sourceLabel: typeof value.sourceLabel === 'string' ? value.sourceLabel : undefined,
    relevanceLabel: typeof value.relevanceLabel === 'string' ? value.relevanceLabel : undefined,
    primaryActionLabel: value.primaryActionLabel,
    secondaryActionLabel: typeof value.secondaryActionLabel === 'string' ? value.secondaryActionLabel : undefined,
  }
}

function normalizeExtensionSlots(value: unknown): NonNullable<TodayPageData['extensionSlots']> {
  if (!Array.isArray(value)) return []
  const slots: TodayPageData['extensionSlots'] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    if (!['ask', 'todo', 'save', 'review'].includes(String(item.slotType))) continue
    if (typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.actionLabel !== 'string') continue
    slots.push({
      slotType: item.slotType as 'ask' | 'todo' | 'save' | 'review',
      title: item.title,
      description: item.description,
      actionLabel: item.actionLabel,
      deepLink: typeof item.deepLink === 'string' ? item.deepLink : undefined,
      sourceContentRef: typeof item.sourceContentRef === 'string' ? item.sourceContentRef : undefined,
    })
  }
  return slots.slice(0, 4)
}

function buildFallbackLeadItem(
  worthKnowing: WorthKnowingItem[],
  worthActing: WorthActingItem[]
): TodayPageData['leadItem'] {
  const leadKnowledge = worthKnowing[0]
  if (leadKnowledge) {
    return {
      contentRef: leadKnowledge.contentRef,
      itemType: 'hot_topic',
      title: leadKnowledge.title,
      summary: leadKnowledge.summary,
      sourceLabel: leadKnowledge.sourceName,
      relevanceLabel: leadKnowledge.relevanceReason,
      primaryActionLabel: '打开内容',
      secondaryActionLabel: '记下想法',
    }
  }
  const leadAction = worthActing[0]
  if (leadAction) {
    return {
      contentRef: leadAction.contentRef,
      itemType: 'opportunity',
      title: leadAction.title,
      summary: leadAction.summary,
      sourceLabel: '机会',
      relevanceLabel: leadAction.whyRelevant,
      primaryActionLabel: '查看机会',
      secondaryActionLabel: '记下想法',
    }
  }
  return null
}

function buildFallbackExtensionSlots(leadItem: TodayPageData['leadItem']): NonNullable<TodayPageData['extensionSlots']> {
  return [
    {
      slotType: 'ask',
      title: '继续追问',
      description: leadItem ? `围绕“${leadItem.title}”继续拆解。` : '围绕今天的重点继续追问。',
      actionLabel: '去对话',
      deepLink: '/chat',
      sourceContentRef: leadItem?.contentRef,
    },
    {
      slotType: 'todo',
      title: '转成行动',
      description: '把今天值得做的事收进待办。',
      actionLabel: '去行动',
      deepLink: '/todo',
      sourceContentRef: leadItem?.contentRef,
    },
  ]
}

router.get('/today', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const [hotTopics, opportunities, userInterests, latestBriefing] = await Promise.all([
      listHotTopics(db, 8),
      listOpportunities(db, 6),
      getUserInterests(db, userId),
      getLatestReadyBriefingPayload(db, userId),
    ])

    const interests = userInterests

    const recommendedForYou = buildRecommendations(interests, hotTopics, opportunities)
    const worthKnowing = buildWorthKnowing(hotTopics, interests)
    const worthActing = buildWorthActing(opportunities, interests)
    const briefingPayload = parsePayload(latestBriefing?.payload ?? null)
    const payloadLeadItem = normalizeLeadItem(briefingPayload?.leadItem)
    const leadItem = payloadLeadItem || buildFallbackLeadItem(worthKnowing, worthActing)
    const extensionSlots = normalizeExtensionSlots(briefingPayload?.extensionSlots)
    const latestPublishedAt = hotTopics
      .map((item) => item.published_at)
      .filter((item): item is string => Boolean(item))
      .sort()
      .reverse()[0]

    const dateLabel = getDateLabel()
    const issueNumber = latestBriefing?.issue_number || 128
    const response: TodayPageData = {
      dateLabel,
      issueNumber,
      pageTitle: '今日',
      pageSubtitle: buildPageSubtitle(issueNumber, dateLabel),
      summary: {
        summaryTitle: latestBriefing?.title || '今日总述',
        summaryText: latestBriefing?.summary_text || `今天已经从真实热点中筛出 ${worthKnowing.length} 条值得知道的内容，并从真实机会池中保留了 ${worthActing.length} 条值得行动的机会。`,
        moodTag: 'focus',
      },
      leadItem,
      dailyAngle: typeof briefingPayload?.dailyAngle === 'string'
        ? briefingPayload.dailyAngle
        : leadItem?.relevanceLabel,
      freshness: {
        latestPublishedAt,
        sourceCount: hotTopics.length + opportunities.length,
        generatedAt: latestBriefing?.generated_at || latestBriefing?.created_at || undefined,
      },
      extensionSlots: extensionSlots.length > 0 ? extensionSlots : buildFallbackExtensionSlots(leadItem),
      recommendedForYou,
      worthKnowing,
      worthActing,
      quickNoteEntry: {
        placeholderText: '今天有什么想法值得记下来？',
        suggestedPrompt: '记下今天最值得以后回看的那句话。',
      },
    }

    return c.json(response)
  } catch (error) {
    console.error('Dashboard today error:', error)
    return c.json({ error: 'Failed to load dashboard data' }, 500)
  }
})

export default router
