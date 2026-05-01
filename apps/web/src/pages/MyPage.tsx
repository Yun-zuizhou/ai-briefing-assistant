import {
  MyAccountOverviewCard,
  MyAccountSecurityCard,
  MyEntryGrid,
} from '../components/business';
import { PageContent, PageLayout, PageSection, PageStack, Masthead } from '../components/layout';
import { useMyPageLogic } from './useMyPageLogic';

export default function MyPage() {
  const {
    accountEmail,
    avatarLabel,
    displayName,
    entryGroups,
    handleLogout,
    handleNavigate,
    primaryEntryItems,
    subtitle,
  } = useMyPageLogic();

  return (
    <PageLayout variant="main">
      <Masthead
        title="我的"
        subtitle={subtitle}
        ornaments={['✦ MY ✦', '✦ CENTER ✦']}
        metaLinks={[
          { label: '设置', onClick: () => handleNavigate('/settings') },
          { label: '帮助', onClick: () => handleNavigate('/help-feedback') },
        ]}
      />

      <PageContent className="my-page-content">
        <PageStack>
          <MyAccountOverviewCard
            accountEmail={accountEmail}
            avatarLabel={avatarLabel}
            displayName={displayName}
            onOpenSettings={() => handleNavigate('/settings')}
          />

          <PageSection title="个人沉淀">
            <MyEntryGrid
              className="my-primary-entry-grid"
              items={primaryEntryItems}
              onNavigate={handleNavigate}
            />
          </PageSection>

          {entryGroups.map((group) => (
            <PageSection title={group.title} key={group.title}>
              <MyEntryGrid
                className="my-entry-list"
                items={group.items}
                onNavigate={handleNavigate}
              />
            </PageSection>
          ))}

          <PageSection title="账号与安全" className="my-account-section">
            <MyAccountSecurityCard
              accountEmail={accountEmail}
              displayName={displayName}
              onLogout={() => void handleLogout()}
            />
          </PageSection>
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
