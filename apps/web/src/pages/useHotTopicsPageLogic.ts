import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { FavoriteApiItem, HotTopicListItem } from '../types/page-data';
import { normalizeArticleState } from '../utils/articleDisplay';

const buildContentRef = (contentType: string, id: string | number) => `${contentType}:${id}`;

export interface HotTopicViewItem extends HotTopicListItem {
  collected: boolean;
  displayTitle: string;
  heatValue: number;
  rankLabel: string;
  trendWidth: number;
}

export function useHotTopicsPageLogic() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<HotTopicListItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteApiItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isCollected = useCallback((topicId: number) => {
    return favorites.some((item) => item.item_type === 'hot_topic' && item.item_id === topicId);
  }, [favorites]);

  const visibleTopics = useMemo(() => {
    const baseTopics = topics.slice(0, 10);
    const heatValues = baseTopics.map((topic) => Math.max(10, Math.min(topic.hot_value || 0, 100)));
    const maxTrend = Math.max(...heatValues, 1);

    return baseTopics.map((topic, index): HotTopicViewItem => {
      const heatValue = heatValues[index];
      return {
        ...topic,
        collected: isCollected(topic.id),
        displayTitle: topic.title.length > 25 ? `${topic.title.slice(0, 25)}...` : topic.title,
        heatValue,
        rankLabel: String(index + 1).padStart(2, '0'),
        trendWidth: (heatValue / maxTrend) * 100,
      };
    });
  }, [isCollected, topics]);

  const selectedTopic = useMemo(
    () => visibleTopics.find((topic) => topic.id === selectedTopicId) ?? null,
    [selectedTopicId, visibleTopics],
  );

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
    if (!selectedTopicId) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTopicId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTopicId]);

  const handleTopicClick = useCallback((topic: HotTopicViewItem) => {
    setSelectedTopicId(topic.id);
  }, []);

  const handleCloseTopic = useCallback(() => {
    setSelectedTopicId(null);
  }, []);

  const handleArticleNavigate = useCallback((topic: HotTopicViewItem) => {
    const contentRef = buildContentRef('hot_topic', topic.id);
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`, {
      state: {
        article: normalizeArticleState({
          contentRef,
          id: String(topic.id),
          title: topic.title,
          source: topic.source,
          url: topic.source_url,
          summary: topic.summary,
          category: topic.categories[0],
          contentType: 'hot_topic',
        }),
      },
    });
  }, [navigate]);

  const handleReadSelectedTopic = useCallback(() => {
    if (!selectedTopic) return;
    setSelectedTopicId(null);
    handleArticleNavigate(selectedTopic);
  }, [handleArticleNavigate, selectedTopic]);

  const handleCollect = useCallback(async (topic: HotTopicViewItem) => {
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
        if (!response.data) {
          throw new Error('收藏结果为空');
        }
        setFavorites((prev) => [response.data as FavoriteApiItem, ...prev]);
        setToastMessage('已收藏');
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '收藏操作失败');
    }
  }, [favorites, isCollected]);

  return {
    error,
    handleCloseTopic,
    handleCollect,
    handleReadSelectedTopic,
    handleRetry: fetchTopicData,
    handleTopicClick,
    loading,
    selectedTopic,
    showToast,
    toastMessage,
    visibleTopics,
  };
}
