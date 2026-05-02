import { describe, expect, it } from 'vitest';

import { isUnifiedContentDetailData } from './content';

function validDetailPayload(overrides: Record<string, unknown> = {}) {
  return {
    contentRef: 'article:9301',
    contentType: 'article',
    contentRole: 'original',
    id: 9301,
    title: 'AI 代码助手开始进入团队工作台',
    summary: 'AI 代码助手正从编辑器补全进入任务分派。',
    content: '正文内容',
    sourceName: '演示源',
    sourceUrl: 'https://example.com/article',
    author: 'Demo Desk',
    categoryLabels: ['AI应用'],
    tags: ['AI应用'],
    publishedAt: '2026-05-01 07:30:00',
    qualityScore: 9.4,
    detailState: 'formal',
    detailStateReason: null,
    missingFields: [],
    relatedItems: [
      {
        contentRef: 'article:9302',
        contentType: 'article',
        id: 9302,
        title: '延伸阅读',
        summary: '延伸阅读摘要',
        sourceName: '演示源',
        sourceUrl: 'https://example.com/related',
        relationReason: '同分类延伸阅读',
      },
    ],
    ...overrides,
  };
}

describe('isUnifiedContentDetailData', () => {
  it('accepts related items without contentRole', () => {
    expect(isUnifiedContentDetailData(validDetailPayload())).toBe(true);
  });

  it('requires contentRole on the detail payload itself', () => {
    const payload = validDetailPayload();
    delete (payload as { contentRole?: unknown }).contentRole;

    expect(isUnifiedContentDetailData(payload)).toBe(false);
  });
});
