import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const contentStoreMocks = vi.hoisted(() => ({
  getHotTopicById: vi.fn(),
  getOpportunityById: vi.fn(),
  getDailyDigestResultByRef: vi.fn(),
  listHotTopics: vi.fn(),
  listOpportunities: vi.fn(),
  listDailyDigestResults: vi.fn(),
  consultDigestResult: vi.fn(),
}))

const dbMocks = vi.hoisted(() => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
}))

vi.mock('../src/services/content', async () => {
  const actual = await vi.importActual<typeof import('../src/services/content')>('../src/services/content')
  return {
    ...actual,
    getDailyDigestResultByRef: contentStoreMocks.getDailyDigestResultByRef,
    getHotTopicById: contentStoreMocks.getHotTopicById,
    getOpportunityById: contentStoreMocks.getOpportunityById,
    listHotTopics: contentStoreMocks.listHotTopics,
    listOpportunities: contentStoreMocks.listOpportunities,
    listDailyDigestResults: contentStoreMocks.listDailyDigestResults,
    consultDigestResult: contentStoreMocks.consultDigestResult,
  }
})

vi.mock('../src/utils/db', () => ({
  queryAll: dbMocks.queryAll,
  queryOne: dbMocks.queryOne,
}))

vi.mock('../src/utils/auth', async () => {
  const { resolveSessionUserFromCookie } = await import('./helpers/session-auth')
  return {
    resolveSessionUser: vi.fn(resolveSessionUserFromCookie),
  }
})

import contentRoutes from '../src/routes/content'
import { DigestConsultProviderError } from '../src/services/content'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/content', contentRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
    SUMMARY_PROVIDER_ENABLED: 'false',
  }
}

