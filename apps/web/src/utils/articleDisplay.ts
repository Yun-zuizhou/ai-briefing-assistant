import type { ArticleDisplayMeta, ArticleRelatedItem, ArticleRelatedItemInput, ArticleState, ArticleStateInput } from '../types/article';
import { formatContentCategoryLabel, formatContentTypeLabel } from './contentLabels';

function inferContentTypeFromRef(contentRef?: string): string | null {
  const [refType, refId] = contentRef?.split(':') ?? [];
  return refType && refId ? refType : null;
}

function buildDisplayMeta({
  category,
  contentRef,
  contentType,
  source,
}: {
  category?: string | null;
  contentRef?: string | null;
  contentType?: string | null;
  source?: string | null;
}): ArticleDisplayMeta {
  const resolvedContentType = contentType || inferContentTypeFromRef(contentRef ?? undefined);
  return {
    categoryLabel: formatContentCategoryLabel(category, resolvedContentType),
    sourceLabel: source?.trim() || formatContentTypeLabel(resolvedContentType),
  };
}

export function normalizeArticleRelatedItem(item: ArticleRelatedItemInput): ArticleRelatedItem {
  return {
    ...item,
    display: item.display ?? buildDisplayMeta({
      contentRef: item.contentRef,
      contentType: item.contentType,
      source: item.sourceName,
    }),
  };
}

export function normalizeArticleState(article: ArticleStateInput): ArticleState {
  const relatedItems = article.relatedItems?.map(normalizeArticleRelatedItem);
  return {
    ...article,
    display: article.display ?? buildDisplayMeta({
      category: article.category,
      contentRef: article.contentRef,
      contentType: article.contentType,
      source: article.source,
    }),
    relatedItems,
  };
}
