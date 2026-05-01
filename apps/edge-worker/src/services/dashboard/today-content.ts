import {
  buildTopicRankingScore,
  buildWorthActingRankingScore,
  buildWorthKnowingRankingScore,
  containsInterest,
  matchInterestScore,
  rankInterestMatches,
  type HotTopic,
  type Opportunity,
} from '../content'
import type { ArticleRow } from '../content'
import type {
  RecommendedContentItem,
  RecommendationItem,
  WorthActingItem,
  WorthKnowingItem,
} from '../../types/page-data'

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
  rankingScore: number,
  articleByTopicSourceUrl: Map<string, ArticleRow> = new Map()
): RecommendedContentItem {
  const article = articleByTopicSourceUrl.get(topic.source_url)
  if (article) {
    return {
      contentRef: `article:${article.id}`,
      id: article.id,
      contentType: 'article',
      title: article.title,
      summary: article.summary || undefined,
      sourceName: article.source_name || topic.source,
      sourceUrl: article.source_url || undefined,
      qualityScore: Number(article.quality_score || topic.quality_score),
      matchScore,
      rankingScore,
      processingStage: 'ranked',
    }
  }

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

export function buildRecommendations(
  interests: string[],
  hotTopics: HotTopic[],
  _opportunities: Opportunity[],
  articleByTopicSourceUrl: Map<string, ArticleRow> = new Map()
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = []

  for (const interest of interests.slice(0, 4)) {
    const matchedTopics = rankInterestMatches(
      hotTopics,
      interest,
      (topic) => [topic.title, topic.summary || '', ...parseJsonArray(topic.categories), ...parseJsonArray(topic.tags)],
      (topic, matchScore) => buildTopicRankingScore(topic.quality_score, topic.hot_value, matchScore)
    )

    const topItems: RecommendedContentItem[] = []

    for (const match of matchedTopics.slice(0, 2)) {
      topItems.push(buildRecommendedContentItem(match.item, match.matchScore, match.rankingScore, articleByTopicSourceUrl))
    }

    if (topItems.length > 0) {
      recommendations.push({
        interestName: interest,
        recommendationReason: `因为你最近关注 ${interest}，今天的简报优先保留了与这个方向相关的新报道。`,
        relatedContentCount: topItems.length,
        processingNote: '按关注词命中、内容质量和热度做基础排序。',
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
      recommendationReason: '当前还没有稳定关注项，因此先保留少量公共热点作为今日简报的兜底内容。',
      relatedContentCount: fallbackTopics.length,
      processingNote: '按热度和内容质量做基础排序。',
      topItems: fallbackTopics.map((topic) =>
        buildRecommendedContentItem(
          topic,
          0,
          Math.round(topic.quality_score * 10 + topic.hot_value * 0.1),
          articleByTopicSourceUrl
        )
      ),
    },
  ]
}

export function buildWorthKnowing(
  hotTopics: HotTopic[],
  interests: string[],
  articleByTopicSourceUrl: Map<string, ArticleRow> = new Map()
): WorthKnowingItem[] {
  const items: WorthKnowingItem[] = []

  for (const topic of hotTopics.slice(0, 4)) {
    const values = [topic.title, topic.summary || '', ...parseJsonArray(topic.categories), ...parseJsonArray(topic.tags)]
    let reason = '今日收录的公共热点'

    const matchedInterest = interests.find((interest) => containsInterest(values, interest))
    if (matchedInterest) {
      reason = `与你关注的 ${matchedInterest} 直接相关`
    }

    const matchScore = matchInterestScore(values, interests)
    const rankingScore = buildWorthKnowingRankingScore(topic.quality_score, topic.hot_value, matchScore)

    const article = articleByTopicSourceUrl.get(topic.source_url)

    items.push({
      contentRef: article ? `article:${article.id}` : `hot_topic:${topic.id}`,
      id: article?.id ?? topic.id,
      contentType: article ? 'article' : 'hot_topic',
      title: article?.title ?? topic.title,
      summary: article?.summary || topic.summary || '',
      sourceName: article?.source_name || topic.source,
      sourceUrl: article?.source_url || topic.source_url,
      categoryLabels: parseJsonArray(topic.categories),
      relevanceReason: reason,
      publishedAt: article?.publish_time || topic.published_at || undefined,
      hotScore: topic.hot_value,
      qualityScore: Number(article?.quality_score || topic.quality_score),
      matchScore,
      rankingScore,
      processingStage: article ? 'ranked' : 'partial',
    })
  }

  return items
}

export function buildWorthActing(
  opportunities: Opportunity[],
  interests: string[]
): WorthActingItem[] {
  const items: WorthActingItem[] = []

  for (const opp of opportunities.slice(0, 3)) {
    const values = [opp.title, opp.summary || '', ...parseJsonArray(opp.tags)]
    let reason = '可转入待办的后续线索'

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
