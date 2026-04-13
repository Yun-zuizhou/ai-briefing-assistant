import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageContent, PageLayout, Masthead } from '../components/layout';
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
        {error ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '8px' }}>{error}</p>
            <button
              onClick={() => void fetchActionData()}
              className="btn btn-primary"
              style={{ padding: '8px 14px' }}
            >
              重新加载
            </button>
          </div>
        ) : null}
        <div className="domain-card" style={{ marginTop: '16px' }}>
          <div className="domain-header" style={{ background: 'var(--accent)', color: 'var(--paper)' }}>
            <div className="domain-name" style={{ color: 'var(--paper)' }}>🔥 行动节律</div>
          </div>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div
                onClick={handleCheckIn}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: checkedInToday ? 'var(--accent)' : 'var(--paper-warm)',
                  border: '3px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: checkedInToday ? 'default' : 'pointer',
                }}
              >
                <span style={{ fontSize: '28px' }}>{checkedInToday ? '✓' : '🔥'}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-serif-cn)' }}>
                  {checkedInToday ? '已打卡' : '今日打卡'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>
                  连续打卡 <strong style={{ color: 'var(--accent)' }}>{streakDays}</strong> 天
                </p>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: '4px 0 0' }}>
                  早报提醒 {reminderSummary?.pushTime ?? '08:00'}{reminderSummary?.doNotDisturb ? ' · 免打扰已开启' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: '16px', padding: '14px', background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{todoProgress.done}/{todoProgress.total}</p>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: 0 }}>待办完成</p>
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{favorites.length}</p>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: 0 }}>收藏待处理</p>
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{filterCounts.today}</p>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: 0 }}>今日要处理</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', margin: '0 16px 16px' }}>
          {[
            { id: 'today' as FilterType, label: '今日', count: filterCounts.today },
            { id: 'future' as FilterType, label: '未来', count: filterCounts.future },
            { id: 'completed' as FilterType, label: '已完成', count: filterCounts.completed },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                flex: 1,
                padding: '10px',
                background: filter === f.id ? 'var(--ink)' : 'var(--paper-warm)',
                border: '2px solid var(--ink)',
                color: filter === f.id ? 'var(--paper)' : 'var(--ink)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-serif-cn)',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">待办事项</span>
          </div>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="domain-card" style={{ margin: '0 16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>当前筛选下没有待办</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>去对话页说一句话，把它转成下一步行动</p>
          </div>
        ) : (
          <div style={{ margin: '0 16px 16px' }}>
            {filteredTodos.map((todo) => {
              const deadlineInfo = getDeadlineStatus(todo.dueLabel);
              return (
                <div key={todo.todoId} className="domain-card" style={{ marginBottom: '8px', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    onClick={() => void toggleTodo(todo)}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid var(--ink)',
                      background: todo.done ? 'var(--ink)' : 'var(--paper)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {todo.done ? <span style={{ color: 'var(--paper)', fontSize: '12px' }}>✓</span> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0, textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.6 : 1 }}>
                      {todo.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '11px', color: deadlineInfo.color, margin: 0 }}>截止：{deadlineInfo.label}</p>
                      <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>优先级：{todo.priority}</span>
                      {todo.sourceType ? <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>来源：{todo.sourceType}</span> : null}
                    </div>
                  </div>
                  <button
                    onClick={() => void deleteTodo(todo.todoId)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">收藏待处理</span>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="domain-card" style={{ margin: '0 16px 16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有收藏内容。</p>
          </div>
        ) : (
          <div style={{ margin: '0 16px 16px' }}>
            {favorites.slice(0, 5).map((item) => (
              <div key={item.savedId} className="domain-card" style={{ marginBottom: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{item.contentType}</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.savedAt?.slice(0, 10) ?? '未记录'}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '4px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.sourceName ?? item.urgencyLabel ?? '已进入稍后处理队列'}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">后续跟进</span>
          </div>
        </div>

        {followingItems.length === 0 ? (
          <div className="domain-card" style={{ margin: '0 16px 16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有需要继续跟进的项目。</p>
          </div>
        ) : (
          <div style={{ margin: '0 16px 16px' }}>
            {followingItems.slice(0, 5).map((item) => (
              <div key={item.followId} className="domain-card" style={{ marginBottom: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>
                    {FOLLOW_STATUS_LABELS[item.followStatus] ?? item.followStatus}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{item.deadline?.slice(0, 10) ?? '长期跟进'}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: '4px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.nextStep ?? item.progressText ?? '等待下一步跟进动作'}
                </p>
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
