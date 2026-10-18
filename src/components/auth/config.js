// Values shared by the login / sign-up shell and its screens.
export const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
export const IS_DEV = process.env.REACT_APP_DEV_MODE === 'true';

// Cloudflare Turnstile site key (public by design — the SECRET key lives only on
// the server, which verifies every token). Set REACT_APP_TURNSTILE_SITE_KEY in the
// build environment. Without one, a development build falls back to Cloudflare's
// published "always passes" test key so the form works locally; a production build
// has NO fallback and shows the security check as unavailable instead.
export const TURNSTILE_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY
  || (process.env.NODE_ENV !== 'production' ? '1x00000000000000000000AA' : '');
