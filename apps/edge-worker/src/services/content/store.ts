import { queryAll, queryOne } from '../../utils/db'
import { parseJsonArray } from './builder'
import type { ArticleRow, DailyDigestRow, RelatedItemRow } from './types'

export interface HotTopic {
  id: number
  title: string
  summary: string | null
  source: string
  source_url: string
  categories: string
  tags: string
  hot_value: number
  quality_score: number
  published_at: string | null
}

export interface Opportunity {
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
  tags: string
  quality_score: number
}

export interface UserInterest {
  id: number
  user_id: number
  interest_name: string
  status: string
}

export interface HotTopicProcessingResult {
  id: number
  source_hot_topic_id: number
  title: string
  summary: string | null
  categories: string | null
  tags: string | null
  quality_score: number
}

export type { ArticleRow, RelatedItemRow }

export async function listHotTopics(
  db: D1Database,
  limit: number = 8
): Promise<HotTopic[]> {
  const sql = `
    SELECT id, title, summary, source, source_url, categories, tags, 
           hot_value, quality_score, published_at
    FROM hot_topics
    ORDER BY hot_value DESC, quality_score DESC
    LIMIT ?
  `
  return queryAll<HotTopic>(db, sql, [limit])
}

export async function listOpportunities(
  db: D1Database,
  limit: number = 6
): Promise<Opportunity[]> {
  const sql = `
    SELECT id, title, type, status, source, source_url, summary, 
           reward, location, is_remote, deadline, tags, quality_score
    FROM opportunities
    WHERE lower(status) = 'active'
    ORDER BY quality_score DESC, deadline ASC NULLS LAST
    LIMIT ?
  `
  return queryAll<Opportunity>(db, sql, [limit])
}

export async function getUserInterests(
  db: D1Database,
  userId: number
): Promise<string[]> {
  const sql = `
    SELECT interest_name
    FROM user_interests
    WHERE user_id = ? AND lower(status) = 'active'
    ORDER BY id ASC
  `
  const rows = await queryAll<{ interest_name: string }>(db, sql, [userId])
  return rows.map((r) => r.interest_name)
}

export async function getHotTopicById(
  db: D1Database,
  id: number
): Promise<HotTopic | null> {
  const sql = `
    SELECT id, title, summary, source, source_url, categories, tags, 
           hot_value, quality_score, published_at
    FROM hot_topics
    WHERE id = ?
  `
  return queryOne<HotTopic>(db, sql, [id])
}

export async function getOpportunityById(
  db: D1Database,
  id: number
): Promise<Opportunity | null> {
  const sql = `
    SELECT id, title, type, status, source, source_url, summary, 
           reward, location, is_remote, deadline, tags, quality_score
    FROM opportunities
    WHERE id = ?
  `
  return queryOne<Opportunity>(db, sql, [id])
}

export async function getArticleById(
  db: D1Database,
  id: number
): Promise<ArticleRow | null> {
  return queryOne<ArticleRow>(
    db,
    `
      SELECT id, title, summary, content, source_name, source_url, author, category, tags, publish_time, quality_score
      FROM rss_articles
      WHERE id = ?
    `,
    [id]
  )
}

export async function listRelatedItemsForArticle(
  db: D1Database,
  article: ArticleRow
): Promise<RelatedItemRow[]> {
  const category = article.category || ''
  const tag = parseJsonArray(article.tags)[0] || ''
  return queryAll<RelatedItemRow>(
    db,
    `
      SELECT
        'article' AS content_type,
        id,
        title,
        summary,
        source_name,
        source_url,
        CASE
          WHEN category = ? THEN '同分类延伸阅读'
          ELSE '同标签延伸阅读'
        END AS relation_reason
      FROM rss_articles
      WHERE id <> ?
        AND (
          (? <> '' AND category = ?)
          OR (? <> '' AND tags LIKE ?)
        )
      ORDER BY datetime(publish_time) DESC, id DESC
      LIMIT 3
    `,
    [category, article.id, category, category, tag, `%${tag}%`]
  )
}

export async function listRelatedItemsForHotTopic(
  db: D1Database,
  topic: HotTopic
): Promise<RelatedItemRow[]> {
  const category = parseJsonArray(topic.categories)[0] || ''
  const tag = parseJsonArray(topic.tags)[0] || ''
  return queryAll<RelatedItemRow>(
    db,
    `
      SELECT
        'hot_topic' AS content_type,
        id,
        title,
        summary,
        source AS source_name,
        source_url,
        CASE
          WHEN (? <> '' AND categories LIKE ?) THEN '同主题热点'
          ELSE '同标签热点'
        END AS relation_reason
      FROM hot_topics
      WHERE id <> ?
        AND (
          (? <> '' AND categories LIKE ?)
          OR (? <> '' AND tags LIKE ?)
        )
      ORDER BY hot_value DESC, id DESC
      LIMIT 3
    `,
    [category, `%${category}%`, topic.id, category, `%${category}%`, tag, `%${tag}%`]
  )
}

