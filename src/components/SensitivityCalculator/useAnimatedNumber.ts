import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a numeric value toward `target` using a smoothstep (ease-in-out) curve.
 * Returns the current displayed value, which eases to each new target over `duration` ms.
 */
export function useAnimatedNumber(target: number, duration = 1000): number {
  const [displayedValue, setDisplayedValue] = useState<number>(target);
  const rafRef = useRef<number | null>(null);
  const lastValueRef = useRef(displayedValue);
  lastValueRef.current = displayedValue;

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = lastValueRef.current;
    const to = target;
    const range = to - from;
    if (Math.abs(range) < 0.0001) {
      setDisplayedValue(to);
      return;
    }
    const start = performance.now();
    const easeInOut = (t: number) => t * t * (3 - 2 * t); // smoothstep
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setDisplayedValue(from + range * easeInOut(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return displayedValue;
}
