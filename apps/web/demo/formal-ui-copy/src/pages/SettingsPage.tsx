import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Globe, Palette, ChevronRight, Clock, Volume2, Smartphone, Key } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { apiService, type UserSettingsPayload } from '../services/api';

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

  const settingsGroups: SettingItem[][] = useMemo(() => [
    [
      {
        icon: <Key size={18} />,
        title: 'AI API',
        description: '选择平台并填写 API Key，其余参数自动配置',
        onClick: handleAiProviderSettings,
        rightElement: <ChevronRight size={16} style={{ color: 'var(--ink-muted)' }} />,
      },
      {
        icon: <Bell size={18} />,
        title: '通知设置',
        description: '推送时间、免打扰、声音提醒',
        onClick: handleNotificationSettings,
        rightElement: <ChevronRight size={16} style={{ color: 'var(--ink-muted)' }} />,
      },
      {
        icon: <Clock size={18} />,
        title: '推送时间',
        description: loading
          ? '加载中...'
          : `晨间 ${morningPushTime} · 晚间 ${settingsSnapshot?.evening_brief_time ?? '21:00'}`,
        rightElement: (
          <select
            value={morningPushTime}
            onChange={(e) => void handlePushTimeChange(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid var(--ink)',
              background: 'var(--paper)',
              fontSize: '12px',
              fontFamily: 'var(--font-sans-cn)',
            }}
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
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: darkMode ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--paper)',
              position: 'absolute',
              top: '2px',
              left: darkMode ? '22px' : '2px',
              transition: 'all 0.2s',
            }} />
          </button>
        ),
      },
      {
        icon: <Palette size={18} />,
        title: '主题风格',
        description: '复古报纸风格',
        rightElement: <ChevronRight size={16} style={{ color: 'var(--ink-muted)' }} />,
      },
      {
        icon: <Globe size={18} />,
        title: '语言',
        description: '简体中文',
        rightElement: <ChevronRight size={16} style={{ color: 'var(--ink-muted)' }} />,
      },
    ],
    [
      {
        icon: <Volume2 size={18} />,
        title: '声音提醒',
        description: soundEnabled ? '收到推送时播放提示音' : '当前已关闭声音提醒',
        rightElement: (
          <button
            onClick={() => void handleSoundToggle()}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: soundEnabled ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--paper)',
              position: 'absolute',
              top: '2px',
              left: soundEnabled ? '22px' : '2px',
              transition: 'all 0.2s',
            }} />
          </button>
        ),
      },
      {
        icon: <Smartphone size={18} />,
        title: '震动提醒',
        description: vibrationEnabled ? '收到推送时震动' : '当前已关闭震动提醒',
        rightElement: (
          <button
            onClick={() => void handleVibrationToggle()}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: vibrationEnabled ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--paper)',
              position: 'absolute',
              top: '2px',
              left: vibrationEnabled ? '22px' : '2px',
              transition: 'all 0.2s',
            }} />
          </button>
        ),
      },
    ],
  ], [darkMode, handleAiProviderSettings, handleNotificationSettings, handlePushTimeChange, handleSoundToggle, handleVibrationToggle, loading, morningPushTime, settingsSnapshot?.evening_brief_time, soundEnabled, vibrationEnabled]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="设置" label="SETTINGS" />

      <PageContent style={{ padding: '16px' }}>
        {statusMessage ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>{statusMessage}</p>
          </div>
        ) : null}
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="domain-card" style={{ marginBottom: '16px' }}>
            <div className="article-list">
              {group.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="article-item"
                  style={{
                    padding: '14px',
                    cursor: item.onClick ? 'pointer' : 'default',
                    borderBottom: itemIndex < group.length - 1 ? '1px dashed var(--border)' : 'none',
                  }}
                  onClick={item.onClick}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: 'var(--ink)' }}>{item.icon}</div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                          {item.title}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: '2px 0 0' }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.rightElement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          padding: '16px',
          background: 'var(--paper-warm)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
            💡 部分设置需要重启应用后生效
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
