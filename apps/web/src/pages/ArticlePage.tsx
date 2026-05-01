import {
  ArticleEmptyState,
  ArticleMainContent,
  ArticleProgressBar,
  ArticleToast,
} from '../components/business';
import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useArticlePageLogic } from './useArticlePageLogic';

export default function ArticlePage() {
  const {
    actionError,
    activeArticle,
    aiSummaryPoints,
    fontSize,
    handleAskAboutArticle,
    handleBackToToday,
    handleCollect,
    handleCreateTodoFromOpportunity,
    handleOpenOriginal,
    handleRelatedClick,
    handleScroll,
    handleShare,
    isCollected,
    loadingDetail,
    readingProgress,
    readingSizeClass,
    setFontSize,
    setShowAiSummary,
    showAiSummary,
    showToast,
    toastMessage,
  } = useArticlePageLogic();

  if (!activeArticle) {
    return (
      <PageLayout variant="secondary">
        <SecondaryHeader title="阅读详情" label="ARTICLE" />
        <PageContent className="article-page-content article-page-content-empty">
          <ArticleEmptyState loadingDetail={loadingDetail} onBackToToday={handleBackToToday} />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="阅读详情" label="ARTICLE" subtitle="核对原文、收藏或继续追问" />

      <ArticleProgressBar readingProgress={readingProgress} />

      <ArticleMainContent
        actionError={actionError}
        activeArticle={activeArticle}
        aiSummaryPoints={aiSummaryPoints}
        fontSize={fontSize}
        isCollected={isCollected}
        loadingDetail={loadingDetail}
        onAsk={handleAskAboutArticle}
        onCollect={() => void handleCollect()}
        onCreateTodo={handleCreateTodoFromOpportunity}
        onFontSizeChange={setFontSize}
        onOpenOriginal={handleOpenOriginal}
        onRelatedClick={handleRelatedClick}
        onScroll={handleScroll}
        onShare={handleShare}
        readingProgress={readingProgress}
        readingSizeClass={readingSizeClass}
        setShowAiSummary={setShowAiSummary}
        showAiSummary={showAiSummary}
      />

      <ArticleToast message={toastMessage} visible={showToast} />
    </PageLayout>
  );
}
