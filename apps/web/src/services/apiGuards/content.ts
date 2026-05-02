import type { UnifiedContentDetailData } from '../../types/page-data';
import type { DailyDigestResponse } from '../apiPayloads';
import {
  isEnumValue,
  isNumber,
  isOptionalNumber,
  isOptionalString,
  isOptionalStringArray,
  isRecord,
  isString,
  isStringArray,
  isStringOrNumber,
} from '../apiValidation';

const CONTENT_TYPES = new Set(['hot_topic', 'article', 'opportunity']);
const CONTENT_ROLES = new Set(['original', 'source_digest', 'opportunity_detail', 'body']);
const DETAIL_STATES = new Set(['formal', 'partial']);

function isRelatedItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isOptionalString(value.summary)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.relationReason);
}

export function isUnifiedContentDetailData(value: unknown): value is UnifiedContentDetailData {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && isEnumValue(value.contentRole, CONTENT_ROLES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isOptionalString(value.summary)
    && isOptionalString(value.content)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.author)
    && isStringArray(value.categoryLabels)
    && isStringArray(value.tags)
    && isOptionalString(value.publishedAt)
    && isOptionalNumber(value.qualityScore)
    && isEnumValue(value.detailState, DETAIL_STATES)
    && isOptionalString(value.detailStateReason)
    && isOptionalStringArray(value.missingFields)
    && Array.isArray(value.relatedItems)
    && value.relatedItems.every(isRelatedItem);
}

function isDigestCitation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isOptionalString(value.title) && isOptionalString(value.url);
}

function isDailyDigestItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && isNumber(value.taskId)
    && isString(value.resultRef)
    && isOptionalString(value.profileId)
    && isOptionalString(value.providerName)
    && isOptionalString(value.modelName)
    && isOptionalString(value.promptVersion)
    && isOptionalString(value.summaryTitle)
    && isOptionalString(value.summaryText)
    && isStringArray(value.keyPoints)
    && isStringArray(value.riskFlags)
    && Array.isArray(value.citations)
    && value.citations.every(isDigestCitation)
    && isOptionalString(value.sourceUrl)
    && isOptionalString(value.sourceName)
    && isOptionalString(value.title)
    && isOptionalString(value.publishedAt)
    && isString(value.createdAt)
    && isOptionalString(value.updatedAt);
}

export function isDailyDigestResponse(value: unknown): value is DailyDigestResponse {
  if (!isRecord(value)) return false;
  return isString(value.profileId)
    && (value.mode === undefined || isString(value.mode))
    && isNumber(value.total)
    && Array.isArray(value.items)
    && value.items.every(isDailyDigestItem);
}
