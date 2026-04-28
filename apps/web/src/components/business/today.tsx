import type { ReactNode } from 'react';
import ContentListCard from './ContentListCard';
import Button from '../ui/Button';

export function TodaySection({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`section today-section ${className}`.trim()}>
      {children}
    </section>
  );
}

export function TodaySectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-header">
      <span className="section-title">{title}</span>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="unstyled"
          className="section-more"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function TodayErrorState({ message }: { message: string }) {
  return (
    <div className="domain-card today-error-card today-error-state">
      <p className="today-error-title">{message}</p>
      <p className="today-error-detail">数据同步出现波动，请稍后重试。</p>
    </div>
  );
}

export function TodaySummaryCard({
  loading,
  totalCount,
  summary,
  onRecord,
  onBrowseAll,
}: {
  loading: boolean;
  totalCount: number;
  summary: string;
  onRecord: () => void;
  onBrowseAll: () => void;
}) {
  return (
    <div className="surface-hero">
      <div className="surface-hero-inner">
        <div className="today-summary-head">
          <span className="hero-kicker">今日总述</span>
          <span className="hero-meta today-summary-meta">
            {loading ? '同步中' : `${totalCount} 条核心内容`}
          </span>
        </div>
        <p className="hero-summary">{summary}</p>
        <div className="action-row">
          <Button
            type="button"
            variant="unstyled"
            onClick={onRecord}
            className="action-chip primary"
          >
            记录一个想法
          </Button>
          <Button
            type="button"
            variant="unstyled"
            onClick={onBrowseAll}
            className="action-chip"
          >
            查看全部内容
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TodayLeadCard({
  loading,
  kicker,
  title,
  summary,
  sourceLabel,
  relevanceLabel,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  onAsk,
}: {
  loading: boolean;
  kicker: string;
  title: string;
  summary: string;
  sourceLabel?: string;
  relevanceLabel?: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onAsk: () => void;
}) {
  return (
    <div className="today-lead-card">
      <div className="today-lead-topline">
        <span className="hero-kicker">{kicker}</span>
        <span className="hero-meta">{loading ? '同步中' : '今日重点'}</span>
      </div>
      <h2 className="today-lead-title">{title}</h2>
      <p className="today-lead-summary">{summary}</p>
      <div className="today-lead-meta-row">
        {sourceLabel ? <span>{sourceLabel}</span> : null}
        {relevanceLabel ? <span>{relevanceLabel}</span> : null}
      </div>
      <div className="today-lead-actions">
        <Button
          type="button"
          variant="unstyled"
          onClick={onPrimaryAction}
          className="action-chip primary"
        >
          {primaryActionLabel}
        </Button>
        <Button
          type="button"
          variant="unstyled"
          onClick={onAsk}
          className="action-chip"
        >
          继续追问
        </Button>
        <Button
          type="button"
          variant="unstyled"
          onClick={onSecondaryAction}
          className="action-chip"
        >
          {secondaryActionLabel}
        </Button>
      </div>
    </div>
  );
}

export function TodayFocusBar({
  knowledgeCount,
  actionCount,
  recommendationCount,
}: {
  knowledgeCount: number;
  actionCount: number;
  recommendationCount: number;
}) {
  const items = [
    { label: '可看', value: knowledgeCount },
    { label: '可做', value: actionCount },
    { label: '相关', value: recommendationCount },
  ];

  return (
    <div className="today-focus-bar" aria-label="今日简报摘要">
      {items.map((item) => (
        <div className="today-focus-item" key={item.label}>
          <span className="today-focus-value">{item.value}</span>
          <span className="today-focus-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TodayInfoBox({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`today-info-box ${className}`.trim()}>{children}</div>;
}

export function TodayGrid({ children }: { children: ReactNode }) {
  return <div className="today-grid">{children}</div>;
}

export function TodayEmptyCard({ text }: { text: string }) {
  return (
    <div className="domain-card today-empty-card">
      <p className="today-empty-text">{text}</p>
    </div>
  );
}

export function TodayLoadingState() {
  const knowledgeRows = ['今日热点校读', '趋势线索誊写', '重点来源核验'];
  const actionRows = ['机会条目筛选', '行动价值评估'];

  return (
    <div className="today-loading-state" aria-live="polite" aria-label="正在整理今日简报">
      <div className="today-loading-banner">
        <div className="today-loading-seal">整理中</div>
        <div>
          <p className="today-loading-title">正在整理今日简报</p>
          <p className="today-loading-copy">
            系统正在抄录热点、核对机会，并把与你相关的内容排进今天的版面。
          </p>
        </div>
      </div>

      <div className="today-loading-grid">
        <div className="today-loading-column">
          <div className="today-loading-column-title">值得知道的</div>
          {knowledgeRows.map((item, index) => (
            <div className="today-loading-card" key={item}>
              <span className="today-loading-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="today-loading-line is-strong" />
              <span className="today-loading-line" />
            </div>
          ))}
        </div>
        <div className="today-loading-column">
          <div className="today-loading-column-title">值得行动的</div>
          {actionRows.map((item, index) => (
            <div className="today-loading-card is-action" key={item}>
              <span className="today-loading-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="today-loading-line is-strong" />
              <span className="today-loading-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TodayContentCard({
  eyebrow,
  meta,
  title,
  summary,
  onClick,
  footer,
  warm = false,
  featured = false,
}: {
  eyebrow: string;
  meta?: ReactNode;
  title: string;
  summary?: string | null;
  onClick: () => void;
  footer?: ReactNode;
  warm?: boolean;
  featured?: boolean;
}) {
  return (
    <ContentListCard
      eyebrow={eyebrow}
      title={title}
      summary={summary}
      meta={meta}
      footer={footer}
      onClick={onClick}
      warm={warm}
      featured={featured}
    />
  );
}
