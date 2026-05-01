import {
  listHotTopics,
  listOpportunities,
  getUserInterests,
} from '../content'
import { resolveStoredAiApiKey } from '../ai-key-crypto'
import {
  resolveEnvSummaryProviderConfig,
  resolveUserAiProviderConfig,
  type ResolvedAiProviderConfig,
} from '../ai-provider'
import { getUserSettings } from '../behavior'
import { generateTodayBriefingBlock } from '../briefing/llm-briefing'
import { checkLlmSoftQuota } from '../llm-invocations'
import type {
  RecommendationItem,
  TodayAiBriefingBlock,
  WorthActingItem,
  WorthKnowingItem,
} from '../../types/page-data'
import {
  buildBriefingPayload,
  buildFallbackExtensionSlots,
  buildFallbackLeadItem,
  normalizeAiBriefing,
  normalizeExtensionSlots,
  normalizeLeadItem,
  parseBriefingPayload,
} from './today-briefing-payload'
import {
  buildRecommendations,
  buildWorthActing,
  buildWorthKnowing,
} from './today-content'
import {
  getLatestReadyBriefingPayload,
  getTodayDateOnly,
  getTodayReadyBriefingPayload,
  listActiveMorningBriefingSchedules,
  recordBriefingCronDispatch,
  upsertTodayBriefing,
} from './today-briefing-store'

export type TodayBriefingEnv = {
  DB: D1Database
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_TRANSPORT?: string
  AI_KEY_ENCRYPTION_SECRET?: string
}

export type TodayBriefingGenerationResult = {
  userId: number
  generated: boolean
  skippedReason?: 'already_generated' | 'no_provider' | 'quota_or_generation_failed'
  aiBriefing?: TodayAiBriefingBlock
}

export type TodayBriefingCronResult = {
  trigger: string
  checked: number
  generated: number
  skipped: number
  failed: number
  results: TodayBriefingGenerationResult[]
}

async function tryGenerateTodayBriefing(params: {
  db: D1Database
  userId: number
  providerConfig: ResolvedAiProviderConfig
  interests: string[]
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  recommendedForYou: RecommendationItem[]
}): Promise<TodayAiBriefingBlock | null> {
  try {
    const quota = await checkLlmSoftQuota({
      db: params.db,
      userId: params.userId,
      feature: 'today_briefing_generation',
      windowHours: 24,
      maxCalls: 8,
    })
    if (!quota.allowed) {
      console.warn('Today briefing generation skipped by soft quota:', quota)
      return null
    }

    return await generateTodayBriefingBlock({
      db: params.db,
      userId: params.userId,
      interests: params.interests,
      worthKnowing: params.worthKnowing,
      worthActing: params.worthActing,
      recommendedForYou: params.recommendedForYou,
      config: params.providerConfig,
      invocation: {
        db: params.db,
        userId: params.userId,
        feature: 'today_briefing_generation',
        requestRef: `today_briefing:${params.userId}:${getTodayDateOnly()}`,
        metadata: {
          sourceCandidates: params.worthKnowing.length + params.worthActing.length,
          interests: params.interests.length,
        },
      },
    })
  } catch (error) {
    console.warn('Generate today briefing skipped:', error)
    return null
  }
}

async function resolveTodayBriefingProviderConfig(params: {
  db: D1Database
  userId: number
  env: TodayBriefingEnv
}): Promise<ResolvedAiProviderConfig | null> {
  const settings = await getUserSettings(params.db, params.userId)
  const apiKey = await resolveStoredAiApiKey(settings, params.env.AI_KEY_ENCRYPTION_SECRET)
  return resolveUserAiProviderConfig({
    provider: settings?.ai_provider,
    apiKey,
  }) || resolveEnvSummaryProviderConfig(params.env)
}

