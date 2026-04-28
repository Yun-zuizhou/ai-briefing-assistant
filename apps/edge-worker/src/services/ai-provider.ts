export type UserAiPlatform =
  | 'deepseek'
  | 'openai'
  | 'nvidia'
  | 'anthropic'
  | 'gemini'
  | 'zhipu'
  | 'qwen'

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

const AI_PLATFORM_DEFINITIONS: Record<UserAiPlatform, AiPlatformDefinition> = {
  deepseek: {
    provider: 'deepseek',
    label: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
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
}

function normalizeProvider(value: string | null | undefined): UserAiPlatform | null {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  return normalized in AI_PLATFORM_DEFINITIONS
    ? (normalized as UserAiPlatform)
    : null
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
  if (!apiKey) return null

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
}): ResolvedAiProviderConfig | null {
  const enabled = ['1', 'true', 'yes', 'on'].includes(
    String(bindings.SUMMARY_PROVIDER_ENABLED || '').trim().toLowerCase()
  )
  const apiKey = String(bindings.SUMMARY_PROVIDER_API_KEY || '').trim()
  const apiUrl = String(bindings.SUMMARY_PROVIDER_API_URL || '').trim()
  const model = String(bindings.SUMMARY_PROVIDER_MODEL || '').trim()

  if (!enabled || !apiKey) return null

  return {
    provider: 'openai',
    label: 'Summary Provider',
    apiUrl: apiUrl || 'https://api.openai.com/v1/chat/completions',
    model: model || 'gpt-4o-mini',
    transport: 'openai-compatible',
    apiKey,
    source: 'env',
  }
}
