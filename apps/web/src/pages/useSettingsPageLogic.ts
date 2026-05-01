import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService, type UserSettingsPayload } from '../services/api';
import {
  applyOrnamentLevel,
  getStoredOrnamentLevel,
  ORNAMENT_LEVEL_LABELS,
  type OrnamentLevel,
} from '../utils/ornamentTheme';

export type SettingsRowKind =
  | 'ai-api'
  | 'notifications'
  | 'dark-mode'
  | 'ornament'
  | 'language'
  | 'sound'
  | 'vibration';

export type SettingsControl =
  | { type: 'chevron' }
  | { type: 'switch'; checked: boolean; onToggle: () => void; ariaLabel: string }
  | { type: 'select'; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; ariaLabel?: string };

export interface SettingsRow {
  kind: SettingsRowKind;
  title: string;
  description: string;
  onClick?: () => void;
  control: SettingsControl;
}

export type SettingsGroup = SettingsRow[];

const ORNAMENT_OPTIONS = [
  { value: 'subtle', label: ORNAMENT_LEVEL_LABELS.subtle },
  { value: 'classic', label: ORNAMENT_LEVEL_LABELS.classic },
  { value: 'rich', label: ORNAMENT_LEVEL_LABELS.rich },
];

export function useSettingsPageLogic() {
  const navigate = useNavigate();
  const [morningPushTime, setMorningPushTime] = useState('08:00');
  const [settingsSnapshot, setSettingsSnapshot] = useState<UserSettingsPayload | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [ornamentLevel, setOrnamentLevel] = useState<OrnamentLevel>(() => getStoredOrnamentLevel());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUserSettings();
        const settings = response.data;
        if (!settings) {
          return;
        }
        setMorningPushTime(settings.morning_brief_time);
        setSettingsSnapshot(settings);
        setSoundEnabled(settings.sound_enabled);
        setVibrationEnabled(settings.vibration_enabled);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const persistSettings = useCallback(async (
    patch: Partial<UserSettingsPayload>,
    pendingMessage: string,
    successMessage: string,
  ) => {
    if (!settingsSnapshot) {
      setStatusMessage('请先进入通知设置页完成首次同步。');
      return null;
    }

    const previousSettings = settingsSnapshot;
    const nextSettings: UserSettingsPayload = {
      ...previousSettings,
      ...patch,
    };

    setSettingsSnapshot(nextSettings);
    setStatusMessage(pendingMessage);

    try {
      const response = await apiService.updateUserSettings(nextSettings);
      if (response.error || !response.data) {
        throw new Error(response.error || '设置同步失败');
      }
      setSettingsSnapshot(response.data);
      setMorningPushTime(response.data.morning_brief_time);
      setSoundEnabled(response.data.sound_enabled);
      setVibrationEnabled(response.data.vibration_enabled);
      setStatusMessage(successMessage);
      setTimeout(() => setStatusMessage(null), 2000);
      return response.data;
    } catch (error) {
      setSettingsSnapshot(previousSettings);
      setMorningPushTime(previousSettings.morning_brief_time);
      setSoundEnabled(previousSettings.sound_enabled);
      setVibrationEnabled(previousSettings.vibration_enabled);
      const message = error instanceof Error ? error.message : '设置同步失败';
      setStatusMessage(message);
      return null;
    }
  }, [settingsSnapshot]);

  const handleSoundToggle = useCallback(async () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);
    const result = await persistSettings(
      { sound_enabled: nextValue },
      '正在同步声音提醒...',
      `声音提醒已${nextValue ? '开启' : '关闭'}。`,
    );
    if (!result) {
      setSoundEnabled((prev) => !prev);
    }
  }, [persistSettings, soundEnabled]);

  const handleVibrationToggle = useCallback(async () => {
    const nextValue = !vibrationEnabled;
    setVibrationEnabled(nextValue);
    const result = await persistSettings(
      { vibration_enabled: nextValue },
      '正在同步震动提醒...',
      `震动提醒已${nextValue ? '开启' : '关闭'}。`,
    );
    if (!result) {
      setVibrationEnabled((prev) => !prev);
    }
  }, [persistSettings, vibrationEnabled]);

  const handleOrnamentLevelChange = useCallback((nextLevel: string) => {
    const appliedLevel = applyOrnamentLevel(nextLevel as OrnamentLevel);
    setOrnamentLevel(appliedLevel);
    setStatusMessage(`复古装饰强度已切换为${ORNAMENT_LEVEL_LABELS[appliedLevel]}。`);
    setTimeout(() => setStatusMessage(null), 2000);
  }, []);

  const settingsGroups: SettingsGroup[] = useMemo(() => [
    [
      {
        kind: 'ai-api',
        title: 'AI API',
        description: '选择平台并填写 API Key，其余参数自动配置',
        onClick: () => navigate('/ai-provider-settings'),
        control: { type: 'chevron' },
      },
      {
        kind: 'notifications',
        title: '通知设置',
        description: loading
          ? '正在读取简报通知配置...'
          : `晨间 ${morningPushTime} · 晚间 ${settingsSnapshot?.evening_brief_time ?? '21:00'} · 免打扰${settingsSnapshot?.do_not_disturb_enabled ? '已开启' : '未开启'}`,
        onClick: () => navigate('/notification-settings'),
        control: { type: 'chevron' },
      },
    ],
    [
      {
        kind: 'dark-mode',
        title: '深色模式',
        description: '切换深色/浅色主题',
        control: { type: 'switch', checked: darkMode, onToggle: () => setDarkMode((value) => !value), ariaLabel: '切换深色模式' },
      },
      {
        kind: 'ornament',
        title: '主题风格',
        description: `纸纹/金线/阴影 · ${ORNAMENT_LEVEL_LABELS[ornamentLevel]}`,
        control: {
          type: 'select',
          value: ornamentLevel,
          options: ORNAMENT_OPTIONS,
          onChange: handleOrnamentLevelChange,
          ariaLabel: '切换复古装饰强度',
        },
      },
      {
        kind: 'language',
        title: '语言',
        description: '简体中文',
        control: { type: 'chevron' },
      },
    ],
    [
      {
        kind: 'sound',
        title: '声音提醒',
        description: soundEnabled ? '收到推送时播放提示音' : '当前已关闭声音提醒',
        control: { type: 'switch', checked: soundEnabled, onToggle: () => void handleSoundToggle(), ariaLabel: '切换声音提醒' },
      },
      {
        kind: 'vibration',
        title: '震动提醒',
        description: vibrationEnabled ? '收到推送时震动' : '当前已关闭震动提醒',
        control: { type: 'switch', checked: vibrationEnabled, onToggle: () => void handleVibrationToggle(), ariaLabel: '切换震动提醒' },
      },
    ],
  ], [
    darkMode,
    handleOrnamentLevelChange,
    handleSoundToggle,
    handleVibrationToggle,
    loading,
    morningPushTime,
    navigate,
    ornamentLevel,
    settingsSnapshot?.do_not_disturb_enabled,
    settingsSnapshot?.evening_brief_time,
    soundEnabled,
    vibrationEnabled,
  ]);

  return {
    settingsGroups,
    statusMessage,
  };
}
