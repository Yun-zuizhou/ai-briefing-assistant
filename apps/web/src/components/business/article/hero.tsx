import { Clock, User } from 'lucide-react';

import type { ArticleState } from '../../../types/article';

export function ArticleHero({
  activeArticle,
  loadingDetail,
  readingProgress,
}: {
  activeArticle: ArticleState;
  loadingDetail: boolean;
  readingProgress: number;
}) {
  return (
    <div className="article-hero-card">
      <span className="article-hero-frame" />

      {activeArticle.display.categoryLabel ? (
        <span className="article-category-chip">
          {activeArticle.display.categoryLabel}
        </span>
      ) : null}

      <h1 className="type-content-title article-hero-title">
        {activeArticle.title}
      </h1>

      <div className="article-hero-meta">
        <span className="article-hero-meta-item">
          <User size={12} />
          {activeArticle.display.sourceLabel}
        </span>
        {loadingDetail ? <span>加载中...</span> : null}
        <span className="article-hero-meta-item">
          <Clock size={12} />
          阅读进度 {readingProgress}%
        </span>
      </div>
      {(activeArticle.author || activeArticle.publishedAt) ? (
        <div className="article-hero-author">
          {activeArticle.author ? `作者：${activeArticle.author}` : '作者信息暂缺'}
          {activeArticle.publishedAt ? ` · 发布时间：${new Date(activeArticle.publishedAt).toLocaleString('zh-CN')}` : ''}
        </div>
      ) : null}
    </div>
  );
}

export function ArticlePartialNote({ activeArticle }: { activeArticle: ArticleState }) {
  if (activeArticle.detailState !== 'partial') return null;

  return (
    <div className="article-partial-note">
      <p className="article-partial-title">
        当前内容仍在持续补充
      </p>
      <p className="article-partial-text">
        {activeArticle.detailStateReason || '正文、来源或相关推荐还在陆续补齐中，这里先展示已经确认可用的内容。'}
      </p>
    </div>
  );
}
