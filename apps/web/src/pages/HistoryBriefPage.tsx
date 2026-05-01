import {
  HistoryBriefIntroCard,
  HistoryBriefReportSection,
  HistoryBriefSearchBox,
  HistoryBriefStateCard,
} from '../components/business';
import { PageContent, PageLayout, PageStack, SecondaryHeader } from '../components/layout';
import { useHistoryBriefPageLogic } from './useHistoryBriefPageLogic';

export default function HistoryBriefPage() {
  const {
    availableReports,
    error,
    handleOpenReport,
    loading,
    searchQuery,
    setSearchQuery,
    unavailableReports,
  } = useHistoryBriefPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="历史简报" label="HISTORY BRIEF" subtitle="历史周期回顾入口" />

      <PageContent className="history-brief-page-content">
        <PageStack>
          <HistoryBriefIntroCard />
          <HistoryBriefSearchBox searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <HistoryBriefStateCard error={error} loading={loading} />
          {!loading ? (
            <>
              <HistoryBriefReportSection
                emptyText="当前没有可查看的历史周期回顾。"
                onOpenReport={handleOpenReport}
                reports={availableReports}
                title="可查看的周期回顾"
              />
              <HistoryBriefReportSection
                emptyText="当前没有待生成的周期回顾入口。"
                onOpenReport={handleOpenReport}
                reports={unavailableReports}
                title="暂未生成"
              />
            </>
          ) : null}
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
