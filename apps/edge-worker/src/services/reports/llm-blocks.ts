import {
  extractText,
  type ResolvedAiProviderConfig,
} from '../ai-provider'
import { loggedChatCompletion, type LlmInvocationContext } from '../llm-invocations'
import type { EvidenceRef } from '../reference-registry'

const REPORT_BLOCKS_TIMEOUT_MS = 30000
const DEEPSEEK_COMPLEX_REPORT_MODEL = 'deepseek-v4-pro'

export interface GeneratedReportBlocks {
  trendExplanation: string
  periodSummary: string
  nextActions: string[]
  dataNote: string
  evidenceRefs: EvidenceRef[]
  version: string
  providerName: string
  modelName: string
}

export interface GeneratedAnnualReportBlocks {
  thinkingSummary: string
  actionSummary: string
  yearEndInsight: string
  nextYearActions: string[]
  dataNote: string
  evidenceRefs: EvidenceRef[]
  version: string
  providerName: string
  modelName: string
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

function selectEvidenceRefs(value: unknown, candidates: EvidenceRef[], fallbackLimit = 6): EvidenceRef[] {
  const selectedIndexes = Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item < candidates.length)
    : []

  if (!selectedIndexes.length) return candidates.slice(0, fallbackLimit)

  return [...new Set(selectedIndexes)].map((index) => candidates[index]).filter(Boolean).slice(0, fallbackLimit)
}

function resolveAnnualReportConfig(config: ResolvedAiProviderConfig): ResolvedAiProviderConfig {
  if (config.provider !== 'deepseek' || config.transport !== 'openai-compatible') {
    return config
  }

  return {
    ...config,
    label: 'DeepSeek V4 Pro',
    model: DEEPSEEK_COMPLEX_REPORT_MODEL,
  }
}

export function buildReportBlocksPrompt(params: {
  reportType: string
  payload: Record<string, unknown>
  evidenceRefs: EvidenceRef[]
}): Array<{ role: string; content: string }> {
  const systemPrompt = [
    '你是AI简报助手的周期报告文本块生成模块。只返回严格JSON，不要加markdown代码块。',
    '你只能基于报告结构化数据和候选证据生成解释文本，不要编造不存在的事实、身份、职业或外部事件。',
    '不要改变报告结构，不要输出完整页面 payload，只生成解释文本块。',
    'evidenceIndexes 只能引用候选证据数组里的下标，最多6个。',
    '输出JSON字段：trendExplanation, periodSummary, nextActions, dataNote, evidenceIndexes。',
    'trendExplanation最多160个中文字符；periodSummary最多180个中文字符；nextActions最多3条，每条最多80个中文字符；dataNote最多120个中文字符。',
  ].join('\n')

  const overview = params.payload.overview as Record<string, unknown> | undefined
  const growth = params.payload.growth as Record<string, unknown> | undefined
  const dataQuality = params.payload.dataQuality as Record<string, unknown> | undefined
  const topicTrends = Array.isArray(params.payload.topicTrends) ? params.payload.topicTrends.slice(0, 4) : []

  const userPayload = {
    reportType: params.reportType,
    dataQuality,
    overview,
    topicTrends,
    growth: {
      stats: growth?.stats,
      comparison: growth?.comparison,
      trajectory: growth?.trajectory,
      selectedThoughts: Array.isArray(growth?.selectedThoughts) ? growth.selectedThoughts.slice(0, 3) : [],
    },
    evidenceCandidates: params.evidenceRefs.map((ref, index) => ({
      index,
      refType: ref.refType,
      refId: ref.refId,
      resultRef: ref.resultRef,
      sourceUrl: ref.sourceUrl,
      title: truncateText(ref.title, 60),
      snippet: truncateText(ref.snippet, 120),
      reason: truncateText(ref.reason, 80),
    })),
  }

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        '请基于以下真实报告数据生成周期报告解释文本块。',
        JSON.stringify(userPayload, null, 2),
        '返回示例：{"trendExplanation":"本期关注主题集中在AI和写作。","periodSummary":"你把信息浏览转化为记录和行动。","nextActions":["筛选本期收藏，沉淀一条行动计划"],"dataNote":"当前证据来自记录、收藏和完成待办。","evidenceIndexes":[0,1]}',
      ].join('\n'),
    },
  ]
}

