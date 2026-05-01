import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/useAppContext';
import { formatSubtitleWithLunar } from '../utils/lunarCalendar';

export interface MyEntryItem {
  label: string;
  description: string;
  path: string;
}

export interface MyEntryGroup {
  title: string;
  items: MyEntryItem[];
}

const PRIMARY_ENTRY_ITEMS: MyEntryItem[] = [
  { label: '成长回看', description: '查看周期摘要、报告入口和长期变化', path: '/growth' },
  { label: '我的画像', description: '查看当前画像、关键判断和依据来源', path: '/profile' },
];

const ENTRY_GROUPS: MyEntryGroup[] = [
  {
    title: '我留下的',
    items: [
      { label: '对话记录', description: '查看对话中留下的想法、待办与收藏', path: '/chat?view=records' },
      { label: '我的收藏', description: '查看已经保留下来的热点、文章与机会', path: '/collections' },
      { label: '历史日志', description: '回看过去留下的真实历史痕迹', path: '/history-logs' },
      { label: '历史简报', description: '进入周报、月报、年报的历史回看入口', path: '/history-brief' },
    ],
  },
  {
    title: '系统与支持',
    items: [
      { label: '设置', description: '查看对话配置结果，管理通知和基础偏好', path: '/settings' },
      { label: 'AI 服务设置', description: '配置摘要生成与模型服务偏好', path: '/ai-provider-settings' },
      { label: '帮助反馈', description: '查看常见问题并提交意见反馈', path: '/help-feedback' },
      { label: '关于', description: '查看产品说明与版本信息', path: '/about' },
    ],
  },
];

export function useMyPageLogic() {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  const displayName = user.username || '用户';
  const accountEmail = user.email || '当前账号已登录';
  const avatarLabel = displayName.trim().slice(0, 1).toUpperCase() || '我';
  const subtitle = formatSubtitleWithLunar();

  const entryGroups = useMemo(() => (
    import.meta.env.DEV
      ? ENTRY_GROUPS.map((group) => (
        group.title === '系统与支持'
          ? {
            ...group,
            items: [
              ...group.items,
              { label: '系统诊断', description: '查看 LLM 调用统计与错误分布', path: '/system-diagnostics' },
            ],
          }
          : group
      ))
      : ENTRY_GROUPS
  ), []);

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  return {
    accountEmail,
    avatarLabel,
    displayName,
    entryGroups,
    handleLogout,
    handleNavigate: navigate,
    primaryEntryItems: PRIMARY_ENTRY_ITEMS,
    subtitle,
  };
}
