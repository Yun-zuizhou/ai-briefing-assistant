import {
  AiProviderRequestError,
  chatCompletion,
  extractText,
  type ResolvedAiProviderConfig,
} from './ai-provider'
import { execute, queryAll } from '../utils/db'

export type LlmInvocationStatus = 'success' | 'error'

export interface LlmInvocationContext {
  db: D1Database
  userId?: number | null
  feature: string
  requestRef?: string | null
  metadata?: Record<string, unknown>
}

export interface LlmInvocationRecordInput extends LlmInvocationContext {
  providerConfig: ResolvedAiProviderConfig
  status: LlmInvocationStatus
  durationMs?: number | null
  inputChars?: number | null
  outputChars?: number | null
  promptTokens?: number | null
  completionTokens?: number | null
  totalTokens?: number | null
  errorCode?: string | null
  errorMessage?: string | null
}

export type LlmOutputValidationResult =
  | boolean
  | {
      valid: boolean
      errorCode?: string | null
      errorMessage?: string | null
    }

export interface LoggedChatCompletionParams {
  config: ResolvedAiProviderConfig
  messages: Array<{ role: string; content: string }>
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: 'text' | 'json_object'
    thinking?: 'enabled' | 'disabled'
    signal?: AbortSignal
  }
  invocation?: LlmInvocationContext | null
  validateOutput?: (params: {
    payload: unknown
    text: string
    config: ResolvedAiProviderConfig
  }) => LlmOutputValidationResult
}

export interface LlmInvocationStats {
  userId: number
  windowLabel: string
  windowHours: number
  windowDays: number
  generatedAt: string
  totals: {
    total: number
    success: number
    error: number
    successRate: number
    avgDurationMs: number | null
    avgInputChars: number | null
    avgOutputChars: number | null
    avgPromptTokens: number | null
    avgCompletionTokens: number | null
    avgTotalTokens: number | null
    totalTokens: number
  }
  byFeature: Array<{
    feature: string
    total: number
    success: number
    error: number
    successRate: number
    avgDurationMs: number | null
    avgTotalTokens: number | null
    totalTokens: number
    lastInvokedAt: string | null
  }>
  byModel: Array<{
    providerName: string
    modelName: string
    transport: string
    total: number
    success: number
    error: number
    successRate: number
    avgDurationMs: number | null
    totalTokens: number
    lastInvokedAt: string | null
  }>
  errors: Array<{
    errorCode: string
    total: number
    lastOccurredAt: string | null
  }>
  recentErrors: Array<{
    invocationId: number
    feature: string
    requestRef: string | null
    providerName: string
    modelName: string
    status: 'error'
    durationMs: number | null
    totalTokens: number | null
    errorCode: string
    errorMessage: string | null
    createdAt: string | null
  }>
}

export interface LlmSoftQuotaResult {
  allowed: boolean
  used: number
  limit: number
  windowHours: number
  feature: string
}

class ModelOutputValidationError extends Error {
  code: string
  recorded: boolean

  constructor(code: string, message: string, recorded = false) {
    super(message)
    this.name = 'ModelOutputValidationError'
    this.code = code
    this.recorded = recorded
  }
}

