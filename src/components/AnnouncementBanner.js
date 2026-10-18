import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Logged-in: pull this account's dismissals from the server too, merged
  // into the localStorage-derived set — this is what makes a dismissal on
  // one phone/browser also hide the announcement on a completely different
  // device for the same account, instead of being stuck to one browser.
  // Anonymous visitors have no account to attach this to, so they keep the
  // localStorage-only behavior unchanged.
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    fetch(`${API}/announcements/dismissed`)
      .then(r => (r.ok ? r.json() : []))
      .then(serverIds => {
        if (cancelled || !Array.isArray(serverIds) || !serverIds.length) return;
        setDismissedIds(prev => new Set([...prev, ...serverIds]));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.email]);

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
    // Capped defensively — however many announcements stack up, they should
    // never push page content further down than this, however the height
    // measurement behaves on any given browser.
    const set = () => document.documentElement.style.setProperty('--fm-announcement-h', `${Math.min(el.offsetHeight, 240)}px`);
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
    // Logged in: also persist to the account server-side, so this follows
    // them to their next device instead of only hiding it on this browser.
    // Fire-and-forget — the UI above already updated from localStorage, and
    // a failed request here just means the next device asks again, not a
    // broken experience on this one.
    if (user?.email) {
      fetch(`${API}/announcements/${id}/dismiss`, { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'fixed', top: 'calc(66px + var(--fm-topbar-offset, 0px))', left: 0, right: 0, zIndex: 39, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .fm-ann-dismiss { transition: background-color .15s, transform .15s; }
        .fm-ann-dismiss:hover { background: rgba(255,255,255,0.3) !important; transform: scale(1.08); }
        .fm-ann-dismiss:active { transform: scale(0.94); }
      `}</style>
      <AnimatePresence initial={false}>
        {visible.map(a => (
          <motion.div key={a.id}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden', background: 'linear-gradient(90deg, var(--fm-primary-dark), var(--fm-primary) 55%, var(--fm-purple))', boxShadow: '0 2px 12px -4px rgba(99,102,241,0.45), inset 0 -1px 0 rgba(255,255,255,0.1)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(9px,2vw,11px) clamp(12px,4vw,24px)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 11v5" /><path d="M12 8h.01" />
                </svg>
              </span>
              <p style={{ flex: 1, minWidth: 0, fontSize: 'clamp(12.5px,3vw,13.5px)', fontWeight: 600, lineHeight: 1.5, margin: 0, color: '#fff', overflowWrap: 'break-word' }}>
                {a.message}
              </p>
              <button
                className="fm-ann-dismiss"
                onClick={() => handleDismiss(a.id)}
                aria-label="Dismiss announcement"
                style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
