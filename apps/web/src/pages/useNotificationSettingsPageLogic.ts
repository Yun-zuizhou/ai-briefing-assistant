import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService } from '../services/api';

export interface NotificationTimeSlot {
  id: string;
  label: string;
  time: string;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const hour = String(index).padStart(2, '0');
  return `${hour}:00`;
});

export function useNotificationSettingsPageLogic() {
  const [morningPushTime, setMorningPushTime] = useState('08:00');
  const [timeSlots, setTimeSlots] = useState<NotificationTimeSlot[]>([
    { id: 'morning', label: '晨间简报', time: '08:00' },
    { id: 'evening', label: '晚间简报', time: '21:00' },
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
          { id: 'morning', label: '晨间简报', time: settings.morning_brief_time },
          { id: 'evening', label: '晚间简报', time: settings.evening_brief_time },
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

  const handleTimeChange = useCallback((id: string, time: string) => {
    setTimeSlots((prev) => prev.map((slot) => (
      slot.id === id ? { ...slot, time } : slot
    )));
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

  const dnd = useMemo(() => ({
    enabled: doNotDisturb,
    end: dndEnd,
    start: dndStart,
    onEndChange: setDndEnd,
    onStartChange: setDndStart,
    onToggle: () => setDoNotDisturb((value) => !value),
  }), [dndEnd, dndStart, doNotDisturb]);

  const reminderMethods = useMemo(() => ({
    soundEnabled,
    vibrationEnabled,
    onSoundToggle: () => setSoundEnabled((value) => !value),
    onVibrationToggle: () => setVibrationEnabled((value) => !value),
  }), [soundEnabled, vibrationEnabled]);

  return {
    dnd,
    error,
    handleSave,
    handleTimeChange,
    hourOptions: HOUR_OPTIONS,
    loading,
    reminderMethods,
    showSaved,
    timeSlots,
  };
}
