import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { ReportEntryItem } from '../types/page-data';

export const REPORT_TYPE_LABELS: Record<ReportEntryItem['reportType'], string> = {
  weekly: '周报',
  monthly: '月报',
  annual: '年报',
};

const REPORT_ROUTES: Record<ReportEntryItem['reportType'], string> = {
  weekly: '/weekly-report',
  monthly: '/monthly-report',
  annual: '/annual-report',
};

export interface HistoryBriefReportViewItem extends ReportEntryItem {
  generatedLabel: string;
  statusLabel: string;
  typeLabel: string;
}

function toReportViewItem(item: ReportEntryItem): HistoryBriefReportViewItem {
  return {
    ...item,
    generatedLabel: item.generatedAt?.slice(0, 10) ?? '未生成',
    statusLabel: item.available ? '可查看' : '暂未生成',
    typeLabel: REPORT_TYPE_LABELS[item.reportType] ?? item.reportType,
  };
}

export function useHistoryBriefPageLogic() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<ReportEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getReports();
        if (response.error) {
          throw new Error(response.error);
        }
        setReports(response.data?.reports ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载历史回看入口失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchedReports = normalizedQuery
      ? reports.filter((item) => {
          const typeLabel = REPORT_TYPE_LABELS[item.reportType] ?? item.reportType;
          return item.reportTitle.toLowerCase().includes(normalizedQuery)
            || typeLabel.toLowerCase().includes(normalizedQuery)
            || item.reportType.toLowerCase().includes(normalizedQuery);
        })
      : reports;

    return matchedReports.map(toReportViewItem);
  }, [reports, searchQuery]);

  const availableReports = filteredReports.filter((item) => item.available);
  const unavailableReports = filteredReports.filter((item) => !item.available);

  const handleOpenReport = useCallback((item: HistoryBriefReportViewItem) => {
    if (!item.available || !item.reportId) return;
    const route = REPORT_ROUTES[item.reportType] ?? '/history-brief';
    navigate(`${route}?reportId=${item.reportId}`);
  }, [navigate]);

  return {
    availableReports,
    error,
    handleOpenReport,
    loading,
    searchQuery,
    setSearchQuery,
    unavailableReports,
  };
}
