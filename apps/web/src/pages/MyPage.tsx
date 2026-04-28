import { useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, Masthead } from '../components/layout';
import { NavigationEntryCard } from '../components/business/common';
import { Button } from '../components/ui';
import { useAppContext } from '../context/useAppContext';
import { formatSubtitleWithLunar } from '../utils/lunarCalendar';

const PRIMARY_ENTRY_ITEMS = [
  { label: '成长回看', description: '查看周期摘要、报告入口和长期变化', path: '/growth' },
  { label: '我的画像', description: '查看当前画像、兴趣关键词和个人理解', path: '/profile' },
] as const;

const ENTRY_GROUPS = [
  {
    title: '我留下的',
    items: [
      { label: '日志记录', description: '回到最近的想法、行动和沉淀入口', path: '/log' },
      { label: '我的收藏', description: '查看已经保留下来的热点、文章与机会', path: '/collections' },
      { label: '历史日志', description: '回看过去留下的真实历史痕迹', path: '/history-logs' },
      { label: '历史简报', description: '进入周报、月报、年报的历史回看入口', path: '/history-brief' },
    ],
  },
  {
    title: '系统与支持',
    items: [
      { label: '设置', description: '管理通知、推送时间和基础偏好', path: '/settings' },
      { label: 'AI 服务设置', description: '配置摘要生成与模型服务偏好', path: '/ai-provider-settings' },
      { label: '帮助反馈', description: '查看常见问题并提交意见反馈', path: '/help-feedback' },
      { label: '关于', description: '查看产品说明与版本信息', path: '/about' },
    ],
  },
] as const;

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  const subtitle = formatSubtitleWithLunar();
  const displayName = user.username || '用户';
  const accountEmail = user.email || '当前账号已登录';
  const avatarLabel = displayName.trim().slice(0, 1).toUpperCase() || '我';

  return (
    <PageLayout variant="main">
      <Masthead
        title="我的"
        subtitle={subtitle}
        ornaments={['✦ MY ✦', '✦ CENTER ✦']}
        metaLinks={[
          { label: '设置', onClick: () => navigate('/settings') },
          { label: '帮助', onClick: () => navigate('/help-feedback') },
        ]}
      />

      <PageContent className="my-page-content">
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
            onClick={() => navigate('/settings')}
            variant="unstyled"
            className="action-chip my-account-settings"
          >
            设置
          </Button>
        </div>

        <div className="section my-entry-section">
          <div className="section-header">
            <span className="section-title">个人沉淀</span>
          </div>
        </div>

        <div className="my-primary-entry-grid">
          {PRIMARY_ENTRY_ITEMS.map((item) => (
            <NavigationEntryCard
              key={item.path}
              onClick={() => navigate(item.path)}
              title={item.label}
              description={item.description}
            />
          ))}
        </div>

        {ENTRY_GROUPS.map((group) => (
          <section className="section my-entry-group" key={group.title}>
            <div className="section-header">
              <span className="section-title">{group.title}</span>
            </div>
            <div className="my-entry-list">
              {group.items.map((item) => (
                <NavigationEntryCard
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  description={item.description}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="section my-account-section">
          <div className="section-header">
            <span className="section-title">账号与安全</span>
          </div>
          <div className="domain-card my-account-card">
            <div className="my-account-main">
              <p className="my-account-name">{displayName}</p>
              <p className="my-account-email">{accountEmail}</p>
            </div>
            <Button
              type="button"
              onClick={() => void logout().then(() => navigate('/welcome'))}
              variant="unstyled"
              className="action-chip my-account-logout"
            >
              退出登录
            </Button>
          </div>
        </section>
      </PageContent>
    </PageLayout>
  );
}
