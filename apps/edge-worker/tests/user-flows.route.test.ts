import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withSession } from './helpers/session-auth'

const flowState = vi.hoisted(() => {
  const createInitialState = () => ({
    interests: ['写作'],
    hotTopics: [
      {
        id: 1,
        title: 'AI 写作工具升级',
        summary: '今天最值得关注的 AI 写作热点。',
        source: '新闻源',
        source_url: 'https://example.com/hot-topics/1',
        categories: '["AI","写作"]',
        tags: '["AI","写作"]',
        hot_value: 96,
        quality_score: 9.1,
        published_at: '2026-04-17 08:00:00',
      },
      {
        id: 2,
        title: '写作方法补充阅读',
        summary: '与写作方法论相关。',
        source: '新闻源',
        source_url: 'https://example.com/hot-topics/2',
        categories: '["写作"]',
        tags: '["写作"]',
        hot_value: 84,
        quality_score: 8.2,
        published_at: '2026-04-16 09:00:00',
      },
    ],
    opportunities: [
      {
        id: 11,
        title: 'AI 写作训练营征稿',
        type: 'submission',
        status: 'active',
        source: '机会站',
        source_url: 'https://example.com/opportunities/11',
        summary: '适合 AI 与写作方向的机会。',
        reward: '500元',
        location: null,
        is_remote: 1,
        deadline: '2026-05-01',
        tags: '["AI","写作"]',
        quality_score: 8.8,
      },
    ],
    articles: [
      {
        id: 21,
        title: 'AI 协作写作方法',
        summary: '文章摘要：把 AI 接入日常写作流程。',
        content: '完整正文：这里是 AI 协作写作的方法细节。',
        source_name: '博客',
        source_url: 'https://example.com/articles/21',
        author: '作者A',
        category: '写作',
        tags: '["AI","写作"]',
        publish_time: '2026-04-16 10:00:00',
        quality_score: 8.5,
      },
    ],
    favorites: [] as Array<{
      id: number
      user_id: number
      item_type: string
      item_id: number
      item_title: string | null
      item_summary: string | null
      item_source: string | null
      item_url: string | null
      created_at: string
    }>,
    history: [] as Array<{
      id: number
      user_id: number
      event_type: string
      title: string
      summary: string | null
      ref_type: string | null
      ref_id: number | null
      created_at: string
    }>,
    notes: [] as Array<{
      id: number
      user_id: number
      content: string
      source_type: string
      source_id: number | null
      tags: string | null
      created_at: string
    }>,
    todos: [] as Array<{
      id: number
      user_id: number
      content: string
      description: string | null
      status: string
      priority: string
      deadline: string | null
      related_type: string | null
      related_id: number | null
      related_title: string | null
      tags: string | null
      created_at: string
      updated_at: string
    }>,
    follows: [] as Array<{
      follow_id: number
      opportunity_id: number
      status: 'new' | 'watching' | 'applied' | 'waiting' | 'completed'
      progress_text: string | null
      next_step: string | null
      updated_at: string
    }>,
    feedback: [] as Array<{
      id: number
      user_id: number
      feedback_type: 'bug' | 'suggestion' | 'other'
      content: string
      source_page: string | null
      status: string
      created_at: string
      updated_at: string | null
    }>,
    settings: {
      morning_brief_time: '08:00',
      evening_brief_time: '21:00',
      do_not_disturb_enabled: false,
      do_not_disturb_start: null as string | null,
      do_not_disturb_end: null as string | null,
      sound_enabled: true,
      vibration_enabled: true,
    },
    schedules: [
      {
        id: 301,
        briefing_type: 'morning',
        schedule_time: '08:00',
        status: 'active',
        next_run_at: '2026-04-18 08:00:00',
      },
    ],
    briefings: [
      {
        title: '晨间简报',
        briefing_date: '2026-04-17',
      },
    ],
    checkedInToday: false,
    streakDays: 4,
  })

  let state = createInitialState()

  return {
    get: () => state,
    reset: () => {
      state = createInitialState()
    },
  }
})

vi.mock('../src/utils/auth', () => ({
  resolveSessionUser: vi.fn(async (c: { req: { header(name: string): string | undefined } }) => {
    const { resolveSessionUserFromCookie } = await import('./helpers/session-auth')
    return resolveSessionUserFromCookie(c)
  }),
}))

