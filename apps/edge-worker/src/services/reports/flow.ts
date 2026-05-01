// Public Reports service flow for routes.
// Keep route code thin: report cache lookup, source loading, LLM block generation,
// evidence merging, and persistence belong here.
import { resolveStoredAiApiKey } from '../ai-key-crypto'
import { resolveUserAiProviderConfig } from '../ai-provider'
import { getUserSettings } from '../behavior'
import { getUserInterests } from '../content'
import { checkLlmSoftQuota } from '../llm-invocations'
import type { EvidenceRef } from '../reference-registry'
import {
  buildAnnualReportPayload,
  buildPeriodBounds,
  buildPeriodicReportPayload,
  buildReportEvidenceRefs,
  buildReportTitle,
} from './builder'
import {
  generateAnnualReportBlocks,
  generateReportBlocks,
  type GeneratedAnnualReportBlocks,
  type GeneratedReportBlocks,
} from './llm-blocks'
import {
  getCachedReportByPeriod,
  getReportById,
  countDistinctActiveDays,
  countReportSourceRows,
  listReportEntries,
  listReportSourceFavorites,
  listReportSourceHistory,
  listReportSourceNotes,
  listReportSourceTodos,
  upsertReportResult,
} from './store'

export type PeriodicReportType = 'weekly' | 'monthly'
export type ReportType = PeriodicReportType | 'annual'

export type ReportRuntimeEnv = {
  AI_KEY_ENCRYPTION_SECRET?: string
}

export type ReportLoadResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: 403 | 404; error: string }

export function shouldRefreshReport(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
}

function parseStoredReportPayload(payloadJson: string | null): Record<string, unknown> | null {
  if (!payloadJson) return null
  return JSON.parse(payloadJson) as Record<string, unknown>
}

function extractReportEvidenceRefs(report: Record<string, unknown>): EvidenceRef[] {
  return (Array.isArray(report.evidenceRefs) ? report.evidenceRefs : []) as EvidenceRef[]
}

function mergeReportBlocks(
  report: Record<string, unknown>,
  blocks: GeneratedReportBlocks | null
): Record<string, unknown> {
  if (!blocks) return report

  return {
    ...report,
    generationSource: 'llm',
    llmBlocks: {
      version: blocks.version,
      provider: blocks.providerName,
      model: blocks.modelName,
      trendExplanation: blocks.trendExplanation,
      periodSummary: blocks.periodSummary,
      nextActions: blocks.nextActions,
      dataNote: blocks.dataNote,
      evidenceRefs: blocks.evidenceRefs,
    },
  }
}

function mergeAnnualReportBlocks(
  report: Record<string, unknown>,
  blocks: GeneratedAnnualReportBlocks | null
): Record<string, unknown> {
  if (!blocks) return report

  return {
    ...report,
    generationSource: 'llm',
    annualLlmBlocks: {
      version: blocks.version,
      provider: blocks.providerName,
      model: blocks.modelName,
      thinkingSummary: blocks.thinkingSummary,
      actionSummary: blocks.actionSummary,
      yearEndInsight: blocks.yearEndInsight,
      nextYearActions: blocks.nextYearActions,
      dataNote: blocks.dataNote,
      evidenceRefs: blocks.evidenceRefs,
    },
  }
}

