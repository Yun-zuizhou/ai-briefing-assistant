import type { DailyDigestRow } from './types'
import {
  getAiPlatformDefinition,
  resolveEnvSummaryProviderConfig,
  resolveUserAiProviderConfig,
  type ResolvedAiProviderConfig,
} from '../ai-provider'

export class DigestConsultProviderError extends Error {
  code: 'provider_not_configured' | 'provider_request_failed'

  constructor(code: 'provider_not_configured' | 'provider_request_failed', message: string) {
    super(message)
    this.code = code
  }
}

type ConsultBindings = {
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_DEBUG_FALLBACK?: string
  ENVIRONMENT?: string
}

type ConsultResult = {
  answer: string
  evidence: string[]
  uncertainties: string[]
  suggested_next_actions: string[]
  providerName: string
  modelName: string
}

function isDebugFallbackEnabled(bindings: ConsultBindings): boolean {
  const enabled = String(bindings.SUMMARY_PROVIDER_DEBUG_FALLBACK || '').trim().toLowerCase()
  const env = String(bindings.ENVIRONMENT || '').trim().toLowerCase()
  return env !== 'production' && ['1', 'true', 'yes', 'on'].includes(enabled)
}

function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function extractOpenAICompatibleText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''
  const result = payload as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return String(result.choices?.[0]?.message?.content || '').trim()
}

function extractAnthropicText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''
  const result = payload as {
    content?: Array<{ text?: string }>
  }
  return String(result.content?.[0]?.text || '').trim()
}

function extractGeminiText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''
  const result = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return String(result.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
}

function extractQwenText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''
  const result = payload as {
    output?: {
      text?: string
      choices?: Array<{ message?: { content?: string } }>
    }
    choices?: Array<{ message?: { content?: string } }>
  }

  return String(
    result.output?.text
      || result.output?.choices?.[0]?.message?.content
      || result.choices?.[0]?.message?.content
      || ''
  ).trim()
}

function extractLocalText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''
  const result = payload as {
    message?: { content?: string }
    response?: string
  }
  return String(result.message?.content || result.response || '').trim()
}

function extractProviderText(config: ResolvedAiProviderConfig, payload: unknown): string {
  switch (config.transport) {
    case 'anthropic':
      return extractAnthropicText(payload)
    case 'gemini':
      return extractGeminiText(payload)
    case 'qwen':
      return extractQwenText(payload)
    case 'local':
      return extractLocalText(payload)
    case 'openai-compatible':
    default:
      return extractOpenAICompatibleText(payload)
  }
}

function parseConsultPayload(text: string): Omit<ConsultResult, 'providerName' | 'modelName'> {
  const normalized = text.trim()
  if (!normalized) {
    throw new DigestConsultProviderError('provider_request_failed', '咨询 provider 返回为空')
  }

  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fencedMatch?.[1] || normalized
  const start = jsonText.indexOf('{')
  const end = jsonText.lastIndexOf('}')
  const payloadText = start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText

  const payload = JSON.parse(payloadText) as {
    answer?: string
    evidence?: string[]
    uncertainties?: string[]
    suggested_next_actions?: string[]
  }

  return {
    answer: String(payload.answer || '').trim(),
    evidence: Array.isArray(payload.evidence) ? payload.evidence.map((item) => String(item)) : [],
    uncertainties: Array.isArray(payload.uncertainties) ? payload.uncertainties.map((item) => String(item)) : [],
    suggested_next_actions: Array.isArray(payload.suggested_next_actions)
      ? payload.suggested_next_actions.map((item) => String(item))
      : [],
  }
}

function buildConsultMessages(params: {
  digestResult: DailyDigestRow
  question: string
}) {
  const sourcePayload = parseJsonField<Record<string, unknown> | null>(params.digestResult.source_payload_json, null)
  const keyPoints = parseJsonField<string[]>(params.digestResult.key_points_json, [])
  const riskFlags = parseJsonField<string[]>(params.digestResult.risk_flags_json, [])
  const consultContext = parseJsonField<Record<string, unknown> | null>(params.digestResult.consult_context_json, null)
  const citations = parseJsonField<Array<{ title?: string; url?: string }>>(params.digestResult.citations_json, [])

  return [
    {
      role: 'system',
      content:
        '你是“AI 重点信息咨询助手”。你只允许依据给定摘要结果、原始材料和引用信息回答问题。不要编造事实；若超出材料范围，明确说明“当前材料不足以判断”。请输出 JSON。',
    },
    {
      role: 'user',
      content: [
        '【摘要结果】',
        JSON.stringify(
          {
            result_ref: params.digestResult.result_ref,
            summary_title: params.digestResult.summary_title,
            summary_text: params.digestResult.summary_text,
            key_points: keyPoints,
            risk_flags: riskFlags,
            source_payload: sourcePayload,
            consult_context: consultContext,
            citations,
          },
          null,
          2
        ),
        '',
        '【用户问题】',
        params.question,
        '',
        '【输出格式】',
        JSON.stringify(
          {
            answer: '简明回答',
            evidence: ['证据1', '证据2'],
            uncertainties: ['若无则返回空数组'],
            suggested_next_actions: ['若无则返回空数组'],
          },
          null,
          2
        ),
      ].join('\n'),
    },
  ]
}

