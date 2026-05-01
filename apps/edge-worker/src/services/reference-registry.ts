export const CONTENT_REF_TYPES = ['article', 'hot_topic', 'opportunity'] as const
export const FAVORITE_ITEM_TYPES = CONTENT_REF_TYPES
export const NOTE_SOURCE_TYPES = [
  'manual',
  'chat',
  'article',
  'hot_topic',
  'opportunity',
  'summary_result',
  'briefing',
] as const
export const TODO_RELATED_TYPES = [
  'chat',
  'article',
  'hot_topic',
  'opportunity',
  'note',
  'summary_result',
  'briefing',
] as const
export const HISTORY_REF_TYPES = [
  'article',
  'hot_topic',
  'opportunity',
  'note',
  'todo',
  'briefing',
  'summary_result',
  'favorite',
  'opportunity_follow',
  'chat_session',
  'chat_message',
] as const
export const SUMMARY_CONTENT_TYPES = ['article', 'hot_topic', 'opportunity', 'external_item'] as const
export const EVIDENCE_REF_TYPES = [
  ...HISTORY_REF_TYPES,
  'history_entry',
  'manual',
  'chat',
  'external_item',
] as const

export type ContentRefType = (typeof CONTENT_REF_TYPES)[number]
export type NoteSourceType = (typeof NOTE_SOURCE_TYPES)[number]
export type TodoRelatedType = (typeof TODO_RELATED_TYPES)[number]
export type HistoryRefType = (typeof HISTORY_REF_TYPES)[number]
export type SummaryContentType = (typeof SUMMARY_CONTENT_TYPES)[number]
export type EvidenceRefType = (typeof EVIDENCE_REF_TYPES)[number]

export type EntityRef<TType extends string = string> = {
  refType: TType
  refId: number
}

export type NullableEntityRef<TType extends string = string> = {
  refType: TType | null
  refId: number | null
}

export type EvidenceRef = {
  refType: EvidenceRefType
  refId: number | null
  resultRef: string | null
  sourceUrl: string | null
  title: string | null
  snippet: string | null
  reason: string | null
}

export class InvalidReferenceError extends Error {
  readonly fieldName: string

  constructor(fieldName: string, message: string) {
    super(message)
    this.name = 'InvalidReferenceError'
    this.fieldName = fieldName
  }
}

const contentRefTypeSet = new Set<string>(CONTENT_REF_TYPES)
const evidenceRefTypeSet = new Set<string>(EVIDENCE_REF_TYPES)

export function isContentRefType(value: string | null | undefined): value is ContentRefType {
  return Boolean(value && contentRefTypeSet.has(value))
}

export function buildContentRef(refType: string | null, refId: number | null | undefined): string | null {
  if (!refType || refId == null) return null
  if (!isContentRefType(refType)) return null
  return `${refType}:${refId}`
}

export function parseContentRef(contentRef: string): EntityRef<ContentRefType> {
  const trimmed = String(contentRef || '').trim()
  const parts = trimmed.split(':')
  if (parts.length !== 2) {
    throw new InvalidReferenceError('content_ref', 'content_ref 格式无效，应为 type:id')
  }

  const [refType, idText] = parts
  if (!isContentRefType(refType)) {
    throw new InvalidReferenceError(
      'content_ref',
      `content_ref 类型无效，仅支持 ${CONTENT_REF_TYPES.join(', ')}`
    )
  }

  const refId = parsePositiveId(idText, 'content_ref')
  return { refType, refId }
}

export function parseFavoriteContentRef(contentRef: string): [ContentRefType, number] {
  const { refType, refId } = parseContentRef(contentRef)
  return [refType, refId]
}

export function normalizeNoteSourceRef(
  sourceType: string | null | undefined,
  sourceId: number | null | undefined
): { sourceType: NoteSourceType; sourceId: number | null } {
  const ref = normalizeTypedReference({
    fieldName: 'source_type/source_id',
    refType: sourceType || 'manual',
    refId: sourceId ?? null,
    allowedTypes: NOTE_SOURCE_TYPES,
    allowNullIdTypes: ['manual', 'chat'],
  })

  return {
    sourceType: ref.refType as NoteSourceType,
    sourceId: ref.refId,
  }
}

