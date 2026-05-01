import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import type { ChatSessionSummary } from '../types/page-data';
import { formatIntentLabel } from '../utils/intentLabels';
import {
  type ChatMessage,
  type ActionSummary,
  buildActionSummaryFromExecute,
  buildReclassifyReply,
  buildCorrectionQuickActions,
  buildActionSummaryFromMessage,
  buildMessagesFromSession,
} from './chat/chatMessageUtils';
import { readChatEventStream } from './chat/chatStreamEvents';
import {
  appendChatErrorMessage,
  handleChatStreamEvent,
  type PendingConfirmation,
} from './chat/chatStateTransitions';

export type ComposeMode = 'smart' | 'create_todo' | 'record_thought' | 'fragmented_thought' | 'chat_only';
type ChatReadMode = 'formal' | 'empty';

export function useChatLogic() {
  const initializedRef = useRef(false);
  const [currentInterests, setCurrentInterests] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestActionSummary, setLatestActionSummary] = useState<ActionSummary | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [composeMode, setComposeMode] = useState<ComposeMode>('smart');
  const [activeSessionSummary, setActiveSessionSummary] = useState<ChatSessionSummary | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [chatReadError, setChatReadError] = useState<string | null>(null);
  const [chatReadMode, setChatReadMode] = useState<ChatReadMode>('empty');
  const [intentHint, setIntentHint] = useState<{ text: string; intentType: string } | null>(null);

  const refreshInterestState = useCallback(async () => {
    try {
      const response = await apiService.getUserInterests();
      if (response.error) {
        throw new Error(response.error);
      }
      setCurrentInterests(response.data?.interests ?? []);
    } catch (error) {
      console.error('Failed to refresh user interests for chat:', error);
    }
  }, []);

  useEffect(() => {
    void refreshInterestState();
  }, [refreshInterestState]);

  useEffect(() => {
    if (!intentHint) return;
    const timer = setTimeout(() => setIntentHint(null), 2500);
    return () => clearTimeout(timer);
  }, [intentHint]);

  const refreshSessionState = useCallback(async (preferredSessionId?: number | null) => {
    setIsHydrating(true);
    setChatReadError(null);
    try {
      const sessionsResponse = await apiService.getChatSessions();
      if (sessionsResponse.error) {
        throw new Error(sessionsResponse.error);
      }

      const sessionList = sessionsResponse.data ?? [];
      setSessions(sessionList);
      if (sessionList.length === 0) {
        setCurrentSessionId(null);
        setActiveSessionSummary(null);
        setPendingConfirmation(null);
        setLatestActionSummary(null);
        setMessages([]);
        setChatReadMode('empty');
        return;
      }

      const resolvedSession = sessionList.find((item) => item.sessionId === preferredSessionId)
        ?? sessionList[0];
      const messagesResponse = await apiService.getChatSessionMessages(resolvedSession.sessionId);
      if (messagesResponse.error || !messagesResponse.data) {
        throw new Error(messagesResponse.error ?? '读取正式会话消息失败');
      }

      const nextMessages = buildMessagesFromSession(messagesResponse.data);
      const lastPendingIndex = [...nextMessages].reverse().findIndex((item) => item.messageState === 'pending_confirmation');
      const pendingMessage = lastPendingIndex >= 0 ? nextMessages[nextMessages.length - 1 - lastPendingIndex] : null;
      const lastAssistantMessage = [...nextMessages].reverse().find((item) => item.role === 'assistant') ?? null;

      setCurrentSessionId(resolvedSession.sessionId);
      setActiveSessionSummary(resolvedSession);
      setMessages(nextMessages);
      setPendingConfirmation(
        pendingMessage
          ? {
              userMessage: pendingMessage.originalUserMessage ?? '',
              candidateIntents: pendingMessage.candidateIntents ?? [],
              sourceContext: pendingMessage.sourceContext ?? undefined,
            }
          : null,
      );
      setLatestActionSummary(lastAssistantMessage ? buildActionSummaryFromMessage(lastAssistantMessage) : null);
      setChatReadMode('formal');
    } catch (error) {
      console.error('Failed to hydrate formal chat session:', error);
      setChatReadError(error instanceof Error ? error.message : '读取正式会话失败');
      setActiveSessionSummary(null);
      setChatReadMode('empty');
    } finally {
      setIsHydrating(false);
    }
  }, []);

  // Init gate prevents double-fetch from React StrictMode double-mount.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void refreshSessionState(null);
  }, [refreshSessionState]);

  const switchSession = useCallback((sessionId: number) => {
    setCurrentSessionId(sessionId);
    void refreshSessionState(sessionId);
  }, [refreshSessionState]);

  const createNewSession = useCallback(async () => {
    const response = await apiService.createChatSession();
    if (response.error || !response.data) {
      setChatReadError(response.error ?? '创建会话失败');
      return;
    }
    const newSession = response.data;
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.sessionId);
    setActiveSessionSummary(newSession);
    setMessages([]);
    setPendingConfirmation(null);
    setLatestActionSummary(null);
    setChatReadMode('empty');
  }, []);

  const sendMessage = useCallback(async (
    userMessage: string,
    options?: {
      sourceContext?: string;
      sourceContentRef?: string;
      sourceTitle?: string;
      autoCommit?: boolean;
      confirmedType?: string;
      preferredIntent?: string;
      appendUserMessage?: boolean;
    },
  ) => {
    const activeInterests = currentInterests;

    if (options?.appendUserMessage !== false) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
        messageState: 'sending',
      }]);
    }

    const stream = await apiService.sendChatMessage({
      input: userMessage,
      current_interests: activeInterests,
      preferred_intent: options?.preferredIntent,
      source_context: options?.sourceContext,
      source_content_ref: options?.sourceContentRef,
      source_title: options?.sourceTitle,
      auto_commit: options?.autoCommit,
      confirmed_type: options?.confirmedType,
      append_user_message: options?.appendUserMessage,
    });

    if (!stream) {
      appendChatErrorMessage(setMessages, '消息发送失败，请稍后重试。');
      setChatReadMode('formal');
      return;
    }

    try {
      await readChatEventStream(stream, (streamEvent) => {
        try {
          handleChatStreamEvent(
            streamEvent,
            {
              userMessage,
              sourceContext: options?.sourceContext,
              sourceContentRef: options?.sourceContentRef,
              sourceTitle: options?.sourceTitle,
            },
            {
              setMessages,
              setIntentHint,
              setCurrentSessionId,
              setPendingConfirmation,
              setLatestActionSummary,
              refreshInterestState,
            },
          );
        } catch (handlerError) {
          console.error('SSE event handler error:', handlerError, streamEvent.event, streamEvent.data);
          appendChatErrorMessage(setMessages, '消息处理异常，请稍后重试。');
        }
      });
    } catch (error) {
      console.error('SSE stream error:', error);
      appendChatErrorMessage(setMessages, `连接异常：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [currentInterests, refreshInterestState]);

  const confirmPendingIntent = useCallback(async (confirmedType: string) => {
    if (!pendingConfirmation) return;
    const { userMessage, sourceContext, sourceContentRef, sourceTitle } = pendingConfirmation;
    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: `好的，按「${formatIntentLabel(confirmedType)}」处理。`,
      createdAt: new Date().toISOString(),
      actionType: 'confirmation',
      messageState: 'confirmation',
      confirmedType,
      sourceContext,
    }]);
    setPendingConfirmation(null);

    const response = await apiService.confirmChat({
      user_message: userMessage,
      confirmed_type: confirmedType,
      source_context: sourceContext,
      source_content_ref: sourceContentRef,
      source_title: sourceTitle,
    });

    if (response.error || !response.data) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: response.error ?? '确认执行失败，请稍后重试。',
        createdAt: new Date().toISOString(),
        messageState: 'error',
        actionType: confirmedType,
      }]);
      return;
    }

    const data = response.data;
    const actionSummary = buildActionSummaryFromExecute(data);
    setLatestActionSummary(actionSummary);

    if (actionSummary.actionType === 'add_interest' || actionSummary.actionType === 'remove_interest') {
      void refreshInterestState();
    }

    const correctionFrom = data.affectedEntity?.id !== undefined
      && ['todo', 'note'].includes(data.affectedEntity?.type)
      ? `${data.affectedEntity.type}:${data.affectedEntity.id}`
      : undefined;

    const messageQuickActions = [
      ...(data.suggestedActions ?? []),
      ...buildCorrectionQuickActions(userMessage, data.confirmedType ?? data.actionType, correctionFrom),
    ];

    setMessages((prev) => [...prev, {
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
      sourceContext: data.sourceContext ?? sourceContext,
      nextPageLabel: data.nextPageLabel,
      quickActions: messageQuickActions,
      originalUserMessage: userMessage,
      changeLog: data.changeLog ?? [],
    }]);

    if (data.sessionId != null) {
      setCurrentSessionId(data.sessionId);
    }
  }, [pendingConfirmation, refreshInterestState]);

  const reclassifyMessage = useCallback(async (payload: {
    originalUserMessage: string;
    correctionFrom: string;
    targetIntent: string;
    sourceContext?: string;
  }) => {
    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: `好的，我改成「${formatIntentLabel(payload.targetIntent)}」。`,
      createdAt: new Date().toISOString(),
      actionType: 'reclassify',
      messageState: 'confirmation',
      confirmedType: payload.targetIntent,
      sourceContext: payload.sourceContext,
    }]);

    const response = await apiService.reclassifyChat({
      target_intent: payload.targetIntent,
      correction_from: payload.correctionFrom,
      original_input: payload.originalUserMessage,
      source_context: payload.sourceContext,
    });

    if (response.error || !response.data) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: response.error
          ? `这次纠偏没有成功：${response.error}`
          : '这次纠偏没有成功，当前已保留原结果。请稍后重试。',
        createdAt: new Date().toISOString(),
        actionType: 'reclassify',
        messageState: 'error',
        confirmedType: payload.targetIntent,
        sourceContext: payload.sourceContext,
      }]);
      return;
    }

    const actionSummary = buildActionSummaryFromExecute(response.data);
    setLatestActionSummary(actionSummary);

    const correctionFrom = actionSummary.affectedEntity?.id !== undefined
      && ['todo', 'note'].includes(actionSummary.affectedEntity.type)
      ? `${actionSummary.affectedEntity.type}:${actionSummary.affectedEntity.id}`
      : undefined;
    const messageQuickActions = [
      ...(actionSummary.quickActions ?? []),
      ...buildCorrectionQuickActions(
        payload.originalUserMessage,
        actionSummary.confirmedType ?? actionSummary.actionType,
        correctionFrom,
      ),
    ];
    const reclassifyReply = buildReclassifyReply({
      targetIntent: actionSummary.confirmedType ?? actionSummary.actionType,
      changeLog: actionSummary.changeLog,
      nextPageLabel: actionSummary.nextPageLabel,
      quickActions: messageQuickActions,
    });

    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: reclassifyReply,
      createdAt: new Date().toISOString(),
      actionType: actionSummary.actionType,
      messageState: 'executed',
      confirmedType: actionSummary.confirmedType,
      resultSummary: actionSummary.resultSummary,
      deepLink: actionSummary.deepLink,
      sourceContext: actionSummary.sourceContext ?? payload.sourceContext,
      nextPageLabel: actionSummary.nextPageLabel,
      quickActions: messageQuickActions,
      originalUserMessage: payload.originalUserMessage,
      affectedEntity: actionSummary.affectedEntity,
      changeLog: actionSummary.changeLog,
    }]);
    await refreshSessionState(currentSessionId);
  }, [currentSessionId, refreshSessionState]);

  const deleteMessage = useCallback(async (messageId: number) => {
    const response = await apiService.deleteChatMessage(messageId);
    if (response.error) {
      console.error('Delete message failed:', response.error);
      return;
    }
    void refreshSessionState(currentSessionId);
  }, [currentSessionId, refreshSessionState]);

  return {
    currentSessionId,
    activeSessionSummary,
    sessions,
    isHydrating,
    chatReadError,
    chatReadMode,
    intentHint,
    refreshSessionState,
    switchSession,
    createNewSession,
    messages,
    sendMessage,
    confirmPendingIntent,
    latestActionSummary,
    pendingConfirmation,
    composeMode,
    setComposeMode,
    reclassifyMessage,
    deleteMessage,
  };
}
