import { Mail, Globe, Heart, Shield, FileText, ChevronRight } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';

export default function AboutPage() {
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
  ];

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="关于" label="ABOUT" />

      <PageContent style={{ padding: '16px' }}>
        <div style={{
          padding: '24px',
          background: 'var(--paper-warm)',
          border: '2px solid var(--ink)',
          marginBottom: '16px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            right: '3px',
            bottom: '3px',
            border: '1px solid var(--ink)',
            pointerEvents: 'none',
          }} />
          
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '36px',
            fontWeight: 900,
            color: 'var(--paper)',
          }}>
            简
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: 900,
            color: 'var(--ink)',
            marginBottom: '4px',
            fontFamily: 'var(--font-serif-cn)',
          }}>
            {appInfo.name}
          </h1>
          
          <p style={{
            fontSize: '14px',
            color: 'var(--ink-muted)',
            marginBottom: '16px',
          }}>
            版本 {appInfo.version} ({appInfo.buildNumber})
          </p>
          
          <p style={{
            fontSize: '13px',
            color: 'var(--ink-light)',
            lineHeight: 1.8,
            margin: 0,
          }}>
            {appInfo.description}
          </p>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            {links.map((link, index) => (
              <div
                key={index}
                className="article-item"
                style={{
                  padding: '14px',
                  cursor: 'pointer',
                  borderBottom: index < links.length - 1 ? '1px dashed var(--border)' : 'none',
                }}
                onClick={link.onClick}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--ink)' }}>{link.icon}</div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      {link.title}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ink-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-muted)',
            lineHeight: 1.8,
            margin: 0,
          }}>
            Made with <Heart size={12} style={{ color: 'var(--accent)', display: 'inline' }} /> by 简报助手团队
          </p>
          <p style={{
            fontSize: '11px',
            color: 'var(--ink-light)',
            marginTop: '8px',
            marginBottom: 0,
          }}>
            © 2024 简报助手. All rights reserved.
          </p>
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--paper-warm)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '12px',
          }}>
            🎉 主要功能
          </h3>
          <ul style={{
            fontSize: '13px',
            color: 'var(--ink-light)',
            lineHeight: 1.8,
            margin: 0,
            paddingLeft: '20px',
          }}>
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
