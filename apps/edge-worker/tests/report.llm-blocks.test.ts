import { describe, expect, it } from 'vitest'
import {
  buildAnnualReportBlocksPrompt,
  buildReportBlocksPrompt,
  parseAnnualReportBlocksJSON,
  parseReportBlocksJSON,
} from '../src/services/reports/llm-blocks'
import type { EvidenceRef } from '../src/services/reference-registry'

const evidenceRefs: EvidenceRef[] = [
  {
    refType: 'note',
    refId: 1,
    resultRef: null,
    sourceUrl: null,
    title: 'AI 接入记录',
    snippet: '今天整理 DeepSeek 接入方案。',
    reason: '用户记录支撑报告判断',
  },
  {
    refType: 'favorite',
    refId: 2,
    resultRef: null,
    sourceUrl: null,
    title: 'Prompt Engineering 完全指南',
    snippet: 'learning_resource:1',
    reason: '收藏内容支撑关注主题判断',
  },
]

const payload = {
  reportType: 'weekly',
  dataQuality: {
    confidence: 'medium',
    insufficientData: false,
  },
  evidenceRefs,
  overview: {
    period: '本周',
    viewed: 10,
    recorded: 3,
    collected: 2,
    completed: 1,
  },
  topicTrends: [
    {
      title: 'AI',
      hotSpot: {
        summary: 'AI 主题持续出现。',
      },
    },
  ],
  growth: {
    trajectory: {
      title: '从信息浏览走向记录与行动',
      description: '本周你留下了记录，并完成了待办。',
    },
    suggestions: ['筛选本期收藏。', '整理一条行动计划。'],
  },
}

describe('report LLM blocks', () => {
  it('builds a strict JSON prompt with evidence candidates', () => {
    const messages = buildReportBlocksPrompt({
      reportType: 'weekly',
      payload,
      evidenceRefs,
    })

    expect(messages).toHaveLength(2)
    expect(messages[0].content).toContain('只返回严格JSON')
    expect(messages[1].content).toContain('evidenceCandidates')
    expect(messages[1].content).toContain('AI 接入记录')
  })

  it('parses model JSON and only selects valid evidence indexes', () => {
    const result = parseReportBlocksJSON(
      JSON.stringify({
        trendExplanation: '本期关注集中在 AI 与 Prompt 实践。',
        periodSummary: '你正在把信息浏览转化为记录和行动。',
        nextActions: ['把收藏筛成一个待办', '继续记录接入过程'],
        dataNote: '证据来自记录和收藏。',
        evidenceIndexes: [1, 99, 1, 0],
      }),
      {
        payload,
        evidenceRefs,
      },
    )

    expect(result.trendExplanation).toContain('AI')
    expect(result.nextActions).toHaveLength(2)
    expect(result.evidenceRefs.map((item) => item.refId)).toEqual([2, 1])
  })

  it('falls back to rule report text when JSON is invalid', () => {
    const result = parseReportBlocksJSON('not json', {
      payload,
      evidenceRefs,
    })

    expect(result.trendExplanation).toContain('本周你留下了记录')
    expect(result.periodSummary).toBe('从信息浏览走向记录与行动')
    expect(result.evidenceRefs).toHaveLength(2)
  })

  it('parses annual report blocks with bounded evidence indexes', () => {
    const annualPayload = {
      year: 2026,
      dataQuality: {
        confidence: 'medium',
        insufficientData: false,
      },
      stats: {
        topicsViewed: 10,
        opinionsPosted: 3,
        plansCompleted: 1,
        daysActive: 8,
      },
      interests: ['AI', '写作'],
      keywords: ['AI', '行动'],
      thinkingSection: '年度思考基于记录和收藏自动聚合生成。',
      actionSection: '年度完成待办 1 项。',
      closing: '继续补强可解释性。',
    }

    const messages = buildAnnualReportBlocksPrompt({
      payload: annualPayload,
      evidenceRefs,
    })
    expect(messages[0].content).toContain('年度报告文本块')

    const result = parseAnnualReportBlocksJSON(
      JSON.stringify({
        thinkingSummary: '这一年思考集中在 AI 和写作。',
        actionSummary: '你通过记录和待办推动行动。',
        yearEndInsight: '年度样本显示持续记录最关键。',
        nextYearActions: ['拆一条季度计划'],
        dataNote: '证据来自记录与收藏。',
        evidenceIndexes: [0, 99],
      }),
      {
        payload: annualPayload,
        evidenceRefs,
      },
    )

    expect(result.thinkingSummary).toContain('AI')
    expect(result.nextYearActions).toEqual(['拆一条季度计划'])
    expect(result.evidenceRefs.map((item) => item.refId)).toEqual([1])
  })
})