function truncateText(value: string | null | undefined, limit: number): string | null {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return null
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`
}

function redactSensitiveText(value: string | null | undefined): string | null {
  const normalized = String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[redacted]')
    .replace(/(api[_ -]?key|secret|token|密钥)\s*[:=：]\s*\S+/gi, '$1=[redacted]')
  return truncateText(normalized, 240)
}

function safeJsonStringify(value: unknown, limit = 2000): string | null {
  if (value === undefined || value === null) return null
  try {
    return truncateText(JSON.stringify(sanitizeMetadata(value)), limit)
  } catch {
    return null
  }
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item))
  }
  if (typeof value !== 'object' || value === null) {
    if (typeof value === 'string') {
      return redactSensitiveText(value)
    }
    return value
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (/(api[_-]?key|secret|token|prompt|message|messages|input|output|response|content|answer)/i.test(key)) {
      sanitized[key] = '[redacted]'
      continue
    }
    sanitized[key] = sanitizeMetadata(rawValue)
  }
  return sanitized
}

function countMessageChars(messages: Array<{ content: string }>): number {
  return messages.reduce((total, message) => total + String(message.content || '').length, 0)
}

function normalizeInteger(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, Math.round(numeric))
}

function normalizeCount(value: unknown): number {
  return normalizeInteger(value) ?? 0
}

function normalizeAverage(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.round(numeric)
}

function calculateSuccessRate(success: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((success / total) * 10000) / 100
}

export function extractTokenUsage(payload: unknown): {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
} {
  if (typeof payload !== 'object' || payload === null) {
    return { promptTokens: null, completionTokens: null, totalTokens: null }
  }

  const result = payload as {
    usage?: {
      prompt_tokens?: unknown
      completion_tokens?: unknown
      total_tokens?: unknown
      input_tokens?: unknown
      output_tokens?: unknown
    }
    usageMetadata?: {
      promptTokenCount?: unknown
      candidatesTokenCount?: unknown
      totalTokenCount?: unknown
    }
  }

  const promptTokens = normalizeInteger(
    result.usage?.prompt_tokens
      ?? result.usage?.input_tokens
      ?? result.usageMetadata?.promptTokenCount
  )
  const completionTokens = normalizeInteger(
    result.usage?.completion_tokens
      ?? result.usage?.output_tokens
      ?? result.usageMetadata?.candidatesTokenCount
  )
  const totalTokens = normalizeInteger(
    result.usage?.total_tokens
      ?? result.usageMetadata?.totalTokenCount
      ?? (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null)
  )

  return { promptTokens, completionTokens, totalTokens }
}

function classifyError(error: unknown): { code: string; message: string | null } {
  if (error instanceof ModelOutputValidationError) {
    return {
      code: error.code || 'invalid_model_output',
      message: redactSensitiveText(error.message),
    }
  }
  if (error instanceof AiProviderRequestError) {
    return {
      code: error.status ? `provider_http_${error.status}` : 'provider_request_failed',
      message: redactSensitiveText(error.message),
    }
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { code: 'timeout', message: 'AI provider request timed out or was aborted' }
  }
  if (error instanceof Error) {
    return {
      code: error.name === 'AbortError' ? 'timeout' : 'provider_request_failed',
      message: redactSensitiveText(error.message),
    }
  }
  return { code: 'provider_request_failed', message: redactSensitiveText(String(error || 'Unknown error')) }
}

function normalizeValidationResult(result: LlmOutputValidationResult): {
  valid: boolean
  errorCode: string
  errorMessage: string
} {
  if (typeof result === 'boolean') {
    return {
      valid: result,
      errorCode: 'invalid_model_output',
      errorMessage: 'AI provider returned output that failed business validation',
    }
  }

  return {
    valid: Boolean(result.valid),
    errorCode: result.errorCode || 'invalid_model_output',
    errorMessage: result.errorMessage || 'AI provider returned output that failed business validation',
  }
}

export async function recordLlmInvocation(input: LlmInvocationRecordInput): Promise<void> {
  await execute(
    input.db,
    `
      INSERT INTO llm_invocations (
        user_id, feature, request_ref, provider_name, provider_source, model_name,
        transport, status, duration_ms, input_chars, output_chars,
        prompt_tokens, completion_tokens, total_tokens, error_code, error_message,
        metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [
      input.userId ?? null,
      truncateText(input.feature, 80),
      truncateText(input.requestRef || null, 160),
      input.providerConfig.provider,
      input.providerConfig.source,
      truncateText(input.providerConfig.model, 120),
      input.providerConfig.transport,
      input.status,
      input.durationMs ?? null,
      input.inputChars ?? null,
      input.outputChars ?? null,
      input.promptTokens ?? null,
      input.completionTokens ?? null,
      input.totalTokens ?? null,
      input.errorCode ?? null,
      redactSensitiveText(input.errorMessage || null),
      safeJsonStringify(input.metadata),
    ]
  )
}

