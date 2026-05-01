import {
  extractText,
  type ResolvedAiProviderConfig,
} from './ai-provider'
import { loggedChatCompletion, type LlmInvocationContext } from './llm-invocations'
import { buildEvidenceRef, type EvidenceRef } from './reference-registry'
import type { ProfileCounts } from './behavior/types'
import type {
  ReportFavoriteRow,
  ReportHistoryRow,
  ReportNoteRow,
  ReportTodoRow,
} from './reports'
import { execute, queryOne } from '../utils/db'

const PROFILE_GENERATION_TIMEOUT_MS = 25000

export interface UserProfileResultRow {
  id: number
  user_id: number
  summary: string | null
  profile_data: string | null
  version: string | null
  generated_at: string | null
  status?: string | null
  provider_name?: string | null
  model_name?: string | null
  evidence_refs_json?: string | null
  error_message?: string | null
  created_at: string
  updated_at?: string | null
}

export interface GeneratedUserProfile {
  personaSummary: string
  growthKeywords: string[]
  keyInsights: string[]
  evidenceRefs: EvidenceRef[]
  version: string
  providerName: string
  modelName: string
}

function truncateText(value: string | null | undefined, limit: number): string {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`
}

function normalizeStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => truncateText(String(item || ''), 32)).filter(Boolean))].slice(0, limit)
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const normalized = String(text || '').trim()
  if (!normalized) return null
  const fencedMatch = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fencedMatch?.[1] || normalized
  const start = jsonText.indexOf('{')
  const end = jsonText.lastIndexOf('}')
  const payloadText = start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText

  try {
    const parsed = JSON.parse(payloadText)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function tryBuildEvidenceRef(input: Parameters<typeof buildEvidenceRef>[0]): EvidenceRef | null {
  try {
    return buildEvidenceRef(input)
  } catch {
    return null
  }
}

export function buildProfileEvidenceRefs(params: {
  notes?: ReportNoteRow[] | null
  favorites?: ReportFavoriteRow[] | null
  todos?: ReportTodoRow[] | null
  historyItems?: ReportHistoryRow[] | null
}): EvidenceRef[] {
  const refs: EvidenceRef[] = []

  for (const note of (params.notes || []).slice(0, 5)) {
    const ref = tryBuildEvidenceRef({
      refType: 'note',
      refId: note.id,
      title: note.content.slice(0, 40),
      snippet: note.content.slice(0, 120),
      reason: '用户主动记录，可支撑画像判断',
    })
    if (ref) refs.push(ref)
  }

  for (const favorite of (params.favorites || []).slice(0, 5)) {
    const ref = tryBuildEvidenceRef({
      refType: 'favorite',
      refId: favorite.id,
      title: favorite.item_title || '收藏内容',
      snippet: `${favorite.item_type}:${favorite.item_id}`,
      reason: '收藏内容可支撑兴趣偏好判断',
    })
    if (ref) refs.push(ref)
  }

  for (const todo of (params.todos || []).filter((item) => item.status === 'completed').slice(0, 4)) {
    const ref = tryBuildEvidenceRef({
      refType: 'todo',
      refId: todo.id,
      title: todo.content.slice(0, 40),
      snippet: todo.content.slice(0, 120),
      reason: '已完成待办可支撑行动偏好判断',
    })
    if (ref) refs.push(ref)
  }

  for (const history of (params.historyItems || []).slice(0, 5)) {
    const ref = tryBuildEvidenceRef({
      refType: history.ref_type || 'history_entry',
      refId: history.ref_id || history.id,
      title: history.title,
      snippet: history.event_type,
      reason: '历史行为可支撑活跃路径判断',
    })
    if (ref) refs.push(ref)
  }

  const seen = new Set<string>()
  return refs.filter((ref) => {
    const key = `${ref.refType}:${ref.refId ?? ''}:${ref.resultRef ?? ''}:${ref.sourceUrl ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 12)
}

export function buildProfileGenerationPrompt(params: {
  interests: string[]
  counts: ProfileCounts
  evidenceRefs: EvidenceRef[]
}): Array<{ role: string; content: string }> {
  const systemPrompt = [
    '你是AI简报助手的个人画像生成模块。只返回严格JSON，不要加markdown代码块。',
    '你只能基于用户关注领域、统计数据和候选证据生成画像，不要编造不存在的经历、职业、身份或外部事实。',
    '画像应服务于本产品：简报推荐、信息整理、行动建议、个人沉淀。',
    'evidenceIndexes 只能引用候选证据数组里的下标，最多6个。',
    '输出JSON字段：personaSummary, growthKeywords, keyInsights, evidenceIndexes。',
    'personaSummary最多160个中文字符。growthKeywords最多6个。keyInsights最多4条。',
  ].join('\n')

  const userPayload = {
    interests: params.interests.slice(0, 12),
    counts: params.counts,
    evidenceCandidates: params.evidenceRefs.map((ref, index) => ({
      index,
      refType: ref.refType,
      refId: ref.refId,
      resultRef: ref.resultRef,
      sourceUrl: ref.sourceUrl,
      title: truncateText(ref.title, 60),
      snippet: truncateText(ref.snippet, 120),
      reason: truncateText(ref.reason, 80),
    })),
  }

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        '请基于以下真实数据生成个人画像。',
        JSON.stringify(userPayload, null, 2),
        '返回示例：{"personaSummary":"你正在从AI资讯浏览转向记录和行动沉淀。","growthKeywords":["AI","记录","行动"],"keyInsights":["收藏主题集中在AI。"],"evidenceIndexes":[0,1]}',
      ].join('\n'),
    },
  ]
}

