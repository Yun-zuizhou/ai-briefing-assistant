import { afterEach, describe, expect, it, vi } from 'vitest'

import { chatCompletion, type ResolvedAiProviderConfig } from '../src/services/ai-provider'

const providerConfig: ResolvedAiProviderConfig = {
  provider: 'deepseek',
  label: 'DeepSeek V4 Flash',
  apiUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-v4-flash',
  transport: 'openai-compatible',
  apiKey: 'sk-test',
  source: 'user',
}

describe('ai provider transport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends json_object response format for openai-compatible providers when requested', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await chatCompletion(
      providerConfig,
      [{ role: 'user', content: '只返回JSON' }],
      { responseFormat: 'json_object' }
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const request = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(request.body))
    expect(body.response_format).toEqual({ type: 'json_object' })
  })

  it('sends DeepSeek thinking mode only when explicitly requested', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await chatCompletion(
      providerConfig,
      [{ role: 'user', content: '只返回JSON' }],
      { responseFormat: 'json_object', thinking: 'disabled' }
    )

    const request = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(request.body))
    expect(body.thinking).toEqual({ type: 'disabled' })
  })

  it('omits response format by default for openai-compatible providers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'ok' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await chatCompletion(providerConfig, [{ role: 'user', content: '你好' }])

    const request = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(request.body))
    expect(body.response_format).toBeUndefined()
  })
})
