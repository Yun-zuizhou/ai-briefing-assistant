import type { PeriodicReportData } from '../../../types/page-data';

export type ReportAiStatusView = {
  actionLabel: string;
  canRegenerate: boolean;
  detail: string;
  loadingLabel: string;
  title: string;
};

export type ReportExportFormat = 'markdown' | 'html' | 'text';

export type PeriodicReportTrend = PeriodicReportData['topicTrends'][number];
