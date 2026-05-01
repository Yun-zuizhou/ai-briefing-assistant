import type { TodayPageData } from '../../types/page-data';
import {
  isEnumValue,
  isNumber,
  isRecord,
  isString,
  isStringArray,
  isStringOrNumber,
} from '../apiValidation';

const RECOMMENDED_CONTENT_TYPES = new Set(['hot_topic', 'article', 'opportunity', 'note']);
const WORTH_KNOWING_CONTENT_TYPES = new Set(['hot_topic', 'article']);
const TODAY_LEAD_ITEM_TYPES = new Set(['hot_topic', 'article', 'opportunity', 'briefing']);
const TODAY_EXTENSION_SLOT_TYPES = new Set(['ask', 'todo', 'save', 'review']);
const ACTION_TYPES = new Set(['apply', 'follow', 'submit', 'read_later', 'create_todo']);

function isRecommendationItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isString(value.interestName) || !isString(value.recommendationReason)) return false;
  if (!Array.isArray(value.topItems)) return false;
  return value.topItems.every((item) => {
    if (!isRecord(item)) return false;
    return isString(item.contentRef)
      && isStringOrNumber(item.id)
      && isEnumValue(item.contentType, RECOMMENDED_CONTENT_TYPES)
      && isString(item.title);
  });
}

function isWorthKnowingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isStringOrNumber(value.id)
    && isEnumValue(value.contentType, WORTH_KNOWING_CONTENT_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && isString(value.sourceName)
    && isString(value.relevanceReason);
}

function isWorthActingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isStringOrNumber(value.id)
    && isEnumValue(value.actionType, ACTION_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && isString(value.whyRelevant)
    && isString(value.nextActionLabel);
}

function isTodayLeadItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (value.contentRef === undefined || isString(value.contentRef))
    && isEnumValue(value.itemType, TODAY_LEAD_ITEM_TYPES)
    && isString(value.title)
    && isString(value.summary)
    && (value.sourceLabel === undefined || isString(value.sourceLabel))
    && (value.relevanceLabel === undefined || isString(value.relevanceLabel))
    && isString(value.primaryActionLabel)
    && (value.secondaryActionLabel === undefined || isString(value.secondaryActionLabel));
}

function isTodayExtensionSlot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.slotType, TODAY_EXTENSION_SLOT_TYPES)
    && isString(value.title)
    && isString(value.description)
    && isString(value.actionLabel)
    && (value.deepLink === undefined || isString(value.deepLink))
    && (value.sourceContentRef === undefined || isString(value.sourceContentRef));
}

function isTodayAiBriefingSourceRef(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.contentRef)
    && isString(value.title)
    && (value.sourceLabel === undefined || isString(value.sourceLabel))
    && (value.reason === undefined || isString(value.reason));
}

function isTodayAiBriefingCluster(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.title)
    && isString(value.summary)
    && (value.confidenceNote === undefined || isString(value.confidenceNote))
    && (value.recommendationReason === undefined || isString(value.recommendationReason))
    && Array.isArray(value.sourceRefs)
    && value.sourceRefs.every(isTodayAiBriefingSourceRef);
}

function isTodayAiBriefingBlock(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.version)
    && (value.provider === undefined || isString(value.provider))
    && (value.model === undefined || isString(value.model))
    && isEnumValue(value.status, new Set(['success', 'fallback']))
    && isString(value.leadSummary)
    && Array.isArray(value.topicClusters)
    && value.topicClusters.every(isTodayAiBriefingCluster)
    && isStringArray(value.recommendationReasons)
    && isStringArray(value.uncertainties)
    && (value.generatedAt === undefined || isString(value.generatedAt));
}

export function isTodayPageData(value: unknown): value is TodayPageData {
  if (!isRecord(value)) return false;
  if (!isString(value.dateLabel) || !isNumber(value.issueNumber) || !isString(value.pageTitle) || !isString(value.pageSubtitle)) {
    return false;
  }
  if (!isRecord(value.summary) || !isString(value.summary.summaryTitle) || !isString(value.summary.summaryText)) {
    return false;
  }
  if (!(value.leadItem === undefined || value.leadItem === null || isTodayLeadItem(value.leadItem))) {
    return false;
  }
  if (!(value.dailyAngle === undefined || isString(value.dailyAngle))) {
    return false;
  }
  if (!(value.aiBriefing === undefined || isTodayAiBriefingBlock(value.aiBriefing))) {
    return false;
  }
  if (value.freshness !== undefined) {
    if (!isRecord(value.freshness) || !isNumber(value.freshness.sourceCount)) return false;
    if (!(value.freshness.latestPublishedAt === undefined || isString(value.freshness.latestPublishedAt))) return false;
    if (!(value.freshness.generatedAt === undefined || isString(value.freshness.generatedAt))) return false;
  }
  if (!(value.extensionSlots === undefined || (Array.isArray(value.extensionSlots) && value.extensionSlots.every(isTodayExtensionSlot)))) {
    return false;
  }
  if (!Array.isArray(value.recommendedForYou) || !value.recommendedForYou.every(isRecommendationItem)) {
    return false;
  }
  if (!Array.isArray(value.worthKnowing) || !value.worthKnowing.every(isWorthKnowingItem)) {
    return false;
  }
  if (!Array.isArray(value.worthActing) || !value.worthActing.every(isWorthActingItem)) {
    return false;
  }
  return isRecord(value.quickNoteEntry) && isString(value.quickNoteEntry.placeholderText);
}
