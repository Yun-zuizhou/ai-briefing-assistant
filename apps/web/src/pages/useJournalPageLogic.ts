import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type {
  ActionsOverviewData,
  FavoriteApiItem,
  GrowthOverviewData,
  HistoryApiItem,
  JournalOverviewData,
  NoteApiItem,
} from '../types/page-data';

const EVENT_TYPE_LABELS: Record<string, string> = {
  read: '阅读',
  view: '查看',
  briefing_read: '简报回看',
  note_created: '记录',
  todo_created: '待办',
  daily_check_in: '打卡',
  interest_added: '新增关注',
  interest_removed: '取消关注',
  chat_reclassified: '对话修正',
  push_time_requested: '提醒调整',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  hot_topic: '热点',
  article: '文章',
  opportunity: '机会',
  learning_resource: '学习',
};

const FOLLOW_STATUS_LABELS: Record<string, string> = {
  new: '新建',
  watching: '跟进中',
  applied: '已投递',
  waiting: '待反馈',
  completed: '已完成',
};

function truncateText(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
}

function getDeadlineLabel(deadline?: string | null) {
  if (!deadline) return '未设截止';
  return deadline.slice(0, 10);
}

function getEventLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

function getItemTypeLabel(itemType: string) {
  return ITEM_TYPE_LABELS[itemType] ?? '内容';
}

