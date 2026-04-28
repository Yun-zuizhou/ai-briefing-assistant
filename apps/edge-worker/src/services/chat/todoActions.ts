import { execute } from '../../utils/db'
import {
  parseOpportunityIdFromContentRef,
  resolveOpportunityIdFromCorrection,
  upsertOpportunityFollowFromTodo,
} from './store'
import type { ChatActionResponse } from './types'

export async function executeCreateTodoAction(params: {
  db: D1Database
  userId: number
  input: string
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  sourceContentRef?: string
  sourceTitle?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { db, userId, input, entities, candidateIntents, sourceContext, sourceContentRef, sourceTitle, confirmedType } = params
  const content = String(entities.content || input).substring(0, 200)
  const opportunityId = parseOpportunityIdFromContentRef(sourceContentRef)
  const todoResult = await execute(
    db,
    `
      INSERT INTO todos (
        user_id, content, status, priority, related_type, related_id, related_title, created_at, updated_at
      )
      VALUES (?, ?, 'pending', 'medium', ?, ?, ?, datetime('now'), datetime('now'))
    `,
    [
      userId,
      content,
      opportunityId ? 'opportunity' : null,
      opportunityId,
      opportunityId ? (sourceTitle || null) : null,
    ]
  )

  let resultSummary = `待办内容：${content}`
  if (opportunityId) {
    const followId = await upsertOpportunityFollowFromTodo(db, userId, opportunityId, content)
    try {
      await execute(
        db,
        `
          INSERT INTO opportunity_execution_results (
            user_id, opportunity_id, todo_id, follow_id, result_status, result_note, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, 'planned', ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, opportunity_id, todo_id) DO UPDATE SET
            follow_id = excluded.follow_id,
            result_status = excluded.result_status,
            result_note = excluded.result_note,
            updated_at = datetime('now')
        `,
        [
          userId,
          opportunityId,
          Number(todoResult.meta.last_row_id),
          followId,
          '由机会详情进入对话后创建待办',
        ]
      )
    } catch (error) {
      console.warn('opportunity_execution_results skipped:', error)
    }
    resultSummary = `待办内容：${content}\n已绑定机会：opportunity:${opportunityId}，并进入跟进链路`
  }

  await execute(
    db,
    `
      INSERT INTO history_entries (user_id, event_type, title, summary, ref_type, ref_id, created_at)
      VALUES (?, 'todo_created', '新增待办', ?, ?, ?, datetime('now'))
    `,
    [
      userId,
      `通过对话创建待办：${content.substring(0, 80)}`,
      opportunityId ? 'opportunity' : 'todo',
      opportunityId ?? Number(todoResult.meta.last_row_id),
    ]
  )

  return {
    success: true,
    actionType: 'create_todo',
    candidateIntents,
    requiresConfirmation: false,
    affectedEntity: { type: 'todo', id: todoResult.meta.last_row_id },
    confirmedType: confirmedType || 'create_todo',
    successMessage: '已创建待办',
    resultSummary,
    nextPageLabel: '去待办页查看',
    deepLink: '/todo',
    sourceContext,
  }
}

export async function reclassifyToTodoAction(params: {
  db: D1Database
  userId: number
  correctionFrom: string
  originalInput?: string
  entities: Record<string, unknown>
  sourceContext?: string
}): Promise<ChatActionResponse> {
  const { db, userId, correctionFrom, originalInput, entities, sourceContext } = params
  const content = String(entities.content || originalInput || '').substring(0, 200)
  const relatedOpportunityId = await resolveOpportunityIdFromCorrection(db, userId, correctionFrom)
  const todoResult = await execute(
    db,
    `
      INSERT INTO todos (
        user_id, content, status, priority, related_type, related_id, created_at, updated_at
      )
      VALUES (?, ?, 'pending', 'medium', ?, ?, datetime('now'), datetime('now'))
    `,
    [userId, content, relatedOpportunityId ? 'opportunity' : null, relatedOpportunityId]
  )

  let resultSummary = `待办内容：${content}`
  if (relatedOpportunityId) {
    const followId = await upsertOpportunityFollowFromTodo(db, userId, relatedOpportunityId, content)
    try {
      await execute(
        db,
        `
          INSERT INTO opportunity_execution_results (
            user_id, opportunity_id, todo_id, follow_id, result_status, result_note, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, 'planned', ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, opportunity_id, todo_id) DO UPDATE SET
            follow_id = excluded.follow_id,
            result_status = excluded.result_status,
            result_note = excluded.result_note,
            updated_at = datetime('now')
        `,
        [
          userId,
          relatedOpportunityId,
          Number(todoResult.meta.last_row_id),
          followId,
          '纠偏后创建待办并进入机会跟进链路',
        ]
      )
    } catch (error) {
      console.warn('opportunity_execution_results skipped:', error)
    }
    resultSummary = `待办内容：${content}\n已绑定机会：opportunity:${relatedOpportunityId}`
  }

  return {
    success: true,
    actionType: 'create_todo',
    candidateIntents: ['create_todo'],
    requiresConfirmation: false,
    affectedEntity: { type: 'todo', id: todoResult.meta.last_row_id },
    confirmedType: 'create_todo',
    successMessage: '已创建待办',
    resultSummary,
    nextPageLabel: '去待办页查看',
    deepLink: '/todo',
    sourceContext,
  }
}
