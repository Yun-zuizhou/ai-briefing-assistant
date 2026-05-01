import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { apiService } from '../services/api';
import type { AnnualReportData, AnnualReportLlmBlocks } from '../types/page-data';
import { getAnnualReportAiStatus } from '../utils/aiGenerationStatus';
import { downloadFile } from '../utils/exportUtils';

function buildAnnualLlmBlocksMarkdown(blocks?: AnnualReportLlmBlocks): string {
  if (!blocks) return '';
  let markdown = `## AI 年度解读\n\n`;
  markdown += `- 思考总结：${blocks.thinkingSummary}\n`;
  markdown += `- 行动总结：${blocks.actionSummary}\n`;
  markdown += `- 年终洞察：${blocks.yearEndInsight}\n`;
  markdown += `- 数据说明：${blocks.dataNote}\n\n`;
  if (blocks.nextYearActions.length > 0) {
    markdown += `### 下一年建议\n\n`;
    blocks.nextYearActions.forEach((action) => {
      markdown += `- ${action}\n`;
    });
    markdown += `\n`;
  }
  return markdown;
}

function buildAnnualMarkdown(report: AnnualReportData): string {
  let markdown = `# 简报助手 · ${report.year} 年度报告\n\n`;
  markdown += `## 年度概览\n\n`;
  markdown += `- 热点：${report.stats.topicsViewed}\n`;
  markdown += `- 观点：${report.stats.opinionsPosted}\n`;
  markdown += `- 计划：${report.stats.plansCompleted}\n`;
  markdown += `- 活跃天数：${report.stats.daysActive}\n\n`;
  markdown += `## 关注领域\n\n`;
  report.interests.forEach((interest) => {
    markdown += `- ${interest}\n`;
  });
  markdown += `\n${buildAnnualLlmBlocksMarkdown(report.annualLlmBlocks)}`;
  markdown += `\n## 思考轨迹\n\n${report.thinkingSection}\n\n`;
  markdown += `## 行动足迹\n\n${report.actionSection}\n\n`;
  markdown += `## 年度关键词\n\n`;
  report.keywords.forEach((keyword) => {
    markdown += `- ${keyword}\n`;
  });
  markdown += `\n## 结语\n\n${report.closing}\n`;
  return markdown;
}

export function useAnnualReportPageLogic() {
  const location = useLocation();
  const [annualReport, setAnnualReport] = useState<AnnualReportData | null>(null);
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
    const fetchAnnualReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAnnualReport(reportId);
        if (response.error) {
          throw new Error(response.error);
        }
        setAnnualReport(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载年度报告失败');
        setAnnualReport(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnnualReport();
  }, [reportId]);

  const exportContent = useMemo(() => (annualReport ? buildAnnualMarkdown(annualReport) : ''), [annualReport]);
  const aiStatus = useMemo(
    () => getAnnualReportAiStatus(annualReport, { generating: refreshing, readonly: Boolean(reportId) }),
    [annualReport, refreshing, reportId],
  );

  const handleRefreshReport = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await apiService.getAnnualReport(reportId, { refresh: true });
      if (response.error) {
        throw new Error(response.error);
      }
      setAnnualReport(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '年度报告刷新失败，请稍后重试。');
    } finally {
      setRefreshing(false);
    }
  }, [reportId]);

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'html') {
      downloadFile(`<pre>${exportContent}</pre>`, `年度报告_${dateStr}.html`, 'text/html');
    } else {
      downloadFile(exportContent, `年度报告_${dateStr}.${exportFormat === 'text' ? 'txt' : 'md'}`, exportFormat === 'text' ? 'text/plain' : 'text/markdown');
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
    annualReport,
    error,
    exportFormat,
    handleExport,
    handleRefreshReport,
    handleShare,
    loading,
    refreshing,
    setExportFormat,
    setShowExportModal,
    setShowShareModal,
    showExportModal,
    showShareModal,
  };
}