export function parseGeneratedProfileJSON(
  text: string,
  fallback: {
    personaSummary: string
    growthKeywords: string[]
    evidenceRefs: EvidenceRef[]
  }
): Omit<GeneratedUserProfile, 'version' | 'providerName' | 'modelName'> {
  const payload = extractJsonObject(text)
  if (!payload) {
    return {
      personaSummary: fallback.personaSummary,
      growthKeywords: fallback.growthKeywords,
      keyInsights: [],
      evidenceRefs: fallback.evidenceRefs.slice(0, 6),
    }
  }

  const personaSummary = truncateText(String(payload.personaSummary || ''), 160) || fallback.personaSummary
  const growthKeywords = normalizeStringArray(payload.growthKeywords, 6)
  const keyInsights = normalizeStringArray(payload.keyInsights, 4)

  const selectedIndexes = Array.isArray(payload.evidenceIndexes)
    ? payload.evidenceIndexes
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item < fallback.evidenceRefs.length)
    : []
  const evidenceRefs = selectedIndexes.length
    ? [...new Set(selectedIndexes)].map((index) => fallback.evidenceRefs[index]).filter(Boolean)
    : fallback.evidenceRefs.slice(0, 6)

  return {
    personaSummary,
    growthKeywords: growthKeywords.length ? growthKeywords : fallback.growthKeywords,
    keyInsights,
    evidenceRefs,
  }
}

export async function getLatestUserProfile(
  db: D1Database,
  userId: number
): Promise<UserProfileResultRow | null> {
  try {
    return await queryOne<UserProfileResultRow>(
      db,
      `SELECT * FROM user_profiles WHERE user_id = ? ORDER BY generated_at DESC, id DESC LIMIT 1`,
      [userId]
    )
  } catch (error) {
    console.warn('Read latest user profile skipped:', error)
    return null
  }
}

export async function upsertUserProfileResult(
  db: D1Database,
  params: {
    userId: number
    summary: string
    profileData: Record<string, unknown>
    version: string
    evidenceRefs: EvidenceRef[]
    providerName: string
    modelName: string
  }
): Promise<void> {
  await execute(
    db,
    `
      INSERT INTO user_profiles (
        user_id, summary, profile_data, version, generated_at, status,
        provider_name, model_name, evidence_refs_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, datetime('now'), 'ready', ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        summary = excluded.summary,
        profile_data = excluded.profile_data,
        version = excluded.version,
        generated_at = excluded.generated_at,
        status = 'ready',
        provider_name = excluded.provider_name,
        model_name = excluded.model_name,
        evidence_refs_json = excluded.evidence_refs_json,
        error_message = NULL,
        updated_at = datetime('now')
    `,
    [
      params.userId,
      params.summary,
      JSON.stringify(params.profileData),
      params.version,
      params.providerName,
      params.modelName,
      JSON.stringify(params.evidenceRefs),
    ]
  )
}

export async function generateUserProfile(params: {
  db: D1Database
  userId: number
  interests: string[]
  counts: ProfileCounts
  notes: ReportNoteRow[]
  favorites: ReportFavoriteRow[]
  todos: ReportTodoRow[]
  historyItems: ReportHistoryRow[]
  fallbackSummary: string
  fallbackKeywords: string[]
  config: ResolvedAiProviderConfig
  invocation?: LlmInvocationContext | null
}): Promise<GeneratedUserProfile> {
  const evidenceRefs = buildProfileEvidenceRefs(params)
  const fallback = {
    personaSummary: params.fallbackSummary,
    growthKeywords: params.fallbackKeywords,
    evidenceRefs,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROFILE_GENERATION_TIMEOUT_MS)

  try {
    const payload = await loggedChatCompletion({
      config: params.config,
      messages: buildProfileGenerationPrompt({
        interests: params.interests,
        counts: params.counts,
        evidenceRefs,
      }),
      options: {
        temperature: 0.3,
        maxTokens: 1200,
        signal: controller.signal,
      },
      invocation: params.invocation,
    })
    const parsed = parseGeneratedProfileJSON(extractText(params.config, payload), fallback)
    const result: GeneratedUserProfile = {
      ...parsed,
      version: 'llm-profile-v1',
      providerName: params.config.provider,
      modelName: params.config.model,
    }

    await upsertUserProfileResult(params.db, {
      userId: params.userId,
      summary: result.personaSummary,
      profileData: {
        personaSummary: result.personaSummary,
        growthKeywords: result.growthKeywords,
        keyInsights: result.keyInsights,
      },
      version: result.version,
      evidenceRefs: result.evidenceRefs,
      providerName: result.providerName,
      modelName: result.modelName,
    })

    return result
  } finally {
    clearTimeout(timeout)
  }
}
