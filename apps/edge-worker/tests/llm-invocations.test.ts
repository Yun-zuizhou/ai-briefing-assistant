import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMocks = vi.hoisted(() => ({
  execute: vi.fn(),
  queryAll: vi.fn(),
}))

vi.mock('../src/utils/db', () => ({
  execute: dbMocks.execute,
  queryAll: dbMocks.queryAll,
}))

import {
  checkLlmSoftQuota,
  extractTokenUsage,
  loggedChatCompletion,
  recordLlmInvocation,
} from '../src/services/llm-invocations'
import type { ResolvedAiProviderConfig } from '../src/services/ai-provider'

const providerConfig: ResolvedAiProviderConfig = {
  provider: 'deepseek',
  label: 'DeepSeek V4 Flash',
  apiUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-v4-flash',
  transport: 'openai-compatible',
  apiKey: 'sk-test-deepseek-secret',
  source: 'user',
}

describe('llm invocations logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMocks.execute.mockResolvedValue({
      success: true,
      meta: { last_row_id: 1, changes: 1 },
    })
    dbMocks.queryAll.mockResolvedValue([{ total: 0 }])
  })

  it('extracts token usage across provider payload shapes', () => {
    expect(extractTokenUsage({
      usage: {
        prompt_tokens: 10,
        completion_tokens: 4,
        total_tokens: 14,
      },
    })).toEqual({
      promptTokens: 10,
      completionTokens: 4,
      totalTokens: 14,
    })

    expect(extractTokenUsage({
      usageMetadata: {
        promptTokenCount: 7,
        candidatesTokenCount: 3,
        totalTokenCount: 10,
      },
    })).toEqual({
      promptTokens: 7,
      completionTokens: 3,
      totalTokens: 10,
    })
  })

  it('records invocation metadata without raw prompt or api key', async () => {
    await recordLlmInvocation({
      db: {} as D1Database,
      userId: 1,
      feature: 'chat.reply',
      requestRef: 'chat_session:1001',
      providerConfig,
      status: 'success',
      durationMs: 120,
      inputChars: 88,
      outputChars: 32,
      promptTokens: 20,
      completionTokens: 8,
      totalTokens: 28,
      metadata: {
        actionType: 'record_thought',
        promptPreview: '这里不应该放真实 prompt',
      },
    })

    expect(dbMocks.execute).toHaveBeenCalledTimes(1)
    const [_, sql, params] = dbMocks.execute.mock.calls[0]
    expect(String(sql)).toContain('INSERT INTO llm_invocations')
    expect(params).toContain('chat.reply')
    expect(params).toContain('deepseek')
    expect(params).toContain('deepseek-v4-flash')
    expect(JSON.stringify(params)).not.toContain('sk-test-deepseek-secret')
    expect(JSON.stringify(params)).not.toContain('Authorization')
    expect(JSON.stringify(params)).not.toContain('这里不应该放真实 prompt')
  })

  it('logs successful chat completion with usage and output chars', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '已记录。' } }],
          usage: {
            prompt_tokens: 18,
            completion_tokens: 5,
            total_tokens: 23,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    const payload = await loggedChatCompletion({
      config: providerConfig,
      messages: [
        { role: 'system', content: '只返回JSON。' },
        { role: 'user', content: '帮我记录一个想法' },
      ],
      invocation: {
        db: {} as D1Database,
        userId: 1,
        feature: 'chat.reply',
        requestRef: 'chat_session:1001',
      },
    })

    expect(payload).toBeTruthy()
    expect(dbMocks.execute).toHaveBeenCalledTimes(1)
    const params = dbMocks.execute.mock.calls[0][2] as unknown[]
    expect(params).toContain('success')
    expect(params).toContain(18)
    expect(params).toContain(5)
    expect(params).toContain(23)
    expect(params).toContain('user')

    fetchMock.mockRestore()
  })

  it('logs provider errors with redacted message and rethrows', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'invalid sk-secret-should-not-leak' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(loggedChatCompletion({
      config: providerConfig,
      messages: [{ role: 'user', content: '你好' }],
      invocation: {
        db: {} as D1Database,
        userId: 1,
        feature: 'chat.intent_classify',
        requestRef: 'chat_session:1001',
      },
    })).rejects.toThrow('AI provider request failed: 401')

    expect(dbMocks.execute).toHaveBeenCalledTimes(1)
    const params = dbMocks.execute.mock.calls[0][2] as unknown[]
    expect(params).toContain('error')
    expect(params).toContain('provider_http_401')
    expect(JSON.stringify(params)).not.toContain('sk-secret-should-not-leak')

    fetchMock.mockRestore()
  })

  it('logs validated model output failures as invocation errors without double logging', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '' } }],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 0,
            total_tokens: 12,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(loggedChatCompletion({
      config: providerConfig,
      messages: [{ role: 'user', content: '生成年度报告JSON' }],
      invocation: {
        db: {} as D1Database,
        userId: 1,
        feature: 'annual_report_blocks_generation',
        requestRef: 'annual_report:2026',
      },
      validateOutput: ({ text }) => ({
        valid: text.trim().startsWith('{'),
        errorCode: 'invalid_model_output',
        errorMessage: 'Annual report LLM output was empty or not valid JSON',
      }),
    })).rejects.toThrow('Annual report LLM output was empty or not valid JSON')

    expect(dbMocks.execute).toHaveBeenCalledTimes(1)
    const params = dbMocks.execute.mock.calls[0][2] as unknown[]
    expect(params).toContain('annual_report_blocks_generation')
    expect(params).toContain('error')
    expect(params).toContain('invalid_model_output')
    expect(params).toContain(12)
    expect(params).toContain(0)
    expect(params).not.toContain('success')

    fetchMock.mockRestore()
  })

  it('allows LLM calls while soft quota has remaining capacity', async () => {
    dbMocks.queryAll.mockResolvedValueOnce([{ total: 3 }])

    const quota = await checkLlmSoftQuota({
      db: {} as D1Database,
      userId: 1,
      feature: 'today_briefing_generation',
      windowHours: 24,
      maxCalls: 8,
    })

    expect(quota).toMatchObject({
      allowed: true,
      used: 3,
      limit: 8,
      windowHours: 24,
      feature: 'today_briefing_generation',
    })
  })

  it('blocks LLM calls when soft quota is exhausted', async () => {
    dbMocks.queryAll.mockResolvedValueOnce([{ total: 8 }])

    const quota = await checkLlmSoftQuota({
      db: {} as D1Database,
      userId: 1,
      feature: 'today_briefing_generation',
      windowHours: 24,
      maxCalls: 8,
    })

    expect(quota.allowed).toBe(false)
    expect(quota.used).toBe(8)
  })

  it('does not block the product path when soft quota check fails', async () => {
    dbMocks.queryAll.mockRejectedValueOnce(new Error('table missing'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      const quota = await checkLlmSoftQuota({
        db: {} as D1Database,
        userId: 1,
        feature: 'profile_generation',
        windowHours: 24,
        maxCalls: 6,
      })

      expect(quota.allowed).toBe(true)
      expect(quota.used).toBe(0)
      expect(warnSpy).toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })
})
