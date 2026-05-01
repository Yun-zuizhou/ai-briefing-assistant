import { Check } from 'lucide-react';

import {
  PeriodicReportAiSection,
  PeriodicReportQualityCard,
  PeriodicReportStateCard,
  WeeklyReportGrowthSection,
  WeeklyReportOverviewSection,
  WeeklyReportTrendSections,
  ReportActionBar,
  ReportExportSheet,
  ReportShareSheet,
} from '../components/business';
import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useWeeklyReportPageLogic } from './useWeeklyReportPageLogic';

export default function WeeklyReportPage() {
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
    toastMessage,
  } = useWeeklyReportPageLogic();

  return (
    <PageLayout variant="report">
      <SecondaryHeader title="周报" label="WEEKLY REPORT" subtitle="解释这一周的阅读、记录和行动变化" />

      <PageContent className="weekly-report-page-content">
        <PeriodicReportStateCard
          error={error}
          loading={loading}
          reportData={reportData}
          sectionPrefix="weekly"
          onRecordThought={handleRecordThought}
        />
        {!loading && reportData ? (
          <>
            <PeriodicReportQualityCard reportData={reportData} sectionPrefix="weekly" />

            <PeriodicReportAiSection
              aiStatus={aiStatus}
              periodLabel="周报"
              reportData={reportData}
              reportKind="周报"
              refreshing={refreshing}
              sectionPrefix="weekly"
              onRefresh={handleRefreshReport}
            />

            <WeeklyReportOverviewSection reportData={reportData} />
            <WeeklyReportTrendSections
              reportData={reportData}
              onOpenHotspotDetail={handleOpenHotspotDetail}
              onRecordThought={handleRecordThought}
            />
            <WeeklyReportGrowthSection reportData={reportData} />

            <ReportActionBar
              className="weekly-report-actions"
              exportLabel="导出周报"
              iconClassName="weekly-report-action-icon"
              shareLabel="分享周报"
              onOpenExport={() => setShowExportModal(true)}
              onOpenShare={() => setShowShareModal(true)}
            />
          </>
        ) : null}
      </PageContent>

      {reportData && showExportModal && (
        <ReportExportSheet
          exportFormat={exportFormat}
          reportKind="周报"
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          onFormatChange={setExportFormat}
        />
      )}

      {reportData && showShareModal && (
        <ReportShareSheet
          reportKind="周报"
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      )}

      {toastMessage ? (
        <div className="weekly-report-toast">
          <Check size={16} className="weekly-report-toast-icon" />
          {toastMessage}
        </div>
      ) : null}
    </PageLayout>
  );
}
