import { useRef, useEffect } from 'react';

/**
 * Hook that enables drag-to-scroll behavior on a scroll container
 * Supports both mouse and touch/pointer events
 * Does not reorder items - pure scrolling only
 */
export function useDragToScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - element.offsetLeft;
      startY.current = e.pageY - element.offsetTop;
      scrollLeft.current = element.scrollLeft;
      scrollTop.current = element.scrollTop;
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startX.current) * 1.5; // Scroll speed multiplier
      const walkY = (y - startY.current) * 1.5;
      
      element.scrollLeft = scrollLeft.current - walkX;
      element.scrollTop = scrollTop.current - walkY;
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = '';
    };

    const handlePointerLeave = () => {
      if (isDragging.current) {
        isDragging.current = false;
        element.style.cursor = 'grab';
        element.style.userSelect = '';
      }
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerLeave);

    // Set initial cursor
    element.style.cursor = 'grab';

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return ref;
}
