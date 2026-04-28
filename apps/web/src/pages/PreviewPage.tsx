import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, FileText, LayoutTemplate, Sparkles } from 'lucide-react';

import { Masthead, PageContent, PageLayout } from '../components/layout';
import { Button, Tag } from '../components/ui';

const previewSections = [
  {
    icon: <Eye size={18} />,
    title: '内容阅读预览',
    description: '正式文章页已经吸收阅读进度、AI 摘要、相关推荐与阅读操作区，当前预览入口只保留代表性的展示说明，不再暴露旧 demo 阅读页。',
    highlights: ['阅读进度条', 'AI 摘要折叠区', '字号切换', '相关推荐'],
  },
  {
    icon: <LayoutTemplate size={18} />,
    title: '收藏与跟进预览',
    description: '正式收藏页已经吸收机会项的跟进展开区与继续处理入口。预览页只说明已吸收的模式，不再把 demo 收藏页当作正式页面的一部分。',
    highlights: ['机会收藏跟进', '步骤进度展示', '继续处理入口'],
  },
  {
    icon: <FileText size={18} />,
    title: '报告与回看预览',
    description: '周报、月报、年报、成长和历史回看已经形成正式主链。旧故事页只保留为内部参考原型，不再进入正式路由。',
    highlights: ['周报/月报/年报', '成长回看', '历史简报入口'],
  },
  {
    icon: <Sparkles size={18} />,
    title: 'AI Digest Lab',
    description: '阶段十六新增最小调试页，用来验证定向热点收集、摘要结果读取和咨询接口。它属于联调入口，不属于正式产品页面。',
    highlights: ['daily-digest', 'consult', '阶段十六联调'],
  },
];

export default function PreviewPage() {
  const navigate = useNavigate();

  return (
    <PageLayout variant="auth">
      <Masthead
        title="产品预览"
        subtitle="正式 UI 的预览入口"
        ornaments={['✦ PREVIEW ✦', '✦ FORMAL UI ✦']}
      />

      <PageContent className="preview-page-content">
        <div className="domain-card preview-intro-card">
          <p className="preview-intro-text">
            当前预览只作为正式产品的单一入口存在。旧 demo 页面不再通过正式前端路由直接暴露，能吸收的设计和交互已经逐步回收进正式页面。
          </p>
          <p className="preview-intro-meta">
            这意味着：正式前端继续只承载正式产品，而 preview 负责向你快速展示当前产品形态与重点能力。
          </p>
        </div>

        <div className="preview-section-grid">
          {previewSections.map((section) => (
            <div key={section.title} className="domain-card preview-section-card">
              <div className="preview-section-head">
                <div className="preview-section-icon">{section.icon}</div>
                <h3 className="preview-section-title">
                  {section.title}
                </h3>
              </div>
              <p className="preview-section-desc">
                {section.description}
              </p>
              <div className="preview-section-tags">
                {section.highlights.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="domain-card preview-action-card">
          <div className="preview-action-grid">
            <Button
              onClick={() => navigate('/ai-digest-lab')}
              variant="secondary"
              className="preview-action-btn"
            >
              打开 AI Digest Lab
            </Button>
            <Button
              onClick={() => navigate('/welcome')}
              variant="secondary"
              className="preview-action-btn"
            >
              返回欢迎页
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="preview-action-btn"
            >
              进入正式产品
              <ChevronRight size={18} />
            </Button>
          </div>
          <p className="preview-action-note">
            <Sparkles size={12} className="preview-action-note-icon" />
            若当前未登录，进入 AI Digest Lab 会先跳转到欢迎页；登录后可直接访问该调试页。
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