export async function listRelatedItemsForOpportunity(
  db: D1Database,
  opportunity: Opportunity
): Promise<RelatedItemRow[]> {
  const tag = parseJsonArray(opportunity.tags)[0] || ''
  return queryAll<RelatedItemRow>(
    db,
    `
      SELECT
        'opportunity' AS content_type,
        id,
        title,
        summary,
        source AS source_name,
        source_url,
        '同方向机会' AS relation_reason
      FROM opportunities
      WHERE id <> ?
        AND (? <> '' AND tags LIKE ?)
      ORDER BY quality_score DESC, id DESC
      LIMIT 3
    `,
    [opportunity.id, tag, `%${tag}%`]
  )
}

export async function getHotTopicProcessingResults(
  db: D1Database,
  hotTopicIds: number[]
): Promise<Map<number, HotTopicProcessingResult>> {
  if (hotTopicIds.length === 0) return new Map()
  
  const placeholders = hotTopicIds.map(() => '?').join(',')
  const sql = `
    SELECT
      id,
      source_hot_topic_id,
      normalized_title AS title,
      normalized_summary AS summary,
      normalized_category_labels_json AS categories,
      normalized_tags_json AS tags,
      quality_score
    FROM hot_topic_processing_results
    WHERE source_hot_topic_id IN (${placeholders})
  `
  const rows = await queryAll<HotTopicProcessingResult>(db, sql, hotTopicIds)
  const map = new Map<number, HotTopicProcessingResult>()
  for (const row of rows) {
    map.set(row.source_hot_topic_id, row)
  }
  return map
}

export async function listDailyDigestResults(
  db: D1Database,
  userId: number,
  profileId?: string | null,
  limit: number = 8
): Promise<DailyDigestRow[]> {
  let sql = `
      SELECT
        id,
        task_id,
        user_id,
        result_ref,
        profile_id,
        provider_name,
        model_name,
        prompt_version,
        summary_title,
        summary_text,
        source_url,
        source_payload_json,
        key_points_json,
        risk_flags_json,
        consult_context_json,
        citations_json,
        created_at,
        updated_at
      FROM summary_generation_results
      WHERE user_id = ?
        AND summary_text IS NOT NULL
  `
  const params: unknown[] = [userId]

  if (profileId) {
    sql += ` AND profile_id = ?`
    params.push(profileId)
  }

  sql += `
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `
  params.push(limit)

  return queryAll<DailyDigestRow>(db, sql, params)
}

export async function getDailyDigestResultByRef(
  db: D1Database,
  resultRef: string,
  userId?: number
): Promise<DailyDigestRow | null> {
  const sql = `
      SELECT
        id,
        task_id,
        user_id,
        result_ref,
        profile_id,
        provider_name,
        model_name,
        prompt_version,
        summary_title,
        summary_text,
        source_url,
        source_payload_json,
        key_points_json,
        risk_flags_json,
        consult_context_json,
        citations_json,
        created_at,
        updated_at
      FROM summary_generation_results
      WHERE result_ref = ?${userId !== undefined ? ' AND user_id = ?' : ''}
      LIMIT 1
    `
  const params = userId !== undefined ? [resultRef, userId] : [resultRef]
  return queryOne<DailyDigestRow>(db, sql, params)
}

export function getVirtualInterests(): string[] {
  return ['技术趋势', '产品创新', '职业发展', '投资理财']
}

export function containsInterest(values: string[], interest: string): boolean {
  const lowerInterest = interest.toLowerCase()
  return values.some((v) => v.toLowerCase().includes(lowerInterest))
}

export function matchInterestScore(values: string[], interests: string[]): number {
  if (!interests.length) return 0
  let score = 0
  for (const interest of interests) {
    if (containsInterest(values, interest)) {
      score += 10
    }
  }
  return Math.min(score, 100)
}

export function buildTopicRankingScore(
  qualityScore: number,
  hotValue: number,
  matchScore: number
): number {
  return Math.round(qualityScore * 10 + hotValue * 0.1 + matchScore)
}

export function buildOpportunityRankingScore(
  qualityScore: number,
  matchScore: number
): number {
  return Math.round(qualityScore * 10 + matchScore)
}

export function buildWorthKnowingRankingScore(
  qualityScore: number,
  hotValue: number,
  matchScore: number
): number {
  return Math.round(qualityScore * 10 + hotValue * 0.1 + matchScore)
}

export function buildWorthActingRankingScore(
  qualityScore: number,
  matchScore: number
): number {
  return Math.round(qualityScore * 10 + matchScore)
}

export interface RankedMatch<T> {
  item: T
  matchScore: number
  rankingScore: number
}

export function rankInterestMatches<T>(
  items: T[],
  interest: string,
  valuesGetter: (item: T) => string[],
  rankingGetter: (item: T, matchScore: number) => number
): RankedMatch<T>[] {
  const matches: RankedMatch<T>[] = []
  
  for (const item of items) {
    const values = valuesGetter(item)
    if (containsInterest(values, interest)) {
      const matchScore = 10
      const rankingScore = rankingGetter(item, matchScore)
      matches.push({ item, matchScore, rankingScore })
    }
  }
  
  return matches.sort((a, b) => b.rankingScore - a.rankingScore)
}
