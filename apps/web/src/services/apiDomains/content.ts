import type {
  ApiListResponse,
  HotTopicListItem,
  OpportunityListItem,
} from '../../types/page-data';
import type { ApiResponse } from '../apiClient';
import {
  isDailyDigestResponse,
  isUnifiedContentDetailData,
} from '../apiGuards';
import type { DigestConsultResponse } from '../apiPayloads';
import { validateApiResponse } from '../apiValidation';
import { withQuery } from '../apiUrl';
import type { ApiRequest } from './types';

interface ContentListResponse<T> {
  total: number;
  data: T[];
}

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

export async function getHotTopics(request: ApiRequest) {
  const response = await request<ContentListResponse<HotTopicListItem>>('/content/hot-topics');
  if (response.error || !response.data) {
    return { error: response.error } as ApiResponse<ApiListResponse<HotTopicListItem>>;
  }
  return {
    data: {
      total: response.data.total,
      items: response.data.data.map((item) => ({
        ...item,
        categories: parseArrayField((item as unknown as Record<string, unknown>).categories),
        tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
      })),
    },
  } satisfies ApiResponse<ApiListResponse<HotTopicListItem>>;
}

export async function getContentDetailByRef(request: ApiRequest, contentRef: string) {
  const endpoint = withQuery('/content/by-ref', { content_ref: contentRef });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isUnifiedContentDetailData);
}

export async function getHotTopic(request: ApiRequest, id: number) {
  const response = await getContentDetailByRef(request, `hot_topic:${id}`);
  if (response.error || !response.data) {
    return { error: response.error } as ApiResponse<HotTopicListItem>;
  }
  return {
    data: {
      id: Number(response.data.id),
      title: response.data.title,
      summary: response.data.summary ?? null,
      source: response.data.sourceName || '',
      source_url: response.data.sourceUrl || '',
      categories: response.data.categoryLabels,
      tags: response.data.tags,
      hot_value: 0,
      quality_score: response.data.qualityScore ?? 0,
      published_at: response.data.publishedAt ?? null,
    },
  } satisfies ApiResponse<HotTopicListItem>;
}

export async function getOpportunities(request: ApiRequest) {
  const response = await request<ContentListResponse<OpportunityListItem>>('/content/opportunities');
  if (response.error || !response.data) {
    return { error: response.error } as ApiResponse<ApiListResponse<OpportunityListItem>>;
  }
  return {
    data: {
      total: response.data.total,
      items: response.data.data.map((item) => ({
        ...item,
        tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
      })),
    },
  } satisfies ApiResponse<ApiListResponse<OpportunityListItem>>;
}

export async function getOpportunity(request: ApiRequest, id: number) {
  const response = await getContentDetailByRef(request, `opportunity:${id}`);
  if (response.error || !response.data) {
    return { error: response.error } as ApiResponse<OpportunityListItem>;
  }
  return {
    data: {
      id: Number(response.data.id),
      title: response.data.title,
      type: 'opportunity',
      status: 'active',
      source: response.data.sourceName || '',
      source_url: response.data.sourceUrl || '',
      summary: response.data.summary ?? null,
      reward: null,
      location: null,
      is_remote: 0,
      deadline: null,
      tags: response.data.tags,
      quality_score: response.data.qualityScore ?? 0,
    },
  } satisfies ApiResponse<OpportunityListItem>;
}

export async function getDailyDigest(request: ApiRequest, profileId?: string | null, limit: number = 8) {
  const endpoint = withQuery('/content/daily-digest', {
    profile_id: profileId,
    limit,
  });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isDailyDigestResponse);
}

export async function consultDigest(request: ApiRequest, data: { result_ref: string; question: string }) {
  return request<DigestConsultResponse>('/content/consult', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
