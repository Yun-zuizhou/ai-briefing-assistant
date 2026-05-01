import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptAiApiKey } from '../src/services/ai-key-crypto'
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
  AI_KEY_ENCRYPTION_SECRET?: string
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
    AI_KEY_ENCRYPTION_SECRET: 'test-encryption-secret',
  }
}

describe('workers chat llm route integration', () => {
  let encryptedDeepseekKey = ''

  beforeEach(async () => {
    vi.clearAllMocks()
    encryptedDeepseekKey = await encryptAiApiKey('sk-test-deepseek', 'test-encryption-secret')
    dbMocks.queryAll.mockResolvedValue([])
    dbMocks.queryOne.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM chat_sessions')) {
        return {
          id: 1001,
          user_id: 1,
          session_title: '测试会话',
          source_context: null,
          status: 'active',
          created_at: '2026-04-16 00:00:00',
          updated_at: '2026-04-16 00:00:00',
          last_message_at: null,
        }
      }
      if (text.includes('FROM user_settings')) {
        return {
          id: 1,
          user_id: 1,
          ai_provider: 'deepseek',
          ai_api_key: null,
          ai_api_key_encrypted: encryptedDeepseekKey,
          ai_api_key_encryption_version: 'aes-gcm-v1',
          updated_at: '2026-04-29 19:00:00',
        }
      }
      return null
    })
    dbMocks.execute.mockResolvedValue({
      success: true,
      meta: { last_row_id: 11, changes: 1 },
    })
  })

  it('uses llm classification for fallback chat input and preserves SSE response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    type: 'chat_only',
                    confidence: 0.92,
                    entities: {},
                    candidateIntents: ['chat_only'],
                    replyHint: '你好，我在。',
                    suggestedActions: [{ label: '看简报', action: '查看今日简报', targetIntent: 'query_stats' }],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    text: '你好，我在。你可以继续说想记录、整理或追问的内容。',
                    suggestedActions: [{ label: '看简报', action: '查看今日简报', targetIntent: 'query_stats' }],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )

    const app = buildApp()
    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '你好',
          current_interests: ['AI'],
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('event: intent_analysis')
    expect(text).toContain('"llmClassified":true')
    expect(text).toContain('"matchedBy":"llm"')
    expect(text).toContain('"intentType":"chat_only"')
    expect(text).toContain('你好，我在。')
    expect(text).toContain('"llmReplyGenerated":true')
    expect(text).toContain('你可以继续说想记录、整理或追问的内容')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
      })
    )

    fetchMock.mockRestore()
  })

  it('keeps greeting quick actions inside product scope', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    type: 'chat_only',
                    confidence: 0.94,
                    entities: {},
                    candidateIntents: ['chat_only'],
                    replyHint: '我是AI简报助手，可以帮你记录想法、待办和关注领域。',
                    suggestedActions: [],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    text: '你好，我是AI简报助手，可以帮你记录想法、创建待办和整理关注领域。',
                    suggestedActions: [
                      { label: '讲讲笑话', action: '讲个笑话', targetIntent: 'chat_only' },
                      { label: '记录想法', action: '记录一条想法', targetIntent: 'record_thought' },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )

    const app = buildApp()
    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '你好，你是谁？',
          current_interests: ['AI'],
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('"llmReplyGenerated":true')
    expect(text).toContain('我是AI简报助手')
    expect(text).toContain('记录一条想法')
    expect(text).not.toContain('讲个笑话')

    fetchMock.mockRestore()
  })

  it('prioritizes explicit record requests and returns personalized record reply', async () => {
    dbMocks.queryAll.mockImplementation(async (_db, sql: string) => {
      const text = String(sql)
      if (text.includes('FROM user_interests')) {
        return [{ interest_name: 'AI' }, { interest_name: '产品经理' }]
      }
      if (text.includes('FROM notes')) {
        return [{ content: '最近记录了 DeepSeek API 接入计划', created_at: '2026-04-29' }]
      }
      if (text.includes('FROM todos')) {
        return [{ content: '整理 LLM 接入方案', priority: 'high', deadline: '2026-04-30' }]
      }
      return []
    })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  text: '已保存想法：关注AI产品经理，并计划明天整理DeepSeek接入方案。',
                  suggestedActions: [
                    { label: '去日志页查看', action: '去日志页查看' },
                    { label: '改成待办', action: '改成待办', targetIntent: 'create_todo' },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    const app = buildApp()
    const response = await app.request(
      '/api/v1/chat/message',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: '我最近在关注 AI 产品经理岗位，同时想记录：今天看了 DeepSeek 的 API 文档，准备明天整理接入方案。',
          current_interests: ['AI', '产品经理'],
        }),
      }),
      mockEnv()
    )

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toContain('"intentType":"record_thought"')
    expect(text).toContain('"actionType":"record_thought"')
    expect(text).toContain('已保存想法')
    expect(text).toContain('"llmReplyGenerated":true')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const requestBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body || '{}'))
    const promptText = JSON.stringify(requestBody.messages)
    expect(promptText).toContain('关注领域：AI、产品经理')
    expect(promptText).toContain('最近记录了 DeepSeek API 接入计划')
    expect(promptText).toContain('整理 LLM 接入方案')

    const insertNoteCall = dbMocks.execute.mock.calls.find((args) =>
      String(args[1]).includes('INSERT INTO notes')
    )
    expect(insertNoteCall).toBeTruthy()

    fetchMock.mockRestore()
  })
})
