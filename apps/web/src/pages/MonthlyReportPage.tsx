import {
  MonthlyReportGrowthSection,
  MonthlyReportOverviewSection,
  MonthlyReportTrendSections,
  PeriodicReportAiSection,
  PeriodicReportQualityCard,
  PeriodicReportStateCard,
  ReportActionBar,
  ReportExportSheet,
  ReportShareSheet,
} from '../components/business';
import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useMonthlyReportPageLogic } from './useMonthlyReportPageLogic';

export default function MonthlyReportPage() {
  const {
    aiStatus,
    error,
    exportFormat,
    handleExport,
    handleOpenHotspotDetail,
    handleRecordThought,
    handleRefreshReport,
    handleShare,
    loading,
    refreshing,
    reportData,
    setExportFormat,
    setShowExportModal,
    setShowShareModal,
    showExportModal,
    showShareModal,
  } = useMonthlyReportPageLogic();

  return (
    <PageLayout variant="report">
      <SecondaryHeader title="月报" label="MONTHLY REPORT" subtitle="解释这个月的关注、行动和沉淀变化" />

      <PageContent className="monthly-report-page-content">
        <PeriodicReportStateCard
          error={error}
          loading={loading}
          reportData={reportData}
          sectionPrefix="monthly"
          onRecordThought={handleRecordThought}
        />

        {!loading && reportData ? (
          <>
            <PeriodicReportQualityCard reportData={reportData} sectionPrefix="monthly" />

            <PeriodicReportAiSection
              aiStatus={aiStatus}
              periodLabel="月报"
              reportData={reportData}
              reportKind="月报"
              refreshing={refreshing}
              sectionPrefix="monthly"
              onRefresh={handleRefreshReport}
            />

            <MonthlyReportOverviewSection reportData={reportData} />
            <MonthlyReportTrendSections
              reportData={reportData}
              onOpenHotspotDetail={handleOpenHotspotDetail}
              onRecordThought={handleRecordThought}
            />
            <MonthlyReportGrowthSection reportData={reportData} />

            <ReportActionBar
              className="monthly-report-actions"
              exportLabel="导出月报"
              iconClassName="monthly-report-action-icon"
              shareLabel="分享月报"
              onOpenExport={() => setShowExportModal(true)}
              onOpenShare={() => setShowShareModal(true)}
            />
          </>
        ) : null}
      </PageContent>

      {reportData && showExportModal ? (
        <ReportExportSheet
          exportFormat={exportFormat}
          reportKind="月报"
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          onFormatChange={setExportFormat}
        />
      ) : null}

      {reportData && showShareModal ? (
        <ReportShareSheet
          reportKind="月报"
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      ) : null}
    </PageLayout>
  );
}
