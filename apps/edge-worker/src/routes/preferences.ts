import { Hono } from 'hono'
import { getUserInterests, replaceUserInterests } from '../services/content'
import {
  buildResolvedUserAiProviderSettings,
  buildResolvedUserSettings,
  getMorningBriefingScheduleState,
  getUserSettings,
  updateUserAiProviderSettings,
  updateUserSettings,
} from '../services/behavior'
import {
  generateUserProfileForUser,
  loadGrowthOverview,
  loadUserProfile,
  type PreferencesRuntimeEnv,
} from '../services/preferences'
import { resolveUserId } from '../utils/request-user'

type Bindings = PreferencesRuntimeEnv & {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

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
      encryptionSecret: c.env.AI_KEY_ENCRYPTION_SECRET,
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
    return c.json(await loadUserProfile(db, userId))
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({ error: 'Failed to load profile' }, 500)
  }
})

router.post('/profile/generate', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const result = await generateUserProfileForUser({
      db,
      userId,
      env: c.env,
    })

    if (!result.ok) {
      return c.json(result.payload, result.status)
    }
    return c.json(result.payload)
  } catch (error) {
    console.error('Generate profile error:', error)
    return c.json({ error: 'Failed to generate profile' }, 500)
  }
})

router.get('/growth-overview', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    return c.json(await loadGrowthOverview(db, userId))
  } catch (error) {
    console.error('Growth overview error:', error)
    return c.json({ error: 'Failed to load growth overview' }, 500)
  }
})

export default router
