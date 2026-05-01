import type { LlmInvocationStatsPayload } from '../../../services/api';
import {
  formatDiagnosticsDateTime,
  formatDiagnosticsNumber,
} from './format';

export function DiagnosticsFeatureSection({ stats }: { stats: LlmInvocationStatsPayload }) {
  return (
    <section className="domain-card diagnostics-section-card">
      <div className="diagnostics-section-head">
        <h2>功能分布</h2>
        <span>{stats.windowLabel || `近 ${stats.windowDays} 天`}</span>
      </div>
      <div className="diagnostics-table-list">
        {stats.byFeature.map((item) => (
          <div className="diagnostics-row" key={item.feature}>
            <div>
              <p className="diagnostics-row-title">{item.feature}</p>
              <p className="diagnostics-muted-text">最近调用：{formatDiagnosticsDateTime(item.lastInvokedAt)}</p>
            </div>
            <div className="diagnostics-row-stats">
              <span>{item.total} 次</span>
              <span>{item.successRate}%</span>
              <span>{formatDiagnosticsNumber(item.avgDurationMs)}ms</span>
            </div>
          </div>
        ))}
        {stats.byFeature.length === 0 ? <p className="diagnostics-muted-text">暂无调用记录。</p> : null}
      </div>
    </section>
  );
}

export function DiagnosticsModelSection({ stats }: { stats: LlmInvocationStatsPayload }) {
  return (
    <section className="domain-card diagnostics-section-card">
      <div className="diagnostics-section-head">
        <h2>模型分布</h2>
        <span>provider / model</span>
      </div>
      <div className="diagnostics-table-list">
        {stats.byModel.map((item) => (
          <div className="diagnostics-row" key={`${item.providerName}-${item.modelName}-${item.transport}`}>
            <div>
              <p className="diagnostics-row-title">{item.providerName} · {item.modelName}</p>
              <p className="diagnostics-muted-text">{item.transport} · 最近调用：{formatDiagnosticsDateTime(item.lastInvokedAt)}</p>
            </div>
            <div className="diagnostics-row-stats">
              <span>{item.total} 次</span>
              <span>{item.successRate}%</span>
              <span>{formatDiagnosticsNumber(item.totalTokens)} tokens</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DiagnosticsErrorSection({ stats }: { stats: LlmInvocationStatsPayload }) {
  return (
    <section className="domain-card diagnostics-section-card">
      <div className="diagnostics-section-head">
        <h2>错误分布</h2>
        <span>error_code</span>
      </div>
      <div className="diagnostics-error-list">
        {stats.errors.map((item) => (
          <div className="diagnostics-error-row" key={item.errorCode}>
            <span>{item.errorCode}</span>
            <strong>{item.total}</strong>
          </div>
        ))}
        {stats.errors.length === 0 ? <p className="diagnostics-muted-text">暂无错误记录。</p> : null}
      </div>
    </section>
  );
}

export function DiagnosticsRecentErrorSection({ stats }: { stats: LlmInvocationStatsPayload }) {
  return (
    <section className="domain-card diagnostics-section-card">
      <div className="diagnostics-section-head">
        <h2>最近失败样本</h2>
        <span>已脱敏</span>
      </div>
      <div className="diagnostics-table-list">
        {(stats.recentErrors || []).map((item) => (
          <div className="diagnostics-row diagnostics-error-sample-row" key={item.invocationId}>
            <div>
              <p className="diagnostics-row-title">{item.feature}</p>
              <p className="diagnostics-muted-text">
                {item.providerName} · {item.modelName} · {formatDiagnosticsDateTime(item.createdAt)}
              </p>
              <p className="diagnostics-error-message">{item.errorMessage || item.errorCode}</p>
            </div>
            <div className="diagnostics-row-stats">
              <span>{item.errorCode}</span>
              <span>{formatDiagnosticsNumber(item.durationMs)}ms</span>
              <span>{formatDiagnosticsNumber(item.totalTokens)} tokens</span>
            </div>
          </div>
        ))}
        {(stats.recentErrors || []).length === 0 ? <p className="diagnostics-muted-text">暂无失败样本。</p> : null}
      </div>
    </section>
  );
}
