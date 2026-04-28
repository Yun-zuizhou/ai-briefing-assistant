import { execute, queryOne } from './db'

type DemoTodoSeed = {
  content: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: string | null
  relatedType?: string | null
  relatedId?: number | null
  relatedTitle?: string | null
  tags: string[]
  completedAt?: string | null
  createdAt: string
  updatedAt?: string | null
}

type DemoFavoriteSeed = {
  itemType: 'hot_topic' | 'article' | 'opportunity'
  itemId: number
  title: string
  summary?: string | null
  source?: string | null
  url?: string | null
  createdAt: string
}

type DemoNoteSeed = {
  content: string
  sourceType: string
  sourceId?: number | null
  tags: string[]
  createdAt: string
}

type DemoHistorySeed = {
  eventType: string
  title: string
  summary?: string | null
  refType?: string | null
  refId?: number | null
  createdAt: string
}

type DemoFollowSeed = {
  opportunityId: number
  status: 'new' | 'watching' | 'applied' | 'waiting' | 'completed'
  note?: string | null
  nextStep?: string | null
  createdAt: string
  updatedAt?: string | null
}

type DemoUserSeed = {
  nickname: string
  interests: string[]
  totalRead: number
  streakDays: number
  settings: {
    morningBriefTime: string
    eveningBriefTime: string
    doNotDisturbEnabled: boolean
  }
  todos: DemoTodoSeed[]
  favorites: DemoFavoriteSeed[]
  notes: DemoNoteSeed[]
  history: DemoHistorySeed[]
  follows: DemoFollowSeed[]
}

type BehaviorCounts = {
  interests_count: number
  notes_count: number
  favorites_count: number
  history_count: number
  todos_count: number
  follows_count: number
}

