import { describe, expect, it } from 'vitest'

import {
  buildBriefingPayload,
  normalizeLeadItem,
  resolveLeadItemType,
} from '../src/services/dashboard/today-briefing-payload'
import type { TodayAiBriefingBlock } from '../src/types/page-data'

function buildAiBriefing(contentRef: string): TodayAiBriefingBlock {
  return {
    version: 'test',
    status: 'success',
    leadSummary: '今天重点看 AI 应用进入团队工作流。',
    topicClusters: [
      {
        title: 'AI 应用进入团队工作流',
        summary: 'AI 代码助手开始从个人提效进入协作流程。',
        sourceRefs: [
          {
            contentRef,
            title: 'AI 代码助手开始进入团队工作台',
            sourceLabel: '技术产品周刊',
          },
        ],
      },
    ],
    recommendationReasons: [],
    uncertainties: [],
  }
}

describe('today briefing payload contract', () => {
  it('derives headline item type from content refs when generating payloads', () => {
    const payload = buildBriefingPayload({
      existingPayload: null,
      aiBriefing: buildAiBriefing('hot_topic:9101'),
      leadItem: null,
      extensionSlots: [],
    })

    expect(payload.leadItem).toMatchObject({
      contentRef: 'hot_topic:9101',
      itemType: 'hot_topic',
      primaryActionLabel: '查看报道',
    })
  })

  it('normalizes stored headline payloads when itemType conflicts with contentRef', () => {
    const leadItem = normalizeLeadItem({
      contentRef: 'article:42',
      itemType: 'briefing',
      title: '原文报道',
      summary: '这条头版实际指向原文报道。',
      primaryActionLabel: '查看报道',
    })

    expect(leadItem).toMatchObject({
      contentRef: 'article:42',
      itemType: 'article',
    })
  })

  it('keeps briefing type only when there is no content detail ref', () => {
    expect(resolveLeadItemType(undefined, 'briefing')).toBe('briefing')
    expect(resolveLeadItemType('briefing:20260501', 'briefing')).toBe('briefing')
  })
})
