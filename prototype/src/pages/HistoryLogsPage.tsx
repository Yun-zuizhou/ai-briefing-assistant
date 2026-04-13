import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { apiService } from '../services/api';
import type { HistoryApiItem } from '../types/page-data';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

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

function parseDateFromRecord(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return null;
}

export default function HistoryLogsPage() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getHistory();
      setHistoryItems(response.data?.items ?? []);
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
      const recordDate = parseDateFromRecord(record.created_at);
      if (!recordDate) return false;
      return recordDate >= dateStart && recordDate <= dateEnd;
    });

    return {
      dateStr,
      weekDay,
      key,
      records: dayRecords,
      isToday: i === 0,
    };
  }), [historyItems]);

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
            📅 过去7天的真实历史日志，按时间线排列
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

            {day.records.length === 0 ? (
              <div className="domain-card" style={{ margin: '0 16px 16px', textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '8px' }}>暂无记录</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>这一天没有真实历史事件</p>
              </div>
            ) : (
              <div style={{ margin: '0 16px 16px' }}>
                {day.records.map((record) => (
                  <div key={record.id} className="domain-card" style={{ marginBottom: '8px', padding: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{record.created_at.replace('T', ' ').slice(0, 16)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{record.event_type}</span>
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
                        <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                          统一引用：{record.content_ref}
                        </span>
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
            )}
          </div>
        ))}
      </PageContent>
    </PageLayout>
  );
}
