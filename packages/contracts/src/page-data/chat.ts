export interface ChatQuickAction {
  label: string
  action: string
  deepLink?: string
  targetIntent?: string
  correctionFrom?: string
}

export interface ChatSessionSummary {
  sessionId: number
  sessionTitle?: string | null
  status: string
  sourceContext?: string | null
  lastMessageAt?: string | null
  messageCount?: number | null
}

export interface ChatObjectChange {
  entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown'
  entityId?: number | string
  change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed'
  summary: string
}

export type ChatMessageState = 'sending' | 'recognized' | 'pending_confirmation' | 'confirmation' | 'executed' | 'error'

export interface ChatSessionMessage {
  messageId: number
  role: 'assistant' | 'user'
  content: string
  createdAt?: string | null
  messageState?: string | null
  intentType?: string | null
  candidateIntents?: string[]
  confidence?: number | null
  sourceContext?: string | null
  matchedBy?: string | null
  confirmedType?: string | null
  actionType?: string | null
  resultSummary?: string | null
  deepLink?: string | null
  nextPageLabel?: string | null
  affectedEntityType?: string | null
  affectedEntityId?: number | string | null
  changeLog?: ChatObjectChange[]
  clientId?: string
}

export interface ChatSessionMessagesData {
  sessionId: number
  sessionTitle?: string | null
  status: string
  sourceContext?: string | null
  lastMessageAt?: string | null
  messages: ChatSessionMessage[]
}

export interface ChatExecuteAffectedEntity {
  type: 'todo' | 'note' | 'interest' | 'settings' | 'unknown'
  id?: number | string
}

export interface ChatExecuteResult {
  success: boolean
  actionType: string
  candidateIntents?: string[]
  requiresConfirmation?: boolean
  affectedEntity?: ChatExecuteAffectedEntity
  confirmedType?: string
  successMessage: string
  resultSummary?: string
  nextPageLabel?: string
  deepLink?: string
  sourceContext?: string
  quickActions?: ChatQuickAction[]
  changeLog?: ChatObjectChange[]
}

// Chat protocol contracts shared by the Worker route/service and the web client.
// Put request and SSE event shape changes here first, then adapt each endpoint.
export interface ChatMessageStreamRequest {
  input: string
  current_interests?: string[]
  preferred_intent?: string
  source_context?: string
  source_content_ref?: string
  source_title?: string
  auto_commit?: boolean
  confirmed_type?: string
  append_user_message?: boolean
}

export interface ChatConfirmRequest {
  user_message: string
  confirmed_type: string
  source_context?: string
  source_content_ref?: string
  source_title?: string
}

export interface ChatReclassifyRequest {
  target_intent: string
  correction_from: string
  original_input?: string
  source_context?: string
}

export interface ChatIntentAnalysisEvent {
  sessionId: number
  userMessageId?: number
  text: string
  intentType: string
  confidence: number
  candidateIntents: string[]
  sourceContext?: string
  matchedBy?: string
  llmClassified: boolean
  replyHint?: string
  suggestedActions?: ChatQuickAction[]
}

export interface ChatPendingConfirmationEvent {
  sessionId: number
  messageId: number
  userMessageId?: number
  candidateIntents: string[]
  userMessage: string
}

export interface ChatExecutionResultEvent {
  sessionId: number
  messageId: number
  userMessageId?: number
  text: string
  success: boolean
  actionType: string
  confirmedType?: string
  resultSummary?: string
  deepLink?: string
  nextPageLabel?: string
  affectedEntity?: {
    type?: string
    id?: number | string
  }
  suggestedActions?: ChatQuickAction[]
  quickActions?: ChatQuickAction[]
  changeLog?: ChatObjectChange[]
  llmReplyGenerated: boolean
}

export interface ChatErrorEvent {
  message: string
}

export type ChatDoneEvent = Record<string, never>

export interface ChatStreamEventPayloadMap {
  intent_analysis: ChatIntentAnalysisEvent
  pending_confirmation: ChatPendingConfirmationEvent
  execution_result: ChatExecutionResultEvent
  error: ChatErrorEvent
  done: ChatDoneEvent
}

export type ChatStreamEventName = keyof ChatStreamEventPayloadMap

export type ChatStreamEvent = {
  [EventName in ChatStreamEventName]: {
    event: EventName
    data: ChatStreamEventPayloadMap[EventName]
  }
}[ChatStreamEventName]
