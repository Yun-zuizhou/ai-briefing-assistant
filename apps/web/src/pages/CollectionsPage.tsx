import {
  CollectionsDeleteModal,
  CollectionsEmptyState,
  CollectionsList,
  CollectionsSearchBox,
  CollectionsStateCard,
} from '../components/business';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { useCollectionsPageLogic } from './useCollectionsPageLogic';

export default function CollectionsPage() {
  const {
    closeDeleteModal,
    error,
    expandedTrackId,
    fetchFavorites,
    filteredItems,
    getTrackingItem,
    handleDelete,
    handleOpenActions,
    handleOpenArticle,
    handleStartTracking,
    handleToggleTrack,
    loading,
    requestDelete,
    searchQuery,
    setSearchQuery,
    showDeleteModal,
  } = useCollectionsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="我的收藏"
        label="MY COLLECTIONS"
        subtitle="保存后想继续阅读、追踪或转成行动的内容"
      />

      <PageContent className="collections-page-content">
        <CollectionsSearchBox query={searchQuery} onQueryChange={setSearchQuery} />

        <CollectionsStateCard
          error={error}
          loading={loading}
          onRetry={() => void fetchFavorites()}
        />

        {!loading && !error && filteredItems.length === 0 ? (
          <CollectionsEmptyState />
        ) : null}

        {!loading && !error && filteredItems.length > 0 ? (
          <CollectionsList
            expandedTrackId={expandedTrackId}
            getTrackingItem={getTrackingItem}
            items={filteredItems}
            onDeleteRequest={requestDelete}
            onOpenActions={handleOpenActions}
            onOpenArticle={handleOpenArticle}
            onStartTracking={handleStartTracking}
            onToggleTrack={handleToggleTrack}
          />
        ) : null}
      </PageContent>

      <CollectionsDeleteModal
        isOpen={showDeleteModal}
        onCancel={closeDeleteModal}
        onConfirm={() => void handleDelete()}
      />
    </PageLayout>
  );
}
