export interface ChatAffectedEntity {
  type: string
  id?: string | number
}

export interface ChatActionResponse {
  success: boolean
  actionType: string
  candidateIntents: string[]
  requiresConfirmation: boolean
  affectedEntity: ChatAffectedEntity | null
  confirmedType?: string
  successMessage: string
  resultSummary?: string
  nextPageLabel?: string
  deepLink?: string
  sourceContext?: string
  changeLog?: Array<{
    entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown'
    entityId?: number | string
    change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed'
    summary: string
  }>
}
