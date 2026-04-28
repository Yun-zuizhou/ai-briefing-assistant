import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, Masthead } from '../components/layout';
import { Button } from '../components/ui';
import ContentListCard from '../components/business/ContentListCard';
import { apiService } from '../services/api';
import type { ActionsOverviewData, FollowingItem, SavedItem, SuggestedActionItem } from '../types/page-data';

type FilterType = 'today' | 'future' | 'completed';
type ActionTodoViewItem = ActionsOverviewData['todayTodos'][number];

const FOLLOW_STATUS_LABELS: Record<string, string> = {
  new: '新建',
  watching: '跟进中',
  applied: '已投递',
  waiting: '待反馈',
  completed: '已完成',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  chat: '来自对话',
  content: '来自内容',
  manual: '手动添加',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ActionsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('today');
  const [todoGroups, setTodoGroups] = useState<Record<FilterType, ActionTodoViewItem[]>>({
    today: [],
    future: [],
    completed: [],
  });
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

  const getDeadlineStatus = (deadline?: string | null) => {
    if (!deadline) {
      return { tone: 'none', label: '未设截止' as string };
    }
    const normalized = deadline.slice(0, 10);
    const todayStr = getTodayDateString();
    if (normalized < todayStr) return { tone: 'overdue', label: '已过期' as string };
    if (normalized === todayStr) return { tone: 'today', label: '今日截止' as string };
    return { tone: 'normal', label: normalized };
  };

  const handlePrimaryAction = () => {
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
  };

  if (loading) {
    return (
      <PageLayout variant="main">
        <Masthead title="行动" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ ACTION ✦', '✦ CENTER ✦']} meta="待办 · 收藏 · 跟进" />
        <PageContent className="actions-page-content">
          <div className="actions-loading-state">
            <p>加载中...</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="main">
      <Masthead title="行动" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ ACTION ✦', '✦ CENTER ✦']} meta="待办 · 收藏 · 跟进" />
      <PageContent className="actions-page-content">
        {error ? (
          <div className="domain-card actions-error-card">
            <p className="actions-error-text">{error}</p>
            <Button
              type="button"
              onClick={() => void fetchActionData()}
              variant="primary"
            >
              重新加载
            </Button>
          </div>
        ) : null}
        <div className="domain-card actions-primary-card">
          <div className="actions-primary-copy">
            <p className="actions-primary-kicker">今天先推进这 1 件</p>
            {topPriority ? (
              <>
                <h2 className="actions-primary-title">{topPriority.title}</h2>
                <div className="actions-primary-meta">
                  {topPriority.priorityLabel ? <span>{topPriority.priorityLabel}</span> : null}
                  {topPriority.dueLabel ? <span>截止 {getDeadlineStatus(topPriority.dueLabel).label}</span> : null}
                  <span>{topPriority.reason}</span>
                </div>
              </>
            ) : fallbackPrimaryTodo ? (
              <>
                <h2 className="actions-primary-title">{fallbackPrimaryTodo.title}</h2>
                <div className="actions-primary-meta">
                  <span>{PRIORITY_LABELS[fallbackPrimaryTodo.priority] ?? fallbackPrimaryTodo.priority}优先级</span>
                  {fallbackPrimaryTodo.dueLabel ? <span>截止 {getDeadlineStatus(fallbackPrimaryTodo.dueLabel).label}</span> : null}
                  {fallbackPrimaryTodo.sourceType ? <span>{SOURCE_TYPE_LABELS[fallbackPrimaryTodo.sourceType] ?? fallbackPrimaryTodo.sourceType}</span> : null}
                </div>
              </>
            ) : (
              <>
                <h2 className="actions-primary-title">今天还没有明确的推进项</h2>
                <p className="actions-primary-empty">可以从对话里说一句，把想法、机会或提醒变成待办。</p>
              </>
            )}
          </div>
          <div className="actions-primary-actions">
            {topPriority || fallbackPrimaryTodo ? (
              <Button
                type="button"
                onClick={handlePrimaryAction}
                variant="primary"
                className="actions-primary-btn"
              >
                {topPriority?.primaryActionLabel ?? '标记完成'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePrimaryAction}
                variant="primary"
                className="actions-primary-btn"
              >
                去对话新增
              </Button>
            )}
          </div>
          {secondarySuggestions.length > 0 ? (
            <div className="actions-suggestion-list" aria-label="后续建议">
              {secondarySuggestions.map((item) => (
                <button
                  key={`${item.source}-${item.id}`}
                  type="button"
                  className="actions-suggestion-item"
                  onClick={() => navigate(item.deepLink ?? '/todo')}
                >
                  <span>{item.title}</span>
                  <small>{item.primaryActionLabel}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="action-row actions-filter-row">
          {[
            { id: 'today' as FilterType, label: '今日', count: filterCounts.today },
            { id: 'future' as FilterType, label: '未来', count: filterCounts.future },
            { id: 'completed' as FilterType, label: '已完成', count: filterCounts.completed },
          ].map((f) => (
            <Button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              variant="unstyled"
              className={`action-chip actions-filter-chip ${filter === f.id ? 'primary' : ''}`}
            >
              {f.label} ({f.count})
            </Button>
          ))}
        </div>

        <div className="section actions-section">
          <div className="section-header">
            <span className="section-title">待办事项</span>
          </div>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="domain-card actions-empty-card">
            <p className="actions-empty-title">当前筛选下没有待办</p>
            <p className="actions-empty-text">去对话页说一句话，把它转成下一步行动</p>
          </div>
        ) : (
          <div className="actions-todo-list">
            {filteredTodos.map((todo) => {
              const deadlineInfo = getDeadlineStatus(todo.dueLabel);
              return (
                <div key={todo.todoId} className="domain-card actions-todo-card">
                  <Button
                    type="button"
                    onClick={() => void toggleTodo(todo)}
                    variant="unstyled"
                    className={`actions-todo-check ${todo.done ? 'is-done' : ''}`}
                    aria-label={todo.done ? `将待办 ${todo.title} 标记为未完成` : `将待办 ${todo.title} 标记为完成`}
                  >
                    {todo.done ? <span className="actions-todo-check-mark">✓</span> : <span aria-hidden="true" />}
                  </Button>
                  <div className="actions-todo-main">
                    <p className={`actions-todo-title ${todo.done ? 'is-done' : ''}`}>
                      {todo.title}
                    </p>
                    <div className="actions-todo-meta">
                      <p className={`actions-todo-deadline ${deadlineInfo.tone}`}>截止：{deadlineInfo.label}</p>
                      <span className="actions-todo-meta-item">优先级：{PRIORITY_LABELS[todo.priority] ?? todo.priority}</span>
                      {todo.sourceType ? <span className="actions-todo-meta-item">{SOURCE_TYPE_LABELS[todo.sourceType] ?? todo.sourceType}</span> : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void deleteTodo(todo.todoId)}
                    variant="unstyled"
                    className="actions-todo-delete"
                    aria-label={`删除待办 ${todo.title}`}
                  >
                    ×
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="section actions-section">
          <div className="section-header">
            <span className="section-title">后续跟进</span>
          </div>
        </div>

        {followingItems.length === 0 ? (
          <div className="domain-card actions-empty-card actions-empty-card-inline">
            <p className="actions-empty-text actions-empty-text-tight">当前还没有需要继续跟进的项目。</p>
          </div>
        ) : (
          <div className="actions-content-list">
            {followingItems.slice(0, 5).map((item) => (
              <div key={item.followId} className="domain-card actions-content-card">
                <ContentListCard
                  eyebrow={FOLLOW_STATUS_LABELS[item.followStatus] ?? item.followStatus}
                  title={item.title}
                  summary={item.nextStep ?? item.progressText ?? '等待下一步跟进动作'}
                  meta={<span className="actions-content-meta">{item.deadline?.slice(0, 10) ?? '长期跟进'}</span>}
                />
              </div>
            ))}
          </div>
        )}

        <div className="section actions-section">
          <div className="section-header">
            <span className="section-title">收藏待处理</span>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="domain-card actions-empty-card actions-empty-card-inline">
            <p className="actions-empty-text actions-empty-text-tight">当前还没有收藏内容。</p>
          </div>
        ) : (
          <div className="actions-content-list">
            {favorites.slice(0, 5).map((item) => (
              <div key={item.savedId} className="domain-card actions-content-card">
                <ContentListCard
                  eyebrow={item.contentType}
                  title={item.title}
                  summary={item.sourceName ?? item.urgencyLabel ?? '已进入稍后处理队列'}
                  meta={<span className="actions-content-meta">{item.savedAt?.slice(0, 10) ?? '未记录'}</span>}
                />
              </div>
            ))}
          </div>
        )}

        <div className="actions-rhythm-summary-card">
          <div className="actions-rhythm-summary-line">
            <span>已连续打卡 {streakDays} 天</span>
            <span>今日待办 {filterCounts.today} 项</span>
            <span>已完成 {todoProgress.done} 项</span>
          </div>
          <Button
            type="button"
            onClick={handleCheckIn}
            variant="secondary"
            className="actions-rhythm-checkin-btn"
            disabled={checkedInToday}
          >
            {checkedInToday ? '今日已打卡' : '执行今日打卡'}
          </Button>
          <p className="micro-meta actions-rhythm-meta">
            早报提醒 {reminderSummary?.pushTime ?? '08:00'}{reminderSummary?.doNotDisturb ? ' · 免打扰已开启' : ''}
          </p>
        </div>

      </PageContent>
    </PageLayout>
  );
}
