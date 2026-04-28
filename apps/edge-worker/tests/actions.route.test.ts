import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const dbMocks = vi.hoisted(() => ({
  queryAll: vi.fn(),
  queryOne: vi.fn(),
}))

const behaviorMocks = vi.hoisted(() => ({
  listTodos: vi.fn(),
  getCheckedInToday: vi.fn(),
  getActivityStreak: vi.fn(),
  appendHistory: vi.fn(),
}))

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

vi.mock('../src/services/behavior', async () => {
  const actual = await vi.importActual<typeof import('../src/services/behavior')>('../src/services/behavior')
  return {
    ...actual,
    listTodos: behaviorMocks.listTodos,
    getCheckedInToday: behaviorMocks.getCheckedInToday,
    getActivityStreak: behaviorMocks.getActivityStreak,
    appendHistory: behaviorMocks.appendHistory,
  }
})

import actionsRoutes from '../src/routes/actions'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/actions', actionsRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers actions routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    behaviorMocks.listTodos.mockResolvedValue([])
    behaviorMocks.getCheckedInToday.mockResolvedValue(false)
    behaviorMocks.getActivityStreak.mockResolvedValue(0)
    behaviorMocks.appendHistory.mockResolvedValue(true)
    dbMocks.queryOne.mockResolvedValue({
      morning_brief_time: '08:30',
      do_not_disturb_enabled: 1,
    })
    dbMocks.queryAll.mockResolvedValue([])
  })

  it('builds actions overview with linked todo source and schedule reminders', async () => {
    behaviorMocks.listTodos.mockResolvedValue([
      {
        id: 11,
        content: '投递 AI 比赛',
        status: 'pending',
        priority: 'high',
        deadline: null,
        related_type: 'opportunity',
        related_id: 99,
      },
      {
        id: 12,
        content: '下周整理简历',
        status: 'pending',
        priority: 'medium',
        deadline: '2099-12-30',
        related_type: null,
        related_id: null,
      },
      {
        id: 13,
        content: '完成作品集',
        status: 'completed',
        priority: 'urgent',
        deadline: null,
        related_type: 'chat',
        related_id: null,
      },
    ])
    behaviorMocks.getCheckedInToday.mockResolvedValue(false)
    behaviorMocks.getActivityStreak.mockResolvedValue(5)

    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM favorites')) {
        return [
          {
            id: 101,
            item_title: 'AI 热点',
            item_type: 'hot_topic',
            item_source: 'rss',
            created_at: '2026-04-16 09:00:00',
          },
          {
            id: 102,
            item_title: '日志草稿',
            item_type: 'note',
            item_source: 'manual',
            created_at: '2026-04-16 08:00:00',
          },
        ]
      }
      if (text.includes('FROM opportunity_follows')) {
        return [
          {
            follow_id: 201,
            title: 'AI 岗位投递',
            follow_status: 'watching',
            deadline: '2026-04-30',
            progress_text: '已完善简历',
            next_step: '完成投递',
          },
        ]
      }
      if (text.includes('FROM briefing_schedules')) {
        return [
          {
            id: 301,
            briefing_type: 'morning',
            schedule_time: '08:30',
            status: 'ACTIVE',
            next_run_at: '2026-04-17 08:30:00',
          },
        ]
      }
      return []
    })

    const app = buildApp()
    const response = await app.request('/api/v1/actions/overview', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.todayTodos[0]).toMatchObject({
      todoId: 11,
      sourceType: 'content',
      sourceRefId: 99,
      done: false,
    })
    expect(payload.futureTodos[0]).toMatchObject({
      todoId: 12,
      dueLabel: '2099-12-30',
    })
    expect(payload.completedTodos[0]).toMatchObject({
      todoId: 13,
      done: true,
    })
    expect(payload.savedForLater).toHaveLength(1)
    expect(payload.savedForLater[0].contentType).toBe('hot_topic')
    expect(payload.followingItems[0].followStatus).toBe('watching')
    expect(payload.topPriority).toMatchObject({
      source: 'todo',
      id: 11,
      title: '投递 AI 比赛',
      primaryActionLabel: '标记完成',
    })
    expect(payload.suggestedNextActions[0]).toMatchObject({
      source: 'todo',
      id: 11,
    })
    expect(payload.suggestedNextActions.some((item: { source: string }) => item.source === 'opportunity_follow')).toBe(true)
    expect(payload.reminderSummary.upcomingReminders[0]).toMatchObject({
      id: 301,
      type: 'digest',
    })
    expect(payload.streakDays).toBe(5)
    expect(payload.checkedInToday).toBe(false)

    const usesLowerStatusFilter = dbMocks.queryAll.mock.calls.some((args) =>
      String(args[1]).includes("lower(status) = 'active'")
    )
    expect(usesLowerStatusFilter).toBe(true)
  })

  it('does not append history when user already checked in today', async () => {
    behaviorMocks.getCheckedInToday.mockResolvedValue(true)
    behaviorMocks.getActivityStreak.mockResolvedValue(9)
    const app = buildApp()

    const response = await app.request('/api/v1/actions/check-in', withSession({ method: 'POST' }), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.checkedInToday).toBe(true)
    expect(payload.streakDays).toBe(9)
    expect(payload.message).toContain('已经打过卡')
    expect(behaviorMocks.appendHistory).not.toHaveBeenCalled()
  })

  it('appends history and returns updated streak on first check-in', async () => {
    behaviorMocks.getCheckedInToday.mockResolvedValue(false)
    behaviorMocks.getActivityStreak.mockResolvedValue(3)
    const app = buildApp()

    const response = await app.request('/api/v1/actions/check-in', withSession({ method: 'POST' }), mockEnv())
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.checkedInToday).toBe(true)
    expect(payload.streakDays).toBe(3)
    expect(payload.message).toContain('打卡成功')
    expect(behaviorMocks.appendHistory).toHaveBeenCalledWith(
      expect.anything(),
      1,
      'daily_check_in',
      '今日打卡',
      '已完成今日打卡'
    )
  })
})
