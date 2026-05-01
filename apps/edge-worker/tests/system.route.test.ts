import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_INTERNAL_TOKEN, withInternalToken, withSession } from './helpers/session-auth'

const dbMocks = vi.hoisted(() => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
}))

vi.mock('../src/utils/db', () => ({
  queryAll: dbMocks.queryAll,
  queryOne: dbMocks.queryOne,
  execute: dbMocks.execute,
}))

vi.mock('../src/utils/auth', async () => {
  const { resolveSessionUserFromCookie } = await import('./helpers/session-auth')
  return {
    resolveSessionUser: vi.fn(resolveSessionUserFromCookie),
    resolveDevelopmentSessionUser: vi.fn(async () => null),
  }
})

import systemRoutes from '../src/routes/system'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/system', systemRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
    INTERNAL_API_TOKEN: TEST_INTERNAL_TOKEN,
    AI_KEY_ENCRYPTION_SECRET: 'test-encryption-secret',
  }
}

describe('workers system routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue({ count: 0 })
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
  })

  it('returns chain health counters and readiness booleans', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('briefing_schedules')) return { count: 2 }
      if (text.includes('opportunity_execution_results')) return { count: 1 }
      if (text.includes('ingestion_runs')) return { count: 5 }
      if (text.includes('ai_processing_runs')) return { count: 7 }
      if (text.includes('replay_tasks')) return { count: 0 }
      return { count: 0 }
    })

    const app = buildApp()
    const response = await app.request('/api/v1/system/chain-health', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.userId).toBe(1)
    expect(payload.counters).toMatchObject({
      schedules: 2,
      opportunityResults: 1,
      ingestionRuns: 5,
      aiProcessingRuns: 7,
      summaryTasks: 0,
      replayPending: 0,
    })
    expect(payload.supportChains.schedulerFactLayerReady).toBe(true)
    expect(payload.supportChains.opportunityResultFactLayerReady).toBe(true)
    expect(payload.supportChains.summaryTaskStateModelReady).toBe(true)
    expect(payload.supportChains.replayQueueReady).toBe(true)
  })

  it('returns 401 when user identity is missing on protected system endpoints', async () => {
    const app = buildApp()
    const response = await app.request('/api/v1/system/chain-health', {}, mockEnv())
    expect(response.status).toBe(401)

    const payload = await response.text()
    expect(payload).toContain('Authentication required')
  })

  it('returns llm invocation stats for the current user without sensitive fields', async () => {
    dbMocks.queryAll
      .mockResolvedValueOnce([
        {
          total: 4,
          success: 3,
          error: 1,
          avg_duration_ms: 1234.4,
          avg_input_chars: 300.2,
          avg_output_chars: 120.8,
          avg_prompt_tokens: 90.1,
          avg_completion_tokens: 30.6,
          avg_total_tokens: 120.7,
          total_tokens: 480,
        },
      ])
      .mockResolvedValueOnce([
        {
          feature: 'annual_report_blocks_generation',
          total: 2,
          success: 1,
          error: 1,
          avg_duration_ms: 2000.2,
          avg_total_tokens: 160.4,
          total_tokens: 320,
          last_invoked_at: '2026-04-29 18:55:19',
        },
      ])
      .mockResolvedValueOnce([
        {
          provider_name: 'deepseek',
          model_name: 'deepseek-v4-pro',
          transport: 'openai-compatible',
          total: 2,
          success: 1,
          error: 1,
          avg_duration_ms: 2000.2,
          total_tokens: 320,
          last_invoked_at: '2026-04-29 18:55:19',
        },
      ])
      .mockResolvedValueOnce([
        {
          error_code: 'invalid_model_output',
          total: 1,
          last_occurred_at: '2026-04-29 18:52:53',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 77,
          feature: 'annual_report_blocks_generation',
          request_ref: 'annual_report:2026',
          provider_name: 'deepseek',
          model_name: 'deepseek-v4-pro',
          duration_ms: 2100,
          total_tokens: 120,
          error_code: 'invalid_model_output',
          error_message: 'Annual report output failed validation',
          created_at: '2026-04-29 18:52:53',
        },
      ])

    const app = buildApp()
    const response = await app.request('/api/v1/system/llm-invocations/stats?window=24h&limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload).toMatchObject({
      userId: 1,
      windowLabel: '24h',
      windowHours: 24,
      windowDays: 1,
      totals: {
        total: 4,
        success: 3,
        error: 1,
        successRate: 75,
        avgDurationMs: 1234,
        totalTokens: 480,
      },
      byFeature: [
        {
          feature: 'annual_report_blocks_generation',
          total: 2,
          successRate: 50,
          avgDurationMs: 2000,
        },
      ],
      byModel: [
        {
          providerName: 'deepseek',
          modelName: 'deepseek-v4-pro',
          transport: 'openai-compatible',
        },
      ],
      errors: [
        {
          errorCode: 'invalid_model_output',
          total: 1,
        },
      ],
      recentErrors: [
        {
          invocationId: 77,
          feature: 'annual_report_blocks_generation',
          requestRef: 'annual_report:2026',
          providerName: 'deepseek',
          modelName: 'deepseek-v4-pro',
          errorCode: 'invalid_model_output',
          errorMessage: 'Annual report output failed validation',
          createdAt: '2026-04-29 18:52:53',
        },
      ],
    })
    expect(JSON.stringify(payload)).not.toContain('metadata_json')
    expect(JSON.stringify(payload)).not.toContain('prompt')

    const firstCallParams = dbMocks.queryAll.mock.calls[0][2] as unknown[]
    expect(firstCallParams).toEqual([1, '-24 hours'])
    const featureCallParams = dbMocks.queryAll.mock.calls[1][2] as unknown[]
    expect(featureCallParams).toEqual([1, '-24 hours', 5])
  })

  it('rejects llm invocation stats for non-superusers in production', async () => {
    dbMocks.queryOne.mockResolvedValueOnce({ is_superuser: 0 })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/llm-invocations/stats',
      withSession(),
      {
        DB: {} as D1Database,
        ENVIRONMENT: 'production',
        INTERNAL_API_TOKEN: TEST_INTERNAL_TOKEN,
      }
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问')
    expect(dbMocks.queryAll).not.toHaveBeenCalled()
  })

  it('allows llm invocation stats for superusers in production', async () => {
    dbMocks.queryOne.mockResolvedValueOnce({ is_superuser: 1 })
    dbMocks.queryAll
      .mockResolvedValueOnce([{ total: 1, success: 1, error: 0, total_tokens: 20 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/llm-invocations/stats',
      withSession(),
      {
        DB: {} as D1Database,
        ENVIRONMENT: 'production',
        INTERNAL_API_TOKEN: TEST_INTERNAL_TOKEN,
      }
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.totals).toMatchObject({
      total: 1,
      success: 1,
      error: 0,
      successRate: 100,
    })
  })

  it('returns briefing dispatch stats with recent cron samples', async () => {
    dbMocks.queryAll
      .mockResolvedValueOnce([
        {
          total: 3,
          success: 1,
          skipped: 1,
          error: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          status: 'success',
          total: 1,
          last_occurred_at: '2026-04-30 08:15:10',
        },
        {
          status: 'skipped',
          total: 1,
          last_occurred_at: '2026-04-30 08:15:11',
        },
      ])
      .mockResolvedValueOnce([
        {
          trigger_source: 'worker_cron',
          total: 3,
          success: 1,
          skipped: 1,
          error: 1,
          last_occurred_at: '2026-04-30 08:15:12',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 31,
          schedule_id: 12,
          briefing_type: 'morning',
          trigger_source: 'worker_cron',
          scheduled_for: '08:00',
          status: 'error',
          summary: 'Worker Cron 生成今日 AI 简报失败',
          created_at: '2026-04-30 08:15:12',
        },
      ])

    const app = buildApp()
    const response = await app.request('/api/v1/system/briefing-dispatches/stats?window=24h&limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload).toMatchObject({
      userId: 1,
      windowLabel: '24h',
      windowHours: 24,
      totals: {
        total: 3,
        success: 1,
        skipped: 1,
        error: 1,
      },
      byTrigger: [
        {
          triggerSource: 'worker_cron',
          total: 3,
          success: 1,
          skipped: 1,
          error: 1,
        },
      ],
      recentDispatches: [
        {
          id: 31,
          scheduleId: 12,
          briefingType: 'morning',
          triggerSource: 'worker_cron',
          scheduledFor: '08:00',
          status: 'error',
          summary: 'Worker Cron 生成今日 AI 简报失败',
          createdAt: '2026-04-30 08:15:12',
        },
      ],
    })

    const firstCallParams = dbMocks.queryAll.mock.calls[0][2] as unknown[]
    expect(firstCallParams).toEqual([1, '-24 hours'])
    const sampleCallParams = dbMocks.queryAll.mock.calls[3][2] as unknown[]
    expect(sampleCallParams).toEqual([1, '-24 hours', 5])
  })

  it('rejects ingestion-runs when internal executor token is missing', async () => {
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ingestion-runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pipeline_name: 'daily-ingestion',
        }),
      },
      mockEnv()
    )

    expect(response.status).toBe(401)
    const payload = await response.text()
    expect(payload).toContain('Internal executor authorization required')
  })

  it('allows ingestion-runs with valid internal executor token', async () => {
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 21 } })
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ingestion-runs',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pipeline_name: 'daily-ingestion',
          status: 'running',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({ id: 21, success: true })
  })

  it('dry-runs legacy ai provider key migration without exposing plaintext', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        ai_provider: 'deepseek',
        ai_api_key: 'sk-legacy-secret',
        ai_api_key_encrypted: null,
        ai_api_key_encryption_version: null,
      },
    ])
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ai-provider-keys/migrate-legacy',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dry_run: true }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: true,
      dryRun: true,
      scanned: 1,
      migrated: 0,
    })
    expect(JSON.stringify(payload)).not.toContain('sk-legacy-secret')
    expect(dbMocks.execute).not.toHaveBeenCalled()
  })

  it('migrates legacy plaintext ai provider keys to encrypted storage and clears plaintext', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        ai_provider: 'deepseek',
        ai_api_key: 'sk-legacy-secret',
        ai_api_key_encrypted: null,
        ai_api_key_encryption_version: null,
      },
    ])
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ai-provider-keys/migrate-legacy',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: true,
      dryRun: false,
      scanned: 1,
      migrated: 1,
      clearedPlaintextOnly: 0,
      failed: 0,
    })

    const updateCall = dbMocks.execute.mock.calls.find((args) =>
      String(args[1]).includes('ai_api_key_encrypted = ?')
    )
    expect(updateCall).toBeTruthy()
    const params = updateCall?.[2] as unknown[]
    expect(String(params[0])).not.toContain('sk-legacy-secret')
    expect(params[1]).toBe('aes-gcm-v1')
    expect(params[2]).toBe(1)
  })

  it('returns 503 when legacy plaintext keys need encryption but encryption secret is missing', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        ai_provider: 'deepseek',
        ai_api_key: 'sk-legacy-secret',
        ai_api_key_encrypted: null,
        ai_api_key_encryption_version: null,
      },
    ])
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ai-provider-keys/migrate-legacy',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 10 }),
      }),
      {
        DB: {} as D1Database,
        ENVIRONMENT: 'test',
        INTERNAL_API_TOKEN: TEST_INTERNAL_TOKEN,
      }
    )

    expect(response.status).toBe(503)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: false,
      scanned: 1,
      skippedMissingSecret: 1,
    })
    expect(dbMocks.execute).not.toHaveBeenCalled()
  })

  it('rejects ai-processing-runs when internal executor token is invalid', async () => {
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/ai-processing-runs',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Internal wrong-token',
        },
        body: JSON.stringify({
          task_type: 'summary_generation',
          status: 'running',
        }),
      },
      mockEnv()
    )

    expect(response.status).toBe(401)
    const payload = await response.text()
    expect(payload).toContain('Internal executor authorization required')
  })

  it('creates replay task with user context and returns created id', async () => {
    dbMocks.queryOne.mockResolvedValueOnce({ id: 7, user_id: 1 })
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 99 } })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/system/replay-tasks',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operation_log_id: 7,
          reason: 'manual retry',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({ id: 99, success: true })

    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO replay_tasks'),
      [7, 1, 'manual retry']
    )
  })

  it('returns 403 when creating replay task for another user\'s operation log', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 8, user_id: 2 })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/replay-tasks',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operation_log_id: 8,
          reason: 'manual retry',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权回放该操作日志')
  })

  it('lists replay tasks with parsed limit', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        operation_log_id: 10,
        status: 'pending',
        reason: 'retry',
        created_at: '2026-04-16 12:00:00',
        updated_at: null,
      },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/system/replay-tasks?limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0].operation_log_id).toBe(10)
    expect(dbMocks.queryAll).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('FROM replay_tasks'),
      [1, 5]
    )
  })

  it('creates summary task in pending_provider status when provider is not configured', async () => {
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 11 } })
    dbMocks.queryOne.mockResolvedValue({
      id: 11,
      content_type: 'article',
      content_id: 3,
      source_url: 'https://example.com/article/3',
      title: '文章摘要任务',
      summary_kind: 'brief',
      status: 'pending_provider',
      provider_name: null,
      model_name: null,
      result_ref: 'summary:article:3:brief',
      error_message: 'Summary provider is not configured yet',
      requested_at: '2026-04-16 12:00:00',
      started_at: null,
      finished_at: null,
      updated_at: '2026-04-16 12:00:00',
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/summary-tasks',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content_type: 'article',
          content_id: 3,
          source_url: 'https://example.com/article/3',
          title: '文章摘要任务',
          summary_kind: 'brief',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.task.status).toBe('pending_provider')
    expect(payload.task.result_ref).toBe('summary:article:3:brief')
  })

  it('lists summary tasks with user filter and limit', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 12,
        content_type: 'hot_topic',
        content_id: 8,
        source_url: null,
        title: '热点摘要任务',
        summary_kind: 'standard',
        status: 'queued',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:hot_topic:8:standard',
        error_message: null,
        requested_at: '2026-04-16 13:00:00',
        started_at: null,
        finished_at: null,
        updated_at: '2026-04-16 13:00:00',
      },
    ])

    const app = buildApp()
    const response = await app.request('/api/v1/system/summary-tasks?limit=5', withSession(), mockEnv())

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0]).toMatchObject({
      id: 12,
      task_type: 'summary_generation',
      status: 'queued',
    })
  })

  it('returns summary task detail by id', async () => {
    dbMocks.queryOne.mockResolvedValue({
      id: 15,
      content_type: 'opportunity',
      content_id: 2,
      source_url: null,
      title: '机会摘要任务',
      summary_kind: 'standard',
      status: 'succeeded',
      provider_name: 'openai',
      model_name: 'gpt-4o-mini',
      result_ref: 'summary:opportunity:2:standard',
      error_message: null,
      requested_at: '2026-04-16 14:00:00',
      started_at: '2026-04-16 14:01:00',
      finished_at: '2026-04-16 14:02:00',
      updated_at: '2026-04-16 14:02:00',
    })

    const app = buildApp()
    const response = await app.request('/api/v1/system/summary-tasks/15', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload).toMatchObject({
      id: 15,
      task_type: 'summary_generation',
      status: 'succeeded',
      content_type: 'opportunity',
      content_id: 2,
    })
  })

  it('returns 403 when loading another user\'s summary task', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 18,
        content_type: 'article',
        content_id: 6,
        source_url: null,
        title: '别人的摘要任务',
        summary_kind: 'standard',
        status: 'queued',
        provider_name: null,
        model_name: null,
        result_ref: 'summary:article:6:standard',
        error_message: null,
        requested_at: '2026-04-16 14:00:00',
        started_at: null,
        finished_at: null,
        updated_at: '2026-04-16 14:00:00',
      })

    const app = buildApp()
    const response = await app.request('/api/v1/system/summary-tasks/18', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该摘要任务')
  })

  it('returns summary result detail by task id', async () => {
    dbMocks.queryOne.mockResolvedValue({
      id: 3,
      task_id: 15,
      user_id: 1,
      content_type: 'external_item',
      content_id: null,
      source_url: 'https://example.com/openai-update',
      result_ref: 'summary:ai-daily:openai_blog:update',
      profile_id: 'ai-daily',
      provider_name: 'openai',
      model_name: 'gpt-4o-mini',
      prompt_version: 'ai-daily-v1',
      source_payload_json: '{"title":"OpenAI 更新","summary":"摘要"}',
      summary_title: 'OpenAI 更新',
      summary_text: '今天发布了新的模型与接口能力。',
      key_points_json: '["模型更新","接口变化"]',
      risk_flags_json: '[]',
      consult_context_json: '{"source_name":"OpenAI Blog"}',
      citations_json: '[{"title":"原文","url":"https://example.com/openai-update"}]',
      raw_response_json: '{"ok":true}',
      created_at: '2026-04-21 10:00:00',
      updated_at: '2026-04-21 10:01:00',
    })

    const app = buildApp()
    const response = await app.request('/api/v1/system/summary-tasks/15/result', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload).toMatchObject({
      task_id: 15,
      profile_id: 'ai-daily',
      summary_title: 'OpenAI 更新',
      key_points: ['模型更新', '接口变化'],
    })
  })

  it('rejects summary task start when internal executor token is missing', async () => {
    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/summary-tasks/15/start',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
      mockEnv()
    )

    expect(response.status).toBe(401)
    const payload = await response.text()
    expect(payload).toContain('Internal executor authorization required')
  })

  it('starts summary task with valid internal executor token', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce({
        user_id: 1,
        id: 22,
        content_type: 'article',
        content_id: 3,
        source_url: 'https://example.com/article/3',
        title: '文章摘要任务',
        summary_kind: 'brief',
        status: 'queued',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:3:brief',
        error_message: null,
        requested_at: '2026-04-22 10:00:00',
        started_at: null,
        finished_at: null,
        updated_at: '2026-04-22 10:00:00',
      })
      .mockResolvedValueOnce({
        id: 22,
        content_type: 'article',
        content_id: 3,
        source_url: 'https://example.com/article/3',
        title: '文章摘要任务',
        summary_kind: 'brief',
        status: 'running',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:3:brief',
        error_message: null,
        requested_at: '2026-04-22 10:00:00',
        started_at: '2026-04-22 10:01:00',
        finished_at: null,
        updated_at: '2026-04-22 10:01:00',
      })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/summary-tasks/22/start',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          started_at: '2026-04-22 10:01:00',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: true,
      task: {
        id: 22,
        status: 'running',
      },
    })

    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("SET status = 'running'"),
      ['2026-04-22 10:01:00', 22]
    )
  })

  it('completes running summary task and writes summary result', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce({
        user_id: 1,
        id: 23,
        content_type: 'article',
        content_id: 9,
        source_url: 'https://example.com/article/9',
        title: '完成中的摘要任务',
        summary_kind: 'standard',
        status: 'running',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:9:standard',
        error_message: null,
        requested_at: '2026-04-22 11:00:00',
        started_at: '2026-04-22 11:01:00',
        finished_at: null,
        updated_at: '2026-04-22 11:01:00',
      })
      .mockResolvedValueOnce({
        id: 23,
        content_type: 'article',
        content_id: 9,
        source_url: 'https://example.com/article/9',
        title: '完成中的摘要任务',
        summary_kind: 'standard',
        status: 'succeeded',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:9:standard',
        error_message: null,
        requested_at: '2026-04-22 11:00:00',
        started_at: '2026-04-22 11:01:00',
        finished_at: '2026-04-22 11:02:00',
        updated_at: '2026-04-22 11:02:00',
      })
      .mockResolvedValueOnce({
        id: 6,
        task_id: 23,
        user_id: 1,
        content_type: 'article',
        content_id: 9,
        source_url: 'https://example.com/article/9',
        result_ref: 'summary:article:9:standard',
        profile_id: 'ai-daily',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        prompt_version: 'ai-daily-v2',
        source_payload_json: '{"title":"文章 9"}',
        summary_title: '文章 9 摘要',
        summary_text: '这是正式完成后的摘要。',
        key_points_json: '["要点一","要点二"]',
        risk_flags_json: '[]',
        consult_context_json: '{"source_name":"Example"}',
        citations_json: '[{"title":"原文","url":"https://example.com/article/9"}]',
        raw_response_json: '{"ok":true}',
        created_at: '2026-04-22 11:02:00',
        updated_at: '2026-04-22 11:02:00',
      })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/summary-tasks/23/complete',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile_id: 'ai-daily',
          provider_name: 'openai',
          model_name: 'gpt-4o-mini',
          prompt_version: 'ai-daily-v2',
          source_payload: { title: '文章 9' },
          summary_title: '文章 9 摘要',
          summary_text: '这是正式完成后的摘要。',
          key_points: ['要点一', '要点二'],
          risk_flags: [],
          consult_context: { source_name: 'Example' },
          citations: [{ title: '原文', url: 'https://example.com/article/9' }],
          raw_response: { ok: true },
          finished_at: '2026-04-22 11:02:00',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: true,
      task: {
        id: 23,
        status: 'succeeded',
      },
      result: {
        task_id: 23,
        profile_id: 'ai-daily',
        summary_title: '文章 9 摘要',
        key_points: ['要点一', '要点二'],
      },
    })

    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO summary_generation_results'),
      [
        23,
        1,
        'article',
        9,
        'https://example.com/article/9',
        'summary:article:9:standard',
        'ai-daily',
        'openai',
        'gpt-4o-mini',
        'ai-daily-v2',
        '{"title":"文章 9"}',
        '文章 9 摘要',
        '这是正式完成后的摘要。',
        '["要点一","要点二"]',
        '[]',
        '{"source_name":"Example"}',
        '[{"title":"原文","url":"https://example.com/article/9"}]',
        '{"ok":true}',
      ]
    )
  })

  it('fails running summary task with internal executor token', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce({
        user_id: 1,
        id: 24,
        content_type: 'article',
        content_id: 10,
        source_url: 'https://example.com/article/10',
        title: '失败中的摘要任务',
        summary_kind: 'standard',
        status: 'running',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:10:standard',
        error_message: null,
        requested_at: '2026-04-22 11:10:00',
        started_at: '2026-04-22 11:11:00',
        finished_at: null,
        updated_at: '2026-04-22 11:11:00',
      })
      .mockResolvedValueOnce({
        id: 24,
        content_type: 'article',
        content_id: 10,
        source_url: 'https://example.com/article/10',
        title: '失败中的摘要任务',
        summary_kind: 'standard',
        status: 'failed',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        result_ref: 'summary:article:10:standard',
        error_message: 'provider timeout',
        requested_at: '2026-04-22 11:10:00',
        started_at: '2026-04-22 11:11:00',
        finished_at: '2026-04-22 11:12:00',
        updated_at: '2026-04-22 11:12:00',
      })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/system/summary-tasks/24/fail',
      withInternalToken({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          error_message: 'provider timeout',
          finished_at: '2026-04-22 11:12:00',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      success: true,
      task: {
        id: 24,
        status: 'failed',
        error_message: 'provider timeout',
      },
    })

    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("SET status = 'failed'"),
      ['provider timeout', '2026-04-22 11:12:00', 24]
    )
  })
})
