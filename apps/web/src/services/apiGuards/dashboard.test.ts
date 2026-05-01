import { describe, expect, it } from 'vitest'
import { isTodayPageData } from './dashboard'

function omitKey<T extends Record<string, unknown>>(obj: T, key: string): Record<string, unknown> {
  const result = { ...obj }
  delete result[key]
  return result
}

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dateLabel: '2026-05-01',
    issueNumber: 42,
    pageTitle: '今日简报',
    pageSubtitle: '你关心的领域发生了什么',
    summary: {
      summaryTitle: '摘要标题',
      summaryText: '今天要点如下。',
    },
    recommendedForYou: [
      {
        interestName: 'AI',
        recommendationReason: '近期热点',
        topItems: [
          {
            contentRef: 'article:1',
            id: 1,
            contentType: 'article',
            title: 'AI 新突破',
          },
        ],
      },
    ],
    worthKnowing: [
      {
        contentRef: 'hot_topic:1',
        id: 1,
        contentType: 'hot_topic',
        title: '热点标题',
        summary: '摘要内容',
        sourceName: '来源',
        relevanceReason: '相关',
      },
    ],
    worthActing: [
      {
        contentRef: 'opportunity:1',
        id: 1,
        actionType: 'follow',
        title: '机会标题',
        summary: '摘要',
        whyRelevant: '相关原因',
        nextActionLabel: '去跟进',
      },
    ],
    quickNoteEntry: {
      placeholderText: '记下想法',
    },
    ...overrides,
  }
}

// ── Happy path ────────────────────────────────────────────────────

