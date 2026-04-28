import { Hono } from 'hono'
import {
  appendHistory,
  buildActionsOverview,
  getActionReminderSettings,
  getActivityStreak,
  getCheckedInToday,
  listActiveBriefingSchedules,
  listFollowingItemsForActionOverview,
  listSavedItemsForActionOverview,
  listTodos,
} from '../services/behavior'
import { resolveUserId } from '../utils/request-user'
import type { ActionsOverviewData, ActionCheckInData } from '../types/page-data'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/overview', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  
  try {
    const [todos, checkedInToday, streakDays, settings, savedForLaterRows, followingRows, schedules] = await Promise.all([
      listTodos(db, userId),
      getCheckedInToday(db, userId),
      getActivityStreak(db, userId),
      getActionReminderSettings(db, userId),
      listSavedItemsForActionOverview(db, userId),
      listFollowingItemsForActionOverview(db, userId),
      listActiveBriefingSchedules(db, userId),
    ])

    return c.json(buildActionsOverview({
      todos,
      checkedInToday,
      streakDays,
      settings,
      savedItems: savedForLaterRows,
      followingItems: followingRows,
      schedules,
    }))
  } catch (error) {
    console.error('Actions overview error:', error)
    return c.json({ error: 'Failed to load actions data' }, 500)
  }
})

router.post('/check-in', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  
  try {
    const alreadyCheckedIn = await getCheckedInToday(db, userId)
    
    if (alreadyCheckedIn) {
      const streakDays = await getActivityStreak(db, userId)
      const response: ActionCheckInData = {
        success: true,
        checkedInToday: true,
        streakDays,
        message: '今天已经打过卡了',
      }
      return c.json(response)
    }
    
    await appendHistory(db, userId, 'daily_check_in', '今日打卡', '已完成今日打卡')
    
    const streakDays = await getActivityStreak(db, userId)
    const response: ActionCheckInData = {
      success: true,
      checkedInToday: true,
      streakDays,
      message: '今日打卡成功',
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Check-in error:', error)
    return c.json({ error: 'Failed to check in' }, 500)
  }
})

export default router