vi.mock('../src/services/content', async () => {
  const actual = await vi.importActual<typeof import('../src/services/content')>('../src/services/content')

  return {
    ...actual,
    listHotTopics: vi.fn(async (_db, limit = 8) => flowState.get().hotTopics.slice(0, limit)),
    listOpportunities: vi.fn(async (_db, limit = 6) =>
      flowState.get().opportunities.filter((item) => String(item.status).toLowerCase() === 'active').slice(0, limit)
    ),
    getUserInterests: vi.fn(async () => [...flowState.get().interests]),
    replaceUserInterests: vi.fn(async (_db, _userId: number, interests: string[]) => {
      const normalized = Array.from(new Set(interests.map((item) => String(item).trim()).filter(Boolean)))
      flowState.get().interests = normalized
      return normalized
    }),
    getHotTopicById: vi.fn(async (_db, id: number) => flowState.get().hotTopics.find((item) => item.id === id) ?? null),
    getOpportunityById: vi.fn(async (_db, id: number) => flowState.get().opportunities.find((item) => item.id === id) ?? null),
    getArticleById: vi.fn(async (_db, id: number) => flowState.get().articles.find((item) => item.id === id) ?? null),
    listRelatedItemsForHotTopic: vi.fn(async () => {
      const article = flowState.get().articles[0]
      return article
        ? [{
            content_type: 'article' as const,
            id: article.id,
            title: article.title,
            summary: article.summary,
            source_name: article.source_name,
            source_url: article.source_url,
            relation_reason: '延伸阅读',
          }]
        : []
    }),
    listRelatedItemsForOpportunity: vi.fn(async () => {
      const hotTopic = flowState.get().hotTopics[0]
      return hotTopic
        ? [{
            content_type: 'hot_topic' as const,
            id: hotTopic.id,
            title: hotTopic.title,
            summary: hotTopic.summary,
            source_name: hotTopic.source,
            source_url: hotTopic.source_url,
            relation_reason: '同方向热点',
          }]
        : []
    }),
    listRelatedItemsForArticle: vi.fn(async () => {
      const hotTopic = flowState.get().hotTopics[0]
      return hotTopic
        ? [{
            content_type: 'hot_topic' as const,
            id: hotTopic.id,
            title: hotTopic.title,
            summary: hotTopic.summary,
            source_name: hotTopic.source,
            source_url: hotTopic.source_url,
            relation_reason: '同主题热点',
          }]
        : []
    }),
  }
})

