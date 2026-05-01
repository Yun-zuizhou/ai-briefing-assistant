import type { PeriodicReportData } from '../../../types/page-data';

export function WeeklyReportGrowthSection({ reportData }: { reportData: PeriodicReportData }) {
  return (
    <section className="report-section weekly-report-section weekly-report-stack-section">
      <div className="section-header weekly-report-header weekly-report-header-ink">
        📖 我的成长 · 周回顾
      </div>
      <div className="section-content">
        <div className="growth-stats">
          <PeriodicGrowthStat label="关注" value={reportData.growth.stats.viewed} />
          <PeriodicGrowthStat label="记录" value={reportData.growth.stats.recorded} />
          <PeriodicGrowthStat label="收藏" value={reportData.growth.stats.collected} />
          <PeriodicGrowthStat label="完成" value={reportData.growth.stats.completed} />
        </div>

        <div className="growth-trajectory weekly-growth-trajectory">
          <div className="trajectory-label">🎯 成长轨迹</div>
          <div className="trajectory-title">{reportData.growth.trajectory.title}</div>
          <p className="trajectory-description">{reportData.growth.trajectory.description}</p>
        </div>

        <PeriodicReportThoughts
          emptyText="当前还没有可引用的真实记录。"
          label="💭 本周想法记录"
          reportData={reportData}
          sectionPrefix="weekly"
        />

        <PeriodicReportSuggestions label="🎯 下周建议" suggestions={reportData.growth.suggestions} />
      </div>
    </section>
  );
}

export function MonthlyReportGrowthSection({ reportData }: { reportData: PeriodicReportData }) {
  return (
    <section className="report-section monthly-report-section monthly-report-stack-section">
      <div className="section-header monthly-report-header monthly-report-header-ink">
        📖 我的成长 · 月度回顾
      </div>
      <div className="section-content">
        {reportData.growth.comparison ? (
          <div className="growth-comparison">
            <div className="comparison-label">📊 月度数据对比</div>
            <div className="comparison-table">
              <div className="comparison-row comparison-header">
                <span />
                <span>本月</span>
                <span>上月</span>
                <span>变化</span>
              </div>
              {[
                { label: '关注', index: 0 },
                { label: '记录', index: 1 },
                { label: '收藏', index: 2 },
                { label: '完成', index: 3 },
              ].map((item) => {
                const change = reportData.growth.comparison?.change[item.index] ?? 0;
                return (
                  <div key={item.label} className="comparison-row">
                    <span>{item.label}</span>
                    <span>{reportData.growth.comparison?.current[item.index] ?? 0}</span>
                    <span>{reportData.growth.comparison?.previous[item.index] ?? 0}</span>
                    <span className={`monthly-comparison-change ${change >= 0 ? 'is-up' : 'is-down'}`}>
                      {change >= 0 ? '↑' : '↓'}{Math.abs(change)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="growth-trajectory monthly-growth-trajectory">
          <div className="trajectory-label">🎯 成长轨迹</div>
          <div className="trajectory-title">{reportData.growth.trajectory.title}</div>
          <p className="trajectory-description">{reportData.growth.trajectory.description}</p>
          <div className="trajectory-keywords">
            {reportData.growth.trajectory.keywords.map((keyword, i) => (
              <span key={i} className="trajectory-keyword">{keyword}</span>
            ))}
          </div>
        </div>

        <PeriodicReportThoughts
          emptyText="当前还没有足够的月度想法可展示。"
          label="💭 月度想法精选"
          reportData={reportData}
          sectionPrefix="monthly"
        />

        <PeriodicReportSuggestions label="🎯 下月建议" suggestions={reportData.growth.suggestions} />
      </div>
    </section>
  );
}

function PeriodicGrowthStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="growth-stat-item">
      <div className="growth-stat-label">{label}</div>
      <div className="growth-stat-value">{value}</div>
    </div>
  );
}

function PeriodicReportThoughts({
  emptyText,
  label,
  reportData,
  sectionPrefix,
}: {
  emptyText: string;
  label: string;
  reportData: PeriodicReportData;
  sectionPrefix: 'weekly' | 'monthly';
}) {
  return (
    <div className="growth-thoughts">
      <div className="thoughts-label">{label}</div>
      {reportData.growth.selectedThoughts.length > 0 ? reportData.growth.selectedThoughts.map((thought) => (
        <div key={thought.id} className="thought-item">
          <span className="thought-date">{thought.date}</span>
          <span className="thought-content">"{thought.content}"</span>
        </div>
      )) : (
        <p className={`${sectionPrefix}-growth-empty`}>{emptyText}</p>
      )}
    </div>
  );
}

function PeriodicReportSuggestions({
  label,
  suggestions,
}: {
  label: string;
  suggestions: string[];
}) {
  return (
    <div className="growth-suggestions">
      <div className="suggestions-label">{label}</div>
      <ul className="suggestions-list">
        {suggestions.map((suggestion, i) => (
          <li key={i}>• {suggestion}</li>
        ))}
      </ul>
    </div>
  );
}
