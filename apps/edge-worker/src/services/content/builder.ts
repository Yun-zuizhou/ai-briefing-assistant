import type { UnifiedContentDetailData } from '../../types/page-data'
import type { DailyDigestRow } from './types'
import type { ArticleRow, HotTopic, Opportunity, RelatedItemRow } from './store'

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function buildDetailState(params: {
  hasPrimaryContent: boolean
  hasSource: boolean
  relatedItems: UnifiedContentDetailData['relatedItems']
}): Pick<UnifiedContentDetailData, 'detailState' | 'detailStateReason' | 'missingFields'> {
  const missingFields: string[] = []
  if (!params.hasPrimaryContent) {
    missingFields.push('content')
  }
  if (!params.hasSource) {
    missingFields.push('source')
  }
  if (params.relatedItems.length === 0) {
    missingFields.push('related_items')
  }

  if (missingFields.length === 0) {
    return {
      detailState: 'formal',
      detailStateReason: null,
      missingFields,
    }
  }

  const reasonMap: Record<string, string> = {
    content: '正文或足够的详情内容尚未入库',
    source: '来源信息尚未补齐',
    related_items: '相关推荐尚未建立',
  }

  return {
    detailState: 'partial',
    detailStateReason: missingFields.map((field) => reasonMap[field]).join('；'),
    missingFields,
  }
}

export function mapRelatedItems(rows: RelatedItemRow[]): UnifiedContentDetailData['relatedItems'] {
  return rows.map((row) => ({
    contentRef: `${row.content_type}:${row.id}`,
    contentType: row.content_type,
    id: row.id,
    title: row.title,
    summary: row.summary,
    sourceName: row.source_name || undefined,
    sourceUrl: row.source_url || undefined,
    relationReason: row.relation_reason || undefined,
  }))
}

export function buildHotTopicDetail(params: {
  contentRef: string
  topic: HotTopic
  relatedItems: UnifiedContentDetailData['relatedItems']
}): UnifiedContentDetailData {
  const detailState = buildDetailState({
    hasPrimaryContent: Boolean(params.topic.summary?.trim()),
    hasSource: Boolean(params.topic.source_url || params.topic.source),
    relatedItems: params.relatedItems,
  })

  return {
    contentRef: params.contentRef,
    contentType: 'hot_topic',
    id: params.topic.id,
    title: params.topic.title,
    summary: params.topic.summary,
    sourceName: params.topic.source,
    sourceUrl: params.topic.source_url,
    categoryLabels: parseJsonArray(params.topic.categories),
    tags: parseJsonArray(params.topic.tags),
    publishedAt: params.topic.published_at || undefined,
    qualityScore: params.topic.quality_score,
    detailState: detailState.detailState,
    detailStateReason: detailState.detailStateReason,
    missingFields: detailState.missingFields,
    relatedItems: params.relatedItems,
  }
}

export function buildOpportunityDetail(params: {
  contentRef: string
  opportunity: Opportunity
  relatedItems: UnifiedContentDetailData['relatedItems']
}): UnifiedContentDetailData {
  const detailState = buildDetailState({
    hasPrimaryContent: Boolean(params.opportunity.summary?.trim()),
    hasSource: Boolean(params.opportunity.source_url || params.opportunity.source),
    relatedItems: params.relatedItems,
  })

  return {
    contentRef: params.contentRef,
    contentType: 'opportunity',
    id: params.opportunity.id,
    title: params.opportunity.title,
    summary: params.opportunity.summary,
    sourceName: params.opportunity.source,
    sourceUrl: params.opportunity.source_url,
    categoryLabels: parseJsonArray(params.opportunity.tags),
    tags: parseJsonArray(params.opportunity.tags),
    qualityScore: params.opportunity.quality_score,
    detailState: detailState.detailState,
    detailStateReason: detailState.detailStateReason,
    missingFields: detailState.missingFields,
    relatedItems: params.relatedItems,
  }
}

export function buildArticleDetail(params: {
  contentRef: string
  article: ArticleRow
  relatedItems: UnifiedContentDetailData['relatedItems']
}): UnifiedContentDetailData {
  const detailState = buildDetailState({
    hasPrimaryContent: Boolean(params.article.content?.trim()),
    hasSource: Boolean(params.article.source_url || params.article.source_name),
    relatedItems: params.relatedItems,
  })

  return {
    contentRef: params.contentRef,
    contentType: 'article',
    id: params.article.id,
    title: params.article.title,
    summary: params.article.summary,
    content: params.article.content || null,
    sourceName: params.article.source_name || undefined,
    sourceUrl: params.article.source_url || undefined,
    author: params.article.author || undefined,
    categoryLabels: params.article.category ? [params.article.category] : [],
    tags: parseJsonArray(params.article.tags),
    publishedAt: params.article.publish_time || undefined,
    qualityScore: Number(params.article.quality_score || 0),
    detailState: detailState.detailState,
    detailStateReason: detailState.detailStateReason,
    missingFields: detailState.missingFields,
    relatedItems: params.relatedItems,
  }
}

export function mapDailyDigestItem(row: DailyDigestRow) {
  const sourcePayload = parseJsonField<Record<string, unknown> | null>(row.source_payload_json, null)
  const citations = parseJsonField<Array<{ title?: string; url?: string }>>(row.citations_json, [])
  return {
    id: row.id,
    taskId: row.task_id,
    resultRef: row.result_ref,
    profileId: row.profile_id,
    providerName: row.provider_name,
    modelName: row.model_name,
    promptVersion: row.prompt_version,
    summaryTitle: row.summary_title,
    summaryText: row.summary_text,
    keyPoints: parseJsonField<string[]>(row.key_points_json, []),
    riskFlags: parseJsonField<string[]>(row.risk_flags_json, []),
    citations,
    sourceUrl: row.source_url,
    sourceName: String(sourcePayload?.source_name || ''),
    title: String(sourcePayload?.title || row.summary_title || ''),
    publishedAt: typeof sourcePayload?.published_at === 'string' ? sourcePayload.published_at : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
