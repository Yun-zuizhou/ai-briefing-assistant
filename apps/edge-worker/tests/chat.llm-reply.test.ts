import { describe, expect, it } from 'vitest'

import { buildReplyPrompt, parseReplyJSON } from '../src/services/chat/llm-reply'
import type { ChatActionResponse } from '../src/services/chat/types'

function buildActionResponse(overrides: Partial<ChatActionResponse> = {}): ChatActionResponse {
  return {
    success: true,
    actionType: 'create_todo',
    candidateIntents: ['create_todo'],
    requiresConfirmation: false,
    affectedEntity: { type: 'todo', id: 101 },
    confirmedType: 'create_todo',
    successMessage: '已创建待办',
    resultSummary: '待办：整理AI资料',
    nextPageLabel: '查看待办',
    deepLink: '/todos',
    ...overrides,
  }
}

describe('chat llm reply service', () => {
  it('builds a strict json reply prompt from executed action results without secrets', () => {
    const messages = buildReplyPrompt({
      input: '明天提醒我整理AI资料',
      response: buildActionResponse(),
      fallbackText: '已记成待办。\n待办：整理AI资料',
      fallbackSuggestedActions: [{ label: '查看待办', action: '查看待办' }],
      personalContext: {
        interests: ['AI', '产品经理'],
        recentNotes: [{ content: '最近记录了 DeepSeek 接入方案', createdAt: '2026-04-29' }],
        activeTodos: [{ content: '整理LLM接入计划', priority: 'high', deadline: '2026-04-30' }],
      },
      context: {
        confidence: 0.95,
        matchedBy: 'keyword',
        sourceContext: 'chat',
      },
    })

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('只返回严格JSON')
    expect(messages[0].content).toContain('禁止承诺任何未发生')
    expect(messages[0].content).toContain('不是通用聊天助手')
    expect(messages[0].content).toContain('个人上下文')
    expect(messages[0].content).toContain('禁止建议讲笑话')
    expect(messages[1].content).toContain('"success": true')
    expect(messages[1].content).toContain('"result_summary": "待办：整理AI资料"')
    expect(messages[1].content).toContain('关注领域：AI、产品经理')
    expect(messages[1].content).toContain('最近记录了 DeepSeek 接入方案')
    expect(messages[1].content).not.toContain('API Key')
  })

  it('parses and normalizes reply json output', () => {
    const parsed = parseReplyJSON(`\`\`\`json
{
  "text": "已记成待办：整理AI资料，明天处理时可以从待办页继续看。",
  "suggestedActions": [{"label": "查看待办", "action": "打开待办页", "targetIntent": "query_stats"}]
}
\`\`\``)

    expect(parsed).toEqual({
      text: '已记成待办：整理AI资料，明天处理时可以从待办页继续看。',
      suggestedActions: [
        { label: '查看待办', action: '打开待办页', targetIntent: 'query_stats' },
      ],
    })
  })

  it('falls back to null or fallback actions for unsafe reply payloads', () => {
    expect(parseReplyJSON('not json')).toBeNull()
    expect(parseReplyJSON(JSON.stringify({ text: '' }))).toBeNull()

    const parsed = parseReplyJSON(
      JSON.stringify({
        text: '已处理。',
        suggestedActions: [{ label: '危险动作', action: 'rm -rf', targetIntent: 'delete_database' }],
      }),
      [{ label: '查看待办', action: '查看待办' }]
    )

    expect(parsed).toEqual({
      text: '已处理。',
      suggestedActions: [{ label: '查看待办', action: '查看待办' }],
    })
  })

  it('drops off-domain quick actions from model output', () => {
    const parsed = parseReplyJSON(
      JSON.stringify({
        text: '你好，我可以帮你记录和整理。',
        suggestedActions: [
          { label: '讲讲笑话', action: '讲个笑话', targetIntent: 'chat_only' },
          { label: '推荐歌曲', action: '推荐一首歌', targetIntent: 'chat_only' },
          { label: '记录想法', action: '记录一条想法', targetIntent: 'record_thought' },
        ],
      }),
      [{ label: '查看日志', action: '查看日志' }]
    )

    expect(parsed).toEqual({
      text: '你好，我可以帮你记录和整理。',
      suggestedActions: [{ label: '记录想法', action: '记录一条想法', targetIntent: 'record_thought' }],
    })
  })
})
