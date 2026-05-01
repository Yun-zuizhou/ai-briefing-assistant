import { PageContent, PageLayout, PageSection, PageStack, Masthead } from '../components/layout';
import { PageNoticeCard } from '../components/business';
import { use__Feature__PageLogic } from './use__Feature__PageLogic';

const PAGE_TITLE = '__Feature__';

export default function __Feature__Page() {
  const {
    data,
    loading,
    error,
    isEmpty,
    reload,
  } = use__Feature__PageLogic();

  return (
    <PageLayout>
      <Masthead
        title={PAGE_TITLE}
        subtitle="Replace with the page's product-facing subtitle."
      />

      <PageContent className="__feature__-page-content">
        <PageStack>
          {error ? (
            <PageNoticeCard
              title={error}
              detail="Retry after a moment to load the latest content."
            />
          ) : null}

          {loading ? (
            <div className="domain-card __feature__-state-card">
              <p className="__feature__-muted-text">Loading...</p>
            </div>
          ) : null}

          {!loading && isEmpty ? (
            <div className="domain-card __feature__-state-card">
              <p className="__feature__-muted-text">No content is ready yet.</p>
              <button type="button" className="btn btn-text btn-sm" onClick={reload}>
                Retry
              </button>
            </div>
          ) : null}

          {!loading && !isEmpty && data ? (
            <PageSection title="Primary section">
              <div className="domain-card __feature__-primary-card">
                <p className="__feature__-summary-text">
                  Replace this block with page-owned composition or business components.
                </p>
              </div>
            </PageSection>
          ) : null}
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
