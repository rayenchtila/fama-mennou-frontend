import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext({ mode: 'system', isDark: true, setMode: () => {} });

function resolveIsDark(mode) {
  if (mode === 'dark')  return true;
  if (mode === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

function applyTheme(isDark) {
  const root = document.documentElement;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.classList.toggle('dark', isDark);
  // Smooth body background transition
  document.body.style.transition = 'background-color 0.25s ease';
  document.body.style.backgroundColor = isDark ? '#0a0817' : '#f8fafc';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => localStorage.getItem('fm_theme') || 'dark');
  const [isDark, setIsDark] = useState(() => resolveIsDark(localStorage.getItem('fm_theme') || 'dark'));

  const setMode = (m) => {
    const next = resolveIsDark(m);
    setModeState(m);
    setIsDark(next);
    localStorage.setItem('fm_theme', m);
    applyTheme(next);
  };

  // Sync DOM on mount and on isDark changes
  useEffect(() => { applyTheme(isDark); }, [isDark]);

  // Toggle convenience (dark ↔ light, no system)
  const toggle = () => setMode(isDark ? 'light' : 'dark');

  // Listen for OS-level changes only when in system mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e) => { setIsDark(e.matches); applyTheme(e.matches); };
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