export function normalizeTodoRelatedRef(
  relatedType: string | null | undefined,
  relatedId: number | null | undefined
): { relatedType: TodoRelatedType | null; relatedId: number | null } {
  const ref = normalizeTypedReference({
    fieldName: 'related_type/related_id',
    refType: relatedType ?? null,
    refId: relatedId ?? null,
    allowedTypes: TODO_RELATED_TYPES,
    allowNull: true,
    allowNullIdTypes: ['chat'],
  })

  return {
    relatedType: ref.refType as TodoRelatedType | null,
    relatedId: ref.refId,
  }
}

export function normalizeHistoryRef(
  refType: string | null | undefined,
  refId: number | null | undefined
): NullableEntityRef<HistoryRefType> {
  return normalizeTypedReference({
    fieldName: 'ref_type/ref_id',
    refType: refType ?? null,
    refId: refId ?? null,
    allowedTypes: HISTORY_REF_TYPES,
    allowNull: true,
    allowNullIdTypes: ['summary_result'],
  }) as NullableEntityRef<HistoryRefType>
}

export function normalizeSummaryContentRef(
  contentType: string | null | undefined,
  contentId: number | null | undefined
): NullableEntityRef<SummaryContentType> {
  return normalizeTypedReference({
    fieldName: 'content_type/content_id',
    refType: contentType ?? null,
    refId: contentId ?? null,
    allowedTypes: SUMMARY_CONTENT_TYPES,
    allowNull: true,
    allowNullIdTypes: ['external_item'],
  }) as NullableEntityRef<SummaryContentType>
}

export function buildEvidenceRef(input: {
  refType: string
  refId?: number | null
  resultRef?: string | null
  sourceUrl?: string | null
  title?: string | null
  snippet?: string | null
  reason?: string | null
}): EvidenceRef {
  const refType = String(input.refType || '').trim()
  if (!evidenceRefTypeSet.has(refType)) {
    throw new InvalidReferenceError(
      'evidence_ref',
      `evidence_ref 类型无效，仅支持 ${EVIDENCE_REF_TYPES.join(', ')}`
    )
  }

  const refId = input.refId == null ? null : parsePositiveId(String(input.refId), 'evidence_ref.refId')
  const resultRef = normalizeOptionalText(input.resultRef)
  const sourceUrl = normalizeOptionalText(input.sourceUrl)

  if (refId == null && !resultRef && !sourceUrl) {
    throw new InvalidReferenceError(
      'evidence_ref',
      'evidence_ref 至少需要提供 refId、resultRef 或 sourceUrl 之一'
    )
  }

  return {
    refType: refType as EvidenceRefType,
    refId,
    resultRef,
    sourceUrl,
    title: normalizeOptionalText(input.title),
    snippet: normalizeOptionalText(input.snippet),
    reason: normalizeOptionalText(input.reason),
  }
}

function normalizeTypedReference<TType extends string>(params: {
  fieldName: string
  refType: string | null
  refId: number | null
  allowedTypes: readonly TType[]
  allowNull?: boolean
  allowNullIdTypes?: readonly TType[]
}): NullableEntityRef<TType> {
  const refType = normalizeOptionalText(params.refType)
  if (!refType) {
    if (params.refId == null && params.allowNull) {
      return { refType: null, refId: null }
    }
    throw new InvalidReferenceError(params.fieldName, `${params.fieldName} 缺少类型`)
  }

  if (!params.allowedTypes.includes(refType as TType)) {
    throw new InvalidReferenceError(
      params.fieldName,
      `${params.fieldName} 类型无效，仅支持 ${params.allowedTypes.join(', ')}`
    )
  }

  const allowsNullId = params.allowNullIdTypes?.includes(refType as TType) ?? false
  if (params.refId == null) {
    if (allowsNullId) {
      return { refType: refType as TType, refId: null }
    }
    throw new InvalidReferenceError(params.fieldName, `${params.fieldName} 缺少有效 id`)
  }

  return {
    refType: refType as TType,
    refId: parsePositiveId(String(params.refId), params.fieldName),
  }
}

function parsePositiveId(idText: string, fieldName: string): number {
  const normalized = String(idText || '').trim()
  if (!/^\d+$/.test(normalized)) {
    throw new InvalidReferenceError(fieldName, `${fieldName} 中的 id 无效`)
  }
  const value = Number.parseInt(normalized, 10)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new InvalidReferenceError(fieldName, `${fieldName} 中的 id 无效`)
  }
  return value
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const text = String(value || '').trim()
  return text || null
}
