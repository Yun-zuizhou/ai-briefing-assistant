import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
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
      if (historyResponse.error) {
        throw new Error(historyResponse.error);
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

      <PageContent>
        <div style={{ padding: '12px 16px', background: 'var(--paper-warm)' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
            📅 过去7天的真实日志存档，按天归档展示痕迹、收藏与记录
          </span>
        </div>

        {loading ? (
          <div className="domain-card" style={{ margin: '16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-light)', margin: 0 }}>加载真实历史中...</p>
          </div>
        ) : error ? (
          <div className="domain-card" style={{ margin: '16px', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '12px' }}>{error}</p>
            <button onClick={() => void fetchHistory()} className="btn btn-primary">重试</button>
          </div>
        ) : last7Days.map((day) => (
          <div key={day.key}>
            <div className="section" style={{ paddingBottom: '8px' }}>
              <div className="section-header">
                <span className="section-title">
                  {day.isToday ? '今天' : day.dateStr}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  {day.weekDay}
                </span>
              </div>
            </div>

            {day.stats.traces === 0 && day.stats.collected === 0 && day.stats.recorded === 0 ? (
              <div className="domain-card" style={{ margin: '0 16px 16px', textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>暂无记录</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>这一天没有真实历史事件</p>
              </div>
            ) : (
              <>
                <div className="domain-card" style={{ margin: '0 16px 12px' }}>
                  <div className="domain-header" style={{ background: 'var(--paper-warm)' }}>
                    <div className="domain-name" style={{ color: 'var(--ink)' }}>当日归档</div>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '4px' }}>{day.dateStr} · {day.weekDay}</p>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                        {day.title}
                      </h3>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 0,
                      marginBottom: '14px',
                      background: 'var(--paper)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}>
                      <div style={{ padding: '10px', borderRight: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{day.stats.traces}</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>痕迹</div>
                      </div>
                      <div style={{ padding: '10px', borderRight: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>{day.stats.collected}</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>收藏</div>
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{day.stats.recorded}</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>记录</div>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'var(--paper-warm)',
                      borderLeft: '3px solid var(--accent)',
                      marginBottom: '12px',
                    }}>
                      <p style={{ fontSize: '13px', color: 'var(--ink-light)', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
                        {day.literaryContent}
                      </p>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 12px' }}>
                      {day.summary}
                    </p>

                    <div style={{
                      padding: '12px',
                      background: 'var(--paper)',
                      border: '1px solid var(--border)',
                      marginBottom: day.highlights.length > 0 ? '12px' : '0',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                        当天梳理
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, margin: 0 }}>
                        {day.journalSummary}
                      </p>
                    </div>

                    {day.highlights.length > 0 ? (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '8px', fontWeight: 600 }}>
                          当天亮点
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {day.highlights.map((highlight) => (
                            <span
                              key={`${day.key}-${highlight}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: 'var(--ink)',
                                background: 'var(--paper)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div style={{
                      padding: '12px',
                      background: 'var(--accent-light)',
                      color: 'var(--ink)',
                      border: '1px solid rgba(166, 61, 47, 0.15)',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--accent)' }}>
                        归档观察
                      </p>
                      <p style={{ fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
                        {day.observation}
                      </p>
                    </div>
                  </div>
                </div>

                {day.records.length > 0 ? (
                  <div style={{ margin: '0 16px 16px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                        原始时间线
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                        {day.records.length} 条
                      </span>
                    </div>
                    {day.records.map((record) => (
                      <div key={record.id} className="domain-card" style={{ marginBottom: '8px', padding: '12px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          gap: '12px',
                        }}>
                          <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{formatDateTime(record.created_at)}</span>
                          <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{getEventTypeLabel(record.event_type)}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 4px' }}>
                          {record.title}
                        </p>
                        {record.summary ? (
                          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                            {record.summary}
                          </p>
                        ) : null}
                        {record.content_ref ? (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'grid', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                                统一引用：{record.content_ref}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                                这条记录关联了原始内容，可继续查看详情。
                              </span>
                            </div>
                            <button
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => handleOpenDetail(record.content_ref)}
                            >
                              查看详情
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}
      </PageContent>
    </PageLayout>
  );
}
