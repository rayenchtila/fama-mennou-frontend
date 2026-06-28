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

window.fetch = function interceptedFetch(url, options = {}) {
  const token = tokenStore.get();

  if (token && BACKEND_ORIGIN && typeof url === 'string') {
    try {
      const resolved = new URL(url, window.location.href);
      if (resolved.origin === BACKEND_ORIGIN) {
        const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
        return _original(url, { credentials: 'include', ...options, headers });
      }
    } catch {}
  }

  return _original(url, options);
};
