import type { AuthEnvelope } from '../apiPayloads';
import type { ApiRequest } from './types';

export async function login(request: ApiRequest, data: { identifier: string; password: string }) {
  return request<AuthEnvelope>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(
  request: ApiRequest,
  data: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  },
) {
  return request<AuthEnvelope>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(request: ApiRequest) {
  return request<AuthEnvelope>('/auth/me', { suppressErrorLog: true });
}

export async function logout(request: ApiRequest) {
  return request<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  });
}