const DEMO_USER_SEEDS: Record<string, DemoUserSeed> = {
  'test@example.com': {
    nickname: '测试用户',
    interests: ['AI', '写作', '远程工作'],
    totalRead: 24,
    streakDays: 6,
    settings: {
      morningBriefTime: '08:10',
      eveningBriefTime: '21:00',
      doNotDisturbEnabled: false,
    },
    todos: [
      {
        content: '补完 GPT 相关周报的个人观点',
        description: '把今天看到的热点整理成可以复用的观点框架',
        status: 'pending',
        priority: 'high',
        deadline: '2026-04-18',
        relatedType: 'hot_topic',
        relatedId: 1,
        relatedTitle: 'OpenAI发布GPT-5技术预览版',
        tags: ['AI', '写作'],
        createdAt: '2026-04-14 09:30:00',
      },
      {
        content: '投递远程岗位并记录反馈',
        description: '至少完成 1 个岗位投递并在系统里留下后续动作',
        status: 'completed',
        priority: 'medium',
        deadline: '2026-04-15',
        relatedType: 'opportunity',
        relatedId: 1,
        relatedTitle: '远程运营专员（AI产品方向）',
        tags: ['远程工作', '投递'],
        completedAt: '2026-04-15 19:40:00',
        createdAt: '2026-04-15 10:10:00',
        updatedAt: '2026-04-15 19:40:00',
      },
    ],
    favorites: [
      {
        itemType: 'opportunity',
        itemId: 1,
        title: '远程运营专员（AI产品方向）',
        summary: '负责 AI 产品的日常运营工作，支持远程办公。',
        source: '拉勾网',
        url: 'https://lagou.com/jobs/remote-ai-operator',
        createdAt: '2026-04-14 08:20:00',
      },
      {
        itemType: 'opportunity',
        itemId: 2,
        title: '技术博客征稿 | AI前沿技术',
        summary: 'AI 技术博客征稿，适合沉淀写作表达。',
        source: '掘金',
        url: 'https://juejin.cn/post/ai-article-call',
        createdAt: '2026-04-14 12:30:00',
      },
      {
        itemType: 'hot_topic',
        itemId: 1,
        title: 'OpenAI发布GPT-5技术预览版',
        summary: '新版本在推理、多模态和代码生成方面明显增强。',
        source: 'OpenAI官方博客',
        url: 'https://openai.com/blog/gpt-5-preview',
        createdAt: '2026-04-15 08:55:00',
      },
    ],
    notes: [
      {
        content: 'GPT 的能力边界越来越像“工作流搭子”，但真正值钱的还是自己如何拆问题。',
        sourceType: 'briefing',
        sourceId: 1,
        tags: ['AI', '思考'],
        createdAt: '2026-04-14 09:00:00',
      },
      {
        content: '写作不是输出附属品，反而是帮助我把热点变成长期能力的工具。',
        sourceType: 'manual',
        tags: ['写作', '复盘'],
        createdAt: '2026-04-14 21:10:00',
      },
      {
        content: '远程岗位看起来很多，但真正适合我的还是要结合长期作品积累。',
        sourceType: 'briefing',
        sourceId: 2,
        tags: ['远程工作', '职业规划'],
        createdAt: '2026-04-15 20:05:00',
      },
    ],
    history: [
      {
        eventType: 'briefing_read',
        title: '阅读晨间简报',
        summary: '浏览了今天与 AI 和远程工作相关的重点内容。',
        createdAt: '2026-04-14 08:40:00',
      },
      {
        eventType: 'favorite_added',
        title: '收藏机会',
        summary: '把远程岗位加入稍后处理队列。',
        refType: 'opportunity',
        refId: 1,
        createdAt: '2026-04-14 08:45:00',
      },
      {
        eventType: 'note_created',
        title: '新增记录',
        summary: '记录了对 GPT 与写作关系的想法。',
        createdAt: '2026-04-14 09:00:00',
      },
      {
        eventType: 'todo_completed',
        title: '完成远程岗位投递',
        summary: '已完成一条远程岗位投递动作。',
        refType: 'opportunity',
        refId: 1,
        createdAt: '2026-04-15 19:40:00',
      },
    ],
    follows: [
      {
        opportunityId: 1,
        status: 'waiting',
        note: '已投递，等待初筛反馈。',
        nextStep: '两天后回看投递结果并补发作品集。',
        createdAt: '2026-04-15 19:40:00',
        updatedAt: '2026-04-15 19:40:00',
      },
    ],
  },
  'show@example.com': {
    nickname: '展示用户',
    interests: ['前端设计', '远程工作', '作品集'],
    totalRead: 17,
    streakDays: 4,
    settings: {
      morningBriefTime: '09:00',
      eveningBriefTime: '22:00',
      doNotDisturbEnabled: true,
    },
    todos: [
      {
        content: '整理 landing page 的视觉层级改版',
        description: '把首屏信息层级、按钮主次和案例展示重排一遍',
        status: 'pending',
        priority: 'high',
        deadline: '2026-04-19',
        tags: ['前端设计', '作品集'],
        createdAt: '2026-04-15 11:20:00',
      },
      {
        content: '完成作品集案例的中英文双语介绍',
        description: '至少补齐一个远程协作项目案例',
        status: 'completed',
        priority: 'medium',
        deadline: '2026-04-15',
        tags: ['作品集', '远程工作'],
        completedAt: '2026-04-15 18:10:00',
        createdAt: '2026-04-14 14:00:00',
        updatedAt: '2026-04-15 18:10:00',
      },
    ],
    favorites: [
      {
        itemType: 'opportunity',
        itemId: 2,
        title: '技术博客征稿 | AI前沿技术',
        summary: '更适合把前端设计案例写成结构化展示。',
        source: '掘金',
        url: 'https://juejin.cn/post/ai-article-call',
        createdAt: '2026-04-15 09:15:00',
      },
      {
        itemType: 'opportunity',
        itemId: 4,
        title: 'AI创新应用大赛',
        summary: '适合把交互设计与产品表达组合成完整 demo。',
        source: '黑客马拉松',
        url: 'https://hackathon.com/ai-innovation-2026',
        createdAt: '2026-04-15 09:40:00',
      },
    ],
    notes: [
      {
        content: '展示页不能只是堆功能，最重要的是让人一眼知道“我解决了谁的问题”。',
        sourceType: 'manual',
        tags: ['前端设计', '表达'],
        createdAt: '2026-04-15 10:00:00',
      },
      {
        content: '远程岗位筛作品集时，叙事顺序比视觉细节更先被看到。',
        sourceType: 'manual',
        tags: ['远程工作', '作品集'],
        createdAt: '2026-04-15 13:45:00',
      },
      {
        content: '如果 demo 能把交互、文案、结果指标串起来，可信度会一下子上来。',
        sourceType: 'manual',
        tags: ['产品', '案例'],
        createdAt: '2026-04-15 21:20:00',
      },
    ],
    history: [
      {
        eventType: 'favorite_added',
        title: '收藏大赛机会',
        summary: '准备把作品集案例整理后投向 AI 创新应用大赛。',
        refType: 'opportunity',
        refId: 4,
        createdAt: '2026-04-15 09:40:00',
      },
      {
        eventType: 'note_created',
        title: '新增记录',
        summary: '补充了展示页叙事顺序的思考。',
        createdAt: '2026-04-15 13:45:00',
      },
      {
        eventType: 'todo_completed',
        title: '完成作品集双语整理',
        summary: '已补齐一个远程项目案例的中英文介绍。',
        createdAt: '2026-04-15 18:10:00',
      },
    ],
    follows: [
      {
        opportunityId: 4,
        status: 'watching',
        note: '准备把作品集案例整理成比赛可提交版本。',
        nextStep: '先完成首屏改版，再补案例结果页。',
        createdAt: '2026-04-15 19:00:00',
        updatedAt: '2026-04-15 19:00:00',
      },
    ],
  },
}

