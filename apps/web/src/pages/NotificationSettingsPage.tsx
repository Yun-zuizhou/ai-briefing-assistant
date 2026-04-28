import { useState, useCallback, useEffect } from 'react';
import { Bell, Clock, Moon, Volume2, Smartphone, Check } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button, Switch } from '../components/ui';
import { apiService } from '../services/api';

interface TimeSlot {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [morningPushTime, setMorningPushTime] = useState('08:00');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: 'morning', label: '晨间简报', time: '08:00', enabled: true },
    { id: 'evening', label: '晚间简报', time: '21:00', enabled: true },
  ]);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserSettings();
        if (response.error) {
          throw new Error(response.error);
        }
        const settings = response.data;
        if (!settings) {
          return;
        }

        setMorningPushTime(settings.morning_brief_time);
        setTimeSlots([
          { id: 'morning', label: '晨间简报', time: settings.morning_brief_time, enabled: true },
          { id: 'evening', label: '晚间简报', time: settings.evening_brief_time, enabled: true },
        ]);
        setDoNotDisturb(settings.do_not_disturb_enabled);
        setDndStart(settings.do_not_disturb_start || '22:00');
        setDndEnd(settings.do_not_disturb_end || '07:00');
        setSoundEnabled(settings.sound_enabled);
        setVibrationEnabled(settings.vibration_enabled);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载通知设置失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleToggleTimeSlot = useCallback((id: string) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
    ));
  }, []);

  const handleTimeChange = useCallback((id: string, time: string) => {
    setTimeSlots(prev => prev.map(slot =>
      slot.id === id ? { ...slot, time } : slot
    ));
    if (id === 'morning') {
      setMorningPushTime(time);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setError(null);
      const morning = timeSlots.find((slot) => slot.id === 'morning')?.time || morningPushTime;
      const evening = timeSlots.find((slot) => slot.id === 'evening')?.time || '21:00';
      const response = await apiService.updateUserSettings({
        morning_brief_time: morning,
        evening_brief_time: evening,
        do_not_disturb_enabled: doNotDisturb,
        do_not_disturb_start: doNotDisturb ? dndStart : null,
        do_not_disturb_end: doNotDisturb ? dndEnd : null,
        sound_enabled: soundEnabled,
        vibration_enabled: vibrationEnabled,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      setMorningPushTime(morning);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存通知设置失败');
    }
  }, [dndEnd, dndStart, doNotDisturb, morningPushTime, soundEnabled, timeSlots, vibrationEnabled]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="通知设置" label="NOTIFICATIONS" />

      <PageContent className="notification-page-content">
        {error ? (
          <div className="domain-card notification-error-card">
            <p className="notification-error-text">{error}</p>
          </div>
        ) : null}

        <div className="section notification-section">
          <div className="section-header">
            <span className="section-title">
              <Bell size={14} className="notification-section-icon" />
              推送时间
            </span>
          </div>
        </div>

        <div className="domain-card notification-group-card">
          <div className="article-list">
            {timeSlots.map((slot, index) => (
              <div
                key={slot.id}
                className={`article-item notification-item ${index < timeSlots.length - 1 ? 'with-border' : ''}`}
              >
                <div className="notification-item-layout">
                  <div className="notification-item-main">
                    <Clock size={18} className={`notification-item-icon ${slot.enabled ? 'is-on' : ''}`} />
                    <div>
                      <p className={`notification-item-title ${slot.enabled ? '' : 'is-muted'}`}>{slot.label}</p>
                    </div>
                  </div>
                  <div className="notification-item-controls">
                    <select
                      value={slot.time}
                      onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                      disabled={!slot.enabled || loading}
                      className={`notification-time-select ${slot.enabled ? '' : 'is-disabled'}`}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                        );
                      })}
                    </select>
                    <Switch
                      checked={slot.enabled}
                      onClick={() => handleToggleTimeSlot(slot.id)}
                      aria-label={`切换${slot.label}`}
                      className="notification-switch"
                      knobClassName="notification-switch-knob"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section notification-section">
          <div className="section-header">
            <span className="section-title">
              <Moon size={14} className="notification-section-icon" />
              免打扰模式
            </span>
          </div>
        </div>

        <div className="domain-card notification-group-card">
          <div className="article-list">
            <div className="article-item notification-item with-border">
              <div className="notification-item-layout">
                <div className="notification-item-main">
                  <div>
                    <p className="notification-item-title">开启免打扰</p>
                    <p className="notification-item-desc">在指定时间段内不发送推送</p>
                  </div>
                </div>
                <Switch
                  checked={doNotDisturb}
                  onClick={() => setDoNotDisturb(!doNotDisturb)}
                  disabled={loading}
                  aria-label="切换免打扰模式"
                  className="notification-switch"
                  knobClassName="notification-switch-knob"
                />
              </div>
            </div>

            {doNotDisturb && (
              <div className="article-item notification-item">
                <div className="notification-item-layout notification-dnd-layout">
                  <p className="notification-item-range-label">免打扰时段</p>
                  <div className="notification-dnd-controls">
                    <select
                      value={dndStart}
                      onChange={(e) => setDndStart(e.target.value)}
                      className="notification-time-select compact"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                        );
                      })}
                    </select>
                    <span className="notification-dnd-separator">至</span>
                    <select
                      value={dndEnd}
                      onChange={(e) => setDndEnd(e.target.value)}
                      className="notification-time-select compact"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="section notification-section">
          <div className="section-header">
            <span className="section-title">
              <Volume2 size={14} className="notification-section-icon" />
              提醒方式
            </span>
          </div>
        </div>

        <div className="domain-card notification-group-card">
          <div className="article-list">
            <div className="article-item notification-item with-border">
              <div className="notification-item-layout">
                <div className="notification-item-main">
                  <Volume2 size={18} className="notification-item-icon is-on" />
                  <p className="notification-item-title">声音提醒</p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  disabled={loading}
                  aria-label="切换声音提醒"
                  className="notification-switch"
                  knobClassName="notification-switch-knob"
                />
              </div>
            </div>

            <div className="article-item notification-item">
              <div className="notification-item-layout">
                <div className="notification-item-main">
                  <Smartphone size={18} className="notification-item-icon is-on" />
                  <p className="notification-item-title">震动提醒</p>
                </div>
                <Switch
                  checked={vibrationEnabled}
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  disabled={loading}
                  aria-label="切换震动提醒"
                  className="notification-switch"
                  knobClassName="notification-switch-knob"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => void handleSave()}
          variant="primary"
          className="notification-save-btn"
          disabled={loading}
        >
          {showSaved ? (
            <>
              <Check size={16} className="notification-save-icon" />
              已保存
            </>
          ) : (
            '保存设置'
          )}
        </Button>
      </PageContent>
    </PageLayout>
  );
}
