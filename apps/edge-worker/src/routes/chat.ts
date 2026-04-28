import { Hono } from 'hono'
import { execute } from '../utils/db'
import { resolveUserId } from '../utils/request-user'
import {
  buildPendingConfirmationResponse,
  executeConfirmedChatAction,
  reclassifyChatAction,
  buildCandidateIntents,
  parseIntent,
  requiresConfirmation,
  appendChatMessage,
  getChatSession,
  getChatSessionMessages,
  getOrCreateActiveSession,
  listChatSessions,
} from '../services/chat'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
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

router.post('/recognize', async (c) => {
  const body = await c.req.json<{
    input: string
    current_interests?: string[]
    source_context?: string
  }>()

  const currentInterests = body.current_interests || []
  const result = parseIntent(body.input, currentInterests)
  const candidateIntents = buildCandidateIntents(body.input, currentInterests, result.type)
  const shouldConfirm = requiresConfirmation(result.type, candidateIntents, result.confidence)

  return c.json({
    recognizedIntent: result.type,
    recognized_intent: result.type,
    type: result.type,
    candidate_intents: candidateIntents,
    candidateIntents: candidateIntents,
    extractedEntities: result.entities,
    extracted_entities: result.entities,
    entities: result.entities,
    suggested_payload: result.entities,
    suggestedPayload: result.entities,
    source_context: body.source_context,
    sourceContext: body.source_context,
    confidence: result.confidence,
    requires_confirmation: shouldConfirm,
    requiresConfirmation: shouldConfirm,
    matchedBy: result.matchedBy,
    matched_by: result.matchedBy,
  })
})

router.post('/execute', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  const body = await c.req.json<{
    input: string
    current_interests?: string[]
    draft_type?: string
    preferred_intent?: string
    source_context?: string
    source_content_ref?: string
    source_title?: string
    auto_commit?: boolean
    confirmed_type?: string
    correction_from?: string
  }>()

  const currentInterests = body.current_interests || []
  const result = parseIntent(body.input, currentInterests)
  const candidateIntents = buildCandidateIntents(body.input, currentInterests, result.type)
  const intentType = body.confirmed_type || body.preferred_intent || result.type
  const entities = result.entities
  const shouldConfirm = !body.confirmed_type && !body.preferred_intent
    && requiresConfirmation(result.type, candidateIntents, result.confidence)

  try {
    const session = await getOrCreateActiveSession(db, userId, body.source_context || null)

    await appendChatMessage(db, session.id, 'user', body.input, 'recognized', {
      sourceContext: body.source_context,
    })

    if (shouldConfirm) {
      const response = buildPendingConfirmationResponse({
        actionType: intentType,
        candidateIntents,
        confirmedType: body.confirmed_type || undefined,
        sourceContext: body.source_context,
      })

      await appendChatMessage(
        db,
        session.id,
        'assistant',
        `${response.successMessage}\n\n${response.resultSummary}`,
        'pending_confirmation',
        {
          intentType: result.type,
          candidateIntents,
          confidence: result.confidence,
          sourceContext: body.source_context || undefined,
          matchedBy: result.matchedBy || undefined,
          confirmedType: body.confirmed_type || undefined,
          actionType: intentType,
          resultSummary: response.resultSummary,
        }
      )

      return c.json(response)
    }

    const response = await executeConfirmedChatAction({
      db,
      userId,
      input: body.input,
      intentType,
      entities,
      candidateIntents,
      sourceContext: body.source_context,
      sourceContentRef: body.source_content_ref,
      sourceTitle: body.source_title,
      confirmedType: body.confirmed_type || intentType,
    })

    await appendChatMessage(db, session.id, 'assistant', `${response.successMessage}\n\n${response.resultSummary || ''}`, 'executed', {
      intentType: response.actionType,
      candidateIntents: response.candidateIntents,
      confidence: result.confidence,
      sourceContext: response.sourceContext || undefined,
      matchedBy: result.matchedBy || undefined,
      confirmedType: response.confirmedType,
      actionType: response.actionType,
      resultSummary: response.resultSummary,
      deepLink: response.deepLink,
      nextPageLabel: response.nextPageLabel,
      affectedEntityType: response.affectedEntity?.type,
      affectedEntityId: response.affectedEntity?.id !== undefined ? String(response.affectedEntity.id) : undefined,
    })

    return c.json(response)
  } catch (error) {
    console.error('Chat execute error:', error)
    return c.json({
      success: false,
      actionType: intentType,
      candidateIntents: candidateIntents,
      confirmedType: intentType,
      successMessage: '执行失败，未写入数据库',
      resultSummary: '请稍后重试，当前请求没有进入真实数据链路。',
    }, 500)
  }
})

router.post('/reclassify', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  const body = await c.req.json<{
    target_intent: string
    correction_from: string
    original_input?: string
    source_context?: string
  }>()

  try {
    const session = await getOrCreateActiveSession(db, userId, body.source_context || null)

    const currentInterests: string[] = []
    const result = parseIntent(body.original_input || '', currentInterests)
    const intentType = body.target_intent
    const entities = result.entities

    const response = await reclassifyChatAction({
      db,
      userId,
      targetIntent: intentType,
      correctionFrom: body.correction_from,
      originalInput: body.original_input,
      sourceContext: body.source_context,
      entities,
    })

    await appendChatMessage(db, session.id, 'assistant', `${response.successMessage}\n\n${response.resultSummary || ''}`, 'executed', {
      intentType: response.actionType,
      candidateIntents: response.candidateIntents,
      confidence: 0.9,
      sourceContext: response.sourceContext || undefined,
      matchedBy: 'reclassify',
      confirmedType: response.confirmedType,
      actionType: response.actionType,
      resultSummary: response.resultSummary,
      deepLink: response.deepLink,
      nextPageLabel: response.nextPageLabel,
      affectedEntityType: response.affectedEntity?.type,
      affectedEntityId: response.affectedEntity?.id !== undefined ? String(response.affectedEntity.id) : undefined,
    })

    return c.json(response)
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

export default router
