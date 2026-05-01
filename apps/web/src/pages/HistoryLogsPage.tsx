import {
  HistoryLogsArchiveList,
  HistoryLogsStateCard,
  HistoryLogsTip,
} from '../components/business';
import { PageLayout, SecondaryHeader, PageContent, PageStack } from '../components/layout';
import { useHistoryLogsPageLogic } from './useHistoryLogsPageLogic';

export default function HistoryLogsPage() {
  const {
    error,
    fetchHistory,
    handleOpenDetail,
    last7Days,
    loading,
  } = useHistoryLogsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="历史日志"
        label="HISTORY LOGS"
        subtitle="按天回看系统自动留下的阅读、收藏、记录和配置轨迹"
      />

      <PageContent className="history-logs-page-content">
        <PageStack>
          <HistoryLogsTip />
          <HistoryLogsStateCard
            error={error}
            loading={loading}
            onRetry={() => void fetchHistory()}
          />
          {!loading && !error ? (
            <HistoryLogsArchiveList days={last7Days} onOpenDetail={handleOpenDetail} />
          ) : null}
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
