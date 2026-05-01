import { Activity, AlertTriangle, BarChart3 } from 'lucide-react';

import type { BriefingDispatchStatsPayload, LlmInvocationStatsPayload } from '../../../services/api';
import { DiagnosticsDispatchSections } from './dispatchSections';
import {
  DiagnosticsErrorSection,
  DiagnosticsFeatureSection,
  DiagnosticsModelSection,
  DiagnosticsRecentErrorSection,
} from './llmSections';
import { DiagnosticsMetricCard } from './metrics';
import { formatDiagnosticsNumber } from './format';

export function DiagnosticsContent({
  dispatchStats,
  stats,
}: {
  dispatchStats: BriefingDispatchStatsPayload | null;
  stats: LlmInvocationStatsPayload | null;
}) {
  if (!stats) return null;

  return (
    <>
      <section className="diagnostics-metric-grid">
        <DiagnosticsMetricCard label="总调用" value={formatDiagnosticsNumber(stats.totals.total)} icon={<Activity size={18} />} />
        <DiagnosticsMetricCard label="成功率" value={`${stats.totals.successRate}%`} icon={<BarChart3 size={18} />} />
        <DiagnosticsMetricCard label="失败" value={formatDiagnosticsNumber(stats.totals.error)} icon={<AlertTriangle size={18} />} />
        <DiagnosticsMetricCard label="累计 Token" value={formatDiagnosticsNumber(stats.totals.totalTokens)} icon={<BarChart3 size={18} />} />
      </section>

      <DiagnosticsFeatureSection stats={stats} />
      <DiagnosticsModelSection stats={stats} />
      <DiagnosticsErrorSection stats={stats} />
      <DiagnosticsRecentErrorSection stats={stats} />

      {dispatchStats ? <DiagnosticsDispatchSections dispatchStats={dispatchStats} /> : null}
    </>
  );
}
