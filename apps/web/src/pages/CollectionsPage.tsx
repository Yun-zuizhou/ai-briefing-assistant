import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Button } from '../components/ui';
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
      const response = await apiService.deleteFavorite(deleteItemId);
      if (response.error) {
        throw new Error(response.error);
      }
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

      <PageContent className="collections-page-content">
        <div className="newspaper-search collections-search-shell">
          <Search size={18} className="collections-search-icon" />
          <input
            type="text"
            placeholder="搜索收藏内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="collections-state-card">
            正在加载真实收藏...
          </div>
        ) : error ? (
          <div className="collections-state-card is-error">
            <p className="collections-error-text">{error}</p>
            <Button onClick={() => void fetchFavorites()} variant="primary">
              重试
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="collections-empty-state">
            <div className="collections-empty-icon-shell">
              <span className="collections-empty-icon-frame" />
              <span className="collections-empty-icon">📚</span>
            </div>
            <p className="collections-empty-title">
              暂无收藏内容
            </p>
            <p className="collections-empty-text">
              在简报页或热点页点击收藏按钮即可添加
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="collection-card collections-item-card">
              <div className="collection-card-content">
                {(() => {
                  const tracking = getTrackingItem(item);
                  return (
                    <>
                      <div className="collections-item-head">
                        <span className="collections-item-emoji">{typeIcons[item.item_type] || '📌'}</span>
                        <div className="collections-item-main">
                          <span className="collections-item-type-chip">
                            {categoryLabels[item.item_type] || item.item_type}
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
                                  handleStartTracking(item);
                                  return;
                                }
                                setExpandedTrackId((prev) => (prev === item.id ? null : item.id));
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
                            onClick={() => handleOpenArticle(item)}
                            className="collections-action-btn collections-action-source"
                          >
                            原文
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setDeleteItemId(item.id);
                              setShowDeleteModal(true);
                            }}
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
                              onClick={() => navigate('/todo')}
                              variant="secondary"
                              className="collections-track-btn"
                            >
                              去行动页
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleStartTracking(item)}
                              variant="primary"
                              className="collections-track-btn"
                            >
                              继续处理
                            </Button>
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
