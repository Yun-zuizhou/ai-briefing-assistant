import type {
  TodayAiBriefingBlock,
  TodayAiBriefingCluster,
  TodayPageData,
  WorthKnowingItem,
} from '../../types/page-data'

export type BriefingPayloadRecord = Record<string, unknown>
type TodayLeadItemType = NonNullable<TodayPageData['leadItem']>['itemType']

function isRecord(value: unknown): value is BriefingPayloadRecord {
  return typeof value === 'object' && value !== null
}

export function parseBriefingPayload(value: string | null): BriefingPayloadRecord | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeAiBriefingSourceRefs(value: unknown): TodayAiBriefingCluster['sourceRefs'] {
  if (!Array.isArray(value)) return []
  const refs: TodayAiBriefingCluster['sourceRefs'] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    if (typeof item.contentRef !== 'string' || typeof item.title !== 'string') continue
    refs.push({
      contentRef: item.contentRef,
      title: item.title,
      sourceLabel: typeof item.sourceLabel === 'string' ? item.sourceLabel : undefined,
      reason: typeof item.reason === 'string' ? item.reason : undefined,
    })
  }
  return refs.slice(0, 4)
}

function normalizeAiBriefingClusters(value: unknown): TodayAiBriefingCluster[] {
  if (!Array.isArray(value)) return []
  const clusters: TodayAiBriefingCluster[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    if (typeof item.title !== 'string' || typeof item.summary !== 'string') continue
    clusters.push({
      title: item.title,
      summary: item.summary,
      confidenceNote: typeof item.confidenceNote === 'string' ? item.confidenceNote : undefined,
      recommendationReason: typeof item.recommendationReason === 'string' ? item.recommendationReason : undefined,
      sourceRefs: normalizeAiBriefingSourceRefs(item.sourceRefs),
    })
  }
  return clusters.slice(0, 3)
}

export function normalizeAiBriefing(value: unknown): TodayAiBriefingBlock | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value.version !== 'string' || typeof value.leadSummary !== 'string') return undefined
  const status = value.status === 'success' ? 'success' : 'fallback'
  return {
    version: value.version,
    provider: typeof value.provider === 'string' ? value.provider : undefined,
    model: typeof value.model === 'string' ? value.model : undefined,
    status,
    leadSummary: value.leadSummary,
    topicClusters: normalizeAiBriefingClusters(value.topicClusters),
    recommendationReasons: Array.isArray(value.recommendationReasons)
      ? value.recommendationReasons.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      : [],
    uncertainties: Array.isArray(value.uncertainties)
      ? value.uncertainties.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      : [],
    generatedAt: typeof value.generatedAt === 'string' ? value.generatedAt : undefined,
  }
}

export function normalizeLeadItem(value: unknown): TodayPageData['leadItem'] {
  if (!isRecord(value)) return null
  const itemType = resolveLeadItemType(value.contentRef, value.itemType)
  if (!itemType) {
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

export function resolveLeadItemType(
  contentRef: unknown,
  fallbackType: unknown
): TodayLeadItemType | null {
  if (typeof contentRef === 'string') {
    const [refType, refId] = contentRef.split(':')
    if (refType === 'hot_topic' || refType === 'article' || refType === 'opportunity') {
      return refId ? refType : null
    }
  }

  if (fallbackType === 'hot_topic' || fallbackType === 'article' || fallbackType === 'opportunity' || fallbackType === 'briefing') {
    return fallbackType
  }

  return null
}

export function normalizeExtensionSlots(value: unknown): NonNullable<TodayPageData['extensionSlots']> {
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

export function buildFallbackLeadItem(
  worthKnowing: WorthKnowingItem[]
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

  return null
}

export function buildFallbackExtensionSlots(leadItem: TodayPageData['leadItem']): NonNullable<TodayPageData['extensionSlots']> {
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
      title: '加入待办',
      description: '把这条后续线索交给待办页管理。',
      actionLabel: '查看待办',
      deepLink: '/todo',
      sourceContentRef: leadItem?.contentRef,
    },
  ]
}

export function buildBriefingPayload(params: {
  existingPayload: BriefingPayloadRecord | null
  aiBriefing: TodayAiBriefingBlock
  leadItem: TodayPageData['leadItem']
  extensionSlots: NonNullable<TodayPageData['extensionSlots']>
}): BriefingPayloadRecord {
  const firstCluster = params.aiBriefing.topicClusters[0]
  const firstSource = firstCluster?.sourceRefs[0]
  const leadItemType = resolveLeadItemType(firstSource?.contentRef, 'briefing') || 'briefing'
  const generatedLeadItem: TodayPageData['leadItem'] = firstCluster
    ? {
        contentRef: firstSource?.contentRef,
        itemType: leadItemType,
        title: firstCluster.title,
        summary: firstCluster.summary,
        sourceLabel: firstSource?.sourceLabel || '今日简报',
        relevanceLabel: firstSource?.reason,
        primaryActionLabel: '查看报道',
        secondaryActionLabel: '记下判断',
      }
    : params.leadItem

  return {
    ...(params.existingPayload || {}),
    aiBriefing: params.aiBriefing,
    leadItem: generatedLeadItem || params.leadItem,
    dailyAngle: firstCluster?.title || params.existingPayload?.dailyAngle,
    extensionSlots: params.existingPayload?.extensionSlots || params.extensionSlots,
  }
}
