import type {
  ChatExecuteResult,
  ChatMessageState,
  ChatObjectChange,
  ChatQuickAction,
  ChatSessionMessage,
  ChatSessionMessagesData,
} from '../../types/page-data';
import { formatIntentLabel } from '../../utils/intentLabels';

// ── Types ──────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  clientId?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string | null;
  messageState?: ChatMessageState | null;
  intentType?: string | null;
  actionType?: string | null;
  confirmedType?: string | null;
  resultSummary?: string | null;
  deepLink?: string | null;
  candidateIntents?: string[];
  confidence?: number | null;
  sourceContext?: string | null;
  matchedBy?: string | null;
  nextPageLabel?: string | null;
  quickActions?: ChatQuickAction[];
  originalUserMessage?: string;
  affectedEntity?: { type: string; id?: number | string };
  changeLog?: ChatObjectChange[];
}

export interface ActionSummary {
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

// Re-export the canonical type from contracts (no local redefinition needed)
export type { ChatMessageState } from '../../types/page-data';

// ── Pure functions ─────────────────────────────────────────

export function buildActionSummaryFromExecute(result: ChatExecuteResult): ActionSummary {
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

export function buildReclassifyReply(params: {
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
  const targetLabel = formatIntentLabel(params.targetIntent);
  return `已改为「${targetLabel}」。`;
}

export function buildCorrectionQuickActions(userMessage: string, currentType?: string, correctionFrom?: string) {
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

export function toChatMessageState(value?: string | null): ChatMessageState | undefined {
  if (!value) return undefined;
  const validStates = new Set<string>(['recognized', 'pending_confirmation', 'confirmation', 'executed', 'error']);
  return validStates.has(value) ? (value as ChatMessageState) : undefined;
}

export function buildActionSummaryFromMessage(message: ChatMessage): ActionSummary | null {
  if (!message.actionType && !message.confirmedType && !message.messageState) {
    return null;
  }
  return {
    success: message.messageState !== 'pending_confirmation',
    actionType: message.actionType ?? message.confirmedType ?? 'chat',
    successMessage: (message.content?.split('\n')[0]) || '已处理当前输入',
    resultSummary: message.resultSummary ?? undefined,
    deepLink: message.deepLink ?? undefined,
    nextPageLabel: message.nextPageLabel ?? undefined,
    candidateIntents: message.candidateIntents ?? undefined,
    requiresConfirmation: message.messageState === 'pending_confirmation',
    confirmedType: message.confirmedType ?? undefined,
    sourceContext: message.sourceContext ?? undefined,
    quickActions: message.quickActions,
    affectedEntity: message.affectedEntity,
    changeLog: message.changeLog,
  };
}

export function buildMessagesFromSession(data: ChatSessionMessagesData): ChatMessage[] {
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
      role: message.role as 'user' | 'assistant',
      content: message.content,
      createdAt: message.createdAt ?? new Date().toISOString(),
      intentType: message.intentType ?? undefined,
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
