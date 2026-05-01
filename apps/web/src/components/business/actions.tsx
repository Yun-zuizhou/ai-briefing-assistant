import { Button } from '../ui';
import { PageGrid } from '../layout';
import ContentListCard from './ContentListCard';
import type { ActionsOverviewData, FollowingItem, SavedItem, SuggestedActionItem } from '../../types/page-data';
import { formatContentTypeLabel } from '../../utils/contentLabels';

export type ActionsFilterType = 'today' | 'future' | 'completed';
export type ActionTodoViewItem = ActionsOverviewData['todayTodos'][number];

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

function getDeadlineStatus(deadline?: string | null) {
  if (!deadline) {
    return { tone: 'none', label: '未设截止' as string };
  }
  const normalized = deadline.slice(0, 10);
  const todayStr = getTodayDateString();
  if (normalized < todayStr) return { tone: 'overdue', label: '已过期' as string };
  if (normalized === todayStr) return { tone: 'today', label: '今日截止' as string };
  return { tone: 'normal', label: normalized };
}

export function ActionsLoadingState() {
  return (
    <div className="actions-loading-state">
      <p>加载中...</p>
    </div>
  );
}

export function ActionsErrorCard({
  error,
  onReload,
}: {
  error: string;
  onReload: () => void;
}) {
  return (
    <div className="domain-card actions-error-card">
      <p className="actions-error-text">{error}</p>
      <Button type="button" onClick={onReload} variant="primary">
        重新加载
      </Button>
    </div>
  );
}

export function ActionsPrimaryCard({
  fallbackPrimaryTodo,
  onPrimaryAction,
  onSuggestionClick,
  secondarySuggestions,
  topPriority,
}: {
  fallbackPrimaryTodo: ActionTodoViewItem | null;
  onPrimaryAction: () => void;
  onSuggestionClick: (deepLink?: string | null) => void;
  secondarySuggestions: SuggestedActionItem[];
  topPriority: SuggestedActionItem | null;
}) {
  return (
    <div className="domain-card actions-primary-card">
      <div className="actions-primary-copy">
        <p className="actions-primary-kicker">今天先推进这一件</p>
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
            <p className="actions-primary-empty">可以从简报、阅读详情或对话里把想法、机会或提醒转成待办。</p>
          </>
        )}
      </div>
      <div className="actions-primary-actions">
        <Button
          type="button"
          onClick={onPrimaryAction}
          variant="primary"
          className="actions-primary-btn"
        >
          {topPriority || fallbackPrimaryTodo ? topPriority?.primaryActionLabel ?? '标记完成' : '去对话新增'}
        </Button>
      </div>
      {secondarySuggestions.length > 0 ? (
        <div className="actions-suggestion-list" aria-label="后续建议">
          {secondarySuggestions.map((item) => (
            <button
              key={`${item.source}-${item.id}`}
              type="button"
              className="actions-suggestion-item"
              onClick={() => onSuggestionClick(item.deepLink)}
            >
              <span>{item.title}</span>
              <small>{item.primaryActionLabel}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ActionsFilterBar({
  counts,
  filter,
  onChange,
}: {
  counts: Record<ActionsFilterType, number>;
  filter: ActionsFilterType;
  onChange: (filter: ActionsFilterType) => void;
}) {
  return (
    <div className="action-row actions-filter-row">
      {[
        { id: 'today' as const, label: '今日', count: counts.today },
        { id: 'future' as const, label: '未来', count: counts.future },
        { id: 'completed' as const, label: '已完成', count: counts.completed },
      ].map((item) => (
        <Button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          variant="unstyled"
          className={`action-chip actions-filter-chip ${filter === item.id ? 'primary' : ''}`}
        >
          {item.label} ({item.count})
        </Button>
      ))}
    </div>
  );
}

export function ActionsTodoList({
  todos,
  onDelete,
  onToggle,
}: {
  todos: ActionTodoViewItem[];
  onDelete: (id: number) => void;
  onToggle: (todo: ActionTodoViewItem) => void;
}) {
  if (todos.length === 0) {
    return (
      <div className="domain-card actions-empty-card">
        <p className="actions-empty-title">当前筛选下没有待办</p>
        <p className="actions-empty-text">从简报、阅读详情或对话里添加下一步行动。</p>
      </div>
    );
  }

  return (
    <PageGrid className="actions-todo-list">
      {todos.map((todo) => {
        const deadlineInfo = getDeadlineStatus(todo.dueLabel);
        return (
          <div key={todo.todoId} className="domain-card actions-todo-card">
            <Button
              type="button"
              onClick={() => onToggle(todo)}
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
              onClick={() => onDelete(todo.todoId)}
              variant="unstyled"
              className="actions-todo-delete"
              aria-label={`删除待办 ${todo.title}`}
            >
              ×
            </Button>
          </div>
        );
      })}
    </PageGrid>
  );
}

export function ActionsFollowingList({ items }: { items: FollowingItem[] }) {
  if (items.length === 0) {
    return (
      <div className="domain-card actions-empty-card actions-empty-card-inline">
        <p className="actions-empty-text actions-empty-text-tight">当前还没有需要继续跟进的项目。</p>
      </div>
    );
  }

  return (
    <PageGrid className="actions-content-list">
      {items.slice(0, 5).map((item) => (
        <div key={item.followId} className="domain-card actions-content-card">
          <ContentListCard
            eyebrow={FOLLOW_STATUS_LABELS[item.followStatus] ?? item.followStatus}
            title={item.title}
            summary={item.nextStep ?? item.progressText ?? '等待下一步跟进动作'}
            meta={<span className="actions-content-meta">{item.deadline?.slice(0, 10) ?? '长期跟进'}</span>}
          />
        </div>
      ))}
    </PageGrid>
  );
}

export function ActionsSavedList({ items }: { items: SavedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="domain-card actions-empty-card actions-empty-card-inline">
        <p className="actions-empty-text actions-empty-text-tight">当前还没有需要稍后处理的收藏内容。</p>
      </div>
    );
  }

  return (
    <PageGrid className="actions-content-list">
      {items.slice(0, 5).map((item) => (
        <div key={item.savedId} className="domain-card actions-content-card">
          <ContentListCard
            eyebrow={formatContentTypeLabel(item.contentType)}
            title={item.title}
            summary={item.sourceName ?? item.urgencyLabel ?? '已进入稍后处理队列'}
            meta={<span className="actions-content-meta">{item.savedAt?.slice(0, 10) ?? '未记录'}</span>}
          />
        </div>
      ))}
    </PageGrid>
  );
}

export function ActionsRhythmSummary({
  checkedInToday,
  onCheckIn,
  reminderSummary,
  streakDays,
  todayTodoCount,
  completedTodoCount,
}: {
  checkedInToday: boolean;
  onCheckIn: () => void;
  reminderSummary: ActionsOverviewData['reminderSummary'] | null;
  streakDays: number;
  todayTodoCount: number;
  completedTodoCount: number;
}) {
  return (
    <div className="actions-rhythm-summary-card">
      <div className="actions-rhythm-summary-line">
        <span>已连续打卡 {streakDays} 天</span>
        <span>今日待办 {todayTodoCount} 项</span>
        <span>已完成 {completedTodoCount} 项</span>
      </div>
      <Button
        type="button"
        onClick={onCheckIn}
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
  );
}
