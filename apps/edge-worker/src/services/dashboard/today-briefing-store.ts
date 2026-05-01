import { execute, queryAll, queryOne } from '../../utils/db'
import type { BriefingPayloadRecord } from './today-briefing-payload'

export type LatestBriefingPayloadRow = {
  id: number
  issue_number: number | null
  briefing_type: string | null
  title: string | null
  summary_text: string | null
  payload: string | null
  generated_at: string | null
  created_at: string | null
}

export type TodayBriefingCronScheduleRow = {
  id: number
  user_id: number
  schedule_time: string | null
}

export function getTodayDateOnly(): string {
  return new Date().toISOString().split('T')[0]
}

export async function getLatestReadyBriefingPayload(
  db: D1Database,
  userId: number
): Promise<LatestBriefingPayloadRow | null> {
  try {
    return await queryOne<LatestBriefingPayloadRow>(
      db,
      `
        SELECT id, issue_number, briefing_type, title, summary_text, payload, generated_at, created_at
        FROM briefings
        WHERE user_id = ?
          AND briefing_date <= ?
          AND lower(COALESCE(status, 'ready')) = 'ready'
        ORDER BY briefing_date DESC, datetime(COALESCE(generated_at, updated_at, created_at)) DESC, id DESC
        LIMIT 1
      `,
      [userId, getTodayDateOnly()]
    )
  } catch (error) {
    console.warn('read latest briefing payload skipped:', error)
    return null
  }
}

export async function getTodayReadyBriefingPayload(
  db: D1Database,
  userId: number
): Promise<LatestBriefingPayloadRow | null> {
  try {
    return await queryOne<LatestBriefingPayloadRow>(
      db,
      `
        SELECT id, issue_number, briefing_type, title, summary_text, payload, generated_at, created_at
        FROM briefings
        WHERE user_id = ?
          AND briefing_date = ?
          AND lower(COALESCE(status, 'ready')) = 'ready'
        ORDER BY datetime(COALESCE(generated_at, updated_at, created_at)) DESC, id DESC
        LIMIT 1
      `,
      [userId, getTodayDateOnly()]
    )
  } catch (error) {
    console.warn('read today briefing payload skipped:', error)
    return null
  }
}

export async function upsertTodayBriefing(params: {
  db: D1Database
  userId: number
  issueNumber: number
  payload: BriefingPayloadRecord
  summaryText: string
  generatedAt: string
}): Promise<void> {
  await execute(
    params.db,
    `
      INSERT INTO briefings (
        user_id, briefing_date, briefing_type, issue_number, title, summary_text, payload,
        status, generated_at, created_at, updated_at
      ) VALUES (?, ?, 'morning', ?, ?, ?, ?, 'ready', ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, briefing_date, briefing_type) DO UPDATE SET
        issue_number = excluded.issue_number,
        title = excluded.title,
        summary_text = excluded.summary_text,
        payload = excluded.payload,
        status = excluded.status,
        generated_at = excluded.generated_at,
        updated_at = excluded.updated_at
    `,
    [
      params.userId,
      getTodayDateOnly(),
      params.issueNumber,
      '今日 AI 简报',
      params.summaryText,
      JSON.stringify(params.payload),
      params.generatedAt,
    ]
  )
}

export async function listActiveMorningBriefingSchedules(
  db: D1Database,
  limit: number
): Promise<TodayBriefingCronScheduleRow[]> {
  try {
    return await queryAll<TodayBriefingCronScheduleRow>(
      db,
      `
        SELECT id, user_id, schedule_time
        FROM briefing_schedules
        WHERE briefing_type = 'morning'
          AND lower(COALESCE(status, 'active')) = 'active'
        ORDER BY datetime(COALESCE(next_run_at, updated_at, created_at)) ASC, id ASC
        LIMIT ?
      `,
      [limit]
    )
  } catch (error) {
    console.warn('read active morning briefing schedules skipped:', error)
    return []
  }
}

export async function recordBriefingCronDispatch(params: {
  db: D1Database
  scheduleId: number
  userId: number
  scheduledFor: string | null
  status: 'success' | 'skipped' | 'error'
  summary: string
}): Promise<void> {
  try {
    await execute(
      params.db,
      `
        INSERT INTO briefing_dispatch_logs (
          schedule_id, user_id, briefing_type, trigger_source, scheduled_for, status, summary, created_at
        )
        VALUES (?, ?, 'morning', 'worker_cron', ?, ?, ?, datetime('now'))
      `,
      [
        params.scheduleId,
        params.userId,
        params.scheduledFor,
        params.status,
        params.summary,
      ]
    )
  } catch (error) {
    console.warn('record briefing cron dispatch skipped:', error)
  }
}
