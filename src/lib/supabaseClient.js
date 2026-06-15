import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase env vars missing: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    // No Supabase Auth session in this app — disable session persistence/refresh
    // so the realtime socket never tries to attach a stale/invalid auth token.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: {
      params: { eventsPerSecond: 5 },
      // Cap reconnect backoff so a bad network/auth state can't hammer the
      // websocket endpoint in a tight loop (bandwidth/CPU safety).
      reconnectAfterMs: (tries) => Math.min(1000 * 2 ** tries, 30000),
      heartbeatIntervalMs: 30000,
    },
  }
);
