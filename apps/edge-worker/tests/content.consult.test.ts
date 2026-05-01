import { describe, expect, it, vi } from 'vitest'

import {
  buildConsultMessages,
  consultDigestResult,
  DigestConsultProviderError,
  parseConsultPayload,
} from '../src/services/content'

const digestResult = {
  id: 1,
  task_id: 11,
  user_id: 1,
  content_type: 'external_item',
  content_id: null,
  source_url: 'https://example.com/item',
  result_ref: 'summary:ai-daily:test:item',
  profile_id: 'ai-daily',
  provider_name: 'debug-fallback',
  model_name: 'rule-based',
  prompt_version: 'ai-daily-v1',
  source_payload_json: '{"title":"测试条目","source_name":"测试来源","url":"https://example.com/item"}',
  summary_title: '测试摘要',
  summary_text: '这是一条用于本地联调的摘要结果。',
  key_points_json: '["要点一","要点二"]',
  risk_flags_json: '["debug_fallback"]',
  consult_context_json: '{"source_name":"测试来源"}',
  citations_json: '[{"title":"原文","url":"https://example.com/item"}]',
  raw_response_json: '{}',
  created_at: '2026-04-21 10:00:00',
  updated_at: '2026-04-21 10:01:00',
}

describe('content consult service', () => {
  it('builds evidence-first prompt with user interests but without treating interests as evidence', () => {
    const messages = buildConsultMessages({
      digestResult,
      question: '这和我关注的 AI 产品经理有什么关系？',
      userInterests: ['AI', '产品经理'],
    })

    expect(messages).toHaveLength(2)
    expect(messages[0].content).toContain('只返回严格 JSON')
    expect(messages[0].content).toContain('不能把用户关注领域当 evidence')
    expect(messages[0].content).toContain('当前材料不足以判断')
    expect(messages[1].content).toContain('"user_interests": [')
    expect(messages[1].content).toContain('产品经理')
    expect(messages[1].content).not.toContain('API Key')
  })

  it('normalizes consult json output and adds uncertainty when evidence is missing', () => {
    const parsed = parseConsultPayload(JSON.stringify({
      answer: '当前材料不足以判断岗位影响，但可以先关注原文更新。',
      evidence: [],
      uncertainties: [],
      suggested_next_actions: ['继续阅读原文', '记录一个跟进问题'],
    }))

    expect(parsed.answer).toContain('当前材料不足以判断')
    expect(parsed.evidence[0]).toContain('没有给出可核验证据')
    expect(parsed.uncertainties[0]).toContain('缺少 evidence')
    expect(parsed.suggested_next_actions).toEqual(['继续阅读原文', '记录一个跟进问题'])
  })

  it('rejects malformed consult output', () => {
    expect(() => parseConsultPayload('not json')).toThrow(DigestConsultProviderError)
    expect(() => parseConsultPayload(JSON.stringify({ evidence: ['证据'] }))).toThrow(DigestConsultProviderError)
  })

  it('calls provider with user interests and validated evidence output', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  answer: '这条内容与 AI 产品经理相关，因为它展示了模型能力更新方向。',
                  evidence: ['摘要提到“模型更新”。', '引用来自原文。'],
                  uncertainties: ['当前材料没有给出具体岗位需求变化。'],
                  suggested_next_actions: ['继续阅读原文', '记录一个跟进问题'],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    const result = await consultDigestResult({
      bindings: {
        ENVIRONMENT: 'test',
        SUMMARY_PROVIDER_ENABLED: 'true',
        SUMMARY_PROVIDER_API_URL: 'https://api.deepseek.com/chat/completions',
        SUMMARY_PROVIDER_API_KEY: 'sk-test-provider',
        SUMMARY_PROVIDER_MODEL: 'deepseek-v4-flash',
        SUMMARY_PROVIDER_TRANSPORT: 'openai-compatible',
      },
      digestResult,
      question: '这和我关注的 AI 产品经理有什么关系？',
      userInterests: ['AI', '产品经理'],
    })

    expect(result.answer).toContain('AI 产品经理')
    expect(result.evidence).toHaveLength(2)
    expect(result.uncertainties[0]).toContain('岗位需求')
    const requestBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body || '{}'))
    expect(JSON.stringify(requestBody.messages)).toContain('产品经理')

    fetchMock.mockRestore()
  })

  it('returns debug fallback answer when enabled in non-production env', async () => {
    const result = await consultDigestResult({
      bindings: {
        ENVIRONMENT: 'development',
        SUMMARY_PROVIDER_DEBUG_FALLBACK: 'true',
      },
      digestResult,
      question: '这条内容为什么重要？',
    })

    expect(result.providerName).toBe('debug-fallback')
    expect(result.modelName).toBe('rule-based')
    expect(result.answer).toContain('本地调试咨询回答')
    expect(result.uncertainties[0]).toContain('debug fallback')
  })

  it('throws provider_not_configured when neither provider nor fallback is enabled', async () => {
    await expect(
      consultDigestResult({
        bindings: {
          ENVIRONMENT: 'development',
          SUMMARY_PROVIDER_ENABLED: 'false',
        },
        digestResult,
        question: '这条内容为什么重要？',
      })
    ).rejects.toMatchObject({
      code: 'provider_not_configured',
    } satisfies Partial<DigestConsultProviderError>)
  })

  it('throws provider_not_configured when user selected a platform but api key is missing', async () => {
    await expect(
      consultDigestResult({
        bindings: {
          ENVIRONMENT: 'production',
          SUMMARY_PROVIDER_ENABLED: 'false',
        },
        digestResult,
        question: '这条内容为什么重要？',
        userProvider: {
          provider: 'openai',
          apiKey: '',
        },
      })
    ).rejects.toMatchObject({
      code: 'provider_not_configured',
    } satisfies Partial<DigestConsultProviderError>)
  })
})
