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
  // reconnect rather than being stuck with whatever was present at first mount.
  socket = io(SOCKET_URL, { auth: cb => cb({ token: tokenStore.get() }), transports: ['websocket'] });
  currentEmail = key;
  return socket;
}

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
