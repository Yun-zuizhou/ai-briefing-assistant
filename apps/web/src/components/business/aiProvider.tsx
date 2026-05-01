import { Check, Key, RotateCcw, Server } from 'lucide-react';

import { Button } from '../ui';
import type { UserAiProviderPayload } from '../../services/api';

interface AiProviderOption {
  label: string;
  value: string;
}

export function AiProviderStatusCard({
  error,
  message,
}: {
  error?: string | null;
  message?: string | null;
}) {
  if (!message && !error) return null;

  return (
    <div className="domain-card ai-provider-status-card">
      {message ? <p className="ai-provider-status-text">{message}</p> : null}
      {error ? <p className="ai-provider-error-text">{error}</p> : null}
    </div>
  );
}

export function AiProviderInfoCard() {
  return (
    <div className="domain-card ai-provider-info-card">
      <div className="ai-provider-info-head">
        <Server size={18} className="ai-provider-info-icon" />
        <p className="ai-provider-info-title">
          平台自动配置
        </p>
      </div>
      <p className="ai-provider-info-desc">
        你只需要选择自己使用的平台并填写 API Key。模型名称和接口地址会按平台默认值自动补齐，后续摘要生成和咨询都会优先使用这里的配置。
      </p>
    </div>
  );
}

export function AiProviderFormCard({
  apiKey,
  disabled,
  onApiKeyChange,
  onProviderChange,
  options,
  provider,
  snapshot,
}: {
  apiKey: string;
  disabled: boolean;
  onApiKeyChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  options: readonly AiProviderOption[];
  provider: string;
  snapshot: UserAiProviderPayload | null;
}) {
  return (
    <div className="domain-card ai-provider-form-card">
      <div className="article-list">
        <div className="article-item ai-provider-form-item with-border">
          <p className="ai-provider-field-label">选择平台</p>
          <select
            value={provider}
            onChange={(event) => onProviderChange(event.target.value)}
            disabled={disabled}
            className="ai-provider-select"
          >
            {options.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="article-item ai-provider-form-item">
          <p className="ai-provider-field-label">填写 API Key</p>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder={snapshot?.has_api_key ? '如需更换，请重新输入新的 API Key' : '请输入 API Key'}
            disabled={disabled}
            className="ai-provider-input"
          />
          {snapshot?.has_api_key ? (
            <p className="ai-provider-key-mask">
              当前已保存：{snapshot.api_key_masked}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AiProviderCurrentCard({
  snapshot,
}: {
  snapshot: UserAiProviderPayload | null;
}) {
  return (
    <div className="domain-card ai-provider-current-card">
      <p className="ai-provider-current-title">
        当前生效配置
      </p>
      <p className="ai-provider-current-desc">
        {snapshot?.is_configured
          ? `平台：${snapshot.provider_label}；默认模型：${snapshot.model}；默认接口：${snapshot.api_url}`
          : '当前还没有保存 AI 平台配置，程序会继续使用现有默认链路。'}
      </p>
    </div>
  );
}

export function AiProviderActionBar({
  apiKey,
  disabled,
  onClear,
  onSave,
  saving,
  selectedPlatformLabel,
  snapshot,
}: {
  apiKey: string;
  disabled: boolean;
  onClear: () => void;
  onSave: () => void;
  saving: boolean;
  selectedPlatformLabel: string;
  snapshot: UserAiProviderPayload | null;
}) {
  return (
    <div className="ai-provider-actions">
      <Button
        onClick={onSave}
        disabled={disabled || !apiKey.trim()}
        variant="primary"
        className="ai-provider-primary-btn"
      >
        <Check size={16} className="ai-provider-btn-icon" />
        {saving ? '正在保存...' : `保存并启用 ${selectedPlatformLabel}`}
      </Button>

      <Button
        onClick={onClear}
        disabled={disabled || !snapshot?.is_configured}
        variant="secondary"
        className="ai-provider-secondary-btn"
      >
        <RotateCcw size={16} className="ai-provider-btn-icon" />
        清空当前配置
      </Button>
    </div>
  );
}

export function AiProviderNoteCard() {
  return (
    <div className="ai-provider-note-card">
      <div className="ai-provider-note-row">
        <Key size={16} className="ai-provider-note-icon" />
        <p className="ai-provider-note-text">
          这里保存的是服务端使用的 API Key，前端只会显示脱敏后的状态。保存后你不需要再填写模型、接口地址或其他高级参数。
        </p>
      </div>
    </div>
  );
}
