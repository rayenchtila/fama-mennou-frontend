import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { tokenStore } from './tokenStore';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://famamennou-server.onrender.com';

let socket = null;
let currentEmail = null;

function getSocket(email) {
  const key = email.toLowerCase();
  if (socket && currentEmail === key) return socket;
  if (socket) socket.disconnect();
  // Server verifies this token and joins the room under the email it decodes
  // from it — a raw ?email= query param is no longer trusted for room
  // membership (anyone could previously eavesdrop on anyone's realtime
  // messages/notifications just by connecting with that param).
  // auth as a function (not a static object) is re-evaluated by socket.io-client
  // on every (re)connect attempt, so a token that becomes available shortly
  // after the initial page load is still picked up on the client's automatic
  // reconnect — IF the transport actually reconnects. A page load that
  // restores a session from localStorage has `email` available synchronously
  // while the real access token only lands later from an async /auth/refresh
  // call; if that race is lost, this initial connect goes out token-less, the
  // server accepts the transport but skips joining any room (see index.js),
  // and — since nothing about that looks like a failure to socket.io-client —
  // it never disconnects/reconnects to pick up the token that arrives a
  // moment later. The subscription below is what actually recovers from
  // that: it re-announces the token on the *existing* connection as soon as
  // one becomes available, no reconnect needed.
  socket = io(SOCKET_URL, { auth: cb => cb({ token: tokenStore.get() }), transports: ['websocket'] });
  currentEmail = key;
  return socket;
}

// Whenever the token changes (initial restore after a race, refresh,
// rotation, login), re-announce it on whatever socket is currently open so
// the server can (re-)join the right room without needing a full reconnect.
// Registered once at module scope — this file's `socket` variable is a
// singleton for the whole app, so one subscription covers it for the life of
// the page. Re-joining an already-joined room is a harmless no-op server-side.
tokenStore.subscribe((token) => {
  if (socket && token) socket.emit('authenticate', { token });
});

export function useRealtimeChannel(email, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!email) return;
    const s = getSocket(email);

    const wrapped = {};
    Object.keys(handlersRef.current || {}).forEach(event => {
      wrapped[event] = (payload) => handlersRef.current?.[event]?.(payload);
      s.on(event, wrapped[event]);
    });

    return () => {
      Object.entries(wrapped).forEach(([event, fn]) => s.off(event, fn));
    };
  }, [email]);
}
