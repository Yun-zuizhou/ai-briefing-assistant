import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Globe, Palette, ChevronRight, Clock, Volume2, Smartphone, Key } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button, Switch } from '../components/ui';
import { apiService, type UserSettingsPayload } from '../services/api';
import {
  applyOrnamentLevel,
  getStoredOrnamentLevel,
  ORNAMENT_LEVEL_LABELS,
  type OrnamentLevel,
} from '../utils/ornamentTheme';

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function SettingsPage() {
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

  const handleNotificationSettings = useCallback(() => {
    navigate('/notification-settings');
  }, [navigate]);

  const handleAiProviderSettings = useCallback(() => {
    navigate('/ai-provider-settings');
  }, [navigate]);

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

  const handlePushTimeChange = useCallback(async (time: string) => {
    setMorningPushTime(time);
    await persistSettings(
      { morning_brief_time: time },
      '正在同步推送时间...',
      '推送时间已同步到正式设置。',
    );
  }, [persistSettings]);

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

  const handleOrnamentLevelChange = useCallback((nextLevel: OrnamentLevel) => {
    const appliedLevel = applyOrnamentLevel(nextLevel);
    setOrnamentLevel(appliedLevel);
    setStatusMessage(`复古装饰强度已切换为${ORNAMENT_LEVEL_LABELS[appliedLevel]}。`);
    setTimeout(() => setStatusMessage(null), 2000);
  }, []);

  const settingsGroups: SettingItem[][] = useMemo(() => [
    [
      {
        icon: <Key size={18} />,
        title: 'AI API',
        description: '选择平台并填写 API Key，其余参数自动配置',
        onClick: handleAiProviderSettings,
        rightElement: <ChevronRight size={16} className="settings-chevron" />,
      },
      {
        icon: <Bell size={18} />,
        title: '通知设置',
        description: '推送时间、免打扰、声音提醒',
        onClick: handleNotificationSettings,
        rightElement: <ChevronRight size={16} className="settings-chevron" />,
      },
      {
        icon: <Clock size={18} />,
        title: '推送时间',
        description: loading
          ? '加载中...'
          : `晨间 ${morningPushTime} · 晚间 ${settingsSnapshot?.evening_brief_time ?? '21:00'}`,
        rightElement: (
          <select
            className="settings-select"
            value={morningPushTime}
            onChange={(e) => void handlePushTimeChange(e.target.value)}
          >
            {['06:00', '07:00', '08:00', '09:00', '10:00'].map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        ),
      },
    ],
    [
      {
        icon: <Moon size={18} />,
        title: '深色模式',
        description: '切换深色/浅色主题',
        rightElement: (
          <Switch
            checked={darkMode}
            onClick={() => setDarkMode(!darkMode)}
            aria-label="切换深色模式"
            className="settings-switch"
            knobClassName="settings-switch-knob"
          />
        ),
      },
      {
        icon: <Palette size={18} />,
        title: '主题风格',
        description: `纸纹/金线/阴影 · ${ORNAMENT_LEVEL_LABELS[ornamentLevel]}`,
        rightElement: (
          <select
            className="settings-select"
            value={ornamentLevel}
            onChange={(event) => handleOrnamentLevelChange(event.target.value as OrnamentLevel)}
            aria-label="切换复古装饰强度"
          >
            <option value="subtle">{ORNAMENT_LEVEL_LABELS.subtle}</option>
            <option value="classic">{ORNAMENT_LEVEL_LABELS.classic}</option>
            <option value="rich">{ORNAMENT_LEVEL_LABELS.rich}</option>
          </select>
        ),
      },
      {
        icon: <Globe size={18} />,
        title: '语言',
        description: '简体中文',
        rightElement: <ChevronRight size={16} className="settings-chevron" />,
      },
    ],
    [
      {
        icon: <Volume2 size={18} />,
        title: '声音提醒',
        description: soundEnabled ? '收到推送时播放提示音' : '当前已关闭声音提醒',
        rightElement: (
          <Switch
            checked={soundEnabled}
            onClick={() => void handleSoundToggle()}
            aria-label="切换声音提醒"
            className="settings-switch"
            knobClassName="settings-switch-knob"
          />
        ),
      },
      {
        icon: <Smartphone size={18} />,
        title: '震动提醒',
        description: vibrationEnabled ? '收到推送时震动' : '当前已关闭震动提醒',
        rightElement: (
          <Switch
            checked={vibrationEnabled}
            onClick={() => void handleVibrationToggle()}
            aria-label="切换震动提醒"
            className="settings-switch"
            knobClassName="settings-switch-knob"
          />
        ),
      },
    ],
  ], [
    darkMode,
    handleAiProviderSettings,
    handleNotificationSettings,
    handleOrnamentLevelChange,
    handlePushTimeChange,
    handleSoundToggle,
    handleVibrationToggle,
    loading,
    morningPushTime,
    ornamentLevel,
    settingsSnapshot?.evening_brief_time,
    soundEnabled,
    vibrationEnabled,
  ]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="设置" label="SETTINGS" />

      <PageContent className="settings-page-content">
        {statusMessage ? (
          <div className="domain-card settings-status-card">
            <p className="settings-status-text">{statusMessage}</p>
          </div>
        ) : null}
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="domain-card settings-group-card">
            <div className="article-list">
              {group.map((item, itemIndex) => (
                item.onClick ? (
                  <Button
                    key={itemIndex}
                    type="button"
                    variant="unstyled"
                    className={`article-item settings-item-button ${itemIndex < group.length - 1 ? 'with-border' : ''}`}
                    onClick={item.onClick}
                  >
                    <div className="settings-item-layout">
                      <div className="settings-item-main">
                        <div className="settings-item-icon">{item.icon}</div>
                        <div className="settings-item-copy">
                          <p className="settings-item-title">{item.title}</p>
                          <p className="settings-item-desc">{item.description}</p>
                        </div>
                      </div>
                      <div className="settings-item-right">{item.rightElement}</div>
                    </div>
                  </Button>
                ) : (
                  <div
                    key={itemIndex}
                    className={`article-item settings-item-static ${itemIndex < group.length - 1 ? 'with-border' : ''}`}
                  >
                    <div className="settings-item-layout">
                      <div className="settings-item-main">
                        <div className="settings-item-icon">{item.icon}</div>
                        <div className="settings-item-copy">
                          <p className="settings-item-title">{item.title}</p>
                          <p className="settings-item-desc">{item.description}</p>
                        </div>
                      </div>
                      <div className="settings-item-right">{item.rightElement}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}

        <div className="settings-footnote-card">
          <p className="settings-footnote-text">
            💡 部分设置需要重启应用后生效
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
