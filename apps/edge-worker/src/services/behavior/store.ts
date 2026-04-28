import { execute, queryAll, queryOne, executeSql } from '../../utils/db'
import type {
  ActionReminderSettingsRow,
  BriefingScheduleRow,
  FavoriteRow,
  FollowingItemRow,
  BriefingScheduleState,
  HistoryRow,
  LatestBriefingRecord,
  LatestNoteRecord,
  LatestOpportunityFollowRecord,
  NoteRow,
  ProfileCounts,
  ResolvedUserSettings,
  SavedItemRow,
  TodoRow,
  UserSettingRow,
} from './types'

export interface Todo {
  id: number
  user_id: number
  content: string
  status: string
  priority: string
  deadline: string | null
  related_type: string | null
  related_id: number | null
  tags: string
}

export interface Favorite {
  id: number
  user_id: number
  item_type: string
  item_id: number
  item_title: string
  item_summary: string | null
  item_source: string | null
  item_url: string | null
  created_at: string
}

export interface HistoryEntry {
  id: number
  user_id: number
  event_type: string
  title: string
  summary: string | null
  created_at: string
}

export async function listTodos(
  db: D1Database,
  userId: number,
  status?: string
): Promise<Todo[]> {
  let sql = `
    SELECT id, user_id, content, lower(status) as status, lower(priority) as priority, deadline, related_type, related_id, tags
    FROM todos
    WHERE user_id = ?
  `
  const params: unknown[] = [userId]
  
  if (status) {
    sql += ` AND lower(status) = lower(?)`
    params.push(status)
  }
  
  sql += ` ORDER BY created_at DESC`
  
  return queryAll<Todo>(db, sql, params)
}

export async function createTodo(
  db: D1Database,
  userId: number,
  content: string,
  priority: string = 'medium'
): Promise<Todo | null> {
  const sql = `
    INSERT INTO todos (user_id, content, status, priority, tags)
    VALUES (?, ?, 'pending', ?, '[]')
    RETURNING id, user_id, content, status, priority, deadline, related_type, related_id, tags
  `
  return queryOne<Todo>(db, sql, [userId, content, priority])
}

export async function updateTodoStatus(
  db: D1Database,
  id: number,
  status: string
): Promise<boolean> {
  const sql = `UPDATE todos SET status = ? WHERE id = ?`
  const result = await executeSql(db, sql, [status, id])
  return result.success
}

export async function listFavorites(
  db: D1Database,
  userId: number,
  itemType?: string
): Promise<Favorite[]> {
  let sql = `
    SELECT id, user_id, item_type, item_id,
           item_title, item_summary, item_source, item_url, created_at
    FROM favorites
    WHERE user_id = ?
  `
  const params: unknown[] = [userId]
  
  if (itemType) {
    sql += ` AND item_type = ?`
    params.push(itemType)
  }
  
  sql += ` ORDER BY created_at DESC LIMIT 20`
  
  return queryAll<Favorite>(db, sql, params)
}

export async function appendHistory(
  db: D1Database,
  userId: number,
  eventType: string,
  title: string,
  summary?: string
): Promise<boolean> {
  const sql = `
    INSERT INTO history_entries (user_id, event_type, title, summary)
    VALUES (?, ?, ?, ?)
  `
  const result = await executeSql(db, sql, [userId, eventType, title, summary || null])
  return result.success
}

export async function getCheckedInToday(
  db: D1Database,
  userId: number
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const sql = `
    SELECT COUNT(*) as count
    FROM history_entries
    WHERE user_id = ? 
      AND event_type = 'daily_check_in'
      AND DATE(created_at) = ?
  `
  const result = await queryOne<{ count: number }>(db, sql, [userId, today])
  return (result?.count || 0) > 0
}

