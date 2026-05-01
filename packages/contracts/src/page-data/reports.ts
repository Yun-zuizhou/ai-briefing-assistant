export interface ReportEntryItem {
  reportId?: number
  reportType: 'weekly' | 'monthly' | 'annual'
  reportTitle: string
  generatedAt?: string
  periodStart?: string | null
  periodEnd?: string | null
  available: boolean
}

export interface EvidenceRefPreview {
  refType?: string
  refId?: number | null
  resultRef?: string | null
  sourceUrl?: string | null
  title?: string | null
  snippet?: string | null
  reason?: string | null
}

export interface PeriodicReportLlmBlocks {
  version: string
  provider: string
  model: string
  trendExplanation: string
  periodSummary: string
  nextActions: string[]
  dataNote: string
  evidenceRefs: EvidenceRefPreview[]
}

export interface AnnualReportLlmBlocks {
  version: string
  provider: string
  model: string
  thinkingSummary: string
  actionSummary: string
  yearEndInsight: string
  nextYearActions: string[]
  dataNote: string
  evidenceRefs: EvidenceRefPreview[]
}

export interface PeriodicReportData {
  reportType: 'weekly' | 'monthly'
  generationSource?: 'rules' | 'llm'
  llmBlocks?: PeriodicReportLlmBlocks
  dataQuality?: {
    confidence: 'low' | 'medium' | 'high'
    insufficientData: boolean
    evidence: string[]
  }
  overview: {
    period: string
    viewed: number
    recorded: number
    collected: number
    completed: number
    streak: number
  }
  topicTrends: Array<{
    id: string
    icon: string
    title: string
    heatData: {
      current: number
      previous: number
      change: number
      trend: 'up' | 'down' | 'stable'
    }
    hotSpot: {
      title: string
      contentRef?: string
      discussionCount: number
      userParticipation: number
      summary: string
    }
    insights: string[]
    userAttentionChange?: {
      change: number
      newTopics: string[]
    }
  }>
  growth: {
    stats: {
      viewed: number
      recorded: number
      collected: number
      completed: number
    }
    comparison:
      | {
          current: number[]
          previous: number[]
          change: number[]
        }
      | null
    trajectory: {
      title: string
      description: string
      keywords: string[]
    }
    selectedThoughts: Array<{
      id: number
      date: string
      content: string
    }>
    suggestions: string[]
  }
}

export interface AnnualReportData {
  year: number
  generationSource?: 'rules' | 'llm'
  annualLlmBlocks?: AnnualReportLlmBlocks
  dataQuality?: {
    confidence: 'low' | 'medium' | 'high'
    insufficientData: boolean
    evidence: string[]
  }
  stats: {
    topicsViewed: number
    opinionsPosted: number
    plansCompleted: number
    daysActive: number
  }
  keywords: string[]
  interests: string[]
  thinkingSection: string
  actionSection: string
  closing: string
}
