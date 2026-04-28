import { Hono } from 'hono'
import { getUserInterests, replaceUserInterests } from '../services/content'
import {
  buildResolvedUserAiProviderSettings,
  buildGrowthKeywords,
  buildPersonaSummary,
  buildRadarMetrics,
  buildRecentHistoryItems,
  buildResolvedUserSettings,
  getActivityStreak,
  getLatestBriefing,
  getLatestNote,
  getLatestOpportunityFollow,
  getMorningBriefingScheduleState,
  getProfileCounts,
  getUserSettings,
  updateUserAiProviderSettings,
  updateUserSettings,
} from '../services/behavior'
import { resolveUserId } from '../utils/request-user'
import type { GrowthOverviewData } from '../types/page-data'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

interface UserInterest {
  id: number
  user_id: number
  interest_name: string
  status: string
  created_at: string
}

router.get('/interests', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const interests = await getUserInterests(db, userId)
    return c.json({ interests })
  } catch (error) {
    console.error('Get interests error:', error)
    return c.json({ interests: [] })
  }
})

router.put('/interests', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{ interests: string[] }>()
    const interests = await replaceUserInterests(db, userId, body.interests || [])

    return c.json({ interests })
  } catch (error) {
    console.error('Update interests error:', error)
    return c.json({ error: 'Failed to update interests' }, 500)
  }
})

router.get('/settings', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const [settings, schedule] = await Promise.all([
      getUserSettings(db, userId),
      getMorningBriefingScheduleState(db, userId),
    ])

    return c.json(buildResolvedUserSettings(settings, schedule))
  } catch (error) {
    console.error('Get settings error:', error)
    return c.json({
      morning_brief_time: '08:00',
      evening_brief_time: '21:00',
      do_not_disturb_enabled: false,
      do_not_disturb_start: null,
      do_not_disturb_end: null,
      sound_enabled: true,
      vibration_enabled: true,
    })
  }
})

router.put('/settings', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      morning_brief_time?: string
      evening_brief_time?: string
      do_not_disturb_enabled?: boolean
      do_not_disturb_start?: string
      do_not_disturb_end?: string
      sound_enabled?: boolean
      vibration_enabled?: boolean
    }>()
    const settings = await updateUserSettings({
      db,
      userId,
      payload: body,
      triggerSource: 'preferences_settings_put',
    })

    return c.json(settings)
  } catch (error) {
    console.error('Update settings error:', error)
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

router.get('/ai-provider', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const settings = await getUserSettings(db, userId)
    return c.json(buildResolvedUserAiProviderSettings(settings))
  } catch (error) {
    console.error('Get ai provider settings error:', error)
    return c.json({
      provider: null,
      provider_label: null,
      api_key_masked: null,
      has_api_key: false,
      is_configured: false,
      api_url: null,
      model: null,
      updated_at: null,
    })
  }
})

router.put('/ai-provider', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      provider?: string | null
      api_key?: string | null
    }>()

    const settings = await updateUserAiProviderSettings({
      db,
      userId,
      payload: body,
    })

    return c.json(settings)
  } catch (error) {
    console.error('Update ai provider settings error:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update AI provider settings' }, 400)
  }
})

router.get('/profile', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const [interests, counts] = await Promise.all([
      getUserInterests(db, userId),
      getProfileCounts(db, userId),
    ])

    const radarMetrics = {
      ...buildRadarMetrics(interests, counts),
    }

    const personaSummary = buildPersonaSummary(interests, counts)
    const keywords = buildGrowthKeywords(interests)

    return c.json({
      active_interests: interests,
      notes_count: counts.notes_count,
      favorites_count: counts.favorites_count,
      completed_todos: counts.completed_todos,
      total_todos: counts.total_todos,
      history_count: counts.history_count,
      radar_metrics: radarMetrics,
      persona_summary: personaSummary,
      growth_keywords: keywords,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ error: 'Failed to load profile' }, 500)
  }
})

router.get('/growth-overview', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const [interests, counts, streakDays, briefing, note, follow] = await Promise.all([
      getUserInterests(db, userId),
      getProfileCounts(db, userId),
      getActivityStreak(db, userId),
      getLatestBriefing(db, userId),
      getLatestNote(db, userId),
      getLatestOpportunityFollow(db, userId),
    ])

    const keywords = buildGrowthKeywords(interests)
    const personaSummary = buildPersonaSummary(interests, counts)
    const recentHistoryItems = buildRecentHistoryItems({ briefing, note, follow })

    const available = counts.history_count > 0 || counts.notes_count > 0 || counts.favorites_count > 0

    const response: GrowthOverviewData = {
      userName: '探索者',
      streakDays,
      totalThoughts: counts.notes_count,
      weeklySummary: {
        weekLabel: '本周',
        growthSummary: `本周你完成了${counts.completed_todos}项待办，记录了${counts.notes_count}条想法，收藏了${counts.favorites_count}条内容。继续保持记录和行动的习惯！`,
      },
      keywords: keywords.map((keyword) => ({
        keyword,
        weight: undefined,
        trend: undefined,
      })),
      persona: {
        personaSummary,
        personaVersion: 'v1',
      },
      recentHistoryItems,
      reports: [
        {
          reportType: 'weekly',
          reportTitle: '周报',
          available,
        },
        {
          reportType: 'monthly',
          reportTitle: '月报',
          available,
        },
        {
          reportType: 'annual',
          reportTitle: '年度报告',
          available,
        },
      ],
    }

    return c.json(response)
  } catch (error) {
    console.error('Growth overview error:', error)
    return c.json({ error: 'Failed to load growth overview' }, 500)
  }
})

export default router
