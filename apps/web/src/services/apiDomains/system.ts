import {
  isSummaryTaskApiItem,
  isSummaryTaskCreateResponse,
  isSummaryTaskListResponse,
  isSummaryTaskResultApiItem,
} from '../apiGuards';
import type {
  BriefingDispatchStatsPayload,
  LlmInvocationStatsPayload,
  SummaryTaskCreatePayload,
  SummaryTaskStatus,
} from '../apiPayloads';
import { validateApiResponse } from '../apiValidation';
import { withQuery } from '../apiUrl';
import type { ApiRequest } from './types';

export async function createSummaryTask(request: ApiRequest, data: SummaryTaskCreatePayload) {
  const endpoint = '/system/summary-tasks';
  const response = await request<unknown>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return validateApiResponse(endpoint, response, isSummaryTaskCreateResponse);
}

export async function createChatSessionSummaryTask(
  request: ApiRequest,
  sessionId: number,
  title?: string | null,
) {
  return createSummaryTask(request, {
    content_type: 'chat_session',
    content_id: sessionId,
    title: title || `对话 ${sessionId}`,
    summary_kind: 'chat_session',
  });
}

export async function listSummaryTasks(
  request: ApiRequest,
  params?: { limit?: number; status?: SummaryTaskStatus; contentType?: string },
) {
  const endpoint = withQuery('/system/summary-tasks', {
    limit: params?.limit,
    status: params?.status,
    content_type: params?.contentType,
  });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isSummaryTaskListResponse);
}

export async function getSummaryTask(request: ApiRequest, taskId: number) {
  const endpoint = `/system/summary-tasks/${taskId}`;
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isSummaryTaskApiItem);
}

export async function getSummaryTaskResult(request: ApiRequest, taskId: number) {
  const endpoint = `/system/summary-tasks/${taskId}/result`;
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isSummaryTaskResultApiItem);
}

export async function getLlmInvocationStats(
  request: ApiRequest,
  options: { days?: number; window?: string; limit?: number } = {},
) {
  return request<LlmInvocationStatsPayload>(withQuery('/system/llm-invocations/stats', {
    window: options.window,
    days: options.days,
    limit: options.limit,
  }));
}

export async function getBriefingDispatchStats(
  request: ApiRequest,
  options: { window?: string; limit?: number } = {},
) {
  return request<BriefingDispatchStatsPayload>(withQuery('/system/briefing-dispatches/stats', {
    window: options.window,
    limit: options.limit,
  }));
}
