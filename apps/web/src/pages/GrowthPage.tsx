import { ChevronRight } from 'lucide-react';

import {
  GrowthHistoryCard,
  GrowthKeywordCard,
  GrowthPersonaCard,
  GrowthProfileCard,
  GrowthReportList,
  GrowthWeeklyCard,
  PageNoticeCard,
} from '../components/business';
import { PageContent, PageLayout, PageSection, PageStack, Masthead } from '../components/layout';
import { Button } from '../components/ui';
import { useGrowthPageLogic } from './useGrowthPageLogic';

export default function GrowthPage() {
  const {
    activeInterests,
    displayName,
    error,
    handleOpenHistoryBrief,
    handleOpenHistoryLogs,
    handleOpenMe,
    handleOpenProfile,
    handleOpenReport,
    historyCount,
    loading,
    notesCount,
    personaSummary,
    recentHistory,
    recentKeywords,
    reportEntries,
    subtitle,
    weeklySummary,
  } = useGrowthPageLogic();

  return (
    <PageLayout variant="main">
      <Masthead
        title="成长"
        subtitle={subtitle}
        ornaments={['✦ GROWTH ✦', '✦ REVIEW ✦']}
        metaLinks={[
          { label: '我的', onClick: handleOpenMe },
          { label: '画像', onClick: handleOpenProfile },
          { label: '历史', onClick: handleOpenHistoryLogs },
          { label: '简报', onClick: handleOpenHistoryBrief },
        ]}
      />

      <PageContent className="growth-page-content">
        <PageStack>
          {error ? (
            <PageNoticeCard
              title={error}
              detail="数据同步出现波动，稍后重试可恢复最新内容。"
            />
          ) : null}

          <GrowthProfileCard
            activeInterestCount={activeInterests.length}
            displayName={displayName}
            historyCount={historyCount}
            notesCount={notesCount}
          />

          <PageSection title="本周成长摘要">
            <GrowthWeeklyCard activeInterests={activeInterests} summary={weeklySummary} />
          </PageSection>

          <PageSection title="最近记录关键词">
            <GrowthKeywordCard keywords={recentKeywords} loading={loading} />
          </PageSection>

          <PageSection
            title="一句话画像"
            action={(
              <Button type="button" variant="text" size="sm" onClick={handleOpenProfile}>
                查看详情 <ChevronRight size={14} />
              </Button>
            )}
          >
            <GrowthPersonaCard summary={personaSummary} />
          </PageSection>

          <PageSection
            title="历史回顾"
            action={(
              <Button type="button" variant="text" size="sm" onClick={handleOpenHistoryLogs}>
                查看全部 <ChevronRight size={14} />
              </Button>
            )}
          >
            <GrowthHistoryCard items={recentHistory} loading={loading} />
          </PageSection>

          <PageSection
            title="报告入口"
            action={(
              <Button type="button" variant="text" size="sm" onClick={handleOpenHistoryBrief}>
                查看历史 <ChevronRight size={14} />
              </Button>
            )}
          >
            <GrowthReportList items={reportEntries} onOpenReport={handleOpenReport} />
          </PageSection>
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
