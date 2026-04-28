import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent } from '../components/layout';
import { Button, Tag } from '../components/ui';
import { apiService } from '../services/api';
import type {
  ActionsOverviewData,
  FavoriteApiItem,
  GrowthOverviewData,
  HistoryApiItem,
  JournalOverviewData,
  NoteApiItem,
} from '../types/page-data';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  chat: '来自对话',
  manual: '手动记录',
  content: '来自内容',
  article: '来自内容',
  hot_topic: '来自热点',
  opportunity: '来自机会',
};

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

function formatDateTime(dateStr: string): string {
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return dateStr.replace('T', ' ').slice(0, 16);
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function getDeadlineLabel(deadline?: string | null) {
  if (!deadline) return '未设截止';
  return deadline.slice(0, 10);
}

function getSourceLabel(sourceType: string) {
  return SOURCE_TYPE_LABELS[sourceType] ?? '已沉淀';
}

function getEventLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

function getItemTypeLabel(itemType: string) {
  return ITEM_TYPE_LABELS[itemType] ?? '内容';
}

export default function JournalPage() {
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

  return (
    <PageLayout variant="main">
      <Masthead
        title="记录"
        subtitle={`${dateStr} · ${weekDay}`}
        ornaments={['✦ MY ✦', '✦ LOG ✦']}
        meta="表达 · 行动 · 留存"
      />

      <PageContent className="journal-page-content">
        {error ? (
          <div className="domain-card journal-state-card journal-error-card">
            <p className="journal-error-text">{error}</p>
            <Button onClick={() => void fetchJournalData()} variant="primary">重试</Button>
          </div>
        ) : null}

        <section className="domain-card journal-overview-card">
          <div className="journal-overview-head">
            <div>
              <p className="journal-overview-kicker">最近沉淀</p>
              <h2 className="journal-overview-title">你留下的东西正在汇到这里</h2>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/chat')}>
              去对话
            </Button>
          </div>
          <p className="journal-overview-text">
            {loading ? '正在读取真实沉淀...' : depositSummary.summaryText}
          </p>
          <div className="journal-stats-grid journal-overview-stats">
            <div className="journal-stat-item has-divider">
              <div className="journal-stat-value tone-accent">{depositSummary.expressionCount}</div>
              <div className="journal-stat-label">说过</div>
            </div>
            <div className="journal-stat-item has-divider">
              <div className="journal-stat-value tone-gold">{depositSummary.progressCount}</div>
              <div className="journal-stat-label">推进</div>
            </div>
            <div className="journal-stat-item">
              <div className="journal-stat-value tone-ink">{depositSummary.keptCount}</div>
              <div className="journal-stat-label">留下</div>
            </div>
          </div>
        </section>

        <div className="section journal-section">
          <div className="section-header">
            <span className="section-title">我刚说过的</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/chat')}>
              继续记录 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="domain-card journal-state-card">
            <p className="journal-state-title">加载记录中...</p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="domain-card journal-state-card">
            <p className="journal-state-title">还没有可回看的想法</p>
            <p className="journal-state-text">从对话里留下一句话，它会先成为这里的沉淀。</p>
          </div>
        ) : (
          <div className="journal-thought-list">
            {thoughts.slice(0, 5).map((thought) => (
              <article key={thought.id} className="domain-card journal-thought-card">
                <div className="journal-thought-head">
                  <div className="journal-thought-meta">
                    <span>{formatDateTime(thought.created_at)}</span>
                    <span>{getSourceLabel(thought.source_type)}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void handleDeleteThought(thought.id)}
                    variant="unstyled"
                    className="journal-thought-delete-btn"
                    aria-label={`删除记录 ${thought.id}`}
                  >
                    <Trash2 size={12} className="journal-thought-delete-icon" />
                  </Button>
                </div>
                <p className="journal-thought-content">{thought.content}</p>
                {thought.tags.length > 0 ? (
                  <div className="journal-mini-tags">
                    {thought.tags.slice(0, 3).map((tag) => (
                      <Tag key={`${thought.id}-${tag}`} variant="soft">{tag}</Tag>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}

        <div className="section journal-section">
          <div className="section-header">
            <span className="section-title">我推进过的</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/actions')}>
              去行动 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="journal-compact-list">
          {loading ? (
            <div className="domain-card journal-state-card">
              <p className="journal-state-title">加载行动沉淀中...</p>
            </div>
          ) : recentProgressItems.length === 0 ? (
            <div className="domain-card journal-state-card">
              <p className="journal-state-title">暂无推进中的事项</p>
              <p className="journal-state-text">对话生成的待办和机会跟进会在这里形成摘要。</p>
            </div>
          ) : recentProgressItems.map((item) => (
            <article key={item.id} className="domain-card journal-compact-card">
              <div className="journal-compact-head">
                <span className="journal-compact-label">{item.meta}</span>
              </div>
              <p className="journal-compact-title">{item.title}</p>
              <p className="journal-compact-detail">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="section journal-section">
          <div className="section-header">
            <span className="section-title">我留下的</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/history-logs')}>
              看历史 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="journal-keep-grid">
          {loading ? (
            <div className="domain-card journal-state-card">
              <p className="journal-state-title">加载历史痕迹中...</p>
            </div>
          ) : recentKeepItems.length === 0 ? (
            <div className="domain-card journal-state-card">
              <p className="journal-state-title">暂无收藏或历史痕迹</p>
              <p className="journal-state-text">阅读、收藏、记录和行动都会逐步沉到这里。</p>
            </div>
          ) : recentKeepItems.map((item) => (
            <article key={item.id} className="domain-card journal-keep-card">
              <div className="journal-keep-meta">
                <span>{item.sourceLabel}</span>
                <span>{item.createdAt ? formatDateTime(item.createdAt) : '未记录'}</span>
              </div>
              <p className="journal-keep-title">{item.title}</p>
              <p className="journal-keep-detail">{truncateText(item.detail, 54)}</p>
            </article>
          ))}
        </div>

        <div className="section journal-section">
          <div className="section-header">
            <span className="section-title">长期回看</span>
            <Button type="button" variant="text" size="sm" className="section-more" onClick={() => navigate('/growth')}>
              看成长 <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <section className="journal-review-card">
          <div className="journal-review-main">
            <p className="journal-review-title">
              {journalOverview?.review.summaryText || growthData?.weeklySummary.growthSummary || '等沉淀更多之后，这里会形成更稳定的周期回看。'}
            </p>
            <p className="journal-review-meta">
              {depositSummary.reviewCount > 0
                ? `已有 ${depositSummary.reviewCount} 个可查看的周期回顾入口`
                : '周期回顾会留在成长和历史简报里，不压住当前记录。'}
            </p>
          </div>
          <div className="journal-growth-tags">
            {(visibleGrowthTags.length > 0 ? visibleGrowthTags : ['待形成标签']).map((tag, index) => (
              <Tag key={`${tag}-${index}`} variant="soft">{tag}</Tag>
            ))}
          </div>
          <div className="journal-review-actions">
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/growth')}>
              成长页
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/history-brief')}>
              历史简报
            </Button>
          </div>
        </section>
      </PageContent>
    </PageLayout>
  );
}
