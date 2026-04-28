export interface ArticleRow {
  id: number
  title: string
  summary: string | null
  content: string | null
  source_name: string | null
  source_url: string | null
  author: string | null
  category: string | null
  tags: string | null
  publish_time: string | null
  quality_score: number | null
}

export interface RelatedItemRow {
  content_type: 'hot_topic' | 'article' | 'opportunity'
  id: number
  title: string
  summary: string | null
  source_name: string | null
  source_url: string | null
  relation_reason: string | null
}

export interface DailyDigestRow {
  id: number
  task_id: number
  user_id: number
  result_ref: string
  profile_id: string | null
  provider_name: string | null
  model_name: string | null
  prompt_version: string | null
  summary_title: string | null
  summary_text: string | null
  source_url: string | null
  source_payload_json: string | null
  key_points_json: string | null
  risk_flags_json: string | null
  consult_context_json: string | null
  citations_json: string | null
  created_at: string
  updated_at: string | null
}
