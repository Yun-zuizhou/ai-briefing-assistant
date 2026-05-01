// Chat stream state transitions live here so useChatLogic stays focused on
// API calls, hydration, and wiring React state into the chat UI.
import type { Dispatch, SetStateAction } from 'react';
import type { ChatQuickAction, ChatStreamEvent } from '../../types/page-data';
import {
  type ActionSummary,
  type ChatMessage,
  buildCorrectionQuickActions,
} from './chatMessageUtils';

export interface PendingConfirmation {
  userMessage: string;
  candidateIntents: string[];
  sourceContext?: string;
  sourceContentRef?: string;
  sourceTitle?: string;
}

export interface ChatSendContext {
  userMessage: string;
  sourceContext?: string;
  sourceContentRef?: string;
  sourceTitle?: string;
}

interface IntentHint {
  text: string;
  intentType: string;
}

interface ChatStreamWriters {
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setIntentHint: Dispatch<SetStateAction<IntentHint | null>>;
  setCurrentSessionId: Dispatch<SetStateAction<number | null>>;
  setPendingConfirmation: Dispatch<SetStateAction<PendingConfirmation | null>>;
  setLatestActionSummary: Dispatch<SetStateAction<ActionSummary | null>>;
  refreshInterestState: () => void | Promise<void>;
}

function findLastUserMessageIndex(items: ChatMessage[]): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.role === 'user') return index;
  }
  return -1;
}

function markLatestUserMessageRecognized(
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  userMessageId?: number,
) {
  if (userMessageId == null) return;
  setMessages((prev) => {
    const userIdx = findLastUserMessageIndex(prev);
    if (userIdx < 0) return prev;
    const updated = [...prev];
    updated[userIdx] = {
      ...updated[userIdx],
      id: userMessageId,
      messageState: 'recognized',
    };
    return updated;
  });
}

function buildCorrectionFrom(affectedEntity?: { type?: string; id?: number | string }) {
  return affectedEntity?.id !== undefined && ['todo', 'note'].includes(affectedEntity.type ?? '')
    ? `${affectedEntity.type}:${affectedEntity.id}`
    : undefined;
}

export function appendChatErrorMessage(
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  content: string,
) {
  setMessages((prev) => [...prev, {
    id: Date.now(),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
    messageState: 'error',
  }]);
}

export function handleChatStreamEvent(
  streamEvent: ChatStreamEvent,
  context: ChatSendContext,
  writers: ChatStreamWriters,
) {
  switch (streamEvent.event) {
    case 'intent_analysis': {
      const { data } = streamEvent;
      markLatestUserMessageRecognized(writers.setMessages, data.userMessageId);
      writers.setIntentHint({ text: data.text, intentType: data.intentType });
      writers.setCurrentSessionId(data.sessionId);
      break;
    }

    case 'pending_confirmation': {
      const { data } = streamEvent;
      markLatestUserMessageRecognized(writers.setMessages, data.userMessageId);
      writers.setPendingConfirmation({
        userMessage: data.userMessage || context.userMessage,
        candidateIntents: data.candidateIntents,
        sourceContext: context.sourceContext,
        sourceContentRef: context.sourceContentRef,
        sourceTitle: context.sourceTitle,
      });
      writers.setCurrentSessionId(data.sessionId);
      break;
    }

    case 'execution_result': {
      const { data } = streamEvent;
      const quickActions = data.suggestedActions ?? data.quickActions ?? [];
      const actionSummary: ActionSummary = {
        success: data.success,
        actionType: data.actionType,
        successMessage: `已${data.text.split('\n')[0]?.replace(/^我已经帮你/, '') || '处理当前输入'}`,
        resultSummary: data.resultSummary,
        deepLink: data.deepLink,
        nextPageLabel: data.nextPageLabel,
        confirmedType: data.confirmedType,
        sourceContext: context.sourceContext,
        quickActions,
        changeLog: data.changeLog ?? [],
      };

      writers.setLatestActionSummary(actionSummary);
      writers.setPendingConfirmation(null);

      if (actionSummary.actionType === 'add_interest' || actionSummary.actionType === 'remove_interest') {
        void writers.refreshInterestState();
      }

      const messageQuickActions: ChatQuickAction[] = [
        ...quickActions,
        ...buildCorrectionQuickActions(
          context.userMessage,
          data.confirmedType ?? data.actionType,
          buildCorrectionFrom(data.affectedEntity),
        ),
      ];

      writers.setMessages((prev) => [...prev, {
        id: data.messageId,
        role: 'assistant',
        content: data.text,
        createdAt: new Date().toISOString(),
        intentType: data.actionType,
        actionType: data.actionType,
        messageState: 'executed',
        confirmedType: data.confirmedType,
        resultSummary: data.resultSummary,
        deepLink: data.deepLink,
        candidateIntents: [],
        sourceContext: context.sourceContext,
        nextPageLabel: data.nextPageLabel,
        quickActions: messageQuickActions,
        originalUserMessage: context.userMessage,
        changeLog: data.changeLog ?? [],
      }]);
      writers.setCurrentSessionId(data.sessionId);
      break;
    }

    case 'error':
      appendChatErrorMessage(writers.setMessages, `处理失败：${streamEvent.data.message || '未知错误'}`);
      break;

    case 'done':
      break;
  }
}
