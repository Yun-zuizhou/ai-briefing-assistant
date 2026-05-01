import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { FavoriteApiItem, FollowingItem } from '../types/page-data';
import { normalizeArticleState } from '../utils/articleDisplay';

const buildContentRef = (contentType: string, id: string | number) => `${contentType}:${id}`;

export type TrackingStep = {
  label: string;
  done: boolean;
  current?: boolean;
};

export interface CollectionTrackingInfo {
  follow: FollowingItem | null;
  steps: TrackingStep[];
}

export function useCollectionsPageLogic() {
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
        article: normalizeArticleState({
          contentRef,
          id: String(item.item_id),
          title: item.item_title,
          source: item.item_source ?? undefined,
          url: item.item_url ?? undefined,
          summary: item.item_summary,
          contentType: item.item_type,
        }),
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
    const labels = ['加入收藏', '开始跟进', '等待结果', '沉淀回顾'];

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

  const getTrackingItem = useCallback((item: FavoriteApiItem): CollectionTrackingInfo | null => {
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

  return {
    expandedTrackId,
    fetchFavorites,
    filteredItems,
    getTrackingItem,
    handleDelete,
    handleOpenArticle,
    handleStartTracking,
    handleToggleTrack: (itemId: number) => setExpandedTrackId((prev) => (prev === itemId ? null : itemId)),
    handleOpenActions: () => navigate('/todo'),
    loading,
    requestDelete: (id: number) => {
      setDeleteItemId(id);
      setShowDeleteModal(true);
    },
    searchQuery,
    setSearchQuery,
    showDeleteModal,
    closeDeleteModal: () => {
      setShowDeleteModal(false);
      setDeleteItemId(null);
    },
    error,
  };
}
