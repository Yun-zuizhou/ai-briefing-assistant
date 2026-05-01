import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService, type DailyDigestItem, type DigestConsultResponse } from '../services/api';

export function useAiDigestLabPageLogic() {
  const [items, setItems] = useState<DailyDigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeResultRef, setActiveResultRef] = useState<string | null>(null);
  const [question, setQuestion] = useState('这条消息对我做 AI 项目开发最值得关注的点是什么？');
  const [consulting, setConsulting] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [consultResult, setConsultResult] = useState<DigestConsultResponse | null>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.resultRef === activeResultRef) || null,
    [activeResultRef, items],
  );

  const loadDigest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDailyDigest(null, 8);
      if (response.error) {
        throw new Error(response.error);
      }

      const nextItems = response.data?.items ?? [];
      setItems(nextItems);
      setActiveResultRef((current) => current ?? nextItems[0]?.resultRef ?? null);
      if (nextItems.length === 0) {
        setConsultResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '摘要结果加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDigest();
  }, [loadDigest]);

  const handleSelectItem = (resultRef: string) => {
    setActiveResultRef(resultRef);
    setConsultResult(null);
    setConsultError(null);
  };

  const handleConsult = async () => {
    if (!activeItem || !question.trim()) return;
    try {
      setConsulting(true);
      setConsultError(null);
      const response = await apiService.consultDigest({
        result_ref: activeItem.resultRef,
        question: question.trim(),
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setConsultResult(response.data ?? null);
    } catch (err) {
      setConsultError(err instanceof Error ? err.message : '咨询失败');
    } finally {
      setConsulting(false);
    }
  };

  return {
    activeItem,
    activeResultRef,
    consultError,
    consultResult,
    consulting,
    error,
    handleConsult,
    handleRefresh: loadDigest,
    handleSelectItem,
    items,
    loading,
    question,
    setQuestion,
  };
}
