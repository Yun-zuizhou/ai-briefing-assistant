import { useCallback, useEffect, useState } from 'react';

import { apiService, type BriefingDispatchStatsPayload, type LlmInvocationStatsPayload } from '../services/api';
import { DIAGNOSTICS_WINDOW_OPTIONS, type DiagnosticsWindow } from '../types/diagnostics';

export function useSystemDiagnosticsPageLogic() {
  const [stats, setStats] = useState<LlmInvocationStatsPayload | null>(null);
  const [dispatchStats, setDispatchStats] = useState<BriefingDispatchStatsPayload | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<DiagnosticsWindow>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (windowValue: DiagnosticsWindow = selectedWindow) => {
    try {
      setLoading(true);
      setError(null);
      const [llmResponse, dispatchResponse] = await Promise.all([
        apiService.getLlmInvocationStats({ window: windowValue, limit: 10 }),
        apiService.getBriefingDispatchStats({ window: windowValue, limit: 10 }),
      ]);
      if (llmResponse.error || !llmResponse.data) {
        throw new Error(llmResponse.error || 'LLM 调用统计加载失败');
      }
      if (dispatchResponse.error || !dispatchResponse.data) {
        throw new Error(dispatchResponse.error || '简报调度统计加载失败');
      }
      setStats(llmResponse.data);
      setDispatchStats(dispatchResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '诊断统计加载失败');
    } finally {
      setLoading(false);
    }
  }, [selectedWindow]);

  useEffect(() => {
    void loadStats(selectedWindow);
  }, [loadStats, selectedWindow]);

  return {
    dispatchStats,
    error,
    handleRefresh: loadStats,
    loading,
    selectedWindow,
    setSelectedWindow,
    stats,
    windowOptions: DIAGNOSTICS_WINDOW_OPTIONS,
  };
}
