import { Activity, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

import type { BriefingDispatchStatsPayload } from '../../../services/api';
import {
  formatDiagnosticsDateTime,
  formatDiagnosticsNumber,
} from './format';
import { DiagnosticsMetricCard } from './metrics';

export function DiagnosticsDispatchSections({ dispatchStats }: { dispatchStats: BriefingDispatchStatsPayload }) {
  return (
    <>
      <section className="diagnostics-metric-grid">
        <DiagnosticsMetricCard label="调度总数" value={formatDiagnosticsNumber(dispatchStats.totals.total)} icon={<Activity size={18} />} />
        <DiagnosticsMetricCard label="生成成功" value={formatDiagnosticsNumber(dispatchStats.totals.success)} icon={<ShieldCheck size={18} />} />
        <DiagnosticsMetricCard label="跳过" value={formatDiagnosticsNumber(dispatchStats.totals.skipped)} icon={<RefreshCw size={18} />} />
        <DiagnosticsMetricCard label="调度失败" value={formatDiagnosticsNumber(dispatchStats.totals.error)} icon={<AlertTriangle size={18} />} />
      </section>

      <section className="domain-card diagnostics-section-card">
        <div className="diagnostics-section-head">
          <h2>简报调度</h2>
          <span>{dispatchStats.windowLabel}</span>
        </div>
        <div className="diagnostics-table-list">
          {dispatchStats.byTrigger.map((item) => (
            <div className="diagnostics-row" key={item.triggerSource}>
              <div>
                <p className="diagnostics-row-title">{item.triggerSource}</p>
                <p className="diagnostics-muted-text">最近执行：{formatDiagnosticsDateTime(item.lastOccurredAt)}</p>
              </div>
              <div className="diagnostics-row-stats">
                <span>{item.total} 次</span>
                <span>成功 {item.success}</span>
                <span>跳过 {item.skipped}</span>
                <span>失败 {item.error}</span>
              </div>
            </div>
          ))}
          {dispatchStats.byTrigger.length === 0 ? <p className="diagnostics-muted-text">暂无调度记录。</p> : null}
        </div>
      </section>

      <section className="domain-card diagnostics-section-card">
        <div className="diagnostics-section-head">
          <h2>最近调度样本</h2>
          <span>briefing_dispatch_logs</span>
        </div>
        <div className="diagnostics-table-list">
          {dispatchStats.recentDispatches.map((item) => (
            <div className="diagnostics-row diagnostics-error-sample-row" key={item.id}>
              <div>
                <p className="diagnostics-row-title">{item.briefingType} · {item.status}</p>
                <p className="diagnostics-muted-text">
                  {item.triggerSource} · 计划 {item.scheduledFor || '-'} · {formatDiagnosticsDateTime(item.createdAt)}
                </p>
                <p className="diagnostics-error-message">{item.summary || '无调度摘要'}</p>
              </div>
              <div className="diagnostics-row-stats">
                <span>#{item.id}</span>
                <span>{item.status}</span>
              </div>
            </div>
          ))}
          {dispatchStats.recentDispatches.length === 0 ? <p className="diagnostics-muted-text">暂无调度样本。</p> : null}
        </div>
      </section>
    </>
  );
}
