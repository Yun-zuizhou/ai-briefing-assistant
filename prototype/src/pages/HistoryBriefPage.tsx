import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
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
    <section className="section" style={{ paddingBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            padding: '4px 12px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {items.length === 0 ? (
        <div className="domain-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>{emptyText}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => {
            const meta = getReportMeta(item);
            return (
              <div
                key={item.reportType}
                onClick={() => handleOpenReport(item)}
                className="domain-card"
                style={{
                  margin: 0,
                  padding: '12px',
                  cursor: item.available ? 'pointer' : 'not-allowed',
                  opacity: item.available ? 1 : 0.75,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: item.available ? 'var(--accent)' : 'var(--paper-warm)',
                          color: item.available ? 'var(--paper)' : 'var(--ink-muted)',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {meta.typeLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: item.available ? 'var(--accent)' : 'var(--ink-muted)' }}>
                        {meta.statusLabel}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        marginBottom: '4px',
                        fontFamily: 'var(--font-serif-cn)',
                      }}
                    >
                      {item.reportTitle}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--ink-light)', margin: 0 }}>
                      {item.available
                        ? `查看历史周期回顾，进入对应${meta.typeLabel}详情页`
                        : '当前尚未形成可回看的正式报告'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>生成时间 {meta.generatedLabel}</span>
                      {item.periodStart && item.periodEnd ? (
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                          周期 {item.periodStart} ~ {item.periodEnd}
                        </span>
                      ) : null}
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>类型 {meta.typeLabel}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: item.available ? 'var(--ink-muted)' : 'var(--border)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="历史简报" label="HISTORY BRIEF" subtitle="历史周期回顾入口" />

      <PageContent>
        <div className="section" style={{ paddingBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={16} style={{ color: 'var(--ink-muted)' }} />
            <input
              type="text"
              placeholder="搜索历史周期回顾..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {error ? (
          <div className="domain-card" style={{ marginBottom: '12px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前历史回看入口可能退回为空态。</p>
          </div>
        ) : null}

        {loading ? (
          <div className="domain-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>正在读取历史周期回顾入口...</p>
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
