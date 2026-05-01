export function getEvidenceTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    note: '记录',
    favorite: '收藏',
    todo: '待办',
    history_entry: '历史',
    article: '文章',
    hot_topic: '热点',
    opportunity: '机会',
    summary_result: '摘要',
    briefing: '简报',
  };
  return type ? labels[type] || type : '证据';
}

export function formatConfidenceLabel(confidence?: string) {
  if (confidence === 'high') return '高';
  if (confidence === 'medium') return '中';
  if (confidence === 'low') return '低';
  return confidence ?? '待评估';
}

export function buildTrendBarWidth(value: number, baseline: number) {
  if (baseline <= 0) {
    return value > 0 ? 100 : 22;
  }
  return Math.max(22, Math.round((value / baseline) * 100));
}
