import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UIEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { ArticleFontSize, ArticleRelatedItem, ArticleState, ArticleStateInput } from '../types/article';
import type { FavoriteApiItem } from '../types/page-data';
import { normalizeArticleState } from '../utils/articleDisplay';

export const ARTICLE_READING_SIZE_CLASS: Record<ArticleFontSize, string> = {
  small: 'article-reading-small',
  medium: 'article-reading-medium',
  large: 'article-reading-large',
};

export function useArticlePageLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [resolvedArticle, setResolvedArticle] = useState<ArticleState | null>(null);
  const [fontSize, setFontSize] = useState<ArticleFontSize>('medium');
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  const article = (location.state as { article?: ArticleStateInput } | null)?.article;
  const contentRefFromQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('ref');
  }, [location.search]);

  useEffect(() => {
    if (article) {
      setResolvedArticle(normalizeArticleState(article));
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
        setResolvedArticle(normalizeArticleState({
          contentRef: detail.contentRef,
          id: String(detail.id),
          title: detail.title,
          source: detail.sourceName,
          url: detail.sourceUrl,
          summary: detail.summary ?? null,
          content: detail.content ?? null,
          category: detail.categoryLabels[0],
          contentType: detail.contentType,
          author: detail.author,
          publishedAt: detail.publishedAt,
          tags: detail.tags,
          detailState: detail.detailState,
          detailStateReason: detail.detailStateReason ?? null,
          missingFields: detail.missingFields ?? [],
          relatedItems: detail.relatedItems,
        }));
      } catch (err) {
        setResolvedArticle(null);
        setActionError(err instanceof Error ? err.message : '内容详情加载失败');
      } finally {
        setLoadingDetail(false);
      }
    };

    void fetchContentDetail();
  }, [article, contentRefFromQuery]);

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

  const activeArticle = resolvedArticle;

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

      if (!response.data) {
        throw new Error('收藏结果为空');
      }
      setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
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

  const handleAskAboutArticle = useCallback(() => {
    if (!activeArticle) return;

    navigate('/chat', {
      state: {
        presetInput: `帮我继续分析这篇内容：${activeArticle.title}`,
        sourceContentRef: activeArticle.contentRef,
        sourceTitle: activeArticle.title,
      },
    });
  }, [activeArticle, navigate]);

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
    (item: ArticleRelatedItem) => {
      navigate(`/article?ref=${encodeURIComponent(item.contentRef)}`, {
        state: {
          article: normalizeArticleState({
            contentRef: item.contentRef,
            id: String(item.id),
            title: item.title,
            source: item.sourceName,
            url: item.sourceUrl,
            summary: item.summary ?? null,
            contentType: item.contentType,
          }),
        },
      });
    },
    [navigate],
  );

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    if (scrollHeight <= 0) {
      setReadingProgress(0);
      return;
    }
    setReadingProgress(Math.min(Math.round((scrollTop / scrollHeight) * 100), 100));
  }, []);

  const handleBackToToday = useCallback(() => {
    navigate('/today');
  }, [navigate]);

  return {
    actionError,
    activeArticle,
    aiSummaryPoints,
    fontSize,
    handleBackToToday,
    handleAskAboutArticle,
    handleCollect,
    handleCreateTodoFromOpportunity,
    handleOpenOriginal,
    handleRelatedClick,
    handleScroll,
    handleShare,
    isCollected: Boolean(existingFavorite),
    loadingDetail,
    readingProgress,
    readingSizeClass: ARTICLE_READING_SIZE_CLASS[fontSize],
    setFontSize,
    setShowAiSummary,
    showAiSummary,
    showToast,
    toastMessage,
  };
}
