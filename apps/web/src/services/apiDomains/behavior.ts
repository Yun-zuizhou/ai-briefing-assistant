import type {
  ApiListResponse,
  FavoriteApiItem,
  HistoryApiItem,
  NoteApiItem,
  TodoApiItem,
  ActionCheckInData,
} from '../../types/page-data';
import {
  isActionsOverviewData,
  isJournalOverviewData,
} from '../apiGuards';
import type {
  FavoriteCreatePayload,
  FeedbackCreatePayload,
  FeedbackSubmission,
  NoteCreatePayload,
} from '../apiPayloads';
import { validateApiResponse } from '../apiValidation';
import { withQuery } from '../apiUrl';
import type { ApiRequest } from './types';

export async function getTodos(request: ApiRequest, params?: { status?: string; priority?: string }) {
  return request<ApiListResponse<TodoApiItem>>(withQuery('/todos', {
    status: params?.status,
    priority: params?.priority,
  }));
}

export async function updateTodo(request: ApiRequest, id: number, data: Partial<TodoApiItem>) {
  return request<TodoApiItem>(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTodo(request: ApiRequest, id: number) {
  return request<{ success: boolean; message: string }>(`/todos/${id}`, {
    method: 'DELETE',
  });
}

export async function getFavorites(request: ApiRequest, params?: { itemType?: string }) {
  return request<ApiListResponse<FavoriteApiItem>>(withQuery('/favorites', {
    item_type: params?.itemType,
  }));
}

export async function createFavorite(request: ApiRequest, data: FavoriteCreatePayload) {
  return request<FavoriteApiItem>('/favorites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteFavorite(request: ApiRequest, id: number) {
  return request<{ success: boolean; message: string }>(`/favorites/${id}`, {
    method: 'DELETE',
  });
}

export async function getNotes(request: ApiRequest, params?: { sourceType?: string }) {
  return request<ApiListResponse<NoteApiItem>>(withQuery('/notes', {
    source_type: params?.sourceType,
  }));
}

export async function createNote(request: ApiRequest, data: NoteCreatePayload) {
  return request<NoteApiItem>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(request: ApiRequest, id: number) {
  return request<{ success: boolean; message: string }>(`/notes/${id}`, {
    method: 'DELETE',
  });
}

export async function getHistory(request: ApiRequest, params?: { eventType?: string }) {
  return request<ApiListResponse<HistoryApiItem>>(withQuery('/history', {
    event_type: params?.eventType,
  }));
}

export async function submitFeedback(request: ApiRequest, data: FeedbackCreatePayload) {
  return request<{ success: boolean; submission: FeedbackSubmission }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getActionsOverview(request: ApiRequest) {
  const endpoint = '/actions/overview';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isActionsOverviewData);
}

export async function getJournalOverview(request: ApiRequest) {
  const endpoint = '/journal/overview';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isJournalOverviewData);
}

export async function checkInToday(request: ApiRequest) {
  return request<ActionCheckInData>('/actions/check-in', {
    method: 'POST',
  });
}
