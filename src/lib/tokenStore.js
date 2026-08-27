// Module-level token storage — lives outside React so fetchInterceptor can read it
// without needing React context. AuthContext sets/clears it on login/logout.
let _token = null;
const _listeners = new Set();

export const tokenStore = {
  get:   ()  => _token,
  set:   (t) => {
    _token = t;
    // Notify anything that needs to react the moment a token becomes
    // available — namely the realtime socket, which may already be
    // connected but not yet authenticated (see useRealtimeChannel.js).
    _listeners.forEach(fn => { try { fn(t); } catch {} });
  },
  clear: ()  => { _token = null; },
  // Returns an unsubscribe function. Listener is called with the new token
  // (or null on clear) every time `set`/`clear` runs.
  subscribe: (fn) => { _listeners.add(fn); return () => _listeners.delete(fn); },
};