describe('workers content routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    contentStoreMocks.listHotTopics.mockResolvedValue([])
    contentStoreMocks.listOpportunities.mockResolvedValue([])
    contentStoreMocks.getHotTopicById.mockResolvedValue(null)
    contentStoreMocks.getOpportunityById.mockResolvedValue(null)
    contentStoreMocks.getDailyDigestResultByRef.mockResolvedValue(null)
    contentStoreMocks.listDailyDigestResults.mockResolvedValue([])
    contentStoreMocks.consultDigestResult.mockResolvedValue({
      answer: '默认咨询回答',
      evidence: [],
      uncertainties: [],
      suggested_next_actions: [],
      providerName: 'summary-provider',
      modelName: 'gpt-4o-mini',
    })
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
  })

  it('returns hot topics list with total count', async () => {
    contentStoreMocks.listHotTopics.mockResolvedValue([
      { id: 1, title: 'AI 热点' },
      { id: 2, title: '产品热点' },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/content/hot-topics?limit=2', {}, mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(2)
    expect(payload.data[0].title).toBe('AI 热点')
    expect(contentStoreMocks.listHotTopics).toHaveBeenCalledWith(expect.anything(), 2)
  })

  it('returns article detail and marks it partial when正文缺失', async () => {
    dbMocks.queryOne.mockResolvedValue({
      id: 10,
      title: 'AI 文章',
      summary: '摘要内容',
      content: null,
      source_name: 'RSS',
      source_url: 'https://example.com/article/10',
      author: '作者A',
      category: 'AI',
      tags: '["AI","学习"]',
      publish_time: '2026-04-16 08:00:00',
      quality_score: 8.9,
    })
    const app = buildApp()

    const response = await app.request('/api/v1/content/by-ref?content_ref=article:10', {}, mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.contentType).toBe('article')
    expect(payload.content).toBeNull()
    expect(payload.detailState).toBe('partial')
    expect(payload.missingFields).toContain('content')
    expect(payload.tags).toEqual(['AI', '学习'])
    expect(payload.categoryLabels).toEqual(['AI'])
  })

  it('returns 400 when content_ref is missing or unsupported', async () => {
    const app = buildApp()

    const missingResponse = await app.request('/api/v1/content/by-ref', {}, mockEnv())
    expect(missingResponse.status).toBe(400)

    const unsupportedResponse = await app.request('/api/v1/content/by-ref?content_ref=note:1', {}, mockEnv())
    expect(unsupportedResponse.status).toBe(400)
    const payload = await unsupportedResponse.json()
    expect(payload.error).toContain('Unsupported content type')
  })

  it('returns daily digest list for authenticated user', async () => {
    contentStoreMocks.listDailyDigestResults.mockResolvedValue([
      {
        id: 1,
        task_id: 11,
        user_id: 1,
        result_ref: 'summary:ai-daily:openai_blog:update',
        profile_id: 'ai-daily',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        prompt_version: 'ai-daily-v1',
        summary_title: 'OpenAI 更新',
        summary_text: '发布了新的模型能力。',
        source_url: 'https://example.com/openai-update',
        source_payload_json: '{"source_name":"OpenAI Blog","title":"OpenAI 更新","published_at":"2026-04-21"}',
        key_points_json: '["模型更新"]',
        risk_flags_json: '[]',
        consult_context_json: '{"source_name":"OpenAI Blog"}',
        citations_json: '[{"title":"原文","url":"https://example.com/openai-update"}]',
        created_at: '2026-04-21 12:00:00',
        updated_at: '2026-04-21 12:01:00',
      },
    ])

    const app = buildApp()
    const response = await app.request('/api/v1/content/daily-digest?profile_id=ai-daily&limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.profileId).toBe('ai-daily')
    expect(payload.total).toBe(1)
    expect(payload.items[0]).toMatchObject({
      taskId: 11,
      resultRef: 'summary:ai-daily:openai_blog:update',
      summaryTitle: 'OpenAI 更新',
      keyPoints: ['模型更新'],
    })
  })

  it('returns merged daily digest results when profile_id is omitted', async () => {
    contentStoreMocks.listDailyDigestResults.mockResolvedValue([
      {
        id: 1,
        task_id: 11,
        user_id: 1,
        result_ref: 'summary:ai-daily:openai_blog:update',
        profile_id: 'ai-daily',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        prompt_version: 'ai-daily-v1',
        summary_title: 'OpenAI 更新',
        summary_text: '发布了新的模型能力。',
        source_url: 'https://example.com/openai-update',
        source_payload_json: '{"source_name":"OpenAI Blog","title":"OpenAI 更新"}',
        key_points_json: '["模型更新"]',
        risk_flags_json: '[]',
        consult_context_json: '{"source_name":"OpenAI Blog"}',
        citations_json: '[]',
        created_at: '2026-04-21 12:00:00',
        updated_at: '2026-04-21 12:01:00',
      },
      {
        id: 2,
        task_id: 12,
        user_id: 1,
        result_ref: 'summary:writing-opportunity-watch:juejin:writing',
        profile_id: 'writing-opportunity-watch',
        provider_name: 'openai',
        model_name: 'gpt-4o-mini',
        prompt_version: 'writing-opportunity-v1',
        summary_title: '写作投稿机会',
        summary_text: '出现了新的技术投稿机会。',
        source_url: 'https://example.com/writing-opportunity',
        source_payload_json: '{"source_name":"掘金","title":"技术博客征稿"}',
        key_points_json: '["投稿机会"]',
        risk_flags_json: '[]',
        consult_context_json: '{"source_name":"掘金"}',
        citations_json: '[]',
        created_at: '2026-04-21 12:03:00',
        updated_at: '2026-04-21 12:04:00',
      },
    ])

    const app = buildApp()
    const response = await app.request('/api/v1/content/daily-digest?limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.profileId).toBe('all')
    expect(payload.mode).toBe('all-matched-results')
    expect(payload.total).toBe(2)
    expect(payload.items[1]).toMatchObject({
      profileId: 'writing-opportunity-watch',
      summaryTitle: '写作投稿机会',
    })
  })

  it('returns 401 when daily digest is requested without auth', async () => {
    const app = buildApp()
    const response = await app.request('/api/v1/content/daily-digest', {}, mockEnv())
    expect(response.status).toBe(401)
  })

  it('returns 503 when consult provider is not configured', async () => {
    const app = buildApp()
    contentStoreMocks.getDailyDigestResultByRef.mockResolvedValue({
      id: 1,
      task_id: 11,
      user_id: 1,
      result_ref: 'summary:ai-daily:openai_blog:update',
      profile_id: 'ai-daily',
      provider_name: 'openai',
      model_name: 'gpt-4o-mini',
      prompt_version: 'ai-daily-v1',
      summary_title: 'OpenAI 更新',
      summary_text: '发布了新的模型能力。',
      source_url: 'https://example.com/openai-update',
      source_payload_json: '{"source_name":"OpenAI Blog","title":"OpenAI 更新"}',
      key_points_json: '["模型更新"]',
      risk_flags_json: '[]',
      consult_context_json: '{"source_name":"OpenAI Blog"}',
      citations_json: '[{"title":"原文","url":"https://example.com/openai-update"}]',
      created_at: '2026-04-21 12:00:00',
      updated_at: '2026-04-21 12:01:00',
    })
    contentStoreMocks.consultDigestResult.mockRejectedValue(
      new DigestConsultProviderError('provider_not_configured', 'Summary provider is not configured yet')
    )

    const response = await app.request(
      '/api/v1/content/consult',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          result_ref: 'summary:ai-daily:openai_blog:update',
          question: '这条消息为什么重要？',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(503)
  })

  it('returns consult answer for authenticated user when provider succeeds', async () => {
    contentStoreMocks.getDailyDigestResultByRef.mockResolvedValue({
      id: 1,
      task_id: 11,
      user_id: 1,
      result_ref: 'summary:ai-daily:openai_blog:update',
      profile_id: 'ai-daily',
      provider_name: 'openai',
      model_name: 'gpt-4o-mini',
      prompt_version: 'ai-daily-v1',
      summary_title: 'OpenAI 更新',
      summary_text: '发布了新的模型能力。',
      source_url: 'https://example.com/openai-update',
      source_payload_json: '{"source_name":"OpenAI Blog","title":"OpenAI 更新"}',
      key_points_json: '["模型更新"]',
      risk_flags_json: '[]',
      consult_context_json: '{"source_name":"OpenAI Blog"}',
      citations_json: '[{"title":"原文","url":"https://example.com/openai-update"}]',
      created_at: '2026-04-21 12:00:00',
      updated_at: '2026-04-21 12:01:00',
    })
    contentStoreMocks.consultDigestResult.mockResolvedValue({
      answer: '这代表模型能力又有新进展。',
      evidence: ['官方博客直接发布更新说明。'],
      uncertainties: [],
      suggested_next_actions: ['继续阅读原文'],
      providerName: 'summary-provider',
      modelName: 'gpt-4o-mini',
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/content/consult',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          result_ref: 'summary:ai-daily:openai_blog:update',
          question: '这条消息为什么重要？',
        }),
      }),
      {
        ...mockEnv(),
        SUMMARY_PROVIDER_ENABLED: 'true',
      }
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      resultRef: 'summary:ai-daily:openai_blog:update',
      answer: '这代表模型能力又有新进展。',
      providerName: 'summary-provider',
      modelName: 'gpt-4o-mini',
    })
  })
})
