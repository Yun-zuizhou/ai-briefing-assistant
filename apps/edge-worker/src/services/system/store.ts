import { execute, queryAll, queryOne } from '../../utils/db'
import type {
  ChainHealthCounts,
  FeedbackSubmissionRow,
  ReplayTaskRow,
  SummaryResultRow,
  SummaryTaskExecutionRow,
  SummaryTaskRow,
  SummaryTaskStatus,
} from './types'

export async function getChainHealthCounts(
  db: D1Database,
  userId: number
): Promise<ChainHealthCounts> {
  const [scheduleCount, executionCount, ingestionCount, processingCount, replayPendingCount, summaryTaskCount] =
    await Promise.all([
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM briefing_schedules WHERE user_id = ?`, [userId]),
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM opportunity_execution_results WHERE user_id = ?`, [userId]),
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM ingestion_runs`),
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM ai_processing_runs`),
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM replay_tasks WHERE status = 'pending'`),
      queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM summary_generation_tasks WHERE user_id = ?`, [userId]),
    ])

  return {
    schedules: Number(scheduleCount?.count || 0),
    opportunityResults: Number(executionCount?.count || 0),
    ingestionRuns: Number(ingestionCount?.count || 0),
    aiProcessingRuns: Number(processingCount?.count || 0),
    summaryTasks: Number(summaryTaskCount?.count || 0),
    replayPending: Number(replayPendingCount?.count || 0),
  }
}

export async function createSummaryTask(
  db: D1Database,
  input: {
    userId: number
    contentType?: string | null
    contentId?: number | null
    sourceUrl?: string | null
    title?: string | null
    summaryKind: string
    status: SummaryTaskStatus
    providerName?: string | null
    modelName?: string | null
    resultRef: string
    errorMessage?: string | null
  }
): Promise<number> {
  const result = await execute(
    db,
    `
      INSERT INTO summary_generation_tasks (
        user_id, content_type, content_id, source_url, title, summary_kind,
        status, provider_name, model_name, result_ref, error_message, requested_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `,
    [
      input.userId,
      input.contentType || null,
      input.contentId ?? null,
      input.sourceUrl || null,
      input.title || null,
      input.summaryKind,
      input.status,
      input.providerName || null,
      input.modelName || null,
      input.resultRef,
      input.errorMessage || null,
    ]
  )

  return Number(result.meta.last_row_id)
}

export async function getSummaryTaskById(
  db: D1Database,
  taskId: number,
  userId?: number
): Promise<SummaryTaskRow | null> {
  const sql = `
    SELECT id, content_type, content_id, source_url, title, summary_kind, status,
           provider_name, model_name, result_ref, error_message, requested_at, started_at, finished_at, updated_at
    FROM summary_generation_tasks
    WHERE id = ?${userId !== undefined ? ' AND user_id = ?' : ''}
  `
  const params = userId !== undefined ? [taskId, userId] : [taskId]
  return queryOne<SummaryTaskRow>(db, sql, params)
}

export async function getSummaryTaskExecutionById(
  db: D1Database,
  taskId: number
): Promise<SummaryTaskExecutionRow | null> {
  return queryOne<SummaryTaskExecutionRow>(
    db,
    `
      SELECT user_id, id, content_type, content_id, source_url, title, summary_kind, status,
             provider_name, model_name, result_ref, error_message, requested_at, started_at, finished_at, updated_at
      FROM summary_generation_tasks
      WHERE id = ?
    `,
    [taskId]
  )
}

export async function listSummaryTasks(
  db: D1Database,
  input: {
    userId: number
    limit: number
    status?: string | null
    contentType?: string | null
  }
): Promise<SummaryTaskRow[]> {
  let sql = `
    SELECT id, content_type, content_id, source_url, title, summary_kind, status,
           provider_name, model_name, result_ref, error_message, requested_at, started_at, finished_at, updated_at
    FROM summary_generation_tasks
    WHERE user_id = ?
  `
  const params: unknown[] = [input.userId]

  if (input.status) {
    sql += ` AND status = ?`
    params.push(input.status)
  }
  if (input.contentType) {
    sql += ` AND content_type = ?`
    params.push(input.contentType)
  }

  sql += ` ORDER BY datetime(requested_at) DESC, id DESC LIMIT ?`
  params.push(input.limit)

  return queryAll<SummaryTaskRow>(db, sql, params)
}

