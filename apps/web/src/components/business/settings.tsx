import { Bell, Check, ChevronRight, Clock, Globe, Key, Moon, Palette, Smartphone, Volume2 } from 'lucide-react';

import { Button, Switch } from '../ui';

type SettingsRowKind =
  | 'ai-api'
  | 'notifications'
  | 'dark-mode'
  | 'ornament'
  | 'language'
  | 'sound'
  | 'vibration';

type SettingsControl =
  | { type: 'chevron' }
  | { type: 'switch'; checked: boolean; onToggle: () => void; ariaLabel: string }
  | { type: 'select'; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; ariaLabel?: string };

interface SettingsRow {
  kind: SettingsRowKind;
  title: string;
  description: string;
  onClick?: () => void;
  control: SettingsControl;
}

interface NotificationTimeSlot {
  id: string;
  label: string;
  time: string;
}

const SETTINGS_ICONS = {
  'ai-api': <Key size={18} />,
  notifications: <Bell size={18} />,
  'dark-mode': <Moon size={18} />,
  ornament: <Palette size={18} />,
  language: <Globe size={18} />,
  sound: <Volume2 size={18} />,
  vibration: <Smartphone size={18} />,
};

function SettingsRowControl({ control }: { control: SettingsControl }) {
  if (control.type === 'chevron') {
    return <ChevronRight size={16} className="settings-chevron" />;
  }

  if (control.type === 'switch') {
    return (
      <Switch
        checked={control.checked}
        onClick={control.onToggle}
        aria-label={control.ariaLabel}
        className="settings-switch"
        knobClassName="settings-switch-knob"
      />
    );
  }

  return (
    <select
      className="settings-select"
      value={control.value}
      onChange={(event) => control.onChange(event.target.value)}
      aria-label={control.ariaLabel}
    >
      {control.options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SettingsRowContent({ item }: { item: SettingsRow }) {
  return (
    <div className="settings-item-layout">
      <div className="settings-item-main">
        <div className="settings-item-icon">{SETTINGS_ICONS[item.kind]}</div>
        <div className="settings-item-copy">
          <p className="settings-item-title">{item.title}</p>
          <p className="settings-item-desc">{item.description}</p>
        </div>
      </div>
      <div className="settings-item-right">
        <SettingsRowControl control={item.control} />
      </div>
    </div>
  );
}

export function SettingsStatusCard({
  message,
}: {
  message: string;
}) {
  return (
    <div className="domain-card settings-status-card">
      <p className="settings-status-text">{message}</p>
    </div>
  );
}

export function SettingsGroupList({
  groups,
}: {
  groups: SettingsRow[][];
}) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="domain-card settings-group-card">
          <div className="article-list">
            {group.map((item, itemIndex) => (
              item.onClick ? (
                <Button
                  key={item.kind}
                  type="button"
                  variant="unstyled"
                  className={`article-item settings-item-button ${itemIndex < group.length - 1 ? 'with-border' : ''}`}
                  onClick={item.onClick}
                >
                  <SettingsRowContent item={item} />
                </Button>
              ) : (
                <div
                  key={item.kind}
                  className={`article-item settings-item-static ${itemIndex < group.length - 1 ? 'with-border' : ''}`}
                >
                  <SettingsRowContent item={item} />
                </div>
              )
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function SettingsFootnoteCard() {
  return (
    <div className="settings-footnote-card">
      <p className="settings-footnote-text">
        对话中确认过的系统配置会同步到这里；通知时间由通知设置页统一管理。
      </p>
    </div>
  );
}

export function NotificationConfigNoticeCard() {
  return (
    <div className="domain-card notification-config-notice-card">
      <p className="notification-config-notice-title">简报通知的正式配置页</p>
      <p className="notification-config-notice-text">
        从对话里确认的推送时间会写入晨间简报；在这里修改并保存后，同样会同步到正式设置。
      </p>
    </div>
  );
}

export function NotificationErrorCard({
  error,
}: {
  error: string;
}) {
  return (
    <div className="domain-card notification-error-card">
      <p className="notification-error-text">{error}</p>
    </div>
  );
}

export function NotificationTimeSlotsCard({
  disabled,
  hourOptions,
  onTimeChange,
  slots,
}: {
  disabled: boolean;
  hourOptions: string[];
  onTimeChange: (id: string, time: string) => void;
  slots: NotificationTimeSlot[];
}) {
  return (
    <div className="domain-card notification-group-card">
      <div className="article-list">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            className={`article-item notification-item ${index < slots.length - 1 ? 'with-border' : ''}`}
          >
            <div className="notification-item-layout">
              <div className="notification-item-main">
                <Clock size={18} className="notification-item-icon is-on" />
                <div>
                  <p className="notification-item-title">{slot.label}</p>
                </div>
              </div>
              <div className="notification-item-controls">
                <select
                  value={slot.time}
                  onChange={(event) => onTimeChange(slot.id, event.target.value)}
                  disabled={disabled}
                  className="notification-time-select"
                >
                  {hourOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationDndCard({
  disabled,
  dnd,
  hourOptions,
}: {
  disabled: boolean;
  dnd: {
    enabled: boolean;
    end: string;
    onEndChange: (value: string) => void;
    onStartChange: (value: string) => void;
    onToggle: () => void;
    start: string;
  };
  hourOptions: string[];
}) {
  return (
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
              checked={dnd.enabled}
              onClick={dnd.onToggle}
              disabled={disabled}
              aria-label="切换免打扰模式"
              className="notification-switch"
              knobClassName="notification-switch-knob"
            />
          </div>
        </div>

        {dnd.enabled ? (
          <div className="article-item notification-item">
            <div className="notification-item-layout notification-dnd-layout">
              <p className="notification-item-range-label">免打扰时段</p>
              <div className="notification-dnd-controls">
                <select
                  value={dnd.start}
                  onChange={(event) => dnd.onStartChange(event.target.value)}
                  className="notification-time-select compact"
                >
                  {hourOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span className="notification-dnd-separator">至</span>
                <select
                  value={dnd.end}
                  onChange={(event) => dnd.onEndChange(event.target.value)}
                  className="notification-time-select compact"
                >
                  {hourOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NotificationReminderMethodCard({
  disabled,
  methods,
}: {
  disabled: boolean;
  methods: {
    onSoundToggle: () => void;
    onVibrationToggle: () => void;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}) {
  return (
    <div className="domain-card notification-group-card">
      <div className="article-list">
        <div className="article-item notification-item with-border">
          <div className="notification-item-layout">
            <div className="notification-item-main">
              <Volume2 size={18} className="notification-item-icon is-on" />
              <p className="notification-item-title">声音提醒</p>
            </div>
            <Switch
              checked={methods.soundEnabled}
              onClick={methods.onSoundToggle}
              disabled={disabled}
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
              checked={methods.vibrationEnabled}
              onClick={methods.onVibrationToggle}
              disabled={disabled}
              aria-label="切换震动提醒"
              className="notification-switch"
              knobClassName="notification-switch-knob"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationSaveButton({
  disabled,
  onSave,
  showSaved,
}: {
  disabled: boolean;
  onSave: () => void;
  showSaved: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={onSave}
      variant="primary"
      className="notification-save-btn"
      disabled={disabled}
    >
      {showSaved ? (
        <>
          <Check size={16} className="notification-save-icon" />
          配置已保存
        </>
      ) : (
        '保存设置'
      )}
    </Button>
  );
}
