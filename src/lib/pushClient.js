// Browser-side Web Push client: register the service worker, obtain a
// subscription, and hand it to the backend.
//
// Deliberately never auto-prompts. A permission dialog fired on page load is
// the fastest way to get permanently denied — the browser remembers "block"
// and there is no second chance. `enablePush()` is meant to be called from an
// explicit user action (a toggle in settings).
const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// VAPID keys travel as base64url; the subscribe() call needs a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.error('[push] service worker registration failed:', e);
    return null;
  }
}

export function pushPermission() {
  return pushSupported() ? Notification.permission : 'unsupported';
}

/**
 * Ask for permission (if not already granted), subscribe, and register the
 * subscription with the backend. Call from a user gesture.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
export async function enablePush(authFetch = fetch) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: permission }; // 'denied' | 'default'

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'sw_failed' };
  await navigator.serviceWorker.ready;

  const keyRes = await fetch(`${API}/push/vapid-public-key`);
  if (!keyRes.ok) return { ok: false, reason: 'no_vapid_key' };
  const { publicKey } = await keyRes.json();

  // Reuse an existing subscription if the browser already has one for this
  // worker; calling subscribe() twice with different keys throws.
  const existing = await reg.pushManager.getSubscription();
  const sub = existing || await reg.pushManager.subscribe({
    userVisibleOnly: true, // required by Chrome — every push must be visible
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const res = await authFetch(`${API}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON ? sub.toJSON() : sub),
  });
  if (!res.ok) return { ok: false, reason: 'register_failed' };
  return { ok: true };
}

export async function disablePush(authFetch = fetch) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return { ok: true };
  // Tell the server first: if the local unsubscribe succeeded but the row
  // stayed behind, the backend would keep pushing to a dead endpoint until it
  // 410s. Order matters.
  await authFetch(`${API}/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
  return { ok: true };
}
