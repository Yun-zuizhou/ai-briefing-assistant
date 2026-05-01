import {
  HelpFeedbackCategoryGrid,
  HelpFeedbackErrorCard,
  HelpFeedbackFAQCard,
  HelpFeedbackFootnoteCard,
  HelpFeedbackFormCard,
} from '../components/business';
import { PageLayout, SecondaryHeader, PageContent, PageSection, PageStack } from '../components/layout';
import { useHelpFeedbackPageLogic } from './useHelpFeedbackPageLogic';

export default function HelpFeedbackPage() {
  const {
    canSubmit,
    categories,
    expandedFAQ,
    faqList,
    feedbackContent,
    feedbackType,
    handleSubmitFeedback,
    handleToggleFAQ,
    setFeedbackContent,
    setFeedbackType,
    showSubmitted,
    submitError,
    submitting,
    typeOptions,
  } = useHelpFeedbackPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="帮助与反馈" label="HELP & FEEDBACK" />

      <PageContent className="help-feedback-page-content">
        <PageStack>
          {submitError ? <HelpFeedbackErrorCard error={submitError} /> : null}

          <PageSection className="help-feedback-section" title="快捷入口">
            <HelpFeedbackCategoryGrid categories={categories} />
          </PageSection>

          <PageSection className="help-feedback-section" title="常见问题">
            <HelpFeedbackFAQCard
              expandedIndex={expandedFAQ}
              items={faqList}
              onToggle={handleToggleFAQ}
            />
          </PageSection>

          <PageSection className="help-feedback-section" title="意见反馈">
            <HelpFeedbackFormCard
              canSubmit={canSubmit}
              content={feedbackContent}
              feedbackType={feedbackType}
              onContentChange={setFeedbackContent}
              onSubmit={handleSubmitFeedback}
              onTypeChange={setFeedbackType}
              showSubmitted={showSubmitted}
              submitting={submitting}
              typeOptions={typeOptions}
            />
          </PageSection>

          <HelpFeedbackFootnoteCard />
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
