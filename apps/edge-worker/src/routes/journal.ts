import { Hono } from 'hono'
import { getUserInterests } from '../services/content'
import {
  buildJournalOverview,
  buildGrowthKeywords,
  listFavoriteRows,
  listFollowingItemsForActionOverview,
  listHistoryRows,
  listNoteRows,
  listTodoRows,
} from '../services/behavior'
import { listReportEntries } from '../services/reports'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/overview', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const [notes, todos, favorites, historyItems, followingItems, interests, reports] = await Promise.all([
      listNoteRows(db, userId),
      listTodoRows(db, { userId }),
      listFavoriteRows(db, userId),
      listHistoryRows(db, userId),
      listFollowingItemsForActionOverview(db, userId),
      getUserInterests(db, userId),
      listReportEntries(db, userId, 50),
    ])

    return c.json(buildJournalOverview({
      notes,
      todos,
      favorites,
      historyItems,
      followingItems,
      keywords: buildGrowthKeywords(interests),
      reviewCount: reports.length,
    }))
  } catch (error) {
    console.error('Journal overview error:', error)
    return c.json({ error: 'Failed to load journal overview' }, 500)
  }
})

export default router
