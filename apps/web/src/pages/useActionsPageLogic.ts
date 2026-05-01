import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';
import type { ActionsOverviewData, FollowingItem, SavedItem, SuggestedActionItem } from '../types/page-data';

export type FilterType = 'today' | 'future' | 'completed';
export type ActionTodoViewItem = ActionsOverviewData['todayTodos'][number];

type TodoGroups = Record<FilterType, ActionTodoViewItem[]>;

const emptyTodoGroups: TodoGroups = {
  today: [],
  future: [],
  completed: [],
};

export function useActionsPageLogic() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('today');
  const [todoGroups, setTodoGroups] = useState<TodoGroups>(emptyTodoGroups);
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [followingItems, setFollowingItems] = useState<FollowingItem[]>([]);
  const [reminderSummary, setReminderSummary] = useState<ActionsOverviewData['reminderSummary'] | null>(null);
  const [topPriority, setTopPriority] = useState<SuggestedActionItem | null>(null);
  const [suggestedNextActions, setSuggestedNextActions] = useState<SuggestedActionItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const actionsResponse = await apiService.getActionsOverview();
      if (actionsResponse.error) {
        throw new Error(actionsResponse.error);
      }
      setTodoGroups({
        today: actionsResponse.data?.todayTodos ?? [],
        future: actionsResponse.data?.futureTodos ?? [],
        completed: actionsResponse.data?.completedTodos ?? [],
      });
      setFavorites(actionsResponse.data?.savedForLater ?? []);
      setFollowingItems(actionsResponse.data?.followingItems ?? []);
      setReminderSummary(actionsResponse.data?.reminderSummary ?? null);
      setTopPriority(actionsResponse.data?.topPriority ?? null);
      setSuggestedNextActions(actionsResponse.data?.suggestedNextActions ?? []);
      setStreakDays(actionsResponse.data?.streakDays ?? 0);
      setCheckedInToday(actionsResponse.data?.checkedInToday ?? false);
    } catch {
      setError('行动内容暂时加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActionData();
  }, [fetchActionData]);

  const toggleTodo = useCallback(async (todo: ActionTodoViewItem) => {
    try {
      const response = await apiService.updateTodo(todo.todoId, { status: todo.done ? 'pending' : 'completed' });
      if (response.error) {
        throw new Error(response.error);
      }
      void fetchActionData();
    } catch {
      setError('更新待办失败，请稍后重试。');
      void fetchActionData();
    }
  }, [fetchActionData]);

  const deleteTodo = useCallback(async (id: number) => {
    try {
      const response = await apiService.deleteTodo(id);
      if (response.error) {
        throw new Error(response.error);
      }
      void fetchActionData();
    } catch {
      setError('删除待办失败，请稍后重试。');
      void fetchActionData();
    }
  }, [fetchActionData]);

  const handleCheckIn = useCallback(() => {
    if (checkedInToday) {
      return;
    }
    void (async () => {
      try {
        setError(null);
        const response = await apiService.checkInToday();
        if (response.error) {
          throw new Error(response.error);
        }
        setCheckedInToday(response.data?.checkedInToday ?? true);
        setStreakDays(response.data?.streakDays ?? streakDays);
        void fetchActionData();
      } catch {
        setError('今日打卡失败，请稍后重试。');
      }
    })();
  }, [checkedInToday, fetchActionData, streakDays]);

  const todoProgress = useMemo(() => ({
    done: todoGroups.completed.length,
    total: todoGroups.today.length + todoGroups.future.length + todoGroups.completed.length,
  }), [todoGroups]);

  const filteredTodos = todoGroups[filter];
  const fallbackPrimaryTodo = useMemo(() => {
    const rank: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    const candidates = [...todoGroups.today, ...todoGroups.future];
    return candidates.sort((a, b) => (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0))[0] ?? null;
  }, [todoGroups.future, todoGroups.today]);

  const topPriorityTodo = useMemo(() => {
    if (topPriority?.source !== 'todo') return null;
    return [...todoGroups.today, ...todoGroups.future].find((todo) => String(todo.todoId) === String(topPriority.id)) ?? null;
  }, [todoGroups.future, todoGroups.today, topPriority]);

  const secondarySuggestions = useMemo(() => (
    suggestedNextActions.filter((item) => String(item.id) !== String(topPriority?.id) || item.source !== topPriority?.source).slice(0, 2)
  ), [suggestedNextActions, topPriority]);

  const filterCounts = useMemo(() => ({
    today: todoGroups.today.length,
    future: todoGroups.future.length,
    completed: todoGroups.completed.length,
  }), [todoGroups]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = `星期${weekDays[today.getDay()]}`;

  const handlePrimaryAction = useCallback(() => {
    if (topPriority) {
      if (topPriority.source === 'todo' && topPriorityTodo) {
        void toggleTodo(topPriorityTodo);
        return;
      }
      navigate(topPriority.deepLink ?? '/todo');
      return;
    }
    if (fallbackPrimaryTodo) {
      void toggleTodo(fallbackPrimaryTodo);
      return;
    }
    navigate('/chat');
  }, [fallbackPrimaryTodo, navigate, toggleTodo, topPriority, topPriorityTodo]);

  return {
    checkedInToday,
    dateStr,
    deleteTodo,
    error,
    fallbackPrimaryTodo,
    favorites,
    filter,
    filterCounts,
    filteredTodos,
    followingItems,
    handleCheckIn,
    handlePrimaryAction,
    loading,
    navigate,
    reminderSummary,
    reloadActions: fetchActionData,
    secondarySuggestions,
    setFilter,
    streakDays,
    todoProgress,
    toggleTodo,
    topPriority,
    weekDay,
  };
}
