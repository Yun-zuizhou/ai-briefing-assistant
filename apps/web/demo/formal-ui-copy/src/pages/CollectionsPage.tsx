import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiService } from '../services/api';
import type { FavoriteApiItem, FollowingItem } from '../types/page-data';

const buildContentRef = (contentType: string, id: string | number) => `${contentType}:${id}`;

const typeIcons: Record<string, string> = {
  hot_topic: '📰',
  opportunity: '💼',
  learning_resource: '📚',
  article: '📄',
};

const categoryLabels: Record<string, string> = {
  hot_topic: '热点',
  opportunity: '机会',
  learning_resource: '学习',
  article: '文章',
};

type TrackingStep = {
  label: string;
  done: boolean;
  current?: boolean;
};

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [followingItems, setFollowingItems] = useState<FollowingItem[]>([]);
  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [favoritesResponse, actionsResponse] = await Promise.all([
        apiService.getFavorites(),
        apiService.getActionsOverview(),
      ]);
      if (favoritesResponse.error) {
        throw new Error(favoritesResponse.error);
      }
      if (actionsResponse.error) {
        throw new Error(actionsResponse.error);
      }
      setFavorites(favoritesResponse.data?.items ?? []);
      setFollowingItems(actionsResponse.data?.followingItems ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载收藏失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const handleOpenArticle = useCallback((item: FavoriteApiItem) => {
    const contentRef = item.content_ref || buildContentRef(item.item_type, item.item_id);
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`, {
      state: {
        article: {
          contentRef,
          id: String(item.item_id),
          title: item.item_title,
          source: item.item_source,
          url: item.item_url,
          summary: item.item_summary,
          category: categoryLabels[item.item_type] || item.item_type,
        },
      },
    });
  }, [navigate]);

  const filteredItems = useMemo(() => {
    return favorites.filter((item) => {
      const title = item.item_title?.toLowerCase() ?? '';
      const summary = item.item_summary?.toLowerCase() ?? '';
      const query = searchQuery.toLowerCase();
      return title.includes(query) || summary.includes(query);
    });
  }, [favorites, searchQuery]);

  const buildTrackingSteps = useCallback((follow: FollowingItem | null): TrackingStep[] => {
    const labels = [
      '加入收藏',
      '开始跟进',
      '等待结果',
      '沉淀回顾',
    ];

    if (!follow) {
      return labels.map((label, index) => ({
        label,
        done: index === 0,
      }));
    }

    const statusOrder: Record<FollowingItem['followStatus'], number> = {
      new: 1,
      watching: 2,
      applied: 2,
      waiting: 3,
      completed: 4,
    };

    const level = statusOrder[follow.followStatus] ?? 1;
    return labels.map((label, index) => ({
      label,
      done: index < level,
      current: index === level - 1,
    }));
  }, []);

  const getTrackingItem = useCallback((item: FavoriteApiItem) => {
    if (item.item_type !== 'opportunity') {
      return null;
    }

    const follow = followingItems.find((candidate) => candidate.title === item.item_title) ?? null;
    return {
      follow,
      steps: buildTrackingSteps(follow),
    };
  }, [buildTrackingSteps, followingItems]);

  const handleDelete = useCallback(async () => {
    if (deleteItemId == null) {
      return;
    }

    try {
      await apiService.deleteFavorite(deleteItemId);
      setFavorites((prev) => prev.filter((item) => item.id !== deleteItemId));
      setShowDeleteModal(false);
      setDeleteItemId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除收藏失败');
    }
  }, [deleteItemId]);

  const handleStartTracking = useCallback((item: FavoriteApiItem) => {
    const contentRef = item.content_ref || buildContentRef(item.item_type, item.item_id);
    navigate('/chat', {
      state: {
        presetInput: `帮我把这条机会转成待办：${item.item_title}`,
        sourceContentRef: contentRef,
        sourceTitle: item.item_title,
      },
    });
  }, [navigate]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="我的收藏" label="MY COLLECTIONS" />

      <PageContent style={{ padding: '16px' }}>
        <div className="newspaper-search" style={{ marginBottom: '16px' }}>
          <Search size={18} style={{ color: 'var(--ink-muted)' }} />
          <input
            type="text"
            placeholder="搜索收藏内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
            正在加载真实收藏...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--accent)' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>{error}</p>
            <button onClick={() => void fetchFavorites()} className="btn btn-primary">
              重试
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--ink-muted)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '4px',
                bottom: '4px',
                border: '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: '32px' }}>📚</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
              暂无收藏内容
            </p>
            <p style={{ fontSize: '13px' }}>
              在简报页或热点页点击收藏按钮即可添加
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="collection-card" style={{ marginBottom: '12px' }}>
              <div className="collection-card-content">
                {(() => {
                  const tracking = getTrackingItem(item);
                  return (
                    <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '20px' }}>{typeIcons[item.item_type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      padding: '2px 6px',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      fontSize: '9px',
                      fontWeight: 600,
                    }}>
                      {categoryLabels[item.item_type] || item.item_type}
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                      {item.item_title}
                    </h4>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.item_summary || '暂无摘要'}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border)',
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                    {item.item_source || '未知来源'} · {item.created_at.split('T')[0]}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.item_type === 'opportunity' ? (
                      <button
                        onClick={() => {
                          if (!tracking?.follow) {
                            handleStartTracking(item);
                            return;
                          }
                          setExpandedTrackId((prev) => (prev === item.id ? null : item.id));
                        }}
                        style={{
                          padding: '3px 8px',
                          background: 'var(--ink)',
                          border: '1px solid var(--ink)',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--paper)',
                          fontFamily: 'var(--font-sans-cn)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {tracking?.follow ? (
                          <>
                            {expandedTrackId === item.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            查看跟进
                          </>
                        ) : (
                          '开始跟进'
                        )}
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleOpenArticle(item)}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--paper-warm)',
                        border: '1px solid var(--ink)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans-cn)',
                        color: 'var(--ink)',
                      }}
                    >
                      原文
                    </button>
                    <button
                      onClick={() => {
                        setDeleteItemId(item.id);
                        setShowDeleteModal(true);
                      }}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--paper-warm)',
                        border: '1px solid var(--accent)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-sans-cn)',
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                {item.item_type === 'opportunity' && expandedTrackId === item.id && tracking?.follow ? (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--paper-warm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                        跟进状态：{tracking.follow.followStatus}
                      </span>
                      {tracking.follow.deadline ? (
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                          截止 {tracking.follow.deadline}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: 'grid', gap: '6px', marginBottom: '10px' }}>
                      {tracking.steps.map((step) => (
                        <div
                          key={`${item.id}-${step.label}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            border: `1px solid ${step.current ? 'var(--accent)' : 'var(--border)'}`,
                            background: step.done ? 'var(--paper)' : 'transparent',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: step.done ? 'var(--ink)' : 'var(--paper)',
                              color: 'var(--paper)',
                              fontSize: '10px',
                            }}
                          >
                            {step.done ? '✓' : ''}
                          </div>
                          <span style={{ fontSize: '12px', color: step.current ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: step.current ? 700 : 500 }}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '8px' }}>
                      {tracking.follow.nextStep || tracking.follow.progressText || '当前还没有下一步说明。'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate('/todo')}
                        className="btn"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        去行动页
                      </button>
                      <button
                        onClick={() => handleStartTracking(item)}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        继续处理
                      </button>
                    </div>
                  </div>
                ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </PageContent>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="确定要删除这条收藏吗？"
        confirmLabel="删除"
        cancelLabel="取消"
        confirmStyle="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteItemId(null);
        }}
      />
    </PageLayout>
  );
}
