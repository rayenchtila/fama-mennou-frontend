import { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeCtx = createContext({
  mode: 'dark', isDark: true, setMode: () => {}, toggle: () => {}, setPageDefault: () => {},
});

const STORAGE_KEY = 'fm_theme';

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function systemPrefersDark() {
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
  // `chosen` is what the visitor explicitly picked with the toggle (persisted).
  // It stays null until they do, so a page can offer its own natural theme to
  // first-time visitors (`pageDefault` below) without ever overriding a choice.
  const [chosen, setChosen] = useState(readStored);
  const [pageDefault, setPageDefault] = useState(null);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const mode = chosen || pageDefault || 'dark';
  const isDark = mode === 'system' ? systemDark : mode === 'dark';

  const setMode = (m) => {
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* storage blocked — the choice just lasts for this visit */ }
    setChosen(m);
  };

  // Toggle convenience (dark ↔ light, no system)
  const toggle = () => setMode(isDark ? 'light' : 'dark');

  // Sync the DOM. The first run is silent (no fade on first paint); every
  // later change — toggle click or a page switching its default — cross-fades.
  const firstRun = useRef(true);
  useEffect(() => {
    applyTheme(isDark, !firstRun.current);
    firstRun.current = false;
  }, [isDark]);

  // Listen for OS-level changes only when in system mode
  useEffect(() => {
    if (mode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, setMode, isDark, toggle, setPageDefault }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

// A page's natural theme ("light" | "dark" | null). Only used while the visitor
// has never touched the theme toggle; their own choice always wins.
export function usePageTheme(defaultMode) {
  const { setPageDefault } = useContext(ThemeCtx);
  useEffect(() => {
    setPageDefault(defaultMode || null);
    return () => setPageDefault(null);
  }, [defaultMode, setPageDefault]);
}

// Swaps the accent family (indigo → emerald …) for everything that reads the
// --ds-* tokens — including the shared header — while the page is mounted.
export function usePageAccent(accent) {
  useEffect(() => {
    if (!accent) return undefined;
    const root = document.documentElement;
    root.setAttribute('data-accent', accent);
    return () => root.removeAttribute('data-accent');
  }, [accent]);
}
