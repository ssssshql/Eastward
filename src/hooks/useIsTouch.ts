import { useEffect, useState } from 'react';

function detect(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** True on phones and tablets, where the game shows on-screen controls. */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(detect);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setTouch(detect());
    mq.addEventListener('change', onChange);
    const onFirstTouch = () => setTouch(true);
    window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('touchstart', onFirstTouch);
    };
  }, []);
  return touch;
}