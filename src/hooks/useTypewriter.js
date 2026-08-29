import { useState, useEffect, useMemo } from "react";

// Types `fullText` out character by character with slightly randomized timing
// (real typing is never perfectly even) and a longer pause after punctuation.
// Restarts whenever `fullText` changes — which happens naturally on a fresh
// mount (every first visit / reload of the page it's used on) and also
// whenever the user switches language, since t() then returns a different
// string. Respects prefers-reduced-motion by skipping straight to the full
// text. Shared by Home.js's hero headline and dashboard greetings — anywhere
// that wants the same "being typed live" feel.
export function useTypewriter(fullText, speed = 42) {
  const [count, setCount] = useState(0);
  const chars = useMemo(() => Array.from(fullText || ''), [fullText]);
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (reduceMotion) { setCount(chars.length); return; }
    setCount(0);
    if (!chars.length) return undefined;
    let i = 0;
    let cancelled = false;
    let timeoutId;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setCount(i);
      if (i < chars.length) {
        const prevChar = chars[i - 1];
        const base = /[.,!?\n]/.test(prevChar) ? speed * 6.5 : speed;
        timeoutId = setTimeout(tick, base * (0.55 + Math.random() * 0.9));
      }
    };
    timeoutId = setTimeout(tick, 380);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [chars, reduceMotion, speed]);

  return { text: chars.slice(0, count).join(''), done: count >= chars.length };
}

export function TypeCursor({ color = 'var(--fm-primary-light)' }) {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: '3px', height: '0.85em', marginInlineStart: '3px',
      verticalAlign: '-0.1em', background: color, animation: 'fmTypeCursor 0.9s step-end infinite',
    }} />
  );
}

// Injected once per component that renders a TypeCursor — cheap and
// idempotent (a duplicate <style> tag with the same rule is harmless).
export function TypeCursorStyle() {
  return <style>{`@keyframes fmTypeCursor { 0%,45% { opacity:1; } 50%,100% { opacity:0; } }`}</style>;
}
