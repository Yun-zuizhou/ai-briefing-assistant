import { execute, queryAll, queryOne } from '../../utils/db'
import type {
  ReportFavoriteRow,
  ReportHistoryRow,
  ReportNoteRow,
  ReportTodoRow,
} from './builder'

export interface ReportEntryRow {
  id: number
  user_id: number
  report_type: string
  period_start: string | null
  period_end: string | null
  title: string
  summary_text: string | null
  status: string
  generated_at: string | null
  report_payload_json: string | null
  created_at: string
}

interface CountRow {
  count: number
}

export async function countDistinctActiveDays(
  db: D1Database,
  userId: number
): Promise<number> {
  const row = await queryOne<CountRow>(
    db,
    `
      SELECT COUNT(*) AS count
      FROM (
        SELECT substr(created_at, 1, 10) AS active_day FROM notes WHERE user_id = ?
        UNION
        SELECT substr(created_at, 1, 10) AS active_day FROM favorites WHERE user_id = ?
        UNION
        SELECT substr(created_at, 1, 10) AS active_day FROM history_entries WHERE user_id = ?
        UNION
        SELECT substr(created_at, 1, 10) AS active_day FROM todos WHERE user_id = ?
      )
    `,
    [userId, userId, userId, userId]
  )
  return Number(row?.count || 0)
}

export async function listReportEntries(
  db: D1Database,
  userId: number,
  limit = 50
): Promise<ReportEntryRow[]> {
  return queryAll<ReportEntryRow>(
    db,
    `SELECT * FROM reports WHERE user_id = ? ORDER BY generated_at DESC LIMIT ?`,
    [userId, limit]
  )
}

export async function getReportById(
  db: D1Database,
  reportId: number,
  userId?: number,
  reportType?: 'weekly' | 'monthly' | 'annual'
): Promise<ReportEntryRow | null> {
  if (userId !== undefined && reportType) {
    return queryOne<ReportEntryRow>(
      db,
      `SELECT * FROM reports WHERE id = ? AND user_id = ? AND report_type = ?`,
      [reportId, userId, reportType]
    )
  }
  if (userId !== undefined) {
    return queryOne<ReportEntryRow>(
      db,
      `SELECT * FROM reports WHERE id = ? AND user_id = ?`,
      [reportId, userId]
    )
  }
  if (reportType) {
    return queryOne<ReportEntryRow>(
      db,
      `SELECT * FROM reports WHERE id = ? AND report_type = ?`,
      [reportId, reportType]
    )
  }
  return queryOne<ReportEntryRow>(
    db,
    `SELECT * FROM reports WHERE id = ?`,
    [reportId]
  )
}

export async function getCachedReportByPeriod(
  db: D1Database,
  userId: number,
  reportType: 'weekly' | 'monthly' | 'annual',
  periodStart: string
): Promise<ReportEntryRow | null> {
  return queryOne<ReportEntryRow>(
    db,
    `SELECT * FROM reports WHERE user_id = ? AND report_type = ? AND period_start = ? ORDER BY generated_at DESC LIMIT 1`,
    [userId, reportType, periodStart]
  )
}

export async function listReportSourceNotes(
  db: D1Database,
  userId: number,
  limit: number
): Promise<ReportNoteRow[]> {
  return queryAll<ReportNoteRow>(
    db,
    `SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )
}

export async function listReportSourceFavorites(
  db: D1Database,
  userId: number,
  limit: number
): Promise<ReportFavoriteRow[]> {
  return queryAll<ReportFavoriteRow>(
    db,
    `SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )
}

export async function listReportSourceTodos(
  db: D1Database,
  userId: number
): Promise<ReportTodoRow[]> {
  return queryAll<ReportTodoRow>(
    db,
    `SELECT * FROM todos WHERE user_id = ?`,
    [userId]
  )
}

export async function listReportSourceHistory(
  db: D1Database,
  userId: number,
  limit: number
): Promise<ReportHistoryRow[]> {
  return queryAll<ReportHistoryRow>(
    db,
    `SELECT * FROM history_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )
}

export async function countReportSourceRows(
  db: D1Database,
  userId: number
): Promise<{
  notesCount: number
  favoritesCount: number
  completedTodoCount: number
  historyCount: number
}> {
  const [notesCount, favoritesCount, completedTodos, historyCount] = await Promise.all([
    queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM notes WHERE user_id = ?`, [userId]),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM favorites WHERE user_id = ?`, [userId]),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND status = 'completed'`, [userId]),
    queryOne<{ count: number }>(db, `SELECT COUNT(*) as count FROM history_entries WHERE user_id = ?`, [userId]),
  ])

  return {
    notesCount: Number(notesCount?.count || 0),
    favoritesCount: Number(favoritesCount?.count || 0),
    completedTodoCount: Number(completedTodos?.count || 0),
    historyCount: Number(historyCount?.count || 0),
  }
}

export async function upsertReportResult(
  db: D1Database,
  params: {
    userId: number
    reportType: 'weekly' | 'monthly' | 'annual'
    periodStart: string
    periodEnd: string
    title: string
    summaryText: string
    payload: Record<string, unknown>
  }
): Promise<void> {
  const { userId, reportType, periodStart, periodEnd, title, summaryText, payload } = params
  const existing = await queryOne<{ id: number }>(
    db,
    `
      SELECT id
      FROM reports
      WHERE user_id = ?
        AND report_type = ?
        AND COALESCE(period_start, '') = COALESCE(?, '')
        AND COALESCE(period_end, '') = COALESCE(?, '')
      ORDER BY id DESC
      LIMIT 1
    `,
    [userId, reportType, periodStart, periodEnd]
  )

  if (existing?.id) {
    await execute(
      db,
      `
        UPDATE reports
        SET title = ?, summary_text = ?, status = 'ready', report_payload_json = ?, generated_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `,
      [title, summaryText, JSON.stringify(payload), existing.id]
    )
    return
  }

  await execute(
    db,
    `
      INSERT INTO reports (
        user_id, report_type, period_start, period_end, title, summary_text,
        status, report_payload_json, generated_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'ready', ?, datetime('now'), datetime('now'), datetime('now'))
    `,
    [userId, reportType, periodStart, periodEnd, title, summaryText, JSON.stringify(payload)]
  )
}
