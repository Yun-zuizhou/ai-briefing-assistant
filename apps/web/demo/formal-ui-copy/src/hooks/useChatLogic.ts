import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseIntent } from '../utils/intentParser';
import type { Interest, ParsedIntent } from '../utils/intentParser';
import { apiService } from '../services/api';
import type { IntentResponse } from '../services/api';
import type {
  ChatExecuteResult,
  ChatObjectChange,
  ChatQuickAction,
  ChatSessionMessage,
  ChatSessionMessagesData,
  ChatSessionSummary,
} from '../types/page-data';
import type { IntentType } from '../utils/intentParser';

type PersistedChatRole = 'user' | 'assistant';

interface PersistedChatMessage {
  id: number;
  role: PersistedChatRole;
  content: string;
  createdAt: string;
  intentType?: IntentType;
  actionType?: string;
  messageState?: 'recognized' | 'intent_analysis' | 'pending_confirmation' | 'confirmation' | 'executed';
  confirmedType?: string;
  resultSummary?: string;
  deepLink?: string;
  candidateIntents?: string[];
  confidence?: number;
  sourceContext?: string;
  matchedBy?: string;
  nextPageLabel?: string;
  quickActions?: ChatQuickAction[];
  originalUserMessage?: string;
  affectedEntity?: {
    type: string;
    id?: number | string;
  };
  changeLog?: ChatObjectChange[];
}

interface PersistedChatState {
  currentSessionId: number | null;
  messages: PersistedChatMessage[];
}

const CHAT_STORAGE_KEY = 'jianbao_chat_state_v1';

function loadPersistedChatState(): PersistedChatState {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedChatState;
      if (parsed && 'currentSessionId' in parsed && Array.isArray(parsed.messages)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load chat state:', error);
  }

  return {
    currentSessionId: null,
    messages: [],
  };
}

function persistChatState(state: PersistedChatState): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist chat state:', error);
  }
}

function convertIntentResponse(response: IntentResponse): ParsedIntent {
  return {
    type: response.type,
    entities: response.entities,
    confidence: response.confidence,
    matchedBy: response.matchedBy,
  };
}

interface ActionSummary {
  success: boolean;
  actionType: string;
  successMessage: string;
  resultSummary?: string;
  deepLink?: string;
  nextPageLabel?: string;
  candidateIntents?: string[];
  requiresConfirmation?: boolean;
  confirmedType?: string;
  sourceContext?: string;
  quickActions?: Array<{
    label: string;
    action: string;
    deepLink?: string;
    targetIntent?: string;
    correctionFrom?: string;
  }>;
  affectedEntity?: {
    type: string;
    id?: number | string;
  };
  changeLog?: ChatObjectChange[];
}

interface PendingConfirmation {
  userMessage: string;
  candidateIntents: string[];
  sourceContext?: string;
  sourceContentRef?: string;
  sourceTitle?: string;
}

type ComposeMode = 'smart' | 'create_todo' | 'record_thought' | 'fragmented_thought' | 'chat_only';
type ChatReadMode = 'formal' | 'cache' | 'empty';
type ChatMessageState = 'recognized' | 'intent_analysis' | 'pending_confirmation' | 'confirmation' | 'executed';

function formatIntentLabel(intent: string) {
  switch (intent) {
    case 'create_todo':
      return '记成待办';
    case 'record_thought':
      return '记录想法';
    case 'fragmented_thought':
      return '记成碎片';
    case 'chat_only':
      return '只聊天';
    case 'add_interest':
      return '更新关注';
    case 'remove_interest':
      return '移除关注';
    case 'set_push_time':
      return '调整推送时间';
    default:
      return intent;
  }
}

function buildExecuteFailureSummary(intent: ParsedIntent, sourceContext?: string): ActionSummary {
  return {
    success: false,
    actionType: intent.type,
    successMessage: '这次没能写入正式数据',
    resultSummary: '系统已停止使用前端本地回退，请稍后重试或检查正式后端链路。',
    candidateIntents: [intent.type],
    confirmedType: intent.type,
    sourceContext,
  };
}

function buildActionSummaryFromExecute(result: ChatExecuteResult): ActionSummary {
  return {
    success: result.success,
    actionType: result.actionType,
    successMessage: result.successMessage,
    resultSummary: result.resultSummary,
    deepLink: result.deepLink,
    nextPageLabel: result.nextPageLabel,
    candidateIntents: result.candidateIntents,
    requiresConfirmation: result.requiresConfirmation,
    confirmedType: result.confirmedType,
    sourceContext: result.sourceContext,
    quickActions: result.quickActions,
    affectedEntity: result.affectedEntity,
    changeLog: result.changeLog,
  };
}

