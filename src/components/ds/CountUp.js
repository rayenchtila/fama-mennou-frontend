import { useEffect, useRef, useState } from 'react';

// Same grouping the rest of the app already uses for counts (1 234).
const nf = new Intl.NumberFormat('fr-TN');
const defaultFormat = v => nf.format(v);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A live counter. The first time it scrolls into view it counts up from 0 to
 * `value`; every later change (a freelancer got verified → value goes up, an
 * account was removed → it goes down) eases from the number on screen to the
 * new one, in either direction. While `value` is not known yet (null/undefined)
 * it shows `fallback` instead of a misleading 0.
 *
 * Screen readers get the final value only, never the intermediate frames.
 */
export default function CountUp({ value, duration = 900, format = defaultFormat, fallback = '…', suffix = '', className, style }) {
  const target = value == null || Number.isNaN(Number(value)) ? null : Number(value);
  const rootRef = useRef(null);
  const [seen, setSeen] = useState(false);
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const rafRef = useRef(0);

  // Wait until the number is actually on screen before animating it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (target == null || !seen) return undefined;
    cancelAnimationFrame(rafRef.current);
    const from = shownRef.current;
    if (prefersReducedMotion() || from === target) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      shownRef.current = v; // an interrupted animation resumes from what is on screen
      setShown(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, seen, duration]);

  if (target == null) {
    return <span ref={rootRef} className={className} style={style}>{fallback}</span>;
  }
  return (
    <span ref={rootRef} className={className} style={style}>
      <span aria-hidden="true">{format(shown)}{suffix}</span>
      <span className="sr-only">{format(target)}{suffix}</span>
    </span>
  );
}