export function useJournalPageLogic() {
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState<NoteApiItem[]>([]);
  const [growthData, setGrowthData] = useState<GrowthOverviewData | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryApiItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteApiItem[]>([]);
  const [actionsData, setActionsData] = useState<ActionsOverviewData | null>(null);
  const [journalOverview, setJournalOverview] = useState<JournalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJournalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overviewResponse = await apiService.getJournalOverview();
      if (!overviewResponse.error && overviewResponse.data) {
        setJournalOverview(overviewResponse.data);
        setThoughts(overviewResponse.data.recentNotes);
        setGrowthData(null);
        setHistoryItems([]);
        setFavoriteItems([]);
        setActionsData(null);
        return;
      }

      const [notesResponse, growthResponse, historyResponse, favoritesResponse, actionsResponse] = await Promise.all([
        apiService.getNotes(),
        apiService.getGrowthOverview(),
        apiService.getHistory(),
        apiService.getFavorites(),
        apiService.getActionsOverview(),
      ]);

      setThoughts(notesResponse.data?.items ?? []);
      setGrowthData(growthResponse.data ?? null);
      setHistoryItems(historyResponse.data?.items ?? []);
      setFavoriteItems(favoritesResponse.data?.items ?? []);
      setActionsData(actionsResponse.data ?? null);
      setJournalOverview(null);

      const responseErrors = [
        notesResponse.error,
        growthResponse.error,
        historyResponse.error,
        favoritesResponse.error,
        actionsResponse.error,
      ].filter(Boolean);
      if (responseErrors.length > 0) {
        setError('部分沉淀内容暂时加载失败，页面已先展示可读取的数据。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载沉淀内容失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJournalData();
  }, [fetchJournalData]);

  const activeTodos = useMemo(
    () => [...(actionsData?.todayTodos ?? []), ...(actionsData?.futureTodos ?? [])],
    [actionsData?.futureTodos, actionsData?.todayTodos],
  );

  const completedTodos = useMemo(
    () => actionsData?.completedTodos ?? [],
    [actionsData?.completedTodos],
  );

  const followingItems = useMemo(
    () => actionsData?.followingItems ?? [],
    [actionsData?.followingItems],
  );

  const visibleGrowthTags = useMemo(() => {
    if (journalOverview) {
      return journalOverview.review.keywords.slice(0, 4);
    }
    const growthKeywords = (growthData?.keywords ?? []).map((item) => item.keyword).filter(Boolean);
    const noteTags = Array.from(new Set(thoughts.flatMap((item) => item.tags ?? []).filter(Boolean)));
    return (growthKeywords.length > 0 ? growthKeywords : noteTags).slice(0, 4);
  }, [growthData?.keywords, journalOverview, thoughts]);

  const depositSummary = useMemo(() => {
    if (journalOverview) {
      return journalOverview.summary;
    }
    const expressionCount = thoughts.length;
    const progressCount = activeTodos.length + completedTodos.length + followingItems.length;
    const keptCount = favoriteItems.length + historyItems.length;
    const reviewCount = growthData?.reports.filter((item) => item.available).length ?? 0;
    const latestNote = thoughts[0]?.content;
    const latestHistory = historyItems[0]?.title;

    const summaryText = latestNote
      ? `最近留下的一句话是：“${truncateText(latestNote, 34)}”`
      : latestHistory
        ? `最近的真实痕迹是：${truncateText(latestHistory, 36)}`
        : '当前沉淀还在积累中，可以先从对话里留下一条想法。';

    return {
      summaryText,
      expressionCount,
      progressCount,
      keptCount,
      reviewCount,
    };
  }, [activeTodos.length, completedTodos.length, favoriteItems.length, followingItems.length, growthData?.reports, historyItems, journalOverview, thoughts]);

  const recentProgressItems = useMemo(() => {
    if (journalOverview) {
      return journalOverview.progressItems;
    }
    const todoItems = activeTodos.slice(0, 2).map((todo) => ({
      id: `todo-${todo.todoId}`,
      title: todo.title,
      meta: `${todo.priority === 'urgent' ? '紧急' : '待推进'} · ${getDeadlineLabel(todo.dueLabel)}`,
      detail: todo.sourceType === 'chat' ? '从对话转成了待办' : '已经进入行动列表',
    }));
    const followItems = followingItems.slice(0, 2).map((item) => ({
      id: `follow-${item.followId}`,
      title: item.title,
      meta: FOLLOW_STATUS_LABELS[item.followStatus] ?? item.followStatus,
      detail: item.nextStep || item.progressText || '这条机会仍在跟进中',
    }));
    return [...todoItems, ...followItems].slice(0, 3);
  }, [activeTodos, followingItems, journalOverview]);

  const recentKeepItems = useMemo(() => {
    if (journalOverview) {
      return journalOverview.keptItems;
    }
    const favoriteCards = favoriteItems.slice(0, 2).map((item) => ({
      id: `favorite-${item.id}`,
      sourceLabel: getItemTypeLabel(item.item_type),
      title: item.item_title,
      detail: item.item_summary || item.item_source || '已收藏，后续可继续查看',
      createdAt: item.created_at,
    }));
    const historyCards = historyItems.slice(0, 2).map((item) => ({
      id: `history-${item.id}`,
      sourceLabel: getEventLabel(item.event_type),
      title: item.title,
      detail: item.summary || '这是一条已经写入历史的真实痕迹',
      createdAt: item.created_at,
    }));
    return [...favoriteCards, ...historyCards].slice(0, 4);
  }, [favoriteItems, historyItems, journalOverview]);

  const handleDeleteThought = useCallback(async (id: number) => {
    try {
      const response = await apiService.deleteNote(id);
      if (response.error) {
        throw new Error(response.error);
      }
      setThoughts((prev) => prev.filter((item) => item.id !== id));
      setJournalOverview((prev) => prev
        ? {
            ...prev,
            recentNotes: prev.recentNotes.filter((item) => item.id !== id),
            summary: {
              ...prev.summary,
              expressionCount: Math.max(prev.summary.expressionCount - 1, 0),
            },
          }
        : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录失败');
    }
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = `星期${weekDays[today.getDay()]}`;

  return {
    dateStr,
    depositSummary,
    error,
    fetchJournalData,
    handleDeleteThought,
    handleOpenActions: () => navigate('/actions'),
    handleOpenChat: () => navigate('/chat'),
    handleOpenGrowth: () => navigate('/growth'),
    handleOpenHistoryBrief: () => navigate('/history-brief'),
    handleOpenHistoryLogs: () => navigate('/history-logs'),
    journalOverview,
    loading,
    recentKeepItems,
    recentProgressItems,
    thoughts,
    visibleGrowthTags,
    weekDay,
  };
}
