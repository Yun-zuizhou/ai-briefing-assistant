import { Trash2 } from 'lucide-react';

import { PageGrid } from '../layout';
import { Button, Tag } from '../ui';
import type { JournalKeptItem, JournalProgressItem, NoteApiItem } from '../../types/page-data';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  chat: '来自对话',
  manual: '手动记录',
  content: '来自内容',
  article: '来自内容',
  hot_topic: '来自热点',
  opportunity: '来自机会',
};

function truncateText(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
}

function formatDateTime(dateStr: string): string {
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return dateStr.replace('T', ' ').slice(0, 16);
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function getSourceLabel(sourceType: string) {
  return SOURCE_TYPE_LABELS[sourceType] ?? '已沉淀';
}

export function JournalErrorCard({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="domain-card journal-state-card journal-error-card">
      <p className="journal-error-text">{error}</p>
      <Button type="button" onClick={onRetry} variant="primary">
        重试
      </Button>
    </div>
  );
}

export function JournalOverviewCard({
  expressionCount,
  keptCount,
  loading,
  onOpenChat,
  progressCount,
  summaryText,
}: {
  expressionCount: number;
  keptCount: number;
  loading: boolean;
  onOpenChat: () => void;
  progressCount: number;
  summaryText: string;
}) {
  return (
    <section className="domain-card journal-overview-card">
      <div className="journal-overview-head">
        <div>
          <p className="journal-overview-kicker">最近沉淀</p>
          <h2 className="journal-overview-title">主动记录会先汇到这里</h2>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenChat}>
          去对话
        </Button>
      </div>
      <p className="journal-overview-text">
        {loading ? '正在读取真实沉淀...' : summaryText}
      </p>
      <div className="journal-stats-grid journal-overview-stats">
        <div className="journal-stat-item has-divider">
          <div className="journal-stat-value tone-accent">{expressionCount}</div>
          <div className="journal-stat-label">说过</div>
        </div>
        <div className="journal-stat-item has-divider">
          <div className="journal-stat-value tone-gold">{progressCount}</div>
          <div className="journal-stat-label">推进</div>
        </div>
        <div className="journal-stat-item">
          <div className="journal-stat-value tone-ink">{keptCount}</div>
          <div className="journal-stat-label">留下</div>
        </div>
      </div>
    </section>
  );
}

export function JournalThoughtList({
  loading,
  onDeleteThought,
  thoughts,
}: {
  loading: boolean;
  onDeleteThought: (id: number) => void;
  thoughts: NoteApiItem[];
}) {
  if (loading) {
    return (
      <div className="domain-card journal-state-card">
        <p className="journal-state-title">加载记录中...</p>
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="domain-card journal-state-card">
        <p className="journal-state-title">还没有可回看的想法</p>
        <p className="journal-state-text">从对话里留下一句话，它会先成为可回看的个人记录。</p>
      </div>
    );
  }

  return (
    <PageGrid className="journal-thought-list">
      {thoughts.slice(0, 5).map((thought) => (
        <article key={thought.id} className="domain-card journal-thought-card">
          <div className="journal-thought-head">
            <div className="journal-thought-meta">
              <span>{formatDateTime(thought.created_at)}</span>
              <span>{getSourceLabel(thought.source_type)}</span>
            </div>
            <Button
              type="button"
              onClick={() => onDeleteThought(thought.id)}
              variant="unstyled"
              className="journal-thought-delete-btn"
              aria-label={`删除记录 ${thought.id}`}
            >
              <Trash2 size={12} className="journal-thought-delete-icon" />
            </Button>
          </div>
          <p className="journal-thought-content">{thought.content}</p>
          {thought.tags.length > 0 ? (
            <div className="journal-mini-tags">
              {thought.tags.slice(0, 3).map((tag) => (
                <Tag key={`${thought.id}-${tag}`} variant="soft">
                  {tag}
                </Tag>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </PageGrid>
  );
}

export function JournalProgressList({
  items,
  loading,
}: {
  items: JournalProgressItem[];
  loading: boolean;
}) {
  return (
    <PageGrid className="journal-compact-list">
      {loading ? (
        <div className="domain-card journal-state-card">
          <p className="journal-state-title">加载行动沉淀中...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="domain-card journal-state-card">
          <p className="journal-state-title">暂无推进中的事项</p>
          <p className="journal-state-text">对话生成的待办和机会跟进会在这里形成摘要。</p>
        </div>
      ) : items.map((item) => (
        <article key={item.id} className="domain-card journal-compact-card">
          <div className="journal-compact-head">
            <span className="journal-compact-label">{item.meta}</span>
          </div>
          <p className="journal-compact-title">{item.title}</p>
          <p className="journal-compact-detail">{item.detail}</p>
        </article>
      ))}
    </PageGrid>
  );
}

export function JournalKeepGrid({
  items,
  loading,
}: {
  items: JournalKeptItem[];
  loading: boolean;
}) {
  return (
    <PageGrid className="journal-keep-grid">
      {loading ? (
        <div className="domain-card journal-state-card">
          <p className="journal-state-title">加载历史痕迹中...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="domain-card journal-state-card">
          <p className="journal-state-title">暂无近期沉淀</p>
          <p className="journal-state-text">收藏和历史轨迹会在这里形成最近的回看入口。</p>
        </div>
      ) : items.map((item) => (
        <article key={item.id} className="domain-card journal-keep-card">
          <div className="journal-keep-meta">
            <span>{item.sourceLabel}</span>
            <span>{item.createdAt ? formatDateTime(item.createdAt) : '未记录'}</span>
          </div>
          <p className="journal-keep-title">{item.title}</p>
          <p className="journal-keep-detail">{truncateText(item.detail, 54)}</p>
        </article>
      ))}
    </PageGrid>
  );
}

export function JournalReviewCard({
  onOpenGrowth,
  onOpenHistoryBrief,
  reviewCount,
  summaryText,
  tags,
}: {
  onOpenGrowth: () => void;
  onOpenHistoryBrief: () => void;
  reviewCount: number;
  summaryText: string;
  tags: string[];
}) {
  return (
    <section className="journal-review-card">
      <div className="journal-review-main">
        <p className="journal-review-title">{summaryText}</p>
        <p className="journal-review-meta">
          {reviewCount > 0
            ? `已有 ${reviewCount} 个可查看的周期回顾入口`
            : '周期回顾会留在成长和历史简报里，不压住当前记录。'}
        </p>
      </div>
      <div className="journal-growth-tags">
        {(tags.length > 0 ? tags : ['待形成标签']).map((tag, index) => (
          <Tag key={`${tag}-${index}`} variant="soft">
            {tag}
          </Tag>
        ))}
      </div>
      <div className="journal-review-actions">
        <Button type="button" variant="secondary" size="sm" onClick={onOpenGrowth}>
          成长页
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenHistoryBrief}>
          历史简报
        </Button>
      </div>
    </section>
  );
}
