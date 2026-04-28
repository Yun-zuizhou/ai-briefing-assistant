import { execute, queryAll, queryOne } from '../../utils/db'

export interface ChatSession {
  id: number
  user_id: number
  session_title: string | null
  source_context: string | null
  status: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export interface ChatMessage {
  id: number
  session_id: number
  role: string
  content: string
  message_state: string
  intent_type: string | null
  candidate_intents_json: string | null
  confidence: number | null
  source_context: string | null
  matched_by: string | null
  confirmed_type: string | null
  action_type: string | null
  result_summary: string | null
  deep_link: string | null
  next_page_label: string | null
  affected_entity_type: string | null
  affected_entity_id: string | null
  change_log_json: string | null
  created_at: string
}

export interface ChatSessionSummary {
  sessionId: number
  sessionTitle: string | null
  status: string
  sourceContext: string | null
  lastMessageAt: string | null
  messageCount: number
}

export interface ChatSessionMessagesResponse {
  sessionId: number
  sessionTitle: string | null
  status: string
  sourceContext: string | null
  lastMessageAt: string | null
  messages: Array<{
    messageId: number
    role: string
    content: string
    messageState: string
    intentType: string | null
    candidateIntents: string[]
    confidence: number | null
    sourceContext: string | null
    matchedBy: string | null
    confirmedType: string | null
    actionType: string | null
    resultSummary: string | null
    deepLink: string | null
    nextPageLabel: string | null
    affectedEntityType: string | null
    affectedEntityId: string | null
    changeLog: unknown[]
    createdAt: string
  }>
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseJsonList<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

export async function getOrCreateActiveSession(
  db: D1Database,
  userId: number,
  sourceContext: string | null
): Promise<ChatSession> {
  const existingSession = await queryOne<ChatSession>(
    db,
    `SELECT * FROM chat_sessions WHERE user_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
    [userId]
  )

  if (existingSession) {
    await execute(db, `UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?`, [existingSession.id])
    return existingSession
  }

  const result = await execute(
    db,
    `INSERT INTO chat_sessions (user_id, source_context, status, created_at, updated_at) VALUES (?, ?, 'active', datetime('now'), datetime('now'))`,
    [userId, sourceContext]
  )

  return {
    id: result.meta.last_row_id,
    user_id: userId,
    session_title: null,
    source_context: sourceContext,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_message_at: null,
  }
}

export async function listChatSessions(
  db: D1Database,
  userId: number,
  limit: number
): Promise<ChatSessionSummary[]> {
  const sessions = await queryAll<ChatSession & { message_count: number }>(
    db,
    `
      SELECT
        s.*,
        (
          SELECT COUNT(*)
          FROM chat_messages m
          WHERE m.session_id = s.id
        ) AS message_count
      FROM chat_sessions s
      WHERE s.user_id = ?
      ORDER BY datetime(COALESCE(s.last_message_at, s.updated_at, s.created_at)) DESC, s.id DESC
      LIMIT ?
    `,
    [userId, limit]
  )

  return sessions.map((session) => ({
    sessionId: session.id,
    sessionTitle: session.session_title,
    status: session.status,
    sourceContext: session.source_context,
    lastMessageAt: session.last_message_at,
    messageCount: Number(session.message_count || 0),
  }))
}

export async function getChatSessionMessages(
  db: D1Database,
  userId: number,
  sessionId: number
): Promise<ChatSessionMessagesResponse | null> {
  const session = await queryOne<ChatSession>(
    db,
    `SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId]
  )

  if (!session) {
    return null
  }

  const messages = await queryAll<ChatMessage>(
    db,
    `
      SELECT
        id,
        session_id,
        role,
        content,
        message_state,
        intent_type,
        candidate_intents_json,
        confidence,
        source_context,
        matched_by,
        confirmed_type,
        action_type,
        result_summary,
        deep_link,
        next_page_label,
        affected_entity_type,
        affected_entity_id,
        change_log_json,
        created_at
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY datetime(created_at) ASC, id ASC
    `,
    [sessionId]
  )

