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

import chatRoutes from '../src/routes/chat'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/chat', chatRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

function readSseEvents(text: string) {
  return text
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const event = block.match(/^event:\s*(.+)$/m)?.[1] ?? 'message'
      const dataText = block.match(/^data:\s*(.+)$/m)?.[1] ?? '{}'
      return {
        event,
        data: JSON.parse(dataText),
      }
    })
}

describe('workers chat routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockResolvedValue({
      id: 1001,
      user_id: 1,
      session_title: '测试会话',
      source_context: null,
      status: 'active',
      created_at: '2026-04-16 00:00:00',
      updated_at: '2026-04-16 00:00:00',
      last_message_at: null,
    })
    dbMocks.execute.mockResolvedValue({
      success: true,
      meta: { last_row_id: 1 },
    })
  })

  it('executes add_interest through the message stream and writes interest rows', async () => {
    const app = buildApp()

    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '今天特别关注了AI，以后希望得到更多关于AI的咨询',
          current_interests: ['写作'],
          confirmed_type: 'add_interest',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const events = readSseEvents(await response.text())
    const resultEvent = events.find((item) => item.event === 'execution_result')
    expect(resultEvent?.data.success).toBe(true)
    expect(resultEvent?.data.actionType).toBe('add_interest')
    expect(resultEvent?.data.deepLink).toBe('/today')

    const wroteInterest = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT OR REPLACE INTO user_interests')
    )
    expect(wroteInterest).toBe(true)
  })

  it('requires confirmation before writing system configuration from chat', async () => {
    const app = buildApp()

    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '我想关注 AI 和远程工作',
          current_interests: ['写作'],
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const events = readSseEvents(await response.text())
    expect(events.some((item) => item.event === 'pending_confirmation')).toBe(true)
    expect(events.some((item) => item.event === 'execution_result')).toBe(false)

    const wroteInterest = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT OR REPLACE INTO user_interests')
    )
    expect(wroteInterest).toBe(false)
  })

  it('confirms system configuration and returns a success verification link', async () => {
    const app = buildApp()

    const response = await app.request(
      '/api/v1/chat/confirm',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_message: '以后每天早上 8 点发简报',
          confirmed_type: 'set_push_time',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.actionType).toBe('set_push_time')
    expect(payload.successMessage).toContain('已配置简报推送时间')
    expect(payload.resultSummary).toContain('配置成功')
    expect(payload.deepLink).toBe('/notification-settings')
    expect(payload.nextPageLabel).toBe('查看通知设置')

    const wroteSettings = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('UPDATE user_settings SET morning_brief_time')
    )
    expect(wroteSettings).toBe(true)
  })

  it('emits an SSE error when message persistence fails', async () => {
    const app = buildApp()
    dbMocks.queryOne.mockRejectedValueOnce(new Error('db unavailable'))

    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '明天提醒我整理AI资料',
          current_interests: ['AI'],
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const events = readSseEvents(await response.text())
    const errorEvent = events.find((item) => item.event === 'error')
    expect(errorEvent?.data.message).toContain('db unavailable')
  })

  it('returns 500 when reclassify persistence fails', async () => {
    const app = buildApp()
    dbMocks.queryOne.mockRejectedValueOnce(new Error('db unavailable'))

    const response = await app.request(
      '/api/v1/chat/reclassify',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          target_intent: 'record_thought',
          correction_from: 'todo:1',
          original_input: '把这个改成记录',
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(500)
    const payload = await response.json()
    expect(payload.success).toBe(false)
    expect(payload.successMessage).toContain('纠偏执行失败')
  })

  it('returns 500 when listing chat sessions fails', async () => {
    const app = buildApp()
    dbMocks.queryAll.mockRejectedValueOnce(new Error('db unavailable'))

    const response = await app.request(
      '/api/v1/chat/sessions',
      withSession(),
      mockEnv()
    )

    expect(response.status).toBe(500)
    const payload = await response.json()
    expect(payload.error).toContain('Failed to load chat sessions')
  })

  it('returns 403 when loading another user\'s session messages', async () => {
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('WHERE id = ? AND user_id = ?')) {
        return null
      }
      if (text.includes('WHERE id = ?')) {
        return {
          id: 2002,
          user_id: 2,
          session_title: '别人的会话',
          source_context: null,
          status: 'active',
          created_at: '2026-04-16 00:00:00',
          updated_at: '2026-04-16 00:00:00',
          last_message_at: null,
        }
      }
      return null
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/chat/sessions/2002/messages',
      withSession(),
      mockEnv()
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toContain('无权访问该会话')
  })
})
