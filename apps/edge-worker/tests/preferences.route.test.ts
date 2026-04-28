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

const behaviorStoreMocks = vi.hoisted(() => ({
  getActivityStreak: vi.fn(),
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

vi.mock('../src/services/behavior', async () => {
  const actual = await vi.importActual<typeof import('../src/services/behavior')>('../src/services/behavior')
  return {
    ...actual,
    getActivityStreak: behaviorStoreMocks.getActivityStreak,
  }
})

import preferencesRoutes from '../src/routes/preferences'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/preferences', preferencesRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers preferences routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
    dbMocks.queryOne.mockResolvedValue(null)
    contentStoreMocks.getUserInterests.mockResolvedValue(['AI'])
    behaviorStoreMocks.getActivityStreak.mockResolvedValue(7)
  })

  it('returns settings with synced schedule status and next run time', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM user_settings')) {
        return {
          id: 1,
          user_id: 1,
          morning_brief_time: '08:00',
          evening_brief_time: '21:00',
          do_not_disturb_enabled: 0,
          do_not_disturb_start: null,
          do_not_disturb_end: null,
          sound_enabled: 1,
          vibration_enabled: 1,
        }
      }
      if (text.includes('FROM briefing_schedules')) {
        return {
          status: 'active',
          next_run_at: '2026-04-17 08:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/preferences/settings', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.morning_brief_time).toBe('08:00')
    expect(payload.schedule_status).toBe('active')
    expect(payload.schedule_next_run_at).toBe('2026-04-17 08:00:00')
  })

  it('syncs morning schedule fact layer when updating settings', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('SELECT * FROM user_settings')) {
        return {
          id: 1,
          user_id: 1,
          morning_brief_time: '08:00',
          evening_brief_time: '21:00',
          do_not_disturb_enabled: 0,
          do_not_disturb_start: null,
          do_not_disturb_end: null,
          sound_enabled: 1,
          vibration_enabled: 1,
        }
      }
      if (text.includes('SELECT id FROM briefing_schedules')) {
        return { id: 88 }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/preferences/settings',
      withSession({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          morning_brief_time: '09:15',
          do_not_disturb_enabled: true,
        }),
      }),
      mockEnv()
    )
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.morning_brief_time).toBe('09:15')
    expect(payload.do_not_disturb_enabled).toBe(true)

    const wroteSchedule = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO briefing_schedules')
    )
    const wroteDispatchLog = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO briefing_dispatch_logs')
    )
    expect(wroteSchedule).toBe(true)
    expect(wroteDispatchLog).toBe(true)
  })

  it('returns masked ai provider settings when user config exists', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM user_settings')) {
        return {
          id: 1,
          user_id: 1,
          morning_brief_time: '08:00',
          evening_brief_time: '21:00',
          do_not_disturb_enabled: 0,
          do_not_disturb_start: null,
          do_not_disturb_end: null,
          sound_enabled: 1,
          vibration_enabled: 1,
          ai_provider: 'openai',
          ai_api_key: 'sk-test-12345678',
          updated_at: '2026-04-21 18:00:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/preferences/ai-provider', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload).toMatchObject({
      provider: 'openai',
      provider_label: 'OpenAI',
      has_api_key: true,
      is_configured: true,
      model: 'gpt-4o-mini',
    })
    expect(payload.api_key_masked).toContain('****')
  })

  it('stores ai provider using platform defaults without requiring extra config fields', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('SELECT * FROM user_settings')) {
        return {
          id: 1,
          user_id: 1,
          morning_brief_time: '08:00',
          evening_brief_time: '21:00',
          do_not_disturb_enabled: 0,
          do_not_disturb_start: null,
          do_not_disturb_end: null,
          sound_enabled: 1,
          vibration_enabled: 1,
          ai_provider: 'deepseek',
          ai_api_key: 'sk-new-abcdefg',
          updated_at: '2026-04-21 18:10:00',
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/preferences/ai-provider',
      withSession({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'deepseek',
          api_key: 'sk-new-abcdefg',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      provider: 'deepseek',
      provider_label: 'DeepSeek',
      has_api_key: true,
      is_configured: true,
      api_url: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
    })

    const wroteAiProvider = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('ai_provider = ?') && String(args[1]).includes('ai_api_key = ?')
    )
    expect(wroteAiProvider).toBe(true)
  })

  it('builds formal growth overview keywords when no active interests exist', async () => {
    contentStoreMocks.getUserInterests.mockResolvedValue([])

    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('AS notes_count') && text.includes('AS history_count')) {
        return {
          notes_count: 2,
          favorites_count: 1,
          completed_todos: 1,
          total_todos: 3,
          history_count: 5,
        }
      }
      if (text.includes('FROM notes') && text.includes('ORDER BY created_at DESC')) {
        return { content: '今天记录了 AI 学习心得', created_at: '2026-04-16 10:00:00' }
      }
      if (text.includes('FROM briefings')) return { title: '晨间简报', briefing_date: '2026-04-16' }
      if (text.includes('FROM opportunity_follows')) {
        return { next_step: '继续跟进投递', progress_text: null, updated_at: '2026-04-16', created_at: '2026-04-16' }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request('/api/v1/preferences/growth-overview', withSession(), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.streakDays).toBe(7)
    expect(payload.keywords.map((item: { keyword: string }) => item.keyword)).toContain('持续探索')
    expect(payload.reports[0].available).toBe(true)
    expect(payload.recentHistoryItems.length).toBeGreaterThan(0)
  })
})
