import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button, Tag } from '../components/ui';
import { apiService } from '../services/api';
import type { FavoriteApiItem, HotTopicListItem } from '../types/page-data';

const buildContentRef = (contentType: string, id: string | number) => `${contentType}:${id}`;

export default function HotTopicsPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<HotTopicListItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<HotTopicListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [topicsResponse, favoritesResponse] = await Promise.all([
        apiService.getHotTopics(),
        apiService.getFavorites({ itemType: 'hot_topic' }),
      ]);
      if (topicsResponse.error) {
        throw new Error(topicsResponse.error);
      }
      if (favoritesResponse.error) {
        throw new Error(favoritesResponse.error);
      }
      setTopics(topicsResponse.data?.items ?? []);
      setFavorites(favoritesResponse.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载热点失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTopicData();
  }, [fetchTopicData]);

  useEffect(() => {
    if (!selectedTopic) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTopic(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTopic]);

  const visibleTopics = useMemo(() => topics.slice(0, 10), [topics]);
  const trendScores = useMemo(
    () => visibleTopics.map((topic) => Math.max(10, Math.min(topic.hot_value || 0, 100))),
    [visibleTopics],
  );
  const maxTrend = useMemo(() => Math.max(...trendScores, 1), [trendScores]);
  const heatLabels = useMemo(
    () => visibleTopics.map((topic) => Math.max(10, Math.min(topic.hot_value || 0, 100))),
    [visibleTopics],
  );

  const handleTopicClick = useCallback((topic: HotTopicListItem) => {
    setSelectedTopic(topic);
  }, []);

  const handleArticleNavigate = useCallback((topic: HotTopicListItem) => {
    const contentRef = buildContentRef('hot_topic', topic.id);
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`, {
      state: {
        article: {
          contentRef,
          id: String(topic.id),
          title: topic.title,
          source: topic.source,
          url: topic.source_url,
          summary: topic.summary,
          category: topic.categories[0] || '热点',
        },
      },
    });
  }, [navigate]);

  const isCollected = useCallback((topicId: number) => {
    return favorites.some((item) => item.item_type === 'hot_topic' && item.item_id === topicId);
  }, [favorites]);

  const handleCollect = useCallback(async (topic: HotTopicListItem, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (isCollected(topic.id)) {
        const existing = favorites.find((item) => item.item_type === 'hot_topic' && item.item_id === topic.id);
        if (existing) {
          const deleteResponse = await apiService.deleteFavorite(existing.id);
          if (deleteResponse.error) {
            throw new Error(deleteResponse.error);
          }
          setFavorites((prev) => prev.filter((item) => item.id !== existing.id));
        }
        setToastMessage('已取消收藏');
      } else {
        const response = await apiService.createFavorite({
          content_ref: buildContentRef('hot_topic', topic.id),
          item_type: 'hot_topic',
          item_id: topic.id,
          item_title: topic.title,
          item_summary: topic.summary,
          item_source: topic.source,
          item_url: topic.source_url,
        });
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
        } else {
          throw new Error('收藏结果为空');
        }
        setToastMessage('已收藏');
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '收藏操作失败');
    }
  }, [favorites, isCollected]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="热点趋势" label="HOT TOPICS" />

      <PageContent className="hot-topics-page-content">
        {loading ? (
          <div className="domain-card hot-topics-state-card">
            <p className="hot-topics-state-text">加载真实热点中...</p>
          </div>
        ) : error ? (
          <div className="domain-card hot-topics-state-card">
            <p className="hot-topics-state-error">{error}</p>
            <Button onClick={() => void fetchTopicData()} variant="primary">重试</Button>
          </div>
        ) : (
          <>
            <section className="section hot-topics-section hot-topics-section-trend">
              <div className="section-header">
                <span className="section-title">热度趋势图</span>
              </div>

              <div className="hot-topics-trend-panel">
                <div className="hot-topics-trend-list">
                  {visibleTopics.map((topic, index) => {
                    const trendScore = trendScores[index];
                    const width = (trendScore / maxTrend) * 100;
                    const heatValue = heatLabels[index];

                    return (
                      <Button
                        type="button"
                        key={topic.id}
                        variant="unstyled"
                        className="hot-topics-trend-row"
                        onClick={() => handleTopicClick(topic)}
                        aria-label={`查看热点 ${topic.title} 的趋势详情`}
                      >
                        <span className="hot-topics-trend-rank">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="hot-topics-trend-bar-wrap">
                          <progress className="hot-topics-trend-bar-fill" value={Math.max(0, Math.min(width, 100))} max={100} aria-hidden="true" />
                          <span className="hot-topics-trend-title">
                            {topic.title.length > 25 ? `${topic.title.slice(0, 25)}...` : topic.title}
                          </span>
                        </div>
                        <span className="hot-topics-trend-heat">
                          热度 {heatValue}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="section hot-topics-section hot-topics-section-detail">
              <div className="section-header">
                <span className="section-title">热点详情</span>
              </div>

              <div className="hot-topics-detail-list">
                {visibleTopics.map((topic, index) => {
                  const collected = isCollected(topic.id);

                  return (
                    <article
                      key={topic.id}
                      className="domain-card hot-topics-detail-item"
                    >
                      <div className="hot-topics-detail-body">
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() => handleTopicClick(topic)}
                          className="hot-topics-detail-main"
                          aria-label={`查看热点 ${topic.title} 的详细信息`}
                        >
                          <div className="hot-topics-detail-head">
                            <span className="hot-topics-detail-rank">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="hot-topics-detail-heat">
                              热度 {heatLabels[index]}
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
                            {topic.categories?.slice(0, 3).map((cat) => (
                              <Tag key={cat}>{cat}</Tag>
                            ))}
                          </div>
                        </Button>
                        <Button
                          type="button"
                          onClick={(e) => void handleCollect(topic, e)}
                          variant="unstyled"
                          className={`hot-topics-collect-btn ${collected ? 'is-collected' : ''}`}
                          aria-label={collected ? `取消收藏热点 ${topic.title}` : `收藏热点 ${topic.title}`}
                        >
                          <Bookmark size={10} fill={collected ? 'currentColor' : 'none'} />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </PageContent>

      {selectedTopic && (
        <div
        className="hot-topics-modal-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedTopic(null);
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
                热点详情
              </h3>
              <Button
                type="button"
                variant="unstyled"
                onClick={() => setSelectedTopic(null)}
                className="hot-topics-modal-close"
                aria-label="关闭热点详情"
              >
                ×
              </Button>
            </div>

            <h4 className="type-content-title hot-topics-modal-topic-title">
              {selectedTopic.title}
            </h4>

            <p className="hot-topics-modal-summary">
              {selectedTopic.summary ?? '暂无摘要'}
            </p>

            <div className="hot-topics-modal-meta">
              <span className="hot-topics-modal-source">
                来源: {selectedTopic.source}
              </span>
              {selectedTopic.categories?.slice(0, 3).map((cat) => (
                <Tag key={cat}>{cat}</Tag>
              ))}
            </div>

            <div className="hot-topics-modal-note">
              <p>
                当前可先查看热点摘要、来源和分类信息；更完整的解读会随着内容补充继续完善。
              </p>
            </div>

            <div className="hot-topics-modal-actions">
              <Button
                type="button"
                onClick={(e) => {
                  void handleCollect(selectedTopic, e);
                }}
                variant="secondary"
                className="hot-topics-modal-action-btn"
              >
                <Bookmark size={14} fill={isCollected(selectedTopic.id) ? 'currentColor' : 'none'} />
                {isCollected(selectedTopic.id) ? '已收藏' : '收藏'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedTopic(null);
                  handleArticleNavigate(selectedTopic);
                }}
                variant="primary"
                className="hot-topics-modal-action-btn"
              >
                阅读原文
              </Button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div
        className="hot-topics-toast"
        role="status"
        aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </PageLayout>
  );
}
