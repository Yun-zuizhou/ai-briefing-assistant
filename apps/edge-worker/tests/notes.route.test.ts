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

import notesRoutes from '../src/routes/notes'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/notes', notesRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers notes routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
  })

  it('lists notes and parses JSON tags', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 9,
        user_id: 1,
        content: '记录了一个 AI 想法',
        source_type: 'chat',
        source_id: 4,
        tags: '["AI","灵感"]',
        created_at: '2026-04-16 09:00:00',
      },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/notes?source_type=chat', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0].tags).toEqual(['AI', '灵感'])
    expect(dbMocks.queryAll).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('AND source_type = ?'),
      [1, 'chat']
    )
  })

  it('creates notes with manual defaults and serialized tags', async () => {
    dbMocks.queryOne.mockResolvedValue({
      id: 31,
      user_id: 1,
      content: '补一条记录',
      source_type: 'manual',
      source_id: null,
      tags: '["复盘","AI"]',
      created_at: '2026-04-16 09:30:00',
    })
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 31 } })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/notes',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: '补一条记录',
          tags: ['复盘', 'AI'],
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.id).toBe(31)
    expect(payload.source_type).toBe('manual')
    expect(payload.tags).toEqual(['复盘', 'AI'])
    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('INSERT INTO notes'),
      [1, '补一条记录', 'manual', null, '["复盘","AI"]']
    )
  })

  it('updates note content and tags using existing source metadata', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce({
        id: 7,
        user_id: 1,
        content: '旧内容',
        source_type: 'chat',
        source_id: 2,
        tags: '["旧标签"]',
        created_at: '2026-04-16 08:00:00',
      })
      .mockResolvedValueOnce({
        id: 7,
        user_id: 1,
        content: '新内容',
        source_type: 'chat',
        source_id: 2,
        tags: '["新标签","复盘"]',
        created_at: '2026-04-16 08:00:00',
      })
    const app = buildApp()

    const response = await app.request(
      '/api/v1/notes/7',
      withSession({
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          content: '新内容',
          tags: ['新标签', '复盘'],
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.id).toBe(7)
    expect(payload.content).toBe('新内容')
    expect(payload.source_type).toBe('chat')
    expect(payload.source_id).toBe(2)
    expect(payload.tags).toEqual(['新标签', '复盘'])
    expect(dbMocks.execute).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('UPDATE notes SET content = ?, tags = ?'),
      ['新内容', '["新标签","复盘"]', 7]
    )
  })

  it('returns 403 when accessing another user\'s note', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 12,
          user_id: 2,
          content: '别人的记录',
          source_type: 'manual',
          source_id: null,
          tags: '[]',
          created_at: '2026-04-16 08:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/notes/12', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该记录')
  })

  it('returns 403 when updating another user\'s note', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 13,
          user_id: 2,
          content: '别人的记录',
          source_type: 'manual',
          source_id: null,
          tags: '[]',
          created_at: '2026-04-16 08:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/notes/13',
      withSession({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: '试图修改' }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权修改该记录')
  })

  it('returns 403 when deleting another user\'s note', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 14,
          user_id: 2,
          content: '别人的记录',
          source_type: 'manual',
          source_id: null,
          tags: '[]',
          created_at: '2026-04-16 08:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/notes/14',
      withSession({ method: 'DELETE' }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权删除该记录')
  })
})
