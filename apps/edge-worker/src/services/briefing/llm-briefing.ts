import { extractText, type ResolvedAiProviderConfig } from '../ai-provider'
import { loggedChatCompletion, type LlmInvocationContext } from '../llm-invocations'
import type {
  RecommendationItem,
  TodayAiBriefingBlock,
  TodayAiBriefingCluster,
  WorthActingItem,
  WorthKnowingItem,
} from '../../types/page-data'

const TODAY_BRIEFING_TIMEOUT_MS = 25000
const TODAY_BRIEFING_VERSION = 'llm-today-briefing-v1'

type SourceCandidate = {
  index: number
  contentRef: string
  title: string
  summary: string
  sourceLabel?: string
  reason?: string
}

function truncateText(value: string | null | undefined, limit: number): string {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`
}

function normalizeStringArray(value: unknown, limit: number, itemLimit: number): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => truncateText(String(item || ''), itemLimit)).filter(Boolean))].slice(0, limit)
}

function normalizeDedupeKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .slice(0, 80)
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const normalized = String(text || '').trim()
  if (!normalized) return null
  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fencedMatch?.[1] || normalized
  const start = jsonText.indexOf('{')
  const end = jsonText.lastIndexOf('}')
  const payloadText = start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText

  try {
    const parsed = JSON.parse(payloadText)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function buildSourceCandidates(params: {
  worthKnowing: WorthKnowingItem[]
  worthActing?: WorthActingItem[]
}): SourceCandidate[] {
  const rawCandidates: SourceCandidate[] = []

  for (const item of params.worthKnowing.slice(0, 5)) {
    rawCandidates.push({
      index: rawCandidates.length,
      contentRef: item.contentRef,
      title: item.title,
      summary: item.summary,
      sourceLabel: item.sourceName,
      reason: item.relevanceReason,
    })
  }

  const seen = new Set<string>()
  const candidates: SourceCandidate[] = []
  for (const item of rawCandidates) {
    const key = normalizeDedupeKey(`${item.title}${item.summary}`)
    const refKey = item.contentRef
    if (seen.has(refKey) || (key && seen.has(key))) continue
    seen.add(refKey)
    if (key) seen.add(key)
    candidates.push({
      ...item,
      index: candidates.length,
    })
  }

  return candidates
}

function selectSourceRefs(value: unknown, candidates: SourceCandidate[], fallbackLimit = 3): TodayAiBriefingCluster['sourceRefs'] {
  const selectedIndexes = Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item < candidates.length)
    : []
  const indexes = selectedIndexes.length ? [...new Set(selectedIndexes)].slice(0, fallbackLimit) : candidates.slice(0, fallbackLimit).map((item) => item.index)

  return indexes
    .map((index) => candidates[index])
    .filter(Boolean)
    .map((item) => ({
      contentRef: item.contentRef,
      title: item.title,
      sourceLabel: item.sourceLabel,
      reason: item.reason,
    }))
}

function normalizeClusters(value: unknown, candidates: SourceCandidate[]): TodayAiBriefingCluster[] {
  if (!Array.isArray(value)) return []
  const clusters: TodayAiBriefingCluster[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const record = item as Record<string, unknown>
    const title = truncateText(String(record.title || ''), 40)
    const summary = truncateText(String(record.summary || ''), 140)
    if (!title || !summary) continue
    clusters.push({
      title,
      summary,
      confidenceNote: truncateText(String(record.confidenceNote || ''), 100) || undefined,
      recommendationReason: truncateText(String(record.recommendationReason || ''), 100) || undefined,
      sourceRefs: selectSourceRefs(record.sourceIndexes, candidates),
    })
  }
  return clusters.slice(0, 3)
}

function buildFallbackBriefing(params: {
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  recommendedForYou: RecommendationItem[]
  generatedAt: string
}): TodayAiBriefingBlock {
  const candidates = buildSourceCandidates(params)
  const leadSummary = params.worthKnowing[0]?.summary
    || '今天暂时没有足够新报道形成头版摘要。你可以稍后等待内容同步，或更新关注领域。'

  return {
    version: TODAY_BRIEFING_VERSION,
    status: 'fallback',
    leadSummary: truncateText(leadSummary, 180),
    topicClusters: candidates.length
      ? [{
          title: '头版重点',
          summary: truncateText(leadSummary, 140),
          confidenceNote: candidates.length > 1
            ? '当前主题由多条候选来源共同支持，仍需结合原文判断细节。'
            : '当前主题来自单条候选来源，可信度解释以来源和内容摘要为准。',
          recommendationReason: params.recommendedForYou[0]?.recommendationReason
            ? truncateText(params.recommendedForYou[0].recommendationReason, 100)
            : undefined,
          sourceRefs: selectSourceRefs([], candidates),
        }]
      : [],
    recommendationReasons: params.recommendedForYou.slice(0, 3).map((item) => truncateText(item.recommendationReason, 100)),
    uncertainties: ['当前为规则简报结果，AI 主题归并暂未生成。'],
    generatedAt: params.generatedAt,
  }
}

export function buildTodayBriefingPrompt(params: {
  interests: string[]
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  recommendedForYou: RecommendationItem[]
}): Array<{ role: string; content: string }> {
  const candidates = buildSourceCandidates(params)
  const systemPrompt = [
    '你是AI简报助手的今日简报生成模块。只返回严格JSON，不要加markdown代码块。',
    '你只能基于候选内容、用户关注和推荐理由生成今日简报摘要，不要编造外部事实。',
    '输出要像一份给用户看的个人报纸简报：先说明用户关注方向里今天收到了什么，再给出少量主题归并。',
    '不要使用猎奇、夸张、玄学、风口、窗口期、必须做、最值得做等制造焦虑的表达。',
    '不要把简报写成任务页或行动计划，不要把待办、机会、申请、提交、截止日期写进头版摘要或主题归并。',
    '不要出现 Today、真实热点、真实机会、机会池、过渡态、加工规则 等内部工程词。',
    '你需要对候选来源做主题归并、轻量去重、可信度解释和推荐理由解释。',
    '可信度解释只能基于来源数量、内容一致性、发布时间和来源标签，不要声称某来源权威，除非候选材料明确给出。',
    '不要输出完整页面payload，只输出今日简报文本块。',
    'sourceIndexes 只能引用候选来源数组下标。每个主题最多引用3个来源。',
    '输出JSON字段：leadSummary, topicClusters, recommendationReasons, uncertainties。',
    'topicClusters 每组字段：title, summary, confidenceNote, recommendationReason, sourceIndexes。',
    'leadSummary最多180个中文字符；topicClusters最多3组，每组title最多40字、summary最多140字、confidenceNote/recommendationReason最多100字；recommendationReasons最多3条；uncertainties最多3条。',
  ].join('\n')

  const userPayload = {
    interests: params.interests.slice(0, 6),
    sourceCandidates: candidates.map((item) => ({
      index: item.index,
      contentRef: item.contentRef,
      title: truncateText(item.title, 80),
      summary: truncateText(item.summary, 160),
      sourceLabel: item.sourceLabel,
      reason: truncateText(item.reason, 100),
    })),
    recommendationReasons: params.recommendedForYou.slice(0, 4).map((item) => ({
      interestName: item.interestName,
      reason: truncateText(item.recommendationReason, 140),
      topTitles: item.topItems.slice(0, 3).map((topItem) => truncateText(topItem.title, 60)),
    })),
  }

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        '请基于以下真实候选内容生成今日简报文本块。',
        JSON.stringify(userPayload, null, 2),
        '返回示例：{"leadSummary":"今天简报围绕你关注的AI方向，整理了工具落地和行业动态。你可以先看摘要，再打开具体报道核对原文。","topicClusters":[{"title":"AI工具进入具体工作流","summary":"候选内容显示，AI工具正在从概念讨论转向具体流程中的应用。","confidenceNote":"该主题由两个候选来源共同支撑，表述方向一致。","recommendationReason":"与你关注的AI相关，适合继续阅读原文。","sourceIndexes":[0,1]}],"recommendationReasons":["与你关注的AI相关。"],"uncertainties":["部分来源仍需继续跟踪。"]}',
      ].join('\n'),
    },
  ]
}

export function parseTodayBriefingJSON(params: {
  text: string
  providerName?: string
  modelName?: string
  generatedAt: string
  fallback: {
    worthKnowing: WorthKnowingItem[]
    worthActing: WorthActingItem[]
    recommendedForYou: RecommendationItem[]
  }
}): TodayAiBriefingBlock {
  const candidates = buildSourceCandidates(params.fallback)
  const payload = extractJsonObject(params.text)
  if (!payload) {
    return buildFallbackBriefing({ ...params.fallback, generatedAt: params.generatedAt })
  }

  const fallback = buildFallbackBriefing({ ...params.fallback, generatedAt: params.generatedAt })
  const clusters = normalizeClusters(payload.topicClusters, candidates)

  return {
    version: TODAY_BRIEFING_VERSION,
    provider: params.providerName,
    model: params.modelName,
    status: 'success',
    leadSummary: truncateText(String(payload.leadSummary || fallback.leadSummary), 180),
    topicClusters: clusters.length ? clusters : fallback.topicClusters,
    recommendationReasons: normalizeStringArray(payload.recommendationReasons, 3, 100).length
      ? normalizeStringArray(payload.recommendationReasons, 3, 100)
      : fallback.recommendationReasons,
    uncertainties: normalizeStringArray(payload.uncertainties, 3, 100),
    generatedAt: params.generatedAt,
  }
}

export async function generateTodayBriefingBlock(params: {
  db: D1Database
  userId: number
  interests: string[]
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  recommendedForYou: RecommendationItem[]
  config: ResolvedAiProviderConfig
  invocation: LlmInvocationContext
}): Promise<TodayAiBriefingBlock> {
  const generatedAt = new Date().toISOString()
  const messages = buildTodayBriefingPrompt(params)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TODAY_BRIEFING_TIMEOUT_MS)

  try {
    const payload = await loggedChatCompletion({
      config: params.config,
      messages,
      options: {
        temperature: 0.2,
        maxTokens: 900,
        responseFormat: 'json_object',
        signal: controller.signal,
      },
      invocation: params.invocation,
      validateOutput: ({ text }) => {
        const parsed = extractJsonObject(text)
        return {
          valid: Boolean(parsed?.leadSummary),
          errorCode: 'invalid_model_output',
          errorMessage: 'Today briefing output is not valid JSON',
        }
      },
    })
    const text = extractText(params.config, payload)
    return parseTodayBriefingJSON({
      text,
      providerName: params.config.provider,
      modelName: params.config.model,
      generatedAt,
      fallback: params,
    })
  } finally {
    clearTimeout(timeout)
  }
}
