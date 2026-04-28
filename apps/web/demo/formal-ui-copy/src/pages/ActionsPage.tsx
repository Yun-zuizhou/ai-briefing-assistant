import { useCallback, useEffect, useMemo, useState } from 'react';

import { Masthead, PageBody, PageContent, PageLayout, PageSection, PageSectionHeader } from '../components/layout';
import ContentListCard from '../components/business/ContentListCard';
import { ActionFilterTabs, ActionSummaryPanel } from '../components/business/actions';
import { apiService } from '../services/api';
import type { ActionsOverviewData, FollowingItem, SavedItem } from '../types/page-data';

type FilterType = 'today' | 'future' | 'completed';
type ActionTodoViewItem = ActionsOverviewData['todayTodos'][number];

const FOLLOW_STATUS_LABELS: Record<string, string> = {
  new: '新建',
  watching: '跟进中',
  applied: '已投递',
  waiting: '待反馈',
  completed: '已完成',
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ActionsPage() {
  const [filter, setFilter] = useState<FilterType>('today');
  const [todoGroups, setTodoGroups] = useState<Record<FilterType, ActionTodoViewItem[]>>({
    today: [],
    future: [],
    completed: [],
  });
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [followingItems, setFollowingItems] = useState<FollowingItem[]>([]);
  const [reminderSummary, setReminderSummary] = useState<ActionsOverviewData['reminderSummary'] | null>(null);
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
      await apiService.updateTodo(todo.todoId, { status: todo.done ? 'pending' : 'completed' });
      void fetchActionData();
    } catch {
      setError('更新待办失败，请稍后重试。');
      void fetchActionData();
    }
  }, [fetchActionData]);

  const deleteTodo = useCallback(async (id: number) => {
    try {
      await apiService.deleteTodo(id);
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
      return { color: 'var(--ink-muted)', label: '未设截止' };
    }
    const normalized = deadline.slice(0, 10);
    const todayStr = getTodayDateString();
    if (normalized < todayStr) return { color: 'var(--accent)', label: '已过期' };
    if (normalized === todayStr) return { color: '#B8860B', label: '今日截止' };
    return { color: 'var(--ink-muted)', label: normalized };
  };

  if (loading) {
    return (
      <PageLayout variant="main">
        <Masthead title="行动" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ ACTION ✦', '✦ CENTER ✦']} meta="待办 · 收藏 · 跟进" />
        <PageContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--ink-muted)' }}>
            <p>加载中...</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="main">
      <Masthead title="行动" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ ACTION ✦', '✦ CENTER ✦']} meta="待办 · 收藏 · 跟进" />
      <PageContent>
        <PageBody>
          {error ? (
            <PageSection compact>
              <div className="domain-card" style={{ marginTop: 0, padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px' }}>{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchActionData()}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px' }}
                >
                  重新加载
                </button>
              </div>
            </PageSection>
          ) : null}

          <PageSection compact>
            <ActionSummaryPanel
              doneCount={todoProgress.done}
              totalCount={todoProgress.total}
              savedCount={favorites.length}
              todayCount={filterCounts.today}
              followingCount={followingItems.length}
              streakDays={streakDays}
              checkedInToday={checkedInToday}
              reminderText={`早报提醒 ${reminderSummary?.pushTime ?? '08:00'}${reminderSummary?.doNotDisturb ? ' · 免打扰已开启' : ''}`}
              onCheckIn={handleCheckIn}
            />
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="当前待办"
              description="先处理今天，再决定要不要翻未来或已完成。"
            />

            <ActionFilterTabs
              activeFilter={filter}
              items={[
                { id: 'today', label: '今日', count: filterCounts.today },
                { id: 'future', label: '未来', count: filterCounts.future },
                { id: 'completed', label: '已完成', count: filterCounts.completed },
              ]}
              onChange={(value) => setFilter(value as FilterType)}
            />

            {filteredTodos.length === 0 ? (
              <div className="domain-card" style={{ margin: 0, textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>当前筛选下没有待办</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>去对话页说一句话，把它转成下一步行动</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {filteredTodos.map((todo) => {
                  const deadlineInfo = getDeadlineStatus(todo.dueLabel);
                  return (
                    <div key={todo.todoId} className="domain-card action-todo-card" style={{ margin: 0, padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div
                        onClick={() => void toggleTodo(todo)}
                        className={`action-todo-check ${todo.done ? 'checked' : ''}`}
                      >
                        {todo.done ? <span style={{ color: 'var(--paper)', fontSize: '12px' }}>✓</span> : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className={`action-todo-title ${todo.done ? 'done' : ''}`}>
                          {todo.title}
                        </p>
                        <div className="action-todo-meta-row">
                          <p style={{ fontSize: '11px', color: deadlineInfo.color, margin: 0 }}>截止：{deadlineInfo.label}</p>
                          <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>优先级：{todo.priority}</span>
                          {todo.sourceType ? <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>来源：{todo.sourceType}</span> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteTodo(todo.todoId)}
                        className="action-todo-delete"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="收藏待处理"
              description="暂时没排进待办的内容，等主任务推进后再回来清理。"
            />

            {favorites.length === 0 ? (
              <div className="domain-card" style={{ margin: 0, textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有收藏内容。</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {favorites.slice(0, 5).map((item) => (
                  <div key={item.savedId} className="domain-card" style={{ margin: 0 }}>
                    <ContentListCard
                      eyebrow={item.contentType}
                      title={item.title}
                      summary={item.sourceName ?? item.urgencyLabel ?? '已进入稍后处理队列'}
                      meta={<span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.savedAt?.slice(0, 10) ?? '未记录'}</span>}
                    />
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title="后续跟进"
              description="不是今天立刻要做，但需要你记得回来推进。"
            />

            {followingItems.length === 0 ? (
              <div className="domain-card" style={{ margin: 0, textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有需要继续跟进的项目。</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {followingItems.slice(0, 5).map((item) => (
                  <div key={item.followId} className="domain-card" style={{ margin: 0 }}>
                    <ContentListCard
                      eyebrow={FOLLOW_STATUS_LABELS[item.followStatus] ?? item.followStatus}
                      title={item.title}
                      summary={item.nextStep ?? item.progressText ?? '等待下一步跟进动作'}
                      meta={<span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.deadline?.slice(0, 10) ?? '长期跟进'}</span>}
                    />
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}