  return {
    sessionId,
    sessionTitle: session.session_title,
    status: session.status,
    sourceContext: session.source_context,
    lastMessageAt: session.last_message_at,
    messages: messages.map((message) => ({
      messageId: message.id,
      role: message.role,
      content: message.content,
      messageState: message.message_state,
      intentType: message.intent_type,
      candidateIntents: parseJsonArray(message.candidate_intents_json),
      confidence: message.confidence,
      sourceContext: message.source_context,
      matchedBy: message.matched_by,
      confirmedType: message.confirmed_type,
      actionType: message.action_type,
      resultSummary: message.result_summary,
      deepLink: message.deep_link,
      nextPageLabel: message.next_page_label,
      affectedEntityType: message.affected_entity_type,
      affectedEntityId: message.affected_entity_id,
      changeLog: parseJsonList(message.change_log_json),
      createdAt: message.created_at,
    })),
  }
}

export async function getChatSession(
  db: D1Database,
  sessionId: number,
  userId?: number
): Promise<ChatSession | null> {
  if (userId !== undefined) {
    return queryOne<ChatSession>(
      db,
      `SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    )
  }

  return queryOne<ChatSession>(
    db,
    `SELECT * FROM chat_sessions WHERE id = ?`,
    [sessionId]
  )
}

export async function appendChatMessage(
  db: D1Database,
  sessionId: number,
  role: string,
  content: string,
  messageState: string,
  options: {
    intentType?: string
    candidateIntents?: string[]
    confidence?: number
    sourceContext?: string
    matchedBy?: string
    confirmedType?: string
    actionType?: string
    resultSummary?: string
    deepLink?: string
    nextPageLabel?: string
    affectedEntityType?: string
    affectedEntityId?: string
    changeLog?: unknown[]
  } = {}
): Promise<void> {
  await execute(
    db,
    `INSERT INTO chat_messages (
      session_id, role, content, message_state, intent_type, candidate_intents_json,
      confidence, source_context, matched_by, confirmed_type, action_type,
      result_summary, deep_link, next_page_label, affected_entity_type,
      affected_entity_id, change_log_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      sessionId,
      role,
      content,
      messageState,
      options.intentType || null,
      options.candidateIntents ? JSON.stringify(options.candidateIntents) : '[]',
      options.confidence || null,
      options.sourceContext || null,
      options.matchedBy || null,
      options.confirmedType || null,
      options.actionType || null,
      options.resultSummary || null,
      options.deepLink || null,
      options.nextPageLabel || null,
      options.affectedEntityType || null,
      options.affectedEntityId || null,
      options.changeLog ? JSON.stringify(options.changeLog) : '[]',
    ]
  )

  await execute(
    db,
    `UPDATE chat_sessions SET last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [sessionId]
  )
}

export function parseOpportunityIdFromContentRef(contentRef?: string | null): number | null {
  if (!contentRef) return null
  const [refType, refIdText] = String(contentRef).split(':')
  const refId = Number.parseInt(refIdText || '', 10)
  if (refType !== 'opportunity' || Number.isNaN(refId)) {
    return null
  }
  return refId
}

export async function upsertOpportunityFollowFromTodo(
  db: D1Database,
  userId: number,
  opportunityId: number,
  todoContent: string
): Promise<number | null> {
  await execute(
    db,
    `
      INSERT INTO opportunity_follows (
        user_id, opportunity_id, status, note, next_step, created_at, updated_at
      )
      VALUES (?, ?, 'watching', ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
        status = excluded.status,
        note = excluded.note,
        next_step = excluded.next_step,
        updated_at = datetime('now')
    `,
    [userId, opportunityId, '由对话转待办后自动进入跟进链路', todoContent.substring(0, 120)]
  )
  const follow = await queryOne<{ id: number }>(
    db,
    `SELECT id FROM opportunity_follows WHERE user_id = ? AND opportunity_id = ? LIMIT 1`,
    [userId, opportunityId]
  )
  return follow?.id ?? null
}

export async function resolveOpportunityIdFromCorrection(
  db: D1Database,
  userId: number,
  correctionFrom?: string | null
): Promise<number | null> {
  if (!correctionFrom) return null
  if (correctionFrom.startsWith('history:')) {
    const historyId = Number.parseInt(correctionFrom.replace('history:', ''), 10)
    if (Number.isNaN(historyId)) return null
    const historyRow = await queryOne<{ ref_type: string | null; ref_id: number | null }>(
      db,
      `SELECT ref_type, ref_id FROM history_entries WHERE id = ? AND user_id = ? LIMIT 1`,
      [historyId, userId]
    )
    if (historyRow?.ref_type === 'opportunity' && historyRow.ref_id != null) {
      return historyRow.ref_id
    }
  }
  if (correctionFrom.startsWith('todo:')) {
    const todoId = Number.parseInt(correctionFrom.replace('todo:', ''), 10)
    if (Number.isNaN(todoId)) return null
    const todoRow = await queryOne<{ related_type: string | null; related_id: number | null }>(
      db,
      `SELECT related_type, related_id FROM todos WHERE id = ? AND user_id = ? LIMIT 1`,
      [todoId, userId]
    )
    if (todoRow?.related_type === 'opportunity' && todoRow.related_id != null) {
      return todoRow.related_id
    }
  }
  return null
}
