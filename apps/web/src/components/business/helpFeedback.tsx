import { Book, Check, HelpCircle, MessageCircle, Send } from 'lucide-react';
import type { ChangeEvent } from 'react';

import { Button } from '../ui';

type FeedbackType = 'bug' | 'suggestion' | 'other';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpCategoryItem {
  kind: 'guide' | 'faq' | 'support';
  title: string;
  description: string;
}

interface FeedbackTypeOption {
  id: FeedbackType;
  label: string;
}

const CATEGORY_ICONS = {
  guide: <Book size={20} />,
  faq: <MessageCircle size={20} />,
  support: <HelpCircle size={20} />,
};

export function HelpFeedbackErrorCard({
  error,
}: {
  error: string;
}) {
  return (
    <div className="domain-card help-feedback-error-card">
      <p className="help-feedback-error-text">{error}</p>
    </div>
  );
}

export function HelpFeedbackCategoryGrid({
  categories,
}: {
  categories: HelpCategoryItem[];
}) {
  return (
    <div className="help-feedback-categories">
      {categories.map((category) => (
        <div
          key={category.kind}
          className="domain-card help-feedback-category-card"
        >
          <div className="help-feedback-category-icon">
            {CATEGORY_ICONS[category.kind]}
          </div>
          <p className="help-feedback-category-title">
            {category.title}
          </p>
          <p className="help-feedback-category-desc">
            {category.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function HelpFeedbackFAQCard({
  expandedIndex,
  items,
  onToggle,
}: {
  expandedIndex: number | null;
  items: FAQItem[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="domain-card help-feedback-faq-card">
      <div className="article-list">
        {items.map((faq, index) => (
          <Button
            key={faq.question}
            type="button"
            variant="unstyled"
            className={`article-item help-feedback-faq-item ${index < items.length - 1 ? 'with-border' : ''}`}
            onClick={() => onToggle(index)}
          >
            <div className={`help-feedback-faq-head ${expandedIndex === index ? 'is-open' : ''}`}>
              <p className="help-feedback-faq-question">
                <span className="help-feedback-faq-prefix">Q:</span>
                {faq.question}
              </p>
            </div>
            {expandedIndex === index && (
              <p className="help-feedback-faq-answer">
                {faq.answer}
              </p>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function HelpFeedbackFormCard({
  canSubmit,
  content,
  feedbackType,
  onContentChange,
  onSubmit,
  onTypeChange,
  showSubmitted,
  submitting,
  typeOptions,
}: {
  canSubmit: boolean;
  content: string;
  feedbackType: FeedbackType;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  onTypeChange: (type: FeedbackType) => void;
  showSubmitted: boolean;
  submitting: boolean;
  typeOptions: FeedbackTypeOption[];
}) {
  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(event.target.value);
  };

  return (
    <div className="domain-card help-feedback-form-card">
      <div className="help-feedback-form-body">
        <div className="help-feedback-type-row">
          {typeOptions.map((type) => (
            <Button
              key={type.id}
              type="button"
              variant="unstyled"
              onClick={() => onTypeChange(type.id)}
              className={`help-feedback-type-btn ${feedbackType === type.id ? 'is-active' : ''}`}
            >
              {type.label}
            </Button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="请描述你的问题或建议..."
          className="help-feedback-textarea"
        />

        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
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
  );
}

export function HelpFeedbackFootnoteCard() {
  return (
    <div className="help-feedback-footnote-card">
      <p className="help-feedback-footnote-text">
        📧 也可以发送邮件至 support@jianbao.app
      </p>
    </div>
  );
}
