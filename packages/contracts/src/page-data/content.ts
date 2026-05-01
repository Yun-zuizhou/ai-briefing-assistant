export interface HotTopicListItem {
  id: number
  title: string
  summary: string | null
  source: string
  source_url: string
  categories: string[]
  tags: string[]
  hot_value: number
  quality_score: number
  published_at: string | null
}

export interface OpportunityListItem {
  id: number
  title: string
  type: string
  status: string
  source: string
  source_url: string
  summary: string | null
  reward: string | null
  location: string | null
  is_remote: number
  deadline: string | null
  tags: string[]
  quality_score: number
}

export interface UnifiedContentDetailData {
  contentRef: string
  contentType: 'hot_topic' | 'article' | 'opportunity'
  contentRole: 'original' | 'source_digest' | 'opportunity_detail' | 'body'
  id: string | number
  title: string
  summary?: string | null
  content?: string | null
  sourceName?: string
  sourceUrl?: string
  author?: string
  categoryLabels: string[]
  tags: string[]
  publishedAt?: string
  qualityScore?: number
  detailState: 'formal' | 'partial'
  detailStateReason?: string | null
  missingFields?: string[]
  relatedItems: Array<{
    contentRef: string
    contentType: 'hot_topic' | 'article' | 'opportunity'
    id: string | number
    title: string
    summary?: string | null
    sourceName?: string
    sourceUrl?: string
    relationReason?: string | null
  }>
}