function buildAssistantReplyFromActionSummary(summary: ActionSummary): string {
  const lines: string[] = [];
  if (summary.success) {
    lines.push(`我已经帮你${summary.successMessage.replace(/^已/, '')}。`);
  } else {
    lines.push(summary.successMessage);
  }

  if (summary.confirmedType && !summary.requiresConfirmation) {
    lines.push('');
    lines.push(`这次我是按“${formatIntentLabel(summary.confirmedType)}”处理的。`);
  }

  if (summary.resultSummary) {
    lines.push('');
    lines.push(summary.resultSummary);
  }

  if (summary.nextPageLabel) {
    lines.push('');
    lines.push(`如果你现在想继续，可以直接去“${summary.nextPageLabel}”。`);
  }

  if (summary.quickActions && summary.quickActions.length > 0) {
    lines.push('');
    lines.push(`如果不是这个意思，你也可以马上改成：${summary.quickActions.map((item) => item.label).join(' / ')}。`);
  }

  return lines.join('\n');
}

function buildReclassifyReply(params: {
  targetIntent: string;
  changeLog?: ChatObjectChange[];
  nextPageLabel?: string;
  quickActions?: Array<{
    label: string;
    action: string;
    deepLink?: string;
    targetIntent?: string;
    correctionFrom?: string;
  }>;
}) {
  const lines: string[] = [];
  const targetLabel = formatIntentLabel(params.targetIntent);
  const cancelled = params.changeLog?.find((item) => item.change === 'cancelled');
  const kept = params.changeLog?.find((item) => item.change === 'kept');
  const created = params.changeLog?.find((item) => item.change === 'created');
  const retagged = params.changeLog?.find((item) => item.change === 'retagged');

  if (params.targetIntent === 'record_thought' || params.targetIntent === 'fragmented_thought') {
    lines.push(`我已经把这条改成“${targetLabel}”。`);
    if (cancelled) {
      lines.push(`原来的内容我已经取消：${cancelled.summary}。`);
    }
    if (created) {
      lines.push(`新的内容我已经补好了：${created.summary}。`);
    }
  } else if (params.targetIntent === 'create_todo') {
    lines.push('我已经把这条改成“记成待办”。');
    if (kept) {
      lines.push(`原来的内容我先帮你保留：${kept.summary}。`);
    }
    if (created) {
      lines.push(`新的待办我已经补好了：${created.summary}。`);
    }
  } else if (params.targetIntent === 'chat_only') {
    lines.push('我已经改成“只聊天”。');
    if (cancelled) {
      lines.push(`原来的结构化结果我已经取消：${cancelled.summary}。`);
    } else if (kept) {
      lines.push(`原来的内容我先保留：${kept.summary}。`);
    }
  } else if (retagged) {
    lines.push(`我已经按“${targetLabel}”重新整理这条内容。`);
    lines.push(`${retagged.summary}。`);
  } else {
    lines.push(`我已经按“${targetLabel}”重新处理这条内容。`);
  }

  if (params.nextPageLabel) {
    lines.push(`如果你现在想继续，可以直接去“${params.nextPageLabel}”。`);
  }

  if (params.quickActions && params.quickActions.length > 0) {
    lines.push(`如果还是不对，你也可以继续改成：${params.quickActions.map((item) => item.label).join(' / ')}。`);
  }

  return lines.join('\n');
}

function buildCorrectionQuickActions(userMessage: string, currentType?: string, correctionFrom?: string) {
  const supportedCurrentTypes = new Set(['create_todo', 'record_thought', 'fragmented_thought', 'chat_only']);
  if (!currentType || !supportedCurrentTypes.has(currentType)) {
    return [];
  }

  const candidates = [
    { label: '改成待办', targetIntent: 'create_todo' },
    { label: '改成记录', targetIntent: 'record_thought' },
    { label: '改成碎片', targetIntent: 'fragmented_thought' },
    { label: '改成仅聊天', targetIntent: 'chat_only' },
  ];

  return candidates
    .filter((item) => item.targetIntent !== currentType)
    .map((item) => ({
      label: item.label,
      action: userMessage,
      targetIntent: item.targetIntent,
      correctionFrom,
    }));
}

