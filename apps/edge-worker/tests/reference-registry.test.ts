import { describe, expect, it } from 'vitest'
import {
  buildContentRef,
  CONTENT_REF_TYPES,
  buildEvidenceRef,
  InvalidReferenceError,
  normalizeHistoryRef,
  normalizeNoteSourceRef,
  normalizeSummaryContentRef,
  normalizeTodoRelatedRef,
  parseContentRef,
  parseFavoriteContentRef,
} from '../src/services/reference-registry'

describe('reference registry', () => {
  it('keeps content_ref types aligned with content detail resources', () => {
    expect(CONTENT_REF_TYPES).toEqual(['article', 'hot_topic', 'opportunity'])
  })

  it('builds and parses canonical content_ref values', () => {
    expect(buildContentRef('article', 12)).toBe('article:12')
    expect(buildContentRef('note', 12)).toBeNull()
    expect(parseContentRef('hot_topic:8')).toEqual({ refType: 'hot_topic', refId: 8 })
    expect(parseFavoriteContentRef('opportunity:3')).toEqual(['opportunity', 3])
  })

  it('rejects malformed or unsupported content_ref values', () => {
    expect(() => parseContentRef('bad-format')).toThrow(InvalidReferenceError)
    expect(() => parseContentRef('note:1')).toThrow('content_ref 类型无效')
    expect(() => parseContentRef('article:0')).toThrow('content_ref 中的 id 无效')
  })

  it('normalizes field-family references by their own enum sets', () => {
    expect(normalizeNoteSourceRef(undefined, undefined)).toEqual({
      sourceType: 'manual',
      sourceId: null,
    })
    expect(normalizeTodoRelatedRef('chat', null)).toEqual({
      relatedType: 'chat',
      relatedId: null,
    })
    expect(normalizeHistoryRef('briefing', 5)).toEqual({
      refType: 'briefing',
      refId: 5,
    })
    expect(normalizeSummaryContentRef('external_item', null)).toEqual({
      refType: 'external_item',
      refId: null,
    })
  })

  it('rejects invalid typed references before they reach D1', () => {
    expect(() => normalizeNoteSourceRef('unknown', null)).toThrow('source_type/source_id 类型无效')
    expect(() => normalizeTodoRelatedRef('article', null)).toThrow('related_type/related_id 缺少有效 id')
    expect(() => normalizeHistoryRef('chat', 1)).toThrow('ref_type/ref_id 类型无效')
  })

  it('builds evidence refs for LLM-generated profile and report claims', () => {
    expect(
      buildEvidenceRef({
        refType: 'summary_result',
        resultRef: 'summary:user:1:2026-04-30',
        title: '本周摘要',
        reason: '支撑简报结论',
      })
    ).toEqual({
      refType: 'summary_result',
      refId: null,
      resultRef: 'summary:user:1:2026-04-30',
      sourceUrl: null,
      title: '本周摘要',
      snippet: null,
      reason: '支撑简报结论',
    })

    expect(() => buildEvidenceRef({ refType: 'summary_result' })).toThrow(
      'evidence_ref 至少需要提供'
    )
  })
})