export async function getSummaryResultByTaskId(
  db: D1Database,
  taskId: number,
  userId?: number
): Promise<SummaryResultRow | null> {
  const sql = `
    SELECT
      id, task_id, user_id, content_type, content_id, source_url, result_ref,
      profile_id, provider_name, model_name, prompt_version, source_payload_json,
      summary_title, summary_text, key_points_json, risk_flags_json,
      consult_context_json, citations_json, raw_response_json, created_at, updated_at
    FROM summary_generation_results
    WHERE task_id = ?${userId !== undefined ? ' AND user_id = ?' : ''}
  `
  const params = userId !== undefined ? [taskId, userId] : [taskId]
  return queryOne<SummaryResultRow>(db, sql, params)
}

export async function markSummaryTaskRunning(
  db: D1Database,
  input: {
    taskId: number
    startedAt?: string | null
  }
): Promise<void> {
  await execute(
    db,
    `
      UPDATE summary_generation_tasks
      SET status = 'running',
          started_at = COALESCE(?, datetime('now')),
          updated_at = datetime('now')
      WHERE id = ?
    `,
    [input.startedAt || null, input.taskId]
  )
}

export async function markSummaryTaskSucceeded(
  db: D1Database,
  input: {
    taskId: number
    finishedAt?: string | null
  }
): Promise<void> {
  await execute(
    db,
    `
      UPDATE summary_generation_tasks
      SET status = 'succeeded',
          error_message = NULL,
          finished_at = COALESCE(?, datetime('now')),
          updated_at = datetime('now')
      WHERE id = ?
    `,
    [input.finishedAt || null, input.taskId]
  )
}

export async function markSummaryTaskFailed(
  db: D1Database,
  input: {
    taskId: number
    errorMessage: string
    finishedAt?: string | null
  }
): Promise<void> {
  await execute(
    db,
    `
      UPDATE summary_generation_tasks
      SET status = 'failed',
          error_message = ?,
          finished_at = COALESCE(?, datetime('now')),
          updated_at = datetime('now')
      WHERE id = ?
    `,
    [input.errorMessage, input.finishedAt || null, input.taskId]
  )
}

export async function upsertSummaryResult(
  db: D1Database,
  input: {
    taskId: number
    userId: number
    contentType?: string | null
    contentId?: number | null
    sourceUrl?: string | null
    resultRef: string
    profileId?: string | null
    providerName?: string | null
    modelName?: string | null
    promptVersion?: string | null
    sourcePayloadJson?: string | null
    summaryTitle?: string | null
    summaryText?: string | null
    keyPointsJson?: string | null
    riskFlagsJson?: string | null
    consultContextJson?: string | null
    citationsJson?: string | null
    rawResponseJson?: string | null
  }
): Promise<void> {
  await execute(
    db,
    `
      INSERT INTO summary_generation_results (
        task_id, user_id, content_type, content_id, source_url, result_ref,
        profile_id, provider_name, model_name, prompt_version, source_payload_json,
        summary_title, summary_text, key_points_json, risk_flags_json,
        consult_context_json, citations_json, raw_response_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(task_id) DO UPDATE SET
        result_ref = excluded.result_ref,
        profile_id = excluded.profile_id,
        provider_name = excluded.provider_name,
        model_name = excluded.model_name,
        prompt_version = excluded.prompt_version,
        source_payload_json = excluded.source_payload_json,
        summary_title = excluded.summary_title,
        summary_text = excluded.summary_text,
        key_points_json = excluded.key_points_json,
        risk_flags_json = excluded.risk_flags_json,
        consult_context_json = excluded.consult_context_json,
        citations_json = excluded.citations_json,
        raw_response_json = excluded.raw_response_json,
        updated_at = datetime('now')
    `,
    [
      input.taskId,
      input.userId,
      input.contentType || null,
      input.contentId ?? null,
      input.sourceUrl || null,
      input.resultRef,
      input.profileId || null,
      input.providerName || null,
      input.modelName || null,
      input.promptVersion || null,
      input.sourcePayloadJson || null,
      input.summaryTitle || null,
      input.summaryText || null,
      input.keyPointsJson || null,
      input.riskFlagsJson || null,
      input.consultContextJson || null,
      input.citationsJson || null,
      input.rawResponseJson || null,
    ]
  )
}

export async function createIngestionRun(
  db: D1Database,
  input: {
    pipelineName: string
    status: string
    startedAt?: string | null
    finishedAt?: string | null
    statsJson?: string | null
    errorMessage?: string | null
    retryOf?: number | null
  }
): Promise<number> {
  const result = await execute(
    db,
    `
      INSERT INTO ingestion_runs (
        pipeline_name, status, started_at, finished_at, stats_json, error_message, retry_of, created_at
      )
      VALUES (?, ?, COALESCE(?, datetime('now')), ?, ?, ?, ?, datetime('now'))
    `,
    [
      input.pipelineName,
      input.status,
      input.startedAt || null,
      input.finishedAt || null,
      input.statsJson || null,
      input.errorMessage || null,
      input.retryOf ?? null,
    ]
  )

  return Number(result.meta.last_row_id)
}

