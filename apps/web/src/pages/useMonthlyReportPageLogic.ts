import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { PeriodicReportData, PeriodicReportLlmBlocks } from '../types/page-data';
import { getPeriodicReportAiStatus } from '../utils/aiGenerationStatus';
import { downloadFile } from '../utils/exportUtils';

function buildLlmBlocksMarkdown(blocks?: PeriodicReportLlmBlocks): string {
  if (!blocks) return '';
  let markdown = `## AI 解读\n\n`;
  markdown += `- 趋势解释：${blocks.trendExplanation}\n`;
  markdown += `- 周期总结：${blocks.periodSummary}\n`;
  markdown += `- 数据说明：${blocks.dataNote}\n\n`;
  if (blocks.nextActions.length > 0) {
    markdown += `### AI 建议\n\n`;
    blocks.nextActions.forEach((action) => {
      markdown += `- ${action}\n`;
    });
    markdown += `\n`;
  }
  return markdown;
}

function buildMonthlyMarkdown(report: PeriodicReportData): string {
  const { overview, topicTrends, growth } = report;
  let markdown = `# 简报助手 · 月报\n\n`;
  markdown += `**周期**: ${overview.period}\n\n`;
  markdown += `## 本月概览\n\n`;
  markdown += `- 关注：${overview.viewed}\n`;
  markdown += `- 记录：${overview.recorded}\n`;
  markdown += `- 收藏：${overview.collected}\n`;
  markdown += `- 完成：${overview.completed}\n`;
  markdown += `- 连续打卡：${overview.streak} 天\n\n`;
  markdown += buildLlmBlocksMarkdown(report.llmBlocks);

  if (topicTrends.length > 0) {
    markdown += `## 月度趋势\n\n`;
    topicTrends.forEach((trend) => {
      markdown += `### ${trend.icon} ${trend.title}\n`;
      markdown += `- 热度变化：${trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}${Math.abs(trend.heatData.change)}%\n`;
      markdown += `- 月度热点：${trend.hotSpot.title}\n`;
      markdown += `- 洞察：${trend.insights.join('；')}\n\n`;
    });
  }

  markdown += `## 月度回顾\n\n`;
  markdown += `${growth.trajectory.description}\n\n`;

  if (growth.selectedThoughts.length > 0) {
    markdown += `### 月度想法精选\n\n`;
    growth.selectedThoughts.forEach((thought) => {
      markdown += `- ${thought.date}：${thought.content}\n`;
    });
    markdown += `\n`;
  }

  markdown += `### 下月建议\n\n`;
  growth.suggestions.forEach((suggestion) => {
    markdown += `- ${suggestion}\n`;
  });

  return markdown;
}

export function useMonthlyReportPageLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenChatPanel } = useAppContext();
  const [reportData, setReportData] = useState<PeriodicReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'text'>('markdown');
  const [refreshing, setRefreshing] = useState(false);
  const reportId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('reportId');
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [location.search]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getMonthlyReport(reportId);
        if (response.error) {
          throw new Error(response.error);
        }
        setReportData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载月报失败');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [reportId]);

  const exportContent = useMemo(() => (reportData ? buildMonthlyMarkdown(reportData) : ''), [reportData]);
  const aiStatus = useMemo(
    () => getPeriodicReportAiStatus(reportData, '月报', { generating: refreshing, readonly: Boolean(reportId) }),
    [refreshing, reportData, reportId],
  );

  const handleRecordThought = useCallback(() => {
    setOpenChatPanel(true);
  }, [setOpenChatPanel]);

  const handleOpenHotspotDetail = useCallback((contentRef?: string) => {
    if (!contentRef) {
      return;
    }
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`);
  }, [navigate]);

  const handleRefreshReport = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await apiService.getMonthlyReport(reportId, { refresh: true });
      if (response.error) {
        throw new Error(response.error);
      }
      setReportData(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '月报刷新失败，请稍后重试。');
    } finally {
      setRefreshing(false);
    }
  }, [reportId]);

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'html') {
      downloadFile(`<pre>${exportContent}</pre>`, `月报_${dateStr}.html`, 'text/html');
    } else {
      downloadFile(exportContent, `月报_${dateStr}.${exportFormat === 'text' ? 'txt' : 'md'}`, exportFormat === 'text' ? 'text/plain' : 'text/markdown');
    }
    setShowExportModal(false);
  }, [exportContent, exportFormat]);

  const handleShare = useCallback((method: 'link' | 'wechat' | 'weibo') => {
    if (method === 'link') {
      void navigator.clipboard.writeText(exportContent);
    } else if (method === 'wechat') {
      void navigator.clipboard.writeText(exportContent);
    } else {
      window.open(`https://service.weibo.com/share/share.php?title=${encodeURIComponent(exportContent.slice(0, 300))}`, '_blank');
    }
    setShowShareModal(false);
  }, [exportContent]);

  return {
    aiStatus,
    error,
    exportFormat,
    handleExport,
    handleOpenHotspotDetail,
    handleRecordThought,
    handleRefreshReport,
    handleShare,
    loading,
    refreshing,
    reportData,
    setExportFormat,
    setShowExportModal,
    setShowShareModal,
    showExportModal,
    showShareModal,
  };
}
