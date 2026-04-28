import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Key, RotateCcw, Server } from 'lucide-react';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { apiService, type UserAiProviderPayload } from '../services/api';

const PLATFORM_OPTIONS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'nvidia', label: 'NVIDIA' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'zhipu', label: '智谱' },
  { value: 'qwen', label: '通义千问' },
] as const;

export default function AiProviderSettingsPage() {
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
    () => PLATFORM_OPTIONS.find((item) => item.value === provider)?.label || '未选择平台',
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

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="AI API" label="AI PROVIDER" />

      <PageContent style={{ padding: '16px' }}>
        {statusMessage ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>{statusMessage}</p>
          </div>
        ) : null}

        {error ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--accent)', margin: 0 }}>{error}</p>
          </div>
        ) : null}

        <div className="domain-card" style={{ marginBottom: '16px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Server size={18} style={{ color: 'var(--ink)' }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              平台自动配置
            </p>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.8, margin: 0 }}>
            你只需要选择自己使用的平台并填写 API Key。模型名称和接口地址会按平台默认值自动补齐，后续摘要生成和咨询都会优先使用这里的配置。
          </p>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            <div className="article-item" style={{ padding: '14px', borderBottom: '1px dashed var(--border)' }}>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '8px' }}>选择平台</p>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                disabled={loading || saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--ink)',
                  background: 'var(--paper)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans-cn)',
                }}
              >
                {PLATFORM_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="article-item" style={{ padding: '14px' }}>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '8px' }}>填写 API Key</p>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={snapshot?.has_api_key ? '如需更换，请重新输入新的 API Key' : '请输入 API Key'}
                disabled={loading || saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--ink)',
                  background: 'var(--paper)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans-cn)',
                  boxSizing: 'border-box',
                }}
              />
              {snapshot?.has_api_key ? (
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: '8px 0 0' }}>
                  当前已保存：{snapshot.api_key_masked}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px', padding: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
            当前生效配置
          </p>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.8, margin: 0 }}>
            {snapshot?.is_configured
              ? `平台：${snapshot.provider_label}；默认模型：${snapshot.model}；默认接口：${snapshot.api_url}`
              : '当前还没有保存 AI 平台配置，程序会继续使用现有默认链路。'}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <button
            onClick={() => void handleSave()}
            className="btn btn-primary"
            disabled={loading || saving || !apiKey.trim()}
            style={{ width: '100%', padding: '14px' }}
          >
            <Check size={16} style={{ marginRight: '6px' }} />
            保存并启用 {selectedPlatformLabel}
          </button>

          <button
            onClick={() => void handleClear()}
            disabled={loading || saving || !snapshot?.is_configured}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--paper)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <RotateCcw size={16} style={{ marginRight: '6px' }} />
            清空当前配置
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '14px',
            background: 'var(--paper-warm)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--ink)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.8, margin: 0 }}>
              这里保存的是服务端使用的 API Key，前端只会显示脱敏后的状态。保存后你不需要再填写模型、接口地址或其他高级参数。
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
