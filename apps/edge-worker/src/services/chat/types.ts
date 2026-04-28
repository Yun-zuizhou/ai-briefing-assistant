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
}
