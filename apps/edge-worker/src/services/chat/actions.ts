import { executeInterestAction } from './interestActions'
import { executeRecordThoughtAction, reclassifyToNoteAction } from './noteActions'
import { executeQueryStatsAction, executeSetPushTimeAction } from './settingsActions'
import { executeCreateTodoAction, reclassifyToTodoAction } from './todoActions'
import type { ChatActionResponse } from './types'

export type { ChatActionResponse, ChatAffectedEntity } from './types'

export function buildPendingConfirmationResponse(params: {
  actionType: string
  candidateIntents: string[]
  confirmedType?: string
  sourceContext?: string
}): ChatActionResponse {
  return {
    success: true,
    actionType: params.actionType,
    candidateIntents: params.candidateIntents,
    requiresConfirmation: true,
    affectedEntity: null,
    confirmedType: params.confirmedType,
    successMessage: '当前输入已进入待确认状态',
    resultSummary: '系统已保留候选意图与建议载荷，等待前端确认后再正式写库。',
    sourceContext: params.sourceContext,
  }
}

export async function executeConfirmedChatAction(params: {
  db: D1Database
  userId: number
  input: string
  intentType: string
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  sourceContentRef?: string
  sourceTitle?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { intentType } = params

  if (intentType === 'chat_only') {
    return {
      success: true,
      actionType: intentType,
      candidateIntents: params.candidateIntents,
      requiresConfirmation: false,
      affectedEntity: null,
      confirmedType: params.confirmedType || intentType,
      successMessage: '当前内容仅作为聊天处理',
      resultSummary: '这次不会写入待办、记录或关注，只保留对话反馈。',
      sourceContext: params.sourceContext,
    }
  }

  if (intentType === 'create_todo') {
    return executeCreateTodoAction(params)
  }

  if (intentType === 'record_thought' || intentType === 'fragmented_thought') {
    return executeRecordThoughtAction({
      db: params.db,
      userId: params.userId,
      input: params.input,
      intentType,
      entities: params.entities,
      candidateIntents: params.candidateIntents,
      sourceContext: params.sourceContext,
      confirmedType: params.confirmedType,
    })
  }

  if (intentType === 'add_interest' || intentType === 'remove_interest') {
    return executeInterestAction({
      db: params.db,
      userId: params.userId,
      intentType,
      entities: params.entities,
      candidateIntents: params.candidateIntents,
      sourceContext: params.sourceContext,
      confirmedType: params.confirmedType,
    })
  }

  if (intentType === 'set_push_time') {
    return executeSetPushTimeAction({
      db: params.db,
      userId: params.userId,
      entities: params.entities,
      candidateIntents: params.candidateIntents,
      sourceContext: params.sourceContext,
      confirmedType: params.confirmedType,
    })
  }

  if (intentType === 'query_stats') {
    return executeQueryStatsAction({
      db: params.db,
      userId: params.userId,
      entities: params.entities,
      candidateIntents: params.candidateIntents,
      sourceContext: params.sourceContext,
      confirmedType: params.confirmedType,
    })
  }

  return {
    success: true,
    actionType: intentType,
    candidateIntents: params.candidateIntents,
    requiresConfirmation: false,
    affectedEntity: null,
    confirmedType: params.confirmedType || intentType,
    successMessage: '已处理当前输入',
    sourceContext: params.sourceContext,
  }
}

export async function reclassifyChatAction(params: {
  db: D1Database
  userId: number
  targetIntent: string
  correctionFrom: string
  originalInput?: string
  sourceContext?: string
  entities: Record<string, unknown>
}): Promise<ChatActionResponse> {
  const { targetIntent } = params

  if (targetIntent === 'chat_only') {
    return {
      success: true,
      actionType: targetIntent,
      candidateIntents: [targetIntent],
      requiresConfirmation: false,
      affectedEntity: null,
      confirmedType: targetIntent,
      successMessage: '当前内容仅作为聊天处理',
      resultSummary: '这次不会写入待办、记录或关注，只保留对话反馈。',
      sourceContext: params.sourceContext,
    }
  }

  if (targetIntent === 'create_todo') {
    return reclassifyToTodoAction(params)
  }

  if (targetIntent === 'record_thought' || targetIntent === 'fragmented_thought') {
    return reclassifyToNoteAction({
      db: params.db,
      userId: params.userId,
      targetIntent,
      originalInput: params.originalInput,
      entities: params.entities,
      sourceContext: params.sourceContext,
    })
  }

  if (targetIntent === 'add_interest' || targetIntent === 'remove_interest') {
    return executeInterestAction({
      db: params.db,
      userId: params.userId,
      intentType: targetIntent,
      entities: params.entities,
      candidateIntents: [targetIntent],
      sourceContext: params.sourceContext,
      confirmedType: targetIntent,
    })
  }

  return {
    success: true,
    actionType: targetIntent,
    candidateIntents: [targetIntent],
    requiresConfirmation: false,
    affectedEntity: null,
    confirmedType: targetIntent,
    successMessage: '已处理当前输入',
    sourceContext: params.sourceContext,
  }
}
