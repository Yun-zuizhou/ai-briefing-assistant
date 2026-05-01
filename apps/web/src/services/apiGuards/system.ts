import type {
  SummaryTaskApiItem,
  SummaryTaskCreateResponse,
  SummaryTaskListResponse,
  SummaryTaskResultApiItem,
} from '../apiPayloads';
import {
  isBoolean,
  isEnumValue,
  isNumber,
  isOptionalNumber,
  isOptionalString,
  isRecord,
  isString,
} from '../apiValidation';

const SUMMARY_TASK_STATUSES = new Set(['pending_provider', 'queued', 'running', 'succeeded', 'failed']);

export function isSummaryTaskApiItem(value: unknown): value is SummaryTaskApiItem {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && value.task_type === 'summary_generation'
    && isOptionalString(value.content_type)
    && isOptionalNumber(value.content_id)
    && isOptionalString(value.source_url)
    && isOptionalString(value.title)
    && isString(value.summary_kind)
    && isEnumValue(value.status, SUMMARY_TASK_STATUSES)
    && isOptionalString(value.provider_name)
    && isOptionalString(value.model_name)
    && isOptionalString(value.result_ref)
    && isOptionalString(value.error_message)
    && isString(value.requested_at)
    && isOptionalString(value.started_at)
    && isOptionalString(value.finished_at)
    && isOptionalString(value.updated_at);
}

export function isSummaryTaskCreateResponse(value: unknown): value is SummaryTaskCreateResponse {
  if (!isRecord(value)) return false;
  return isBoolean(value.success) && isSummaryTaskApiItem(value.task);
}

export function isSummaryTaskListResponse(value: unknown): value is SummaryTaskListResponse {
  if (!isRecord(value)) return false;
  return isNumber(value.total)
    && Array.isArray(value.items)
    && value.items.every(isSummaryTaskApiItem);
}

export function isSummaryTaskResultApiItem(value: unknown): value is SummaryTaskResultApiItem {
  if (!isRecord(value)) return false;
  return isNumber(value.id)
    && isNumber(value.task_id)
    && isNumber(value.user_id)
    && isOptionalString(value.content_type)
    && isOptionalNumber(value.content_id)
    && isOptionalString(value.source_url)
    && isString(value.result_ref)
    && isOptionalString(value.profile_id)
    && isOptionalString(value.provider_name)
    && isOptionalString(value.model_name)
    && isOptionalString(value.prompt_version)
    && isOptionalString(value.summary_title)
    && isOptionalString(value.summary_text)
    && Array.isArray(value.key_points)
    && Array.isArray(value.risk_flags)
    && Array.isArray(value.citations)
    && isString(value.created_at)
    && isOptionalString(value.updated_at);
}
