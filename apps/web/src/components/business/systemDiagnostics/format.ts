export function formatDiagnosticsNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('zh-CN');
}

export function formatDiagnosticsDateTime(value: string | null | undefined) {
  if (!value) return '暂无';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