export async function getActivityStreak(
  db: D1Database,
  userId: number
): Promise<number> {
  const sql = `
    SELECT DATE(created_at) as date
    FROM history_entries
    WHERE user_id = ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `
  const rows = await queryAll<{ date: string }>(db, sql, [userId])
  
  if (rows.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < rows.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    const expectedDateStr = expectedDate.toISOString().split('T')[0]
    
    if (rows[i]?.date === expectedDateStr) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export async function getProfileCounts(
  db: D1Database,
  userId: number
): Promise<ProfileCounts> {
  const counts = await queryOne<ProfileCounts>(
    db,
    `
      SELECT
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) AS notes_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites_count,
        (SELECT COUNT(*) FROM todos WHERE user_id = ? AND lower(status) = 'completed') AS completed_todos,
        (SELECT COUNT(*) FROM todos WHERE user_id = ?) AS total_todos,
        (SELECT COUNT(*) FROM history_entries WHERE user_id = ?) AS history_count
    `,
    [userId, userId, userId, userId, userId]
  )

  return {
    notes_count: Number(counts?.notes_count || 0),
    favorites_count: Number(counts?.favorites_count || 0),
    completed_todos: Number(counts?.completed_todos || 0),
    total_todos: Number(counts?.total_todos || 0),
    history_count: Number(counts?.history_count || 0),
  }
}

export async function getLatestBriefing(
  db: D1Database,
  userId: number
): Promise<LatestBriefingRecord | null> {
  return queryOne<LatestBriefingRecord>(
    db,
    `
      SELECT title, briefing_date
      FROM briefings
      WHERE user_id = ?
      ORDER BY briefing_date DESC, id DESC
      LIMIT 1
    `,
    [userId]
  )
}

export async function getLatestNote(
  db: D1Database,
  userId: number
): Promise<LatestNoteRecord | null> {
  return queryOne<LatestNoteRecord>(
    db,
    `
      SELECT content, created_at
      FROM notes
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  )
}

export async function getLatestOpportunityFollow(
  db: D1Database,
  userId: number
): Promise<LatestOpportunityFollowRecord | null> {
  return queryOne<LatestOpportunityFollowRecord>(
    db,
    `
      SELECT next_step, note AS progress_text, updated_at, created_at
      FROM opportunity_follows
      WHERE user_id = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `,
    [userId]
  )
}

export async function getUserSettings(
  db: D1Database,
  userId: number
): Promise<UserSettingRow | null> {
  return queryOne<UserSettingRow>(
    db,
    `SELECT * FROM user_settings WHERE user_id = ?`,
    [userId]
  )
}

export async function getMorningBriefingScheduleState(
  db: D1Database,
  userId: number
): Promise<BriefingScheduleState | null> {
  try {
    return await queryOne<BriefingScheduleState>(
      db,
      `
        SELECT status, next_run_at
        FROM briefing_schedules
        WHERE user_id = ? AND briefing_type = 'morning'
        LIMIT 1
      `,
      [userId]
    )
  } catch (error) {
    console.warn('read briefing_schedules skipped:', error)
    return null
  }
}

export async function ensureUserSettingsRow(db: D1Database, userId: number): Promise<void> {
  await execute(
    db,
    `
      INSERT INTO user_settings (
        user_id, morning_brief_time, evening_brief_time,
        do_not_disturb_enabled, sound_enabled, vibration_enabled, created_at, updated_at
      )
      VALUES (?, '08:00', '21:00', 0, 1, 1, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO NOTHING
    `,
    [userId]
  )
}

export async function saveUserSettings(
  db: D1Database,
  userId: number,
  settings: ResolvedUserSettings
): Promise<void> {
  await execute(
    db,
    `
      UPDATE user_settings
      SET
        morning_brief_time = ?,
        evening_brief_time = ?,
        do_not_disturb_enabled = ?,
        do_not_disturb_start = ?,
        do_not_disturb_end = ?,
        sound_enabled = ?,
        vibration_enabled = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `,
    [
      settings.morning_brief_time,
      settings.evening_brief_time,
      settings.do_not_disturb_enabled ? 1 : 0,
      settings.do_not_disturb_start,
      settings.do_not_disturb_end,
      settings.sound_enabled ? 1 : 0,
      settings.vibration_enabled ? 1 : 0,
      userId,
    ]
  )
}

export async function saveUserAiProviderSettings(
  db: D1Database,
  userId: number,
  input: {
    provider: string | null
    apiKey: string | null
  }
): Promise<void> {
  await execute(
    db,
    `
      UPDATE user_settings
      SET
        ai_provider = ?,
        ai_api_key = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `,
    [
      input.provider,
      input.apiKey,
      userId,
    ]
  )
}

export async function upsertMorningSchedule(
  db: D1Database,
  userId: number,
  scheduleTime: string,
  triggerSource: string
): Promise<void> {
  try {
    await execute(
      db,
      `
        INSERT INTO briefing_schedules (
          user_id, briefing_type, schedule_time, timezone, status, updated_by, created_at, updated_at
        )
        VALUES (?, 'morning', ?, 'Asia/Shanghai', 'active', ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, briefing_type) DO UPDATE SET
          schedule_time = excluded.schedule_time,
          status = 'active',
          updated_by = excluded.updated_by,
          updated_at = datetime('now')
      `,
      [userId, scheduleTime, triggerSource]
    )

    const schedule = await queryOne<{ id: number }>(
      db,
      `SELECT id FROM briefing_schedules WHERE user_id = ? AND briefing_type = 'morning' LIMIT 1`,
      [userId]
    )
    await execute(
      db,
      `
        INSERT INTO briefing_dispatch_logs (
          schedule_id, user_id, briefing_type, trigger_source, scheduled_for, status, summary, created_at
        )
        VALUES (?, ?, 'morning', ?, ?, 'queued', ?, datetime('now'))
      `,
      [
        schedule?.id ?? null,
        userId,
        triggerSource,
        scheduleTime,
        `推送时间已更新为 ${scheduleTime}，等待调度执行`,
      ]
    )
  } catch (error) {
    console.warn('upsertMorningSchedule skipped:', error)
  }
}

export async function listTodoRows(
  db: D1Database,
  input: {
    userId: number
    status?: string | null
    priority?: string | null
  }
): Promise<TodoRow[]> {
  let sql = `
    SELECT *
    FROM todos
    WHERE user_id = ?
  `
  const params: unknown[] = [input.userId]

  if (input.status) {
    sql += ` AND lower(status) = lower(?)`
    params.push(input.status)
  }

  if (input.priority) {
    sql += ` AND lower(priority) = lower(?)`
    params.push(input.priority)
  }

  sql += `
    ORDER BY
      CASE lower(priority)
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      deadline ASC NULLS LAST,
      datetime(created_at) DESC,
      id DESC
  `

  return queryAll<TodoRow>(db, sql, params)
}

export async function getTodoRow(
  db: D1Database,
  todoId: number,
  userId: number
): Promise<TodoRow | null> {
  return queryOne<TodoRow>(
    db,
    `SELECT * FROM todos WHERE id = ? AND user_id = ?`,
    [todoId, userId]
  )
}

export async function getTodoRowById(
  db: D1Database,
  todoId: number
): Promise<TodoRow | null> {
  return queryOne<TodoRow>(
    db,
    `SELECT * FROM todos WHERE id = ?`,
    [todoId]
  )
}

export async function createTodoRow(
  db: D1Database,
  input: {
    userId: number
    content: string
    description?: string | null
    priority: string
    deadline?: string | null
    relatedType?: string | null
    relatedId?: number | null
    relatedTitle?: string | null
    tags?: string[]
  }
): Promise<TodoRow | null> {
  const result = await execute(
    db,
    `
      INSERT INTO todos (
        user_id, content, description, status, priority, deadline,
        related_type, related_id, related_title, tags, created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    [
      input.userId,
      input.content,
      input.description || null,
      input.priority,
      input.deadline || null,
      input.relatedType || null,
      input.relatedId ?? null,
      input.relatedTitle || null,
      JSON.stringify(input.tags || []),
    ]
  )

  return getTodoRow(db, Number(result.meta.last_row_id), input.userId)
}

export async function updateTodoRow(
  db: D1Database,
  todoId: number,
  input: {
    content: string
    description?: string | null
    status: string
    priority: string
    deadline?: string | null
    relatedType?: string | null
    relatedId?: number | null
    relatedTitle?: string | null
    tags: string[]
  }
): Promise<void> {
  await execute(
    db,
    `
      UPDATE todos
      SET content = ?, description = ?, status = ?, priority = ?, deadline = ?,
          related_type = ?, related_id = ?, related_title = ?, tags = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    [
      input.content,
      input.description ?? null,
      input.status,
      input.priority,
      input.deadline ?? null,
      input.relatedType ?? null,
      input.relatedId ?? null,
      input.relatedTitle ?? null,
      JSON.stringify(input.tags),
      todoId,
    ]
  )
}

export async function deleteTodoRow(db: D1Database, todoId: number): Promise<void> {
  await execute(db, `DELETE FROM todos WHERE id = ?`, [todoId])
}

export async function markTodoCompleted(
  db: D1Database,
  todoId: number
): Promise<void> {
  await execute(
    db,
    `UPDATE todos SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [todoId]
  )
}

export async function upsertOpportunityFollowForCompletedTodo(
  db: D1Database,
  todo: TodoRow
): Promise<number | null> {
  if (todo.related_type !== 'opportunity' || todo.related_id == null) {
    return null
  }

  await execute(
    db,
    `
      INSERT INTO opportunity_follows (
        user_id, opportunity_id, status, note, next_step, created_at, updated_at
      )
      VALUES (?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
        status = 'completed',
        note = excluded.note,
        next_step = excluded.next_step,
        updated_at = datetime('now')
    `,
    [
      todo.user_id,
      todo.related_id,
      '关联待办已完成，进入结果沉淀',
      `已完成：${todo.content.substring(0, 80)}`,
    ]
  )

  const follow = await queryOne<{ id: number }>(
    db,
    `SELECT id FROM opportunity_follows WHERE user_id = ? AND opportunity_id = ? LIMIT 1`,
    [todo.user_id, todo.related_id]
  )

  return follow?.id ?? null
}

export async function upsertOpportunityExecutionResultForCompletedTodo(
  db: D1Database,
  todo: TodoRow,
  followId: number | null
): Promise<void> {
  if (todo.related_type !== 'opportunity' || todo.related_id == null) {
    return
  }

  try {
    await execute(
      db,
      `
        INSERT INTO opportunity_execution_results (
          user_id, opportunity_id, todo_id, follow_id, result_status, result_note, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, opportunity_id, todo_id) DO UPDATE SET
          follow_id = excluded.follow_id,
          result_status = excluded.result_status,
          result_note = excluded.result_note,
          updated_at = datetime('now')
      `,
      [
        todo.user_id,
        todo.related_id,
        todo.id,
        followId,
        '关联待办完成后自动更新机会执行结果',
      ]
    )
  } catch (error) {
    console.warn('opportunity_execution_results skipped:', error)
  }
}

export async function getActionReminderSettings(
  db: D1Database,
  userId: number
): Promise<ActionReminderSettingsRow | null> {
  return queryOne<ActionReminderSettingsRow>(
    db,
    `SELECT morning_brief_time, do_not_disturb_enabled FROM user_settings WHERE user_id = ?`,
    [userId]
  )
}

export async function listSavedItemsForActionOverview(
  db: D1Database,
  userId: number
): Promise<SavedItemRow[]> {
  return queryAll<SavedItemRow>(
    db,
    `
      SELECT id, item_title, item_type, item_source, created_at
      FROM favorites
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 10
    `,
    [userId]
  )
}

export async function listFollowingItemsForActionOverview(
  db: D1Database,
  userId: number
): Promise<FollowingItemRow[]> {
  return queryAll<FollowingItemRow>(
    db,
    `
      SELECT
        f.id AS follow_id,
        o.title AS title,
        f.status AS follow_status,
        o.deadline AS deadline,
        f.note AS progress_text,
        f.next_step AS next_step
      FROM opportunity_follows f
      JOIN opportunities o ON o.id = f.opportunity_id
      WHERE f.user_id = ?
      ORDER BY datetime(f.updated_at) DESC, f.id DESC
      LIMIT 20
    `,
    [userId]
  )
}

export async function listActiveBriefingSchedules(
  db: D1Database,
  userId: number
): Promise<BriefingScheduleRow[]> {
  try {
    return await queryAll<BriefingScheduleRow>(
      db,
      `
        SELECT id, briefing_type, schedule_time, status, next_run_at
        FROM briefing_schedules
        WHERE user_id = ? AND lower(status) = 'active'
        ORDER BY briefing_type ASC, id ASC
        LIMIT 5
      `,
      [userId]
    )
  } catch (error) {
    console.warn('read briefing_schedules skipped:', error)
    return []
  }
}

export async function listFavoriteRows(
  db: D1Database,
  userId: number,
  itemType?: string | null
): Promise<FavoriteRow[]> {
  let sql = `SELECT * FROM favorites WHERE user_id = ?`
  const params: unknown[] = [userId]

  if (itemType) {
    sql += ` AND item_type = ?`
    params.push(itemType)
  }

  sql += ` ORDER BY datetime(created_at) DESC, id DESC`
  return queryAll<FavoriteRow>(db, sql, params)
}

export async function getFavoriteRow(
  db: D1Database,
  favoriteId: number,
  userId: number
): Promise<FavoriteRow | null> {
  return queryOne<FavoriteRow>(
    db,
    `SELECT * FROM favorites WHERE id = ? AND user_id = ?`,
    [favoriteId, userId]
  )
}

export async function getFavoriteRowById(
  db: D1Database,
  favoriteId: number
): Promise<FavoriteRow | null> {
  return queryOne<FavoriteRow>(
    db,
    `SELECT * FROM favorites WHERE id = ?`,
    [favoriteId]
  )
}

export async function findFavoriteByItem(
  db: D1Database,
  userId: number,
  itemType: string,
  itemId: number
): Promise<FavoriteRow | null> {
  return queryOne<FavoriteRow>(
    db,
    `SELECT * FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?`,
    [userId, itemType, itemId]
  )
}

export async function createFavoriteRow(
  db: D1Database,
  input: {
    userId: number
    itemType: string
    itemId: number
    itemTitle: string
    itemSummary?: string | null
    itemSource?: string | null
    itemUrl?: string | null
  }
): Promise<FavoriteRow | null> {
  const result = await execute(
    db,
    `INSERT INTO favorites (user_id, item_type, item_id, item_title, item_summary, item_source, item_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      input.userId,
      input.itemType,
      input.itemId,
      input.itemTitle,
      input.itemSummary || null,
      input.itemSource || null,
      input.itemUrl || null,
    ]
  )
  return getFavoriteRow(db, Number(result.meta.last_row_id), input.userId)
}

export async function deleteFavoriteRow(db: D1Database, favoriteId: number): Promise<void> {
  await execute(db, `DELETE FROM favorites WHERE id = ?`, [favoriteId])
}

export async function listNoteRows(
  db: D1Database,
  userId: number,
  sourceType?: string | null
): Promise<NoteRow[]> {
  let sql = `SELECT * FROM notes WHERE user_id = ?`
  const params: unknown[] = [userId]

  if (sourceType) {
    sql += ` AND source_type = ?`
    params.push(sourceType)
  }

  sql += ` ORDER BY datetime(created_at) DESC, id DESC`
  return queryAll<NoteRow>(db, sql, params)
}

export async function getNoteRow(
  db: D1Database,
  noteId: number,
  userId: number
): Promise<NoteRow | null> {
  return queryOne<NoteRow>(
    db,
    `SELECT * FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, userId]
  )
}

export async function getNoteRowById(
  db: D1Database,
  noteId: number
): Promise<NoteRow | null> {
  return queryOne<NoteRow>(
    db,
    `SELECT * FROM notes WHERE id = ?`,
    [noteId]
  )
}

export async function createNoteRow(
  db: D1Database,
  input: {
    userId: number
    content: string
    sourceType: string
    sourceId?: number | null
    tags: string[]
  }
): Promise<NoteRow | null> {
  const result = await execute(
    db,
    `INSERT INTO notes (user_id, content, source_type, source_id, tags, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      input.userId,
      input.content,
      input.sourceType,
      input.sourceId ?? null,
      JSON.stringify(input.tags),
    ]
  )
  return getNoteRow(db, Number(result.meta.last_row_id), input.userId)
}

export async function updateNoteRow(
  db: D1Database,
  noteId: number,
  content: string,
  tags: string[]
): Promise<void> {
  await execute(
    db,
    `UPDATE notes SET content = ?, tags = ? WHERE id = ?`,
    [content, JSON.stringify(tags), noteId]
  )
}

export async function deleteNoteRow(db: D1Database, noteId: number): Promise<void> {
  await execute(db, `DELETE FROM notes WHERE id = ?`, [noteId])
}

export async function listHistoryRows(
  db: D1Database,
  userId: number,
  eventType?: string | null
): Promise<HistoryRow[]> {
  let sql = `
    SELECT id, user_id, event_type, title, summary, ref_type, ref_id, created_at
    FROM history_entries
    WHERE user_id = ?
  `
  const params: unknown[] = [userId]
  if (eventType) {
    sql += ` AND event_type = ?`
    params.push(eventType)
  }
  sql += ` ORDER BY datetime(created_at) DESC, id DESC`
  return queryAll<HistoryRow>(db, sql, params)
}

export async function createHistoryRow(
  db: D1Database,
  input: {
    userId: number
    eventType: string
    title: string
    summary?: string | null
    refType?: string | null
    refId?: number | null
  }
): Promise<HistoryRow | null> {
  const result = await execute(
    db,
    `
      INSERT INTO history_entries (user_id, event_type, title, summary, ref_type, ref_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [input.userId, input.eventType, input.title, input.summary || null, input.refType || null, input.refId ?? null]
  )
  return queryOne<HistoryRow>(
    db,
    `
      SELECT id, user_id, event_type, title, summary, ref_type, ref_id, created_at
      FROM history_entries
      WHERE id = ? AND user_id = ?
    `,
    [Number(result.meta.last_row_id), input.userId]
  )
}
