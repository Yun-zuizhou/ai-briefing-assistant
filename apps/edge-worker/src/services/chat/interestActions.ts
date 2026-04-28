import { execute } from '../../utils/db'
import type { ChatActionResponse } from './types'

export async function executeInterestAction(params: {
  db: D1Database
  userId: number
  intentType: 'add_interest' | 'remove_interest'
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { db, userId, intentType, entities, candidateIntents, sourceContext, confirmedType } = params

  const interests = Array.isArray(entities.interests) ? entities.interests : []

  if (intentType === 'add_interest') {
    for (const interest of interests) {
      await execute(
        db,
        `INSERT OR REPLACE INTO user_interests (user_id, interest_name, status, created_at) VALUES (?, ?, 'active', datetime('now'))`,
        [userId, String(interest)]
      )
    }
    await execute(
      db,
      `
        INSERT INTO history_entries (user_id, event_type, title, summary, created_at)
        VALUES (?, 'interest_added', '新增关注', ?, datetime('now'))
      `,
      [userId, `新增关注：${interests.join('、')}`]
    )
    return {
      success: true,
      actionType: intentType,
      candidateIntents,
      requiresConfirmation: false,
      affectedEntity: { type: 'interest' },
      confirmedType: confirmedType || intentType,
      successMessage: '已更新关注内容',
      resultSummary: `新增关注：${interests.join('、')}`,
      nextPageLabel: '返回今日页查看推荐变化',
      deepLink: '/today',
      sourceContext,
    }
  }

  for (const interest of interests) {
    await execute(
      db,
      `UPDATE user_interests SET status = 'inactive' WHERE user_id = ? AND interest_name = ?`,
      [userId, String(interest)]
    )
  }
  await execute(
    db,
    `
      INSERT INTO history_entries (user_id, event_type, title, summary, created_at)
      VALUES (?, 'interest_removed', '移除关注', ?, datetime('now'))
    `,
    [userId, `移除关注：${interests.join('、')}`]
  )
  return {
    success: true,
    actionType: intentType,
    candidateIntents,
    requiresConfirmation: false,
    affectedEntity: { type: 'interest' },
    confirmedType: confirmedType || intentType,
    successMessage: '已移除关注内容',
    resultSummary: `移除关注：${interests.join('、')}`,
    nextPageLabel: '返回今日页查看推荐变化',
    deepLink: '/today',
    sourceContext,
  }
}
