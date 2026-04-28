import type { ChainHealthCounts, FeedbackSubmissionRow, SummaryResultRow, SummaryTaskRow } from './types'

export function isSummaryProviderEnabled(value: string | undefined): boolean {
  const normalized = String(value || '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

export function buildSummaryTaskResultRef(input: {
  contentType?: string | null
  contentId?: number | null
  summaryKind: string
  sourceUrl?: string | null
}): string {
  if (input.contentType) {
    return `summary:${input.contentType}:${input.contentId ?? 'adhoc'}:${input.summaryKind}`
  }
  if (input.sourceUrl) {
    return `summary:url:${input.summaryKind}:${encodeURIComponent(input.sourceUrl).slice(0, 48)}`
  }
  return `summary:adhoc:${input.summaryKind}`
}

export function mapSummaryTask(row: SummaryTaskRow) {
  return {
    id: row.id,
    task_type: 'summary_generation',
    content_type: row.content_type,
    content_id: row.content_id,
    source_url: row.source_url,
    title: row.title,
    summary_kind: row.summary_kind,
    status: row.status,
    provider_name: row.provider_name,
    model_name: row.model_name,
    result_ref: row.result_ref,
    error_message: row.error_message,
    requested_at: row.requested_at,
    started_at: row.started_at,
    finished_at: row.finished_at,
    updated_at: row.updated_at,
  }
}

function parseJsonField(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function mapSummaryResult(row: SummaryResultRow) {
  return {
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    content_type: row.content_type,
    content_id: row.content_id,
    source_url: row.source_url,
    result_ref: row.result_ref,
    profile_id: row.profile_id,
    provider_name: row.provider_name,
    model_name: row.model_name,
    prompt_version: row.prompt_version,
    source_payload: parseJsonField(row.source_payload_json),
    summary_title: row.summary_title,
    summary_text: row.summary_text,
    key_points: parseJsonField(row.key_points_json) || [],
    risk_flags: parseJsonField(row.risk_flags_json) || [],
    consult_context: parseJsonField(row.consult_context_json),
    citations: parseJsonField(row.citations_json) || [],
    raw_response: parseJsonField(row.raw_response_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function buildChainHealthResponse(userId: number, counts: ChainHealthCounts) {
  return {
    userId,
    supportChains: {
      schedulerFactLayerReady: counts.schedules > 0,
      opportunityResultFactLayerReady: counts.opportunityResults > 0,
      ingestionRunFactLayerReady: counts.ingestionRuns >= 0,
      aiProcessingFactLayerReady: counts.aiProcessingRuns >= 0,
      summaryTaskStateModelReady: counts.summaryTasks >= 0,
      replayQueueReady: counts.replayPending >= 0,
    },
    counters: counts,
  }
}

export function mapFeedbackSubmission(row: FeedbackSubmissionRow) {
  return {
    id: row.id,
    feedbackType: row.feedback_type,
    content: row.content,
    sourcePage: row.source_page,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
