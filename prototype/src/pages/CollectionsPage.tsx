import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiService } from '../services/api';
import type { FavoriteApiItem } from '../types/page-data';

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

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getFavorites();
      setFavorites(response.data?.items ?? []);
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
                    <button
                      onClick={() => handleOpenArticle(item)}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--paper-warm)',
                        border: '1px solid var(--ink)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-serif-cn)',
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
                        fontFamily: 'var(--font-serif-cn)',
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--ink-muted)' }}>
                  统一引用：{item.content_ref || buildContentRef(item.item_type, item.item_id)}
                </div>
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
