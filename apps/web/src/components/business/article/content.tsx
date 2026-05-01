import type { UIEvent } from 'react';

import { PageContent } from '../../layout';
import type { ArticleFontSize, ArticleRelatedItem, ArticleState } from '../../../types/article';
import {
  ArticleActionRow,
  ArticleFontControls,
} from './controls';
import { ArticleAiSummaryCard } from './aiSummary';
import { ArticleBodySections } from './body';
import { ArticleFooterNote } from './footer';
import {
  ArticleHero,
  ArticlePartialNote,
} from './hero';

export function ArticleMainContent({
  actionError,
  activeArticle,
  aiSummaryPoints,
  fontSize,
  isCollected,
  onCollect,
  onAsk,
  onCreateTodo,
  onFontSizeChange,
  onOpenOriginal,
  onRelatedClick,
  onScroll,
  onShare,
  readingProgress,
  readingSizeClass,
  setShowAiSummary,
  showAiSummary,
  loadingDetail,
}: {
  actionError: string | null;
  activeArticle: ArticleState;
  aiSummaryPoints: string[];
  fontSize: ArticleFontSize;
  isCollected: boolean;
  loadingDetail: boolean;
  onCollect: () => void;
  onAsk: () => void;
  onCreateTodo: () => void;
  onFontSizeChange: (size: ArticleFontSize) => void;
  onOpenOriginal: () => void;
  onRelatedClick: (item: ArticleRelatedItem) => void;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onShare: () => void;
  readingProgress: number;
  readingSizeClass: string;
  setShowAiSummary: (updater: (prev: boolean) => boolean) => void;
  showAiSummary: boolean;
}) {
  return (
    <PageContent className="article-page-content article-page-content-main" onScroll={onScroll}>
      {actionError ? (
        <div className="domain-card article-error-card">
          <p className="article-error-text">{actionError}</p>
        </div>
      ) : null}

      <ArticleHero activeArticle={activeArticle} loadingDetail={loadingDetail} readingProgress={readingProgress} />
      <ArticlePartialNote activeArticle={activeArticle} />
      <ArticleActionRow
        isCollected={isCollected}
        onAsk={onAsk}
        onCollect={onCollect}
        onShare={onShare}
      />
      <ArticleFontControls fontSize={fontSize} onFontSizeChange={onFontSizeChange} />
      <ArticleAiSummaryCard
        aiSummaryPoints={aiSummaryPoints}
        setShowAiSummary={setShowAiSummary}
        showAiSummary={showAiSummary}
      />
      <ArticleBodySections
        activeArticle={activeArticle}
        onCreateTodo={onCreateTodo}
        onOpenOriginal={onOpenOriginal}
        onRelatedClick={onRelatedClick}
        readingSizeClass={readingSizeClass}
      />
      <ArticleFooterNote />
    </PageContent>
  );
}
