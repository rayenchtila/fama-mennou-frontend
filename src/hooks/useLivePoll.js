import { useEffect, useRef, useState } from 'react';

/**
 * Keeps site-wide counters in sync with production without a reload.
 *
 * `load` is an async function returning the fresh value (throw on failure).
 * It runs on mount, again whenever the tab becomes visible, and every
 * `intervalMs` while the tab is visible — a hidden or backgrounded tab does no
 * work at all (the Navbar's message poll was trimmed for the same reason: a
 * forgotten tab must never keep the database awake).
 *
 * The stats endpoints are cached for 60 s server-side, so one-minute polling
 * costs at most one query per minute no matter how many visitors are online.
 * If a refresh fails the last good numbers stay on screen instead of dropping
 * to zero.
 */
export default function useLivePoll(load, { intervalMs = 60000, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let inFlight = false;

    const run = async (force = false) => {
      if (inFlight) return;
      if (!force && document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const next = await loadRef.current();
        if (!cancelled && next !== undefined) setData(next);
      } catch { /* keep the last good value */ }
      finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };

    run(true);
    const id = setInterval(run, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);

  return { data, loading };
}
