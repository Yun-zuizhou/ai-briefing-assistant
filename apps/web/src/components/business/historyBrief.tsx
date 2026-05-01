import { ChevronRight, Search } from 'lucide-react';

import { PageSection } from '../layout';
import { Button } from '../ui';
import type { ReportEntryItem } from '../../types/page-data';

interface HistoryBriefReportViewItem extends ReportEntryItem {
  generatedLabel: string;
  statusLabel: string;
  typeLabel: string;
}

export function HistoryBriefSearchBox({
  onSearchChange,
  searchQuery,
}: {
  onSearchChange: (value: string) => void;
  searchQuery: string;
}) {
  return (
    <div className="history-brief-search-section">
      <div className="newspaper-search history-brief-search-shell">
        <Search size={16} className="history-brief-search-icon" />
        <input
          type="text"
          placeholder="搜索历史周期回顾..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="history-brief-search-input"
        />
      </div>
    </div>
  );
}

export function HistoryBriefStateCard({
  error,
  loading,
}: {
  error?: string | null;
  loading?: boolean;
}) {
  if (error) {
    return (
      <div className="domain-card history-brief-state-card">
        <p className="history-brief-state-error">{error}</p>
        <p className="history-brief-state-text">当前历史回看入口可能退回为空态。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="domain-card history-brief-state-card is-loading">
        <p className="history-brief-state-text">正在读取历史周期回顾入口...</p>
      </div>
    );
  }

  return null;
}

export function HistoryBriefIntroCard() {
  return (
    <div className="domain-card history-brief-state-card">
      <p className="history-brief-state-text">
        这里保存周报、月报和年报入口。历史日志负责按天留痕；历史简报负责进入已经形成的周期回看。
      </p>
    </div>
  );
}

export function HistoryBriefReportSection({
  emptyText,
  onOpenReport,
  reports,
  title,
}: {
  emptyText: string;
  onOpenReport: (item: HistoryBriefReportViewItem) => void;
  reports: HistoryBriefReportViewItem[];
  title: string;
}) {
  return (
    <PageSection className="history-brief-section" title={title}>
      {reports.length === 0 ? (
        <div className="domain-card history-brief-empty-card">
          <p className="history-brief-empty-text">{emptyText}</p>
        </div>
      ) : (
        <div className="history-brief-report-list">
          {reports.map((item) => (
            <Button
              key={item.reportType}
              type="button"
              onClick={() => onOpenReport(item)}
              variant="unstyled"
              className={`domain-card history-brief-report-card ${item.available ? '' : 'is-unavailable'}`}
              disabled={!item.available}
            >
              <div className="history-brief-report-layout">
                <div className="history-brief-report-main">
                  <div className="history-brief-report-head">
                    <span className={`history-brief-report-type ${item.available ? '' : 'is-unavailable'}`}>
                      {item.typeLabel}
                    </span>
                    <span className={`history-brief-report-status ${item.available ? '' : 'is-unavailable'}`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="history-brief-report-title">
                    {item.reportTitle}
                  </p>
                  <p className="history-brief-report-desc">
                    {item.available
                      ? `进入对应${item.typeLabel}，查看这一周期的解释和依据`
                      : '当前尚未形成可回看的正式报告'}
                  </p>
                  <div className="history-brief-report-meta">
                    <span className="history-brief-meta-item">生成时间 {item.generatedLabel}</span>
                    {item.periodStart && item.periodEnd ? (
                      <span className="history-brief-meta-item">
                        周期 {item.periodStart} ~ {item.periodEnd}
                      </span>
                    ) : null}
                    <span className="history-brief-meta-item">类型 {item.typeLabel}</span>
                  </div>
                </div>
                <ChevronRight size={18} className={`history-brief-chevron ${item.available ? '' : 'is-unavailable'}`} />
              </div>
            </Button>
          ))}
        </div>
      )}
    </PageSection>
  );
}
