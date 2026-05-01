import type { ReactNode } from 'react';

export function DiagnosticsMetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="domain-card diagnostics-metric-card">
      <div className="diagnostics-metric-icon">{icon}</div>
      <div>
        <p className="diagnostics-metric-value">{value}</p>
        <p className="diagnostics-muted-text">{label}</p>
      </div>
    </div>
  );
}
