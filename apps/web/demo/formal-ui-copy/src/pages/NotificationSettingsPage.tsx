import { useState, useCallback, useEffect } from 'react';
import { Bell, Clock, Moon, Volume2, Smartphone, Check } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
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

      <PageContent style={{ padding: '16px' }}>
        {error ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', margin: 0 }}>{error}</p>
          </div>
        ) : null}

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">
              <Bell size={14} style={{ marginRight: '6px' }} />
              推送时间
            </span>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            {timeSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="article-item"
                style={{
                  padding: '14px',
                  borderBottom: index < timeSlots.length - 1 ? '1px dashed var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={18} style={{ color: slot.enabled ? 'var(--accent)' : 'var(--ink-muted)' }} />
                    <div>
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: slot.enabled ? 'var(--ink)' : 'var(--ink-muted)',
                        margin: 0 
                      }}>
                        {slot.label}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                      value={slot.time}
                      onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                      disabled={!slot.enabled || loading}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid var(--ink)',
                        background: slot.enabled ? 'var(--paper)' : 'var(--paper-warm)',
                        fontSize: '13px',
                        fontFamily: 'var(--font-sans-cn)',
                        opacity: slot.enabled ? 1 : 0.5,
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                        );
                      })}
                    </select>
                    <button
                      onClick={() => handleToggleTimeSlot(slot.id)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: slot.enabled ? 'var(--accent)' : 'var(--border)',
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
                        left: slot.enabled ? '22px' : '2px',
                        transition: 'all 0.2s',
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">
              <Moon size={14} style={{ marginRight: '6px' }} />
              免打扰模式
            </span>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            <div className="article-item" style={{ padding: '14px', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    开启免打扰
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--ink-muted)', margin: '2px 0 0' }}>
                    在指定时间段内不发送推送
                  </p>
                </div>
                <button
                  onClick={() => setDoNotDisturb(!doNotDisturb)}
                  disabled={loading}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: doNotDisturb ? 'var(--accent)' : 'var(--border)',
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
                    left: doNotDisturb ? '22px' : '2px',
                    transition: 'all 0.2s',
                  }} />
                </button>
              </div>
            </div>

            {doNotDisturb && (
              <div className="article-item" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>
                    免打扰时段
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={dndStart}
                      onChange={(e) => setDndStart(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid var(--ink)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-sans-cn)',
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>{hour}:00</option>
                        );
                      })}
                    </select>
                    <span style={{ color: 'var(--ink-muted)' }}>至</span>
                    <select
                      value={dndEnd}
                      onChange={(e) => setDndEnd(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid var(--ink)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-sans-cn)',
                      }}
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

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">
              <Volume2 size={14} style={{ marginRight: '6px' }} />
              提醒方式
            </span>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            <div className="article-item" style={{ padding: '14px', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Volume2 size={18} style={{ color: 'var(--ink)' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    声音提醒
                  </p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  disabled={loading}
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
              </div>
            </div>

            <div className="article-item" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Smartphone size={18} style={{ color: 'var(--ink)' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    震动提醒
                  </p>
                </div>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  disabled={loading}
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
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => void handleSave()}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px' }}
          disabled={loading}
        >
          {showSaved ? (
            <>
              <Check size={16} style={{ marginRight: '6px' }} />
              已保存
            </>
          ) : (
            '保存设置'
          )}
        </button>
      </PageContent>
    </PageLayout>
  );
}
