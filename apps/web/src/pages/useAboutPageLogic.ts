import { useNavigate } from 'react-router-dom';

export type AboutLinkKind = 'terms' | 'privacy' | 'website' | 'contact' | 'preview';

export interface AboutLinkItem {
  kind: AboutLinkKind;
  title: string;
  onClick: () => void;
}

export interface AboutAppInfo {
  name: string;
  version: string;
  buildNumber: string;
  description: string;
}

const APP_INFO: AboutAppInfo = {
  name: '简报助手',
  version: '1.0.0',
  buildNumber: '2024031601',
  description: 'AI驱动的个人信息助手，帮助你追踪关注领域、管理待办任务、记录成长轨迹。',
};

const FEATURE_ITEMS = [
  '个性化简报推送',
  '智能对话交互',
  '待办任务管理',
  '成长轨迹记录',
  '周报/月报生成',
];

export function useAboutPageLogic() {
  const navigate = useNavigate();

  const links: AboutLinkItem[] = [
    { kind: 'terms', title: '用户协议', onClick: () => {} },
    { kind: 'privacy', title: '隐私政策', onClick: () => {} },
    { kind: 'website', title: '官方网站', onClick: () => window.open('https://jianbao.app', '_blank') },
    { kind: 'contact', title: '联系我们', onClick: () => window.open('mailto:support@jianbao.app') },
    { kind: 'preview', title: '产品预览', onClick: () => navigate('/preview') },
  ];

  return {
    appInfo: APP_INFO,
    featureItems: FEATURE_ITEMS,
    links,
  };
}
