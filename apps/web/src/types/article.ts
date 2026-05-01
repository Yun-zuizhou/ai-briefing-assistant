export interface ArticleDisplayMeta {
  categoryLabel: string;
  sourceLabel: string;
}

export interface ArticleRelatedItemInput {
  contentRef: string;
  contentType: 'hot_topic' | 'article' | 'opportunity';
  id: string | number;
  title: string;
  summary?: string | null;
  sourceName?: string;
  sourceUrl?: string;
  display?: ArticleDisplayMeta;
  relationReason?: string | null;
}

export interface ArticleRelatedItem extends ArticleRelatedItemInput {
  display: ArticleDisplayMeta;
}

export interface ArticleStateInput {
  contentRef?: string;
  id: string;
  title: string;
  source?: string;
  url?: string;
  summary?: string | null;
  content?: string | null;
  category?: string;
  contentType?: string;
  display?: ArticleDisplayMeta;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  detailState?: 'formal' | 'partial';
  detailStateReason?: string | null;
  missingFields?: string[];
  relatedItems?: ArticleRelatedItemInput[];
}

export interface ArticleState extends ArticleStateInput {
  display: ArticleDisplayMeta;
  relatedItems?: ArticleRelatedItem[];
}

export type ArticleFontSize = 'small' | 'medium' | 'large';
