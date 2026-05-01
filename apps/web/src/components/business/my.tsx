import { PageGrid } from '../layout';
import { Button } from '../ui';
import { NavigationEntryCard } from './common';

interface MyEntryItem {
  label: string;
  description: string;
  path: string;
}

export function MyAccountOverviewCard({
  accountEmail,
  avatarLabel,
  displayName,
  onOpenSettings,
}: {
  accountEmail: string;
  avatarLabel: string;
  displayName: string;
  onOpenSettings: () => void;
}) {
  return (
    <div className="domain-card my-account-overview-card">
      <div className="my-account-avatar" aria-hidden="true">
        {avatarLabel}
      </div>
      <div className="my-account-identity">
        <p className="my-account-name">{displayName}</p>
        <p className="my-account-email">{accountEmail}</p>
      </div>
      <Button
        type="button"
        onClick={onOpenSettings}
        variant="unstyled"
        className="action-chip my-account-settings"
      >
        设置
      </Button>
    </div>
  );
}

export function MyEntryGrid({
  className,
  items,
  onNavigate,
}: {
  className: string;
  items: MyEntryItem[];
  onNavigate: (path: string) => void;
}) {
  return (
    <PageGrid className={className}>
      {items.map((item) => (
        <NavigationEntryCard
          key={item.path}
          onClick={() => onNavigate(item.path)}
          title={item.label}
          description={item.description}
        />
      ))}
    </PageGrid>
  );
}

export function MyAccountSecurityCard({
  accountEmail,
  displayName,
  onLogout,
}: {
  accountEmail: string;
  displayName: string;
  onLogout: () => void;
}) {
  return (
    <div className="domain-card my-account-card">
      <div className="my-account-main">
        <p className="my-account-name">{displayName}</p>
        <p className="my-account-email">{accountEmail}</p>
      </div>
      <Button
        type="button"
        onClick={onLogout}
        variant="unstyled"
        className="action-chip my-account-logout"
      >
        退出登录
      </Button>
    </div>
  );
}
