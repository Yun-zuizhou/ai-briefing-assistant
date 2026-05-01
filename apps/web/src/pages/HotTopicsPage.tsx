import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import {
  HotTopicsContent,
  HotTopicsModal,
  HotTopicsStateCard,
  HotTopicsToast,
} from '../components/business';
import { useHotTopicsPageLogic } from './useHotTopicsPageLogic';

export default function HotTopicsPage() {
  const {
    error,
    handleCloseTopic,
    handleCollect,
    handleReadSelectedTopic,
    handleRetry,
    handleTopicClick,
    loading,
    selectedTopic,
    showToast,
    toastMessage,
    visibleTopics,
  } = useHotTopicsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="热点探索"
        label="HOT TOPICS"
        subtitle="浏览少量公共热点，值得继续看的再收藏或阅读"
      />

      <PageContent className="hot-topics-page-content">
        <HotTopicsStateCard error={error} loading={loading} onRetry={() => void handleRetry()} />
        {!loading && !error ? (
          <HotTopicsContent
            onCollect={(topic) => void handleCollect(topic)}
            onTopicClick={handleTopicClick}
            topics={visibleTopics}
          />
        ) : null}
      </PageContent>

      <HotTopicsModal
        onClose={handleCloseTopic}
        onCollect={(topic) => void handleCollect(topic)}
        onRead={handleReadSelectedTopic}
        topic={selectedTopic}
      />
      <HotTopicsToast message={toastMessage} visible={showToast} />
    </PageLayout>
  );
}
