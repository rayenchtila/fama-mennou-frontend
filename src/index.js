import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import "./i18n";
import "./lib/fetchInterceptor"; // patches window.fetch to attach JWT to backend calls
import App from "./App";

// No-op unless REACT_APP_SENTRY_DSN is set at build time (CRA only exposes
// env vars prefixed REACT_APP_ to the client bundle).
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Instagram's (and some other apps') in-app browser injects its own
    // navigation-performance JS bridge (iabjs://navigation_performance_logger_android)
    // and throws this when its own native-side object is torn down mid-call —
    // happens on effectively any site opened in that in-app browser, not
    // something in our code, and not actionable here.
    ignoreErrors: [/Error invoking postMessage: Java object is gone/],
  });
}

// ── Apply theme SYNCHRONOUSLY before first paint (prevents FOUC) ──────────────
// Mirrors ThemeProvider: the visitor's saved choice wins; until they have made
// one, the courses area opens in its own light/emerald look (as in the supplied
// design) and everything else opens dark. Doing it here avoids a dark→light
// flash when /courses is opened directly.
(function () {
  const saved = localStorage.getItem('fm_theme');
  const inCourses = window.location.pathname.startsWith('/courses');
  const mode = saved || (inCourses ? 'light' : 'dark');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', dark);
  if (inCourses) document.documentElement.setAttribute('data-accent', 'emerald');
  document.body.style.backgroundColor = dark ? '#090d16' : (inCourses ? '#ffffff' : '#f8fafc');
})();

// ── Apply language direction SYNCHRONOUSLY ────────────────────────────────────
(function () {
  const lang = localStorage.getItem('language') || 'en';
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
})();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Une erreur est survenue. Merci de rafraîchir la page.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
