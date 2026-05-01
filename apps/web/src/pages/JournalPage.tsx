import { ChevronRight } from 'lucide-react';

import {
  JournalErrorCard,
  JournalKeepGrid,
  JournalOverviewCard,
  JournalProgressList,
  JournalReviewCard,
  JournalThoughtList,
} from '../components/business';
import { PageLayout, Masthead, PageContent, PageSection, PageStack } from '../components/layout';
import { Button } from '../components/ui';
import { useJournalPageLogic } from './useJournalPageLogic';

export default function JournalPage() {
  const {
    dateStr,
    depositSummary,
    error,
    fetchJournalData,
    handleDeleteThought,
    handleOpenActions,
    handleOpenChat,
    handleOpenGrowth,
    handleOpenHistoryBrief,
    handleOpenHistoryLogs,
    journalOverview,
    loading,
    recentKeepItems,
    recentProgressItems,
    thoughts,
    visibleGrowthTags,
    weekDay,
  } = useJournalPageLogic();

  return (
    <PageLayout variant="secondary">
      <Masthead
        title="我的记录"
        subtitle={`${dateStr} · ${weekDay}`}
        ornaments={['✦ MY ✦', '✦ LOG ✦']}
        meta="主动表达 · 行动回声 · 当日沉淀"
      />

      <PageContent className="journal-page-content">
        <PageStack>
          {error ? (
            <JournalErrorCard error={error} onRetry={() => void fetchJournalData()} />
          ) : null}

          <JournalOverviewCard
            expressionCount={depositSummary.expressionCount}
            keptCount={depositSummary.keptCount}
            loading={loading}
            onOpenChat={handleOpenChat}
            progressCount={depositSummary.progressCount}
            summaryText={depositSummary.summaryText}
          />

          <PageSection
            action={<Button type="button" variant="text" size="sm" onClick={handleOpenChat}>继续记录 <ChevronRight size={14} /></Button>}
            className="journal-section"
            title="主动留下的想法"
          >
            <JournalThoughtList
              loading={loading}
              onDeleteThought={(id) => void handleDeleteThought(id)}
              thoughts={thoughts}
            />
          </PageSection>

          <PageSection
            action={<Button type="button" variant="text" size="sm" onClick={handleOpenActions}>去行动 <ChevronRight size={14} /></Button>}
            className="journal-section"
            title="行动回声"
          >
            <JournalProgressList items={recentProgressItems} loading={loading} />
          </PageSection>

          <PageSection
            action={<Button type="button" variant="text" size="sm" onClick={handleOpenHistoryLogs}>看历史 <ChevronRight size={14} /></Button>}
            className="journal-section"
            title="近期沉淀"
          >
            <JournalKeepGrid items={recentKeepItems} loading={loading} />
          </PageSection>

          <PageSection
            action={<Button type="button" variant="text" size="sm" onClick={handleOpenGrowth}>看成长 <ChevronRight size={14} /></Button>}
            className="journal-section"
            title="长期回看"
          >
            <JournalReviewCard
              onOpenGrowth={handleOpenGrowth}
              onOpenHistoryBrief={handleOpenHistoryBrief}
              reviewCount={depositSummary.reviewCount}
              summaryText={journalOverview?.review.summaryText || '等沉淀更多之后，这里会形成更稳定的周期回看。'}
              tags={visibleGrowthTags}
            />
          </PageSection>
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
