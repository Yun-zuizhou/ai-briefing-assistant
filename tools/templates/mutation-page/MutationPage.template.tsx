import { PageContent, PageGrid, PageLayout, PageSection, PageStack, Masthead } from '../components/layout';
import { Button } from '../components/ui';
import { use__Feature__PageLogic } from './use__Feature__PageLogic';

const PAGE_TITLE = '__Feature__';

export default function __Feature__Page() {
  const {
    error,
    filter,
    filterCounts,
    filteredItems,
    handlePrimaryAction,
    loading,
    reload,
    setFilter,
    toggleItem,
  } = use__Feature__PageLogic();

  if (loading) {
    return (
      <PageLayout variant="main">
        <Masthead title={PAGE_TITLE} subtitle="Replace with the page status line." />
        <PageContent className="__feature__-page-content">
          <div className="__feature__-loading-state">
            <p>Loading...</p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="main">
      <Masthead title={PAGE_TITLE} subtitle="Replace with the page status line." />
      <PageContent className="__feature__-page-content">
        <PageStack>
          {error ? (
            <div className="domain-card __feature__-error-card">
              <p className="__feature__-error-text">{error}</p>
              <Button type="button" onClick={() => void reload()} variant="primary">
                Retry
              </Button>
            </div>
          ) : null}

          <div className="domain-card __feature__-primary-card">
            <p className="__feature__-primary-kicker">Primary action</p>
            <h2 className="__feature__-primary-title">Replace with the selected item title.</h2>
            <Button type="button" onClick={handlePrimaryAction} variant="primary">
              Continue
            </Button>
          </div>

          <div className="action-row __feature__-filter-row">
            {(['active', 'completed'] as const).map((id) => (
              <Button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                variant="unstyled"
                className={`action-chip __feature__-filter-chip ${filter === id ? 'primary' : ''}`}
              >
                {id} ({filterCounts[id]})
              </Button>
            ))}
          </div>

          <PageSection title="Managed items">
            {filteredItems.length === 0 ? (
              <div className="domain-card __feature__-empty-card">
                <p className="__feature__-empty-text">No items match this filter.</p>
              </div>
            ) : (
              <PageGrid className="__feature__-item-list">
                {filteredItems.map((item) => (
                  <div key={item.id} className="domain-card __feature__-item-card">
                    <p className="__feature__-item-title">{item.title}</p>
                    <Button type="button" onClick={() => void toggleItem(item)} variant="secondary">
                      Toggle
                    </Button>
                  </div>
                ))}
              </PageGrid>
            )}
          </PageSection>
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
