import type { PeriodicReportData } from '../../../types/page-data';

export function WeeklyReportOverviewSection({ reportData }: { reportData: PeriodicReportData }) {
  return (
    <section className="report-section weekly-report-section">
      <div className="section-header weekly-report-header weekly-report-header-gold">
        📈 本周概览
      </div>
      <div className="section-content">
        <PeriodicReportOverviewStats reportData={reportData} sectionPrefix="weekly" />
        <div className="weekly-overview-streak-wrap">
          <div className="streak-badge">
            🔥 连续打卡 {reportData.overview.streak} 天
          </div>
        </div>
      </div>
    </section>
  );
}

export function MonthlyReportOverviewSection({ reportData }: { reportData: PeriodicReportData }) {
  return (
    <section className="report-section monthly-report-section">
      <div className="section-header monthly-report-header monthly-report-header-gold">
        📈 本月概览
      </div>
      <div className="section-content">
        <PeriodicReportOverviewStats reportData={reportData} sectionPrefix="monthly" />
        <div className="monthly-overview-streak-wrap">
          <div className="streak-badge">
            🔥 连续打卡 {reportData.overview.streak} 天
          </div>
        </div>
      </div>
    </section>
  );
}

function PeriodicReportOverviewStats({
  reportData,
  sectionPrefix,
}: {
  reportData: PeriodicReportData;
  sectionPrefix: 'weekly' | 'monthly';
}) {
  const stats = [
    { label: '关注', value: reportData.overview.viewed },
    { label: '记录', value: reportData.overview.recorded, className: `${sectionPrefix}-overview-recorded` },
    { label: '收藏', value: reportData.overview.collected, className: `${sectionPrefix}-overview-collected` },
    { label: '完成', value: reportData.overview.completed, className: `${sectionPrefix}-overview-completed` },
  ];

  return (
    <div className="overview-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="overview-stat">
          <div className={`overview-value${stat.className ? ` ${stat.className}` : ''}`}>{stat.value}</div>
          <div className="overview-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
