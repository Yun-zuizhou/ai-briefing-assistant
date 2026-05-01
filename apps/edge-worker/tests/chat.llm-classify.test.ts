import { describe, expect, it } from 'vitest'

import { buildClassifyPrompt, parseClassifyJSON } from '../src/services/chat/llm-classify'

describe('chat llm classify service', () => {
  it('builds a strict json classification prompt without secrets', () => {
    const messages = buildClassifyPrompt({
      input: '明天下午提醒我整理AI资料',
      interests: ['AI', '远程工作'],
      sourceContext: 'today',
      ruleResult: {
        type: 'create_todo',
        confidence: 0.85,
        entities: { content: '明天下午提醒我整理AI资料' },
        matchedBy: 'keyword',
      },
    })

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('只返回严格JSON')
    expect(messages[0].content).toContain('不要执行动作')
    expect(messages[1].content).toContain('用户当前已关注：AI、远程工作')
    expect(messages[1].content).toContain('规则初判：create_todo / 0.85 / keyword')
    expect(messages[1].content).not.toContain('API Key')
  })

  it('parses and normalizes model json output', () => {
    const parsed = parseClassifyJSON(`\`\`\`json
{
  "type": "create_todo",
  "confidence": 1.8,
  "entities": {"content": "整理AI资料", "deadline": "明天下午"},
  "candidateIntents": ["create_todo", "chat_only", "create_todo"],
  "replyHint": "好，我按待办来处理。",
  "suggestedActions": [{"label": "查看待办", "action": "查看待办", "targetIntent": "query_stats"}]
}
\`\`\``)

    expect(parsed).toMatchObject({
      type: 'create_todo',
      confidence: 1,
      entities: { content: '整理AI资料', deadline: '明天下午' },
      matchedBy: 'llm',
      candidateIntents: ['create_todo', 'chat_only'],
      replyHint: '好，我按待办来处理。',
    })
    expect(parsed?.suggestedActions).toEqual([
      { label: '查看待办', action: '查看待办', targetIntent: 'query_stats' },
    ])
  })

  it('falls back unsafe or malformed classification to chat_only/null', () => {
    expect(parseClassifyJSON('not json')).toBeNull()

    const parsed = parseClassifyJSON(JSON.stringify({
      type: 'delete_database',
      confidence: -1,
      entities: [],
      candidateIntents: ['delete_database'],
      suggestedActions: [{ label: '危险动作', action: 'rm -rf' }],
    }))

    expect(parsed).toMatchObject({
      type: 'chat_only',
      confidence: 0,
      entities: {},
      candidateIntents: ['chat_only'],
      replyHint: '嗯嗯，我在听。',
    })
  })
})
