import type { ReactNode } from 'react';
import { Calendar, MessageCircle, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react';

import { Button } from '../../ui';
import type { AnnualReportData } from '../../../types/page-data';
import { formatConfidenceLabel, getEvidenceTypeLabel } from '../../../utils/reportPageFormatting';
import { ReportActionBar } from './shared';
import type { ReportAiStatusView } from './contracts';

export function AnnualReportStateCard({
  annualReport,
  error,
  loading,
}: {
  annualReport: AnnualReportData | null;
  error: string | null;
  loading: boolean;
}) {
  if (error) {
    return (
      <div className="domain-card annual-error-card">
        <p className="annual-error-text">{error}</p>
        <p className="annual-error-note">当前不会再展示伪年度报告内容，请稍后重试。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="domain-card annual-state-card">
        <p className="annual-state-text">年度报告加载中...</p>
      </div>
    );
  }

  if (!annualReport) {
    return (
      <div className="domain-card annual-state-card is-empty">
        <p className="annual-state-title">当前还没有正式生成的年度报告。</p>
        <p className="annual-state-text">等年度报告正式生成后，这里再展示真实统计、关键词与回看内容。</p>
      </div>
    );
  }

  return null;
}

export function AnnualReportQualityCard({
  annualReport,
}: {
  annualReport: AnnualReportData;
}) {
  const dataQuality = annualReport.dataQuality;
  if (!dataQuality) return null;

  return (
    <div className="domain-card annual-quality-card">
      <p className={`annual-quality-title${dataQuality.insufficientData ? ' is-warning' : ''}`}>
        数据可信度：{formatConfidenceLabel(dataQuality.confidence)}
      </p>
      <p className="annual-quality-text">
        {dataQuality.insufficientData
          ? '当前年度报告已经切到真实数据口径，但样本仍偏少，因此只展示已确认事实。'
          : `当前年度报告基于 ${dataQuality.evidence.join('，')}。`}
      </p>
    </div>
  );
}

export function AnnualReportHero({
  annualReport,
  loading,
}: {
  annualReport: AnnualReportData | null;
  loading: boolean;
}) {
  return (
    <div className="annual-hero">
      <span className="annual-hero-frame" />
      <div className="annual-hero-icon" aria-hidden="true">📖</div>
      <h2 className="type-page-title annual-hero-title">
        我的时代印记
      </h2>
      <p className="type-hero-copy annual-hero-subtitle">
        {loading ? '年度报告加载中...' : annualReport ? '记录你在时代中的每一次思考' : '等待正式年度报告生成'}
      </p>
    </div>
  );
}

export function AnnualReportContent({
  aiStatus,
  annualReport,
  refreshing,
  onOpenExport,
  onOpenShare,
  onRefresh,
}: {
  aiStatus: ReportAiStatusView;
  annualReport: AnnualReportData;
  refreshing: boolean;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <AnnualReportQualityCard annualReport={annualReport} />

      <AnnualReportSection title="年度智能解读" icon={<Sparkles size={16} />} tone="ink">
        <AnnualReportAiSection
          aiStatus={aiStatus}
          annualReport={annualReport}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </AnnualReportSection>

      <AnnualReportSection title="这一年，你见证了" icon={<TrendingUp size={16} />} tone="ink">
        <div className="annual-overview-grid">
          <AnnualReportStatItem number={annualReport.stats.topicsViewed} label="热点" />
          <AnnualReportStatItem number={annualReport.stats.opinionsPosted} label="观点" />
          <AnnualReportStatItem number={annualReport.stats.plansCompleted} label="计划" />
        </div>
        <div className="annual-active-days">
          <Calendar size={16} className="annual-active-days-icon" />
          <p className="annual-active-days-text">
            活跃了 <span className="annual-active-days-number">{annualReport.stats.daysActive}</span> 天
          </p>
        </div>
      </AnnualReportSection>

      <AnnualReportSection title="你最关注的领域" icon={<Target size={16} />} tone="accent">
        <div className="annual-chip-list">
          {annualReport.interests.map((interest, i) => (
            <span key={interest} className={`annual-chip ${getAnnualToneClass(i)}`}>
              #{interest}
            </span>
          ))}
        </div>
      </AnnualReportSection>

      <AnnualReportSection title="你的思考轨迹" icon={<Sparkles size={16} />} tone="ink">
        <p className="annual-paragraph">{annualReport.thinkingSection}</p>
      </AnnualReportSection>

      <AnnualReportSection title="你的行动足迹" icon={<Target size={16} />} tone="ink">
        <p className="annual-paragraph">{annualReport.actionSection}</p>
      </AnnualReportSection>

      <AnnualReportSection title="年度关键词" icon={<MessageCircle size={16} />} tone="gold">
        <div className="annual-keyword-box">
          <div className="annual-chip-list annual-keyword-list">
            {annualReport.keywords.map((keyword, i) => (
              <span key={keyword} className={`annual-chip annual-keyword-chip ${getAnnualToneClass(i)}`}>
                <span>{keyword}</span>
              </span>
            ))}
          </div>
        </div>
      </AnnualReportSection>

      <AnnualReportSection title="结语" icon={<Sparkles size={16} />} tone="ink">
        <p className="annual-paragraph">{annualReport.closing}</p>
      </AnnualReportSection>

      <ReportActionBar
        className="annual-actions"
        exportLabel="导出年度报告"
        primaryButtonClassName="report-action-btn annual-action-btn is-primary"
        secondaryButtonClassName="report-action-btn annual-action-btn"
        shareLabel="分享年度报告"
        onOpenExport={onOpenExport}
        onOpenShare={onOpenShare}
      />
    </>
  );
}

function AnnualReportSection({
  title,
  children,
  icon,
  tone,
}: {
  title: string;
  children: ReactNode;
  icon: ReactNode;
  tone: 'ink' | 'accent' | 'gold';
}) {
  return (
    <section className="report-section annual-section">
      <div className={`section-header annual-section-header tone-${tone}`}>
        {icon}
        <h3 className="type-content-title annual-section-title">
          {title}
        </h3>
      </div>
      <div className="section-content annual-section-content">{children}</div>
    </section>
  );
}

function AnnualReportStatItem({ number, label }: { number: number; label: string }) {
  return (
    <div className="annual-overview-stat">
      <div className="type-stat-number annual-overview-number">{number}</div>
      <div className="annual-overview-label">{label}</div>
    </div>
  );
}

function getAnnualToneClass(index: number): string {
  if (index === 0) return 'tone-accent';
  if (index === 1) return 'tone-gold';
  return 'tone-ink';
}

export function AnnualReportAiSection({
  aiStatus,
  annualReport,
  refreshing,
  onRefresh,
}: {
  aiStatus: ReportAiStatusView;
  annualReport: AnnualReportData;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const llmBlocks = annualReport.annualLlmBlocks;

  return (
    <div className="report-ai-content">
      <div className="report-ai-topline">
        <div className="report-ai-copy">
          <p className="report-ai-title">
            {aiStatus.title}
          </p>
          <p className="report-ai-meta">
            {aiStatus.detail}
          </p>
        </div>
        {aiStatus.canRegenerate ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="report-ai-refresh-btn"
            onClick={onRefresh}
            loading={refreshing}
            loadingLabel={aiStatus.loadingLabel}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{aiStatus.actionLabel}</span>
          </Button>
        ) : null}
      </div>

      {llmBlocks ? (
        <>
          <div className="report-ai-summary-grid annual-ai-summary-grid">
            <div className="report-ai-summary-item">
              <span className="report-ai-label">思考总结</span>
              <p>{llmBlocks.thinkingSummary}</p>
            </div>
            <div className="report-ai-summary-item">
              <span className="report-ai-label">行动总结</span>
              <p>{llmBlocks.actionSummary}</p>
            </div>
            <div className="report-ai-summary-item annual-ai-summary-wide">
              <span className="report-ai-label">年终洞察</span>
              <p>{llmBlocks.yearEndInsight}</p>
            </div>
          </div>
          <div className="report-ai-note">{llmBlocks.dataNote}</div>
          {llmBlocks.nextYearActions.length > 0 ? (
            <div className="report-ai-actions">
              {llmBlocks.nextYearActions.map((action) => (
                <p key={action} className="report-ai-action-item">{action}</p>
              ))}
            </div>
          ) : null}
          {llmBlocks.evidenceRefs.length > 0 ? (
            <div className="report-ai-evidence-list">
              {llmBlocks.evidenceRefs.map((item, index) => (
                <div key={`${item.refType}-${item.refId ?? item.resultRef ?? item.sourceUrl ?? index}`} className="report-ai-evidence-item">
                  <div className="report-ai-evidence-head">
                    <span>{getEvidenceTypeLabel(item.refType)}</span>
                    <span>{item.refId ? `#${item.refId}` : item.resultRef || item.sourceUrl || '来源'}</span>
                  </div>
                  <p className="report-ai-evidence-title">{item.title || item.snippet || '未命名依据'}</p>
                  {item.reason ? <p className="report-ai-evidence-reason">{item.reason}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="report-ai-empty-text">这份年报当前只展示基础汇总。生成年度智能解读后，会在这里展示思考总结、行动总结、下一年建议和依据来源。</p>
      )}
    </div>
  );
}
