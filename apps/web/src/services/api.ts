import type {
  ChatConfirmRequest,
  ChatMessageStreamRequest,
  ChatReclassifyRequest,
  TodoApiItem,
} from '../types/page-data';
import { ApiClient } from './apiClient';
import * as authApi from './apiDomains/auth';
import * as behaviorApi from './apiDomains/behavior';
import * as chatApi from './apiDomains/chat';
import * as contentApi from './apiDomains/content';
import * as dashboardApi from './apiDomains/dashboard';
import * as preferencesApi from './apiDomains/preferences';
import * as reportsApi from './apiDomains/reports';
import * as systemApi from './apiDomains/system';
import type { ApiDomainRuntime, ApiRequest } from './apiDomains/types';
import type {
  FavoriteCreatePayload,
  FeedbackCreatePayload,
  NoteCreatePayload,
  SummaryTaskCreatePayload,
  SummaryTaskStatus,
  UserSettingsPayload,
} from './apiPayloads';

export type {
  AuthEnvelope,
  AuthUser,
  BriefingDispatchStatsPayload,
  DailyDigestItem,
  DailyDigestResponse,
  DigestConsultResponse,
  FavoriteCreatePayload,
  FeedbackCreatePayload,
  FeedbackSubmission,
  IntentResponse,
  LlmInvocationStatsPayload,
  NoteCreatePayload,
  SummaryTaskApiItem,
  SummaryTaskCreatePayload,
  SummaryTaskCreateResponse,
  SummaryTaskListResponse,
  SummaryTaskResultApiItem,
  SummaryTaskStatus,
  UserAiProviderPayload,
  UserProfileGeneratePayload,
  UserProfilePayload,
  UserSettingsPayload,
} from './apiPayloads';

const DEFAULT_API_ORIGIN = import.meta.env.DEV
  ? ''
  : 'https://ai-briefing-assistant.aibriefing2026.workers.dev';
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;
const API_CONFIG_BASE_URL = `${API_ORIGIN}/api-config`;

class ApiService extends ApiClient {
  // Stable facade for pages and hooks; route implementation belongs in apiDomains/*.
  private domainRequest(): ApiRequest {
    return this.request.bind(this) as ApiRequest;
  }

  private domainRuntime(): ApiDomainRuntime {
    return {
      baseUrl: this.baseUrl,
      request: this.domainRequest(),
    };
  }

  async getHotTopics() {
    return contentApi.getHotTopics(this.domainRequest());
  }

  async getHotTopic(id: number) {
    return contentApi.getHotTopic(this.domainRequest(), id);
  }

  async getOpportunities() {
    return contentApi.getOpportunities(this.domainRequest());
  }

  async getOpportunity(id: number) {
    return contentApi.getOpportunity(this.domainRequest(), id);
  }

  async getTodos(params?: { status?: string; priority?: string }) {
    return behaviorApi.getTodos(this.domainRequest(), params);
  }

  async updateTodo(id: number, data: Partial<TodoApiItem>) {
    return behaviorApi.updateTodo(this.domainRequest(), id, data);
  }

  async deleteTodo(id: number) {
    return behaviorApi.deleteTodo(this.domainRequest(), id);
  }

  async getFavorites(params?: { itemType?: string }) {
    return behaviorApi.getFavorites(this.domainRequest(), params);
  }

  async createFavorite(data: FavoriteCreatePayload) {
    return behaviorApi.createFavorite(this.domainRequest(), data);
  }

  async deleteFavorite(id: number) {
    return behaviorApi.deleteFavorite(this.domainRequest(), id);
  }

  async getNotes(params?: { sourceType?: string }) {
    return behaviorApi.getNotes(this.domainRequest(), params);
  }

  async createNote(data: NoteCreatePayload) {
    return behaviorApi.createNote(this.domainRequest(), data);
  }

  async deleteNote(id: number) {
    return behaviorApi.deleteNote(this.domainRequest(), id);
  }

  async getHistory(params?: { eventType?: string }) {
    return behaviorApi.getHistory(this.domainRequest(), params);
  }

  async submitFeedback(data: FeedbackCreatePayload) {
    return behaviorApi.submitFeedback(this.domainRequest(), data);
  }

  async sendChatMessage(data: ChatMessageStreamRequest): Promise<ReadableStream<Uint8Array> | null> {
    return chatApi.sendChatMessage(this.domainRuntime(), data);
  }

  async getTodayPageData() {
    return dashboardApi.getTodayPageData(this.domainRequest());
  }

  async getContentDetailByRef(contentRef: string) {
    return contentApi.getContentDetailByRef(this.domainRequest(), contentRef);
  }

  async getActionsOverview() {
    return behaviorApi.getActionsOverview(this.domainRequest());
  }

