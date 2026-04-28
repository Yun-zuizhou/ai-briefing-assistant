import { execute } from '../../utils/db'
import { buildStatsSummary, ensureUserSettingsRow, getProfileCounts, upsertMorningSchedule } from '../behavior'
import type { ChatActionResponse } from './types'

export async function executeSetPushTimeAction(params: {
  db: D1Database
  userId: number
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { db, userId, entities, candidateIntents, sourceContext, confirmedType } = params
  const timeValue = String(entities.time || '08:00')
  await ensureUserSettingsRow(db, userId)
  await execute(
    db,
    `UPDATE user_settings SET morning_brief_time = ?, updated_at = datetime('now') WHERE user_id = ?`,
    [timeValue, userId]
  )
  await execute(
    db,
    `INSERT INTO history_entries (user_id, event_type, title, summary, created_at) VALUES (?, 'push_time_requested', '推送时间调整请求', ?, datetime('now'))`,
    [userId, `请求将推送时间调整为 ${timeValue}`]
  )
  await upsertMorningSchedule(db, userId, timeValue, 'chat_set_push_time')

  return {
    success: true,
    actionType: 'set_push_time',
    candidateIntents,
    requiresConfirmation: false,
    affectedEntity: { type: 'settings' },
    confirmedType: confirmedType || 'set_push_time',
    successMessage: '已记录你的推送时间调整请求',
    resultSummary: `当前请求时间：${timeValue}\n已写入调度事实层，等待调度执行`,
    nextPageLabel: '去通知设置查看',
    deepLink: '/notification-settings',
    sourceContext,
  }
}

export async function executeQueryStatsAction(params: {
  db: D1Database
  userId: number
  entities: Record<string, unknown>
  candidateIntents: string[]
  sourceContext?: string
  confirmedType?: string
}): Promise<ChatActionResponse> {
  const { db, userId, entities, candidateIntents, sourceContext, confirmedType } = params
  const period = String(entities.period || 'recent')
  const counts = await getProfileCounts(db, userId)
  const resultSummary = buildStatsSummary(counts, period)

  return {
    success: true,
    actionType: 'query_stats',
    candidateIntents,
    requiresConfirmation: false,
    affectedEntity: { type: 'unknown' },
    confirmedType: confirmedType || 'query_stats',
    successMessage: '已整理你的阶段统计',
    resultSummary,
    nextPageLabel: '去成长页查看',
    deepLink: '/growth',
    sourceContext,
  }
}
