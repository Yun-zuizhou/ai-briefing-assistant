import { describe, expect, it } from 'vitest'

import { consultDigestResult, DigestConsultProviderError } from '../src/services/content'

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
