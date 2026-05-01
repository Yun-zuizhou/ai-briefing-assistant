import { Masthead, PageContent, PageLayout, PageSection, PageStack } from '../components/layout';
import { PageNoticeCard } from '../components/business';
import { Button } from '../components/ui';
import { use__Feature__PageLogic } from './use__Feature__PageLogic';

const PAGE_TITLE = '__Feature__';

export default function __Feature__Page() {
  const {
    auxiliaryEntries,
    data,
    error,
    groupedReports,
    headline,
    isEmpty,
    loading,
    openAuxiliaryEntry,
    openHeadline,
    openReport,
    overview,
    reload,
  } = use__Feature__PageLogic();

  return (
    <PageLayout>
      <Masthead
        title={PAGE_TITLE}
        subtitle="Replace with the page's product-facing information promise."
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
              <p className="__feature__-muted-text">Loading the information flow...</p>
            </div>
          ) : null}

          {!loading && isEmpty ? (
            <div className="domain-card __feature__-state-card">
              <p className="__feature__-muted-text">No information is ready yet.</p>
              <Button type="button" variant="text" size="sm" onClick={reload}>
                Retry
              </Button>
            </div>
          ) : null}

          {!loading && !isEmpty && data ? (
            <div className="__feature__-information-layout">
              <main className="__feature__-main-flow" aria-label="Primary reading flow">
                <PageSection className="__feature__-section __feature__-section-overview">
                  <div className="domain-card __feature__-overview-card">
                    <p className="__feature__-section-label">Overview</p>
                    <p className="__feature__-overview-text">{overview}</p>
                  </div>
                </PageSection>

                <PageSection className="__feature__-section __feature__-section-headline">
                  <article className="domain-card __feature__-headline-card">
                    <p className="__feature__-section-label">Primary story</p>
                    <h2 className="__feature__-headline-title">{headline.title}</h2>
                    <p className="__feature__-headline-summary">{headline.summary}</p>
                    <Button type="button" variant="unstyled" className="action-chip primary" onClick={openHeadline}>
                      Open story
                    </Button>
                  </article>
                </PageSection>

                <PageSection className="__feature__-section __feature__-section-groups" title="Grouped reading">
                  <div className="__feature__-group-list">
                    {groupedReports.map((group) => (
                      <section className="__feature__-group" key={group.id}>
                        <h3 className="__feature__-group-title">{group.title}</h3>
                        <div className="__feature__-report-list">
                          {group.items.map((item) => (
                            <button
                              type="button"
                              className="domain-card __feature__-report-card"
                              key={item.id}
                              onClick={() => openReport(item)}
                            >
                              <span className="__feature__-report-source">{item.sourceLabel}</span>
                              <span className="__feature__-report-title">{item.title}</span>
                              <span className="__feature__-report-summary">{item.summary}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </PageSection>
              </main>

              <aside className="__feature__-aux-flow" aria-label="Auxiliary entries">
                <PageSection className="__feature__-section __feature__-section-aux" title="Auxiliary entries">
                  <div className="__feature__-aux-list">
                    {auxiliaryEntries.map((entry) => (
                      <button
                        type="button"
                        className="domain-card __feature__-aux-card"
                        key={entry.id}
                        onClick={() => openAuxiliaryEntry(entry)}
                      >
                        <span className="__feature__-aux-title">{entry.title}</span>
                        <span className="__feature__-aux-summary">{entry.summary}</span>
                      </button>
                    ))}
                  </div>
                </PageSection>
              </aside>
            </div>
          ) : null}
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
