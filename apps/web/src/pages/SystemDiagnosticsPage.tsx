import {
  DiagnosticsContent,
  DiagnosticsErrorCard,
  DiagnosticsGuardCard,
  DiagnosticsLoadingState,
} from '../components/business';
import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useSystemDiagnosticsPageLogic } from './useSystemDiagnosticsPageLogic';

export default function SystemDiagnosticsPage() {
  const {
    dispatchStats,
    error,
    handleRefresh,
    loading,
    selectedWindow,
    setSelectedWindow,
    stats,
    windowOptions,
  } = useSystemDiagnosticsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="系统诊断" label="DIAGNOSTICS" subtitle="开发观测" />

      <PageContent className="diagnostics-page-content">
        <DiagnosticsGuardCard
          onRefresh={() => void handleRefresh()}
          onWindowChange={setSelectedWindow}
          selectedWindow={selectedWindow}
          windowOptions={windowOptions}
        />
        <DiagnosticsErrorCard error={error} />
        <DiagnosticsLoadingState loading={loading} />
        {!loading && !error ? (
          <DiagnosticsContent dispatchStats={dispatchStats} stats={stats} />
        ) : null}
      </PageContent>
    </PageLayout>
  );
}
