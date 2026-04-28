import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

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
  }
})

import historyRoutes from '../src/routes/history'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/history', historyRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers history routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
  })

  it('lists history and builds content_ref only for content event refs', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        event_type: 'read',
        title: '阅读了热点',
        summary: '摘要',
        ref_type: 'hot_topic',
        ref_id: 9,
        created_at: '2026-04-16 10:00:00',
      },
      {
        id: 2,
        user_id: 1,
        event_type: 'note_created',
        title: '记了一条想法',
        summary: null,
        ref_type: 'note',
        ref_id: 3,
        created_at: '2026-04-16 11:00:00',
      },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/history', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(2)
    expect(payload.items[0].content_ref).toBe('hot_topic:9')
    expect(payload.items[1].content_ref).toBeNull()
  })

  it('creates history from content_ref and stores parsed ref_type/ref_id', async () => {
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 77 } })
    dbMocks.queryOne.mockResolvedValue({
      id: 77,
      user_id: 1,
      event_type: 'view',
      title: '查看机会详情',
      summary: '来自详情页',
      ref_type: 'opportunity',
      ref_id: 5,
      created_at: '2026-04-16 12:00:00',
    })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/history',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'view',
          title: '查看机会详情',
          summary: '来自详情页',
          content_ref: 'opportunity:5',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.id).toBe(77)
    expect(payload.ref_type).toBe('opportunity')
    expect(payload.ref_id).toBe(5)
    expect(payload.content_ref).toBe('opportunity:5')
    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO history_entries'),
      [1, 'view', '查看机会详情', '来自详情页', 'opportunity', 5]
    )
  })

  it('returns 500 when content_ref format is invalid', async () => {
    const app = buildApp()
    const response = await app.request(
      '/api/v1/history',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'view',
          title: '错误输入',
          content_ref: 'bad-format',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(500)
    const payload = await response.json()
    expect(payload.error).toContain('Failed to create history')
  })
})
