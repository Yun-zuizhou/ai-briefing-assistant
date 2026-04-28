import { Hono } from 'hono'
import {
  createHistoryAction,
  listHistoryRows,
  mapHistoryResponse,
  parseContentRef,
} from '../services/behavior'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const eventType = c.req.query('event_type')
  try {
    const rows = await listHistoryRows(db, userId, eventType)
    return c.json({
      total: rows.length,
      items: rows.map(mapHistoryResponse),
    })
  } catch (error) {
    console.error('Get history error:', error)
    return c.json({ error: 'Failed to load history' }, 500)
  }
})

router.post('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  try {
    const body = await c.req.json<{
      event_type: string
      title: string
      summary?: string | null
      ref_type?: string | null
      ref_id?: number | null
      content_ref?: string | null
    }>()

    let refType = body.ref_type || null
    let refId = body.ref_id ?? null
    if (body.content_ref) {
      const parsed = parseContentRef(body.content_ref)
      refType = parsed.refType
      refId = parsed.refId
    }
    const history = await createHistoryAction({
      db,
      userId,
      eventType: body.event_type,
      title: body.title,
      summary: body.summary || null,
      refType,
      refId,
    })
    if (!history) {
      return c.json({ error: 'Failed to create history' }, 500)
    }

    return c.json(mapHistoryResponse(history))
  } catch (error) {
    console.error('Create history error:', error)
    return c.json({ error: 'Failed to create history' }, 500)
  }
})

export default router
