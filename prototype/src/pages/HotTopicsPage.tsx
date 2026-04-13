import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Bookmark } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
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

  const visibleTopics = useMemo(() => topics.slice(0, 10), [topics]);
  const trendScores = useMemo(
    () => visibleTopics.map((topic) => Math.max(10, Math.min(topic.hot_value || 0, 100))),
    [visibleTopics],
  );
  const maxTrend = useMemo(() => Math.max(...trendScores, 1), [trendScores]);

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
          await apiService.deleteFavorite(existing.id);
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
        if (response.data) {
          setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
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

      <PageContent>
        {loading ? (
          <div className="domain-card" style={{ margin: '16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', margin: 0 }}>加载真实热点中...</p>
          </div>
        ) : error ? (
          <div className="domain-card" style={{ margin: '16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '12px' }}>{error}</p>
            <button onClick={() => void fetchTopicData()} className="btn btn-primary">重试</button>
          </div>
        ) : (
          <>
            <section className="section" style={{ paddingBottom: '12px' }}>
              <div className="section-header">
                <span className="section-title">热度趋势图</span>
              </div>

              <div style={{
                padding: '12px',
                background: 'var(--paper-warm)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {visibleTopics.map((topic, index) => {
                    const trendScore = trendScores[index];
                    const width = (trendScore / maxTrend) * 100;
                    const isUp = index !== 9;

                    return (
                      <div
                        key={topic.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => handleTopicClick(topic)}
                      >
                        <span style={{
                          width: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--ink-muted)',
                        }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div style={{
                          flex: 1,
                          height: '20px',
                          background: 'var(--paper)',
                          border: '1px solid var(--border)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${width}%`,
                            background: isUp ? 'var(--accent)' : 'var(--ink-muted)',
                            opacity: 0.6,
                          }} />
                          <span style={{
                            position: 'absolute',
                            left: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '90%',
                          }}>
                            {topic.title.length > 25 ? `${topic.title.slice(0, 25)}...` : topic.title}
                          </span>
                        </div>
                        <span style={{
                          width: '36px',
                          fontSize: '10px',
                          color: isUp ? '#16a34a' : '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? '↑' : '↓'}{Math.floor(Math.random() * 50 + 30)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <span className="section-title">热点详情</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleTopics.map((topic, index) => {
                  const collected = isCollected(topic.id);

                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleTopicClick(topic)}
                      className="domain-card"
                      style={{ margin: 0, padding: '12px', cursor: 'pointer' }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => void handleCollect(topic, e)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px 6px',
                              background: collected ? 'var(--gold)' : 'var(--paper-warm)',
                              border: '1px solid var(--ink)',
                              cursor: 'pointer',
                              color: collected ? 'var(--paper)' : 'var(--ink)',
                            }}
                          >
                            <Bookmark size={10} fill={collected ? 'currentColor' : 'none'} />
                          </button>
                          <span style={{
                            fontSize: '11px',
                            color: index === 9 ? '#dc2626' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}>
                            {index === 9 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                            {index === 9 ? '↓ 12%' : `↑ ${Math.floor(Math.random() * 50 + 30)}%`}
                          </span>
                        </div>
                      </div>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                        marginBottom: '8px',
                        fontFamily: 'var(--font-serif-cn)',
                      }}>
                        {topic.title}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--ink-muted)',
                        lineHeight: 1.6,
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {topic.summary ?? '暂无摘要'}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--ink-light)',
                        }}>
                          {topic.source}
                        </span>
                        {topic.categories?.slice(0, 3).map((cat) => (
                          <span key={cat} className="tag">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </PageContent>

      {selectedTopic && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0 16px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            maxHeight: '75vh',
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            padding: '20px',
            position: 'relative',
            overflowY: 'auto',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}>
            <span style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              right: '3px',
              bottom: '3px',
              border: '1px solid var(--ink)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)' }}>
                热点详情
              </h3>
              <button
                onClick={() => setSelectedTopic(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--ink)' }}
              >
                ×
              </button>
            </div>

            <h4 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.5,
              marginBottom: '12px',
              fontFamily: 'var(--font-serif-cn)',
            }}>
              {selectedTopic.title}
            </h4>

            <p style={{
              fontSize: '13px',
              color: 'var(--ink-light)',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}>
              {selectedTopic.summary ?? '暂无摘要'}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--ink-muted)',
              }}>
                来源: {selectedTopic.source}
              </span>
              {selectedTopic.categories?.slice(0, 3).map((cat) => (
                <span key={cat} className="tag">
                  {cat}
                </span>
              ))}
            </div>

            <div style={{
              padding: '12px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
                  当前热点详情已切到真实接口过渡态，深度评论与引导问题后续再补真实聚合层。
                </p>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '8px' }}>
                  当前统一内容引用：{buildContentRef('hot_topic', selectedTopic.id)}
                </p>
              </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={(e) => {
                  void handleCollect(selectedTopic, e);
                }}
                className="btn"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Bookmark size={14} fill={isCollected(selectedTopic.id) ? 'currentColor' : 'none'} />
                {isCollected(selectedTopic.id) ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={() => {
                  setSelectedTopic(null);
                  handleArticleNavigate(selectedTopic);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                阅读原文
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-serif-cn)',
          border: '2px solid var(--paper)',
          zIndex: 1001,
        }}>
          {toastMessage}
        </div>
      )}
    </PageLayout>
  );
}