vi.mock('../src/services/behavior', async () => {
  const actual = await vi.importActual<typeof import('../src/services/behavior')>('../src/services/behavior')

  const nextId = <T extends { id: number }>(rows: T[]) =>
    rows.length > 0 ? Math.max(...rows.map((row) => row.id)) + 1 : 1

  const nextFollowId = () =>
    flowState.get().follows.length > 0
      ? Math.max(...flowState.get().follows.map((row) => row.follow_id)) + 1
      : 1

  return {
    ...actual,
    listFavoriteRows: vi.fn(async (_db, _userId: number, itemType?: string | null) => {
      const rows = flowState.get().favorites
      return itemType ? rows.filter((item) => item.item_type === itemType) : [...rows]
    }),
    createFavoriteAction: vi.fn(async ({ userId, itemType, itemId, itemTitle, itemSummary, itemSource, itemUrl }: {
      db: D1Database
      userId: number
      itemType: string
      itemId: number
      itemTitle: string
      itemSummary?: string | null
      itemSource?: string | null
      itemUrl?: string | null
    }) => {
      const state = flowState.get()
      const existing = state.favorites.find(
        (item) => item.user_id === userId && item.item_type === itemType && item.item_id === itemId
      )
      if (existing) return existing
      const favorite = {
        id: nextId(state.favorites),
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        item_title: itemTitle,
        item_summary: itemSummary || null,
        item_source: itemSource || null,
        item_url: itemUrl || null,
        created_at: '2026-04-17T10:00:00',
      }
      state.favorites.push(favorite)
      return favorite
    }),
    deleteFavoriteAction: vi.fn(async ({ favoriteId, userId }: { db: D1Database; favoriteId: number; userId: number }) => {
      const state = flowState.get()
      const index = state.favorites.findIndex((item) => item.id === favoriteId && item.user_id === userId)
      if (index < 0) return null
      const [favorite] = state.favorites.splice(index, 1)
      return favorite
    }),
    listHistoryRows: vi.fn(async (_db, _userId: number, eventType?: string | null) => {
      const rows = flowState.get().history
      return eventType ? rows.filter((row) => row.event_type === eventType) : [...rows]
    }),
    createHistoryAction: vi.fn(async ({ userId, eventType, title, summary, refType, refId }: {
      db: D1Database
      userId: number
      eventType: string
      title: string
      summary?: string | null
      refType?: string | null
      refId?: number | null
    }) => {
      const state = flowState.get()
      const history = {
        id: nextId(state.history),
        user_id: userId,
        event_type: eventType,
        title,
        summary: summary || null,
        ref_type: refType || null,
        ref_id: refId ?? null,
        created_at: '2026-04-17T10:05:00',
      }
      state.history.push(history)
      return history
    }),
    listNoteRows: vi.fn(async (_db, _userId: number, sourceType?: string | null) => {
      const rows = flowState.get().notes
      return sourceType ? rows.filter((row) => row.source_type === sourceType) : [...rows]
    }),
    getNoteRow: vi.fn(async (_db, noteId: number, userId: number) =>
      flowState.get().notes.find((row) => row.id === noteId && row.user_id === userId) ?? null
    ),
    createNoteAction: vi.fn(async ({ userId, content, sourceType, sourceId, tags }: {
      db: D1Database
      userId: number
      content: string
      sourceType?: string
      sourceId?: number | null
      tags?: string[]
    }) => {
      const state = flowState.get()
      const note = {
        id: nextId(state.notes),
        user_id: userId,
        content,
        source_type: sourceType || 'manual',
        source_id: sourceId ?? null,
        tags: JSON.stringify(tags || []),
        created_at: '2026-04-17T11:00:00',
      }
      state.notes.push(note)
      return note
    }),
    updateNoteAction: vi.fn(async ({ noteId, userId, content, tags }: {
      db: D1Database
      noteId: number
      userId: number
      content?: string
      tags?: string[]
    }) => {
      const note = flowState.get().notes.find((row) => row.id === noteId && row.user_id === userId)
      if (!note) return null
      note.content = content || note.content
      note.tags = JSON.stringify(tags || (note.tags ? JSON.parse(note.tags) : []))
      return note
    }),
    deleteNoteAction: vi.fn(async ({ noteId, userId }: { db: D1Database; noteId: number; userId: number }) => {
      const state = flowState.get()
      const index = state.notes.findIndex((row) => row.id === noteId && row.user_id === userId)
      if (index < 0) return null
      const [note] = state.notes.splice(index, 1)
      return note
    }),
    listTodoRows: vi.fn(async (_db, input: { userId: number; status?: string | null; priority?: string | null }) => {
      let rows = flowState.get().todos.filter((row) => row.user_id === input.userId)
      if (input.status) rows = rows.filter((row) => row.status === input.status)
      if (input.priority) rows = rows.filter((row) => row.priority === input.priority)
      return [...rows]
    }),
    getTodoRow: vi.fn(async (_db, todoId: number, userId: number) =>
      flowState.get().todos.find((row) => row.id === todoId && row.user_id === userId) ?? null
    ),
    listTodos: vi.fn(async (_db, userId: number) =>
      flowState.get().todos
        .filter((row) => row.user_id === userId)
        .map((row) => ({
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          status: row.status,
          priority: row.priority,
          deadline: row.deadline,
          related_type: row.related_type,
          related_id: row.related_id,
          tags: row.tags || '[]',
        }))
    ),
    createTodoAction: vi.fn(async ({ userId, payload }: {
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
    }) => {
      const state = flowState.get()
      const todo = {
        id: nextId(state.todos),
        user_id: userId,
        content: payload.content,
        description: payload.description || null,
        status: 'pending',
        priority: payload.priority || 'medium',
        deadline: payload.deadline || null,
        related_type: payload.related_type || null,
        related_id: payload.related_id ?? null,
        related_title: payload.related_title || null,
        tags: JSON.stringify(payload.tags || []),
        created_at: '2026-04-17T11:10:00',
        updated_at: '2026-04-17T11:10:00',
      }
      state.todos.push(todo)
      return todo
    }),
    updateTodoAction: vi.fn(async ({ todo, payload }: {
      db: D1Database
      todo: {
        id: number
        user_id: number
        content: string
        description: string | null
        status: string
        priority: string
        deadline: string | null
        related_type: string | null
        related_id: number | null
        related_title: string | null
        tags: string | null
        created_at: string
        updated_at: string
      }
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
    }) => {
      const existing = flowState.get().todos.find((row) => row.id === todo.id)
      if (!existing) return null
      existing.content = payload.content || existing.content
      existing.description = payload.description !== undefined ? payload.description : existing.description
      existing.status = payload.status || existing.status
      existing.priority = payload.priority || existing.priority
      existing.deadline = payload.deadline !== undefined ? payload.deadline || null : existing.deadline
      existing.related_type = payload.related_type !== undefined ? payload.related_type : existing.related_type
      existing.related_id = payload.related_id !== undefined ? payload.related_id ?? null : existing.related_id
      existing.related_title = payload.related_title !== undefined ? payload.related_title ?? null : existing.related_title
      existing.tags = JSON.stringify(payload.tags || (existing.tags ? JSON.parse(existing.tags) : []))
      return existing
    }),
    deleteTodoAction: vi.fn(async ({ todoId }: { db: D1Database; todoId: number }) => {
      const state = flowState.get()
      const index = state.todos.findIndex((row) => row.id === todoId)
      if (index >= 0) {
        state.todos.splice(index, 1)
      }
    }),
    completeTodoAction: vi.fn(async ({ todo }: { db: D1Database; todo: {
      id: number
      user_id: number
      content: string
      description: string | null
      status: string
      priority: string
      deadline: string | null
      related_type: string | null
      related_id: number | null
      related_title: string | null
      tags: string | null
      created_at: string
      updated_at: string
    } }) => {
      const state = flowState.get()
      const existing = state.todos.find((row) => row.id === todo.id)
      if (!existing) return null
      existing.status = 'completed'
      if (existing.related_type === 'opportunity' && existing.related_id != null) {
        const existingFollow = state.follows.find((row) => row.opportunity_id === existing.related_id)
        if (existingFollow) {
          existingFollow.status = 'completed'
          existingFollow.progress_text = '关联待办已完成，进入结果沉淀'
          existingFollow.next_step = `已完成：${existing.content.substring(0, 80)}`
        } else {
          state.follows.push({
            follow_id: nextFollowId(),
            opportunity_id: existing.related_id,
            status: 'completed',
            progress_text: '关联待办已完成，进入结果沉淀',
            next_step: `已完成：${existing.content.substring(0, 80)}`,
            updated_at: '2026-04-17T12:00:00',
          })
        }
      }
      return existing
    }),
    getActionReminderSettings: vi.fn(async () => ({
      morning_brief_time: flowState.get().settings.morning_brief_time,
      do_not_disturb_enabled: flowState.get().settings.do_not_disturb_enabled ? 1 : 0,
    })),
    listSavedItemsForActionOverview: vi.fn(async () => [...flowState.get().favorites]),
    listFollowingItemsForActionOverview: vi.fn(async () =>
      flowState.get().follows.map((follow) => ({
        follow_id: follow.follow_id,
        title: flowState.get().opportunities.find((item) => item.id === follow.opportunity_id)?.title || '未知机会',
        follow_status: follow.status,
        deadline: flowState.get().opportunities.find((item) => item.id === follow.opportunity_id)?.deadline || null,
        progress_text: follow.progress_text,
        next_step: follow.next_step,
      }))
    ),
    listActiveBriefingSchedules: vi.fn(async () => [...flowState.get().schedules]),
    getProfileCounts: vi.fn(async () => ({
      notes_count: flowState.get().notes.length,
      favorites_count: flowState.get().favorites.length,
      completed_todos: flowState.get().todos.filter((row) => row.status === 'completed').length,
      total_todos: flowState.get().todos.length,
      history_count: flowState.get().history.length,
    })),
    getLatestBriefing: vi.fn(async () => flowState.get().briefings[0] || null),
    getLatestNote: vi.fn(async () => {
      const rows = flowState.get().notes
      return rows.length > 0 ? rows[rows.length - 1] : null
    }),
    getLatestOpportunityFollow: vi.fn(async () => {
      const rows = flowState.get().follows
      if (rows.length === 0) return null
      const last = rows[rows.length - 1]
      return {
        next_step: last.next_step,
        progress_text: last.progress_text,
        updated_at: last.updated_at,
        created_at: last.updated_at,
      }
    }),
    getActivityStreak: vi.fn(async () => flowState.get().streakDays),
    getCheckedInToday: vi.fn(async () => flowState.get().checkedInToday),
    appendHistory: vi.fn(async (_db, userId: number, eventType: string, title: string, summary?: string) => {
      flowState.get().history.push({
        id: nextId(flowState.get().history),
        user_id: userId,
        event_type: eventType,
        title,
        summary: summary || null,
        ref_type: null,
        ref_id: null,
        created_at: '2026-04-17T12:05:00',
      })
      if (eventType === 'daily_check_in') {
        flowState.get().checkedInToday = true
      }
      return true
    }),
    getUserSettings: vi.fn(async () => ({
      id: 1,
      user_id: 1,
      morning_brief_time: flowState.get().settings.morning_brief_time,
      evening_brief_time: flowState.get().settings.evening_brief_time,
      do_not_disturb_enabled: flowState.get().settings.do_not_disturb_enabled ? 1 : 0,
      do_not_disturb_start: flowState.get().settings.do_not_disturb_start,
      do_not_disturb_end: flowState.get().settings.do_not_disturb_end,
      sound_enabled: flowState.get().settings.sound_enabled ? 1 : 0,
      vibration_enabled: flowState.get().settings.vibration_enabled ? 1 : 0,
    })),
    getMorningBriefingScheduleState: vi.fn(async () => ({
      status: flowState.get().schedules[0]?.status ?? null,
      next_run_at: flowState.get().schedules[0]?.next_run_at ?? null,
    })),
    updateUserSettings: vi.fn(async ({ payload }: {
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
    }) => {
      const settings = flowState.get().settings
      settings.morning_brief_time = payload.morning_brief_time || settings.morning_brief_time
      settings.evening_brief_time = payload.evening_brief_time || settings.evening_brief_time
      settings.do_not_disturb_enabled =
        payload.do_not_disturb_enabled !== undefined ? payload.do_not_disturb_enabled : settings.do_not_disturb_enabled
      settings.do_not_disturb_start =
        payload.do_not_disturb_start !== undefined ? payload.do_not_disturb_start || null : settings.do_not_disturb_start
      settings.do_not_disturb_end =
        payload.do_not_disturb_end !== undefined ? payload.do_not_disturb_end || null : settings.do_not_disturb_end
      settings.sound_enabled = payload.sound_enabled !== undefined ? payload.sound_enabled : settings.sound_enabled
      settings.vibration_enabled =
        payload.vibration_enabled !== undefined ? payload.vibration_enabled : settings.vibration_enabled
      if (flowState.get().schedules[0]) {
        flowState.get().schedules[0].schedule_time = settings.morning_brief_time
      }
      return {
        morning_brief_time: settings.morning_brief_time,
        evening_brief_time: settings.evening_brief_time,
        do_not_disturb_enabled: settings.do_not_disturb_enabled,
        do_not_disturb_start: settings.do_not_disturb_start,
        do_not_disturb_end: settings.do_not_disturb_end,
        sound_enabled: settings.sound_enabled,
        vibration_enabled: settings.vibration_enabled,
      }
    }),
  }
})

