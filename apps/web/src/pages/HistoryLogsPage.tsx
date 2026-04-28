import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button } from '../components/ui';
import { apiService } from '../services/api';
import type { FavoriteApiItem, HistoryApiItem, NoteApiItem } from '../types/page-data';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
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

interface DailyArchive {
  dateStr: string;
  weekDay: string;
  key: string;
  isToday: boolean;
  records: HistoryApiItem[];
  notes: NoteApiItem[];
  favorites: FavoriteApiItem[];
  stats: {
    traces: number;
    collected: number;
    recorded: number;
  };
  title: string;
  summary: string;
  literaryContent: string;
  journalSummary: string;
  observation: string;
  highlights: string[];
}

function getDateInfo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = weekDays[date.getDay()];
  return {
    dateStr: `${year}年${month}月${day}日`,
    weekDay: `星期${weekDay}`,
    key: `${year}-${month}-${day}`,
    dateStart: new Date(year, date.getMonth(), day, 0, 0, 0),
    dateEnd: new Date(year, date.getMonth(), day, 23, 59, 59),
  };
}

function parseDateValue(dateStr: string): Date | null {
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return null;
}

function formatDateTime(dateStr: string): string {
  const date = parseDateValue(dateStr);
  if (!date) {
    return dateStr.replace('T', ' ').slice(0, 16);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function truncateText(value: string, length: number) {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length).trim()}...`;
}

function getEventTypeLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

function buildDailyArchive(params: {
  isToday: boolean;
  dateStr: string;
  weekDay: string;
  key: string;
  records: HistoryApiItem[];
  notes: NoteApiItem[];
  favorites: FavoriteApiItem[];
}): DailyArchive {
  const { isToday, dateStr, weekDay, key, records, notes, favorites } = params;
  const traceCount = records.length;
  const collectedCount = favorites.length;
  const recordedCount = notes.length;
  const leadingLabel = isToday ? '今天' : '这一天';
  const activityLabels = Array.from(new Set(records.map((record) => getEventTypeLabel(record.event_type)))).slice(0, 4);

  let title = `${leadingLabel}留下了新的真实痕迹`;
  if (recordedCount > 0 && collectedCount > 0) {
    title = `${leadingLabel}既留下了输入，也留下了沉淀`;
  } else if (recordedCount > 0) {
    title = `${leadingLabel}把看到的内容转成了自己的记录`;
  } else if (collectedCount > 0) {
    title = `${leadingLabel}筛出了值得继续跟进的线索`;
  } else if (traceCount > 0) {
    title = `${leadingLabel}保留了持续推进的主线痕迹`;
  }

  const summaryParts = [
    traceCount > 0 ? `沉淀了 ${traceCount} 条历史痕迹` : null,
    collectedCount > 0 ? `收藏了 ${collectedCount} 条内容` : null,
    recordedCount > 0 ? `记录了 ${recordedCount} 条想法` : null,
  ].filter(Boolean);

  const summary = summaryParts.length > 0
    ? `${leadingLabel}${summaryParts.join('，')}。${activityLabels.length > 0 ? `主要轨迹包括 ${activityLabels.join('、')}。` : ''}`
    : `${leadingLabel}暂时没有形成可归档的真实记录。`;

  let literaryContent = '这一天更像是主线推进中的留痕时刻，说明你仍在持续把行为沉到系统里。';
  if (recordedCount > 0 && collectedCount > 0) {
    literaryContent = '这一天不是只看过，而是把值得留下的内容和自己的想法一起沉了下来。';
  } else if (recordedCount > 0) {
    literaryContent = '这一天更偏向沉淀表达，你把信息输入转成了自己的文字记录。';
  } else if (collectedCount > 0) {
    literaryContent = '这一天更偏向筛选线索，你把值得后续回看的对象先留了下来。';
  }

  const highlights = Array.from(new Set([
    ...favorites.map((item) => truncateText(item.item_title, 26)),
    ...notes.map((item) => truncateText(item.content, 26)),
    ...records.map((item) => truncateText(item.title, 26)),
  ].filter(Boolean))).slice(0, 4);

  const journalSummary = notes[0]?.content
    ? `原始记录里最靠近当天心境的一句是：“${truncateText(notes[0].content, 40)}”`
    : favorites[0]?.item_summary
      ? `当天收藏里最值得回看的线索是：${truncateText(favorites[0].item_summary, 42)}`
      : records.find((item) => item.summary)?.summary
        ? `当天轨迹梳理：${truncateText(records.find((item) => item.summary)?.summary ?? '', 42)}`
        : activityLabels.length > 0
          ? `当天主要留下的是 ${activityLabels.join('、')} 等轨迹。`
          : '当天暂无可提炼的归档摘要。';

  let observation = '归档观察：这一天更适合回看原始时间线，确认哪条轨迹值得继续展开。';
  if (recordedCount >= 2) {
    observation = '归档观察：这一天明显更偏向主动沉淀，后续适合优先回看自己的原始记录。';
  } else if (collectedCount > 0) {
    observation = '归档观察：这一天筛出了值得后续跟进的对象，可以继续从收藏与行动入口往下推进。';
  } else if (traceCount > 0) {
    observation = '归档观察：这一天已经留下连续行为痕迹，适合从时间线里回看主线是如何推进的。';
  }

  return {
    dateStr,
    weekDay,
    key,
    isToday,
    records,
    notes,
    favorites,
    stats: {
      traces: traceCount,
      collected: collectedCount,
      recorded: recordedCount,
    },
    title,
    summary,
    literaryContent,
    journalSummary,
    observation,
    highlights,
  };
}

export default function HistoryLogsPage() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryApiItem[]>([]);
  const [noteItems, setNoteItems] = useState<NoteApiItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyResponse, notesResponse, favoritesResponse] = await Promise.all([
        apiService.getHistory(),
        apiService.getNotes(),
        apiService.getFavorites(),
      ]);
      if (historyResponse.error || notesResponse.error || favoritesResponse.error) {
        throw new Error(historyResponse.error || notesResponse.error || favoritesResponse.error);
      }
      setHistoryItems(historyResponse.data?.items ?? []);
      setNoteItems(notesResponse.data?.items ?? []);
      setFavoriteItems(favoritesResponse.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const { dateStr, weekDay, key, dateStart, dateEnd } = getDateInfo(i);

    const dayRecords = historyItems.filter((record) => {
      const recordDate = parseDateValue(record.created_at);
      if (!recordDate) return false;
      return recordDate >= dateStart && recordDate <= dateEnd;
    });

    const dayNotes = noteItems.filter((note) => {
      const noteDate = parseDateValue(note.created_at);
      if (!noteDate) return false;
      return noteDate >= dateStart && noteDate <= dateEnd;
    });

    const dayFavorites = favoriteItems.filter((favorite) => {
      const favoriteDate = parseDateValue(favorite.created_at);
      if (!favoriteDate) return false;
      return favoriteDate >= dateStart && favoriteDate <= dateEnd;
    });

    return buildDailyArchive({
      dateStr,
      weekDay,
      key,
      isToday: i === 0,
      records: dayRecords,
      notes: dayNotes,
      favorites: dayFavorites,
    });
  }), [favoriteItems, historyItems, noteItems]);

  const handleOpenDetail = useCallback((contentRef?: string | null) => {
    if (!contentRef) {
      return;
    }
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`);
  }, [navigate]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="往日日志" label="HISTORY LOGS" />

      <PageContent className="history-logs-page-content">
        <div className="history-logs-tip">
          <span className="history-logs-tip-text">
            📅 过去7天的真实日志存档，按天归档展示痕迹、收藏与记录
          </span>
        </div>

        {loading ? (
          <div className="domain-card history-logs-state-card">
            <p className="history-logs-state-text">加载真实历史中...</p>
          </div>
        ) : error ? (
          <div className="domain-card history-logs-state-card">
            <p className="history-logs-error-text">{error}</p>
            <Button onClick={() => void fetchHistory()} variant="primary">重试</Button>
          </div>
        ) : last7Days.map((day) => (
          <section key={day.key} className="history-logs-day-section">
            <div className="section history-logs-day-head">
              <div className="section-header history-logs-day-header">
                <span className="section-title">
                  {day.isToday ? '今天' : day.dateStr}
                </span>
                <span className="history-logs-day-week">
                  {day.weekDay}
                </span>
              </div>
            </div>

            {day.stats.traces === 0 && day.stats.collected === 0 && day.stats.recorded === 0 ? (
              <div className="domain-card history-logs-empty-card">
                <p className="history-logs-empty-title">暂无记录</p>
                <p className="history-logs-empty-text">这一天没有真实历史事件</p>
              </div>
            ) : (
              <>
                <article className="domain-card history-logs-archive-card">
                  <div className="domain-header history-logs-archive-head">
                    <div className="domain-name history-logs-archive-head-title">当日归档</div>
                  </div>
                  <div className="history-logs-archive-body">
                    <div className="history-logs-archive-title-wrap">
                      <p className="history-logs-archive-date">{day.dateStr} · {day.weekDay}</p>
                      <h3 className="history-logs-archive-title">
                        {day.title}
                      </h3>
                    </div>

                    <div className="history-logs-stats-grid">
                      <div className="history-logs-stat-item has-divider">
                        <div className="history-logs-stat-value tone-accent">{day.stats.traces}</div>
                        <div className="history-logs-stat-label">痕迹</div>
                      </div>
                      <div className="history-logs-stat-item has-divider">
                        <div className="history-logs-stat-value tone-gold">{day.stats.collected}</div>
                        <div className="history-logs-stat-label">收藏</div>
                      </div>
                      <div className="history-logs-stat-item">
                        <div className="history-logs-stat-value tone-ink">{day.stats.recorded}</div>
                        <div className="history-logs-stat-label">记录</div>
                      </div>
                    </div>

                    <div className="history-logs-literary-box">
                      <p className="history-logs-literary-text">
                        {day.literaryContent}
                      </p>
                    </div>

                    <p className="history-logs-summary">
                      {day.summary}
                    </p>

                    <div className={`history-logs-journal-box${day.highlights.length > 0 ? ' has-gap' : ''}`}>
                      <p className="history-logs-journal-label">
                        当天梳理
                      </p>
                      <p className="history-logs-journal-text">
                        {day.journalSummary}
                      </p>
                    </div>

                    {day.highlights.length > 0 ? (
                      <div className="history-logs-highlights">
                        <p className="history-logs-highlights-label">
                          当天亮点
                        </p>
                        <div className="history-logs-highlight-list">
                          {day.highlights.map((highlight) => (
                            <span key={`${day.key}-${highlight}`} className="history-logs-highlight-chip">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="history-logs-observation-box">
                      <p className="history-logs-observation-label">
                        归档观察
                      </p>
                      <p className="history-logs-observation-text">
                        {day.observation}
                      </p>
                    </div>
                  </div>
                </article>

                {day.records.length > 0 ? (
                  <div className="history-logs-timeline">
                    <div className="history-logs-timeline-head">
                      <span className="history-logs-timeline-label">
                        原始时间线
                      </span>
                      <span className="history-logs-timeline-count">
                        {day.records.length} 条
                      </span>
                    </div>
                    {day.records.map((record) => (
                      <div key={record.id} className="domain-card history-logs-record-card">
                        <div className="history-logs-record-head">
                          <span className="history-logs-record-time">{formatDateTime(record.created_at)}</span>
                          <span className="history-logs-record-type">{getEventTypeLabel(record.event_type)}</span>
                        </div>
                        <p className="history-logs-record-title">
                          {record.title}
                        </p>
                        {record.summary ? (
                          <p className="history-logs-record-summary">
                            {record.summary}
                          </p>
                        ) : null}
                        {record.content_ref ? (
                          <div className="history-logs-record-ref-row">
                            <div className="history-logs-record-ref-copy">
                              <span className="history-logs-record-ref-id">
                                统一引用：{record.content_ref}
                              </span>
                              <span className="history-logs-record-ref-note">
                                这条记录关联了原始内容，可继续查看详情。
                              </span>
                            </div>
                            <Button
                              variant="secondary"
                              className="history-logs-record-ref-btn"
                              onClick={() => handleOpenDetail(record.content_ref)}
                            >
                              查看详情
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        ))}
      </PageContent>
    </PageLayout>
  );
}
