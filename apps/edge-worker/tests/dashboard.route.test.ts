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

import dashboardRoutes from '../src/routes/dashboard'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/dashboard', dashboardRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers dashboard route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM user_interests')) {
        return [{ interest_name: 'AI' }]
      }
      if (text.includes('FROM hot_topics')) {
        return [
          {
            id: 1,
            title: 'AI 资讯',
            summary: 'AI 主题内容',
            source: 'source-a',
            source_url: 'https://example.com/hot/1',
            categories: '["AI"]',
            tags: '["AI","趋势"]',
            hot_value: 100,
            quality_score: 9.2,
            published_at: '2026-04-16 08:00:00',
          },
        ]
      }
      if (text.includes('FROM opportunities')) {
        return [
          {
            id: 2,
            title: 'AI 相关机会',
            type: 'competition',
            status: 'ACTIVE',
            source: 'source-b',
            source_url: 'https://example.com/opp/2',
            summary: '面向 AI 的机会',
            reward: '500',
            location: 'remote',
            is_remote: 1,
            deadline: '2026-04-30',
            tags: '["AI"]',
            quality_score: 8.8,
          },
        ]
      }
      return []
    })
  })

  it('builds today response from user interests and real content blocks', async () => {
    const app = buildApp()
    const response = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(Array.isArray(payload.recommendedForYou)).toBe(true)
    expect(payload.recommendedForYou[0].interestName).toBe('AI')
    expect(payload.worthKnowing.length).toBeGreaterThan(0)
    expect(payload.worthActing.length).toBeGreaterThan(0)
    expect(payload.leadItem).toMatchObject({
      itemType: 'hot_topic',
      title: 'AI 资讯',
      primaryActionLabel: '打开内容',
    })
    expect(payload.summary.summaryText).not.toContain('真实聚合阶段')
    expect(payload.extensionSlots.length).toBeGreaterThan(0)
  })

  it('prefers ready briefing payload lead item when available', async () => {
    dbMocks.queryOne.mockResolvedValueOnce({
      issue_number: 202,
      title: '今日 AI 角度',
      summary_text: '今天重点看 AI 应用落地。',
      payload: JSON.stringify({
        leadItem: {
          itemType: 'briefing',
          title: 'AI 应用落地窗口',
          summary: '今天最值得看的，是 AI 工具从试用进入日常流程。',
          sourceLabel: '晨间简报',
          relevanceLabel: '与你关注的 AI 相关',
          primaryActionLabel: '打开简报',
          secondaryActionLabel: '记下判断',
        },
        dailyAngle: 'AI 工具落地',
        extensionSlots: [
          {
            slotType: 'ask',
            title: '追问角度',
            description: '继续追问 AI 应用落地窗口。',
            actionLabel: '继续追问',
            deepLink: '/chat',
          },
        ],
      }),
      generated_at: '2026-04-27 08:00:00',
      created_at: '2026-04-27 07:50:00',
    })

    const app = buildApp()
    const response = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.issueNumber).toBe(202)
    expect(payload.summary).toMatchObject({
      summaryTitle: '今日 AI 角度',
      summaryText: '今天重点看 AI 应用落地。',
    })
    expect(payload.leadItem).toMatchObject({
      itemType: 'briefing',
      title: 'AI 应用落地窗口',
      primaryActionLabel: '打开简报',
    })
    expect(payload.dailyAngle).toBe('AI 工具落地')
    expect(payload.extensionSlots[0]).toMatchObject({
      slotType: 'ask',
      actionLabel: '继续追问',
    })
    expect(payload.freshness.generatedAt).toBe('2026-04-27 08:00:00')
  })

  it('queries opportunities with case-insensitive active filter', async () => {
    const app = buildApp()
    await app.request('/api/v1/dashboard/today', withSession(), mockEnv())

    const hasLowerStatusFilter = dbMocks.queryAll.mock.calls.some((args) =>
      String(args[1]).includes("lower(status) = 'active'")
    )
    expect(hasLowerStatusFilter).toBe(true)
  })
})