export async function generateAndPersistTodayBriefingForUser(params: {
  db: D1Database
  userId: number
  env: TodayBriefingEnv
  force?: boolean
}): Promise<TodayBriefingGenerationResult> {
  const todayBriefing = await getTodayReadyBriefingPayload(params.db, params.userId)
  const todayPayload = parseBriefingPayload(todayBriefing?.payload ?? null)
  if (!params.force && normalizeAiBriefing(todayPayload?.aiBriefing)) {
    return {
      userId: params.userId,
      generated: false,
      skippedReason: 'already_generated',
    }
  }

  const [hotTopics, opportunities, interests, latestBriefing] = await Promise.all([
    listHotTopics(params.db, 8),
    listOpportunities(params.db, 6),
    getUserInterests(params.db, params.userId),
    getLatestReadyBriefingPayload(params.db, params.userId),
  ])
  const recommendedForYou = buildRecommendations(interests, hotTopics, opportunities)
  const worthKnowing = buildWorthKnowing(hotTopics, interests)
  const worthActing = buildWorthActing(opportunities, interests)
  const briefingPayload = parseBriefingPayload(latestBriefing?.payload ?? null)
  const payloadLeadItem = normalizeLeadItem(briefingPayload?.leadItem)
  const leadItem = payloadLeadItem?.itemType === 'opportunity' ? null : payloadLeadItem || buildFallbackLeadItem(worthKnowing)
  const extensionSlots = normalizeExtensionSlots(briefingPayload?.extensionSlots)
  const fallbackExtensionSlots = extensionSlots.length > 0 ? extensionSlots : buildFallbackExtensionSlots(leadItem)

  const providerConfig = await resolveTodayBriefingProviderConfig({
    db: params.db,
    userId: params.userId,
    env: params.env,
  })

  if (!providerConfig) {
    return {
      userId: params.userId,
      generated: false,
      skippedReason: 'no_provider',
    }
  }

  const aiBriefing = await tryGenerateTodayBriefing({
    db: params.db,
    userId: params.userId,
    providerConfig,
    interests,
    worthKnowing,
    worthActing,
    recommendedForYou,
  })
  if (!aiBriefing) {
    return {
      userId: params.userId,
      generated: false,
      skippedReason: 'quota_or_generation_failed',
    }
  }

  const issueNumber = latestBriefing?.issue_number || 128
  const generatedPayload = buildBriefingPayload({
    existingPayload: briefingPayload,
    aiBriefing,
    leadItem,
    extensionSlots: fallbackExtensionSlots,
  })
  await upsertTodayBriefing({
    db: params.db,
    userId: params.userId,
    issueNumber,
    payload: generatedPayload,
    summaryText: aiBriefing.leadSummary,
    generatedAt: aiBriefing.generatedAt || new Date().toISOString(),
  })

  return {
    userId: params.userId,
    generated: true,
    aiBriefing,
  }
}

export async function runTodayBriefingCron(
  env: TodayBriefingEnv,
  input: {
    trigger?: string
    limit?: number
  } = {}
): Promise<TodayBriefingCronResult> {
  const limit = Math.min(50, Math.max(1, Math.round(Number(input.limit || 20))))
  const schedules = await listActiveMorningBriefingSchedules(env.DB, limit)
  const results: TodayBriefingGenerationResult[] = []
  let failed = 0

  for (const schedule of schedules) {
    try {
      const result = await generateAndPersistTodayBriefingForUser({
        db: env.DB,
        userId: schedule.user_id,
        env,
        force: false,
      })
      results.push(result)
      await recordBriefingCronDispatch({
        db: env.DB,
        scheduleId: schedule.id,
        userId: schedule.user_id,
        scheduledFor: schedule.schedule_time,
        status: result.generated ? 'success' : 'skipped',
        summary: result.generated
          ? 'Worker Cron 已生成今日 AI 简报'
          : `Worker Cron 跳过今日 AI 简报：${result.skippedReason || 'unknown'}`,
      })
    } catch (error) {
      failed += 1
      console.warn('Today briefing cron user failed:', error)
      await recordBriefingCronDispatch({
        db: env.DB,
        scheduleId: schedule.id,
        userId: schedule.user_id,
        scheduledFor: schedule.schedule_time,
        status: 'error',
        summary: error instanceof Error ? error.message.slice(0, 160) : 'Worker Cron 生成今日 AI 简报失败',
      })
    }
  }

  const generated = results.filter((item) => item.generated).length
  return {
    trigger: input.trigger || 'worker_cron',
    checked: schedules.length,
    generated,
    skipped: results.length - generated,
    failed,
    results,
  }
}
