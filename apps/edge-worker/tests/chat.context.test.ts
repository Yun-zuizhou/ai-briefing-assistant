import { describe, expect, it } from 'vitest'

import { formatChatReplyContext } from '../src/services/chat/context'

describe('chat reply context', () => {
  it('formats lightweight personal context for reply prompts', () => {
    const formatted = formatChatReplyContext({
      interests: ['AI', '产品经理'],
      recentNotes: [
        { content: '今天看了 DeepSeek API 文档，准备整理接入方案。', createdAt: '2026-04-29' },
      ],
      activeTodos: [
        { content: '明天整理 LLM 接入方案', priority: 'high', deadline: '2026-04-30' },
      ],
    })

    expect(formatted).toContain('关注领域：AI、产品经理')
    expect(formatted).toContain('最近记录：')
    expect(formatted).toContain('DeepSeek API 文档')
    expect(formatted).toContain('当前待办：')
    expect(formatted).toContain('优先级:high')
  })

  it('redacts sensitive values before entering prompts', () => {
    const formatted = formatChatReplyContext({
      interests: ['AI'],
      recentNotes: [
        { content: 'api key: sk-abc1234567890 secret=hello token: value', createdAt: null },
      ],
      activeTodos: [],
    })

    expect(formatted).toContain('[redacted]')
    expect(formatted).not.toContain('sk-abc1234567890')
    expect(formatted).not.toContain('secret=hello')
  })
})
