import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import {
  SettingsFootnoteCard,
  SettingsGroupList,
  SettingsStatusCard,
} from '../components/business';
import { useSettingsPageLogic } from './useSettingsPageLogic';

export default function SettingsPage() {
  const { settingsGroups, statusMessage } = useSettingsPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="设置" label="SETTINGS" />

      <PageContent className="settings-page-content">
        {statusMessage ? <SettingsStatusCard message={statusMessage} /> : null}
        <SettingsGroupList groups={settingsGroups} />
        <SettingsFootnoteCard />
      </PageContent>
    </PageLayout>
  );
}
