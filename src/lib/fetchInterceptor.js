// Global fetch interceptor — automatically adds Authorization: Bearer <token>
// to every fetch call that targets our backend, so every page gets auth for free
// without needing to be rewritten to use authFetch.
import { tokenStore } from './tokenStore';

const BACKEND_ORIGIN = (() => {
  try {
    const api = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
    return new URL(api).origin;
  } catch { return ''; }
})();

const _original = window.fetch.bind(window);

// Shared in-flight refresh so concurrent 401s from multiple tabs/widgets on
// mount (Courses, Paid Access, Earnings, etc.) trigger only one /auth/refresh
// call instead of a stampede.
let _refreshPromise = null;
function refreshToken() {
  if (!_refreshPromise) {
    _refreshPromise = _original(`${BACKEND_ORIGIN}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.accessToken) tokenStore.set(d.accessToken);
        return d.accessToken || null;
      })
      .catch(() => null)
      .finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

window.fetch = function interceptedFetch(url, options = {}) {
  if (!BACKEND_ORIGIN || typeof url !== 'string') return _original(url, options);

  let resolved;
  try { resolved = new URL(url, window.location.href); } catch { return _original(url, options); }
  if (resolved.origin !== BACKEND_ORIGIN) return _original(url, options);

  const doFetch = () => {
    const token = tokenStore.get();
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return _original(url, { credentials: 'include', ...options, headers });
  };

  // A request that fires before the in-memory token is restored (e.g. a
  // hard refresh landing directly on an admin sub-tab via ?tab=...) goes out
  // with no/stale auth and 401s/403s. Instead of silently looking like
  // "no data", refresh once and retry — this is what previously made admin
  // tabs flash "0" permanently until a manual reload.
  return doFetch().then(res => {
    if (res.status !== 401 && res.status !== 403) return res;
    return refreshToken().then(newToken => (newToken ? doFetch() : res));
  });
};
