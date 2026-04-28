import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, FileText, LayoutTemplate, Sparkles } from 'lucide-react';

import { Masthead, PageBody, PageContent, PageLayout, PagePanel, PageSection, PageSectionHeader } from '../components/layout';

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

      <PageContent>
        <PageBody>
          <PageSection compact>
            <PagePanel>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.8, marginBottom: '10px' }}>
                当前预览只作为正式产品的单一入口存在。旧 demo 页面不再通过正式前端路由直接暴露，能吸收的设计和交互已经逐步回收进正式页面。
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
                这意味着：正式前端继续只承载正式产品，而 preview 负责向你快速展示当前产品形态与重点能力。
              </p>
            </PagePanel>
          </PageSection>

          <PageSection>
            <PageSectionHeader title="当前吸收进正式链路的能力" />
            <div style={{ display: 'grid', gap: '12px' }}>
              {previewSections.map((section) => (
                <PagePanel key={section.title}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ color: 'var(--accent)' }}>{section.icon}</div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      {section.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-light)', lineHeight: 1.7, marginBottom: '10px' }}>
                    {section.description}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {section.highlights.map((item) => (
                      <span key={item} className="tag">{item}</span>
                    ))}
                  </div>
                </PagePanel>
              ))}
            </div>
          </PageSection>

          <PageSection>
            <PageSectionHeader title="预览入口" />
            <PagePanel>
              <div style={{ display: 'grid', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/ai-digest-lab')}
                  className="btn"
                  style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  打开 AI Digest Lab
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/welcome')}
                  className="btn"
                  style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  返回欢迎页
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  进入正式产品
                  <ChevronRight size={18} />
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '12px', textAlign: 'center' }}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: '6px' }} />
                若当前未登录，进入 AI Digest Lab 会先跳转到欢迎页；登录后可直接访问该调试页。
              </p>
            </PagePanel>
          </PageSection>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}
