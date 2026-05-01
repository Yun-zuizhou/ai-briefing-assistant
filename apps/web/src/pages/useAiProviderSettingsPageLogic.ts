import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService, type UserAiProviderPayload } from '../services/api';

export const AI_PROVIDER_OPTIONS = [
  { value: 'deepseek', label: 'DeepSeek V4 Flash' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'nvidia', label: 'NVIDIA' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'zhipu', label: '智谱' },
  { value: 'qwen', label: '通义千问' },
] as const;

export function useAiProviderSettingsPageLogic() {
  const [provider, setProvider] = useState('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [snapshot, setSnapshot] = useState<UserAiProviderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserAiProviderSettings();
        if (response.error) {
          throw new Error(response.error);
        }
        const nextSnapshot = response.data ?? null;
        setSnapshot(nextSnapshot);
        if (nextSnapshot?.provider) {
          setProvider(nextSnapshot.provider);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载 AI API 设置失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const selectedPlatformLabel = useMemo(
    () => AI_PROVIDER_OPTIONS.find((item) => item.value === provider)?.label || '未选择平台',
    [provider],
  );

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setStatusMessage('正在保存 AI 平台配置...');

      const response = await apiService.updateUserAiProviderSettings({
        provider,
        api_key: apiKey,
      });

      if (response.error || !response.data) {
        throw new Error(response.error || '保存 AI 平台配置失败');
      }

      setSnapshot(response.data);
      setApiKey('');
      setStatusMessage(`已切换到 ${response.data.provider_label || selectedPlatformLabel}，后续调用将自动使用默认模型与接口地址。`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存 AI 平台配置失败');
      setStatusMessage(null);
    } finally {
      setSaving(false);
    }
  }, [apiKey, provider, selectedPlatformLabel]);

  const handleClear = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setStatusMessage('正在清空 AI 平台配置...');

      const response = await apiService.updateUserAiProviderSettings({
        provider: null,
        api_key: null,
      });

      if (response.error || !response.data) {
        throw new Error(response.error || '清空 AI 平台配置失败');
      }

      setSnapshot(response.data);
      setApiKey('');
      setStatusMessage('已清空当前 AI 平台配置。');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空 AI 平台配置失败');
      setStatusMessage(null);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    apiKey,
    error,
    handleClear,
    handleSave,
    loading,
    provider,
    saving,
    selectedPlatformLabel,
    setApiKey,
    setProvider,
    snapshot,
    statusMessage,
  };
}
