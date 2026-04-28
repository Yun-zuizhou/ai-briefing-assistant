import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  buildChainHealthResponse,
  createAiProcessingRunAction,
  createIngestionRunAction,
  createOperationLogAction,
  createReplayTaskAction,
  createSummaryTaskAction,
  completeSummaryTaskAction,
  failSummaryTaskAction,
  getOperationLogById,
  getSummaryResultByTaskId,
  getChainHealthCounts,
  getSummaryTaskById,
  listReplayTasks,
  listSummaryTasks,
  mapSummaryResult,
  mapSummaryTask,
  startSummaryTaskAction,
} from '../services/system'
import { requireInternalExecutorAuth } from '../utils/internal-auth'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
  SUMMARY_PROVIDER_ENABLED?: string
  INTERNAL_API_TOKEN?: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/chain-health', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  try {
    const counts = await getChainHealthCounts(db, userId)
    return c.json(buildChainHealthResponse(userId, counts))
  } catch (error) {
    console.error('Get chain health error:', error)
    return c.json({ error: 'Failed to load chain health' }, 500)
  }
})

router.post('/summary-tasks', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  try {
    const body = await c.req.json<{
      content_type?: string | null
      content_id?: number | null
      source_url?: string | null
      title?: string | null
      summary_kind?: string | null
      provider_name?: string | null
      model_name?: string | null
      result_ref?: string | null
    }>()
    const created = await createSummaryTaskAction({
      db,
      userId,
      summaryProviderEnabled: c.env.SUMMARY_PROVIDER_ENABLED,
      payload: body,
    })

    return c.json({
      success: true,
      task: created.task ? mapSummaryTask(created.task) : { id: created.taskId, task_type: 'summary_generation', status: created.status },
    })
  } catch (error) {
    console.error('Create summary task error:', error)
    return c.json({ error: 'Failed to create summary task' }, 500)
  }
})

router.get('/summary-tasks', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const limit = Number.parseInt(c.req.query('limit') || '20', 10)
  const status = c.req.query('status')
  const contentType = c.req.query('content_type')
  try {
    const rows = await listSummaryTasks(db, {
      userId,
      limit: Number.isNaN(limit) ? 20 : limit,
      status,
      contentType,
    })
    return c.json({
      total: rows.length,
      items: rows.map(mapSummaryTask),
    })
  } catch (error) {
    console.error('List summary tasks error:', error)
    return c.json({ error: 'Failed to list summary tasks' }, 500)
  }
})

router.get('/summary-tasks/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const taskId = Number.parseInt(c.req.param('id'), 10)
  try {
    const row = await getSummaryTaskById(db, taskId, userId)
    if (!row) {
      const foreignTask = await getSummaryTaskById(db, taskId)
      if (foreignTask) {
        return c.json({ error: '无权访问该摘要任务' }, 403)
      }
      return c.json({ error: 'Summary task not found' }, 404)
    }
    return c.json(mapSummaryTask(row))
  } catch (error) {
    console.error('Get summary task error:', error)
    return c.json({ error: 'Failed to load summary task' }, 500)
  }
})

router.get('/summary-tasks/:id/result', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const taskId = Number.parseInt(c.req.param('id'), 10)
  try {
    const row = await getSummaryResultByTaskId(db, taskId, userId)
    if (!row) {
      const foreignRow = await getSummaryResultByTaskId(db, taskId)
      if (foreignRow) {
        return c.json({ error: '无权访问该摘要结果' }, 403)
      }
      return c.json({ error: 'Summary result not found' }, 404)
    }
    return c.json(mapSummaryResult(row))
  } catch (error) {
    console.error('Get summary result error:', error)
    return c.json({ error: 'Failed to load summary result' }, 500)
  }
})

