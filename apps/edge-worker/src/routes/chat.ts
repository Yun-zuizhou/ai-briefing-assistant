import { Hono } from 'hono'
import { resolveUserId } from '../utils/request-user'
import {
  archiveSession,
  confirmChatMessage,
  createChatMessageStream,
  createNewSession,
  deleteChatMessage,
  getChatSession,
  getChatSessionMessages,
  listChatSessions,
  reclassifyChatMessage,
  renameSession,
  type ChatConfirmRequest,
  type ChatMessageStreamRequest,
  type ChatReclassifyRequest,
} from '../services/chat'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_TRANSPORT?: string
  AI_KEY_ENCRYPTION_SECRET?: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/sessions', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const limit = parseInt(c.req.query('limit') || '20')

  try {
    const sessions = await listChatSessions(db, userId, limit)
    return c.json(sessions)
  } catch (error) {
    console.error('Get chat sessions error:', error)
    return c.json({ error: 'Failed to load chat sessions' }, 500)
  }
})

router.post('/sessions', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const session = await createNewSession(db, userId, null)
    return c.json({
      sessionId: session.id,
      sessionTitle: session.session_title,
      status: session.status,
      lastMessageAt: session.last_message_at,
      messageCount: 0,
    })
  } catch (error) {
    console.error('Create chat session error:', error)
    return c.json({ error: 'Failed to create session' }, 500)
  }
})

router.patch('/sessions/:session_id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const sessionId = parseInt(c.req.param('session_id'))

  const body = await c.req.json<{ session_title: string }>()
  if (!body.session_title?.trim()) {
    return c.json({ error: '会话标题不能为空' }, 400)
  }

  try {
    const updated = await renameSession(db, sessionId, userId, body.session_title.trim())
    if (!updated) {
      return c.json({ error: '会话不存在或无权修改' }, 404)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Rename chat session error:', error)
    return c.json({ error: 'Failed to rename session' }, 500)
  }
})

router.post('/sessions/:session_id/archive', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const sessionId = parseInt(c.req.param('session_id'))

  try {
    const updated = await archiveSession(db, sessionId, userId)
    if (!updated) {
      return c.json({ error: '会话不存在或无权归档' }, 404)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Archive chat session error:', error)
    return c.json({ error: 'Failed to archive session' }, 500)
  }
})

router.get('/sessions/:session_id/messages', async (c) => {
  const db = c.env.DB
  const sessionId = parseInt(c.req.param('session_id'))
  const userId = await resolveUserId(c)

  try {
    const payload = await getChatSessionMessages(db, userId, sessionId)
    if (!payload) {
      const foreignSession = await getChatSession(db, sessionId)
      if (foreignSession) {
        return c.json({ error: '无权访问该会话' }, 403)
      }
      return c.json({ error: '当前会话不存在' }, 404)
    }
    return c.json(payload)
  } catch (error) {
    console.error('Get chat messages error:', error)
    return c.json({ error: 'Failed to load messages' }, 500)
  }
})

router.post('/message', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  const body = await c.req.json<ChatMessageStreamRequest>()
  const stream = createChatMessageStream({
    db,
    userId,
    env: c.env,
    body,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})

router.post('/confirm', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  const body = await c.req.json<ChatConfirmRequest>()

  try {
    return c.json(await confirmChatMessage({ db, userId, body }))
  } catch (error) {
    console.error('Chat confirm error:', error)
    return c.json({
      success: false,
      actionType: body.confirmed_type,
      candidateIntents: [body.confirmed_type],
      confirmedType: body.confirmed_type,
      successMessage: '确认执行失败',
      resultSummary: '请稍后重试。',
    }, 500)
  }
})

router.post('/reclassify', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  const body = await c.req.json<ChatReclassifyRequest>()

  try {
    return c.json(await reclassifyChatMessage({ db, userId, body }))
  } catch (error) {
    console.error('Chat reclassify error:', error)
    return c.json({
      success: false,
      actionType: body.target_intent,
      candidateIntents: [body.target_intent],
      confirmedType: body.target_intent,
      successMessage: '纠偏执行失败，未写入数据库',
      resultSummary: '请稍后重试，当前请求没有进入真实数据链路。',
    }, 500)
  }
})

router.delete('/messages/:message_id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const messageId = parseInt(c.req.param('message_id'))

  if (Number.isNaN(messageId)) {
    return c.json({ error: '无效的消息ID' }, 400)
  }

  try {
    const result = await deleteChatMessage(db, messageId, userId)
    if (!result.deleted) {
      return c.json({ error: '消息不存在或无权删除' }, 404)
    }
    return c.json({ success: true, sessionId: result.sessionId })
  } catch (error) {
    console.error('Delete chat message error:', error)
    return c.json({ error: '删除失败' }, 500)
  }
})

export default router
