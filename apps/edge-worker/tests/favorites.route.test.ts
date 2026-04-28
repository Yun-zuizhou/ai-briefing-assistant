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

import favoritesRoutes from '../src/routes/favorites'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/favorites', favoritesRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers favorites routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
  })

  it('lists favorites and builds content_ref for each item', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        item_type: 'article',
        item_id: 12,
        item_title: 'AI 文章收藏',
        item_summary: '摘要',
        item_source: 'RSS',
        item_url: 'https://example.com/article/12',
        created_at: '2026-04-16 10:00:00',
      },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/favorites?item_type=article', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0].content_ref).toBe('article:12')
    expect(dbMocks.queryAll).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('AND item_type = ?'),
      [1, 'article']
    )
  })

  it('creates favorite from content_ref when no existing record is found', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 23,
        user_id: 1,
        item_type: 'hot_topic',
        item_id: 8,
        item_title: 'AI 热点',
        item_summary: '值得收藏',
        item_source: '热点聚合',
        item_url: null,
        created_at: '2026-04-16 10:00:00',
      })
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 23 } })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/favorites',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content_ref: 'hot_topic:8',
          item_title: 'AI 热点',
          item_summary: '值得收藏',
          item_source: '热点聚合',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.id).toBe(23)
    expect(payload.item_type).toBe('hot_topic')
    expect(payload.item_id).toBe(8)
    expect(payload.content_ref).toBe('hot_topic:8')
    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO favorites'),
      [1, 'hot_topic', 8, 'AI 热点', '值得收藏', '热点聚合', null]
    )
  })

  it('returns existing favorite instead of inserting duplicate records', async () => {
    dbMocks.queryOne.mockResolvedValue({
      id: 5,
      user_id: 1,
      item_type: 'opportunity',
      item_id: 3,
      item_title: '投稿机会',
      item_summary: '已收藏',
      item_source: '机会池',
      item_url: null,
      created_at: '2026-04-16 11:00:00',
    })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/favorites',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          item_type: 'opportunity',
          item_id: 3,
          item_title: '投稿机会',
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.id).toBe(5)
    expect(payload.content_ref).toBe('opportunity:3')
    expect(dbMocks.execute).not.toHaveBeenCalled()
  })

  it('returns 403 when deleting another user\'s favorite', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 99,
          user_id: 2,
          item_type: 'article',
          item_id: 3,
          item_title: '别人的收藏',
          item_summary: null,
          item_source: null,
          item_url: null,
          created_at: '2026-04-16 10:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/favorites/99',
      withSession({ method: 'DELETE' }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权删除该收藏')
  })
})