async function tryGeneratePeriodicReportBlocks(params: {
  db: D1Database
  userId: number
  reportType: PeriodicReportType
  report: Record<string, unknown>
  encryptionSecret?: string
}): Promise<GeneratedReportBlocks | null> {
  try {
    const quota = await checkLlmSoftQuota({
      db: params.db,
      userId: params.userId,
      feature: 'report_blocks_generation',
      windowHours: 24,
      maxCalls: 10,
    })
    if (!quota.allowed) {
      console.warn('Generate report LLM blocks skipped by soft quota:', quota)
      return null
    }

    const settings = await getUserSettings(params.db, params.userId)
    const apiKey = await resolveStoredAiApiKey(settings, params.encryptionSecret)
    const providerConfig = resolveUserAiProviderConfig({
      provider: settings?.ai_provider,
      apiKey,
    })

    if (!providerConfig) {
      return null
    }

    const evidenceRefs = extractReportEvidenceRefs(params.report)
    return await generateReportBlocks({
      db: params.db,
      userId: params.userId,
      reportType: params.reportType,
      payload: params.report,
      evidenceRefs,
      config: providerConfig,
      invocation: {
        db: params.db,
        userId: params.userId,
        feature: 'report_blocks_generation',
        requestRef: `${params.reportType}_report:${params.userId}`,
        metadata: {
          reportType: params.reportType,
          evidenceCandidates: evidenceRefs.length,
        },
      },
    })
  } catch (error) {
    console.warn('Generate report LLM blocks skipped:', error)
    return null
  }
}

async function tryGenerateAnnualReportBlocks(params: {
  db: D1Database
  userId: number
  report: Record<string, unknown>
  evidenceRefs: EvidenceRef[]
  encryptionSecret?: string
}): Promise<GeneratedAnnualReportBlocks | null> {
  try {
    const quota = await checkLlmSoftQuota({
      db: params.db,
      userId: params.userId,
      feature: 'annual_report_blocks_generation',
      windowHours: 24,
      maxCalls: 4,
    })
    if (!quota.allowed) {
      console.warn('Generate annual report LLM blocks skipped by soft quota:', quota)
      return null
    }

    const settings = await getUserSettings(params.db, params.userId)
    const apiKey = await resolveStoredAiApiKey(settings, params.encryptionSecret)
    const providerConfig = resolveUserAiProviderConfig({
      provider: settings?.ai_provider,
      apiKey,
    })

    if (!providerConfig) {
      return null
    }

    return await generateAnnualReportBlocks({
      db: params.db,
      userId: params.userId,
      payload: params.report,
      evidenceRefs: params.evidenceRefs,
      config: providerConfig,
      invocation: {
        db: params.db,
        userId: params.userId,
        feature: 'annual_report_blocks_generation',
        requestRef: `annual_report:${params.userId}`,
        metadata: {
          reportType: 'annual',
          evidenceCandidates: params.evidenceRefs.length,
        },
      },
    })
  } catch (error) {
    console.warn('Generate annual report LLM blocks skipped:', error)
    return null
  }
}