vi.mock('../src/services/system', async () => {
  const actual = await vi.importActual<typeof import('../src/services/system')>('../src/services/system')

  return {
    ...actual,
    listFeedbackSubmissions: vi.fn(async (_db, userId: number, limit: number) =>
      flowState.get().feedback.filter((row) => row.user_id === userId).slice(0, limit)
    ),
    createFeedbackSubmissionAction: vi.fn(async ({ userId, payload }: {
      db: D1Database
      userId: number
      payload: {
        feedback_type?: 'bug' | 'suggestion' | 'other'
        content?: string
        source_page?: string | null
      }
    }) => {
      const feedbackType = payload.feedback_type || 'suggestion'
      const content = String(payload.content || '').trim()
      const sourcePage = payload.source_page || null
      if (!content) {
        return { error: '反馈内容不能为空' as const }
      }
      if (!['bug', 'suggestion', 'other'].includes(feedbackType)) {
        return { error: '反馈类型无效' as const }
      }
      const row = {
        id: flowState.get().feedback.length + 1,
        user_id: userId,
        feedback_type: feedbackType,
        content,
        source_page: sourcePage,
        status: 'submitted',
        created_at: '2026-04-17T12:30:00',
        updated_at: '2026-04-17T12:30:00',
      }
      flowState.get().feedback.push(row)
      return { submission: row }
    }),
  }
})

