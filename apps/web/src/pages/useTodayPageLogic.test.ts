import { describe, expect, it } from 'vitest'
import type { TodayPageData } from '../types/page-data'
import {
  buildReadableSummary,
  formatDateLabel,
  getActionTypeLabel,
  resolveLeadArticleContentType,
  TODAY_INFORMATION_BOUNDARIES,
} from './useTodayPageLogic'

function makeMinimalPageData(overrides: Partial<TodayPageData> = {}): TodayPageData {
  return {
    dateLabel: '2026-05-01',
    issueNumber: 1,
    pageTitle: '简报',
    pageSubtitle: '测试副标题',
    summary: {
      summaryTitle: '今日摘要',
      summaryText: '今天为你整理了重点报道。',
    },
    recommendedForYou: [],
    worthKnowing: [],
    worthActing: [],
    quickNoteEntry: {
      placeholderText: '记下一句话',
    },
    ...overrides,
  }
}

// ── buildReadableSummary ──────────────────────────────────────────

describe('buildReadableSummary', () => {
  it('returns fallback when pageData is null', () => {
    expect(buildReadableSummary(null)).toBe('正在为你整理今天的简报摘要。')
  })

  it('strips transition-state disclaimers from summaryText', () => {
    const pd = makeMinimalPageData({
      summary: {
        summaryTitle: '标题',
        summaryText: '当前 Today 已进入真实聚合阶段，但部分排序和内容补齐仍在继续收口。今天重点如下。',
      },
    })
    expect(buildReadableSummary(pd)).toBe('今天重点如下。')
  })

  it('replaces 真实热点 with 重点报道', () => {
    const pd = makeMinimalPageData({
      summary: {
        summaryTitle: '标题',
        summaryText: '以下是今天的真实热点汇总。',
      },
    })
    expect(buildReadableSummary(pd)).toBe('以下是今天的重点报道汇总。')
  })

  it('replaces 值得行动的机会 with 补充线索', () => {
    const pd = makeMinimalPageData({
      summary: {
        summaryTitle: '标题',
        summaryText: '三个值得行动的机会。',
      },
    })
    expect(buildReadableSummary(pd)).toBe('三个补充线索。')
  })

  it('rewrites 今天先看 N 条内容 template into readable form', () => {
    const pd = makeMinimalPageData({
      summary: {
        summaryTitle: '标题',
        summaryText: '今天先看 5 条内容，再处理 3 个可行动机会。',
      },
    })
    expect(buildReadableSummary(pd)).toBe(
      '今天为你整理了 5 条重点报道。你可以先看摘要，再打开具体报道核对原文。',
    )
  })

  it('falls back to worthKnowing count when summaryText is empty after stripping', () => {
    const pd = makeMinimalPageData({
      summary: {
        summaryTitle: '标题',
        summaryText: '当前 Today 已进入真实聚合阶段，但部分排序和内容补齐仍在继续收口。',
      },
      worthKnowing: [
        {
          contentRef: 'article:1',
          id: 1,
          contentType: 'article',
          title: 'Test',
          summary: 'Summary',
          sourceName: 'Source',
          relevanceReason: 'relevant',
        },
      ],
      recommendedForYou: [],
    })
    const result = buildReadableSummary(pd)
    expect(result).toContain('1 条重点报道')
  })

  it('returns empty-state message when no summaryText and no worthKnowing', () => {
    const pd = makeMinimalPageData({
      summary: { summaryTitle: '标题', summaryText: '' },
      worthKnowing: [],
      recommendedForYou: [],
    })
    expect(buildReadableSummary(pd)).toBe(
      '今天暂时没有足够新内容形成简报摘要。你可以更新关注领域，或稍后等待下一次同步。',
    )
  })
})

// ── getActionTypeLabel ────────────────────────────────────────────

describe('getActionTypeLabel', () => {
  it.each([
    ['apply', '可申请'],
    ['follow', '可跟进'],
    ['submit', '可提交'],
    ['read_later', '稍后读'],
    ['create_todo', '可转待办'],
  ] as const)('maps %s → %s', (type, label) => {
    expect(getActionTypeLabel(type)).toBe(label)
  })

  it('returns 可行动 for unknown type', () => {
    const unknownType = 'unknown' as unknown as TodayPageData['worthActing'][number]['actionType']
    expect(getActionTypeLabel(unknownType)).toBe('可行动')
  })
})

// ── formatDateLabel ───────────────────────────────────────────────

describe('formatDateLabel', () => {
  it('extracts date part from ISO string', () => {
    expect(formatDateLabel('2026-05-01T10:30:00Z')).toBe('2026-05-01')
  })

  it('returns null for empty string', () => {
    expect(formatDateLabel('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(formatDateLabel(undefined)).toBeNull()
  })
})

// ── resolveLeadArticleContentType ─────────────────────────────────

describe('resolveLeadArticleContentType', () => {
  it.each([
    ['hot_topic:abc', 'hot_topic'],
    ['article:123', 'article'],
    ['opportunity:456', 'opportunity'],
  ] as const)('resolves %s → %s', (ref, expected) => {
    expect(resolveLeadArticleContentType(ref)).toBe(expected)
  })

  it('returns null when id is missing after colon', () => {
    expect(resolveLeadArticleContentType('hot_topic:')).toBeNull()
  })

  it('returns null for unknown prefix', () => {
    expect(resolveLeadArticleContentType('unknown:123')).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(resolveLeadArticleContentType(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(resolveLeadArticleContentType('')).toBeNull()
  })
})

// ── TODAY_INFORMATION_BOUNDARIES ───────────────────────────────────

describe('TODAY_INFORMATION_BOUNDARIES', () => {
  it('keeps technical fields out of the reading flow', () => {
    const keepOut = TODAY_INFORMATION_BOUNDARIES.keepOutOfReadingFlow
    expect(keepOut).toContain('aiBriefing.provider')
    expect(keepOut).toContain('aiBriefing.model')
    expect(keepOut).toContain('recommendationReason')
    expect(keepOut).toContain('processingNote')
  })

  it('includes overview and headline in main flow', () => {
    expect(TODAY_INFORMATION_BOUNDARIES.showInMainFlow).toContain('overview')
    expect(TODAY_INFORMATION_BOUNDARIES.showInMainFlow).toContain('headline')
  })

  it('includes knowledge items in auxiliary flow', () => {
    expect(TODAY_INFORMATION_BOUNDARIES.showInAuxiliaryFlow).toContain('knowledgeItems')
  })
})
