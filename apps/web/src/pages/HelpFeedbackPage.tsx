import { useState, useCallback } from 'react';
import { MessageCircle, Book, HelpCircle, Send, Check } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Button } from '../components/ui';
import { apiService } from '../services/api';

interface FAQItem {
  question: string;
  answer: string;
}

const faqList: FAQItem[] = [
  {
    question: '如何添加关注的领域？',
    answer: '点击底部导航栏的“对话”按钮，告诉AI你想关注的领域，例如“我想关注AI发展动态”。成长轨迹可以直接从底部“成长”进入，画像等个人沉淀入口也会在那里承接。',
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
    answer: '进入底部“成长”页后点击“历史简报”，可以查看已经生成的周报、月报和年报入口，并直接进入对应的周期回顾详情页。',
  },
  {
    question: '数据会同步到云端吗？',
    answer: '当前正式主线已经通过 Workers + D1 保存登录态、关注、待办、记录、收藏与报告结果。少量演示页与纯展示内容仍保留在本地，但不会再作为正式业务事实源。',
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleFAQ = useCallback((index: number) => {
    setExpandedFAQ(prev => prev === index ? null : index);
  }, []);

  const handleSubmitFeedback = useCallback(() => {
    if (!feedbackContent.trim() || submitting) return;

    void (async () => {
      try {
        setSubmitting(true);
        setSubmitError(null);
        const response = await apiService.submitFeedback({
          feedback_type: feedbackType,
          content: feedbackContent.trim(),
          source_page: 'help_feedback',
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.error || '提交反馈失败');
        }

        setShowSubmitted(true);
        setFeedbackContent('');
        setTimeout(() => setShowSubmitted(false), 2000);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : '提交反馈失败');
      } finally {
        setSubmitting(false);
      }
    })();
  }, [feedbackContent, feedbackType, submitting]);

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

      <PageContent className="help-feedback-page-content">
        {submitError ? (
          <div className="domain-card help-feedback-error-card">
            <p className="help-feedback-error-text">{submitError}</p>
          </div>
        ) : null}

        <div className="section help-feedback-section">
          <div className="section-header">
            <span className="section-title">快捷入口</span>
          </div>
        </div>

        <div className="help-feedback-categories">
          {helpCategories.map((cat, index) => (
            <div
              key={index}
              className="domain-card help-feedback-category-card"
            >
              <div className="help-feedback-category-icon">
                {cat.icon}
              </div>
              <p className="help-feedback-category-title">
                {cat.title}
              </p>
              <p className="help-feedback-category-desc">
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="section help-feedback-section">
          <div className="section-header">
            <span className="section-title">常见问题</span>
          </div>
        </div>

        <div className="domain-card help-feedback-faq-card">
          <div className="article-list">
            {faqList.map((faq, index) => (
              <Button
                key={index}
                type="button"
                variant="unstyled"
                className={`article-item help-feedback-faq-item ${index < faqList.length - 1 ? 'with-border' : ''}`}
                onClick={() => handleToggleFAQ(index)}
              >
                <div className={`help-feedback-faq-head ${expandedFAQ === index ? 'is-open' : ''}`}>
                  <p className="help-feedback-faq-question">
                    <span className="help-feedback-faq-prefix">Q:</span>
                    {faq.question}
                  </p>
                </div>
                {expandedFAQ === index && (
                  <p className="help-feedback-faq-answer">
                    {faq.answer}
                  </p>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="section help-feedback-section">
          <div className="section-header">
            <span className="section-title">意见反馈</span>
          </div>
        </div>

        <div className="domain-card help-feedback-form-card">
          <div className="help-feedback-form-body">
            <div className="help-feedback-type-row">
              {[
                { id: 'bug' as const, label: '问题反馈' },
                { id: 'suggestion' as const, label: '功能建议' },
                { id: 'other' as const, label: '其他' },
              ].map(type => (
                <Button
                  key={type.id}
                  type="button"
                  variant="unstyled"
                  onClick={() => setFeedbackType(type.id)}
                  className={`help-feedback-type-btn ${feedbackType === type.id ? 'is-active' : ''}`}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="请描述你的问题或建议..."
              className="help-feedback-textarea"
            />

            <Button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={!feedbackContent.trim() || submitting}
              variant="primary"
              className="help-feedback-submit-btn"
            >
              {submitting ? (
                <>
                  <Send size={16} className="help-feedback-submit-icon" />
                  提交中...
                </>
              ) : showSubmitted ? (
                <>
                  <Check size={16} className="help-feedback-submit-icon" />
                  已提交
                </>
              ) : (
                <>
                  <Send size={16} className="help-feedback-submit-icon" />
                  提交反馈
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="help-feedback-footnote-card">
          <p className="help-feedback-footnote-text">
            📧 也可以发送邮件至 support@jianbao.app
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