async function buildPeriodicReport(
  db: D1Database,
  reportType: PeriodicReportType,
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

async function loadStoredReportById(params: {
  db: D1Database
  userId: number
  reportType: ReportType
  reportId?: string
}): Promise<ReportLoadResult | null> {
  if (!params.reportId) return null
  const parsedReportId = Number.parseInt(params.reportId, 10)
  const report = await getReportById(params.db, parsedReportId, params.userId, params.reportType)

  if (!report) {
    const foreignReport = await getReportById(params.db, parsedReportId, undefined, params.reportType)
    if (foreignReport) {
      return { ok: false, status: 403, error: '无权访问该报告' }
    }
    return { ok: false, status: 404, error: '报告不存在' }
  }

  const payload = parseStoredReportPayload(report.report_payload_json)
  return payload ? { ok: true, payload } : null
}

export async function listReportSummaries(db: D1Database, userId: number) {
  const reports = await listReportEntries(db, userId, 50)
  return reports.map((report) => ({
    reportId: report.id,
    reportType: report.report_type,
    reportTitle: report.title,
    generatedAt: report.generated_at,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    available: true,
  }))
}

export async function loadPeriodicReport(params: {
  db: D1Database
  userId: number
  reportType: PeriodicReportType
  reportId?: string
  refresh?: boolean
  env?: ReportRuntimeEnv
}): Promise<ReportLoadResult> {
  const storedReport = await loadStoredReportById(params)
  if (storedReport) return storedReport

  const [periodStartRaw, periodEndRaw] = buildPeriodBounds(params.reportType)
  const periodStart = periodStartRaw || `${new Date().getFullYear()}-01-01`
  const periodEnd = periodEndRaw || periodStart
  const cachedReport = await getCachedReportByPeriod(params.db, params.userId, params.reportType, periodStart)
  const cachedPayload = parseStoredReportPayload(cachedReport?.report_payload_json ?? null)

  if (!params.refresh && cachedPayload) {
    return { ok: true, payload: cachedPayload }
  }

  const baseReport = await buildPeriodicReport(params.db, params.reportType, params.userId)
  const llmBlocks = await tryGeneratePeriodicReportBlocks({
    db: params.db,
    userId: params.userId,
    reportType: params.reportType,
    report: baseReport,
    encryptionSecret: params.env?.AI_KEY_ENCRYPTION_SECRET,
  })
  const report = mergeReportBlocks(baseReport, llmBlocks)
  const periodLabel = params.reportType === 'weekly' ? '本周' : '本月'

  await upsertReportResult(params.db, {
    userId: params.userId,
    reportType: params.reportType,
    periodStart,
    periodEnd,
    title: buildReportTitle(params.reportType, periodLabel),
    summaryText: String((report.overview as Record<string, unknown> | undefined)?.period || ''),
    payload: report,
    evidenceRefs: llmBlocks?.evidenceRefs || extractReportEvidenceRefs(report),
    generationSource: llmBlocks ? 'llm' : 'rules',
    providerName: llmBlocks?.providerName || null,
    modelName: llmBlocks?.modelName || null,
  })

  return { ok: true, payload: report }
}

export async function loadAnnualReport(params: {
  db: D1Database
  userId: number
  reportId?: string
  refresh?: boolean
  env?: ReportRuntimeEnv
}): Promise<ReportLoadResult> {
  const storedReport = await loadStoredReportById({
    db: params.db,
    userId: params.userId,
    reportType: 'annual',
    reportId: params.reportId,
  })
  if (storedReport) return storedReport

  const year = new Date().getFullYear()
  const periodStart = `${year}-01-01`
  const cachedReport = await getCachedReportByPeriod(params.db, params.userId, 'annual', periodStart)
  const cachedPayload = parseStoredReportPayload(cachedReport?.report_payload_json ?? null)

  if (!params.refresh && cachedPayload) {
    return { ok: true, payload: cachedPayload }
  }

  const [baseReport, notes, favorites, todos, historyItems] = await Promise.all([
    buildAnnualReport(params.db, params.userId),
    listReportSourceNotes(params.db, params.userId, 12),
    listReportSourceFavorites(params.db, params.userId, 12),
    listReportSourceTodos(params.db, params.userId),
    listReportSourceHistory(params.db, params.userId, 20),
  ])
  const evidenceRefs = buildReportEvidenceRefs({
    notes,
    favorites,
    todos,
    historyItems,
  })
  const annualBlocks = await tryGenerateAnnualReportBlocks({
    db: params.db,
    userId: params.userId,
    report: baseReport,
    evidenceRefs,
    encryptionSecret: params.env?.AI_KEY_ENCRYPTION_SECRET,
  })
  const report = mergeAnnualReportBlocks(baseReport, annualBlocks)

  await upsertReportResult(params.db, {
    userId: params.userId,
    reportType: 'annual',
    periodStart,
    periodEnd: `${year}-12-31`,
    title: buildReportTitle('annual', `${year}年度`),
    summaryText: String(report.thinkingSection || ''),
    payload: report,
    evidenceRefs: annualBlocks?.evidenceRefs || evidenceRefs,
    generationSource: annualBlocks ? 'llm' : 'rules',
    providerName: annualBlocks?.providerName || null,
    modelName: annualBlocks?.modelName || null,
  })

  return { ok: true, payload: report }
}
