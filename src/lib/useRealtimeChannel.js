import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://famamennou-server.onrender.com';

let socket = null;
let currentEmail = null;

function getSocket(email) {
  const key = email.toLowerCase();
  if (socket && currentEmail === key) return socket;
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { query: { email: key }, transports: ['websocket'] });
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
