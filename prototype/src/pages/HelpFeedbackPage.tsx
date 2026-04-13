import { useState, useCallback } from 'react';
import { MessageCircle, Book, HelpCircle, Send, Check } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';

interface FAQItem {
  question: string;
  answer: string;
}

const faqList: FAQItem[] = [
  {
    question: '如何添加关注的领域？',
    answer: '点击底部导航栏的"对话"按钮，告诉AI你想关注的领域，例如"我想关注AI发展动态"。也可以先进入“我的”页，再进入成长、画像等个人沉淀入口继续查看相关内容。',
  },
  {
    question: '如何创建待办任务？',
    answer: '在对话页面输入你的任务，例如"明天提醒我投简历"，AI会自动识别并创建待办事项。你也可以设置截止日期和提醒时间。',
  },
  {
    question: '简报是如何生成的？',
    answer: '系统会根据你关注的领域，每天定时抓取相关资讯，并使用AI进行筛选和整理，生成个性化的简报内容。',
  },
  {
    question: '如何查看历史简报？',
    answer: '进入“我的”页后点击“历史简报”，可以查看已经生成的周报、月报和年报入口，并直接进入对应的周期回顾详情页。',
  },
  {
    question: '数据会同步到云端吗？',
    answer: '目前数据存储在本地，登录后数据会与账号关联。后续版本将支持云端同步功能。',
  },
];

interface HelpCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function HelpFeedbackPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [showSubmitted, setShowSubmitted] = useState(false);

  const handleToggleFAQ = useCallback((index: number) => {
    setExpandedFAQ(prev => prev === index ? null : index);
  }, []);

  const handleSubmitFeedback = useCallback(() => {
    if (!feedbackContent.trim()) return;
    console.log('Feedback submitted:', { type: feedbackType, content: feedbackContent });
    setShowSubmitted(true);
    setFeedbackContent('');
    setTimeout(() => setShowSubmitted(false), 2000);
  }, [feedbackType, feedbackContent]);

  const helpCategories: HelpCategory[] = [
    {
      icon: <Book size={20} />,
      title: '使用指南',
      description: '了解如何使用各项功能',
    },
    {
      icon: <MessageCircle size={20} />,
      title: '常见问题',
      description: '查看常见问题解答',
    },
    {
      icon: <HelpCircle size={20} />,
      title: '联系客服',
      description: '获取人工帮助',
    },
  ];

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="帮助与反馈" label="HELP & FEEDBACK" />

      <PageContent style={{ padding: '16px' }}>
        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">快捷入口</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {helpCategories.map((cat, index) => (
            <div
              key={index}
              className="domain-card"
              style={{
                flex: 1,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--paper-warm)',
                border: '1px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}>
                {cat.icon}
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {cat.title}
              </p>
              <p style={{ fontSize: '10px', color: 'var(--ink-muted)', margin: '4px 0 0' }}>
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">常见问题</span>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div className="article-list">
            {faqList.map((faq, index) => (
              <div
                key={index}
                className="article-item"
                style={{
                  padding: '14px',
                  borderBottom: index < faqList.length - 1 ? '1px dashed var(--border)' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleFAQ(index)}
              >
                <div style={{ marginBottom: expandedFAQ === index ? '8px' : 0 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--ink)', 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span style={{ color: 'var(--accent)' }}>Q:</span>
                    {faq.question}
                  </p>
                </div>
                {expandedFAQ === index && (
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--ink-light)', 
                    lineHeight: 1.6,
                    margin: 0,
                    paddingLeft: '20px',
                  }}>
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="section" style={{ paddingBottom: '8px' }}>
          <div className="section-header">
            <span className="section-title">意见反馈</span>
          </div>
        </div>

        <div className="domain-card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { id: 'bug' as const, label: '问题反馈' },
                { id: 'suggestion' as const, label: '功能建议' },
                { id: 'other' as const, label: '其他' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFeedbackType(type.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: feedbackType === type.id ? 'var(--ink)' : 'var(--paper-warm)',
                    border: '1px solid var(--ink)',
                    color: feedbackType === type.id ? 'var(--paper)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-serif-cn)',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="请描述你的问题或建议..."
              style={{
                width: '100%',
                height: '100px',
                padding: '12px',
                border: '2px solid var(--ink)',
                background: 'var(--paper)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif-cn)',
                resize: 'none',
                outline: 'none',
              }}
            />

            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackContent.trim()}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                marginTop: '12px',
                opacity: feedbackContent.trim() ? 1 : 0.5,
              }}
            >
              {showSubmitted ? (
                <>
                  <Check size={16} style={{ marginRight: '6px' }} />
                  已提交
                </>
              ) : (
                <>
                  <Send size={16} style={{ marginRight: '6px' }} />
                  提交反馈
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--paper-warm)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>
            📧 也可以发送邮件至 support@jianbao.app
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