function buildIntentAnalysisMessage(params: {
  intentType: string;
  confidence: number;
  candidateIntents?: string[];
  sourceContext?: string;
  matchedBy?: string;
}): string {
  const lines: string[] = [];
  lines.push(`我先理解成“${formatIntentLabel(params.intentType)}”。`);

  if (params.candidateIntents && params.candidateIntents.length > 0) {
    const readableCandidates = params.candidateIntents.map((item) => formatIntentLabel(item));
    lines.push(`也可能是：${readableCandidates.join(' / ')}。`);
  }

  if (params.confidence < 0.9) {
    lines.push('这条我还不够确定，接下来会请你确认一下。');
  } else {
    lines.push('如果不是这个意思，你也可以马上改。');
  }
  return lines.join('\n');
}

function toChatMessageState(value?: string | null): ChatMessageState | undefined {
  if (!value) return undefined;
  if (value === 'recognized' || value === 'intent_analysis' || value === 'pending_confirmation' || value === 'confirmation' || value === 'executed') {
    return value;
  }
  return undefined;
}

function buildActionSummaryFromPersistedMessage(message: PersistedChatMessage): ActionSummary | null {
  if (!message.actionType && !message.confirmedType && !message.messageState) {
    return null;
  }
  return {
    success: message.messageState !== 'pending_confirmation',
    actionType: message.actionType ?? message.confirmedType ?? 'chat',
    successMessage: (message.content?.split('\n')[0]) || '已处理当前输入',
    resultSummary: message.resultSummary,
    deepLink: message.deepLink,
    nextPageLabel: message.nextPageLabel,
    candidateIntents: message.candidateIntents,
    requiresConfirmation: message.messageState === 'pending_confirmation',
    confirmedType: message.confirmedType,
    sourceContext: message.sourceContext,
    quickActions: message.quickActions,
    affectedEntity: message.affectedEntity,
    changeLog: message.changeLog,
  };
}

function buildPersistedMessagesFromSession(data: ChatSessionMessagesData): PersistedChatMessage[] {
  let latestUserMessage = '';
  return data.messages.map((message: ChatSessionMessage) => {
    if (message.role === 'user') {
      latestUserMessage = message.content;
    }

    const affectedEntity = message.affectedEntityType
      ? {
          type: message.affectedEntityType,
          id: message.affectedEntityId ?? undefined,
        }
      : undefined;

    const correctionFrom = affectedEntity?.id !== undefined
      && ['todo', 'note'].includes(affectedEntity.type)
      ? `${affectedEntity.type}:${affectedEntity.id}`
      : undefined;

    const quickActions = message.role === 'assistant'
      ? buildCorrectionQuickActions(
          latestUserMessage,
          message.confirmedType ?? message.actionType ?? undefined,
          correctionFrom,
        )
      : undefined;

    return {
      id: message.messageId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ?? new Date().toISOString(),
      intentType: (message.intentType ?? undefined) as IntentType | undefined,
      actionType: message.actionType ?? undefined,
      messageState: toChatMessageState(message.messageState),
      confirmedType: message.confirmedType ?? undefined,
      resultSummary: message.resultSummary ?? undefined,
      deepLink: message.deepLink ?? undefined,
      candidateIntents: message.candidateIntents ?? [],
      confidence: message.confidence ?? undefined,
      sourceContext: message.sourceContext ?? undefined,
      matchedBy: message.matchedBy ?? undefined,
      nextPageLabel: message.nextPageLabel ?? undefined,
      quickActions,
      originalUserMessage: message.role === 'assistant' ? latestUserMessage : undefined,
      affectedEntity,
      changeLog: message.changeLog ?? [],
    };
  });
}

function toInterestState(interests: string[]): Interest[] {
  return interests.map((name, index) => ({
    id: `${index}-${name}`,
    name,
    icon: '📌',
    active: true,
    frequency: 'daily',
  }));
}

