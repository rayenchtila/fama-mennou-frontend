import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtimeChannel } from '../lib/useRealtimeChannel';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

// Path -> announcement target_page, kept in sync with the admin dropdown
// (this list) and the backend's validation list (routes/announcements.js
// TARGET_PAGES). Order matters: first matching prefix wins.
const PATH_TO_PAGE = [
  { prefix: '/freelancers', page: 'freelancers' },
  { prefix: '/clients',     page: 'clients' },
  { prefix: '/courses',     page: 'courses' },
  { prefix: '/projects',    page: 'projects' },
  { prefix: '/messages',    page: 'messages' },
  { prefix: '/payments',    page: 'payments' },
  { prefix: '/dashboard',   page: 'dashboard' },
  { prefix: '/profile',     page: 'profile' },
  { prefix: '/settings',    page: 'settings' },
  { prefix: '/about',       page: 'about' },
  { prefix: '/blog',        page: 'blog' },
  { prefix: '/careers',     page: 'careers' },
  { prefix: '/help',        page: 'help' },
];
function pageForPath(pathname) {
  if (pathname === '/') return 'home';
  return PATH_TO_PAGE.find(({ prefix }) => pathname.startsWith(prefix))?.page || null;
}

// Per-browser dismissal, keyed by announcement id — dismissing one doesn't
// hide a later, different announcement on the same page.
const DISMISSED_KEY = 'fm_announcements_dismissed';
function getDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); } catch { return new Set(); }
}
function markDismissed(id) {
  const set = getDismissed();
  set.add(id);
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); } catch {}
}

export default function AnnouncementBanner() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = pageForPath(pathname);
  const [items, setItems] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(getDismissed);

  // Initial load (works for every visitor, logged in or not) — real-time
  // below is a same-session live-update layer on top of this, not a
  // replacement for it.
  useEffect(() => {
    if (!page) { setItems([]); return; }
    let cancelled = false;
    fetch(`${API}/announcements?page=${encodeURIComponent(page)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [page]);

  const upsert = useCallback((ann) => {
    setItems(prev => {
      if (ann.target_page !== page) return prev.filter(a => a.id !== ann.id); // retargeted to a different page
      const exists = prev.some(a => a.id === ann.id);
      return exists ? prev.map(a => (a.id === ann.id ? ann : a)) : [ann, ...prev];
    });
  }, [page]);
  const remove = useCallback((payload) => {
    setItems(prev => prev.filter(a => a.id !== payload.id));
  }, []);

  // Only delivers live pushes to logged-in users — this app has no socket
  // connection for anonymous visitors (see lib/useRealtimeChannel.js). They
  // still get the announcement on next page load via the fetch above.
  useRealtimeChannel(user?.email, {
    announcement_created: upsert,
    announcement_updated: upsert,
    announcement_deleted: remove,
  });

  const visible = items.filter(a => !dismissedIds.has(a.id));

  // The banner is fixed (so it never causes a layout jump at the very top of
  // the page while React re-renders), but that means it doesn't push page
  // content down on its own — measure its real rendered height and expose it
  // as a CSS variable, which App.js's route wrapper uses as padding-top.
  // Without this, the banner overlaps whatever's underneath it (confirmed:
  // it covered the "Hire a freelancer" heading before this was added).
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!visible.length || !wrapRef.current) {
      document.documentElement.style.setProperty('--fm-announcement-h', '0px');
      return;
    }
    const el = wrapRef.current;
    const set = () => document.documentElement.style.setProperty('--fm-announcement-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--fm-announcement-h', '0px');
    };
  }, [visible.length]);

  if (!visible.length) return null;

  const handleDismiss = (id) => {
    markDismissed(id);
    setDismissedIds(getDismissed());
  };

  return (
    <div ref={wrapRef} style={{ position: 'fixed', top: 66, left: 0, right: 0, zIndex: 39, display: 'flex', flexDirection: 'column' }}>
      {visible.map(a => (
        <div key={a.id} style={{ background: 'var(--fm-primary)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(8px,2vw,10px) clamp(12px,4vw,24px)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <p style={{ flex: 1, minWidth: 0, fontSize: 'clamp(12.5px,3vw,13.5px)', fontWeight: 600, lineHeight: 1.5, margin: 0, color: '#fff', overflowWrap: 'break-word' }}>
              {a.message}
            </p>
            <button
              onClick={() => handleDismiss(a.id)}
              aria-label="Dismiss announcement"
              style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
