import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { GrowthOverviewData, ReportEntryItem } from '../types/page-data';
import { formatSubtitleWithLunar } from '../utils/lunarCalendar';

const FALLBACK_WEEKLY_SUMMARY =
  '这一阶段你已经把信息输入逐步转成了真实的记录与历史痕迹。当前最明显的成长方向，是从“看内容”进入“留下痕迹、形成回顾”。';

const FALLBACK_PERSONA_SUMMARY =
  '你正在从“被动关注者”转向“会记录、会行动、会回看的持续探索者”。';

const FALLBACK_REPORT_ENTRIES: ReportEntryItem[] = [
  { reportType: 'weekly', reportTitle: '周报', available: true },
  { reportType: 'monthly', reportTitle: '月报', available: true },
  { reportType: 'annual', reportTitle: '年度报告', available: true },
];

const REPORT_PATH_MAP: Record<string, string> = {
  weekly: '/weekly-report',
  monthly: '/monthly-report',
  annual: '/annual-report',
};

export function useGrowthPageLogic() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [growthData, setGrowthData] = useState<GrowthOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrowthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getGrowthOverview();
      if (response.error) {
        throw new Error(response.error);
      }
      setGrowthData(response.data ?? null);
    } catch {
      setError('成长内容暂时加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGrowthData();
  }, [fetchGrowthData]);

  const activeInterests = useMemo(
    () => (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean).slice(0, 4),
    [growthData?.keywords],
  );

  const recentKeywords = useMemo(
    () => (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean).slice(0, 6),
    [growthData?.keywords],
  );

  const recentHistory = growthData?.recentHistoryItems ?? [];
  const notesCount = growthData?.totalThoughts ?? 0;
  const historyCount = recentHistory.length;
  const weeklySummary = growthData?.weeklySummary.growthSummary ?? FALLBACK_WEEKLY_SUMMARY;
  const personaSummary = growthData?.persona.personaSummary ?? FALLBACK_PERSONA_SUMMARY;
  const reportEntries = growthData?.reports ?? FALLBACK_REPORT_ENTRIES;
  const subtitle = formatSubtitleWithLunar();
  const displayName = user.isLoggedIn ? (user.username || growthData?.userName || '用户') : (growthData?.userName || '用户');

  const handleOpenReport = useCallback((reportType: string) => {
    navigate(REPORT_PATH_MAP[reportType] ?? '/growth');
  }, [navigate]);

  return {
    activeInterests,
    displayName,
    error,
    handleOpenHistoryBrief: () => navigate('/history-brief'),
    handleOpenHistoryLogs: () => navigate('/history-logs'),
    handleOpenMe: () => navigate('/me'),
    handleOpenProfile: () => navigate('/profile'),
    handleOpenReport,
    historyCount,
    loading,
    notesCount,
    personaSummary,
    recentHistory,
    recentKeywords,
    reportEntries,
    subtitle,
    weeklySummary,
  };
}
