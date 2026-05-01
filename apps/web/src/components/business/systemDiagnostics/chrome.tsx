import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

import { Button } from '../../ui';
import type { DiagnosticsWindow, DiagnosticsWindowOption } from '../../../types/diagnostics';

export function DiagnosticsGuardCard({
  onRefresh,
  onWindowChange,
  selectedWindow,
  windowOptions,
}: {
  onRefresh: () => void;
  onWindowChange: (value: DiagnosticsWindow) => void;
  selectedWindow: DiagnosticsWindow;
  windowOptions: readonly DiagnosticsWindowOption[];
}) {
  return (
    <section className="domain-card diagnostics-guard-card">
      <div className="diagnostics-card-head">
        <ShieldCheck size={18} />
        <div>
          <p className="diagnostics-card-title">内部观测入口</p>
          <p className="diagnostics-muted-text">
            这里只展示当前用户的 LLM 调用聚合，不展示 prompt、原始响应、API Key 或错误原文。
          </p>
        </div>
      </div>
      <div className="diagnostics-toolbar">
        <div className="diagnostics-window-tabs" aria-label="统计窗口">
          {windowOptions.map((item) => (
            <button
              type="button"
              key={item.value}
              className={item.value === selectedWindow ? 'active' : undefined}
              onClick={() => onWindowChange(item.value)}
              aria-pressed={item.value === selectedWindow}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" className="diagnostics-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} />
          刷新
        </Button>
      </div>
    </section>
  );
}

export function DiagnosticsErrorCard({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <section className="domain-card diagnostics-error-card">
      <div className="diagnostics-card-head">
        <AlertTriangle size={18} />
        <div>
          <p className="diagnostics-card-title">诊断数据不可用</p>
          <p className="diagnostics-muted-text">{error}</p>
        </div>
      </div>
    </section>
  );
}

export function DiagnosticsLoadingState({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <section className="domain-card diagnostics-state-card">
      <p className="diagnostics-muted-text">正在加载调用统计...</p>
    </section>
  );
}
