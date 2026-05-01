import type {
  ChatConfirmRequest,
  ChatExecuteResult,
  ChatMessageStreamRequest,
  ChatQuickAction,
  ChatReclassifyRequest,
  ChatSessionSummary,
} from '../../types/page-data';
import {
  isChatSessionMessagesData,
  isChatSessionSummaryList,
} from '../apiGuards';
import { validateApiResponse } from '../apiValidation';
import { withQuery } from '../apiUrl';
import type { ApiDomainRuntime } from './types';

export async function sendChatMessage(
  runtime: ApiDomainRuntime,
  data: ChatMessageStreamRequest,
): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const response = await fetch(`${runtime.baseUrl}/chat/message`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Chat message error:', response.status);
      return null;
    }

    return response.body;
  } catch (error) {
    console.error('Chat message request error:', error);
    return null;
  }
}

export async function executeChat(
  runtime: ApiDomainRuntime,
  data: {
    input: string;
    current_interests?: string[];
    draft_type?: string;
    preferred_intent?: string;
    source_context?: string;
    source_content_ref?: string;
    source_title?: string;
    auto_commit?: boolean;
    confirmed_type?: string;
    correction_from?: string;
  },
) {
  return runtime.request<ChatExecuteResult>('/chat/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reclassifyChat(runtime: ApiDomainRuntime, data: ChatReclassifyRequest) {
  return runtime.request<ChatExecuteResult>('/chat/reclassify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmChat(runtime: ApiDomainRuntime, data: ChatConfirmRequest) {
  return runtime.request<ChatExecuteResult & {
    messageId: number;
    text: string;
    sessionId: number;
    suggestedActions?: ChatQuickAction[];
  }>('/chat/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getChatSessions(runtime: ApiDomainRuntime, limit: number = 20) {
  const endpoint = withQuery('/chat/sessions', { limit });
  const response = await runtime.request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isChatSessionSummaryList);
}

export async function createChatSession(runtime: ApiDomainRuntime) {
  return runtime.request<ChatSessionSummary>('/chat/sessions', { method: 'POST' });
}

export async function renameChatSession(runtime: ApiDomainRuntime, sessionId: number, sessionTitle: string) {
  return runtime.request<{ success: boolean }>(`/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ session_title: sessionTitle }),
  });
}

export async function archiveChatSession(runtime: ApiDomainRuntime, sessionId: number) {
  return runtime.request<{ success: boolean }>(`/chat/sessions/${sessionId}/archive`, { method: 'POST' });
}

export async function getChatSessionMessages(runtime: ApiDomainRuntime, sessionId: number) {
  const endpoint = `/chat/sessions/${sessionId}/messages`;
  const response = await runtime.request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isChatSessionMessagesData);
}

export async function deleteChatMessage(runtime: ApiDomainRuntime, messageId: number) {
  const endpoint = `/chat/messages/${messageId}`;
  const response = await runtime.request<unknown>(endpoint, { method: 'DELETE' });
  return response as { error?: string; success?: boolean; sessionId?: number };
}
