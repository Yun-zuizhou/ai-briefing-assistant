import type {
  UserAiProviderPayload,
  UserProfileGeneratePayload,
  UserProfilePayload,
  UserSettingsPayload,
} from '../apiPayloads';
import { isGrowthOverviewData } from '../apiGuards';
import { validateApiResponse } from '../apiValidation';
import type { ApiRequest } from './types';

export async function getGrowthOverview(request: ApiRequest) {
  const endpoint = '/preferences/growth-overview';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isGrowthOverviewData);
}

export async function getUserInterests(request: ApiRequest) {
  return request<{ interests: string[] }>('/preferences/interests');
}

export async function updateUserInterests(request: ApiRequest, interests: string[]) {
  return request<{ interests: string[] }>('/preferences/interests', {
    method: 'PUT',
    body: JSON.stringify({ interests }),
  });
}

export async function getUserSettings(request: ApiRequest) {
  return request<UserSettingsPayload>('/preferences/settings');
}

export async function updateUserSettings(request: ApiRequest, data: UserSettingsPayload) {
  return request<UserSettingsPayload>('/preferences/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getUserAiProviderSettings(request: ApiRequest) {
  return request<UserAiProviderPayload>('/preferences/ai-provider');
}

export async function updateUserAiProviderSettings(
  request: ApiRequest,
  data: { provider?: string | null; api_key?: string | null },
) {
  return request<UserAiProviderPayload>('/preferences/ai-provider', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getUserProfile(request: ApiRequest) {
  return request<UserProfilePayload>('/preferences/profile');
}

export async function generateUserProfile(request: ApiRequest) {
  return request<UserProfileGeneratePayload>('/preferences/profile/generate', {
    method: 'POST',
  });
}
