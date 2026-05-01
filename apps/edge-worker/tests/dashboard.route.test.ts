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

import dashboardRoutes, { runTodayBriefingCron } from '../src/routes/dashboard'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_TRANSPORT?: string
  AI_KEY_ENCRYPTION_SECRET?: string
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
    SUMMARY_PROVIDER_ENABLED: '0',
  }
}

describe('workers dashboard route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM llm_invocations')) {
        return [{ total: 0 }]
      }
      if (text.includes('FROM briefing_schedules')) {
        return []
      }
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
    expect(payload.pageTitle).toBe('简报')
    expect(payload.summary).toMatchObject({
      summaryTitle: '今日内容摘要',
    })
    expect(payload.summary.summaryText).toContain('围绕你关注的 AI')
    expect(payload.summary.summaryText).toContain('AI 资讯')
    expect(payload.summary.summaryText).toContain('AI 主题内容')
    expect(payload.summary.summaryText).not.toContain('AI 相关机会')
    expect(payload.summary.summaryText).not.toContain('待办')
    expect(payload.summary.summaryText).not.toContain('后续线索')
    expect(payload.summary.summaryText).not.toContain('条重点报道')
    expect(payload.summary.summaryText).not.toContain('组关注领域内容')
    expect(payload.recommendedForYou[0].recommendationReason).toContain('今天的简报')
    expect(payload.recommendedForYou[0].recommendationReason).not.toContain('后续线索')
    expect(payload.recommendedForYou[0].recommendationReason).not.toContain('Today')
    expect(payload.recommendedForYou[0].recommendationReason).not.toContain('真实热点')
    expect(payload.leadItem).toMatchObject({
      itemType: 'hot_topic',
      title: 'AI 资讯',
      primaryActionLabel: '打开内容',
    })
    expect(payload.summary.summaryText).not.toContain('真实聚合阶段')
    expect(payload.extensionSlots.length).toBeGreaterThan(0)
  })

  it('does not promote opportunities into briefing reports or headline fallback', async () => {
    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM llm_invocations')) {
        return [{ total: 0 }]
      }
      if (text.includes('FROM briefing_schedules')) {
        return []
      }
      if (text.includes('FROM user_interests')) {
        return [{ interest_name: 'AI' }]
      }
      if (text.includes('FROM hot_topics')) {
        return []
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

    const app = buildApp()
    const response = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.recommendedForYou).toEqual([])
    expect(payload.worthActing.length).toBeGreaterThan(0)
    expect(payload.leadItem).toBeNull()
    expect(payload.summary.summaryText).toContain('暂时没有足够新内容')
    expect(payload.summary.summaryText).not.toContain('AI 相关机会')
    expect(payload.summary.summaryText).not.toContain('待办')
    expect(payload.summary.summaryText).not.toContain('后续线索')
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

  it('passes through normalized AI briefing payload when available', async () => {
    dbMocks.queryOne.mockResolvedValueOnce({
      id: 8,
      issue_number: 203,
      briefing_type: 'morning',
      title: '今日 AI 简报',
      summary_text: '今天重点看 AI 应用和远程机会。',
      payload: JSON.stringify({
        aiBriefing: {
          version: 'llm-today-briefing-v1',
          provider: 'deepseek',
          model: 'deepseek-v4-flash',
          status: 'success',
          leadSummary: '今天重点看 AI 应用和远程机会。',
          topicClusters: [
            {
              title: 'AI 应用落地',
              summary: '多条内容指向 AI 工具进入真实工作流程。',
              confidenceNote: '该主题由同方向来源共同支撑。',
              recommendationReason: '与你关注的 AI 相关。',
              sourceRefs: [
                {
                  contentRef: 'hot_topic:1',
                  title: 'AI 资讯',
                  sourceLabel: 'source-a',
                  reason: '与你关注的 AI 相关',
                },
              ],
            },
          ],
          recommendationReasons: ['与你关注的 AI 相关。'],
          uncertainties: ['机会质量仍需继续跟踪。'],
          generatedAt: '2026-04-27T08:00:00.000Z',
        },
      }),
      generated_at: '2026-04-27 08:00:00',
      created_at: '2026-04-27 07:50:00',
    })

    const app = buildApp()
    const response = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.aiBriefing).toMatchObject({
      version: 'llm-today-briefing-v1',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      status: 'success',
      leadSummary: '今天重点看 AI 应用和远程机会。',
    })
    expect(payload.aiBriefing.topicClusters[0]).toMatchObject({
      title: 'AI 应用落地',
      confidenceNote: '该主题由同方向来源共同支撑。',
      recommendationReason: '与你关注的 AI 相关。',
      sourceRefs: [
        expect.objectContaining({
          contentRef: 'hot_topic:1',
          title: 'AI 资讯',
        }),
      ],
    })
  })

  it('queries opportunities with case-insensitive active filter', async () => {
    const app = buildApp()
    await app.request('/api/v1/dashboard/today', withSession(), mockEnv())

    const hasLowerStatusFilter = dbMocks.queryAll.mock.calls.some((args) =>
      String(args[1]).includes("lower(status) = 'active'")
    )
    expect(hasLowerStatusFilter).toBe(true)
  })

  it('runs today briefing cron for active morning schedules', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              leadSummary: '今天重点看 AI 应用和远程机会。',
              topicClusters: [
                {
                  title: 'AI 应用落地',
                  summary: '多条内容指向 AI 工具进入真实工作流程。',
                  confidenceNote: '该主题由同方向来源共同支撑。',
                  recommendationReason: '与你关注的 AI 相关。',
                  sourceIndexes: [0, 1],
                },
              ],
              recommendationReasons: ['与你关注的 AI 相关。'],
              uncertainties: ['机会质量仍需继续跟踪。'],
            }),
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM briefing_schedules')) {
        return [{ id: 12, user_id: 1, schedule_time: '08:00' }]
      }
      if (text.includes('FROM llm_invocations')) {
        return [{ total: 0 }]
      }
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

    const result = await runTodayBriefingCron({
      ...mockEnv(),
      SUMMARY_PROVIDER_ENABLED: '1',
      SUMMARY_PROVIDER_API_URL: 'https://api.example.com/chat/completions',
      SUMMARY_PROVIDER_API_KEY: 'sk-test-summary',
      SUMMARY_PROVIDER_MODEL: 'deepseek-v4-flash',
      SUMMARY_PROVIDER_TRANSPORT: 'openai-compatible',
    })

    expect(result).toMatchObject({
      checked: 1,
      generated: 1,
      skipped: 0,
      failed: 0,
    })
    expect(fetchMock).toHaveBeenCalled()
    const wroteBriefing = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO briefings')
    )
    const wroteDispatchLog = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO briefing_dispatch_logs')
    )
    expect(wroteBriefing).toBe(true)
    expect(wroteDispatchLog).toBe(true)
  })
})
