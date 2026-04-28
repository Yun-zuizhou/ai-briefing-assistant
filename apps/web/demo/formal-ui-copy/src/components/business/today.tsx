import type { CSSProperties, ReactNode } from 'react';
import ContentListCard from './ContentListCard';
import { PagePanel, PageSection, PageSectionHeader } from '../layout';

const SECTION_STYLE: CSSProperties = { paddingBottom: '12px' };

export function TodaySection({ children }: { children: ReactNode }) {
  return (
    <PageSection style={SECTION_STYLE}>
      {children}
    </PageSection>
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
    <PageSectionHeader
      title={title}
      action={actionLabel && onAction ? (
        <button
          type="button"
          className="section-more"
          style={{ cursor: 'pointer', background: 'none', border: 'none' }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    />
  );
}

export function TodayErrorState({ message }: { message: string }) {
  return (
    <div className="domain-card" style={{ marginTop: '16px', padding: '24px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '8px' }}>{message}</p>
      <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>数据同步出现波动，请稍后重试。</p>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '12px',
            marginBottom: '10px',
          }}
        >
          <span className="hero-kicker">今日总述</span>
          <span className="hero-meta" style={{ textAlign: 'right' }}>
            {loading ? '同步中' : `${totalCount} 条核心内容`}
          </span>
        </div>
        <p className="hero-summary">{summary}</p>
        <div className="action-row">
          <button
            type="button"
            onClick={onRecord}
            className="action-chip primary"
          >
            记录一个想法
          </button>
          <button
            type="button"
            onClick={onBrowseAll}
            className="action-chip"
          >
            查看全部内容
          </button>
        </div>
      </div>
    </div>
  );
}

export function TodayInfoBox({ children }: { children: ReactNode }) {
  return <PagePanel>{children}</PagePanel>;
}

export function TodayGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: '8px' }}>{children}</div>;
}

export function TodayEmptyCard({ text }: { text: string }) {
  return (
    <div className="domain-card" style={{ textAlign: 'center', padding: '24px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>{text}</p>
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

export function TodayActionCard({
  actionType,
  deadline,
  title,
  summary,
  reward,
  featured = false,
  onOpen,
  onConvert,
}: {
  actionType: string;
  deadline?: string | null;
  title: string;
  summary?: string | null;
  reward?: string | null;
  featured?: boolean;
  onOpen: () => void;
  onConvert: () => void;
}) {
  return (
    <div
      className={`content-card ${featured ? 'featured' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={onOpen}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{actionType}</span>
        {deadline ? <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>截止 {deadline.slice(0, 10)}</span> : null}
      </div>
      <div className="content-title" style={{ marginBottom: '6px' }}>
        {title}
      </div>
      <p className="content-summary" style={{ marginBottom: '10px' }}>
        {summary ?? '暂无摘要'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <span className="micro-meta" style={{ color: 'var(--accent)' }}>{reward ?? '回报待定'}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onConvert();
          }}
          className="action-chip primary"
        >
          转成待办
        </button>
      </div>
    </div>
  );
}

export function TodayRecommendationPanel({
  reason,
  interests,
  children,
  emptyText,
}: {
  reason?: string;
  interests?: string[];
  children?: ReactNode;
  emptyText?: string;
}) {
  if (!interests || interests.length === 0) {
    return (
      <PagePanel>
        <p className="content-summary" style={{ margin: 0 }}>
          {emptyText ?? '当前没有可展示的推荐内容。'}
        </p>
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      {reason ? (
        <p className="content-summary" style={{ marginBottom: '8px' }}>
          {reason}
        </p>
      ) : null}
      <div className="action-row">
        {interests.map((item) => (
          <span key={item} className="tag">
            {item}
          </span>
        ))}
      </div>
      {children ? <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>{children}</div> : null}
    </PagePanel>
  );
}

export function TodayPromptPanel({
  copy,
  actionLabel,
  onAction,
}: {
  copy: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <PagePanel>
      <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '10px' }}>
        {copy}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="action-chip accent"
      >
        {actionLabel}
      </button>
    </PagePanel>
  );
}
