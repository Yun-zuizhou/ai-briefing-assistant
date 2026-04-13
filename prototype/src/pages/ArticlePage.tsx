import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink, Share2 } from 'lucide-react';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { apiService } from '../services/api';
import type { FavoriteApiItem } from '../types/page-data';

interface ArticleState {
  contentRef?: string;
  id: string;
  title: string;
  source?: string;
  url?: string;
  summary?: string | null;
  content?: string | null;
  category?: string;
  contentType?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  detailState?: 'formal' | 'transitional';
  relatedItems?: Array<{
    contentRef: string;
    contentType: 'hot_topic' | 'article' | 'opportunity';
    id: string | number;
    title: string;
    summary?: string | null;
    sourceName?: string;
    sourceUrl?: string;
    relationReason?: string | null;
  }>;
}

export default function ArticlePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [resolvedArticle, setResolvedArticle] = useState<ArticleState | null>(null);

  const article = (location.state as { article?: ArticleState } | null)?.article;
  const contentRefFromQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('ref');
  }, [location.search]);

  useEffect(() => {
    if (article) {
      setResolvedArticle(article);
      return;
    }
    if (!contentRefFromQuery) {
      setResolvedArticle(null);
      return;
    }

    const fetchContentDetail = async () => {
      try {
        setLoadingDetail(true);
        setActionError(null);
        const response = await apiService.getContentDetailByRef(contentRefFromQuery);
        const detail = response.data;
        if (!detail) {
          throw new Error(response.error || '内容详情加载失败');
        }
        setResolvedArticle({
          contentRef: detail.contentRef,
          id: String(detail.id),
          title: detail.title,
          source: detail.sourceName,
          url: detail.sourceUrl,
          summary: detail.summary ?? null,
          content: detail.content ?? null,
          category: detail.categoryLabels[0] || detail.contentType,
          contentType: detail.contentType,
          author: detail.author,
          publishedAt: detail.publishedAt,
          tags: detail.tags,
          detailState: detail.detailState,
          relatedItems: detail.relatedItems,
        });
      } catch (err) {
        setResolvedArticle(null);
        setActionError(err instanceof Error ? err.message : '内容详情加载失败');
      } finally {
        setLoadingDetail(false);
      }
    };

    void fetchContentDetail();
  }, [article, contentRefFromQuery]);

  const activeArticle = resolvedArticle;

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const response = await apiService.getFavorites();
        setFavorites(response.data?.items ?? []);
      } catch {
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    void fetchFavorites();
  }, []);

  const normalizedItemType = useMemo(() => {
    if (!activeArticle) return 'article';
    if (activeArticle.contentType === 'hot_topic') return 'hot_topic';
    if (activeArticle.contentType === 'opportunity') return 'opportunity';
    return 'article';
  }, [activeArticle]);

  const parsedArticleId = useMemo(() => {
    if (!activeArticle) return 0;
    const numericId = Number(activeArticle.id);
    return Number.isFinite(numericId) ? numericId : 0;
  }, [activeArticle]);

  const existingFavorite = useMemo(() => {
    if (!activeArticle) return null;
    return favorites.find(
      (item) =>
        item.item_type === normalizedItemType &&
        item.item_id === parsedArticleId &&
        item.item_title === activeArticle.title,
    ) ?? null;
  }, [activeArticle, favorites, normalizedItemType, parsedArticleId]);

  const isCollected = Boolean(existingFavorite);

  const showTemporaryToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, []);

  const handleCollect = useCallback(async () => {
    if (!activeArticle) return;

    try {
      setActionError(null);
      if (existingFavorite) {
        await apiService.deleteFavorite(existingFavorite.id);
        setFavorites((prev) => prev.filter((item) => item.id !== existingFavorite.id));
        showTemporaryToast('已取消收藏');
        return;
      }

      const response = await apiService.createFavorite({
        content_ref: activeArticle.contentRef,
        item_type: normalizedItemType,
        item_id: parsedArticleId,
        item_title: activeArticle.title,
        item_summary: activeArticle.summary ?? '',
        item_source: activeArticle.source ?? '未知来源',
        item_url: activeArticle.url ?? '',
      });

      if (response.data) {
        setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
      }
      showTemporaryToast('已收藏');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '收藏操作失败');
    }
  }, [activeArticle, existingFavorite, normalizedItemType, parsedArticleId, showTemporaryToast]);

  const handleShare = useCallback(() => {
    if (!activeArticle) return;

    const copyCurrentLink = async () => {
      try {
        await navigator.clipboard.writeText(activeArticle.url || window.location.href);
        showTemporaryToast('链接已复制');
      } catch {
        setActionError('当前无法自动复制链接，请手动复制浏览器地址栏。');
      }
    };

    if (navigator.share) {
      void navigator.share({
        title: activeArticle.title,
        text: activeArticle.summary ?? '',
        url: activeArticle.url || window.location.href,
      }).catch(() => {
        void copyCurrentLink();
      });
      return;
    }

    void copyCurrentLink();
  }, [activeArticle, showTemporaryToast]);

  const handleOpenOriginal = useCallback(() => {
    if (activeArticle?.url) {
      const opened = window.open(activeArticle.url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        showTemporaryToast('浏览器拦截了新窗口，请允许弹窗后重试。');
      }
    }
  }, [activeArticle, showTemporaryToast]);

  const handleCreateTodoFromOpportunity = useCallback(() => {
    if (!activeArticle || activeArticle.contentType !== 'opportunity') return;

    const prompt = `帮我把这条机会转成待办：${activeArticle.title}`;
    navigate('/chat', {
      state: {
        presetInput: prompt,
        sourceContentRef: activeArticle.contentRef,
        sourceTitle: activeArticle.title,
      },
    });
  }, [activeArticle, navigate]);

  const handleRelatedClick = useCallback(
    (item: NonNullable<ArticleState['relatedItems']>[number]) => {
      navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
        state: {
          article: {
            contentRef: item.contentRef,
            id: String(item.id),
            title: item.title,
            source: item.sourceName,
            url: item.sourceUrl,
            summary: item.summary ?? null,
            category: item.contentType,
            contentType: item.contentType,
          },
        },
      });
    },
    [navigate],
  );

  if (!activeArticle) {
    return (
      <PageLayout variant="secondary">
        <SecondaryHeader title="文章详情" label="ARTICLE" />
        <PageContent style={{ padding: '16px' }}>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
              {loadingDetail ? '正在加载详情…' : '文章不存在或暂时无法打开。'}
            </p>
            <button onClick={() => navigate('/today')} className="btn btn-primary" style={{ marginTop: '16px' }}>
              返回今日页
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="文章详情" label="ARTICLE" subtitle="阅读、收藏与分享" />

      <PageContent style={{ padding: '16px' }}>
        {actionError ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', margin: 0 }}>{actionError}</p>
          </div>
        ) : null}

        <div style={{ padding: '16px', background: 'var(--paper-warm)', border: '2px solid var(--ink)', marginBottom: '16px', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />

          {activeArticle.category ? (
            <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>
              {activeArticle.category}
            </span>
          ) : null}

          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '12px', fontFamily: 'var(--font-serif-cn)' }}>
            {activeArticle.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--ink-muted)' }}>
            <span>{activeArticle.source || '未知来源'}</span>
            <span>{loadingDetail ? '加载详情中' : loadingFavorites ? '同步收藏状态中' : '收藏状态已同步'}</span>
          </div>
          {(activeArticle.author || activeArticle.publishedAt) ? (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--ink-muted)' }}>
              {activeArticle.author ? `作者：${activeArticle.author}` : '作者信息暂缺'}
              {activeArticle.publishedAt ? ` · 发布时间：${new Date(activeArticle.publishedAt).toLocaleString('zh-CN')}` : ''}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => void handleCollect()} className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Bookmark size={16} fill={isCollected ? 'currentColor' : 'none'} />
            {isCollected ? '已收藏' : '收藏'}
          </button>
          <button onClick={handleShare} className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Share2 size={16} />
            分享
          </button>
          {activeArticle.url ? (
            <button onClick={handleOpenOriginal} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ExternalLink size={16} />
              原文
            </button>
          ) : null}
        </div>

        {activeArticle.contentType === 'opportunity' ? (
          <div style={{ padding: '16px', background: 'var(--paper-warm)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '10px' }}>行动入口</h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>
              当前这条内容属于机会型内容，已支持从详情页继续进入对话页，并按这条机会生成待办意图。
            </p>
            <button
              onClick={handleCreateTodoFromOpportunity}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              转成待办
            </button>
          </div>
        ) : null}

        {activeArticle.summary ? (
          <div style={{ padding: '16px', background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>📋 内容摘要</h3>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', lineHeight: 1.8, margin: 0 }}>{activeArticle.summary}</p>
          </div>
        ) : null}

        {activeArticle.content ? (
          <div style={{ padding: '16px', background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>正文内容</h3>
            <div style={{ fontSize: '14px', color: 'var(--ink-light)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
              {activeArticle.content}
            </div>
          </div>
        ) : null}

        {activeArticle.tags && activeArticle.tags.length > 0 ? (
          <div style={{ padding: '16px', background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>标签</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activeArticle.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid var(--border)',
                    background: 'var(--paper-warm)',
                    fontSize: '12px',
                    color: 'var(--ink-muted)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {activeArticle.relatedItems && activeArticle.relatedItems.length > 0 ? (
          <div style={{ padding: '16px', background: 'var(--paper-warm)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>相关推荐</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {activeArticle.relatedItems.map((item) => (
                <button
                  key={item.contentRef}
                  onClick={() => handleRelatedClick(item)}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    background: 'var(--paper)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
                      {item.sourceName || item.contentType}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.contentRef}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '6px' }}>
                    {item.title}
                  </div>
                  {item.summary ? (
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>
                      {item.summary}
                    </p>
                  ) : null}
                  {item.relationReason ? (
                    <p style={{ fontSize: '11px', color: 'var(--ink-muted)', lineHeight: 1.5, margin: 0 }}>
                      关联原因：{item.relationReason}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ padding: '16px', background: 'var(--paper-warm)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '8px' }}>
            你可以在这里完成阅读、收藏、分享和查看原文。
          </p>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
            遇到机会型内容时，也可以直接转成待办继续推进。
          </p>
        </div>
      </PageContent>

      {showToast ? (
        <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-serif-cn)', border: '2px solid var(--paper)', zIndex: 1000 }}>
          {toastMessage}
        </div>
      ) : null}
    </PageLayout>
  );
}