export function parseReportBlocksJSON(
  text: string,
  fallback: {
    payload: Record<string, unknown>
    evidenceRefs: EvidenceRef[]
  }
): Omit<GeneratedReportBlocks, 'version' | 'providerName' | 'modelName'> {
  const payload = extractJsonObject(text)
  const growth = fallback.payload.growth as Record<string, unknown> | undefined
  const trajectory = growth?.trajectory as Record<string, unknown> | undefined
  const dataQuality = fallback.payload.dataQuality as Record<string, unknown> | undefined

  if (!payload) {
    return {
      trendExplanation: truncateText(String(trajectory?.description || '当前报告使用规则聚合生成，暂未获得可用的 LLM 趋势解释。'), 160),
      periodSummary: truncateText(String(trajectory?.title || '本期报告已基于真实记录、收藏和行动生成。'), 180),
      nextActions: normalizeStringArray(growth?.suggestions, 3, 80),
      dataNote: dataQuality?.insufficientData
        ? '当前真实数据仍偏少，报告解释以已确认事实为主。'
        : '当前报告解释基于已入库的记录、收藏、待办和历史行为。',
      evidenceRefs: fallback.evidenceRefs.slice(0, 6),
    }
  }

  return {
    trendExplanation: truncateText(String(payload.trendExplanation || trajectory?.description || ''), 160),
    periodSummary: truncateText(String(payload.periodSummary || trajectory?.title || ''), 180),
    nextActions: normalizeStringArray(payload.nextActions, 3, 80).length
      ? normalizeStringArray(payload.nextActions, 3, 80)
      : normalizeStringArray(growth?.suggestions, 3, 80),
    dataNote: truncateText(String(payload.dataNote || ''), 120) || (
      dataQuality?.insufficientData
        ? '当前真实数据仍偏少，报告解释以已确认事实为主。'
        : '当前报告解释基于已入库的记录、收藏、待办和历史行为。'
    ),
    evidenceRefs: selectEvidenceRefs(payload.evidenceIndexes, fallback.evidenceRefs),
  }
}

export function buildAnnualReportBlocksPrompt(params: {
  payload: Record<string, unknown>
  evidenceRefs: EvidenceRef[]
}): Array<{ role: string; content: string }> {
  const systemPrompt = [
    '你是AI简报助手的年度报告文本块生成模块。只返回严格JSON，不要加markdown代码块。',
    '你只能基于年度统计、年度报告规则文本和候选证据生成解释文本，不要编造不存在的经历、身份、职业或外部事实。',
    '不要改变年度报告结构，不要输出完整页面 payload，只生成年度解释文本块。',
    'evidenceIndexes 只能引用候选证据数组里的下标，最多6个。',
    '输出JSON字段：thinkingSummary, actionSummary, yearEndInsight, nextYearActions, dataNote, evidenceIndexes。',
    'thinkingSummary/actionSummary/yearEndInsight最多180个中文字符；nextYearActions最多4条，每条最多80个中文字符；dataNote最多120个中文字符。',
  ].join('\n')

  const userPayload = {
    year: params.payload.year,
    dataQuality: params.payload.dataQuality,
    stats: params.payload.stats,
    interests: params.payload.interests,
    keywords: params.payload.keywords,
    thinkingSection: truncateText(String(params.payload.thinkingSection || ''), 240),
    actionSection: truncateText(String(params.payload.actionSection || ''), 240),
    closing: truncateText(String(params.payload.closing || ''), 240),
    evidenceCandidates: params.evidenceRefs.map((ref, index) => ({
      index,
      refType: ref.refType,
      refId: ref.refId,
      resultRef: ref.resultRef,
      sourceUrl: ref.sourceUrl,
      title: truncateText(ref.title, 60),
      snippet: truncateText(ref.snippet, 120),
      reason: truncateText(ref.reason, 80),
    })),
  }

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        '请基于以下真实年度报告数据生成年度解释文本块。',
        JSON.stringify(userPayload, null, 2),
        '返回示例：{"thinkingSummary":"这一年你的思考集中在AI与个人沉淀。","actionSummary":"你通过记录、收藏和待办把输入转为行动。","yearEndInsight":"年度样本显示你更适合用小步记录推动长期主题。","nextYearActions":["把高频主题拆成季度计划"],"dataNote":"证据来自记录、收藏和历史行为。","evidenceIndexes":[0,1]}',
      ].join('\n'),
    },
  ]
}

