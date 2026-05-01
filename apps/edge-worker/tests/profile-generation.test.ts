import { describe, expect, it } from 'vitest'
import {
  buildProfileEvidenceRefs,
  parseGeneratedProfileJSON,
} from '../src/services/profile-generation'

describe('profile generation service', () => {
  it('builds evidence refs from recent user facts', () => {
    const refs = buildProfileEvidenceRefs({
      notes: [
        {
          id: 1,
          user_id: 1,
          content: '最近在系统接入 LLM 对话和画像生成',
          tags: '["AI"]',
          created_at: '2026-04-30 10:00:00',
        },
      ],
      favorites: [
        {
          id: 2,
          user_id: 1,
          item_type: 'article',
          item_id: 12,
          item_title: 'AI 工具文章',
          created_at: '2026-04-30 10:10:00',
        },
      ],
      todos: [
        {
          id: 3,
          user_id: 1,
          content: '完成对话体验收口',
          status: 'completed',
          created_at: '2026-04-30 10:20:00',
        },
      ],
      historyItems: [],
    })

    expect(refs.map((item) => item.refType)).toEqual(['note', 'favorite', 'todo'])
    expect(refs[0].reason).toContain('画像')
  })

  it('parses profile JSON and restricts evidence refs to selected candidate indexes', () => {
    const fallbackRefs = buildProfileEvidenceRefs({
      notes: [
        {
          id: 1,
          user_id: 1,
          content: '关注 AI',
          tags: null,
          created_at: '2026-04-30 10:00:00',
        },
      ],
      favorites: [
        {
          id: 2,
          user_id: 1,
          item_type: 'article',
          item_id: 12,
          item_title: 'AI 工具文章',
          created_at: '2026-04-30 10:10:00',
        },
      ],
    })

    const parsed = parseGeneratedProfileJSON(
      JSON.stringify({
        personaSummary: '你正在把 AI 信息输入转化为记录和行动。',
        growthKeywords: ['AI', '记录', '行动'],
        keyInsights: ['关注主题集中在 AI。'],
        evidenceIndexes: [1],
      }),
      {
        personaSummary: '默认画像',
        growthKeywords: ['持续探索'],
        evidenceRefs: fallbackRefs,
      }
    )

    expect(parsed.personaSummary).toContain('AI 信息输入')
    expect(parsed.growthKeywords).toEqual(['AI', '记录', '行动'])
    expect(parsed.evidenceRefs).toHaveLength(1)
    expect(parsed.evidenceRefs[0].refType).toBe('favorite')
  })
})