export function useChatLogic() {
  const persistedChatState = useMemo(() => loadPersistedChatState(), []);
  const [currentInterests, setCurrentInterests] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(persistedChatState.currentSessionId);
  const [messages, setMessages] = useState<PersistedChatMessage[]>(persistedChatState.messages);
  const [latestIntent, setLatestIntent] = useState<ParsedIntent | null>(null);
  const [latestActionSummary, setLatestActionSummary] = useState<ActionSummary | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [composeMode, setComposeMode] = useState<ComposeMode>('smart');
  const [activeSessionSummary, setActiveSessionSummary] = useState<ChatSessionSummary | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [chatReadError, setChatReadError] = useState<string | null>(null);
  const [chatReadMode, setChatReadMode] = useState<ChatReadMode>(persistedChatState.messages.length > 0 ? 'cache' : 'empty');

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

  const updateMessages = useCallback((updater: (prev: PersistedChatMessage[]) => PersistedChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      persistChatState({
        currentSessionId,
        messages: next,
      });
      return next;
    });
  }, [currentSessionId]);

  const refreshSessionState = useCallback(async (preferredSessionId?: number | null) => {
    setIsHydrating(true);
    setChatReadError(null);
    try {
      const sessionsResponse = await apiService.getChatSessions();
      if (sessionsResponse.error) {
        throw new Error(sessionsResponse.error);
      }

      const sessions = sessionsResponse.data ?? [];
      if (sessions.length === 0) {
        setCurrentSessionId(null);
        setActiveSessionSummary(null);
        setPendingConfirmation(null);
        setLatestActionSummary(null);
        setMessages([]);
        persistChatState({
          currentSessionId: null,
          messages: [],
        });
        setChatReadMode('empty');
        return;
      }

      const resolvedSession = sessions.find((item) => item.sessionId === preferredSessionId)
        ?? sessions[0];
      const messagesResponse = await apiService.getChatSessionMessages(resolvedSession.sessionId);
      if (messagesResponse.error || !messagesResponse.data) {
        throw new Error(messagesResponse.error ?? '读取正式会话消息失败');
      }

      const nextMessages = buildPersistedMessagesFromSession(messagesResponse.data);
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
              sourceContext: pendingMessage.sourceContext,
            }
          : null,
      );
      setLatestActionSummary(lastAssistantMessage ? buildActionSummaryFromPersistedMessage(lastAssistantMessage) : null);
      persistChatState({
        currentSessionId: resolvedSession.sessionId,
        messages: nextMessages,
      });
      setChatReadMode('formal');
    } catch (error) {
      console.error('Failed to hydrate formal chat session:', error);
      setChatReadError(error instanceof Error ? error.message : '读取正式会话失败');
      setActiveSessionSummary(null);
      setChatReadMode(persistedChatState.messages.length > 0 ? 'cache' : 'empty');
    } finally {
      setIsHydrating(false);
    }
  }, [persistedChatState.messages.length]);

  useEffect(() => {
    void refreshSessionState(currentSessionId);
  }, [currentSessionId, refreshSessionState]);

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
    const fallbackInterests = toInterestState(activeInterests);

    if (options?.appendUserMessage !== false) {
      updateMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
        messageState: 'recognized',
      }]);
    }
    
    let intent: ParsedIntent;
    let recognitionMeta: IntentResponse | null = null;
    
    try {
      const response = await apiService.recognizeIntent(userMessage, activeInterests);
      
      if (response.data) {
        recognitionMeta = response.data;
        intent = convertIntentResponse(response.data);
      } else {
        console.warn('Backend intent recognition failed, falling back to local:', response.error);
        intent = parseIntent(userMessage, fallbackInterests);
      }
    } catch (error) {
      console.error('Intent recognition error, falling back to local:', error);
      intent = parseIntent(userMessage, fallbackInterests);
    }
    
    setLatestIntent(intent);

    updateMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: buildIntentAnalysisMessage({
        intentType: intent.type,
        confidence: recognitionMeta?.confidence ?? intent.confidence,
        candidateIntents: recognitionMeta?.candidateIntents ?? [intent.type],
        sourceContext: recognitionMeta?.sourceContext ?? options?.sourceContext,
        matchedBy: recognitionMeta?.matchedBy ?? intent.matchedBy,
      }),
      createdAt: new Date().toISOString(),
      intentType: intent.type,
      messageState: 'intent_analysis',
      candidateIntents: recognitionMeta?.candidateIntents ?? [intent.type],
      confidence: recognitionMeta?.confidence ?? intent.confidence,
      sourceContext: recognitionMeta?.sourceContext ?? options?.sourceContext,
      matchedBy: recognitionMeta?.matchedBy ?? intent.matchedBy,
    }]);

    let actionSummary: ActionSummary | null = null;
    let assistantResponse: string | null = null;

    try {
      const executeResponse = await apiService.executeChat({
        input: userMessage,
        current_interests: activeInterests,
        source_context: options?.sourceContext,
        source_content_ref: options?.sourceContentRef,
        source_title: options?.sourceTitle,
        auto_commit: options?.autoCommit,
        confirmed_type: options?.confirmedType,
        preferred_intent: options?.preferredIntent,
      });

      if (executeResponse.data) {
        actionSummary = buildActionSummaryFromExecute(executeResponse.data);
        if (actionSummary.requiresConfirmation) {
          setPendingConfirmation({
            userMessage,
            candidateIntents: actionSummary.candidateIntents ?? [],
            sourceContext: actionSummary.sourceContext ?? options?.sourceContext,
            sourceContentRef: options?.sourceContentRef,
            sourceTitle: options?.sourceTitle,
          });
        } else {
          setPendingConfirmation(null);
        }
        assistantResponse = buildAssistantReplyFromActionSummary(actionSummary);
      }
    } catch (error) {
      console.error('Chat execute error:', error);
    }

    if (!actionSummary) {
      actionSummary = buildExecuteFailureSummary(intent, options?.sourceContext);
      setPendingConfirmation(null);
      assistantResponse = buildAssistantReplyFromActionSummary(actionSummary);
    }

    setLatestActionSummary(actionSummary);
    if (actionSummary.actionType === 'add_interest' || actionSummary.actionType === 'remove_interest') {
      void refreshInterestState();
    }
    if (!assistantResponse) {
      assistantResponse = '这次没有拿到正式执行结果，请稍后重试。';
    }

    const correctionFrom = actionSummary.affectedEntity?.id !== undefined
      && ['todo', 'note'].includes(actionSummary.affectedEntity.type)
      ? `${actionSummary.affectedEntity.type}:${actionSummary.affectedEntity.id}`
      : undefined;

    const messageQuickActions = [
      ...(actionSummary.quickActions ?? []),
      ...buildCorrectionQuickActions(userMessage, actionSummary.confirmedType ?? actionSummary.actionType, correctionFrom),
    ];

    updateMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: assistantResponse,
      createdAt: new Date().toISOString(),
      intentType: intent.type,
      actionType: actionSummary.actionType,
      messageState: actionSummary.requiresConfirmation ? 'pending_confirmation' : 'executed',
      confirmedType: actionSummary.confirmedType,
      resultSummary: actionSummary.resultSummary,
      deepLink: actionSummary.deepLink,
      candidateIntents: actionSummary.candidateIntents,
      sourceContext: actionSummary.sourceContext ?? options?.sourceContext,
      nextPageLabel: actionSummary.nextPageLabel,
      quickActions: messageQuickActions,
      originalUserMessage: userMessage,
      affectedEntity: actionSummary.affectedEntity,
      changeLog: actionSummary.changeLog,
    }]);

    if (actionSummary.success) {
      await refreshSessionState(currentSessionId);
    } else {
      setChatReadMode('cache');
      setActiveSessionSummary(null);
    }
    
    return intent;
  }, [currentInterests, currentSessionId, refreshInterestState, refreshSessionState, updateMessages]);

  const confirmPendingIntent = useCallback(async (confirmedType: string) => {
    if (!pendingConfirmation) return;
    updateMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: `好，我就按“${formatIntentLabel(confirmedType)}”继续处理。\n我不会再重新问你这条输入的类型。`,
      createdAt: new Date().toISOString(),
      actionType: 'confirmation',
      messageState: 'confirmation',
      confirmedType,
      sourceContext: pendingConfirmation.sourceContext,
    }]);
    await sendMessage(pendingConfirmation.userMessage, {
      sourceContext: pendingConfirmation.sourceContext,
      sourceContentRef: pendingConfirmation.sourceContentRef,
      sourceTitle: pendingConfirmation.sourceTitle,
      autoCommit: true,
      confirmedType,
      appendUserMessage: false,
    });
    setPendingConfirmation(null);
  }, [pendingConfirmation, sendMessage, updateMessages]);

  const reclassifyMessage = useCallback(async (payload: {
    originalUserMessage: string;
    correctionFrom: string;
    targetIntent: string;
    sourceContext?: string;
  }) => {
    updateMessages((prev) => [...prev, {
      id: Date.now(),
      role: 'assistant',
      content: `好，我准备把这条改成“${formatIntentLabel(payload.targetIntent)}”。\n我会先处理旧结果，再把新的结果告诉你。`,
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

    if (!response.data) {
      updateMessages((prev) => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: '这次纠偏没有成功，当前已保留原结果。请稍后重试。',
        createdAt: new Date().toISOString(),
        actionType: 'reclassify',
        messageState: 'executed',
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

    updateMessages((prev) => [...prev, {
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
  }, [currentSessionId, refreshSessionState, updateMessages]);

  return {
    currentSessionId,
    activeSessionSummary,
    isHydrating,
    chatReadError,
    chatReadMode,
    refreshSessionState,
    messages,
    sendMessage,
    confirmPendingIntent,
    latestIntent,
    latestActionSummary,
    pendingConfirmation,
    composeMode,
    setComposeMode,
    reclassifyMessage,
  };
}
