import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Globe, Palette, ChevronRight, Clock, Volume2, Smartphone } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { pushTime, setPushTime } = useAppContext();
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUserSettings();
        const settings = response.data;
        if (!settings) {
          return;
        }
        setPushTime(settings.morning_brief_time);
        setSoundEnabled(settings.sound_enabled);
        setVibrationEnabled(settings.vibration_enabled);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, [setPushTime]);

  const handleNotificationSettings = useCallback(() => {
    navigate('/notification-settings');
  }, [navigate]);

  const settingsGroups: SettingItem[][] = [
    [
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
        description: loading ? '加载中...' : `晨间 ${pushTime.split(':')[0]}:00 · 晚间 21:00`,
        rightElement: (
          <select
            value={pushTime}
            onChange={(e) => setPushTime(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid var(--ink)',
              background: 'var(--paper)',
              fontSize: '12px',
              fontFamily: 'var(--font-serif-cn)',
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
        description: '收到推送时播放提示音',
        rightElement: (
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
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
        description: '收到推送时震动',
        rightElement: (
          <button
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
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
  ];

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="设置" label="SETTINGS" />

      <PageContent style={{ padding: '16px' }}>
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
