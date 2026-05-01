import { Button } from '../ui';
import { PageSection, PageStack } from '../layout';
import type { FavoriteApiItem, HistoryApiItem, NoteApiItem } from '../../types/page-data';

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

function getEventTypeLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

export function HistoryLogsTip() {
  return (
    <div className="history-logs-tip">
      <span className="history-logs-tip-text">
        过去 7 天的系统留痕按天归档；它不是手写日记，而是阅读、收藏、记录和配置变化的回看入口。
      </span>
    </div>
  );
}

export function HistoryLogsStateCard({
  error,
  loading,
  onRetry,
}: {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="domain-card history-logs-state-card">
        <p className="history-logs-state-text">加载历史轨迹中...</p>
      </div>
    );
  }

  if (!error) {
    return null;
  }

  return (
    <div className="domain-card history-logs-state-card">
      <p className="history-logs-error-text">{error}</p>
      <Button type="button" onClick={onRetry} variant="primary">
        重试
      </Button>
    </div>
  );
}

function HistoryLogsArchiveCard({ day }: { day: DailyArchive }) {
  return (
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
  );
}

function HistoryLogsTimeline({
  onOpenDetail,
  records,
}: {
  onOpenDetail: (contentRef?: string | null) => void;
  records: HistoryApiItem[];
}) {
  if (records.length === 0) {
    return null;
  }

  return (
    <div className="history-logs-timeline">
      <div className="history-logs-timeline-head">
        <span className="history-logs-timeline-label">
          原始时间线
        </span>
        <span className="history-logs-timeline-count">
          {records.length} 条
        </span>
      </div>
      {records.map((record) => (
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
                  内容引用：{record.content_ref}
                </span>
                <span className="history-logs-record-ref-note">
                  这条记录关联了原始内容，可继续查看详情。
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="history-logs-record-ref-btn"
                onClick={() => onOpenDetail(record.content_ref)}
              >
                查看详情
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HistoryLogsArchiveList({
  days,
  onOpenDetail,
}: {
  days: DailyArchive[];
  onOpenDetail: (contentRef?: string | null) => void;
}) {
  return (
    <PageStack>
      {days.map((day) => (
        <PageSection
          key={day.key}
          className="history-logs-day-section"
          title={day.isToday ? '今天' : day.dateStr}
          action={<span className="history-logs-day-week">{day.weekDay}</span>}
        >
          {day.stats.traces === 0 && day.stats.collected === 0 && day.stats.recorded === 0 ? (
            <div className="domain-card history-logs-empty-card">
              <p className="history-logs-empty-title">暂无历史轨迹</p>
              <p className="history-logs-empty-text">这一天还没有阅读、收藏、记录或配置变化。</p>
            </div>
          ) : (
            <>
              <HistoryLogsArchiveCard day={day} />
              <HistoryLogsTimeline records={day.records} onOpenDetail={onOpenDetail} />
            </>
          )}
        </PageSection>
      ))}
    </PageStack>
  );
}