export async function createAiProcessingRun(
  db: D1Database,
  input: {
    taskType: string
    contentType?: string | null
    contentId?: number | null
    status: string
    attempt: number
    tokensUsed?: number | null
    errorMessage?: string | null
    resultRef?: string | null
  }
): Promise<number> {
  const result = await execute(
    db,
    `
      INSERT INTO ai_processing_runs (
        task_type, content_type, content_id, status, attempt, tokens_used, error_message, result_ref, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    [
      input.taskType,
      input.contentType || null,
      input.contentId ?? null,
      input.status,
      input.attempt,
      input.tokensUsed ?? null,
      input.errorMessage || null,
      input.resultRef || null,
    ]
  )

  return Number(result.meta.last_row_id)
}

export async function createOperationLog(
  db: D1Database,
  input: {
    chainName: string
    level: 'debug' | 'info' | 'warn' | 'error'
    userId: number
    requestId?: string | null
    message: string
    payload?: string | null
    replayable: boolean
  }
): Promise<number> {
  const result = await execute(
    db,
    `
      INSERT INTO operation_logs (
        chain_name, level, user_id, request_id, message, payload, replayable, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [
      input.chainName,
      input.level,
      input.userId,
      input.requestId || null,
      input.message,
      input.payload || null,
      input.replayable ? 1 : 0,
    ]
  )

  return Number(result.meta.last_row_id)
}

export async function getOperationLogById(
  db: D1Database,
  operationLogId: number,
  userId?: number
): Promise<{ id: number; user_id: number | null } | null> {
  if (userId !== undefined) {
    return queryOne<{ id: number; user_id: number | null }>(
      db,
      `SELECT id, user_id FROM operation_logs WHERE id = ? AND user_id = ?`,
      [operationLogId, userId]
    )
  }

  return queryOne<{ id: number; user_id: number | null }>(
    db,
    `SELECT id, user_id FROM operation_logs WHERE id = ?`,
    [operationLogId]
  )
}

export async function createReplayTask(
  db: D1Database,
  input: {
    operationLogId: number
    requestedBy: number
    reason?: string | null
  }
): Promise<number> {
  const result = await execute(
    db,
    `
      INSERT INTO replay_tasks (operation_log_id, status, requested_by, reason, created_at, updated_at)
      VALUES (?, 'pending', ?, ?, datetime('now'), datetime('now'))
    `,
    [input.operationLogId, input.requestedBy, input.reason || null]
  )

  return Number(result.meta.last_row_id)
}

export async function listReplayTasks(
  db: D1Database,
  limit: number,
  requestedBy?: number
): Promise<ReplayTaskRow[]> {
  const sql = `
      SELECT id, operation_log_id, status, reason, created_at, updated_at
      FROM replay_tasks
      ${requestedBy !== undefined ? 'WHERE requested_by = ?' : ''}
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `
  const params = requestedBy !== undefined ? [requestedBy, limit] : [limit]

  return queryAll<ReplayTaskRow>(
    db,
    sql,
    params
  )
}

export async function listFeedbackSubmissions(
  db: D1Database,
  userId: number,
  limit: number
): Promise<FeedbackSubmissionRow[]> {
  return queryAll<FeedbackSubmissionRow>(
    db,
    `
      SELECT id, user_id, feedback_type, content, source_page, status, created_at, updated_at
      FROM feedback_submissions
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `,
    [userId, limit]
  )
}

export async function createFeedbackSubmission(
  db: D1Database,
  input: {
    userId: number
    feedbackType: 'bug' | 'suggestion' | 'other'
    content: string
    sourcePage?: string | null
  }
): Promise<FeedbackSubmissionRow | null> {
  const result = await execute(
    db,
    `
      INSERT INTO feedback_submissions (
        user_id, feedback_type, content, source_page, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'submitted', datetime('now'), datetime('now'))
    `,
    [input.userId, input.feedbackType, input.content, input.sourcePage || null]
  )

  return queryOne<FeedbackSubmissionRow>(
    db,
    `
      SELECT id, user_id, feedback_type, content, source_page, status, created_at, updated_at
      FROM feedback_submissions
      WHERE id = ? AND user_id = ?
    `,
    [Number(result.meta.last_row_id), input.userId]
  )
}
