import type { IntentType } from '../utils/intentParser';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  nickname?: string | null;
}

export interface AuthEnvelope {
  user: AuthUser;
}

export interface IntentResponse {
  type: IntentType;
  entities: Record<string, string | string[]>;
  confidence: number;
  matchedBy: 'exact' | 'synonym' | 'fuzzy' | 'pattern';
  candidateIntents?: IntentType[];
  requiresConfirmation?: boolean;
  suggestedPayload?: Record<string, string | string[]>;
  sourceContext?: string;
}

export interface FavoriteCreatePayload {
  item_type?: string;
  item_id?: number;
  content_ref?: string;
  item_title: string;
  item_summary?: string | null;
  item_source?: string | null;
  item_url?: string | null;
}

export interface NoteCreatePayload {
  content: string;
  source_type?: string;
  source_id?: number | null;
  tags?: string[];
}

export interface FeedbackCreatePayload {
  feedback_type: 'bug' | 'suggestion' | 'other';
  content: string;
  source_page?: string | null;
}

export interface FeedbackSubmission {
  id: number;
  feedbackType: 'bug' | 'suggestion' | 'other';
  content: string;
  sourcePage?: string | null;
  status: string;
  createdAt: string;
}

export interface UserSettingsPayload {
  morning_brief_time: string;
  evening_brief_time: string;
  do_not_disturb_enabled: boolean;
  do_not_disturb_start?: string | null;
  do_not_disturb_end?: string | null;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

export interface UserAiProviderPayload {
  provider: string | null;
  provider_label: string | null;
  api_key_masked: string | null;
  has_api_key: boolean;
  is_configured: boolean;
  api_url: string | null;
  model: string | null;
  updated_at: string | null;
}

export interface UserProfilePayload {
  active_interests: string[];
  notes_count: number;
  favorites_count: number;
  completed_todos: number;
  total_todos: number;
  history_count: number;
  radar_metrics: Record<string, number>;
  persona_summary: string;
  growth_keywords: string[];
  key_insights?: string[];
  persona_version?: string | null;
  persona_generated_at?: string | null;
  persona_provider?: string | null;
  persona_model?: string | null;
  evidence_refs?: unknown[];
  ai_generated?: boolean;
}

export interface UserProfileGeneratePayload {
  persona_summary: string;
  growth_keywords: string[];
  key_insights?: string[];
  persona_version?: string | null;
  persona_provider?: string | null;
  persona_model?: string | null;
  evidence_refs?: unknown[];
  ai_generated: boolean;
}

export interface LlmInvocationStatsPayload {
  userId: number;
  windowLabel?: string;
  windowHours?: number;
  windowDays: number;
  generatedAt: string;
  totals: {
    total: number;
    success: number;
    error: number;
    successRate: number;
    avgDurationMs: number | null;
    avgInputChars: number | null;
    avgOutputChars: number | null;
    avgPromptTokens: number | null;
    avgCompletionTokens: number | null;
    avgTotalTokens: number | null;
    totalTokens: number;
  };
  byFeature: Array<{
    feature: string;
    total: number;
    success: number;
    error: number;
    successRate: number;
    avgDurationMs: number | null;
    avgTotalTokens: number | null;
    totalTokens: number;
    lastInvokedAt: string | null;
  }>;
  byModel: Array<{
    providerName: string;
    modelName: string;
    transport: string;
    total: number;
    success: number;
    error: number;
    successRate: number;
    avgDurationMs: number | null;
    totalTokens: number;
    lastInvokedAt: string | null;
  }>;
  errors: Array<{
    errorCode: string;
    total: number;
    lastOccurredAt: string | null;
  }>;
  recentErrors?: Array<{
    invocationId: number;
    feature: string;
    requestRef: string | null;
    providerName: string;
    modelName: string;
    status: 'error';
    durationMs: number | null;
    totalTokens: number | null;
    errorCode: string;
    errorMessage: string | null;
    createdAt: string | null;
  }>;
}

export interface BriefingDispatchStatsPayload {
  userId: number;
  windowLabel: string;
  windowHours: number;
  generatedAt: string;
  totals: {
    total: number;
    success: number;
    skipped: number;
    error: number;
  };
  byStatus: Array<{
    status: string;
    total: number;
    lastOccurredAt: string | null;
  }>;
  byTrigger: Array<{
    triggerSource: string;
    total: number;
    success: number;
    skipped: number;
    error: number;
    lastOccurredAt: string | null;
  }>;
  recentDispatches: Array<{
    id: number;
    scheduleId: number | null;
    briefingType: string;
    triggerSource: string;
    scheduledFor: string | null;
    status: string;
    summary: string | null;
    createdAt: string | null;
  }>;
}

export interface DailyDigestItem {
  id: number;
  taskId: number;
  resultRef: string;
  profileId?: string | null;
  providerName?: string | null;
  modelName?: string | null;
  promptVersion?: string | null;
  summaryTitle?: string | null;
  summaryText?: string | null;
  keyPoints: string[];
  riskFlags: string[];
  citations: Array<{ title?: string; url?: string }>;
  sourceUrl?: string | null;
  sourceName?: string | null;
  title?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DailyDigestResponse {
  profileId: string;
  mode?: string;
  total: number;
  items: DailyDigestItem[];
}

export interface DigestConsultResponse {
  resultRef: string;
  question: string;
  answer: string;
  evidence: string[];
  uncertainties: string[];
  suggestedNextActions: string[];
  providerName: string;
  modelName: string;
}

export type SummaryTaskStatus = 'pending_provider' | 'queued' | 'running' | 'succeeded' | 'failed';

export interface SummaryTaskCreatePayload {
  content_type?: string | null;
  content_id?: number | null;
  source_url?: string | null;
  title?: string | null;
  summary_kind?: string | null;
  provider_name?: string | null;
  model_name?: string | null;
  result_ref?: string | null;
}

export interface SummaryTaskApiItem {
  id: number;
  task_type: 'summary_generation';
  content_type?: string | null;
  content_id?: number | null;
  source_url?: string | null;
  title?: string | null;
  summary_kind: string;
  status: SummaryTaskStatus;
  provider_name?: string | null;
  model_name?: string | null;
  result_ref?: string | null;
  error_message?: string | null;
  requested_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  updated_at?: string | null;
}

export interface SummaryTaskCreateResponse {
  success: boolean;
  task: SummaryTaskApiItem;
}

export interface SummaryTaskListResponse {
  total: number;
  items: SummaryTaskApiItem[];
}

export interface SummaryTaskResultApiItem {
  id: number;
  task_id: number;
  user_id: number;
  content_type?: string | null;
  content_id?: number | null;
  source_url?: string | null;
  result_ref: string;
  profile_id?: string | null;
  provider_name?: string | null;
  model_name?: string | null;
  prompt_version?: string | null;
  source_payload?: unknown;
  summary_title?: string | null;
  summary_text?: string | null;
  key_points: unknown[];
  risk_flags: unknown[];
  consult_context?: unknown;
  citations: unknown[];
  raw_response?: unknown;
  created_at: string;
  updated_at?: string | null;
}
