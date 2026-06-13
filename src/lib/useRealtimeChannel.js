import { useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const API = 'https://famamennou-server.onrender.com/api';

const channelCache = new Map(); // email -> channel name

async function getChannelName(email) {
  const key = email.toLowerCase();
  if (channelCache.has(key)) return channelCache.get(key);
  const data = await fetch(`${API}/realtime/channel?email=${encodeURIComponent(key)}`).then(r => r.json());
  channelCache.set(key, data.channel);
  return data.channel;
}

// Subscribes to the broadcast channel for `email` and calls `handlers[event](payload)`
// whenever the backend broadcasts that event (e.g. 'new_message', 'new_notification',
// 'typing', 'stop-typing'). Returns nothing; cleans up on unmount / email change.
export function useRealtimeChannel(email, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!email) return;
    let channel;
    let cancelled = false;

    getChannelName(email).then(name => {
      if (cancelled) return;
      channel = supabase.channel(name);
      Object.keys(handlersRef.current || {}).forEach(event => {
        channel.on('broadcast', { event }, ({ payload }) => {
          handlersRef.current[event]?.(payload);
        });
      });
      channel.subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [email]);
}