  async getJournalOverview() {
    return behaviorApi.getJournalOverview(this.domainRequest());
  }

  async checkInToday() {
    return behaviorApi.checkInToday(this.domainRequest());
  }

  async getGrowthOverview() {
    return preferencesApi.getGrowthOverview(this.domainRequest());
  }

  async createSummaryTask(data: SummaryTaskCreatePayload) {
    return systemApi.createSummaryTask(this.domainRequest(), data);
  }

  async createChatSessionSummaryTask(sessionId: number, title?: string | null) {
    return systemApi.createChatSessionSummaryTask(this.domainRequest(), sessionId, title);
  }

  async listSummaryTasks(params?: { limit?: number; status?: SummaryTaskStatus; contentType?: string }) {
    return systemApi.listSummaryTasks(this.domainRequest(), params);
  }

  async getSummaryTask(taskId: number) {
    return systemApi.getSummaryTask(this.domainRequest(), taskId);
  }

  async getSummaryTaskResult(taskId: number) {
    return systemApi.getSummaryTaskResult(this.domainRequest(), taskId);
  }

  async getDailyDigest(profileId?: string | null, limit: number = 8) {
    return contentApi.getDailyDigest(this.domainRequest(), profileId, limit);
  }

  async consultDigest(data: { result_ref: string; question: string }) {
    return contentApi.consultDigest(this.domainRequest(), data);
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
    return chatApi.executeChat(this.domainRuntime(), data);
  }

  async reclassifyChat(data: ChatReclassifyRequest) {
    return chatApi.reclassifyChat(this.domainRuntime(), data);
  }

  async confirmChat(data: ChatConfirmRequest) {
    return chatApi.confirmChat(this.domainRuntime(), data);
  }

  async getChatSessions(limit: number = 20) {
    return chatApi.getChatSessions(this.domainRuntime(), limit);
  }

  async createChatSession() {
    return chatApi.createChatSession(this.domainRuntime());
  }

  async renameChatSession(sessionId: number, sessionTitle: string) {
    return chatApi.renameChatSession(this.domainRuntime(), sessionId, sessionTitle);
  }

  async archiveChatSession(sessionId: number) {
    return chatApi.archiveChatSession(this.domainRuntime(), sessionId);
  }

  async getChatSessionMessages(sessionId: number) {
    return chatApi.getChatSessionMessages(this.domainRuntime(), sessionId);
  }

  async deleteChatMessage(messageId: number) {
    return chatApi.deleteChatMessage(this.domainRuntime(), messageId);
  }

  async getUserInterests() {
    return preferencesApi.getUserInterests(this.domainRequest());
  }

  async updateUserInterests(interests: string[]) {
    return preferencesApi.updateUserInterests(this.domainRequest(), interests);
  }

  async getUserSettings() {
    return preferencesApi.getUserSettings(this.domainRequest());
  }

  async updateUserSettings(data: UserSettingsPayload) {
    return preferencesApi.updateUserSettings(this.domainRequest(), data);
  }

  async getUserAiProviderSettings() {
    return preferencesApi.getUserAiProviderSettings(this.domainRequest());
  }

  async updateUserAiProviderSettings(data: { provider?: string | null; api_key?: string | null }) {
    return preferencesApi.updateUserAiProviderSettings(this.domainRequest(), data);
  }

  async getUserProfile() {
    return preferencesApi.getUserProfile(this.domainRequest());
  }

  async generateUserProfile() {
    return preferencesApi.generateUserProfile(this.domainRequest());
  }

  async getLlmInvocationStats(options: { days?: number; window?: string; limit?: number } = {}) {
    return systemApi.getLlmInvocationStats(this.domainRequest(), options);
  }

  async getBriefingDispatchStats(options: { window?: string; limit?: number } = {}) {
    return systemApi.getBriefingDispatchStats(this.domainRequest(), options);
  }

  async login(data: { identifier: string; password: string }) {
    return authApi.login(this.domainRequest(), data);
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string | null;
  }) {
    return authApi.register(this.domainRequest(), data);
  }

  async getCurrentUser() {
    return authApi.getCurrentUser(this.domainRequest());
  }

  async logout() {
    return authApi.logout(this.domainRequest());
  }

  async getReports() {
    return reportsApi.getReports(this.domainRequest());
  }

  async getWeeklyReport(reportId?: number, options: { refresh?: boolean } = {}) {
    return reportsApi.getWeeklyReport(this.domainRequest(), reportId, options);
  }

  async getMonthlyReport(reportId?: number, options: { refresh?: boolean } = {}) {
    return reportsApi.getMonthlyReport(this.domainRequest(), reportId, options);
  }

  async getAnnualReport(reportId?: number, options: { refresh?: boolean } = {}) {
    return reportsApi.getAnnualReport(this.domainRequest(), reportId, options);
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
