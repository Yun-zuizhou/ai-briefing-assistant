import { useState, useRef, useCallback, useEffect } from 'react';

export function useChatPanelDrag(onClose: () => void) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const diff = clientY - dragStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
  }, [dragY, onClose]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleDragMove(e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      handleDragEnd();
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientY);
      }
    };
    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return {
    dragY,
    isDragging,
    handleDragStart,
  };
}