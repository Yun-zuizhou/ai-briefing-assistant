import { Button } from '../../ui';
import type { ArticleRelatedItem, ArticleState } from '../../../types/article';

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
  onRelatedClick,
  readingSizeClass,
}: {
  activeArticle: ArticleState;
  onCreateTodo: () => void;
  onRelatedClick: (item: ArticleRelatedItem) => void;
  readingSizeClass: string;
}) {
  return (
    <>
      <ArticleOpportunityCard activeArticle={activeArticle} onCreateTodo={onCreateTodo} />

      {activeArticle.summary ? (
        <div className="article-section-card">
          <h3 className="article-block-title">内容摘要</h3>
          <p className={`article-block-text ${readingSizeClass}`}>{activeArticle.summary}</p>
        </div>
      ) : null}

      {activeArticle.content ? (
        <div className="article-section-card">
          <h3 className="article-block-title">正文内容</h3>
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
