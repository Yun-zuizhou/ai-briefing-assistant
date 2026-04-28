import {
  createFavoriteRow,
  createHistoryRow,
  createNoteRow,
  createTodoRow,
  deleteFavoriteRow,
  deleteNoteRow,
  deleteTodoRow,
  ensureUserSettingsRow,
  findFavoriteByItem,
  getFavoriteRow,
  getNoteRow,
  getTodoRow,
  getUserSettings,
  markTodoCompleted,
  saveUserAiProviderSettings,
  saveUserSettings,
  updateNoteRow,
  updateTodoRow,
  upsertOpportunityExecutionResultForCompletedTodo,
  upsertOpportunityFollowForCompletedTodo,
  upsertMorningSchedule,
} from './store'
import { buildResolvedUserAiProviderSettings, buildResolvedUserSettings } from './builder'
import { getAiPlatformDefinition } from '../ai-provider'
import type {
  FavoriteRow,
  HistoryRow,
  NoteRow,
  ResolvedUserAiProviderSettings,
  ResolvedUserSettings,
  TodoRow,
} from './types'

export async function updateUserSettings(params: {
  db: D1Database
  userId: number
  payload: {
    morning_brief_time?: string
    evening_brief_time?: string
    do_not_disturb_enabled?: boolean
    do_not_disturb_start?: string
    do_not_disturb_end?: string
    sound_enabled?: boolean
    vibration_enabled?: boolean
  }
  triggerSource: string
}): Promise<ResolvedUserSettings> {
  const { db, userId, payload, triggerSource } = params

  await ensureUserSettingsRow(db, userId)
  const existing = await getUserSettings(db, userId)

  const resolved: ResolvedUserSettings = {
    morning_brief_time: payload.morning_brief_time || existing?.morning_brief_time || '08:00',
    evening_brief_time: payload.evening_brief_time || existing?.evening_brief_time || '21:00',
    do_not_disturb_enabled:
      payload.do_not_disturb_enabled !== undefined
        ? payload.do_not_disturb_enabled
        : Boolean(existing?.do_not_disturb_enabled),
    do_not_disturb_start:
      payload.do_not_disturb_start !== undefined
        ? payload.do_not_disturb_start || null
        : existing?.do_not_disturb_start || null,
    do_not_disturb_end:
      payload.do_not_disturb_end !== undefined
        ? payload.do_not_disturb_end || null
        : existing?.do_not_disturb_end || null,
    sound_enabled:
      payload.sound_enabled !== undefined
        ? payload.sound_enabled
        : existing
          ? Boolean(existing.sound_enabled)
          : true,
    vibration_enabled:
      payload.vibration_enabled !== undefined
        ? payload.vibration_enabled
        : existing
          ? Boolean(existing.vibration_enabled)
          : true,
  }

  await saveUserSettings(db, userId, resolved)
  await upsertMorningSchedule(db, userId, resolved.morning_brief_time, triggerSource)

  return buildResolvedUserSettings(
    {
      id: existing?.id ?? 0,
      user_id: userId,
      morning_brief_time: resolved.morning_brief_time,
      evening_brief_time: resolved.evening_brief_time,
      do_not_disturb_enabled: resolved.do_not_disturb_enabled ? 1 : 0,
      do_not_disturb_start: resolved.do_not_disturb_start,
      do_not_disturb_end: resolved.do_not_disturb_end,
      sound_enabled: resolved.sound_enabled ? 1 : 0,
      vibration_enabled: resolved.vibration_enabled ? 1 : 0,
    },
    null
  )
}

export async function updateUserAiProviderSettings(params: {
  db: D1Database
  userId: number
  payload: {
    provider?: string | null
    api_key?: string | null
  }
}): Promise<ResolvedUserAiProviderSettings> {
  const { db, userId, payload } = params

  await ensureUserSettingsRow(db, userId)

  const normalizedProvider = String(payload.provider || '').trim().toLowerCase()
  if (!normalizedProvider) {
    await saveUserAiProviderSettings(db, userId, {
      provider: null,
      apiKey: null,
    })
    const updated = await getUserSettings(db, userId)
    return buildResolvedUserAiProviderSettings(updated)
  }

  const definition = getAiPlatformDefinition(normalizedProvider)
  if (!definition) {
    throw new Error('当前平台暂不支持自动配置，请选择列表中的平台。')
  }

  const apiKey = String(payload.api_key || '').trim()
  if (!apiKey) {
    throw new Error('API Key 不能为空。')
  }

  await saveUserAiProviderSettings(db, userId, {
    provider: definition.provider,
    apiKey,
  })

  const updated = await getUserSettings(db, userId)
  return buildResolvedUserAiProviderSettings(updated)
}

export async function createTodoAction(params: {
  db: D1Database
  userId: number
  payload: {
    content: string
    description?: string
    priority?: string
    deadline?: string
    related_type?: string
    related_id?: number
    related_title?: string
    tags?: string[]
  }
}): Promise<TodoRow | null> {
  const { db, userId, payload } = params
  const validPriorities = ['low', 'medium', 'high', 'urgent']
  const priority = validPriorities.includes(String(payload.priority || 'medium'))
    ? String(payload.priority)
    : 'medium'

  return createTodoRow(db, {
    userId,
    content: payload.content,
    description: payload.description || null,
    priority,
    deadline: payload.deadline || null,
    relatedType: payload.related_type || null,
    relatedId: payload.related_id ?? null,
    relatedTitle: payload.related_title || null,
    tags: payload.tags || [],
  })
}

