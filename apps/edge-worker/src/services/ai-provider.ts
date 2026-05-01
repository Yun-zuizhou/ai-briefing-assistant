export type UserAiPlatform =
  | 'deepseek'
  | 'openai'
  | 'nvidia'
  | 'anthropic'
  | 'gemini'
  | 'zhipu'
  | 'qwen'
  | 'local'

export type AiTransportKind =
  | 'openai-compatible'
  | 'anthropic'
  | 'gemini'
  | 'qwen'
  | 'local'

export interface AiPlatformDefinition {
  provider: UserAiPlatform
  label: string
  apiUrl: string
  model: string
  transport: AiTransportKind
}

export interface ResolvedAiProviderConfig extends AiPlatformDefinition {
  apiKey: string
  source: 'user' | 'env'
}

export type AiResponseFormat = 'text' | 'json_object'
export type AiThinkingMode = 'enabled' | 'disabled'

const AI_PLATFORM_DEFINITIONS: Record<UserAiPlatform, AiPlatformDefinition> = {
  deepseek: {
    provider: 'deepseek',
    label: 'DeepSeek V4 Flash',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-v4-flash',
    transport: 'openai-compatible',
  },
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    transport: 'openai-compatible',
  },
  nvidia: {
    provider: 'nvidia',
    label: 'NVIDIA',
    apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'meta/llama-3.1-8b-instruct',
    transport: 'openai-compatible',
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-latest',
    transport: 'anthropic',
  },
  gemini: {
    provider: 'gemini',
    label: 'Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.0-flash',
    transport: 'gemini',
  },
  zhipu: {
    provider: 'zhipu',
    label: '智谱',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    transport: 'openai-compatible',
  },
  qwen: {
    provider: 'qwen',
    label: '通义千问',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo',
    transport: 'qwen',
  },
  local: {
    provider: 'local',
    label: '本地模型',
    apiUrl: 'http://localhost:11434/api/chat',
    model: 'llama3',
    transport: 'local',
  },
}

export class AiProviderRequestError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AiProviderRequestError'
    this.status = status
  }
}

function normalizeProvider(value: string | null | undefined): UserAiPlatform | null {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  return normalized in AI_PLATFORM_DEFINITIONS
    ? (normalized as UserAiPlatform)
    : null
}

function normalizeTransport(value: string | null | undefined): AiTransportKind | null {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  if (['openai-compatible', 'anthropic', 'gemini', 'qwen', 'local'].includes(normalized)) {
    return normalized as AiTransportKind
  }
  return null
}

export function listUserAiPlatforms(): AiPlatformDefinition[] {
  return Object.values(AI_PLATFORM_DEFINITIONS)
}

export function getAiPlatformDefinition(value: string | null | undefined): AiPlatformDefinition | null {
  const provider = normalizeProvider(value)
  return provider ? AI_PLATFORM_DEFINITIONS[provider] : null
}

export function maskApiKey(value: string | null | undefined): string | null {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`
  }
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`
}

export function resolveUserAiProviderConfig(params: {
  provider?: string | null
  apiKey?: string | null
}): ResolvedAiProviderConfig | null {
  const definition = getAiPlatformDefinition(params.provider)
  if (!definition) return null

  const apiKey = String(params.apiKey || '').trim()
  if (!apiKey && definition.transport !== 'local') return null

  return {
    ...definition,
    apiKey,
    source: 'user',
  }
}

export function resolveEnvSummaryProviderConfig(bindings: {
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_TRANSPORT?: string
}): ResolvedAiProviderConfig | null {
  const enabled = ['1', 'true', 'yes', 'on'].includes(
    String(bindings.SUMMARY_PROVIDER_ENABLED || '').trim().toLowerCase()
  )
  const apiKey = String(bindings.SUMMARY_PROVIDER_API_KEY || '').trim()
  const apiUrl = String(bindings.SUMMARY_PROVIDER_API_URL || '').trim()
  const model = String(bindings.SUMMARY_PROVIDER_MODEL || '').trim()
  const transport = normalizeTransport(bindings.SUMMARY_PROVIDER_TRANSPORT) || 'openai-compatible'

  if (!enabled) return null
  if (!apiKey && transport !== 'local') return null

  return {
    provider: 'openai',
    label: 'Summary Provider',
    apiUrl: apiUrl || 'https://api.openai.com/v1/chat/completions',
    model: model || 'gpt-4o-mini',
    transport,
    apiKey,
    source: 'env',
  }
}

export function splitSystemMessage(messages: Array<{ role: string; content: string }>) {
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

async function parseProviderResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new AiProviderRequestError(`AI provider request failed: ${response.status}`, response.status)
  }
  return response.json()
}

export async function chatCompletion(
  config: ResolvedAiProviderConfig,
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number
    maxTokens?: number
    responseFormat?: AiResponseFormat
    thinking?: AiThinkingMode
    signal?: AbortSignal
  } = {}
): Promise<unknown> {
  const temperature = options.temperature ?? 0.2
  const maxTokens = options.maxTokens ?? 600

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
          max_tokens: maxTokens,
          temperature,
        }),
        signal: options.signal,
      })
      return parseProviderResponse(response)
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
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
        signal: options.signal,
      })
      return parseProviderResponse(response)
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
            temperature,
            max_tokens: maxTokens,
          },
        }),
        signal: options.signal,
      })
      return parseProviderResponse(response)
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
            temperature,
            num_predict: maxTokens,
          },
        }),
        signal: options.signal,
      })
      return parseProviderResponse(response)
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
          temperature,
          max_tokens: maxTokens,
          response_format: options.responseFormat === 'json_object'
            ? { type: 'json_object' }
            : undefined,
          thinking: config.provider === 'deepseek' && options.thinking
            ? { type: options.thinking }
            : undefined,
        }),
        signal: options.signal,
      })
      return parseProviderResponse(response)
    }
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

export function extractText(config: ResolvedAiProviderConfig, payload: unknown): string {
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
