import { useCallback, useState, type TouchEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const WELCOME_SLIDE_COUNT = 3;

export function useWelcomePageLogic() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchOffset, setTouchOffset] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((current) => (index === current ? current : index));
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    setTouchStart(event.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const diff = event.targetTouches[0].clientX - touchStart;
    setTouchOffset(diff);
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (touchOffset < -75 && currentSlide < WELCOME_SLIDE_COUNT - 1) {
      goToSlide(currentSlide + 1);
    } else if (touchOffset > 75 && currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
    setTouchOffset(0);
  }, [currentSlide, goToSlide, touchOffset]);

  const handleNext = useCallback(() => {
    goToSlide(Math.min(currentSlide + 1, WELCOME_SLIDE_COUNT - 1));
  }, [currentSlide, goToSlide]);

  const openLogin = useCallback(() => {
    navigate('/login', { state: location.state });
  }, [location.state, navigate]);

  return {
    currentSlide,
    goToSlide,
    handleNext,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    openLogin,
    touchOffset,
  };
}
