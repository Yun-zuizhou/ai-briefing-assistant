import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, ChevronDown, ChevronUp, Clock, ExternalLink, Share2, User } from 'lucide-react';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { Button } from '../components/ui';
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
  detailState?: 'formal' | 'partial';
  detailStateReason?: string | null;
  missingFields?: string[];
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
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [resolvedArticle, setResolvedArticle] = useState<ArticleState | null>(null);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

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
          detailStateReason: detail.detailStateReason ?? null,
          missingFields: detail.missingFields ?? [],
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
        const response = await apiService.getFavorites();
        if (response.error) {
          throw new Error(response.error);
        }
        setFavorites(response.data?.items ?? []);
      } catch {
        setFavorites([]);
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

  const readingSizeClassMap = useMemo(
    () => ({
      small: 'article-reading-small',
      medium: 'article-reading-medium',
      large: 'article-reading-large',
    }),
    [],
  );

  const aiSummaryPoints = useMemo(() => {
    if (!activeArticle) return [];

    const points: string[] = [];
    const summarySegments = String(activeArticle.summary || '')
      .split(/[。！？；\n]/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    for (const segment of summarySegments.slice(0, 2)) {
      points.push(segment);
    }

    if (activeArticle.detailState === 'partial' && activeArticle.detailStateReason) {
      points.push(`当前可先查看已确认的信息：${activeArticle.detailStateReason}`);
    }

    if (activeArticle.tags && activeArticle.tags.length > 0) {
      points.push(`关联标签：${activeArticle.tags.slice(0, 4).join('、')}`);
    }

    if (activeArticle.relatedItems && activeArticle.relatedItems.length > 0) {
      points.push(`可继续延伸查看 ${activeArticle.relatedItems.length} 条相关推荐。`);
    }

    return Array.from(new Set(points)).slice(0, 4);
  }, [activeArticle]);

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
        const deleteResponse = await apiService.deleteFavorite(existingFavorite.id);
        if (deleteResponse.error) {
          throw new Error(deleteResponse.error);
        }
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
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
      } else {
        throw new Error('收藏结果为空');
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

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    if (scrollHeight <= 0) {
      setReadingProgress(0);
      return;
    }
    setReadingProgress(Math.min(Math.round((scrollTop / scrollHeight) * 100), 100));
  }, []);

  if (!activeArticle) {
    return (
      <PageLayout variant="secondary">
        <SecondaryHeader title="文章详情" label="ARTICLE" />
        <PageContent className="article-page-content article-page-content-empty">
          <div className="article-empty-state">
            <p className="article-empty-text">
              {loadingDetail ? '正在加载详情…' : '文章不存在或暂时无法打开。'}
            </p>
            <Button onClick={() => navigate('/today')} variant="primary" className="article-empty-btn">
              返回今日页
            </Button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="文章详情" label="ARTICLE" subtitle="阅读、收藏与分享" />

      <div className="article-progress-track">
        <progress className="article-progress-fill" value={readingProgress} max={100} aria-label="阅读进度" />
      </div>

      <PageContent className="article-page-content article-page-content-main" onScroll={handleScroll}>
        {actionError ? (
          <div className="domain-card article-error-card">
            <p className="article-error-text">{actionError}</p>
          </div>
        ) : null}

        <div className="article-hero-card">
          <span className="article-hero-frame" />

          {activeArticle.category ? (
            <span className="article-category-chip">
              {activeArticle.category}
            </span>
          ) : null}

          <h1 className="type-content-title article-hero-title">
            {activeArticle.title}
          </h1>

          <div className="article-hero-meta">
            <span className="article-hero-meta-item">
              <User size={12} />
              {activeArticle.source || '未知来源'}
            </span>
            {loadingDetail ? <span>加载中...</span> : null}
            <span className="article-hero-meta-item">
              <Clock size={12} />
              阅读进度 {readingProgress}%
            </span>
          </div>
          {(activeArticle.author || activeArticle.publishedAt) ? (
            <div className="article-hero-author">
              {activeArticle.author ? `作者：${activeArticle.author}` : '作者信息暂缺'}
              {activeArticle.publishedAt ? ` · 发布时间：${new Date(activeArticle.publishedAt).toLocaleString('zh-CN')}` : ''}
            </div>
          ) : null}
        </div>

        {activeArticle.detailState === 'partial' ? (
          <div className="article-partial-note">
            <p className="article-partial-title">
              当前内容仍在持续补充
            </p>
            <p className="article-partial-text">
              {activeArticle.detailStateReason || '正文、来源或相关推荐还在陆续补齐中，这里先展示已经确认可用的内容。'}
            </p>
          </div>
        ) : null}

        <div className="article-actions-row">
          <Button onClick={() => void handleCollect()} variant="secondary" className="article-action-btn">
            <Bookmark size={16} fill={isCollected ? 'currentColor' : 'none'} />
            {isCollected ? '已收藏' : '收藏'}
          </Button>
          <Button onClick={handleShare} variant="secondary" className="article-action-btn">
            <Share2 size={16} />
            分享
          </Button>
          {activeArticle.url ? (
            <Button onClick={handleOpenOriginal} variant="primary" className="article-action-btn">
              <ExternalLink size={16} />
              原文
            </Button>
          ) : null}
        </div>

        <div className="article-font-controls">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <Button
              key={size}
              onClick={() => setFontSize(size)}
              variant="secondary"
              className={`article-font-btn ${fontSize === size ? 'is-active' : ''}`}
            >
              {size === 'small' ? '小字' : size === 'medium' ? '中字' : '大字'}
            </Button>
          ))}
        </div>

        {aiSummaryPoints.length > 0 ? (
          <div className="article-ai-card">
            <span className="article-ai-frame" />
            <Button
              type="button"
              variant="unstyled"
              onClick={() => setShowAiSummary((prev) => !prev)}
              className="article-ai-toggle"
            >
              <span className="article-ai-label">AI 摘要</span>
              {showAiSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Button>
            {showAiSummary ? (
              <div className="article-ai-list">
                {aiSummaryPoints.map((point) => (
                  <p key={point} className="article-ai-point">
                    {point}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeArticle.contentType === 'opportunity' ? (
          <div className="article-opportunity-card">
            <h3 className="article-block-title">行动入口</h3>
            <p className="article-block-desc">
              机会型内容，已支持从详情页继续进入对话页。
            </p>
            <Button
              onClick={handleCreateTodoFromOpportunity}
              variant="primary"
              className="article-opportunity-btn"
            >
              转成待办
            </Button>
          </div>
        ) : null}

        {activeArticle.summary ? (
          <div className="article-section-card">
            <h3 className="article-block-title">内容摘要</h3>
            <p className={`article-block-text ${readingSizeClassMap[fontSize]}`}>{activeArticle.summary}</p>
          </div>
        ) : null}

        {activeArticle.content ? (
          <div className="article-section-card">
            <h3 className="article-block-title">正文内容</h3>
            <div className={`article-content-text ${readingSizeClassMap[fontSize]}`}>
              {activeArticle.content}
            </div>
          </div>
        ) : activeArticle.detailState === 'partial' ? (
          <div className="article-section-card">
            <h3 className="article-block-title">正文内容</h3>
            <p className="article-block-desc">
              当前还没有可展示的正文内容，你可以先查看摘要、来源和相关推荐，稍后再回来继续阅读。
            </p>
          </div>
        ) : null}

        {activeArticle.tags && activeArticle.tags.length > 0 ? (
          <div className="article-section-card">
            <h3 className="article-block-title">标签</h3>
            <div className="article-tag-list">
              {activeArticle.tags.map((tag) => (
                <span key={tag} className="article-tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {activeArticle.relatedItems && activeArticle.relatedItems.length > 0 ? (
          <div className="article-related-card">
            <h3 className="article-block-title">相关推荐</h3>
            <div className="article-related-list">
              {activeArticle.relatedItems.map((item) => (
                <Button
                  key={item.contentRef}
                  type="button"
                  variant="unstyled"
                  onClick={() => handleRelatedClick(item)}
                  className="article-related-item"
                >
                  <div className="article-related-head">
                    <span className="article-related-source">
                      {item.sourceName || item.contentType}
                    </span>
                    <span className="article-related-label">相关推荐</span>
                  </div>
                  <div className="article-related-title">
                    {item.title}
                  </div>
                  {item.summary ? (
                    <p className="article-related-summary">
                      {item.summary}
                    </p>
                  ) : null}
                  {item.relationReason ? (
                    <p className="article-related-reason">
                      关联原因：{item.relationReason}
                    </p>
                  ) : null}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="article-footer-note">
          <p className="article-footer-note-title">
            你可以在这里完成阅读、收藏、分享和查看原文。
          </p>
          <p className="article-footer-note-desc">
            遇到机会型内容时，也可以直接转成待办继续推进。
          </p>
        </div>
      </PageContent>

      {showToast ? (
        <div className="article-toast">
          {toastMessage}
        </div>
      ) : null}
    </PageLayout>
  );
}
