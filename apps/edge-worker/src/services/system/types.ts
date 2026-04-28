export type SummaryTaskStatus =
  | 'pending_provider'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'

export interface SummaryTaskRow {
  id: number
  content_type: string | null
  content_id: number | null
  source_url: string | null
  title: string | null
  summary_kind: string
  status: SummaryTaskStatus
  provider_name: string | null
  model_name: string | null
  result_ref: string | null
  error_message: string | null
  requested_at: string
  started_at: string | null
  finished_at: string | null
  updated_at: string | null
}

export interface SummaryTaskExecutionRow extends SummaryTaskRow {
  user_id: number
}

export interface SummaryResultRow {
  id: number
  task_id: number
  user_id: number
  content_type: string | null
  content_id: number | null
  source_url: string | null
  result_ref: string
  profile_id: string | null
  provider_name: string | null
  model_name: string | null
  prompt_version: string | null
  source_payload_json: string | null
  summary_title: string | null
  summary_text: string | null
  key_points_json: string | null
  risk_flags_json: string | null
  consult_context_json: string | null
  citations_json: string | null
  raw_response_json: string | null
  created_at: string
  updated_at: string | null
}

export interface ReplayTaskRow {
  id: number
  operation_log_id: number
  status: string
  reason: string | null
  created_at: string
  updated_at: string | null
}

export interface ChainHealthCounts {
  schedules: number
  opportunityResults: number
  ingestionRuns: number
  aiProcessingRuns: number
  summaryTasks: number
  replayPending: number
}

export interface FeedbackSubmissionRow {
  id: number
  user_id: number
  feedback_type: 'bug' | 'suggestion' | 'other'
  content: string
  source_page: string | null
  status: string
  created_at: string
  updated_at: string | null
}
