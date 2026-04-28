import { execute } from '../../utils/db'
import type { ChatActionResponse } from './types'

export async function executeRecordThoughtAction(params: {
  db: D1Database
  userId: number
  input: string
  intentType: 'record_thought' | 'fragmented_thought'
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { db, userId, input, intentType, entities, candidateIntents, sourceContext, confirmedType } = params
  const content = String(entities.content || input)
  const tags = Array.isArray(entities.tags) ? JSON.stringify(entities.tags) : '[]'
  const noteResult = await execute(
    db,
    `INSERT INTO notes (user_id, content, tags, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [userId, content, tags]
  )
  await execute(
    db,
    `
      INSERT INTO history_entries (user_id, event_type, title, summary, ref_type, ref_id, created_at)
      VALUES (?, 'note_created', '新增记录', ?, 'note', ?, datetime('now'))
    `,
    [userId, '通过对话记录想法', Number(noteResult.meta.last_row_id)]
  )

  return {
    success: true,
    actionType: intentType,
    candidateIntents,
    requiresConfirmation: false,
    affectedEntity: { type: 'note', id: noteResult.meta.last_row_id },
    confirmedType: confirmedType || intentType,
    successMessage: '已记录你的想法',
    resultSummary: content.substring(0, 80),
    nextPageLabel: '去日志页查看',
    deepLink: '/log',
    sourceContext,
  }
}

export async function reclassifyToNoteAction(params: {
  db: D1Database
  userId: number
  targetIntent: 'record_thought' | 'fragmented_thought'
  originalInput?: string
  entities: Record<string, unknown>
  sourceContext?: string
}): Promise<ChatActionResponse> {
  const { db, userId, targetIntent, originalInput, entities, sourceContext } = params
  const content = String(entities.content || originalInput || '')
  const tags = Array.isArray(entities.tags) ? JSON.stringify(entities.tags) : '[]'
  const noteResult = await execute(
    db,
    `INSERT INTO notes (user_id, content, tags, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [userId, content, tags]
  )

  return {
    success: true,
    actionType: targetIntent,
    candidateIntents: [targetIntent],
    requiresConfirmation: false,
    affectedEntity: { type: 'note', id: noteResult.meta.last_row_id },
    confirmedType: targetIntent,
    successMessage: '已记录你的想法',
    resultSummary: content.substring(0, 80),
    nextPageLabel: '去日志页查看',
    deepLink: '/log',
    sourceContext,
  }
}
