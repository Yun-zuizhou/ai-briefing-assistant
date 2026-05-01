import {
  NotificationConfigNoticeCard,
  NotificationDndCard,
  NotificationErrorCard,
  NotificationReminderMethodCard,
  NotificationSaveButton,
  NotificationTimeSlotsCard,
} from '../components/business';
import { PageLayout, SecondaryHeader, PageContent, PageSection, PageStack } from '../components/layout';
import { useNotificationSettingsPageLogic } from './useNotificationSettingsPageLogic';

export default function NotificationSettingsPage() {
  const {
    dnd,
    error,
    handleSave,
    handleTimeChange,
    hourOptions,
    loading,
    reminderMethods,
    showSaved,
    timeSlots,
  } = useNotificationSettingsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="通知设置"
        label="NOTIFICATIONS"
        subtitle="管理简报推送时间、免打扰和提醒方式"
      />

      <PageContent className="notification-page-content">
        <PageStack>
          {error ? <NotificationErrorCard error={error} /> : null}
          <NotificationConfigNoticeCard />

          <PageSection className="notification-section" title="推送时间">
            <NotificationTimeSlotsCard
              disabled={loading}
              hourOptions={hourOptions}
              onTimeChange={handleTimeChange}
              slots={timeSlots}
            />
          </PageSection>

          <PageSection className="notification-section" title="免打扰模式">
            <NotificationDndCard disabled={loading} dnd={dnd} hourOptions={hourOptions} />
          </PageSection>

          <PageSection className="notification-section" title="提醒方式">
            <NotificationReminderMethodCard disabled={loading} methods={reminderMethods} />
          </PageSection>

          <NotificationSaveButton
            disabled={loading}
            onSave={() => void handleSave()}
            showSaved={showSaved}
          />
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
