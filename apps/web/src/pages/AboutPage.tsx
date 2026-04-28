import { Mail, Globe, Heart, Shield, FileText, ChevronRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button } from '../components/ui';

export default function AboutPage() {
  const navigate = useNavigate();
  const appInfo = {
    name: '简报助手',
    version: '1.0.0',
    buildNumber: '2024031601',
    description: 'AI驱动的个人信息助手，帮助你追踪关注领域、管理待办任务、记录成长轨迹。',
  };

  const links = [
    {
      icon: <FileText size={18} />,
      title: '用户协议',
      onClick: () => {},
    },
    {
      icon: <Shield size={18} />,
      title: '隐私政策',
      onClick: () => {},
    },
    {
      icon: <Globe size={18} />,
      title: '官方网站',
      onClick: () => window.open('https://jianbao.app', '_blank'),
    },
    {
      icon: <Mail size={18} />,
      title: '联系我们',
      onClick: () => window.open('mailto:support@jianbao.app'),
    },
    {
      icon: <Eye size={18} />,
      title: '产品预览',
      onClick: () => navigate('/preview'),
    },
  ];

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="关于" label="ABOUT" />

      <PageContent className="about-page-content">
        <div className="about-hero-card">
          <span className="about-hero-frame" />

          <div className="about-logo-badge">
            简
          </div>

          <h1 className="type-page-title about-app-name">
            {appInfo.name}
          </h1>

          <p className="about-version-text">
            版本 {appInfo.version} ({appInfo.buildNumber})
          </p>

          <p className="about-description-text">
            {appInfo.description}
          </p>
        </div>

        <div className="domain-card about-links-card">
          <div className="article-list">
            {links.map((link, index) => (
              <Button
                key={index}
                type="button"
                variant="unstyled"
                className={`article-item about-link-item ${index < links.length - 1 ? 'with-border' : ''}`}
                onClick={link.onClick}
              >
                <div className="about-link-layout">
                  <div className="about-link-main">
                    <div className="about-link-icon">{link.icon}</div>
                    <p className="about-link-title">
                      {link.title}
                    </p>
                  </div>
                  <ChevronRight size={16} className="about-link-chevron" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="about-credit-card">
          <p className="about-credit-text">
            Made with <Heart size={12} className="about-heart-icon" /> by 简报助手团队
          </p>
          <p className="about-copyright-text">
            © 2024 简报助手. All rights reserved.
          </p>
        </div>

        <div className="about-features-card">
          <h3 className="about-features-title">
            🎉 主要功能
          </h3>
          <ul className="about-features-list">
            <li>个性化简报推送</li>
            <li>智能对话交互</li>
            <li>待办任务管理</li>
            <li>成长轨迹记录</li>
            <li>周报/月报生成</li>
          </ul>
        </div>
      </PageContent>
    </PageLayout>
  );
}
