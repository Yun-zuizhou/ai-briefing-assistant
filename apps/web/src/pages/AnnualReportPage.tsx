import {
  AnnualReportContent,
  AnnualReportHero,
  AnnualReportStateCard,
  ReportExportSheet,
  ReportShareSheet,
} from '../components/business';
import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useAnnualReportPageLogic } from './useAnnualReportPageLogic';

export default function AnnualReportPage() {
  const {
    aiStatus,
    annualReport,
    error,
    exportFormat,
    handleExport,
    handleRefreshReport,
    handleShare,
    loading,
    refreshing,
    setExportFormat,
    setShowExportModal,
    setShowShareModal,
    showExportModal,
    showShareModal,
  } = useAnnualReportPageLogic();

  return (
    <PageLayout variant="report">
      <SecondaryHeader title={`${annualReport?.year ?? new Date().getFullYear()} · 年度报告`} label="ANNUAL REPORT" subtitle="回看这一年的关注、思考和行动" />

      <PageContent className="annual-page-content">
        <AnnualReportStateCard
          annualReport={annualReport}
          error={error}
          loading={loading}
        />

        <AnnualReportHero annualReport={annualReport} loading={loading} />

        {!loading && annualReport ? (
          <AnnualReportContent
            aiStatus={aiStatus}
            annualReport={annualReport}
            refreshing={refreshing}
            onOpenExport={() => setShowExportModal(true)}
            onOpenShare={() => setShowShareModal(true)}
            onRefresh={handleRefreshReport}
          />
        ) : null}

        {annualReport && showExportModal && (
          <ReportExportSheet
            exportFormat={exportFormat}
            reportKind="年度报告"
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            onFormatChange={setExportFormat}
          />
        )}

        {annualReport && showShareModal && (
          <ReportShareSheet
            reportKind="年度报告"
            onClose={() => setShowShareModal(false)}
            onShare={handleShare}
          />
        )}
      </PageContent>
    </PageLayout>
  );
}
