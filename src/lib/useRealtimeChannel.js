import { useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const API = 'https://famamennou-server.onrender.com/api';

const channelCache = new Map(); // email -> channel name

async function getChannelName(email) {
  const key = email.toLowerCase();
  if (channelCache.has(key)) return channelCache.get(key);
  const res = await fetch(`${API}/realtime/channel?email=${encodeURIComponent(key)}`);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(`Unexpected /realtime/channel response (status ${res.status})`);
  }
  const data = await res.json();
  if (!data.channel) throw new Error('No channel name returned');
  channelCache.set(key, data.channel);
  return data.channel;
}

// Shared registry — multiple components subscribing to the same user's channel
// (Navbar, ChatDrawer, MessengerChat, AdminPage...) reuse a single Realtime
// channel/socket join instead of opening one per component.
const sharedChannels = new Map(); // channelName -> { channel, refCount, listeners: Map<event, Set<handlersRef>> }

// Subscribes to the broadcast channel for `email` and calls `handlers[event](payload)`
// whenever the backend broadcasts that event (e.g. 'new_message', 'new_notification',
// 'typing', 'stop-typing'). Returns nothing; cleans up on unmount / email change.
export function useRealtimeChannel(email, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    let channelName;

    getChannelName(email).then(name => {
      if (cancelled) return;
      channelName = name;

      let entry = sharedChannels.get(name);
      if (!entry) {
        entry = { channel: supabase.channel(name), refCount: 0, listeners: new Map(), subscribed: false };
        sharedChannels.set(name, entry);
      }
      entry.refCount++;

      Object.keys(handlersRef.current || {}).forEach(event => {
        if (!entry.listeners.has(event)) {
          const refs = new Set();
          entry.listeners.set(event, refs);
          entry.channel.on('broadcast', { event }, ({ payload }) => {
            refs.forEach(ref => ref.current?.[event]?.(payload));
          });
        }
        entry.listeners.get(event).add(handlersRef);
      });

      if (!entry.subscribed) {
        entry.channel.subscribe();
        entry.subscribed = true;
      }
    }).catch(e => {
      console.error('useRealtimeChannel: failed to subscribe —', e.message);
    });

    return () => {
      cancelled = true;
      if (!channelName) return;
      const entry = sharedChannels.get(channelName);
      if (!entry) return;
      entry.listeners.forEach(refs => refs.delete(handlersRef));
      entry.refCount--;
      if (entry.refCount <= 0) {
        supabase.removeChannel(entry.channel);
        sharedChannels.delete(channelName);
      }
    };
  }, [email]);
}
