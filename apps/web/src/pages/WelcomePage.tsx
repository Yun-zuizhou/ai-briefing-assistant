import { WelcomeSlideDeck } from '../components/business';
import { PageContent, PageFooterDecorative, PageLayout, Masthead } from '../components/layout';
import { Button } from '../components/ui';
import { useWelcomePageLogic } from './useWelcomePageLogic';

export default function WelcomePage() {
  const {
    currentSlide,
    goToSlide,
    handleNext,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    openLogin,
    touchOffset,
  } = useWelcomePageLogic();

  return (
    <PageLayout variant="auth">
      <Masthead
        title="简 报"
        subtitle="发现你的信息世界"
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        rightButton={
          <Button onClick={openLogin} variant="unstyled" className="welcome-skip-btn">
            跳过
          </Button>
        }
      />

      <PageContent className="welcome-page-content">
        <WelcomeSlideDeck
          currentSlide={currentSlide}
          touchOffset={touchOffset}
          onGoToSlide={goToSlide}
          onNext={handleNext}
          onStart={openLogin}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
        />
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}