type TotalsRow = {
  total?: number | null
  success?: number | null
  error?: number | null
  avg_duration_ms?: number | null
  avg_input_chars?: number | null
  avg_output_chars?: number | null
  avg_prompt_tokens?: number | null
  avg_completion_tokens?: number | null
  avg_total_tokens?: number | null
  total_tokens?: number | null
}

type FeatureStatsRow = {
  feature?: string | null
  total?: number | null
  success?: number | null
  error?: number | null
  avg_duration_ms?: number | null
  avg_total_tokens?: number | null
  total_tokens?: number | null
  last_invoked_at?: string | null
}

type ModelStatsRow = {
  provider_name?: string | null
  model_name?: string | null
  transport?: string | null
  total?: number | null
  success?: number | null
  error?: number | null
  avg_duration_ms?: number | null
  total_tokens?: number | null
  last_invoked_at?: string | null
}

type ErrorStatsRow = {
  error_code?: string | null
  total?: number | null
  last_occurred_at?: string | null
}

type RecentErrorRow = {
  id?: number | null
  feature?: string | null
  request_ref?: string | null
  provider_name?: string | null
  model_name?: string | null
  duration_ms?: number | null
  total_tokens?: number | null
  error_code?: string | null
  error_message?: string | null
  created_at?: string | null
}

function normalizeStatsWindow(params: {
  window?: string | null
  windowDays?: number
}): {
  label: string
  hours: number
  legacyDays: number
  sqliteModifier: string
} {
  const normalized = String(params.window || '').trim().toLowerCase()
  const known: Record<string, number> = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  }

  if (normalized in known) {
    const hours = known[normalized]
    return {
      label: normalized,
      hours,
      legacyDays: Math.max(1, Math.ceil(hours / 24)),
      sqliteModifier: `-${hours} hours`,
    }
  }

  const windowDays = Math.min(365, Math.max(1, normalizeCount(params.windowDays) || 30))
  return {
    label: `${windowDays}d`,
    hours: windowDays * 24,
    legacyDays: windowDays,
    sqliteModifier: `-${windowDays} days`,
  }
}

