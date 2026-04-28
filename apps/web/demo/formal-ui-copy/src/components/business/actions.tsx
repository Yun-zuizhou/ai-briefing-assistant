import { PagePanel } from '../layout';

export function ActionSummaryPanel({
  doneCount,
  totalCount,
  savedCount,
  todayCount,
  followingCount,
  streakDays,
  checkedInToday,
  reminderText,
  onCheckIn,
}: {
  doneCount: number;
  totalCount: number;
  savedCount: number;
  todayCount: number;
  followingCount: number;
  streakDays: number;
  checkedInToday: boolean;
  reminderText: string;
  onCheckIn: () => void;
}) {
  const summaryText = getActionSummaryText({
    doneCount,
    totalCount,
    savedCount,
    todayCount,
    followingCount,
  });
  const recentCheckInDays = getRecentCheckInDays(streakDays, checkedInToday);

  return (
    <PagePanel className="action-summary-panel">
      <div className="action-summary-copy">
        <p className="action-summary-kicker">行动摘要</p>
        <p className="action-summary-text">{summaryText}</p>
        <p className="action-summary-meta">{reminderText}</p>
      </div>

      <div className="action-summary-facts">
        <span className="action-summary-fact action-summary-fact-strong">
          <span className="action-summary-fact-value">{doneCount}/{totalCount}</span>
          <span className="action-summary-fact-label">完成进度</span>
        </span>
        <span className="action-summary-fact">
          <span className="action-summary-fact-value">{todayCount}</span>
          <span className="action-summary-fact-label">今日待办</span>
        </span>
        <span className="action-summary-fact">
          <span className="action-summary-fact-value">{savedCount}</span>
          <span className="action-summary-fact-label">收藏待处理</span>
        </span>
        <span className="action-summary-fact">
          <span className="action-summary-fact-value">{followingCount}</span>
          <span className="action-summary-fact-label">后续跟进</span>
        </span>
      </div>

      <div className="action-rhythm-panel">
        <div className="action-rhythm-header">
          <div className="action-rhythm-copy">
            <span className="action-summary-kicker">打卡节律</span>
            <span className="action-rhythm-meta">连续 {streakDays} 天</span>
          </div>

          <button
            type="button"
            onClick={checkedInToday ? undefined : onCheckIn}
            className={`action-summary-checkin-inline ${checkedInToday ? 'checked' : ''}`}
            disabled={checkedInToday}
          >
            {checkedInToday ? '今日已打卡' : '今日打卡'}
          </button>
        </div>

        <div className="action-checkin-calendar-grid">
          {recentCheckInDays.map((item) => (
            <div
              key={item.iso}
              className={`action-checkin-day ${item.checked ? 'checked' : ''} ${item.isToday ? 'today' : ''}`}
            >
              <span className="action-checkin-day-label">{item.weekday}</span>
              <span className="action-checkin-day-date">{item.dayOfMonth}</span>
            </div>
          ))}
        </div>
      </div>
    </PagePanel>
  );
}

function getRecentCheckInDays(streakDays: number, checkedInToday: boolean) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streakEnd = new Date(today);
  if (!checkedInToday && streakDays > 0) {
    streakEnd.setDate(streakEnd.getDate() - 1);
  }

  const streakStart = new Date(streakEnd);
  streakStart.setDate(streakStart.getDate() - Math.max(streakDays - 1, 0));

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    const checked =
      streakDays > 0
      && date.getTime() >= streakStart.getTime()
      && date.getTime() <= streakEnd.getTime();

    return {
      iso: date.toISOString(),
      weekday: weekdayLabels[date.getDay()],
      dayOfMonth: date.getDate(),
      checked,
      isToday: date.getTime() === today.getTime(),
    };
  });
}

export function ActionFilterTabs({
  activeFilter,
  items,
  onChange,
}: {
  activeFilter: string;
  items: Array<{ id: string; label: string; count: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="action-filter-tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`action-filter-tab ${activeFilter === item.id ? 'active' : ''}`}
        >
          <span>{item.label}</span>
          <span className="action-filter-count">{item.count}</span>
        </button>
      ))}
    </div>
  );
}

function getActionSummaryText({
  doneCount,
  totalCount,
  savedCount,
  todayCount,
  followingCount,
}: {
  doneCount: number;
  totalCount: number;
  savedCount: number;
  todayCount: number;
  followingCount: number;
}) {
  if (totalCount === 0 && savedCount === 0 && followingCount === 0) {
    return '当前行动面还是空的。适合去对话页说一句你想推进的事，把它转成下一步。';
  }

  if (todayCount > 0) {
    return `今天最先要处理 ${todayCount} 条当天待办。先把眼前这批推进掉，再决定要不要清理收藏或跟进项。`;
  }

  if (savedCount > 0) {
    return `今天没有硬性待办压着你，但还有 ${savedCount} 条收藏待处理。适合趁节奏轻的时候挑 1 到 2 条真正值得推进的内容。`;
  }

  if (followingCount > 0) {
    return `当前待办已经推进到 ${doneCount}/${totalCount}，接下来更值得关注的是 ${followingCount} 个后续跟进项，优先推进最接近结果的那个。`;
  }

  return `当前待办已经完成 ${doneCount}/${totalCount}。今天更适合维持节奏，别急着再给自己加新的硬任务。`;
}
