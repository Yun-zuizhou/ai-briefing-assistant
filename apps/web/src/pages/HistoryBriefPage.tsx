import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button } from '../components/ui';
import { apiService } from '../services/api';
import type { ReportEntryItem } from '../types/page-data';

const REPORT_TYPE_LABELS: Record<ReportEntryItem['reportType'], string> = {
  weekly: '周报',
  monthly: '月报',
  annual: '年报',
};

const REPORT_ROUTES: Record<ReportEntryItem['reportType'], string> = {
  weekly: '/weekly-report',
  monthly: '/monthly-report',
  annual: '/annual-report',
};

function getReportMeta(item: ReportEntryItem) {
  return {
    typeLabel: REPORT_TYPE_LABELS[item.reportType] ?? item.reportType,
    route: REPORT_ROUTES[item.reportType] ?? '/history-brief',
    generatedLabel: item.generatedAt?.slice(0, 10) ?? '未生成',
    statusLabel: item.available ? '可查看' : '暂未生成',
  };
}

export default function HistoryBriefPage() {
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
    if (!normalizedQuery) return reports;

    return reports.filter((item) => {
      const typeLabel = REPORT_TYPE_LABELS[item.reportType] ?? item.reportType;
      return item.reportTitle.toLowerCase().includes(normalizedQuery)
        || typeLabel.toLowerCase().includes(normalizedQuery)
        || item.reportType.toLowerCase().includes(normalizedQuery);
    });
  }, [reports, searchQuery]);

  const availableReports = filteredReports.filter((item) => item.available);
  const unavailableReports = filteredReports.filter((item) => !item.available);

  const handleOpenReport = (item: ReportEntryItem) => {
    if (!item.available || !item.reportId) return;
    const route = REPORT_ROUTES[item.reportType] ?? '/history-brief';
    navigate(`${route}?reportId=${item.reportId}`);
  };

  const renderReportSection = (title: string, items: ReportEntryItem[], emptyText: string) => (
    <section className="section history-brief-section">
      <div className="history-brief-section-head">
        <span className="history-brief-section-tag">{title}</span>
        <div className="history-brief-section-line" />
      </div>

      {items.length === 0 ? (
        <div className="domain-card history-brief-empty-card">
          <p className="history-brief-empty-text">{emptyText}</p>
        </div>
      ) : (
        <div className="history-brief-report-list">
          {items.map((item) => {
            const meta = getReportMeta(item);
            return (
              <Button
                key={item.reportType}
                type="button"
                onClick={() => handleOpenReport(item)}
                variant="unstyled"
                className={`domain-card history-brief-report-card ${item.available ? '' : 'is-unavailable'}`}
                disabled={!item.available}
              >
                <div className="history-brief-report-layout">
                  <div className="history-brief-report-main">
                    <div className="history-brief-report-head">
                      <span className={`history-brief-report-type ${item.available ? '' : 'is-unavailable'}`}>
                        {meta.typeLabel}
                      </span>
                      <span className={`history-brief-report-status ${item.available ? '' : 'is-unavailable'}`}>
                        {meta.statusLabel}
                      </span>
                    </div>
                    <p className="history-brief-report-title">
                      {item.reportTitle}
                    </p>
                    <p className="history-brief-report-desc">
                      {item.available
                        ? `查看历史周期回顾，进入对应${meta.typeLabel}详情页`
                        : '当前尚未形成可回看的正式报告'}
                    </p>
                    <div className="history-brief-report-meta">
                      <span className="history-brief-meta-item">生成时间 {meta.generatedLabel}</span>
                      {item.periodStart && item.periodEnd ? (
                        <span className="history-brief-meta-item">
                          周期 {item.periodStart} ~ {item.periodEnd}
                        </span>
                      ) : null}
                      <span className="history-brief-meta-item">类型 {meta.typeLabel}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`history-brief-chevron ${item.available ? '' : 'is-unavailable'}`} />
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="历史简报" label="HISTORY BRIEF" subtitle="历史周期回顾入口" />

      <PageContent className="history-brief-page-content">
        <div className="section history-brief-search-section">
          <div className="newspaper-search history-brief-search-shell">
            <Search size={16} className="history-brief-search-icon" />
            <input
              type="text"
              placeholder="搜索历史周期回顾..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-brief-search-input"
            />
          </div>
        </div>

        {error ? (
          <div className="domain-card history-brief-state-card">
            <p className="history-brief-state-error">{error}</p>
            <p className="history-brief-state-text">当前历史回看入口可能退回为空态。</p>
          </div>
        ) : null}

        {loading ? (
          <div className="domain-card history-brief-state-card is-loading">
            <p className="history-brief-state-text">正在读取历史周期回顾入口...</p>
          </div>
        ) : (
          <>
            {renderReportSection('可查看的周期回顾', availableReports, '当前没有可查看的历史周期回顾。')}
            {renderReportSection('暂未生成', unavailableReports, '当前没有待生成的周期回顾入口。')}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
