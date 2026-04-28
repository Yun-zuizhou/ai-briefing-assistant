import { buildSummaryTaskResultRef, isSummaryProviderEnabled } from './builder'
import {
  createFeedbackSubmission,
  createAiProcessingRun,
  createIngestionRun,
  createOperationLog,
  createReplayTask,
  createSummaryTask,
  getSummaryResultByTaskId,
  getSummaryTaskById,
  getSummaryTaskExecutionById,
  markSummaryTaskFailed,
  markSummaryTaskRunning,
  markSummaryTaskSucceeded,
  upsertSummaryResult,
} from './store'
import type { SummaryTaskStatus } from './types'

export async function createSummaryTaskAction(params: {
  db: D1Database
  userId: number
  summaryProviderEnabled?: string
  payload: {
    content_type?: string | null
    content_id?: number | null
    source_url?: string | null
    title?: string | null
    summary_kind?: string | null
    provider_name?: string | null
    model_name?: string | null
    result_ref?: string | null
  }
}) {
  const { db, userId, summaryProviderEnabled, payload } = params
  const summaryKind = String(payload.summary_kind || 'standard').trim() || 'standard'
  const providerEnabled = isSummaryProviderEnabled(summaryProviderEnabled)
  const status: SummaryTaskStatus = providerEnabled ? 'queued' : 'pending_provider'
  const errorMessage = providerEnabled ? null : 'Summary provider is not configured yet'
  const resultRef =
    payload.result_ref ||
    buildSummaryTaskResultRef({
      contentType: payload.content_type,
      contentId: payload.content_id ?? null,
      summaryKind,
      sourceUrl: payload.source_url,
    })

  const taskId = await createSummaryTask(db, {
    userId,
    contentType: payload.content_type,
    contentId: payload.content_id ?? null,
    sourceUrl: payload.source_url,
    title: payload.title,
    summaryKind,
    status,
    providerName: payload.provider_name,
    modelName: payload.model_name,
    resultRef,
    errorMessage,
  })

  return {
    status,
    task: await getSummaryTaskById(db, taskId),
    taskId,
  }
}

