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

import todosRoutes from '../src/routes/todos'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/todos', todosRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers todos routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
  })

  it('lists todos with related fields and parsed tags', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        content: '整理 AI 项目',
        description: '完善测试',
        status: 'pending',
        priority: 'high',
        deadline: '2026-04-20',
        related_type: 'opportunity',
        related_id: 8,
        related_title: 'AI 机会',
        tags: '["AI","测试"]',
        created_at: '2026-04-16 10:00:00',
      },
    ])

    const app = buildApp()
    const response = await app.request('/api/v1/todos?status=pending', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.items[0]).toMatchObject({
      related_type: 'opportunity',
      related_id: 8,
      related_title: 'AI 机会',
    })
    expect(payload.items[0].tags).toEqual(['AI', '测试'])
  })

  it('completes opportunity-linked todo and writes follow + execution result', async () => {
    let todoReadCount = 0
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('SELECT * FROM todos')) {
        todoReadCount += 1
        return {
          id: 5,
          user_id: 1,
          content: '提交比赛报名',
          description: null,
          status: todoReadCount > 1 ? 'completed' : 'pending',
          priority: 'high',
          deadline: null,
          related_type: 'opportunity',
          related_id: 3,
          related_title: 'AI 赛事',
          tags: '[]',
          created_at: '2026-04-16 11:00:00',
          updated_at: '2026-04-16 11:00:00',
        }
      }
      if (text.includes('SELECT id FROM opportunity_follows')) {
        return { id: 77 }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/todos/5/complete',
      withSession({
        method: 'POST',
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.status).toBe('completed')
    expect(payload.related_type).toBe('opportunity')
    expect(payload.related_id).toBe(3)

    const wroteFollow = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO opportunity_follows')
    )
    const wroteExecutionResult = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO opportunity_execution_results')
    )
    expect(wroteFollow).toBe(true)
    expect(wroteExecutionResult).toBe(true)
  })

  it('returns 403 when completing another user\'s todo', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 9,
          user_id: 2,
          content: '别人的待办',
          description: null,
          status: 'pending',
          priority: 'medium',
          deadline: null,
          related_type: null,
          related_id: null,
          related_title: null,
          tags: '[]',
          created_at: '2026-04-16 11:00:00',
          updated_at: '2026-04-16 11:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/todos/9/complete',
      withSession({ method: 'POST' }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权完成该待办')
  })

  it('returns 403 when loading another user\'s todo', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 10,
          user_id: 2,
          content: '别人的待办',
          description: null,
          status: 'pending',
          priority: 'medium',
          deadline: null,
          related_type: null,
          related_id: null,
          related_title: null,
          tags: '[]',
          created_at: '2026-04-16 11:00:00',
          updated_at: '2026-04-16 11:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/todos/10', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该待办')
  })

  it('returns 403 when updating another user\'s todo', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 11,
          user_id: 2,
          content: '别人的待办',
          description: null,
          status: 'pending',
          priority: 'medium',
          deadline: null,
          related_type: null,
          related_id: null,
          related_title: null,
          tags: '[]',
          created_at: '2026-04-16 11:00:00',
          updated_at: '2026-04-16 11:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/todos/11',
      withSession({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: '试图修改' }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权修改该待办')
  })

  it('returns 403 when deleting another user\'s todo', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 12,
          user_id: 2,
          content: '别人的待办',
          description: null,
          status: 'pending',
          priority: 'medium',
          deadline: null,
          related_type: null,
          related_id: null,
          related_title: null,
          tags: '[]',
          created_at: '2026-04-16 11:00:00',
          updated_at: '2026-04-16 11:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/todos/12',
      withSession({ method: 'DELETE' }),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权删除该待办')
  })
})
