import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const systemMocks = vi.hoisted(() => ({
  listFeedbackSubmissions: vi.fn(),
  createFeedbackSubmissionAction: vi.fn(),
}))

vi.mock('../src/utils/auth', async () => {
  const { resolveSessionUserFromCookie } = await import('./helpers/session-auth')
  return {
    resolveSessionUser: vi.fn(resolveSessionUserFromCookie),
  }
})

vi.mock('../src/services/system', async () => {
  const actual = await vi.importActual<typeof import('../src/services/system')>('../src/services/system')
  return {
    ...actual,
    listFeedbackSubmissions: systemMocks.listFeedbackSubmissions,
    createFeedbackSubmissionAction: systemMocks.createFeedbackSubmissionAction,
  }
})

import feedbackRoutes from '../src/routes/feedback'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/feedback', feedbackRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers feedback routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    systemMocks.listFeedbackSubmissions.mockResolvedValue([])
    systemMocks.createFeedbackSubmissionAction.mockResolvedValue({
      submission: {
        id: 1,
        user_id: 1,
        feedback_type: 'suggestion',
        content: '默认反馈',
        source_page: '/today',
        status: 'submitted',
        created_at: '2026-04-22 10:00:00',
        updated_at: '2026-04-22 10:00:00',
      },
    })
  })

  it('lists current user feedback submissions', async () => {
    systemMocks.listFeedbackSubmissions.mockResolvedValue([
      {
        id: 11,
        user_id: 1,
        feedback_type: 'bug',
        content: '按钮位置有点挤',
        source_page: '/today',
        status: 'submitted',
        created_at: '2026-04-22 09:30:00',
        updated_at: '2026-04-22 09:30:00',
      },
    ])

    const app = buildApp()
    const response = await app.request('/api/v1/feedback?limit=5', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0]).toMatchObject({
      id: 11,
      feedbackType: 'bug',
      content: '按钮位置有点挤',
      sourcePage: '/today',
      status: 'submitted',
    })
    expect(systemMocks.listFeedbackSubmissions).toHaveBeenCalledWith(expect.anything(), 1, 5)
  })

  it('creates feedback submission for current user', async () => {
    systemMocks.createFeedbackSubmissionAction.mockResolvedValue({
      submission: {
        id: 22,
        user_id: 1,
        feedback_type: 'suggestion',
        content: '希望周报页增加解释说明',
        source_page: '/weekly-report',
        status: 'submitted',
        created_at: '2026-04-22 10:20:00',
        updated_at: '2026-04-22 10:20:00',
      },
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/feedback',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'suggestion',
          content: '希望周报页增加解释说明',
          source_page: '/weekly-report',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.submission).toMatchObject({
      id: 22,
      feedbackType: 'suggestion',
      content: '希望周报页增加解释说明',
      sourcePage: '/weekly-report',
      status: 'submitted',
    })
    expect(systemMocks.createFeedbackSubmissionAction).toHaveBeenCalledWith({
      db: expect.anything(),
      userId: 1,
      payload: {
        feedback_type: 'suggestion',
        content: '希望周报页增加解释说明',
        source_page: '/weekly-report',
      },
    })
  })

  it('returns 400 when feedback payload is invalid', async () => {
    systemMocks.createFeedbackSubmissionAction.mockResolvedValue({
      error: '反馈内容不能为空',
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/feedback',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'suggestion',
          content: '',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(400)

    const payload = await response.json()
    expect(payload.error).toContain('反馈内容不能为空')
  })
})
