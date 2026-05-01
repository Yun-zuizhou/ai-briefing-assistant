import { useEffect, useMemo, useState } from 'react';

import { apiService, type UserProfilePayload } from '../services/api';
import { getProfileAiStatus } from '../utils/aiGenerationStatus';

export interface EvidenceRefPreview {
  refType?: string;
  refId?: number | null;
  resultRef?: string | null;
  sourceUrl?: string | null;
  title?: string | null;
  snippet?: string | null;
  reason?: string | null;
}

export interface ProfileRadarMetric {
  label: string;
  value: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeEvidenceRef(value: unknown): EvidenceRefPreview | null {
  if (!isRecord(value)) return null;
  return {
    refType: typeof value.refType === 'string' ? value.refType : undefined,
    refId: typeof value.refId === 'number' ? value.refId : null,
    resultRef: typeof value.resultRef === 'string' ? value.resultRef : null,
    sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : null,
    title: typeof value.title === 'string' ? value.title : null,
    snippet: typeof value.snippet === 'string' ? value.snippet : null,
    reason: typeof value.reason === 'string' ? value.reason : null,
  };
}

export function getEvidenceTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    note: '记录',
    favorite: '收藏',
    todo: '待办',
    history_entry: '历史',
    article: '文章',
    hot_topic: '热点',
    opportunity: '机会',
    summary_result: '摘要',
    briefing: '简报',
  };
  return type ? labels[type] || type : '证据';
}

export function useProfilePageLogic() {
  const [profileData, setProfileData] = useState<UserProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserProfile();
        if (response.error) {
          throw new Error(response.error);
        }
        setProfileData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载用户画像失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const radarData = useMemo((): ProfileRadarMetric[] => {
    const metrics = profileData?.radar_metrics ?? {};
    return [
      { label: '活跃度', value: metrics['活跃度'] ?? 0 },
      { label: '收藏量', value: metrics['收藏量'] ?? 0 },
      { label: '任务完成', value: metrics['任务完成'] ?? 0 },
      { label: '关注广度', value: metrics['关注广度'] ?? 0 },
      { label: '连续打卡', value: metrics['连续打卡'] ?? 0 },
      { label: '互动深度', value: metrics['互动深度'] ?? 0 },
    ];
  }, [profileData?.radar_metrics]);

  const evidenceRefs = useMemo(
    () => (profileData?.evidence_refs || []).map(normalizeEvidenceRef).filter((item): item is EvidenceRefPreview => Boolean(item)).slice(0, 6),
    [profileData?.evidence_refs],
  );

  const aiStatus = useMemo(
    () => getProfileAiStatus(profileData, { loading, generating, failed: Boolean(error && !profileData) }),
    [error, generating, loading, profileData],
  );

  const handleGenerateProfile = async () => {
    try {
      setGenerating(true);
      setError(null);
      setGenerateMessage(null);
      const response = await apiService.generateUserProfile();
      if (response.error) {
        throw new Error(response.error);
      }

      const refreshed = await apiService.getUserProfile();
      if (refreshed.error) {
        throw new Error(refreshed.error);
      }

      setProfileData(refreshed.data ?? null);
      setGenerateMessage(response.data?.ai_generated ? '画像已更新。' : '已刷新为基础画像。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成用户画像失败');
    } finally {
      setGenerating(false);
    }
  };

  return {
    aiStatus,
    error,
    evidenceRefs,
    generateMessage,
    generating,
    handleGenerateProfile,
    loading,
    profileData,
    radarData,
  };
}
