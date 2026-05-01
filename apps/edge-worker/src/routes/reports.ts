import { Hono, type Context } from 'hono'
import {
  listReportSummaries,
  loadAnnualReport,
  loadPeriodicReport,
  shouldRefreshReport,
  type PeriodicReportType,
  type ReportRuntimeEnv,
} from '../services/reports'
import { resolveUserId } from '../utils/request-user'

type Bindings = ReportRuntimeEnv & {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()
type ReportsContext = Context<{ Bindings: Bindings }>

async function handlePeriodicReport(
  c: ReportsContext,
  reportType: PeriodicReportType
) {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const result = await loadPeriodicReport({
      db,
      userId,
      reportType,
      reportId: c.req.query('report_id'),
      refresh: shouldRefreshReport(c.req.query('refresh')),
      env: c.env,
    })

    if (!result.ok) {
      return c.json({ error: result.error }, result.status)
    }
    return c.json(result.payload)
  } catch (error) {
    console.error(`Get ${reportType} report error:`, error)
    return c.json({ error: `Failed to load ${reportType} report` }, 500)
  }
}

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const reports = await listReportSummaries(db, userId)
    return c.json({ reports })
  } catch (error) {
    console.error('Get reports error:', error)
    return c.json({ reports: [] })
  }
})

router.get('/weekly', async (c) => handlePeriodicReport(c, 'weekly'))

router.get('/monthly', async (c) => handlePeriodicReport(c, 'monthly'))

router.get('/annual', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const result = await loadAnnualReport({
      db,
      userId,
      reportId: c.req.query('report_id'),
      refresh: shouldRefreshReport(c.req.query('refresh')),
      env: c.env,
    })

    if (!result.ok) {
      return c.json({ error: result.error }, result.status)
    }
    return c.json(result.payload)
  } catch (error) {
    console.error('Get annual report error:', error)
    return c.json({ error: 'Failed to load annual report' }, 500)
  }
})

export default router
