export interface TodaySummaryData {
  summaryTitle: string
  summaryText: string
  moodTag?: string
}

export interface RecommendedContentItem {
  contentRef: string
  id: string | number
  contentType: 'hot_topic' | 'article' | 'opportunity' | 'note'
  title: string
  summary?: string
  sourceName?: string
  sourceUrl?: string
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface RecommendationItem {
  interestName: string
  recommendationReason: string
  relatedContentCount?: number
  processingNote?: string
  topItems: RecommendedContentItem[]
}

export interface WorthKnowingItem {
  contentRef: string
  id: string | number
  contentType: 'hot_topic' | 'article'
  title: string
  summary: string
  sourceName: string
  sourceUrl?: string
  categoryLabels?: string[]
  relevanceReason: string
  publishedAt?: string
  hotScore?: number
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface WorthActingItem {
  contentRef: string
  id: string | number
  actionType: 'apply' | 'follow' | 'submit' | 'read_later' | 'create_todo'
  title: string
  summary: string
  deadline?: string
  reward?: string
  difficulty?: 'low' | 'medium' | 'high'
  whyRelevant: string
  nextActionLabel: string
  qualityScore?: number
  matchScore?: number
  rankingScore?: number
  processingStage?: 'raw' | 'aggregated' | 'ranked' | 'partial'
}

export interface TodayQuickNoteEntry {
  placeholderText: string
  suggestedPrompt?: string
  draftText?: string
}

export interface TodayLeadItem {
  contentRef?: string
  itemType: 'hot_topic' | 'article' | 'opportunity' | 'briefing'
  title: string
  summary: string
  sourceLabel?: string
  relevanceLabel?: string
  primaryActionLabel: string
  secondaryActionLabel?: string
}

export interface TodayExtensionSlot {
  slotType: 'ask' | 'todo' | 'save' | 'review'
  title: string
  description: string
  actionLabel: string
  deepLink?: string
  sourceContentRef?: string
}

export interface TodayAiBriefingSourceRef {
  contentRef: string
  title: string
  sourceLabel?: string
  reason?: string
}

export interface TodayAiBriefingCluster {
  title: string
  summary: string
  confidenceNote?: string
  recommendationReason?: string
  sourceRefs: TodayAiBriefingSourceRef[]
}

export interface TodayAiBriefingBlock {
  version: string
  provider?: string
  model?: string
  status: 'success' | 'fallback'
  leadSummary: string
  topicClusters: TodayAiBriefingCluster[]
  recommendationReasons: string[]
  uncertainties: string[]
  generatedAt?: string
}

export interface TodayPageData {
  dateLabel: string
  issueNumber: number
  pageTitle: string
  pageSubtitle: string
  summary: TodaySummaryData
  leadItem?: TodayLeadItem | null
  dailyAngle?: string
  aiBriefing?: TodayAiBriefingBlock
  freshness?: {
    latestPublishedAt?: string
    sourceCount: number
    generatedAt?: string
  }
  extensionSlots?: TodayExtensionSlot[]
  recommendedForYou: RecommendationItem[]
  worthKnowing: WorthKnowingItem[]
  worthActing: WorthActingItem[]
  quickNoteEntry: TodayQuickNoteEntry
}
