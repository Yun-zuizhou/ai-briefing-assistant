import { Hono } from 'hono'
import { getUserInterests } from '../services/content'
import { resolveUserId } from '../utils/request-user'
import {
  buildAnnualReportPayload,
  buildPeriodBounds,
  buildPeriodicReportPayload,
  buildReportTitle,
  countDistinctActiveDays,
  countReportSourceRows,
  getCachedReportByPeriod,
  getReportById,
  listReportEntries,
  listReportSourceFavorites,
  listReportSourceHistory,
  listReportSourceNotes,
  listReportSourceTodos,
  type ReportFavoriteRow,
  type ReportNoteRow,
  type ReportTodoRow,
  upsertReportResult,
} from '../services/reports'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

type Note = ReportNoteRow
type Favorite = ReportFavoriteRow
type Todo = ReportTodoRow

async function buildPeriodicReport(
  db: D1Database,
  reportType: string,
  userId: number
): Promise<Record<string, unknown>> {
  const interests = await getUserInterests(db, userId)

  const [notes, favorites, todos, historyItems] = await Promise.all([
    listReportSourceNotes(db, userId, 12),
    listReportSourceFavorites(db, userId, 12),
    listReportSourceTodos(db, userId),
    listReportSourceHistory(db, userId, 20),
  ])

  return buildPeriodicReportPayload({
    reportType,
    interests,
    notes,
    favorites,
    todos,
    historyItems,
  })
}

async function buildAnnualReport(db: D1Database, userId: number): Promise<Record<string, unknown>> {
  const [counts, interests, daysActive] = await Promise.all([
    countReportSourceRows(db, userId),
    getUserInterests(db, userId),
    countDistinctActiveDays(db, userId),
  ])

  return buildAnnualReportPayload({
    notesCount: counts.notesCount,
    favoritesCount: counts.favoritesCount,
    completedTodoCount: counts.completedTodoCount,
    historyCount: counts.historyCount,
    interests,
    daysActive,
  })
}

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const reports = await listReportEntries(db, userId, 50)

    return c.json({
      reports: reports.map((r) => ({
        reportId: r.id,
        reportType: r.report_type,
        reportTitle: r.title,
        generatedAt: r.generated_at,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        available: true,
      })),
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return c.json({ reports: [] })
  }
})

router.get('/weekly', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const reportId = c.req.query('report_id')

  try {
    if (reportId) {
      const report = await getReportById(db, parseInt(reportId), userId, 'weekly')

      if (!report) {
        const foreignReport = await getReportById(db, parseInt(reportId), undefined, 'weekly')
        if (foreignReport) {
          return c.json({ error: '无权访问该报告' }, 403)
        }
        return c.json({ error: '报告不存在' }, 404)
      }

      if (report.report_payload_json) {
        return c.json(JSON.parse(report.report_payload_json))
      }
    }

    const periodStart = buildPeriodBounds('weekly')[0] || `${new Date().getFullYear()}-01-01`
    const cachedReport = await getCachedReportByPeriod(db, userId, 'weekly', periodStart)

    if (cachedReport && cachedReport.report_payload_json) {
      return c.json(JSON.parse(cachedReport.report_payload_json))
    }

    const report = await buildPeriodicReport(db, 'weekly', userId)
    await upsertReportResult(db, {
      userId,
      reportType: 'weekly',
      periodStart,
      periodEnd: buildPeriodBounds('weekly')[1] || periodStart,
      title: buildReportTitle('weekly', '本周'),
      summaryText: String((report.overview as Record<string, unknown> | undefined)?.period || ''),
      payload: report,
    })
    return c.json(report)
  } catch (error) {
    console.error('Get weekly report error:', error)
    return c.json({ error: 'Failed to load weekly report' }, 500)
  }
})

router.get('/monthly', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const reportId = c.req.query('report_id')

  try {
    if (reportId) {
      const report = await getReportById(db, parseInt(reportId), userId, 'monthly')

      if (!report) {
        const foreignReport = await getReportById(db, parseInt(reportId), undefined, 'monthly')
        if (foreignReport) {
          return c.json({ error: '无权访问该报告' }, 403)
        }
        return c.json({ error: '报告不存在' }, 404)
      }

      if (report.report_payload_json) {
        return c.json(JSON.parse(report.report_payload_json))
      }
    }

    const periodStart = buildPeriodBounds('monthly')[0] || `${new Date().getFullYear()}-01-01`
    const cachedReport = await getCachedReportByPeriod(db, userId, 'monthly', periodStart)

    if (cachedReport && cachedReport.report_payload_json) {
      return c.json(JSON.parse(cachedReport.report_payload_json))
    }

    const report = await buildPeriodicReport(db, 'monthly', userId)
    await upsertReportResult(db, {
      userId,
      reportType: 'monthly',
      periodStart,
      periodEnd: buildPeriodBounds('monthly')[1] || periodStart,
      title: buildReportTitle('monthly', '本月'),
      summaryText: String((report.overview as Record<string, unknown> | undefined)?.period || ''),
      payload: report,
    })
    return c.json(report)
  } catch (error) {
    console.error('Get monthly report error:', error)
    return c.json({ error: 'Failed to load monthly report' }, 500)
  }
})

router.get('/annual', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const reportId = c.req.query('report_id')
  try {
    if (reportId) {
      const report = await getReportById(db, parseInt(reportId, 10), userId, 'annual')
      if (!report) {
        const foreignReport = await getReportById(db, parseInt(reportId, 10), undefined, 'annual')
        if (foreignReport) {
          return c.json({ error: '无权访问该报告' }, 403)
        }
        return c.json({ error: '报告不存在' }, 404)
      }
      if (report.report_payload_json) {
        return c.json(JSON.parse(report.report_payload_json))
      }
    }
    const periodStart = `${new Date().getFullYear()}-01-01`
    const cachedReport = await getCachedReportByPeriod(db, userId, 'annual', periodStart)
    if (cachedReport?.report_payload_json) {
      return c.json(JSON.parse(cachedReport.report_payload_json))
    }
    const report = await buildAnnualReport(db, userId)
    await upsertReportResult(db, {
      userId,
      reportType: 'annual',
      periodStart,
      periodEnd: `${new Date().getFullYear()}-12-31`,
      title: buildReportTitle('annual', `${new Date().getFullYear()}年度`),
      summaryText: String(report.thinkingSection || ''),
      payload: report,
    })
    return c.json(report)
  } catch (error) {
    console.error('Get annual report error:', error)
    return c.json({ error: 'Failed to load annual report' }, 500)
  }
})

export default router
