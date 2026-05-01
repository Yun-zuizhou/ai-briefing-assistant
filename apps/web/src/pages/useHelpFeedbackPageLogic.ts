import { useCallback, useState } from 'react';

import { apiService } from '../services/api';

export type FeedbackType = 'bug' | 'suggestion' | 'other';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HelpCategoryItem {
  kind: 'guide' | 'faq' | 'support';
  title: string;
  description: string;
}

export const FEEDBACK_TYPE_OPTIONS: Array<{ id: FeedbackType; label: string }> = [
  { id: 'bug', label: '问题反馈' },
  { id: 'suggestion', label: '功能建议' },
  { id: 'other', label: '其他' },
];

const FAQ_LIST: FAQItem[] = [
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

const HELP_CATEGORIES: HelpCategoryItem[] = [
  {
    kind: 'guide',
    title: '使用指南',
    description: '了解如何使用各项功能',
  },
  {
    kind: 'faq',
    title: '常见问题',
    description: '查看常见问题解答',
  },
  {
    kind: 'support',
    title: '联系客服',
    description: '获取人工帮助',
  },
];

export function useHelpFeedbackPageLogic() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggleFAQ = useCallback((index: number) => {
    setExpandedFAQ((prev) => prev === index ? null : index);
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

  return {
    canSubmit: Boolean(feedbackContent.trim()) && !submitting,
    categories: HELP_CATEGORIES,
    expandedFAQ,
    faqList: FAQ_LIST,
    feedbackContent,
    feedbackType,
    handleSubmitFeedback,
    handleToggleFAQ,
    setFeedbackContent,
    setFeedbackType,
    showSubmitted,
    submitError,
    submitting,
    typeOptions: FEEDBACK_TYPE_OPTIONS,
  };
}
