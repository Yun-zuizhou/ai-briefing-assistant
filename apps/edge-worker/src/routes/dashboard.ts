import { Hono } from 'hono'
import { loadTodayPageData } from '../services/dashboard'
import { resolveUserId } from '../utils/request-user'

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

export {
  runTodayBriefingCron,
} from '../services/dashboard'
export type {
  TodayBriefingCronResult,
  TodayBriefingGenerationResult,
} from '../services/dashboard'

function shouldRefreshBriefing(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
}

router.get('/today', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const response = await loadTodayPageData({
      db,
      userId,
      env: c.env,
      refreshBriefing: shouldRefreshBriefing(c.req.query('refresh')),
    })

    return c.json(response)
  } catch (error) {
    console.error('Dashboard today error:', error)
    return c.json({ error: 'Failed to load dashboard data' }, 500)
  }
})

export default router
