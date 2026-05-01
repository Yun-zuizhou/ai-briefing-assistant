import { queryAll } from '../../utils/db'

const MAX_INTERESTS = 5
const MAX_RECENT_ITEMS = 3
const MAX_CONTEXT_CHARS = 900

export interface ChatContextNote {
  content: string
  createdAt: string | null
}

export interface ChatContextTodo {
  content: string
  priority: string | null
  deadline: string | null
}

export interface ChatReplyContext {
  interests: string[]
  recentNotes: ChatContextNote[]
  activeTodos: ChatContextTodo[]
}

function truncateText(value: string, limit: number): string {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`
}

function redactSensitiveText(value: string): string {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[redacted]')
    .replace(/(api[_ -]?key|secret|token|密钥)\s*[:=：]\s*\S+/gi, '$1=[redacted]')
}

function safeText(value: string, limit: number): string {
  return truncateText(redactSensitiveText(value), limit)
}

export function formatChatReplyContext(context: ChatReplyContext | null | undefined): string | null {
  if (!context) return null

  const lines: string[] = []

  if (context.interests.length) {
    lines.push(`关注领域：${context.interests.map((item) => safeText(item, 24)).join('、')}`)
  }

  if (context.recentNotes.length) {
    lines.push('最近记录：')
    context.recentNotes.slice(0, MAX_RECENT_ITEMS).forEach((note, index) => {
      lines.push(`${index + 1}. ${safeText(note.content, 80)}`)
    })
  }

  if (context.activeTodos.length) {
    lines.push('当前待办：')
    context.activeTodos.slice(0, MAX_RECENT_ITEMS).forEach((todo, index) => {
      const meta = [
        todo.priority ? `优先级:${safeText(todo.priority, 12)}` : '',
        todo.deadline ? `截止:${safeText(todo.deadline, 20)}` : '',
      ].filter(Boolean)
      lines.push(`${index + 1}. ${safeText(todo.content, 70)}${meta.length ? `（${meta.join('，')}）` : ''}`)
    })
  }

  const text = lines.join('\n').trim()
  return text ? truncateText(text, MAX_CONTEXT_CHARS) : null
}

export async function buildChatReplyContext(
  db: D1Database,
  userId: number
): Promise<ChatReplyContext> {
  const [interestRows, noteRows, todoRows] = await Promise.all([
    queryAll<{ interest_name: string }>(
      db,
      `
        SELECT interest_name
        FROM user_interests
        WHERE user_id = ? AND lower(status) = 'active'
        ORDER BY id ASC
        LIMIT ?
      `,
      [userId, MAX_INTERESTS]
    ),
    queryAll<{ content: string; created_at: string | null }>(
      db,
      `
        SELECT content, created_at
        FROM notes
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
      `,
      [userId, MAX_RECENT_ITEMS]
    ),
    queryAll<{ content: string; priority: string | null; deadline: string | null }>(
      db,
      `
        SELECT content, priority, deadline
        FROM todos
        WHERE user_id = ? AND lower(status) <> 'completed'
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
        LIMIT ?
      `,
      [userId, MAX_RECENT_ITEMS]
    ),
  ])

  return {
    interests: interestRows.map((row) => safeText(row.interest_name, 24)).filter(Boolean),
    recentNotes: noteRows.map((row) => ({
      content: safeText(row.content, 120),
      createdAt: row.created_at || null,
    })).filter((row) => row.content),
    activeTodos: todoRows.map((row) => ({
      content: safeText(row.content, 100),
      priority: row.priority ? safeText(row.priority, 16) : null,
      deadline: row.deadline ? safeText(row.deadline, 24) : null,
    })).filter((row) => row.content),
  }
}
