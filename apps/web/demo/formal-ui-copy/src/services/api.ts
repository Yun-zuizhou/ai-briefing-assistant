import type {
  ApiListResponse,
  HotTopicListItem,
  OpportunityListItem,
  TodoApiItem,
  FavoriteApiItem,
  NoteApiItem,
  HistoryApiItem,
  ChatExecuteResult,
  ChatSessionMessagesData,
  ChatSessionSummary,
  GrowthOverviewData,
  ActionsOverviewData,
  ActionCheckInData,
  TodayPageData,
  UnifiedContentDetailData,
  PeriodicReportData,
  AnnualReportData,
  ReportEntryItem,
} from '../types/page-data';
import type { IntentType } from '../utils/intentParser';

const DEFAULT_API_ORIGIN = import.meta.env.DEV
  ? ''
  : 'https://ai-briefing-assistant.aibriefing2026.workers.dev';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;
const API_CONFIG_BASE_URL = `${API_ORIGIN}/api-config`;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface ContentListResponse<T> {
  total: number;
  data: T[];
}

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: options.credentials ?? 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${endpoint}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 热点资讯API
  async getHotTopics() {
    const response = await this.request<ContentListResponse<HotTopicListItem>>('/content/hot-topics');
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<ApiListResponse<HotTopicListItem>>;
    }
    return {
      data: {
        total: response.data.total,
        items: response.data.data.map((item) => ({
          ...item,
          categories: parseArrayField((item as unknown as Record<string, unknown>).categories),
          tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
        })),
      },
    } satisfies ApiResponse<ApiListResponse<HotTopicListItem>>;
  }

  async getHotTopic(id: number) {
    const response = await this.getContentDetailByRef(`hot_topic:${id}`);
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<HotTopicListItem>;
    }
    return {
      data: {
        id: Number(response.data.id),
        title: response.data.title,
        summary: response.data.summary ?? null,
        source: response.data.sourceName || '',
        source_url: response.data.sourceUrl || '',
        categories: response.data.categoryLabels,
        tags: response.data.tags,
        hot_value: 0,
        quality_score: response.data.qualityScore ?? 0,
        published_at: response.data.publishedAt ?? null,
      },
    } satisfies ApiResponse<HotTopicListItem>;
  }

  // 机会信息API
  async getOpportunities() {
    const response = await this.request<ContentListResponse<OpportunityListItem>>('/content/opportunities');
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<ApiListResponse<OpportunityListItem>>;
    }
    return {
      data: {
        total: response.data.total,
        items: response.data.data.map((item) => ({
          ...item,
          tags: parseArrayField((item as unknown as Record<string, unknown>).tags),
        })),
      },
    } satisfies ApiResponse<ApiListResponse<OpportunityListItem>>;
  }

  async getOpportunity(id: number) {
    const response = await this.getContentDetailByRef(`opportunity:${id}`);
    if (response.error || !response.data) {
      return { error: response.error } as ApiResponse<OpportunityListItem>;
    }
    return {
      data: {
        id: Number(response.data.id),
        title: response.data.title,
        type: 'opportunity',
        status: 'active',
        source: response.data.sourceName || '',
        source_url: response.data.sourceUrl || '',
        summary: response.data.summary ?? null,
        reward: null,
        location: null,
        is_remote: 0,
        deadline: null,
        tags: response.data.tags,
        quality_score: response.data.qualityScore ?? 0,
      },
    } satisfies ApiResponse<OpportunityListItem>;
  }

  // 待办与收藏 API
  async getTodos(params?: { status?: string; priority?: string }) {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.priority) search.set('priority', params.priority);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<TodoApiItem>>(`/todos${suffix}`);
  }

  async updateTodo(id: number, data: Partial<TodoApiItem>) {
    return this.request<TodoApiItem>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTodo(id: number) {
    return this.request<{ success: boolean; message: string }>(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async getFavorites(params?: { itemType?: string }) {
    const search = new URLSearchParams();
    if (params?.itemType) search.set('item_type', params.itemType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<FavoriteApiItem>>(`/favorites${suffix}`);
  }

  async createFavorite(data: FavoriteCreatePayload) {
    return this.request<FavoriteApiItem>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFavorite(id: number) {
    return this.request<{ success: boolean; message: string }>(`/favorites/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotes(params?: { sourceType?: string }) {
    const search = new URLSearchParams();
    if (params?.sourceType) search.set('source_type', params.sourceType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<NoteApiItem>>(`/notes${suffix}`);
  }

  async createNote(data: NoteCreatePayload) {
    return this.request<NoteApiItem>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number) {
    return this.request<{ success: boolean; message: string }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async getHistory(params?: { eventType?: string }) {
    const search = new URLSearchParams();
    if (params?.eventType) search.set('event_type', params.eventType);
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return this.request<ApiListResponse<HistoryApiItem>>(`/history${suffix}`);
  }

  async submitFeedback(data: FeedbackCreatePayload) {
    return this.request<{ success: boolean; submission: FeedbackSubmission }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 意图识别API
  async recognizeIntent(input: string, currentInterests: string[] = []) {
    return this.request<IntentResponse>('/chat/recognize', {
      method: 'POST',
      body: JSON.stringify({ input, current_interests: currentInterests }),
    });
  }

  // 新聚合页面接口预留类型
  async getTodayPageData() {
    return this.request<TodayPageData>('/dashboard/today');
  }

  async getContentDetailByRef(contentRef: string) {
    const search = new URLSearchParams();
    search.set('content_ref', contentRef);
    return this.request<UnifiedContentDetailData>(`/content/by-ref?${search.toString()}`);
  }

  async getActionsOverview() {
    return this.request<ActionsOverviewData>('/actions/overview');
  }

  async checkInToday() {
    return this.request<ActionCheckInData>('/actions/check-in', {
      method: 'POST',
    });
  }

  async getGrowthOverview() {
    return this.request<GrowthOverviewData>('/preferences/growth-overview');
  }

  async getDailyDigest(profileId?: string | null, limit: number = 8) {
    const search = new URLSearchParams();
    if (profileId) {
      search.set('profile_id', profileId);
    }
    search.set('limit', String(limit));
    return this.request<DailyDigestResponse>(`/content/daily-digest?${search.toString()}`);
  }

  async consultDigest(data: { result_ref: string; question: string }) {
    return this.request<DigestConsultResponse>('/content/consult', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async executeChat(data: {
    input: string;
    current_interests?: string[];
    draft_type?: string;
    preferred_intent?: string;
    source_context?: string;
    source_content_ref?: string;
    source_title?: string;
    auto_commit?: boolean;
    confirmed_type?: string;
    correction_from?: string;
  }) {
    return this.request<ChatExecuteResult>('/chat/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reclassifyChat(data: {
    target_intent: string;
    correction_from: string;
    original_input?: string;
    source_context?: string;
  }) {
    return this.request<ChatExecuteResult>('/chat/reclassify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatSessions(limit: number = 20) {
    return this.request<ChatSessionSummary[]>(`/chat/sessions?limit=${limit}`);
  }

  async getChatSessionMessages(sessionId: number) {
    return this.request<ChatSessionMessagesData>(`/chat/sessions/${sessionId}/messages`);
  }

  async getUserInterests() {
    return this.request<{ interests: string[] }>('/preferences/interests');
  }

  async updateUserInterests(interests: string[]) {
    return this.request<{ interests: string[] }>('/preferences/interests', {
      method: 'PUT',
      body: JSON.stringify({ interests }),
    });
  }

  async getUserSettings() {
    return this.request<UserSettingsPayload>('/preferences/settings');
  }

  async updateUserSettings(data: UserSettingsPayload) {
    return this.request<UserSettingsPayload>('/preferences/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserAiProviderSettings() {
    return this.request<UserAiProviderPayload>('/preferences/ai-provider');
  }

  async updateUserAiProviderSettings(data: { provider?: string | null; api_key?: string | null }) {
    return this.request<UserAiProviderPayload>('/preferences/ai-provider', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile() {
    return this.request<UserProfilePayload>('/preferences/profile');
  }

  async login(data: { identifier: string; password: string }) {
    return this.request<AuthEnvelope>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  }) {
    return this.request<AuthEnvelope>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<AuthEnvelope>('/auth/me');
  }

  async logout() {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getReports() {
    return this.request<{ reports: ReportEntryItem[] }>('/reports');
  }

  async getWeeklyReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    return this.request<PeriodicReportData>(`/reports/weekly${suffix}`);
  }

  async getMonthlyReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    return this.request<PeriodicReportData>(`/reports/monthly${suffix}`);
  }

  async getAnnualReport(reportId?: number) {
    const suffix = reportId ? `?report_id=${reportId}` : '';
    return this.request<AnnualReportData>(`/reports/annual${suffix}`);
  }
}

class ApiConfigService extends ApiService {
  constructor() {
    super(API_CONFIG_BASE_URL);
  }

  async getCurrentProvider() {
    return this.request<{
      provider: string;
      model: string;
      api_url: string;
      is_configured: boolean;
    }>('/current');
  }
}

export const apiService = new ApiService(API_V1_BASE_URL);
export const apiConfigService = new ApiConfigService();
