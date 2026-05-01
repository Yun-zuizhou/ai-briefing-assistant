import { Bookmark } from 'lucide-react';

import { PageSection, PageStack } from '../layout';
import { Button, Tag } from '../ui';
import type { HotTopicListItem } from '../../types/page-data';
import { formatContentCategoryLabels } from '../../utils/contentLabels';

interface HotTopicViewItem extends HotTopicListItem {
  collected: boolean;
  displayTitle: string;
  heatValue: number;
  rankLabel: string;
  trendWidth: number;
}

export function HotTopicsStateCard({
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
      <div className="domain-card hot-topics-state-card">
        <p className="hot-topics-state-text">加载真实热点中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="domain-card hot-topics-state-card">
        <p className="hot-topics-state-error">{error}</p>
        <Button onClick={onRetry} variant="primary">重试</Button>
      </div>
    );
  }

  return null;
}

export function HotTopicsContent({
  onCollect,
  onTopicClick,
  topics,
}: {
  onCollect: (topic: HotTopicViewItem) => void;
  onTopicClick: (topic: HotTopicViewItem) => void;
  topics: HotTopicViewItem[];
}) {
  return (
    <PageStack>
      <HotTopicsBriefCard />
      <HotTopicsDetailSection onCollect={onCollect} onTopicClick={onTopicClick} topics={topics} />
    </PageStack>
  );
}

function HotTopicsBriefCard() {
  return (
    <div className="domain-card hot-topics-brief-card">
      <p className="hot-topics-brief-title">公共热点探索</p>
      <p className="hot-topics-brief-text">
        这里展示少量大家正在关注的公共议题。它不是你的每日简报主线；值得继续看的内容可以收藏或打开阅读详情。
      </p>
    </div>
  );
}

function HotTopicsDetailSection({
  onCollect,
  onTopicClick,
  topics,
}: {
  onCollect: (topic: HotTopicViewItem) => void;
  onTopicClick: (topic: HotTopicViewItem) => void;
  topics: HotTopicViewItem[];
}) {
  return (
    <PageSection className="hot-topics-section hot-topics-section-detail" title="热点列表">
      <div className="hot-topics-detail-list">
        {topics.map((topic) => (
          <article
            key={topic.id}
            className="domain-card hot-topics-detail-item"
          >
            <div className="hot-topics-detail-body">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => onTopicClick(topic)}
                className="hot-topics-detail-main"
                aria-label={`查看热点 ${topic.title} 的详细信息`}
              >
                <div className="hot-topics-detail-head">
                  <span className="hot-topics-detail-rank">
                    {topic.rankLabel}
                  </span>
                  <span className="hot-topics-detail-heat">
                    热度 {topic.heatValue}
                  </span>
                </div>
                <h3 className="type-content-title hot-topics-detail-title">
                  {topic.title}
                </h3>
                <p className="hot-topics-detail-summary">
                  {topic.summary ?? '暂无摘要'}
                </p>
                <div className="hot-topics-detail-meta">
                  <span className="hot-topics-detail-source">
                    {topic.source}
                  </span>
                  {formatContentCategoryLabels(topic.categories, 'hot_topic').slice(0, 3).map((cat) => (
                    <Tag key={cat}>{cat}</Tag>
                  ))}
                </div>
              </Button>
              <Button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCollect(topic);
                }}
                variant="unstyled"
                className={`hot-topics-collect-btn ${topic.collected ? 'is-collected' : ''}`}
                aria-label={topic.collected ? `取消收藏热点 ${topic.title}` : `收藏热点 ${topic.title}`}
              >
                <Bookmark size={10} fill={topic.collected ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </PageSection>
  );
}

export function HotTopicsModal({
  onClose,
  onCollect,
  onRead,
  topic,
}: {
  onClose: () => void;
  onCollect: (topic: HotTopicViewItem) => void;
  onRead: () => void;
  topic: HotTopicViewItem | null;
}) {
  if (!topic) return null;

  return (
    <div
      className="hot-topics-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="hot-topics-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hot-topic-dialog-title"
      >
        <span className="hot-topics-modal-frame" />

        <div className="hot-topics-modal-head">
          <h3 id="hot-topic-dialog-title" className="hot-topics-modal-title">
            热点观察
          </h3>
          <Button
            type="button"
            variant="unstyled"
            onClick={onClose}
            className="hot-topics-modal-close"
            aria-label="关闭热点详情"
          >
            ×
          </Button>
        </div>

        <h4 className="type-content-title hot-topics-modal-topic-title">
          {topic.title}
        </h4>

        <p className="hot-topics-modal-summary">
          {topic.summary ?? '暂无摘要'}
        </p>

        <div className="hot-topics-modal-meta">
          <span className="hot-topics-modal-source">
            来源: {topic.source}
          </span>
          {formatContentCategoryLabels(topic.categories, 'hot_topic').slice(0, 3).map((cat) => (
            <Tag key={cat}>{cat}</Tag>
          ))}
        </div>

        <div className="hot-topics-modal-note">
          <p>
            热点只代表公共关注，不等于你的个人关注。需要继续阅读时可以打开详情，值得保留时再收藏。
          </p>
        </div>

        <div className="hot-topics-modal-actions">
          <Button
            type="button"
            onClick={() => onCollect(topic)}
            variant="secondary"
            className="hot-topics-modal-action-btn"
          >
            <Bookmark size={14} fill={topic.collected ? 'currentColor' : 'none'} />
            {topic.collected ? '已收藏' : '收藏'}
          </Button>
          <Button
            type="button"
            onClick={onRead}
            variant="primary"
            className="hot-topics-modal-action-btn"
          >
            阅读原文
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HotTopicsToast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      className="hot-topics-toast"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
