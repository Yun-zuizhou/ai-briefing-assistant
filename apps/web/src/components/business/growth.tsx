import { PageGrid } from '../layout';
import { Tag } from '../ui';
import { NavigationEntryCard } from './common';
import type { GrowthOverviewData, ReportEntryItem } from '../../types/page-data';

type HistoryPreviewItem = GrowthOverviewData['recentHistoryItems'][number];

const HISTORY_TYPE_LABELS: Record<string, string> = {
  briefing: '简报',
  journal: '记录',
  action: '行动',
};

export function GrowthProfileCard({
  activeInterestCount,
  displayName,
  historyCount,
  notesCount,
}: {
  activeInterestCount: number;
  displayName: string;
  historyCount: number;
  notesCount: number;
}) {
  return (
    <div className="domain-card growth-profile-card">
      <div className="growth-profile-head">
        <div className="growth-profile-badge">
          {Math.max(activeInterestCount, 1)}
        </div>
        <div className="growth-profile-copy">
          <h3 className="growth-profile-name">{displayName}</h3>
          <p className="growth-profile-meta">
            已有 {notesCount} 条真实记录 · {historyCount} 条近期回看
          </p>
        </div>
      </div>
    </div>
  );
}

export function GrowthWeeklyCard({
  activeInterests,
  summary,
}: {
  activeInterests: string[];
  summary: string;
}) {
  return (
    <div className="domain-card growth-weekly-card">
      <p className="growth-summary-text">{summary}</p>
      <div className="growth-tag-list">
        {activeInterests.length > 0 ? activeInterests.slice(0, 4).map((interest) => (
          <Tag key={interest}>{interest}</Tag>
        )) : (
          <span className="growth-muted-text">当前还没有稳定成长关键词</span>
        )}
      </div>
    </div>
  );
}

export function GrowthKeywordCard({
  keywords,
  loading,
}: {
  keywords: string[];
  loading: boolean;
}) {
  return (
    <div className="domain-card growth-keyword-card">
      {loading ? (
        <p className="growth-muted-text">加载中...</p>
      ) : keywords.length > 0 ? (
        <div className="growth-tag-list">
          {keywords.map((keyword) => (
            <Tag key={keyword}>{keyword}</Tag>
          ))}
        </div>
      ) : (
        <p className="growth-muted-text">当前还没有带标签的真实记录。</p>
      )}
    </div>
  );
}

export function GrowthPersonaCard({
  summary,
}: {
  summary: string;
}) {
  return (
    <div className="domain-card growth-persona-card">
      <p className="growth-summary-text no-bottom">{summary}</p>
    </div>
  );
}

export function GrowthHistoryCard({
  items,
  loading,
}: {
  items: HistoryPreviewItem[];
  loading: boolean;
}) {
  return (
    <div className="domain-card growth-history-card">
      {loading ? (
        <div className="growth-history-state">
          <p className="growth-muted-text">加载中...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="article-list">
          {items.map((item) => (
            <div key={`${item.historyType}-${item.historyDate}-${item.historyTitle}`} className="article-item growth-history-item">
              <div className="growth-history-row">
                <span className="growth-history-type">
                  {HISTORY_TYPE_LABELS[item.historyType] ?? item.historyType}
                </span>
                <span className="growth-history-date">{item.historyDate}</span>
              </div>
              <div className="growth-history-title">{item.historyTitle}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="growth-history-state">
          <p className="growth-muted-text">当前还没有可展示的真实历史记录。</p>
        </div>
      )}
    </div>
  );
}

export function GrowthReportList({
  items,
  onOpenReport,
}: {
  items: ReportEntryItem[];
  onOpenReport: (reportType: string) => void;
}) {
  return (
    <PageGrid className="growth-report-list">
      {items.map((item) => (
        <NavigationEntryCard
          key={item.reportType}
          onClick={() => onOpenReport(item.reportType)}
          title={item.reportTitle}
          description={item.available ? '进入本周期正式回顾页面' : '当前周期暂未生成正式报告'}
        />
      ))}
    </PageGrid>
  );
}
