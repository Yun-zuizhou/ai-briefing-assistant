export type SummaryTaskStatus =
  | 'pending_provider'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'

export interface SummaryTaskData {
  id: number
  taskType: 'summary_generation'
  contentType?: string | null
  contentId?: number | null
  sourceUrl?: string | null
  title?: string | null
  summaryKind: string
  status: SummaryTaskStatus
  providerName?: string | null
  modelName?: string | null
  resultRef?: string | null
  errorMessage?: string | null
  requestedAt: string
  startedAt?: string | null
  finishedAt?: string | null
  updatedAt?: string | null
}
