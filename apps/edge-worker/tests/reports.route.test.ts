import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const dbMocks = vi.hoisted(() => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
}))

const contentStoreMocks = vi.hoisted(() => ({
  getUserInterests: vi.fn(),
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

vi.mock('../src/services/content', async () => {
  const actual = await vi.importActual<typeof import('../src/services/content')>('../src/services/content')
  return {
    ...actual,
    getUserInterests: contentStoreMocks.getUserInterests,
  }
})

import reportsRoutes from '../src/routes/reports'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/reports', reportsRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers reports routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
    contentStoreMocks.getUserInterests.mockResolvedValue(['AI', '写作'])
  })

  it('lists report entries and maps available report metadata', async () => {
    dbMocks.queryAll.mockResolvedValue([
      {
        id: 11,
        user_id: 1,
        report_type: 'weekly',
        period_start: '2026-04-10',
        period_end: '2026-04-16',
        title: '本周回顾周报',
        summary_text: '总结',
        status: 'ready',
        generated_at: '2026-04-16 09:00:00',
        report_payload_json: '{}',
        created_at: '2026-04-16 09:00:00',
      },
    ])
    const app = buildApp()

    const response = await app.request('/api/v1/reports', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.reports).toHaveLength(1)
    expect(payload.reports[0]).toMatchObject({
      reportId: 11,
      reportType: 'weekly',
      reportTitle: '本周回顾周报',
      available: true,
    })
  })

  it('returns 404 when querying weekly report by missing report_id', async () => {
    dbMocks.queryOne.mockResolvedValue(null)
    const app = buildApp()

    const response = await app.request('/api/v1/reports/weekly?report_id=999', withSession(), mockEnv())
    expect(response.status).toBe(404)
    const payload = await response.json()
    expect(payload.error).toContain('报告不存在')
  })

  it('returns 403 when querying another user\'s weekly report', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ? AND report_type = ?')) {
        return null
      }
      if (text.includes('WHERE id = ? AND report_type = ?')) {
        return {
          id: 22,
          user_id: 2,
          report_type: 'weekly',
          period_start: '2026-04-10',
          period_end: '2026-04-16',
          title: '别人的周报',
          summary_text: '总结',
          status: 'ready',
          generated_at: '2026-04-16 09:00:00',
          report_payload_json: '{}',
          created_at: '2026-04-16 09:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/reports/weekly?report_id=22', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该报告')
  })

  it('returns 403 when querying another user\'s monthly report', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ? AND report_type = ?')) {
        return null
      }
      if (text.includes('WHERE id = ? AND report_type = ?')) {
        return {
          id: 23,
          user_id: 2,
          report_type: 'monthly',
          period_start: '2026-04-01',
          period_end: '2026-04-30',
          title: '别人的月报',
          summary_text: '总结',
          status: 'ready',
          generated_at: '2026-04-30 09:00:00',
          report_payload_json: '{}',
          created_at: '2026-04-30 09:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/reports/monthly?report_id=23', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该报告')
  })

  it('returns 403 when querying another user\'s annual report', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ? AND report_type = ?')) {
        return null
      }
      if (text.includes('WHERE id = ? AND report_type = ?')) {
        return {
          id: 24,
          user_id: 2,
          report_type: 'annual',
          period_start: '2026-01-01',
          period_end: '2026-12-31',
          title: '别人的年报',
          summary_text: '总结',
          status: 'ready',
          generated_at: '2026-12-31 09:00:00',
          report_payload_json: '{}',
          created_at: '2026-12-31 09:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/reports/annual?report_id=24', withSession(), mockEnv())

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该报告')
  })

  it('builds annual report and upserts report payload when no cache exists', async () => {
    const currentYear = new Date().getFullYear()
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes("report_type = 'annual'") && text.includes('period_start')) {
        return null
      }
      if (text.includes('SELECT COUNT(*) AS count') && text.includes('UNION')) return { count: 3 }
      if (text.includes('FROM notes') && text.includes('COUNT(*)')) return { count: 2 }
      if (text.includes('FROM favorites') && text.includes('COUNT(*)')) return { count: 1 }
      if (text.includes("FROM todos") && text.includes("status = 'completed'")) return { count: 1 }
      if (text.includes('FROM history_entries') && text.includes('COUNT(*)')) return { count: 5 }
      if (text.includes('COALESCE(period_start')) return null
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/reports/annual', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.year).toBe(currentYear)
    expect(payload.stats.topicsViewed).toBe(5)
    expect(payload.stats.opinionsPosted).toBe(2)
    expect(payload.stats.daysActive).toBe(3)
    expect(payload.interests).toContain('AI')
    expect(payload.dataQuality.confidence).toBe('medium')

    const insertedReport = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO reports')
    )
    expect(insertedReport).toBe(true)
  })
})
