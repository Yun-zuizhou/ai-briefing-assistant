import { Hono } from 'hono'
import {
  createFeedbackSubmissionAction,
  listFeedbackSubmissions,
  mapFeedbackSubmission,
} from '../services/system'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const limit = Number.parseInt(c.req.query('limit') || '20', 10)

  try {
    const rows = await listFeedbackSubmissions(db, userId, Number.isNaN(limit) ? 20 : limit)

    return c.json({
      total: rows.length,
      items: rows.map(mapFeedbackSubmission),
    })
  } catch (error) {
    console.error('Get feedback submissions error:', error)
    return c.json({ total: 0, items: [] })
  }
})

router.post('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      feedback_type?: 'bug' | 'suggestion' | 'other'
      content?: string
      source_page?: string | null
    }>()
    const result = await createFeedbackSubmissionAction({ db, userId, payload: body })
    if ('error' in result) {
      return c.json({ error: result.error }, 400)
    }
    if (!result.submission) {
      return c.json({ error: '提交反馈失败' }, 500)
    }

    return c.json({
      success: true,
      submission: mapFeedbackSubmission(result.submission),
    })
  } catch (error) {
    console.error('Create feedback submission error:', error)
    return c.json({ error: '提交反馈失败' }, 500)
  }
})

export default router
