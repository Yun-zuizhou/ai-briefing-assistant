import { ExternalLink } from 'lucide-react';

import { Button } from '../../ui';
import type { ArticleRelatedItem, ArticleState } from '../../../types/article';

function getSummaryTitle(contentType?: string) {
  if (contentType === 'hot_topic') return '阅读判断';
  if (contentType === 'opportunity') return '机会摘要';
  return '内容摘要';
}

function getReadableContentMeta(activeArticle: ArticleState) {
  if (activeArticle.contentRole === 'original') {
    return {
      title: '原文内容',
      description: null,
      isPrimaryReading: true,
    };
  }

  if (activeArticle.contentRole === 'source_digest') {
    return {
      title: '来源摘要',
      description: activeArticle.isPlaceholderSource
        ? '当前演示源尚未接入完整原文，这里展示的是来源材料的整理摘要。'
        : '这条热点尚未接入完整原文，这里展示的是已入库的来源材料摘要。',
      isPrimaryReading: false,
    };
  }

  if (activeArticle.contentRole === 'opportunity_detail') {
    return {
      title: '机会详情',
      description: activeArticle.isPlaceholderSource
        ? '当前为本地演示来源，以下内容来自种子数据。'
        : null,
      isPrimaryReading: false,
    };
  }

  return {
    title: '正文内容',
    description: activeArticle.isPlaceholderSource
      ? '当前为本地演示来源，以下内容来自种子数据。'
      : null,
    isPrimaryReading: true,
  };
}

function ArticleSourceLinkCard({
  activeArticle,
  onOpenOriginal,
}: {
  activeArticle: ArticleState;
  onOpenOriginal: () => void;
}) {
  if (!activeArticle.url) return null;

  return (
    <div className="article-source-link-card">
      <div>
        <h3 className="article-block-title">原文链接</h3>
        <p className="article-block-desc">
          {activeArticle.isPlaceholderSource
            ? '当前为演示来源地址，用于占位真实原文入口。'
            : '阅读正文后可打开来源页，核对发布时间、作者和上下文。'}
        </p>
      </div>
      <Button onClick={onOpenOriginal} variant="primary" className="article-source-link-btn">
        <ExternalLink size={16} />
        打开原文
      </Button>
    </div>
  );
}

function ArticleOpportunityCard({
  activeArticle,
  onCreateTodo,
}: {
  activeArticle: ArticleState;
  onCreateTodo: () => void;
}) {
  if (activeArticle.contentType !== 'opportunity') return null;

  return (
    <div className="article-opportunity-card">
      <h3 className="article-block-title">行动入口</h3>
      <p className="article-block-desc">
        机会型内容可以转交给待办系统继续管理，详情页只保留来源和上下文。
      </p>
      <Button
        onClick={onCreateTodo}
        variant="primary"
        className="article-opportunity-btn"
      >
        转成待办
      </Button>
    </div>
  );
}

export function ArticleBodySections({
  activeArticle,
  onCreateTodo,
  onOpenOriginal,
  onRelatedClick,
  readingSizeClass,
}: {
  activeArticle: ArticleState;
  onCreateTodo: () => void;
  onOpenOriginal: () => void;
  onRelatedClick: (item: ArticleRelatedItem) => void;
  readingSizeClass: string;
}) {
  const summaryTitle = getSummaryTitle(activeArticle.contentType);
  const readableContent = getReadableContentMeta(activeArticle);

  return (
    <>
      <ArticleOpportunityCard activeArticle={activeArticle} onCreateTodo={onCreateTodo} />

      {activeArticle.summary ? (
        <div className="article-section-card">
          <h3 className="article-block-title">{summaryTitle}</h3>
          <p className={`article-block-text ${readingSizeClass}`}>{activeArticle.summary}</p>
        </div>
      ) : null}

      {activeArticle.content ? (
        <div className={`article-section-card ${readableContent.isPrimaryReading ? 'article-reading-card' : ''}`}>
          <h3 className="article-block-title">{readableContent.title}</h3>
          {readableContent.description ? (
            <p className="article-block-desc">{readableContent.description}</p>
          ) : null}
          <div className={`article-content-text ${readingSizeClass}`}>
            {activeArticle.content}
          </div>
        </div>
      ) : activeArticle.detailState === 'partial' ? (
        <div className="article-section-card">
          <h3 className="article-block-title">正文内容</h3>
          <p className="article-block-desc">
            当前还没有可展示的正文内容，你可以先查看摘要、来源和相关推荐，稍后再回来继续阅读。
          </p>
        </div>
      ) : null}

      <ArticleSourceLinkCard activeArticle={activeArticle} onOpenOriginal={onOpenOriginal} />

      {activeArticle.tags && activeArticle.tags.length > 0 ? (
        <div className="article-section-card">
          <h3 className="article-block-title">标签</h3>
          <div className="article-tag-list">
            {activeArticle.tags.map((tag) => (
              <span key={tag} className="article-tag-chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {activeArticle.relatedItems && activeArticle.relatedItems.length > 0 ? (
        <div className="article-related-card">
          <h3 className="article-block-title">相关推荐</h3>
          <div className="article-related-list">
            {activeArticle.relatedItems.map((item) => (
              <Button
                key={item.contentRef}
                type="button"
                variant="unstyled"
                onClick={() => onRelatedClick(item)}
                className="article-related-item"
              >
                <div className="article-related-head">
                  <span className="article-related-source">
                    {item.display.sourceLabel}
                  </span>
                  <span className="article-related-label">相关推荐</span>
                </div>
                <div className="article-related-title">
                  {item.title}
                </div>
                {item.summary ? (
                  <p className="article-related-summary">
                    {item.summary}
                  </p>
                ) : null}
                {item.relationReason ? (
                  <p className="article-related-reason">
                    关联原因：{item.relationReason}
                  </p>
                ) : null}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