function stringifyJsonField(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

export async function startSummaryTaskAction(params: {
  db: D1Database
  taskId: number
  payload: {
    started_at?: string | null
  }
}) {
  const task = await getSummaryTaskExecutionById(params.db, params.taskId)
  if (!task) {
    return { error: 'not_found' as const }
  }

  if (task.status === 'succeeded' || task.status === 'failed') {
    return { error: 'terminal_state' as const }
  }

  if (task.status !== 'running') {
    await markSummaryTaskRunning(params.db, {
      taskId: params.taskId,
      startedAt: params.payload.started_at || null,
    })
  }

  return {
    task: await getSummaryTaskById(params.db, params.taskId),
  }
}

export async function completeSummaryTaskAction(params: {
  db: D1Database
  taskId: number
  payload: {
    result_ref?: string | null
    profile_id?: string | null
    provider_name?: string | null
    model_name?: string | null
    prompt_version?: string | null
    source_payload?: unknown
    summary_title?: string | null
    summary_text?: string | null
    key_points?: unknown
    risk_flags?: unknown
    consult_context?: unknown
    citations?: unknown
    raw_response?: unknown
    finished_at?: string | null
  }
}) {
  const task = await getSummaryTaskExecutionById(params.db, params.taskId)
  if (!task) {
    return { error: 'not_found' as const }
  }

  if (task.status === 'failed') {
    return { error: 'terminal_state' as const }
  }

  if (task.status !== 'running' && task.status !== 'succeeded') {
    return { error: 'not_running' as const }
  }

  const resultRef =
    params.payload.result_ref ||
    task.result_ref ||
    buildSummaryTaskResultRef({
      contentType: task.content_type,
      contentId: task.content_id,
      sourceUrl: task.source_url,
      summaryKind: task.summary_kind,
    })

  await upsertSummaryResult(params.db, {
    taskId: params.taskId,
    userId: task.user_id,
    contentType: task.content_type,
    contentId: task.content_id,
    sourceUrl: task.source_url,
    resultRef,
    profileId: params.payload.profile_id || null,
    providerName: params.payload.provider_name || task.provider_name || null,
    modelName: params.payload.model_name || task.model_name || null,
    promptVersion: params.payload.prompt_version || null,
    sourcePayloadJson: stringifyJsonField(params.payload.source_payload),
    summaryTitle: params.payload.summary_title || null,
    summaryText: params.payload.summary_text || null,
    keyPointsJson: stringifyJsonField(params.payload.key_points),
    riskFlagsJson: stringifyJsonField(params.payload.risk_flags),
    consultContextJson: stringifyJsonField(params.payload.consult_context),
    citationsJson: stringifyJsonField(params.payload.citations),
    rawResponseJson: stringifyJsonField(params.payload.raw_response),
  })

  await markSummaryTaskSucceeded(params.db, {
    taskId: params.taskId,
    finishedAt: params.payload.finished_at || null,
  })

  return {
    task: await getSummaryTaskById(params.db, params.taskId),
    result: await getSummaryResultByTaskId(params.db, params.taskId, task.user_id),
  }
}

export async function failSummaryTaskAction(params: {
  db: D1Database
  taskId: number
  payload: {
    error_message?: string | null
    finished_at?: string | null
  }
}) {
  const task = await getSummaryTaskExecutionById(params.db, params.taskId)
  if (!task) {
    return { error: 'not_found' as const }
  }

  if (task.status === 'succeeded') {
    return { error: 'terminal_state' as const }
  }

  const errorMessage = String(params.payload.error_message || '').trim()
  if (!errorMessage) {
    return { error: 'missing_error_message' as const }
  }

  await markSummaryTaskFailed(params.db, {
    taskId: params.taskId,
    errorMessage,
    finishedAt: params.payload.finished_at || null,
  })

  return {
    task: await getSummaryTaskById(params.db, params.taskId),
  }
}

export async function createIngestionRunAction(params: {
  db: D1Database
  payload: {
    pipeline_name: string
    status?: string
    started_at?: string
    finished_at?: string | null
    stats_json?: string | null
    error_message?: string | null
    retry_of?: number | null
  }
}): Promise<number> {
  return createIngestionRun(params.db, {
    pipelineName: params.payload.pipeline_name,
    status: params.payload.status || 'running',
    startedAt: params.payload.started_at || null,
    finishedAt: params.payload.finished_at || null,
    statsJson: params.payload.stats_json || null,
    errorMessage: params.payload.error_message || null,
    retryOf: params.payload.retry_of ?? null,
  })
}

export async function createAiProcessingRunAction(params: {
  db: D1Database
  payload: {
    task_type: string
    content_type?: string | null
    content_id?: number | null
    status?: string
    attempt?: number
    tokens_used?: number | null
    error_message?: string | null
    result_ref?: string | null
  }
}): Promise<number> {
  return createAiProcessingRun(params.db, {
    taskType: params.payload.task_type,
    contentType: params.payload.content_type || null,
    contentId: params.payload.content_id ?? null,
    status: params.payload.status || 'running',
    attempt: params.payload.attempt || 1,
    tokensUsed: params.payload.tokens_used ?? null,
    errorMessage: params.payload.error_message || null,
    resultRef: params.payload.result_ref || null,
  })
}

export async function createOperationLogAction(params: {
  db: D1Database
  userId: number
  payload: {
    chain_name: string
    level?: 'debug' | 'info' | 'warn' | 'error'
    request_id?: string | null
    message: string
    payload?: string | null
    replayable?: boolean
  }
}): Promise<number> {
  return createOperationLog(params.db, {
    chainName: params.payload.chain_name,
    level: params.payload.level || 'info',
    userId: params.userId,
    requestId: params.payload.request_id || null,
    message: params.payload.message,
    payload: params.payload.payload || null,
    replayable: Boolean(params.payload.replayable),
  })
}

export async function createReplayTaskAction(params: {
  db: D1Database
  userId: number
  payload: {
    operation_log_id: number
    reason?: string | null
  }
}): Promise<number> {
  return createReplayTask(params.db, {
    operationLogId: params.payload.operation_log_id,
    requestedBy: params.userId,
    reason: params.payload.reason || null,
  })
}

export async function createFeedbackSubmissionAction(params: {
  db: D1Database
  userId: number
  payload: {
    feedback_type?: 'bug' | 'suggestion' | 'other'
    content?: string
    source_page?: string | null
  }
}) {
  const feedbackType = params.payload.feedback_type || 'suggestion'
  const content = String(params.payload.content || '').trim()
  const sourcePage = params.payload.source_page ? String(params.payload.source_page).trim() : null

  if (!content) {
    return { error: '反馈内容不能为空' as const }
  }

  if (!['bug', 'suggestion', 'other'].includes(feedbackType)) {
    return { error: '反馈类型无效' as const }
  }

  const submission = await createFeedbackSubmission(params.db, {
    userId: params.userId,
    feedbackType,
    content,
    sourcePage,
  })

  return { submission }
}
