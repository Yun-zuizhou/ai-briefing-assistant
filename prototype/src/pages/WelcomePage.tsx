import { useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent, PageFooterDecorative } from '../components/layout';

const slides = [
  {
    emoji: '📰',
    title: '每天一份简报',
    description: '帮你收集世界，记录自己，看见成长',
  },
  {
    emoji: '🔍',
    title: '智能信息追踪',
    description: '从热点中提炼机会，从趋势中发现方向',
  },
  {
    emoji: '📖',
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
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              fontSize: '13px',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-serif-cn)',
            }}
          >
            跳过
          </button>
        }
      />

      <PageContent style={{ padding: '16px' }}>
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div className="domain-card" style={{ 
            padding: '40px 24px', 
            textAlign: 'center', 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              border: '3px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '4px',
                bottom: '4px',
                border: '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: '40px' }}>{slide.emoji}</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '20px',
            }}>
              <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
              <div style={{
                width: '8px',
                height: '8px',
                background: 'var(--gold)',
                transform: 'rotate(45deg)',
              }} />
              <div style={{ width: '40px', height: '1px', background: 'var(--gold)' }} />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-serif-cn)',
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--ink)',
              textAlign: 'center',
              marginBottom: '14px',
              lineHeight: 1.3,
              letterSpacing: '0.05em',
            }}>
              {slide.title}
            </h2>

            <p style={{
              fontSize: '15px',
              color: 'var(--ink-muted)',
              textAlign: 'center',
              lineHeight: 1.8,
              maxWidth: '260px',
              margin: '0 auto 28px',
              fontFamily: 'var(--font-serif-cn)',
            }}>
              {slide.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '28px',
            }}>
              {slides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => goToSlide(i)}
                  style={{
                    width: i === currentSlide ? '24px' : '10px',
                    height: '10px',
                    background: i === currentSlide ? 'var(--ink)' : 'var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '5px',
                  }}
                />
              ))}
            </div>

            <div>
              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                >
                  开始使用 <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={() => goToSlide(currentSlide + 1)}
                  className="btn"
                  style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                >
                  下一步 <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}
