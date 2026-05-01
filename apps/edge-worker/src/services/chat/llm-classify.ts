import {
  extractText,
  type ResolvedAiProviderConfig,
} from '../ai-provider'
import { loggedChatCompletion, type LlmInvocationContext } from '../llm-invocations'
import type { ParsedIntentResult } from './intent'

const KNOWN_INTENTS = new Set([
  'create_todo',
  'record_thought',
  'fragmented_thought',
  'add_interest',
  'remove_interest',
  'set_push_time',
  'query_stats',
  'chat_only',
  'multi',
])
const CHAT_LLM_TIMEOUT_MS = 12000

export interface ChatClassifyResult {
  type: string
  confidence: number
  entities: Record<string, unknown>
  matchedBy: 'llm'
  candidateIntents: string[]
  replyHint: string
  suggestedActions: Array<{
    label: string
    action: string
    targetIntent?: string
  }>
}

function truncateText(value: string, limit: number): string {
  const normalized = String(value || '').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`
}

function clampConfidence(value: unknown): number {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0.5
  return Math.max(0, Math.min(1, numeric))
}

function normalizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
}

function normalizeSuggestedActions(value: unknown): ChatClassifyResult['suggestedActions'] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const label = truncateText(item, 16)
        return label ? { label, action: label } : null
      }
      if (typeof item !== 'object' || item === null) return null
      const payload = item as { label?: unknown; action?: unknown; targetIntent?: unknown }
      const label = truncateText(String(payload.label || payload.action || ''), 16)
      const action = truncateText(String(payload.action || payload.label || ''), 24)
      if (!label || !action) return null
      const targetIntent = String(payload.targetIntent || '').trim()
      return {
        label,
        action,
        targetIntent: KNOWN_INTENTS.has(targetIntent) ? targetIntent : undefined,
      }
    })
    .filter((item): item is ChatClassifyResult['suggestedActions'][number] => Boolean(item))
    .slice(0, 2)
}

function defaultReplyHint(intentType: string, confidence: number): string {
  if (intentType === 'chat_only') return '嗯嗯，我在听。'
  if (confidence < 0.72) return '我有点不确定你的意思，可以再确认一下。'
  return '收到，我按这个方向处理。'
}

export function buildClassifyPrompt(params: {
  input: string
  interests?: string[]
  sourceContext?: string | null
  ruleResult?: ParsedIntentResult
}): Array<{ role: string; content: string }> {
  const systemPrompt = [
    '你是AI简报助手的意图识别模块。只返回严格JSON，不要加markdown代码块。',
    '可用意图和实体格式：',
    '- create_todo: {"content":"待办简短描述","deadline":"明天/下周/待定"}',
    '- record_thought: {"content":"想法简短摘要"}',
    '- fragmented_thought: {"content":"碎片内容","tags":["标签"]}',
    '- add_interest: {"interests":["领域名称"]}',
    '- remove_interest: {"interests":["领域名称"]}',
    '- set_push_time: {"time":"HH:MM"}',
    '- query_stats: {"period":"week|lastWeek|month|recent"}',
    '- chat_only: {}',
    '- multi: {"intents":[{"type":"意图","entities":{}}]}',
    '输出JSON字段：type, confidence, entities, candidateIntents, replyHint, suggestedActions。',
    'confidence为0到1。replyHint为1句自然中文确认或回应。suggestedActions最多2个。',
    '不要执行动作，不要承诺已经保存，只做意图识别。',
  ].join('\n')

  const userParts: string[] = []
  if (params.interests?.length) {
    userParts.push(`用户当前已关注：${params.interests.map((item) => truncateText(item, 24)).join('、')}`)
  }
  if (params.sourceContext) {
    userParts.push(`来源上下文：${truncateText(params.sourceContext, 120)}`)
  }
  if (params.ruleResult) {
    userParts.push(`规则初判：${params.ruleResult.type} / ${params.ruleResult.confidence} / ${params.ruleResult.matchedBy}`)
  }
  userParts.push(`用户输入：${truncateText(params.input, 500)}`)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userParts.join('\n') },
  ]
}

export function parseClassifyJSON(text: string): ChatClassifyResult | null {
  const normalized = String(text || '').trim()
  if (!normalized) return null

  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fencedMatch?.[1] || normalized
  const start = jsonText.indexOf('{')
  const end = jsonText.lastIndexOf('}')
  const payloadText = start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(payloadText)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    payload = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const rawType = String(payload.type || '').trim()
  const type = KNOWN_INTENTS.has(rawType) ? rawType : 'chat_only'
  const confidence = clampConfidence(payload.confidence)
  const candidateIntents = normalizeStringArray(payload.candidateIntents, [type])
    .filter((item) => KNOWN_INTENTS.has(item))
  if (!candidateIntents.includes(type)) {
    candidateIntents.unshift(type)
  }

  const entities = typeof payload.entities === 'object' && payload.entities !== null && !Array.isArray(payload.entities)
    ? payload.entities as Record<string, unknown>
    : {}
  const replyHint = truncateText(String(payload.replyHint || ''), 80) || defaultReplyHint(type, confidence)

  return {
    type,
    confidence,
    entities,
    matchedBy: 'llm',
    candidateIntents: [...new Set(candidateIntents)].slice(0, 4),
    replyHint,
    suggestedActions: normalizeSuggestedActions(payload.suggestedActions),
  }
}

export async function classifyIntent(params: {
  input: string
  ruleResult: ParsedIntentResult
  config: ResolvedAiProviderConfig
  invocation?: LlmInvocationContext | null
  context?: {
    interests?: string[]
    sourceContext?: string | null
  }
}): Promise<ChatClassifyResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CHAT_LLM_TIMEOUT_MS)

  try {
    const payload = await loggedChatCompletion({
      config: params.config,
      messages: buildClassifyPrompt({
        input: params.input,
        interests: params.context?.interests,
        sourceContext: params.context?.sourceContext,
        ruleResult: params.ruleResult,
      }),
      options: {
        temperature: 0.3,
        maxTokens: 800,
        signal: controller.signal,
      },
      invocation: params.invocation,
    })
    const text = extractText(params.config, payload)
    return parseClassifyJSON(text)
  } catch (error) {
    console.warn('LLM classify failed, falling back to rule engine:', error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}
