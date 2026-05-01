import { Hono } from 'hono'
import { load__Feature__PageData } from '../services/__domain__'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('__RouteBase__', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const response = await load__Feature__PageData({
      db,
      userId,
    })

    return c.json(response)
  } catch (error) {
    console.error('__Feature__ route error:', error)
    return c.json({ error: 'Failed to load __feature__ data' }, 500)
  }
})

export default router
