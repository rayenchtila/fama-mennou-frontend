import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext({ mode: 'system', isDark: true, setMode: () => {} });

function resolveIsDark(mode) {
  if (mode === 'dark')  return true;
  if (mode === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

let transitionTimer = null;

function applyTheme(isDark, withTransition = false) {
  const root = document.documentElement;

  if (withTransition && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-transition');
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), 600);
  }

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem('fm_theme') || 'dark');
  const [isDark, setIsDark] = useState(() => resolveIsDark(localStorage.getItem('fm_theme') || 'dark'));

  const setMode = (m) => {
    const next = resolveIsDark(m);
    setModeState(m);
    setIsDark(next);
    localStorage.setItem('fm_theme', m);
    applyTheme(next, true);
  };

  // Sync DOM on mount (no transition — avoid a flash/fade on first paint)
  useEffect(() => { applyTheme(isDark, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle convenience (dark ↔ light, no system)
  const toggle = () => setMode(isDark ? 'light' : 'dark');

  // Listen for OS-level changes only when in system mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e) => { setIsDark(e.matches); applyTheme(e.matches, true); };
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, setMode, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
