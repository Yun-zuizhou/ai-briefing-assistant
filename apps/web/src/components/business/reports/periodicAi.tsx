import { RefreshCw } from 'lucide-react';

import { Button } from '../../ui';
import type { PeriodicReportData } from '../../../types/page-data';
import { getEvidenceTypeLabel } from '../../../utils/reportPageFormatting';
import type { ReportAiStatusView } from './contracts';

export function PeriodicReportAiSection({
  aiStatus,
  periodLabel,
  reportData,
  reportKind,
  refreshing,
  sectionPrefix,
  onRefresh,
}: {
  aiStatus: ReportAiStatusView;
  periodLabel: string;
  reportData: PeriodicReportData;
  reportKind: '周报' | '月报';
  refreshing: boolean;
  sectionPrefix: 'weekly' | 'monthly';
  onRefresh: () => void;
}) {
  const llmBlocks = reportData.llmBlocks;

  return (
    <section className={`report-section report-ai-section ${sectionPrefix}-report-section ${sectionPrefix}-report-stack-section`}>
      <div className={`section-header ${sectionPrefix}-report-header ${sectionPrefix}-report-header-ai`}>
        {reportKind}智能解读
      </div>
      <div className="section-content report-ai-content">
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
            <div className="report-ai-summary-grid">
              <div className="report-ai-summary-item">
                <span className="report-ai-label">趋势解释</span>
                <p>{llmBlocks.trendExplanation}</p>
              </div>
              <div className="report-ai-summary-item">
                <span className="report-ai-label">周期总结</span>
                <p>{llmBlocks.periodSummary}</p>
              </div>
            </div>
            <div className="report-ai-note">{llmBlocks.dataNote}</div>
            {llmBlocks.nextActions.length > 0 ? (
              <div className="report-ai-actions">
                {llmBlocks.nextActions.map((action) => (
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
          <p className="report-ai-empty-text">这份{periodLabel}当前只展示基础汇总。生成智能解读后，会在这里展示趋势解释、周期总结、下一步建议和依据来源。</p>
        )}
      </div>
    </section>
  );
}