import dashboardRoutes from '../src/routes/dashboard'
import contentRoutes from '../src/routes/content'
import preferencesRoutes from '../src/routes/preferences'
import favoritesRoutes from '../src/routes/favorites'
import historyRoutes from '../src/routes/history'
import notesRoutes from '../src/routes/notes'
import todosRoutes from '../src/routes/todos'
import actionsRoutes from '../src/routes/actions'
import feedbackRoutes from '../src/routes/feedback'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/dashboard', dashboardRoutes)
  app.route('/api/v1/content', contentRoutes)
  app.route('/api/v1/preferences', preferencesRoutes)
  app.route('/api/v1/favorites', favoritesRoutes)
  app.route('/api/v1/history', historyRoutes)
  app.route('/api/v1/notes', notesRoutes)
  app.route('/api/v1/todos', todosRoutes)
  app.route('/api/v1/actions', actionsRoutes)
  app.route('/api/v1/feedback', feedbackRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers route user flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flowState.reset()
  })

  it('supports the Today -> Content Detail -> Favorite -> History browsing flow', async () => {
    const app = buildApp()

    const todayResponse = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(todayResponse.status).toBe(200)
    const todayPayload = await todayResponse.json()
    const contentRef = todayPayload.worthKnowing[0].contentRef as string
    expect(contentRef).toBe('hot_topic:1')

    const detailResponse = await app.request(
      `/api/v1/content/by-ref?content_ref=${encodeURIComponent(contentRef)}`,
      withSession(),
      mockEnv()
    )
    expect(detailResponse.status).toBe(200)
    const detailPayload = await detailResponse.json()
    expect(detailPayload.contentRef).toBe(contentRef)
    expect(detailPayload.relatedItems.length).toBeGreaterThan(0)

    const favoriteCreateResponse = await app.request(
      '/api/v1/favorites',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content_ref: contentRef,
          item_title: detailPayload.title,
          item_summary: detailPayload.summary,
          item_source: detailPayload.sourceName,
          item_url: detailPayload.sourceUrl,
        }),
      }),
      mockEnv()
    )
    expect(favoriteCreateResponse.status).toBe(200)
    const favoriteCreatePayload = await favoriteCreateResponse.json()
    expect(favoriteCreatePayload.content_ref).toBe(contentRef)

    const favoritesResponse = await app.request('/api/v1/favorites', withSession(), mockEnv())
    expect(favoritesResponse.status).toBe(200)
    const favoritesPayload = await favoritesResponse.json()
    expect(favoritesPayload.total).toBe(1)
    expect(favoritesPayload.items[0].content_ref).toBe(contentRef)

    const historyCreateResponse = await app.request(
      '/api/v1/history',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'read',
          title: detailPayload.title,
          summary: '从详情页进入后记录历史',
          content_ref: contentRef,
        }),
      }),
      mockEnv()
    )
    expect(historyCreateResponse.status).toBe(200)
    const historyCreatePayload = await historyCreateResponse.json()
    expect(historyCreatePayload.content_ref).toBe(contentRef)

    const historyResponse = await app.request('/api/v1/history', withSession(), mockEnv())
    expect(historyResponse.status).toBe(200)
    const historyPayload = await historyResponse.json()
    expect(historyPayload.total).toBe(1)
    expect(historyPayload.items[0].content_ref).toBe(contentRef)
  })

  it('supports the Interest Config -> Preferences -> Today recommendation refresh flow', async () => {
    const app = buildApp()

    const beforeResponse = await app.request('/api/v1/preferences/interests', withSession(), mockEnv())
    expect(beforeResponse.status).toBe(200)
    const beforePayload = await beforeResponse.json()
    expect(beforePayload.interests).toEqual(['写作'])

    const updateResponse = await app.request(
      '/api/v1/preferences/interests',
      withSession({
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interests: ['AI', '写作'] }),
      }),
      mockEnv()
    )
    expect(updateResponse.status).toBe(200)

    const afterResponse = await app.request('/api/v1/preferences/interests', withSession(), mockEnv())
    expect(afterResponse.status).toBe(200)
    const afterPayload = await afterResponse.json()
    expect(afterPayload.interests).toEqual(['AI', '写作'])

    const todayResponse = await app.request('/api/v1/dashboard/today', withSession(), mockEnv())
    expect(todayResponse.status).toBe(200)
    const todayPayload = await todayResponse.json()
    expect(todayPayload.recommendedForYou.map((item: { interestName: string }) => item.interestName)).toContain('AI')
  })

  it('supports the Journal -> Todo -> Actions -> Growth loop', async () => {
    const app = buildApp()

    const noteResponse = await app.request(
      '/api/v1/notes',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: '今天想到一个 AI 写作选题。',
          source_type: 'manual',
          tags: ['AI', '写作'],
        }),
      }),
      mockEnv()
    )
    expect(noteResponse.status).toBe(200)

    const todoCreateResponse = await app.request(
      '/api/v1/todos',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: '跟进 AI 写作训练营征稿',
          priority: 'high',
          related_type: 'opportunity',
          related_id: 11,
          related_title: 'AI 写作训练营征稿',
        }),
      }),
      mockEnv()
    )
    expect(todoCreateResponse.status).toBe(200)
    const todoCreatePayload = await todoCreateResponse.json()

    const completeResponse = await app.request(
      `/api/v1/todos/${todoCreatePayload.id}/complete`,
      withSession({ method: 'POST' }),
      mockEnv()
    )
    expect(completeResponse.status).toBe(200)
    const completedPayload = await completeResponse.json()
    expect(completedPayload.status).toBe('completed')

    const actionsResponse = await app.request('/api/v1/actions/overview', withSession(), mockEnv())
    expect(actionsResponse.status).toBe(200)
    const actionsPayload = await actionsResponse.json()
    expect(actionsPayload.completedTodos.some((item: { todoId: number }) => item.todoId === todoCreatePayload.id)).toBe(true)
    expect(actionsPayload.followingItems.length).toBeGreaterThan(0)

    const profileResponse = await app.request('/api/v1/preferences/profile', withSession(), mockEnv())
    expect(profileResponse.status).toBe(200)
    const profilePayload = await profileResponse.json()
    expect(profilePayload.notes_count).toBe(1)
    expect(profilePayload.completed_todos).toBe(1)

    const growthResponse = await app.request('/api/v1/preferences/growth-overview', withSession(), mockEnv())
    expect(growthResponse.status).toBe(200)
    const growthPayload = await growthResponse.json()
    expect(growthPayload.totalThoughts).toBe(1)
    expect(growthPayload.reports.every((item: { available: boolean }) => item.available)).toBe(true)
    expect(growthPayload.recentHistoryItems.length).toBeGreaterThan(0)
  })

  it('supports the Help & Feedback submission flow', async () => {
    const app = buildApp()

    const submitResponse = await app.request(
      '/api/v1/feedback',
      withSession({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'suggestion',
          content: '希望在成长页增加更明显的阶段变化提示。',
          source_page: '/help-feedback',
        }),
      }),
      mockEnv()
    )
    expect(submitResponse.status).toBe(200)
    const submitPayload = await submitResponse.json()
    expect(submitPayload.success).toBe(true)
    expect(submitPayload.submission.feedbackType).toBe('suggestion')

    const listResponse = await app.request('/api/v1/feedback', withSession(), mockEnv())
    expect(listResponse.status).toBe(200)
    const listPayload = await listResponse.json()
    expect(listPayload.total).toBe(1)
    expect(listPayload.items[0].sourcePage).toBe('/help-feedback')
  })
})
