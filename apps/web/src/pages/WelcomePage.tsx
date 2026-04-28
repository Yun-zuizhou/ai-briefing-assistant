import { useState, useRef } from 'react';
import { BookOpen, ChevronRight, Newspaper, Radar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent, PageFooterDecorative } from '../components/layout';
import { Button } from '../components/ui';

const slides = [
  {
    icon: <Newspaper size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '每天一份简报',
    description: '帮你收集世界，记录自己，看见成长',
  },
  {
    icon: <Radar size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '智能信息追踪',
    description: '从热点中提炼机会，从趋势中发现方向',
  },
  {
    icon: <BookOpen size={38} strokeWidth={1.9} className="auth-icon-glyph" />,
    title: '你的个人叙事',
    description: 'AI帮你绘制专属画像，见证成长轨迹',
  },
];

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchOffset, setTouchOffset] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setCurrentSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.targetTouches[0].clientX - touchStart;
    setTouchOffset(diff);
  };

  const handleTouchEnd = () => {
    if (touchOffset < -75 && currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else if (touchOffset > 75 && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
    setTouchOffset(0);
  };

  const slide = slides[currentSlide];

  return (
    <PageLayout variant="auth">
      <Masthead
        title="简 报"
        subtitle="发现你的信息世界"
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        rightButton={
          <Button onClick={() => navigate('/login')} variant="unstyled" className="welcome-skip-btn">
            跳过
          </Button>
        }
      />

      <PageContent className="welcome-page-content">
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`welcome-slider-shell${touchOffset === 0 ? ' is-resting' : ' is-dragging'}`}
          style={touchOffset === 0 ? undefined : { transform: `translateX(${Math.max(Math.min(touchOffset * 0.08, 12), -12)}px)` }}
        >
          <div className="domain-card welcome-slide-card">
            <div className="auth-icon-shell">
              {slide.icon}
            </div>

            <div className="welcome-slide-ornament">
              <span className="welcome-ornament-line" />
              <span className="welcome-ornament-diamond" />
              <span className="welcome-ornament-line" />
            </div>

            <h2 className="welcome-slide-title">
              {slide.title}
            </h2>

            <p className="welcome-slide-desc">
              {slide.description}
            </p>

            <div className="welcome-dots">
              {slides.map((_, i) => (
                <Button
                  type="button"
                  key={i}
                  variant="unstyled"
                  onClick={() => goToSlide(i)}
                  aria-label={`切换到第 ${i + 1} 页`}
                  aria-pressed={i === currentSlide}
                  className={`welcome-dot${i === currentSlide ? ' is-active' : ''}`}
                >
                  <span aria-hidden="true" />
                </Button>
              ))}
            </div>

            <p className="micro-meta welcome-slide-meta">
              左右滑动翻页，也可以点下方进度切换内容
            </p>

            <div className="welcome-action-row">
              {currentSlide === slides.length - 1 ? (
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="welcome-action-btn"
                >
                  开始使用 <ChevronRight size={20} />
                </Button>
              ) : (
                <Button
                  onClick={() => goToSlide(currentSlide + 1)}
                  variant="secondary"
                  className="welcome-action-btn"
                >
                  下一步 <ChevronRight size={20} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}
