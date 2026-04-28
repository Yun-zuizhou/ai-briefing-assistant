export interface ProfileCounts {
  notes_count: number
  favorites_count: number
  completed_todos: number
  total_todos: number
  history_count: number
}

export interface UserSettingRow {
  id: number
  user_id: number
  morning_brief_time: string
  evening_brief_time: string
  do_not_disturb_enabled: number
  do_not_disturb_start: string | null
  do_not_disturb_end: string | null
  sound_enabled: number
  vibration_enabled: number
  ai_provider?: string | null
  ai_api_key?: string | null
  updated_at?: string | null
}

export interface BriefingScheduleState {
  status: string | null
  next_run_at: string | null
}

export interface LatestBriefingRecord {
  title: string
  briefing_date: string
}

export interface LatestNoteRecord {
  content: string
  created_at: string
}

export interface LatestOpportunityFollowRecord {
  next_step: string | null
  progress_text: string | null
  updated_at: string | null
  created_at: string | null
}

export interface ResolvedUserSettings {
  morning_brief_time: string
  evening_brief_time: string
  do_not_disturb_enabled: boolean
  do_not_disturb_start: string | null
  do_not_disturb_end: string | null
  sound_enabled: boolean
  vibration_enabled: boolean
}

export interface ResolvedUserAiProviderSettings {
  provider: string | null
  provider_label: string | null
  api_key_masked: string | null
  has_api_key: boolean
  is_configured: boolean
  api_url: string | null
  model: string | null
  updated_at: string | null
}

export interface TodoRow {
  id: number
  user_id: number
  content: string
  description: string | null
  status: string
  priority: string
  deadline: string | null
  related_type: string | null
  related_id: number | null
  related_title: string | null
  tags: string | null
  created_at: string
  updated_at: string
}

export interface ActionReminderSettingsRow {
  morning_brief_time: string | null
  do_not_disturb_enabled: number | null
}

export interface BriefingScheduleRow {
  id: number
  briefing_type: string
  schedule_time: string
  status: string | null
  next_run_at: string | null
}

export interface SavedItemRow {
  id: number
  item_title: string
  item_type: 'hot_topic' | 'article' | 'opportunity'
  item_source: string | null
  created_at: string | null
}

export interface FollowingItemRow {
  follow_id: number
  title: string
  follow_status: 'new' | 'watching' | 'applied' | 'waiting' | 'completed'
  deadline: string | null
  progress_text: string | null
  next_step: string | null
}

export interface FavoriteRow {
  id: number
  user_id: number
  item_type: string
  item_id: number
  item_title: string | null
  item_summary: string | null
  item_source: string | null
  item_url: string | null
  created_at: string
}

export interface NoteRow {
  id: number
  user_id: number
  content: string
  source_type: string
  source_id: number | null
  tags: string | null
  created_at: string
}

export interface HistoryRow {
  id: number
  user_id: number
  event_type: string
  title: string
  summary: string | null
  ref_type: string | null
  ref_id: number | null
  created_at: string
}
