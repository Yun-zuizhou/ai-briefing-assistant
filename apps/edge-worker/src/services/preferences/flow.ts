// Public Preferences service flow for profile and growth routes.
// Keep route code thin: profile reads, AI profile generation, evidence loading,
// and growth overview assembly belong here.
import { resolveStoredAiApiKey } from '../ai-key-crypto'
import { resolveUserAiProviderConfig } from '../ai-provider'
import {
  buildGrowthKeywords,
  buildPersonaSummary,
  buildRadarMetrics,
  buildRecentHistoryItems,
  getActivityStreak,
  getLatestBriefing,
  getLatestNote,
  getLatestOpportunityFollow,
  getProfileCounts,
  getUserSettings,
} from '../behavior'
import { getUserInterests } from '../content'
import { checkLlmSoftQuota } from '../llm-invocations'
import {
  generateUserProfile,
  getLatestUserProfile,
} from '../profile-generation'
import {
  listReportSourceFavorites,
  listReportSourceHistory,
  listReportSourceNotes,
  listReportSourceTodos,
} from '../reports'
import type { GrowthOverviewData } from '../../types/page-data'

export type PreferencesRuntimeEnv = {
  AI_KEY_ENCRYPTION_SECRET?: string
}

export type ProfileGenerationResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: 400 | 429; payload: Record<string, unknown> }

function parseProfileData(raw: string | null | undefined): {
  growthKeywords?: string[]
  keyInsights?: string[]
} {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as {
      growthKeywords?: unknown
      keyInsights?: unknown
    }
    return {
      growthKeywords: Array.isArray(parsed.growthKeywords)
        ? parsed.growthKeywords.map((item) => String(item)).filter(Boolean)
        : undefined,
      keyInsights: Array.isArray(parsed.keyInsights)
        ? parsed.keyInsights.map((item) => String(item)).filter(Boolean)
        : undefined,
    }
  } catch {
    return {}
  }
}

function parseEvidenceRefs(raw: string | null | undefined): unknown[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function loadUserProfile(db: D1Database, userId: number): Promise<Record<string, unknown>> {
  const [interests, counts, latestProfile] = await Promise.all([
    getUserInterests(db, userId),
    getProfileCounts(db, userId),
    getLatestUserProfile(db, userId),
  ])

  const personaSummary = buildPersonaSummary(interests, counts)
  const keywords = buildGrowthKeywords(interests)
  const profileData = parseProfileData(latestProfile?.profile_data)
  const resolvedKeywords = profileData.growthKeywords?.length ? profileData.growthKeywords : keywords

  return {
    active_interests: interests,
    notes_count: counts.notes_count,
    favorites_count: counts.favorites_count,
    completed_todos: counts.completed_todos,
    total_todos: counts.total_todos,
    history_count: counts.history_count,
    radar_metrics: buildRadarMetrics(interests, counts),
    persona_summary: latestProfile?.summary || personaSummary,
    growth_keywords: resolvedKeywords,
    key_insights: profileData.keyInsights || [],
    persona_version: latestProfile?.version || 'rules-v1',
    persona_generated_at: latestProfile?.generated_at || null,
    persona_provider: latestProfile?.provider_name || null,
    persona_model: latestProfile?.model_name || null,
    evidence_refs: parseEvidenceRefs(latestProfile?.evidence_refs_json),
    ai_generated: Boolean(latestProfile?.summary),
  }
}

export async function generateUserProfileForUser(params: {
  db: D1Database
  userId: number
  env: PreferencesRuntimeEnv
}): Promise<ProfileGenerationResult> {
  const quota = await checkLlmSoftQuota({
    db: params.db,
    userId: params.userId,
    feature: 'profile_generation',
    windowHours: 24,
    maxCalls: 6,
  })
  if (!quota.allowed) {
    return {
      ok: false,
      status: 429,
      payload: {
        error: '今日 AI 画像生成次数已达上限，请稍后再试。',
        quota,
      },
    }
  }

  const [settings, interests, counts, notes, favorites, todos, historyItems] = await Promise.all([
    getUserSettings(params.db, params.userId),
    getUserInterests(params.db, params.userId),
    getProfileCounts(params.db, params.userId),
    listReportSourceNotes(params.db, params.userId, 12),
    listReportSourceFavorites(params.db, params.userId, 12),
    listReportSourceTodos(params.db, params.userId),
    listReportSourceHistory(params.db, params.userId, 20),
  ])
  const apiKey = await resolveStoredAiApiKey(settings, params.env.AI_KEY_ENCRYPTION_SECRET)
  const providerConfig = resolveUserAiProviderConfig({
    provider: settings?.ai_provider,
    apiKey,
  })

  if (!providerConfig) {
    return {
      ok: false,
      status: 400,
      payload: { error: 'AI provider is not configured' },
    }
  }

  const fallbackSummary = buildPersonaSummary(interests, counts)
  const fallbackKeywords = buildGrowthKeywords(interests)
  const profile = await generateUserProfile({
    db: params.db,
    userId: params.userId,
    interests,
    counts,
    notes,
    favorites,
    todos,
    historyItems,
    fallbackSummary,
    fallbackKeywords,
    config: providerConfig,
    invocation: {
      db: params.db,
      userId: params.userId,
      feature: 'profile_generation',
      requestRef: `user_profile:${params.userId}`,
      metadata: {
        evidenceCandidates: notes.length + favorites.length + todos.length + historyItems.length,
      },
    },
  })

  return {
    ok: true,
    payload: {
      persona_summary: profile.personaSummary,
      growth_keywords: profile.growthKeywords,
      key_insights: profile.keyInsights,
      persona_version: profile.version,
      persona_provider: profile.providerName,
      persona_model: profile.modelName,
      evidence_refs: profile.evidenceRefs,
      ai_generated: true,
    },
  }
}

export async function loadGrowthOverview(db: D1Database, userId: number): Promise<GrowthOverviewData> {
  const [interests, counts, streakDays, briefing, note, follow, latestProfile] = await Promise.all([
    getUserInterests(db, userId),
    getProfileCounts(db, userId),
    getActivityStreak(db, userId),
    getLatestBriefing(db, userId),
    getLatestNote(db, userId),
    getLatestOpportunityFollow(db, userId),
    getLatestUserProfile(db, userId),
  ])

  const keywords = buildGrowthKeywords(interests)
  const personaSummary = buildPersonaSummary(interests, counts)
  const profileData = parseProfileData(latestProfile?.profile_data)
  const resolvedKeywords = profileData.growthKeywords?.length ? profileData.growthKeywords : keywords
  const resolvedPersonaSummary = latestProfile?.summary || personaSummary
  const recentHistoryItems = buildRecentHistoryItems({ briefing, note, follow })
  const available = counts.history_count > 0 || counts.notes_count > 0 || counts.favorites_count > 0

  return {
    userName: '探索者',
    streakDays,
    totalThoughts: counts.notes_count,
    weeklySummary: {
      weekLabel: '本周',
      growthSummary: `本周你完成了${counts.completed_todos}项待办，记录了${counts.notes_count}条想法，收藏了${counts.favorites_count}条内容。继续保持记录和行动的习惯！`,
    },
    keywords: resolvedKeywords.map((keyword) => ({
      keyword,
      weight: undefined,
      trend: undefined,
    })),
    persona: {
      personaSummary: resolvedPersonaSummary,
      personaVersion: latestProfile?.version || 'v1',
      updatedAt: latestProfile?.generated_at || undefined,
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
}