async function hasBehaviorData(db: D1Database, userId: number): Promise<boolean> {
  const counts = await queryOne<BehaviorCounts>(
    db,
    `
      SELECT
        (SELECT COUNT(*) FROM user_interests WHERE user_id = ?) AS interests_count,
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) AS notes_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites_count,
        (SELECT COUNT(*) FROM history_entries WHERE user_id = ?) AS history_count,
        (SELECT COUNT(*) FROM todos WHERE user_id = ?) AS todos_count,
        (SELECT COUNT(*) FROM opportunity_follows WHERE user_id = ?) AS follows_count
    `,
    [userId, userId, userId, userId, userId, userId]
  )

  const total =
    Number(counts?.interests_count || 0) +
    Number(counts?.notes_count || 0) +
    Number(counts?.favorites_count || 0) +
    Number(counts?.history_count || 0) +
    Number(counts?.todos_count || 0) +
    Number(counts?.follows_count || 0)

  return total > 0
}

export async function maybeBootstrapDemoUser(
  db: D1Database,
  userId: number,
  email: string
): Promise<void> {
  const seed = DEMO_USER_SEEDS[email]
  if (!seed) {
    return
  }

  if (await hasBehaviorData(db, userId)) {
    return
  }

  await execute(
    db,
    `
      UPDATE users
      SET nickname = ?,
          interests = ?,
          total_read = ?,
          total_thoughts = ?,
          total_completed = ?,
          streak_days = ?,
          updated_at = datetime('now'),
          last_login = datetime('now')
      WHERE id = ?
    `,
    [
      seed.nickname,
      JSON.stringify(seed.interests),
      seed.totalRead,
      seed.notes.length,
      seed.todos.filter((item) => item.status === 'completed').length,
      seed.streakDays,
      userId,
    ]
  )

  await execute(
    db,
    `
      INSERT INTO user_settings (
        user_id, morning_brief_time, evening_brief_time, do_not_disturb_enabled,
        sound_enabled, vibration_enabled, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        morning_brief_time = excluded.morning_brief_time,
        evening_brief_time = excluded.evening_brief_time,
        do_not_disturb_enabled = excluded.do_not_disturb_enabled,
        updated_at = datetime('now')
    `,
    [
      userId,
      seed.settings.morningBriefTime,
      seed.settings.eveningBriefTime,
      seed.settings.doNotDisturbEnabled ? 1 : 0,
    ]
  )

  for (const interest of seed.interests) {
    await execute(
      db,
      `
        INSERT INTO user_interests (user_id, interest_name, status, created_at)
        VALUES (?, ?, 'active', datetime('now'))
        ON CONFLICT(user_id, interest_name) DO UPDATE SET
          status = 'active',
          updated_at = datetime('now')
      `,
      [userId, interest]
    )
  }

  for (const todo of seed.todos) {
    await execute(
      db,
      `
        INSERT INTO todos (
          user_id, content, description, status, priority, deadline,
          related_type, related_id, related_title, tags, completed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        todo.content,
        todo.description || null,
        todo.status,
        todo.priority,
        todo.deadline || null,
        todo.relatedType || null,
        todo.relatedId ?? null,
        todo.relatedTitle || null,
        JSON.stringify(todo.tags),
        todo.completedAt || null,
        todo.createdAt,
        todo.updatedAt || todo.createdAt,
      ]
    )
  }

  for (const favorite of seed.favorites) {
    await execute(
      db,
      `
        INSERT INTO favorites (
          user_id, item_type, item_id, item_title, item_summary, item_source, item_url, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        favorite.itemType,
        favorite.itemId,
        favorite.title,
        favorite.summary || null,
        favorite.source || null,
        favorite.url || null,
        favorite.createdAt,
      ]
    )
  }

  for (const note of seed.notes) {
    await execute(
      db,
      `
        INSERT INTO notes (user_id, content, source_type, source_id, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        note.content,
        note.sourceType,
        note.sourceId ?? null,
        JSON.stringify(note.tags),
        note.createdAt,
      ]
    )
  }

  for (const historyItem of seed.history) {
    await execute(
      db,
      `
        INSERT INTO history_entries (
          user_id, event_type, title, summary, ref_type, ref_id, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        historyItem.eventType,
        historyItem.title,
        historyItem.summary || null,
        historyItem.refType || null,
        historyItem.refId ?? null,
        historyItem.createdAt,
      ]
    )
  }

  for (const follow of seed.follows) {
    await execute(
      db,
      `
        INSERT INTO opportunity_follows (
          user_id, opportunity_id, status, note, next_step, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
          status = excluded.status,
          note = excluded.note,
          next_step = excluded.next_step,
          updated_at = excluded.updated_at
      `,
      [
        userId,
        follow.opportunityId,
        follow.status,
        follow.note || null,
        follow.nextStep || null,
        follow.createdAt,
        follow.updatedAt || follow.createdAt,
      ]
    )
  }
}