export async function updateTodoAction(params: {
  db: D1Database
  todo: TodoRow
  payload: {
    content?: string
    description?: string
    status?: string
    priority?: string
    deadline?: string
    related_type?: string | null
    related_id?: number | null
    related_title?: string | null
    tags?: string[]
  }
}): Promise<TodoRow | null> {
  const { db, todo, payload } = params
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
  const validPriorities = ['low', 'medium', 'high', 'urgent']

  const status =
    payload.status && validStatuses.includes(payload.status) ? payload.status : todo.status
  const priority =
    payload.priority && validPriorities.includes(payload.priority) ? payload.priority : todo.priority

  await updateTodoRow(db, todo.id, {
    content: payload.content || todo.content,
    description: payload.description !== undefined ? payload.description : todo.description,
    status,
    priority,
    deadline: payload.deadline !== undefined ? payload.deadline : todo.deadline,
    relatedType: payload.related_type !== undefined ? payload.related_type : todo.related_type,
    relatedId: payload.related_id !== undefined ? payload.related_id : todo.related_id,
    relatedTitle: payload.related_title !== undefined ? payload.related_title : todo.related_title,
    tags: payload.tags || (todo.tags ? JSON.parse(todo.tags) : []),
  })

  return getTodoRow(db, todo.id, todo.user_id)
}

export async function deleteTodoAction(params: {
  db: D1Database
  todoId: number
}): Promise<void> {
  await deleteTodoRow(params.db, params.todoId)
}

export async function completeTodoAction(params: {
  db: D1Database
  todo: TodoRow
}): Promise<TodoRow | null> {
  const { db, todo } = params

  await markTodoCompleted(db, todo.id)

  if (todo.related_type === 'opportunity' && todo.related_id != null) {
    const followId = await upsertOpportunityFollowForCompletedTodo(db, todo)
    await upsertOpportunityExecutionResultForCompletedTodo(db, todo, followId)
  }

  return getTodoRow(db, todo.id, todo.user_id)
}

export async function createFavoriteAction(params: {
  db: D1Database
  userId: number
  itemType: string
  itemId: number
  itemTitle: string
  itemSummary?: string | null
  itemSource?: string | null
  itemUrl?: string | null
}): Promise<FavoriteRow | null> {
  const existing = await findFavoriteByItem(params.db, params.userId, params.itemType, params.itemId)
  if (existing) {
    return existing
  }

  return createFavoriteRow(params.db, {
    userId: params.userId,
    itemType: params.itemType,
    itemId: params.itemId,
    itemTitle: params.itemTitle,
    itemSummary: params.itemSummary || null,
    itemSource: params.itemSource || null,
    itemUrl: params.itemUrl || null,
  })
}

export async function deleteFavoriteAction(params: {
  db: D1Database
  favoriteId: number
  userId: number
}): Promise<FavoriteRow | null> {
  const existing = await getFavoriteRow(params.db, params.favoriteId, params.userId)
  if (!existing) {
    return null
  }
  await deleteFavoriteRow(params.db, params.favoriteId)
  return existing
}

export async function createNoteAction(params: {
  db: D1Database
  userId: number
  content: string
  sourceType?: string
  sourceId?: number | null
  tags?: string[]
}): Promise<NoteRow | null> {
  return createNoteRow(params.db, {
    userId: params.userId,
    content: params.content,
    sourceType: params.sourceType || 'manual',
    sourceId: params.sourceId ?? null,
    tags: params.tags || [],
  })
}

export async function updateNoteAction(params: {
  db: D1Database
  noteId: number
  userId: number
  content?: string
  tags?: string[]
}): Promise<NoteRow | null> {
  const existing = await getNoteRow(params.db, params.noteId, params.userId)
  if (!existing) {
    return null
  }
  await updateNoteRow(
    params.db,
    params.noteId,
    params.content || existing.content,
    params.tags || (existing.tags ? JSON.parse(existing.tags) : [])
  )
  return getNoteRow(params.db, params.noteId, params.userId)
}

export async function deleteNoteAction(params: {
  db: D1Database
  noteId: number
  userId: number
}): Promise<NoteRow | null> {
  const existing = await getNoteRow(params.db, params.noteId, params.userId)
  if (!existing) {
    return null
  }
  await deleteNoteRow(params.db, params.noteId)
  return existing
}

export async function createHistoryAction(params: {
  db: D1Database
  userId: number
  eventType: string
  title: string
  summary?: string | null
  refType?: string | null
  refId?: number | null
}): Promise<HistoryRow | null> {
  return createHistoryRow(params.db, {
    userId: params.userId,
    eventType: params.eventType,
    title: params.title,
    summary: params.summary || null,
    refType: params.refType || null,
    refId: params.refId ?? null,
  })
}
