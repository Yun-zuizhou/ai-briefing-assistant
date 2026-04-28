import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const behaviorMocks = vi.hoisted(() => ({
  listNoteRows: vi.fn(),
  listTodoRows: vi.fn(),
  listFavoriteRows: vi.fn(),
  listHistoryRows: vi.fn(),
  listFollowingItemsForActionOverview: vi.fn(),
}))

const contentMocks = vi.hoisted(() => ({
  getUserInterests: vi.fn(),
}))

const reportMocks = vi.hoisted(() => ({
  listReportEntries: vi.fn(),
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
    getUserInterests: contentMocks.getUserInterests,
  }
})

vi.mock('../src/services/reports', async () => {
  const actual = await vi.importActual<typeof import('../src/services/reports')>('../src/services/reports')
  return {
    ...actual,
    listReportEntries: reportMocks.listReportEntries,
  }
})

vi.mock('../src/services/behavior', async () => {
  const actual = await vi.importActual<typeof import('../src/services/behavior')>('../src/services/behavior')
  return {
    ...actual,
    listNoteRows: behaviorMocks.listNoteRows,
    listTodoRows: behaviorMocks.listTodoRows,
    listFavoriteRows: behaviorMocks.listFavoriteRows,
    listHistoryRows: behaviorMocks.listHistoryRows,
    listFollowingItemsForActionOverview: behaviorMocks.listFollowingItemsForActionOverview,
  }
})

import journalRoutes from '../src/routes/journal'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/journal', journalRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers journal routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    behaviorMocks.listNoteRows.mockResolvedValue([])
    behaviorMocks.listTodoRows.mockResolvedValue([])
    behaviorMocks.listFavoriteRows.mockResolvedValue([])
    behaviorMocks.listHistoryRows.mockResolvedValue([])
    behaviorMocks.listFollowingItemsForActionOverview.mockResolvedValue([])
    contentMocks.getUserInterests.mockResolvedValue([])
    reportMocks.listReportEntries.mockResolvedValue([])
  })

  it('builds journal overview from notes, actions, kept items, and reports', async () => {
    behaviorMocks.listNoteRows.mockResolvedValue([
      {
        id: 11,
        user_id: 1,
        content: '今天想继续关注 AI 工具的实际落地',
        source_type: 'chat',
        source_id: 101,
        tags: JSON.stringify(['AI', '工具']),
        created_at: '2026-04-27 09:00:00',
      },
    ])
    behaviorMocks.listTodoRows.mockResolvedValue([
      {
        id: 21,
        user_id: 1,
        content: '整理 AI 比赛材料',
        description: null,
        status: 'pending',
        priority: 'urgent',
        deadline: '2026-04-30',
        related_type: 'chat',
        related_id: 11,
        related_title: null,
        tags: '[]',
        created_at: '2026-04-27 09:10:00',
        updated_at: '2026-04-27 09:10:00',
      },
      {
        id: 22,
        user_id: 1,
        content: '完成旧待办',
        description: null,
        status: 'completed',
        priority: 'medium',
        deadline: null,
        related_type: null,
        related_id: null,
        related_title: null,
        tags: '[]',
        created_at: '2026-04-26 09:10:00',
        updated_at: '2026-04-26 09:10:00',
      },
    ])
    behaviorMocks.listFavoriteRows.mockResolvedValue([
      {
        id: 31,
        user_id: 1,
        item_type: 'hot_topic',
        item_id: 301,
        item_title: 'AI 热点',
        item_summary: '值得稍后阅读',
        item_source: 'rss',
        item_url: null,
        created_at: '2026-04-27 10:00:00',
      },
    ])
    behaviorMocks.listHistoryRows.mockResolvedValue([
      {
        id: 41,
        user_id: 1,
        event_type: 'briefing_read',
        title: '阅读晨间简报',
        summary: '完成今日信息输入',
        ref_type: 'briefing',
        ref_id: 7,
        created_at: '2026-04-27 08:00:00',
      },
    ])
    behaviorMocks.listFollowingItemsForActionOverview.mockResolvedValue([
      {
        follow_id: 51,
        title: 'AI 岗位投递',
        follow_status: 'watching',
        deadline: '2026-05-01',
        progress_text: '已完善简历',
        next_step: '补充作品集',
      },
    ])
    contentMocks.getUserInterests.mockResolvedValue(['AI', '产品'])
    reportMocks.listReportEntries.mockResolvedValue([{ id: 61 }, { id: 62 }])

    const app = buildApp()
    const response = await app.request('/api/v1/journal/overview', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.summary).toMatchObject({
      expressionCount: 1,
      progressCount: 3,
      keptCount: 2,
      reviewCount: 2,
    })
    expect(payload.summary.summaryText).toContain('今天想继续关注 AI 工具')
    expect(payload.recentNotes[0]).toMatchObject({
      id: 11,
      source_type: 'chat',
      tags: ['AI', '工具'],
    })
    expect(payload.progressItems[0]).toMatchObject({
      id: 'todo-21',
      title: '整理 AI 比赛材料',
      deepLink: '/actions',
    })
    expect(payload.progressItems.some((item: { id: string }) => item.id === 'follow-51')).toBe(true)
    expect(payload.keptItems[0]).toMatchObject({
      id: 'favorite-31',
      sourceLabel: '热点',
      deepLink: '/collections',
    })
    expect(payload.review.keywords).toEqual(['AI', '产品', '持续探索', '记录成长'])
    expect(payload.review.availableCount).toBe(2)
  })
})