export function parseAnnualReportBlocksJSON(
  text: string,
  fallback: {
    payload: Record<string, unknown>
    evidenceRefs: EvidenceRef[]
  }
): Omit<GeneratedAnnualReportBlocks, 'version' | 'providerName' | 'modelName'> {
  const payload = extractJsonObject(text)
  const dataQuality = fallback.payload.dataQuality as Record<string, unknown> | undefined

  if (!payload) {
    return {
      thinkingSummary: truncateText(String(fallback.payload.thinkingSection || '年度思考已基于真实记录汇总。'), 180),
      actionSummary: truncateText(String(fallback.payload.actionSection || '年度行动已基于真实待办和收藏汇总。'), 180),
      yearEndInsight: truncateText(String(fallback.payload.closing || '年度报告已进入真实数据聚合阶段。'), 180),
      nextYearActions: ['从年度高频主题中选择一个方向，拆成下一阶段可执行计划。'],
      dataNote: dataQuality?.insufficientData
        ? '当前年度真实数据仍偏少，文本解释以已确认事实为主。'
        : '当前年度解释基于已入库的记录、收藏、待办和历史行为。',
      evidenceRefs: fallback.evidenceRefs.slice(0, 6),
    }
  }

  return {
    thinkingSummary: truncateText(String(payload.thinkingSummary || fallback.payload.thinkingSection || ''), 180),
    actionSummary: truncateText(String(payload.actionSummary || fallback.payload.actionSection || ''), 180),
    yearEndInsight: truncateText(String(payload.yearEndInsight || fallback.payload.closing || ''), 180),
    nextYearActions: normalizeStringArray(payload.nextYearActions, 4, 80).length
      ? normalizeStringArray(payload.nextYearActions, 4, 80)
      : ['从年度高频主题中选择一个方向，拆成下一阶段可执行计划。'],
    dataNote: truncateText(String(payload.dataNote || ''), 120) || (
      dataQuality?.insufficientData
        ? '当前年度真实数据仍偏少，文本解释以已确认事实为主。'
        : '当前年度解释基于已入库的记录、收藏、待办和历史行为。'
    ),
    evidenceRefs: selectEvidenceRefs(payload.evidenceIndexes, fallback.evidenceRefs),
  }
}

export async function generateReportBlocks(params: {
  db: D1Database
  userId: number
  reportType: string
  payload: Record<string, unknown>
  evidenceRefs: EvidenceRef[]
  config: ResolvedAiProviderConfig
  invocation?: LlmInvocationContext | null
}): Promise<GeneratedReportBlocks> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REPORT_BLOCKS_TIMEOUT_MS)

  try {
    const providerPayload = await loggedChatCompletion({
      config: params.config,
      messages: buildReportBlocksPrompt({
        reportType: params.reportType,
        payload: params.payload,
        evidenceRefs: params.evidenceRefs,
      }),
      options: {
        temperature: 0.3,
        maxTokens: 1200,
        responseFormat: 'json_object',
        thinking: 'disabled',
        signal: controller.signal,
      },
      invocation: params.invocation,
      validateOutput: ({ text }) => ({
        valid: Boolean(extractJsonObject(text)),
        errorCode: 'invalid_model_output',
        errorMessage: 'Report LLM output was empty or not valid JSON',
      }),
    })
    const outputText = extractText(params.config, providerPayload)
    const parsed = parseReportBlocksJSON(outputText, {
      payload: params.payload,
      evidenceRefs: params.evidenceRefs,
    })

    return {
      ...parsed,
      version: 'llm-report-blocks-v1',
      providerName: params.config.provider,
      modelName: params.config.model,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateAnnualReportBlocks(params: {
  db: D1Database
  userId: number
  payload: Record<string, unknown>
  evidenceRefs: EvidenceRef[]
  config: ResolvedAiProviderConfig
  invocation?: LlmInvocationContext | null
}): Promise<GeneratedAnnualReportBlocks> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REPORT_BLOCKS_TIMEOUT_MS)
  const generationConfig = resolveAnnualReportConfig(params.config)

  try {
    const providerPayload = await loggedChatCompletion({
      config: generationConfig,
      messages: buildAnnualReportBlocksPrompt({
        payload: params.payload,
        evidenceRefs: params.evidenceRefs,
      }),
      options: {
        temperature: 0.3,
        maxTokens: 1800,
        responseFormat: 'json_object',
        thinking: 'disabled',
        signal: controller.signal,
      },
      invocation: params.invocation,
      validateOutput: ({ text }) => ({
        valid: Boolean(extractJsonObject(text)),
        errorCode: 'invalid_model_output',
        errorMessage: 'Annual report LLM output was empty or not valid JSON',
      }),
    })
    const outputText = extractText(generationConfig, providerPayload)
    const parsed = parseAnnualReportBlocksJSON(outputText, {
      payload: params.payload,
      evidenceRefs: params.evidenceRefs,
    })

    return {
      ...parsed,
      version: 'llm-annual-report-blocks-v1',
      providerName: generationConfig.provider,
      modelName: generationConfig.model,
    }
  } finally {
    clearTimeout(timeout)
  }
}
