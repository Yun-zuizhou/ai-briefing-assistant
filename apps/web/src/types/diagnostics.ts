export const DIAGNOSTICS_WINDOW_OPTIONS = [
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
] as const;

export type DiagnosticsWindow = typeof DIAGNOSTICS_WINDOW_OPTIONS[number]['value'];

export interface DiagnosticsWindowOption {
  label: string;
  value: DiagnosticsWindow;
}
