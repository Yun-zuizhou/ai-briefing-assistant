export const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: '文章',
  hot_topic: '热点',
  opportunity: '机会',
  note: '记录',
  briefing: '简报',
  summary_result: '摘要',
};

export function formatContentTypeLabel(value?: string | null): string {
  if (!value) return '内容';
  return CONTENT_TYPE_LABELS[value] ?? '内容';
}

function isTechnicalContentToken(value: string): boolean {
  return /^[a-z][a-z0-9_:-]*$/.test(value) && /[_:]/.test(value);
}

export function formatContentCategoryLabel(
  category?: string | null,
  contentType?: string | null,
): string {
  const normalizedCategory = category?.trim();
  if (!normalizedCategory) {
    return formatContentTypeLabel(contentType);
  }

  if (CONTENT_TYPE_LABELS[normalizedCategory]) {
    return CONTENT_TYPE_LABELS[normalizedCategory];
  }

  if (isTechnicalContentToken(normalizedCategory)) {
    return formatContentTypeLabel(contentType);
  }

  return normalizedCategory;
}

export function formatContentCategoryLabels(
  categories?: Array<string | null | undefined> | null,
  contentType?: string | null,
): string[] {
  const labels = (categories ?? [])
    .map((category) => formatContentCategoryLabel(category, contentType))
    .filter((label) => label.length > 0);
  const uniqueLabels = Array.from(new Set(labels));
  return uniqueLabels.length > 0 ? uniqueLabels : [formatContentTypeLabel(contentType)];
}
