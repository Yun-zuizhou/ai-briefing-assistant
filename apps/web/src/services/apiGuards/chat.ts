import type { ChatSessionMessagesData, ChatSessionSummary } from '../../types/page-data';
import {
  isEnumValue,
  isNumber,
  isOptionalNumber,
  isOptionalString,
  isOptionalStringArray,
  isRecord,
  isString,
  isStringOrNumber,
} from '../apiValidation';

const CHAT_ROLES = new Set(['assistant', 'user']);
const CHAT_OBJECT_ENTITY_TYPES = new Set(['todo', 'note', 'history', 'favorite', 'unknown']);
const CHAT_OBJECT_CHANGE_TYPES = new Set(['created', 'kept', 'cancelled', 'retagged', 'repointed']);

function isChatObjectChange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.entityType, CHAT_OBJECT_ENTITY_TYPES)
    && (value.entityId === undefined || isStringOrNumber(value.entityId))
    && isEnumValue(value.change, CHAT_OBJECT_CHANGE_TYPES)
    && isString(value.summary);
}

function isChatSessionSummary(value: unknown): value is ChatSessionSummary {
  if (!isRecord(value)) return false;
  return isNumber(value.sessionId)
    && isString(value.status)
    && (value.sessionTitle === undefined || isOptionalString(value.sessionTitle))
    && (value.sourceContext === undefined || isOptionalString(value.sourceContext))
    && (value.lastMessageAt === undefined || isOptionalString(value.lastMessageAt))
    && (value.messageCount === undefined || isOptionalNumber(value.messageCount));
}

export function isChatSessionSummaryList(value: unknown): value is ChatSessionSummary[] {
  return Array.isArray(value) && value.every(isChatSessionSummary);
}

function isChatSessionMessage(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.messageId)
    && isEnumValue(value.role, CHAT_ROLES)
    && isString(value.content)
    && isOptionalString(value.createdAt)
    && isOptionalString(value.messageState)
    && isOptionalString(value.intentType)
    && isOptionalStringArray(value.candidateIntents)
    && isOptionalNumber(value.confidence)
    && isOptionalString(value.sourceContext)
    && isOptionalString(value.matchedBy)
    && isOptionalString(value.confirmedType)
    && isOptionalString(value.actionType)
    && isOptionalString(value.resultSummary)
    && isOptionalString(value.deepLink)
    && isOptionalString(value.nextPageLabel)
    && isOptionalString(value.affectedEntityType)
    && (value.affectedEntityId === undefined || value.affectedEntityId === null || isStringOrNumber(value.affectedEntityId))
    && (value.changeLog === undefined || value.changeLog === null || (Array.isArray(value.changeLog) && value.changeLog.every(isChatObjectChange)));
}

export function isChatSessionMessagesData(value: unknown): value is ChatSessionMessagesData {
  if (!isRecord(value)) return false;
  return isNumber(value.sessionId)
    && isString(value.status)
    && (value.sessionTitle === undefined || isOptionalString(value.sessionTitle))
    && (value.sourceContext === undefined || isOptionalString(value.sourceContext))
    && (value.lastMessageAt === undefined || isOptionalString(value.lastMessageAt))
    && Array.isArray(value.messages)
    && value.messages.every(isChatSessionMessage);
}
