import { PageLayout, Masthead, PageContent, PageFooter } from '../components/layout';
import {
  InterestConfigBackButton,
  InterestConfigCategoryList,
  InterestConfigCompleteButton,
  InterestConfigErrorCard,
  InterestConfigHero,
  InterestConfigSubmitButton,
} from '../components/business';
import { useInterestConfigPageLogic } from './useInterestConfigPageLogic';

export default function InterestConfigPage() {
  const {
    categories,
    error,
    handleBack,
    handleComplete,
    loading,
    saving,
    selectedCount,
    selectedInterests,
    toggleInterest,
  } = useInterestConfigPageLogic();

  const disabled = loading || saving;

  return (
    <PageLayout variant="auth">
      <Masthead
        title="配置关注"
        subtitle="决定简报优先追踪的领域"
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        leftButton={
          <InterestConfigBackButton onBack={handleBack} />
        }
        rightButton={
          <InterestConfigCompleteButton
            disabled={saving}
            onComplete={() => void handleComplete()}
            saving={saving}
            selectedCount={selectedCount}
          />
        }
      />

      <PageContent className="interest-config-page-content">
        <InterestConfigErrorCard error={error} />
        <InterestConfigHero loading={loading} selectedCount={selectedCount} />
        <InterestConfigCategoryList
          categories={categories}
          disabled={disabled}
          onToggle={toggleInterest}
          selectedInterests={selectedInterests}
        />
      </PageContent>

      <PageFooter className="interest-config-footer">
        <InterestConfigSubmitButton
          disabled={selectedCount === 0 || disabled}
          onComplete={() => void handleComplete()}
          saving={saving}
        />
      </PageFooter>
    </PageLayout>
  );
}
