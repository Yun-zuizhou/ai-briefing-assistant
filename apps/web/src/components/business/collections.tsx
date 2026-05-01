import { Briefcase, ChevronDown, ChevronUp, FileText, GraduationCap, Newspaper, Pin, Search, Trash2 } from 'lucide-react';

import { Button, ConfirmModal } from '../ui';
import type { FavoriteApiItem, FollowingItem } from '../../types/page-data';

type TrackingStep = {
  label: string;
  done: boolean;
  current?: boolean;
};

interface CollectionTrackingInfo {
  follow: FollowingItem | null;
  steps: TrackingStep[];
}

const CATEGORY_LABELS: Record<string, string> = {
  hot_topic: '热点',
  opportunity: '机会',
  learning_resource: '学习',
  article: '文章',
};

function CollectionTypeIcon({ itemType }: { itemType: string }) {
  const props = { size: 18, strokeWidth: 1.9, 'aria-hidden': true };
  if (itemType === 'hot_topic') return <Newspaper {...props} />;
  if (itemType === 'opportunity') return <Briefcase {...props} />;
  if (itemType === 'learning_resource') return <GraduationCap {...props} />;
  if (itemType === 'article') return <FileText {...props} />;
  return <Pin {...props} />;
}

export function CollectionsSearchBox({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="newspaper-search collections-search-shell">
      <Search size={18} className="collections-search-icon" />
      <input
        type="text"
        placeholder="搜索收藏内容..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </div>
  );
}

export function CollectionsStateCard({
  error,
  loading,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="collections-state-card">
        正在加载真实收藏...
      </div>
    );
  }

  if (!error) {
    return null;
  }

  return (
    <div className="collections-state-card is-error">
      <p className="collections-error-text">{error}</p>
      <Button type="button" onClick={onRetry} variant="primary">
        重试
      </Button>
    </div>
  );
}

export function CollectionsEmptyState() {
  return (
    <div className="collections-empty-state">
      <div className="collections-empty-icon-shell">
        <span className="collections-empty-icon-frame" />
        <span className="collections-empty-icon">📚</span>
      </div>
      <p className="collections-empty-title">
        暂无收藏内容
      </p>
      <p className="collections-empty-text">
        在简报、阅读详情或热点页保存内容后，会在这里继续阅读或转成后续行动。
      </p>
    </div>
  );
}

export function CollectionsList({
  expandedTrackId,
  getTrackingItem,
  items,
  onDeleteRequest,
  onOpenActions,
  onOpenArticle,
  onStartTracking,
  onToggleTrack,
}: {
  expandedTrackId: number | null;
  getTrackingItem: (item: FavoriteApiItem) => CollectionTrackingInfo | null;
  items: FavoriteApiItem[];
  onDeleteRequest: (id: number) => void;
  onOpenActions: () => void;
  onOpenArticle: (item: FavoriteApiItem) => void;
  onStartTracking: (item: FavoriteApiItem) => void;
  onToggleTrack: (id: number) => void;
}) {
  return (
    <>
      {items.map((item) => {
        const tracking = getTrackingItem(item);
        return (
          <div key={item.id} className="collection-card collections-item-card">
            <div className="collection-card-content">
              <div className="collections-item-head">
                <span className="collections-item-icon"><CollectionTypeIcon itemType={item.item_type} /></span>
                <div className="collections-item-main">
                  <span className="collections-item-type-chip">
                    {CATEGORY_LABELS[item.item_type] || item.item_type}
                  </span>
                  <h4 className="collections-item-title">{item.item_title}</h4>
                </div>
              </div>

              <p className="collections-item-summary">{item.item_summary || '暂无摘要'}</p>

              <div className="collections-item-footer">
                <span className="collections-item-meta">
                  {item.item_source || '未知来源'} · {item.created_at.split('T')[0]}
                </span>
                <div className="collections-item-actions">
                  {item.item_type === 'opportunity' ? (
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={() => {
                        if (!tracking?.follow) {
                          onStartTracking(item);
                          return;
                        }
                        onToggleTrack(item.id);
                      }}
                      className="collections-action-btn collections-action-track"
                    >
                      {tracking?.follow ? (
                        <>
                          {expandedTrackId === item.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          查看跟进
                        </>
                      ) : (
                        '开始跟进'
                      )}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => onOpenArticle(item)}
                    className="collections-action-btn collections-action-source"
                  >
                    原文
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onDeleteRequest(item.id)}
                    variant="unstyled"
                    className="collections-action-btn collections-action-delete"
                    aria-label="删除收藏"
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>
              </div>
              {item.item_type === 'opportunity' && expandedTrackId === item.id && tracking?.follow ? (
                <div className="collections-track-panel">
                  <div className="collections-track-top">
                    <span className="collections-track-status">跟进状态：{tracking.follow.followStatus}</span>
                    {tracking.follow.deadline ? (
                      <span className="collections-track-deadline">
                        截止 {tracking.follow.deadline}
                      </span>
                    ) : null}
                  </div>
                  <div className="collections-track-step-list">
                    {tracking.steps.map((step) => (
                      <div
                        key={`${item.id}-${step.label}`}
                        className={`collections-track-step ${step.done ? 'is-done' : ''} ${step.current ? 'is-current' : ''}`}
                      >
                        <div className="collections-track-check">
                          {step.done ? '✓' : ''}
                        </div>
                        <span className="collections-track-step-label">
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="collections-track-note">
                    {tracking.follow.nextStep || tracking.follow.progressText || '当前还没有下一步说明。'}
                  </p>
                  <div className="collections-track-actions">
                    <Button
                      type="button"
                      onClick={onOpenActions}
                      variant="secondary"
                      className="collections-track-btn"
                    >
                      去行动页
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onStartTracking(item)}
                      variant="primary"
                      className="collections-track-btn"
                    >
                      继续处理
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function CollectionsDeleteModal({
  isOpen,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="确定要删除这条收藏吗？"
      confirmLabel="删除"
      cancelLabel="取消"
      confirmStyle="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