export async function getLlmInvocationStats(params: {
  db: D1Database
  userId: number
  window?: string | null
  windowDays?: number
  limit?: number
}): Promise<LlmInvocationStats> {
  const window = normalizeStatsWindow({
    window: params.window,
    windowDays: params.windowDays,
  })
  const limit = Math.min(50, Math.max(1, normalizeCount(params.limit) || 20))
  const baseParams = [params.userId, window.sqliteModifier]

  const [totalsRows, featureRows, modelRows, errorRows, recentErrorRows] = await Promise.all([
    queryAll<TotalsRow>(
      params.db,
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error,
          AVG(duration_ms) AS avg_duration_ms,
          AVG(input_chars) AS avg_input_chars,
          AVG(output_chars) AS avg_output_chars,
          AVG(prompt_tokens) AS avg_prompt_tokens,
          AVG(completion_tokens) AS avg_completion_tokens,
          AVG(total_tokens) AS avg_total_tokens,
          SUM(COALESCE(total_tokens, 0)) AS total_tokens
        FROM llm_invocations
        WHERE user_id = ? AND created_at >= datetime('now', ?)
      `,
      baseParams
    ),
    queryAll<FeatureStatsRow>(
      params.db,
      `
        SELECT
          feature,
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error,
          AVG(duration_ms) AS avg_duration_ms,
          AVG(total_tokens) AS avg_total_tokens,
          SUM(COALESCE(total_tokens, 0)) AS total_tokens,
          MAX(created_at) AS last_invoked_at
        FROM llm_invocations
        WHERE user_id = ? AND created_at >= datetime('now', ?)
        GROUP BY feature
        ORDER BY total DESC, last_invoked_at DESC
        LIMIT ?
      `,
      [...baseParams, limit]
    ),
    queryAll<ModelStatsRow>(
      params.db,
      `
        SELECT
          provider_name,
          model_name,
          transport,
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error,
          AVG(duration_ms) AS avg_duration_ms,
          SUM(COALESCE(total_tokens, 0)) AS total_tokens,
          MAX(created_at) AS last_invoked_at
        FROM llm_invocations
        WHERE user_id = ? AND created_at >= datetime('now', ?)
        GROUP BY provider_name, model_name, transport
        ORDER BY total DESC, last_invoked_at DESC
        LIMIT ?
      `,
      [...baseParams, limit]
    ),
    queryAll<ErrorStatsRow>(
      params.db,
      `
        SELECT
          COALESCE(error_code, 'unknown_error') AS error_code,
          COUNT(*) AS total,
          MAX(created_at) AS last_occurred_at
        FROM llm_invocations
        WHERE user_id = ? AND status = 'error' AND created_at >= datetime('now', ?)
        GROUP BY COALESCE(error_code, 'unknown_error')
        ORDER BY total DESC, last_occurred_at DESC
        LIMIT ?
      `,
      [...baseParams, limit]
    ),
    queryAll<RecentErrorRow>(
      params.db,
      `
        SELECT
          id, feature, request_ref, provider_name, model_name, duration_ms,
          total_tokens, COALESCE(error_code, 'unknown_error') AS error_code,
          error_message, created_at
        FROM llm_invocations
        WHERE user_id = ? AND status = 'error' AND created_at >= datetime('now', ?)
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
      `,
      [...baseParams, limit]
    ),
  ])

  const totalsRow = totalsRows[0] || {}
  const total = normalizeCount(totalsRow.total)
  const success = normalizeCount(totalsRow.success)
  const error = normalizeCount(totalsRow.error)

  return {
    userId: params.userId,
    windowLabel: window.label,
    windowHours: window.hours,
    windowDays: window.legacyDays,
    generatedAt: new Date().toISOString(),
    totals: {
      total,
      success,
      error,
      successRate: calculateSuccessRate(success, total),
      avgDurationMs: normalizeAverage(totalsRow.avg_duration_ms),
      avgInputChars: normalizeAverage(totalsRow.avg_input_chars),
      avgOutputChars: normalizeAverage(totalsRow.avg_output_chars),
      avgPromptTokens: normalizeAverage(totalsRow.avg_prompt_tokens),
      avgCompletionTokens: normalizeAverage(totalsRow.avg_completion_tokens),
      avgTotalTokens: normalizeAverage(totalsRow.avg_total_tokens),
      totalTokens: normalizeCount(totalsRow.total_tokens),
    },
    byFeature: featureRows.map((row) => {
      const rowTotal = normalizeCount(row.total)
      const rowSuccess = normalizeCount(row.success)
      return {
        feature: String(row.feature || 'unknown'),
        total: rowTotal,
        success: rowSuccess,
        error: normalizeCount(row.error),
        successRate: calculateSuccessRate(rowSuccess, rowTotal),
        avgDurationMs: normalizeAverage(row.avg_duration_ms),
        avgTotalTokens: normalizeAverage(row.avg_total_tokens),
        totalTokens: normalizeCount(row.total_tokens),
        lastInvokedAt: row.last_invoked_at || null,
      }
    }),
    byModel: modelRows.map((row) => {
      const rowTotal = normalizeCount(row.total)
      const rowSuccess = normalizeCount(row.success)
      return {
        providerName: String(row.provider_name || 'unknown'),
        modelName: String(row.model_name || 'unknown'),
        transport: String(row.transport || 'unknown'),
        total: rowTotal,
        success: rowSuccess,
        error: normalizeCount(row.error),
        successRate: calculateSuccessRate(rowSuccess, rowTotal),
        avgDurationMs: normalizeAverage(row.avg_duration_ms),
        totalTokens: normalizeCount(row.total_tokens),
        lastInvokedAt: row.last_invoked_at || null,
      }
    }),
    errors: errorRows.map((row) => ({
      errorCode: String(row.error_code || 'unknown_error'),
      total: normalizeCount(row.total),
      lastOccurredAt: row.last_occurred_at || null,
    })),
    recentErrors: recentErrorRows.map((row) => ({
      invocationId: normalizeCount(row.id),
      feature: String(row.feature || 'unknown'),
      requestRef: row.request_ref || null,
      providerName: String(row.provider_name || 'unknown'),
      modelName: String(row.model_name || 'unknown'),
      status: 'error',
      durationMs: normalizeAverage(row.duration_ms),
      totalTokens: normalizeInteger(row.total_tokens),
      errorCode: String(row.error_code || 'unknown_error'),
      errorMessage: row.error_message || null,
      createdAt: row.created_at || null,
    })),
  }
}

export async function checkLlmSoftQuota(params: {
  db: D1Database
  userId: number
  feature: string
  windowHours?: number
  maxCalls?: number
}): Promise<LlmSoftQuotaResult> {
  const windowHours = Math.min(24 * 30, Math.max(1, normalizeCount(params.windowHours) || 24))
  const limit = Math.min(1000, Math.max(1, normalizeCount(params.maxCalls) || 20))

  try {
    const rows = await queryAll<{ total?: number | null }>(
      params.db,
      `
        SELECT COUNT(*) AS total
        FROM llm_invocations
        WHERE user_id = ?
          AND feature = ?
          AND created_at >= datetime('now', ?)
      `,
      [params.userId, params.feature, `-${windowHours} hours`]
    )
    const used = normalizeCount(rows[0]?.total)
    return {
      allowed: used < limit,
      used,
      limit,
      windowHours,
      feature: params.feature,
    }
  } catch (error) {
    console.warn('Check LLM soft quota skipped:', error)
    return {
      allowed: true,
      used: 0,
      limit,
      windowHours,
      feature: params.feature,
    }
  }
}

async function safeRecordLlmInvocation(input: LlmInvocationRecordInput): Promise<void> {
  try {
    await recordLlmInvocation(input)
  } catch (error) {
    console.warn('Record LLM invocation failed:', error)
  }
}

export async function loggedChatCompletion(params: LoggedChatCompletionParams): Promise<unknown> {
  const startedAt = Date.now()
  const inputChars = countMessageChars(params.messages)

  try {
    const payload = await chatCompletion(params.config, params.messages, params.options)
    const outputText = extractText(params.config, payload)
    const usage = extractTokenUsage(payload)
    if (params.validateOutput) {
      const validation = normalizeValidationResult(params.validateOutput({
        payload,
        text: outputText,
        config: params.config,
      }))
      if (!validation.valid) {
        if (params.invocation) {
          await safeRecordLlmInvocation({
            ...params.invocation,
            providerConfig: params.config,
            status: 'error',
            durationMs: Date.now() - startedAt,
            inputChars,
            outputChars: outputText.length,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            errorCode: validation.errorCode,
            errorMessage: validation.errorMessage,
          })
        }
        throw new ModelOutputValidationError(validation.errorCode, validation.errorMessage, true)
      }
    }
    if (params.invocation) {
      await safeRecordLlmInvocation({
        ...params.invocation,
        providerConfig: params.config,
        status: 'success',
        durationMs: Date.now() - startedAt,
        inputChars,
        outputChars: outputText.length,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      })
    }
    return payload
  } catch (error) {
    if (error instanceof ModelOutputValidationError && error.recorded) {
      throw error
    }
    if (params.invocation) {
      const classified = classifyError(error)
      await safeRecordLlmInvocation({
        ...params.invocation,
        providerConfig: params.config,
        status: 'error',
        durationMs: Date.now() - startedAt,
        inputChars,
        outputChars: null,
        errorCode: classified.code,
        errorMessage: classified.message,
      })
    }
    throw error
  }
}