router.post('/summary-tasks/:id/start', async (c) => {
  const db = c.env.DB
  const taskId = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(taskId)) {
    return c.json({ error: 'Invalid summary task id' }, 400)
  }

  try {
    requireInternalExecutorAuth(c)
    const body = await c.req.json<{ started_at?: string | null }>().catch(() => ({}))
    const result = await startSummaryTaskAction({
      db,
      taskId,
      payload: body,
    })

    if ('error' in result) {
      if (result.error === 'not_found') {
        return c.json({ error: 'Summary task not found' }, 404)
      }
      if (result.error === 'terminal_state') {
        return c.json({ error: 'Summary task has already finished' }, 409)
      }
    }

    return c.json({
      success: true,
      task: result.task ? mapSummaryTask(result.task) : null,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Start summary task error:', error)
    return c.json({ error: 'Failed to start summary task' }, 500)
  }
})

router.post('/summary-tasks/:id/complete', async (c) => {
  const db = c.env.DB
  const taskId = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(taskId)) {
    return c.json({ error: 'Invalid summary task id' }, 400)
  }

  try {
    requireInternalExecutorAuth(c)
    const body = await c.req.json<{
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
    }>()
    const result = await completeSummaryTaskAction({
      db,
      taskId,
      payload: body,
    })

    if ('error' in result) {
      if (result.error === 'not_found') {
        return c.json({ error: 'Summary task not found' }, 404)
      }
      if (result.error === 'not_running') {
        return c.json({ error: 'Summary task must be running before completion' }, 409)
      }
      if (result.error === 'terminal_state') {
        return c.json({ error: 'Summary task has already failed and cannot be completed' }, 409)
      }
    }

    return c.json({
      success: true,
      task: result.task ? mapSummaryTask(result.task) : null,
      result: result.result ? mapSummaryResult(result.result) : null,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Complete summary task error:', error)
    return c.json({ error: 'Failed to complete summary task' }, 500)
  }
})

router.post('/summary-tasks/:id/fail', async (c) => {
  const db = c.env.DB
  const taskId = Number.parseInt(c.req.param('id'), 10)
  if (Number.isNaN(taskId)) {
    return c.json({ error: 'Invalid summary task id' }, 400)
  }

  try {
    requireInternalExecutorAuth(c)
    const body = await c.req.json<{
      error_message?: string | null
      finished_at?: string | null
    }>()
    const result = await failSummaryTaskAction({
      db,
      taskId,
      payload: body,
    })

    if ('error' in result) {
      if (result.error === 'not_found') {
        return c.json({ error: 'Summary task not found' }, 404)
      }
      if (result.error === 'missing_error_message') {
        return c.json({ error: 'error_message is required' }, 400)
      }
      if (result.error === 'terminal_state') {
        return c.json({ error: 'Summary task has already succeeded and cannot be failed' }, 409)
      }
    }

    return c.json({
      success: true,
      task: result.task ? mapSummaryTask(result.task) : null,
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Fail summary task error:', error)
    return c.json({ error: 'Failed to fail summary task' }, 500)
  }
})

router.post('/ingestion-runs', async (c) => {
  const db = c.env.DB
  try {
    requireInternalExecutorAuth(c)
    const body = await c.req.json<{
      pipeline_name: string
      status?: string
      started_at?: string
      finished_at?: string | null
      stats_json?: string | null
      error_message?: string | null
      retry_of?: number | null
    }>()
    const id = await createIngestionRunAction({ db, payload: body })
    return c.json({ id, success: true })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Create ingestion run error:', error)
    return c.json({ error: 'Failed to create ingestion run' }, 500)
  }
})

router.post('/ai-processing-runs', async (c) => {
  const db = c.env.DB
  try {
    requireInternalExecutorAuth(c)
    const body = await c.req.json<{
      task_type: string
      content_type?: string | null
      content_id?: number | null
      status?: string
      attempt?: number
      tokens_used?: number | null
      error_message?: string | null
      result_ref?: string | null
    }>()
    const id = await createAiProcessingRunAction({ db, payload: body })
    return c.json({ id, success: true })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Create ai processing run error:', error)
    return c.json({ error: 'Failed to create ai processing run' }, 500)
  }
})

router.post('/operation-logs', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  try {
    const body = await c.req.json<{
      chain_name: string
      level?: 'debug' | 'info' | 'warn' | 'error'
      request_id?: string | null
      message: string
      payload?: string | null
      replayable?: boolean
    }>()
    const id = await createOperationLogAction({ db, userId, payload: body })
    return c.json({ id, success: true })
  } catch (error) {
    console.error('Create operation log error:', error)
    return c.json({ error: 'Failed to create operation log' }, 500)
  }
})

router.post('/replay-tasks', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  try {
    const body = await c.req.json<{
      operation_log_id: number
      reason?: string | null
    }>()
    const operationLog = await getOperationLogById(db, body.operation_log_id, userId)
    if (!operationLog) {
      const foreignOperationLog = await getOperationLogById(db, body.operation_log_id)
      if (foreignOperationLog) {
        return c.json({ error: '无权回放该操作日志' }, 403)
      }
      return c.json({ error: '操作日志不存在' }, 404)
    }
    const id = await createReplayTaskAction({ db, userId, payload: body })
    return c.json({ id, success: true })
  } catch (error) {
    console.error('Create replay task error:', error)
    return c.json({ error: 'Failed to create replay task' }, 500)
  }
})

router.get('/replay-tasks', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const limit = Number.parseInt(c.req.query('limit') || '20', 10)
  try {
    const rows = await listReplayTasks(db, Number.isNaN(limit) ? 20 : limit, userId)
    return c.json({ total: rows.length, items: rows })
  } catch (error) {
    console.error('List replay tasks error:', error)
    return c.json({ total: 0, items: [] })
  }
})

export default router
