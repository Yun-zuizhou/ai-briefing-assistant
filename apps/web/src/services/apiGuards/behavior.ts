import type { ActionsOverviewData, JournalOverviewData } from '../../types/page-data';
import {
  isBoolean,
  isEnumValue,
  isNumber,
  isOptionalNumber,
  isRecord,
  isString,
  isStringOrNumber,
} from '../apiValidation';

const CONTENT_TYPES = new Set(['hot_topic', 'article', 'opportunity']);
const TODO_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const TODO_SOURCE_TYPES = new Set(['chat', 'content', 'manual']);
const SUGGESTED_ACTION_SOURCES = new Set(['todo', 'opportunity_follow', 'saved_item']);
const FOLLOW_STATUSES = new Set(['new', 'watching', 'applied', 'waiting', 'completed']);
const REMINDER_TYPES = new Set(['todo', 'opportunity', 'digest']);

function isActionTodoItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.todoId)
    && isString(value.title)
    && isEnumValue(value.priority, TODO_PRIORITIES)
    && isBoolean(value.done)
    && (value.sourceType === undefined || isEnumValue(value.sourceType, TODO_SOURCE_TYPES))
    && (value.sourceRefId === undefined || isStringOrNumber(value.sourceRefId))
    && (value.dueLabel === undefined || isString(value.dueLabel));
}

function isSavedItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.savedId)
    && isString(value.title)
    && isEnumValue(value.contentType, CONTENT_TYPES)
    && (value.sourceName === undefined || isString(value.sourceName))
    && (value.savedAt === undefined || isString(value.savedAt))
    && (value.urgencyLabel === undefined || isString(value.urgencyLabel));
}

function isFollowingItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.followId)
    && isString(value.title)
    && isEnumValue(value.followStatus, FOLLOW_STATUSES)
    && (value.deadline === undefined || isString(value.deadline))
    && (value.progressText === undefined || isString(value.progressText))
    && (value.nextStep === undefined || isString(value.nextStep));
}

function isReminderSummaryItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isStringOrNumber(value.id)
    && isString(value.title)
    && isEnumValue(value.type, REMINDER_TYPES)
    && (value.remindAt === undefined || isString(value.remindAt));
}

function isNoteApiItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && isString(value.content)
    && isString(value.source_type)
    && isOptionalNumber(value.source_id)
    && Array.isArray(value.tags)
    && value.tags.every(isString)
    && isString(value.created_at);
}

function isSuggestedActionItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.source, SUGGESTED_ACTION_SOURCES)
    && isStringOrNumber(value.id)
    && isString(value.title)
    && isString(value.reason)
    && isString(value.primaryActionLabel)
    && (value.priorityLabel === undefined || isString(value.priorityLabel))
    && (value.dueLabel === undefined || isString(value.dueLabel))
    && (value.deepLink === undefined || isString(value.deepLink));
}

function isJournalProgressItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.title)
    && isString(value.meta)
    && isString(value.detail)
    && (value.deepLink === undefined || isString(value.deepLink));
}

function isJournalKeptItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.title)
    && isString(value.sourceLabel)
    && isString(value.detail)
    && (value.createdAt === undefined || isString(value.createdAt))
    && (value.deepLink === undefined || isString(value.deepLink));
}

export function isJournalOverviewData(value: unknown): value is JournalOverviewData {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.review)) return false;
  return isNumber(value.summary.expressionCount)
    && isNumber(value.summary.progressCount)
    && isNumber(value.summary.keptCount)
    && isNumber(value.summary.reviewCount)
    && isString(value.summary.summaryText)
    && Array.isArray(value.recentNotes)
    && value.recentNotes.every(isNoteApiItem)
    && Array.isArray(value.progressItems)
    && value.progressItems.every(isJournalProgressItem)
    && Array.isArray(value.keptItems)
    && value.keptItems.every(isJournalKeptItem)
    && isNumber(value.review.availableCount)
    && Array.isArray(value.review.keywords)
    && value.review.keywords.every(isString)
    && isString(value.review.summaryText);
}

export function isActionsOverviewData(value: unknown): value is ActionsOverviewData {
  if (!isRecord(value)) return false;
  return Array.isArray(value.todayTodos)
    && value.todayTodos.every(isActionTodoItem)
    && Array.isArray(value.futureTodos)
    && value.futureTodos.every(isActionTodoItem)
    && Array.isArray(value.completedTodos)
    && value.completedTodos.every(isActionTodoItem)
    && Array.isArray(value.savedForLater)
    && value.savedForLater.every(isSavedItem)
    && Array.isArray(value.followingItems)
    && value.followingItems.every(isFollowingItem)
    && isRecord(value.reminderSummary)
    && isString(value.reminderSummary.pushTime)
    && Array.isArray(value.reminderSummary.upcomingReminders)
    && value.reminderSummary.upcomingReminders.every(isReminderSummaryItem)
    && isBoolean(value.checkedInToday)
    && (value.topPriority === undefined || value.topPriority === null || isSuggestedActionItem(value.topPriority))
    && (value.suggestedNextActions === undefined
      || (Array.isArray(value.suggestedNextActions) && value.suggestedNextActions.every(isSuggestedActionItem)));
}
