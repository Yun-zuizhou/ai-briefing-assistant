import { Button } from '../../ui';
import type { PeriodicReportData } from '../../../types/page-data';
import { buildTrendBarWidth } from '../../../utils/reportPageFormatting';
import type { PeriodicReportTrend } from './contracts';

export function WeeklyReportTrendSections({
  reportData,
  onOpenHotspotDetail,
  onRecordThought,
}: {
  reportData: PeriodicReportData;
  onOpenHotspotDetail: (contentRef: string) => void;
  onRecordThought: () => void;
}) {
  return (
    <>
      {reportData.topicTrends.map((trend) => (
        <WeeklyReportTrendSection
          key={trend.id}
          trend={trend}
          onOpenHotspotDetail={onOpenHotspotDetail}
          onRecordThought={onRecordThought}
        />
      ))}
    </>
  );
}

function WeeklyReportTrendSection({
  trend,
  onOpenHotspotDetail,
  onRecordThought,
}: {
  trend: PeriodicReportTrend;
  onOpenHotspotDetail: (contentRef: string) => void;
  onRecordThought: () => void;
}) {
  return (
    <section className="report-section weekly-report-section weekly-report-stack-section">
      <div className={`section-header weekly-report-header ${trend.heatData.trend === 'up' ? 'weekly-report-header-up' : 'weekly-report-header-down'}`}>
        {trend.icon} {trend.title} · 周趋势
      </div>
      <div className="section-content">
        <div className="trend-heat">
          <div className="heat-label">📊 讨论热度变化</div>
          <div className="heat-bar-container">
            <progress
              className={`heat-bar weekly-trend-heat-bar ${trend.heatData.trend === 'up' ? 'is-up' : 'is-down'}`}
              value={Math.max(0, Math.min(trend.heatData.current, 100))}
              max={100}
              aria-label={`${trend.title} 热度`}
            />
          </div>
          <PeriodicReportHeatInfo trend={trend} sectionPrefix="weekly" />
        </div>

        <PeriodicReportHotspot
          detailButtonClassName="weekly-hotspot-detail-btn"
          hotspotLabel="🔥 本周热点"
          trend={trend}
          onOpenHotspotDetail={onOpenHotspotDetail}
        />

        <PeriodicReportInsights label="💡 趋势洞察" insights={trend.insights} />

        <div className="trend-actions">
          <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn" onClick={onRecordThought}>
            💬 记录本周感悟
          </Button>
        </div>
      </div>
    </section>
  );
}

export function MonthlyReportTrendSections({
  reportData,
  onOpenHotspotDetail,
  onRecordThought,
}: {
  reportData: PeriodicReportData;
  onOpenHotspotDetail: (contentRef: string) => void;
  onRecordThought: () => void;
}) {
  return (
    <>
      {reportData.topicTrends.map((trend) => (
        <MonthlyReportTrendSection
          key={trend.id}
          trend={trend}
          onOpenHotspotDetail={onOpenHotspotDetail}
          onRecordThought={onRecordThought}
        />
      ))}
    </>
  );
}

function MonthlyReportTrendSection({
  trend,
  onOpenHotspotDetail,
  onRecordThought,
}: {
  trend: PeriodicReportTrend;
  onOpenHotspotDetail: (contentRef: string) => void;
  onRecordThought: () => void;
}) {
  return (
    <section className="report-section monthly-report-section monthly-report-stack-section">
      <div className={`section-header monthly-report-header ${trend.heatData.trend === 'up' ? 'monthly-report-header-up' : 'monthly-report-header-down'}`}>
        {trend.icon} {trend.title} · 月度趋势
      </div>
      <div className="section-content">
        <div className="trend-heat">
          <div className="heat-label">📊 月度热度趋势</div>
          <div className="heat-chart">
            {([
              { label: '上期', value: trend.heatData.previous },
              { label: '本期', value: trend.heatData.current },
            ]).map((item) => {
              const barHeight = buildTrendBarWidth(item.value, Math.max(trend.heatData.current, trend.heatData.previous));
              return (
                <div
                  key={item.label}
                  className={`heat-chart-bar monthly-heat-chart-bar ${item.label === '本期' ? 'is-current' : 'is-previous'}`}
                >
                  <svg className="monthly-heat-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <rect
                      className="monthly-heat-chart-rect"
                      x="0"
                      y={Math.max(0, 100 - barHeight)}
                      width="100"
                      height={barHeight}
                      rx="8"
                      ry="8"
                    />
                  </svg>
                  <span className="heat-chart-label">{item.label}</span>
                </div>
              );
            })}
          </div>
          <PeriodicReportHeatInfo trend={trend} sectionPrefix="monthly" />
        </div>

        <PeriodicReportHotspot
          detailButtonClassName="monthly-hotspot-detail-btn"
          hotspotLabel="🔥 月度热点"
          trend={trend}
          onOpenHotspotDetail={onOpenHotspotDetail}
        />

        <PeriodicReportInsights label="💡 月度洞察" insights={trend.insights} />

        {trend.userAttentionChange ? (
          <div className="attention-change">
            <div className="attention-label">📈 你的关注变化</div>
            <p className="attention-text">
              本月你对{trend.title}的关注度提升了 <strong>{trend.userAttentionChange.change}%</strong>
            </p>
            {trend.userAttentionChange.newTopics.length > 0 ? (
              <p className="attention-new">
                新增关注主题：{trend.userAttentionChange.newTopics.join('、')}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="trend-actions">
          <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn" onClick={onRecordThought}>
            💬 记录月度感悟
          </Button>
        </div>
      </div>
    </section>
  );
}

function PeriodicReportHeatInfo({
  trend,
  sectionPrefix,
}: {
  trend: PeriodicReportTrend;
  sectionPrefix: 'weekly' | 'monthly';
}) {
  return (
    <div className="heat-info">
      <span>{trend.hotSpot.title}</span>
      <span className={`${sectionPrefix}-trend-change ${trend.heatData.trend === 'up' ? 'is-up' : 'is-down'}`}>
        {trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}
        {Math.abs(trend.heatData.change)}%
      </span>
    </div>
  );
}

function PeriodicReportHotspot({
  detailButtonClassName,
  hotspotLabel,
  trend,
  onOpenHotspotDetail,
}: {
  detailButtonClassName: string;
  hotspotLabel: string;
  trend: PeriodicReportTrend;
  onOpenHotspotDetail: (contentRef: string) => void;
}) {
  return (
    <div className="trend-hotspot">
      <div className="hotspot-label">{hotspotLabel}</div>
      <div className="hotspot-title">{trend.hotSpot.title}</div>
      {trend.hotSpot.contentRef ? (
        <Button
          type="button"
          variant="secondary"
          className={`trend-action-btn font-sans-cn ${detailButtonClassName}`}
          onClick={() => onOpenHotspotDetail(trend.hotSpot.contentRef as string)}
        >
          查看热点详情
        </Button>
      ) : null}
      <div className="hotspot-meta">
        讨论量：{trend.hotSpot.discussionCount}条 | 你的参与：{trend.hotSpot.userParticipation}条
      </div>
      <p className="hotspot-summary">{trend.hotSpot.summary}</p>
    </div>
  );
}

function PeriodicReportInsights({
  insights,
  label,
}: {
  insights: string[];
  label: string;
}) {
  return (
    <div className="trend-insights">
      <div className="insights-label">{label}</div>
      <ul className="insights-list">
        {insights.map((insight, i) => (
          <li key={i}>• {insight}</li>
        ))}
      </ul>
    </div>
  );
}