function splitSystemMessage(messages: Array<{ role: string; content: string }>) {
  const systemParts: string[] = []
  const conversationalMessages: Array<{ role: string; content: string }> = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content)
      continue
    }
    conversationalMessages.push(message)
  }

  return {
    system: systemParts.join('\n\n').trim(),
    messages: conversationalMessages,
  }
}

async function requestConsultProvider(
  config: ResolvedAiProviderConfig,
  messages: Array<{ role: string; content: string }>
): Promise<unknown> {
  switch (config.transport) {
    case 'anthropic': {
      const split = splitSystemMessage(messages)
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          system: split.system || undefined,
          messages: split.messages.map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
          })),
          max_tokens: 600,
          temperature: 0.2,
        }),
      })
      if (!response.ok) {
        throw new DigestConsultProviderError('provider_request_failed', `Summary provider request failed: ${response.status}`)
      }
      return response.json()
    }
    case 'gemini': {
      const response = await fetch(`${config.apiUrl}/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
          },
        }),
      })
      if (!response.ok) {
        throw new DigestConsultProviderError('provider_request_failed', `Summary provider request failed: ${response.status}`)
      }
      return response.json()
    }
    case 'qwen': {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          input: {
            messages,
          },
          parameters: {
            temperature: 0.2,
            max_tokens: 600,
          },
        }),
      })
      if (!response.ok) {
        throw new DigestConsultProviderError('provider_request_failed', `Summary provider request failed: ${response.status}`)
      }
      return response.json()
    }
    case 'local': {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
      })
      if (!response.ok) {
        throw new DigestConsultProviderError('provider_request_failed', `Summary provider request failed: ${response.status}`)
      }
      return response.json()
    }
    case 'openai-compatible':
    default: {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.2,
          max_tokens: 600,
        }),
      })
      if (!response.ok) {
        throw new DigestConsultProviderError('provider_request_failed', `Summary provider request failed: ${response.status}`)
      }
      return response.json()
    }
  }
}

export async function consultDigestResult(params: {
  bindings: ConsultBindings
  digestResult: DailyDigestRow
  question: string
  userProvider?: {
    provider?: string | null
    apiKey?: string | null
  } | null
}): Promise<ConsultResult> {
  const providerConfig = resolveUserAiProviderConfig({
    provider: params.userProvider?.provider,
    apiKey: params.userProvider?.apiKey,
  }) || resolveEnvSummaryProviderConfig(params.bindings)

  if (providerConfig) {
    const payload = await requestConsultProvider(
      providerConfig,
      buildConsultMessages({
        digestResult: params.digestResult,
        question: params.question,
      })
    )
    const text = extractProviderText(providerConfig, payload)
    const parsed = parseConsultPayload(text)

    return {
      ...parsed,
      providerName: providerConfig.source === 'user' ? providerConfig.provider : 'summary-provider',
      modelName: providerConfig.model,
    }
  }

  if (isDebugFallbackEnabled(params.bindings)) {
    const keyPoints = parseJsonField<string[]>(params.digestResult.key_points_json, [])
    const sourcePayload = parseJsonField<Record<string, unknown> | null>(params.digestResult.source_payload_json, null)
    return {
      answer: `当前为阶段十六本地调试咨询回答：这条内容的核心仍是“${params.digestResult.summary_title || sourcePayload?.title || '当前条目'}”。如果你后续要把它转成正式行动，建议优先围绕摘要要点继续确认是否需要转待办。`,
      evidence: [
        params.digestResult.summary_text || '当前摘要正文尚为空',
        ...keyPoints.slice(0, 2),
      ].filter(Boolean),
      uncertainties: ['当前回答来自 debug fallback，仅用于本地联调，不代表正式模型输出。'],
      suggested_next_actions: ['继续查看原文', '如有行动价值可转成待办'],
      providerName: 'debug-fallback',
      modelName: 'rule-based',
    }
  }

  const selectedUserPlatform = getAiPlatformDefinition(params.userProvider?.provider)
  if (selectedUserPlatform && !String(params.userProvider?.apiKey || '').trim()) {
    throw new DigestConsultProviderError('provider_not_configured', '当前已选择 AI 平台，但 API Key 尚未填写')
  }

  if (selectedUserPlatform) {
    throw new DigestConsultProviderError('provider_not_configured', '当前用户 AI 平台配置不可用')
  }

  throw new DigestConsultProviderError('provider_not_configured', 'Summary provider is not configured yet')
}
