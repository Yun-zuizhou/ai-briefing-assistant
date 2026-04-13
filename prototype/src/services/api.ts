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

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? (import.meta.env.DEV ? '' : 'http://127.0.0.1:5000');
const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;
const API_CONFIG_BASE_URL = `${API_ORIGIN}/api-config`;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

export interface BriefingGeneratePayload {
  user_id?: number;
  type?: string;
  use_ai?: boolean;
}

export interface AiBriefingPayload {
  hot_topics: JsonObject[];
  opportunities: JsonObject[];
}

export interface AiProfilePayload {
  [key: string]: JsonValue;
}

export type StatsResponse = JsonObject;

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

export interface UserSettingsPayload {
  morning_brief_time: string;
  evening_brief_time: string;
  do_not_disturb_enabled: boolean;
  do_not_disturb_start?: string | null;
  do_not_disturb_end?: string | null;
  sound_enabled: boolean;
  vibration_enabled: boolean;
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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    return this.request<ApiListResponse<HotTopicListItem>>('/hot-topics');
  }

  async getHotTopic(id: number) {
    return this.request<HotTopicListItem>(`/hot-topics/${id}`);
  }

  // 机会信息API
  async getOpportunities() {
    return this.request<ApiListResponse<OpportunityListItem>>('/opportunities');
  }

  async getOpportunity(id: number) {
    return this.request<OpportunityListItem>(`/opportunities/${id}`);
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

  // 学习资源API
  async getLearningResources() {
    return this.request<JsonObject[]>('/learning-resources');
  }

  async getLearningResource(id: number) {
    return this.request<JsonObject>(`/learning-resources/${id}`);
  }

  // 简报生成API
  async generateBriefing(data: BriefingGeneratePayload) {
    return this.request<JsonObject>('/briefings/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 意图识别API
  async recognizeIntent(input: string, currentInterests: string[] = []) {
    return this.request<IntentResponse>('/intent/recognize', {
      method: 'POST',
      body: JSON.stringify({ input, current_interests: currentInterests }),
    });
  }

  // AI生成简报内容API
  async aiGenerateBriefing(data: AiBriefingPayload) {
    return this.request<{ content: string }>('/ai/generate-briefing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 用户画像生成API
  async aiGenerateProfile(user_data: AiProfilePayload) {
    return this.request<{ profile: string }>('/ai/generate-profile', {
      method: 'POST',
      body: JSON.stringify({ user_data }),
    });
  }

  // 想法总结API
  async aiSummarizeIdeas(ideas: string[]) {
    return this.request<{ summary: string }>('/ai/summarize-ideas', {
      method: 'POST',
      body: JSON.stringify({ ideas }),
    });
  }

  // 统计API
  async getStats() {
    return this.request<StatsResponse>('/stats');
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

  async executeChat(data: {
    input: string;
    current_interests?: string[];
    draft_type?: string;
    preferred_intent?: string;
    source_context?: string;
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

  async getUserProfile() {
    return this.request<UserProfilePayload>('/preferences/profile');
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