describe('isTodayPageData', () => {
  it('accepts a fully valid payload', () => {
    expect(isTodayPageData(validPayload())).toBe(true)
  })

  it('accepts payload with optional fields set', () => {
    const payload = validPayload({
      leadItem: {
        contentRef: 'hot_topic:1',
        itemType: 'hot_topic',
        title: '头版',
        summary: '摘要',
        primaryActionLabel: '查看',
        sourceLabel: '来源',
      },
      dailyAngle: '今日视角',
      freshness: {
        sourceCount: 3,
        latestPublishedAt: '2026-05-01T08:00:00Z',
        generatedAt: '2026-05-01T09:00:00Z',
      },
      extensionSlots: [
        {
          slotType: 'ask',
          title: '追问',
          description: '继续追问',
          actionLabel: '去对话',
        },
      ],
      aiBriefing: {
        version: '1',
        status: 'success',
        leadSummary: 'LLM 摘要',
        topicClusters: [
          {
            title: '聚类',
            summary: '摘要',
            sourceRefs: [{ contentRef: 'article:1', title: '来源' }],
          },
        ],
        recommendationReasons: ['高效'],
        uncertainties: ['不确定'],
      },
    })
    expect(isTodayPageData(payload)).toBe(true)
  })

  it('accepts payload with null leadItem', () => {
    expect(isTodayPageData(validPayload({ leadItem: null }))).toBe(true)
  })

  it('accepts payload without optional fields', () => {
    expect(isTodayPageData(validPayload())).toBe(true)
  })

  // ── Top-level required fields ───────────────────────────────────

  it('rejects non-object', () => {
    expect(isTodayPageData(null)).toBe(false)
    expect(isTodayPageData('string')).toBe(false)
    expect(isTodayPageData([])).toBe(false)
  })

  it('rejects missing dateLabel', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'dateLabel'))).toBe(false)
  })

  it('rejects non-string dateLabel', () => {
    expect(isTodayPageData(validPayload({ dateLabel: 123 }))).toBe(false)
  })

  it('rejects missing issueNumber', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'issueNumber'))).toBe(false)
  })

  it('rejects non-number issueNumber', () => {
    expect(isTodayPageData(validPayload({ issueNumber: '42' }))).toBe(false)
  })

  it('rejects missing pageTitle', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'pageTitle'))).toBe(false)
  })

  it('rejects missing pageSubtitle', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'pageSubtitle'))).toBe(false)
  })

  // ── summary ─────────────────────────────────────────────────────

  it('rejects missing summary', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'summary'))).toBe(false)
  })

  it('rejects summary missing summaryTitle', () => {
    expect(isTodayPageData(validPayload({ summary: { summaryText: 'text' } }))).toBe(false)
  })

  it('rejects summary missing summaryText', () => {
    expect(isTodayPageData(validPayload({ summary: { summaryTitle: 'title' } }))).toBe(false)
  })

  // ── leadItem ────────────────────────────────────────────────────

  it('rejects leadItem with invalid itemType', () => {
    expect(
      isTodayPageData(
        validPayload({
          leadItem: {
            contentRef: 'unknown:1',
            itemType: 'unknown',
            title: '标题',
            summary: '摘要',
            primaryActionLabel: '操作',
          },
        }),
      ),
    ).toBe(false)
  })

  it('rejects leadItem missing primaryActionLabel', () => {
    expect(
      isTodayPageData(
        validPayload({
          leadItem: {
            itemType: 'article',
            title: '标题',
            summary: '摘要',
          },
        }),
      ),
    ).toBe(false)
  })

  // ── extensionSlots ──────────────────────────────────────────────

  it('rejects extensionSlots with invalid slotType', () => {
    expect(
      isTodayPageData(
        validPayload({
          extensionSlots: [
            {
              slotType: 'unknown',
              title: '标题',
              description: '描述',
              actionLabel: '操作',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('rejects extensionSlots item missing required string fields', () => {
    expect(
      isTodayPageData(
        validPayload({
          extensionSlots: [
            {
              slotType: 'ask',
              title: '标题',
              actionLabel: '操作',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  // ── recommendedForYou ───────────────────────────────────────────

  it('rejects recommendedForYou that is not an array', () => {
    expect(isTodayPageData(validPayload({ recommendedForYou: 'not-array' }))).toBe(false)
  })

  it('rejects recommendedForYou item missing interestName', () => {
    expect(
      isTodayPageData(
        validPayload({
          recommendedForYou: [
            {
              recommendationReason: 'reason',
              topItems: [],
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('rejects topItem with invalid contentType', () => {
    expect(
      isTodayPageData(
        validPayload({
          recommendedForYou: [
            {
              interestName: 'AI',
              recommendationReason: 'reason',
              topItems: [
                {
                  contentRef: 'x:1',
                  id: 1,
                  contentType: 'invalid',
                  title: '标题',
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('rejects topItem missing contentRef', () => {
    expect(
      isTodayPageData(
        validPayload({
          recommendedForYou: [
            {
              interestName: 'AI',
              recommendationReason: 'reason',
              topItems: [
                {
                  id: 1,
                  contentType: 'article',
                  title: '标题',
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  // ── worthKnowing ────────────────────────────────────────────────

  it('rejects worthKnowing item with non-allowed contentType', () => {
    expect(
      isTodayPageData(
        validPayload({
          worthKnowing: [
            {
              contentRef: 'x:1',
              id: 1,
              contentType: 'opportunity',
              title: '标题',
              summary: '摘要',
              sourceName: '来源',
              relevanceReason: '相关',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('rejects worthKnowing missing sourceName', () => {
    expect(
      isTodayPageData(
        validPayload({
          worthKnowing: [
            {
              contentRef: 'article:1',
              id: 1,
              contentType: 'article',
              title: '标题',
              summary: '摘要',
              relevanceReason: '相关',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  // ── worthActing ─────────────────────────────────────────────────

  it('rejects worthActing item with invalid actionType', () => {
    expect(
      isTodayPageData(
        validPayload({
          worthActing: [
            {
              contentRef: 'x:1',
              id: 1,
              actionType: 'invalid',
              title: '标题',
              summary: '摘要',
              whyRelevant: '原因',
              nextActionLabel: '操作',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  it('rejects worthActing missing whyRelevant', () => {
    expect(
      isTodayPageData(
        validPayload({
          worthActing: [
            {
              contentRef: 'x:1',
              id: 1,
              actionType: 'follow',
              title: '标题',
              summary: '摘要',
              nextActionLabel: '操作',
            },
          ],
        }),
      ),
    ).toBe(false)
  })

  // ── quickNoteEntry ──────────────────────────────────────────────

  it('rejects missing quickNoteEntry', () => {
    expect(isTodayPageData(omitKey(validPayload(), 'quickNoteEntry'))).toBe(false)
  })

  it('rejects quickNoteEntry missing placeholderText', () => {
    expect(isTodayPageData(validPayload({ quickNoteEntry: {} }))).toBe(false)
  })
})
