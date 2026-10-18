import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { TURNSTILE_SITE_KEY } from './config';
import { AuthNotice } from './AuthControls';

/* Cloudflare Turnstile — the security check on log-in, sign-up and password reset.
   It replaced reCAPTCHA.

   The widget runs in the background and is invisible: Cloudflare only draws it when
   it cannot be sure a visitor is human ("interaction-only"). So there is no box to
   tick before pressing the button — the form asks for the token at the moment it
   needs one:

     const token = await captchaRef.current.getToken();   // resolves at once if one is ready
     …send the request with it…
     captchaRef.current.reset();                          // a token is good for ONE request

   The token proves nothing by itself. The server asks Cloudflare whether it is
   genuine (services/turnstile.js in the API) and refuses the request otherwise.

   `action` names where the widget is used ("login", "signup", "resend_code",
   "forgot_password", "google_signup"); the server only accepts a token for the
   action its route expects, so one solved for log-in cannot be replayed against
   sign-up. Switching theme or language re-renders the widget (it only paints those
   once, when it mounts). If the script is blocked or Cloudflare cannot be reached,
   a notice with a Retry button appears and getToken() rejects. */

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;
function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = SCRIPT_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile did not initialise')));
      el.onerror = () => { scriptPromise = null; el.remove(); reject(new Error('turnstile script blocked or offline')); };
      document.head.appendChild(el);
    });
  }
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ action, onFailure, className = '' }, ref) {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const token = useRef(null);
  const failure = useRef(null);      // why the widget cannot produce a token right now, or null
  const waiters = useRef([]);        // getToken() calls waiting for one: { resolve, reject, timer }
  const failureCb = useRef(onFailure);
  failureCb.current = onFailure;

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);   // bumped by "Try again" to render the widget afresh
  const theme = isDark ? 'dark' : 'light';
  const lang = ['fr', 'en', 'ar'].includes(i18n.language) ? i18n.language : 'auto';

  useEffect(() => {
    token.current = null;
    failure.current = null;
    setFailed(false);

    const settle = fn => {
      const list = waiters.current;
      waiters.current = [];
      list.forEach(w => { clearTimeout(w.timer); fn(w); });
    };
    const fail = reason => {
      token.current = null;
      failure.current = reason;
      setFailed(true);
      settle(w => w.reject(new Error(`turnstile:${reason}`)));
      failureCb.current?.(reason);
    };

    if (!TURNSTILE_SITE_KEY) { fail('no-site-key'); return undefined; }

    let cancelled = false;
    let id = null;
    loadTurnstile().then(ts => {
      if (cancelled || !boxRef.current) return;
      id = ts.render(boxRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        theme,
        language: lang,
        size: 'flexible',
        appearance: 'interaction-only',
        retry: 'auto',
        'refresh-expired': 'auto',
        callback: value => {
          token.current = value;
          failure.current = null;
          setFailed(false);
          settle(w => w.resolve(value));
        },
        'expired-callback': () => { token.current = null; },
        'timeout-callback': () => { token.current = null; },
        'error-callback': code => { fail(String(code || 'error')); return true; },
      });
      widgetId.current = id;
    }).catch(() => { if (!cancelled) fail('script'); });

    return () => {
      cancelled = true;
      token.current = null;
      settle(w => w.reject(new Error('turnstile:replaced')));
      if (id != null && window.turnstile) { try { window.turnstile.remove(id); } catch { /* already gone */ } }
      widgetId.current = null;
    };
  }, [action, theme, lang, attempt]);

  useImperativeHandle(ref, () => ({
    // A fresh token as soon as there is one (at once when one is already held).
    getToken(timeoutMs = 25000) {
      if (token.current) return Promise.resolve(token.current);
      if (failure.current) return Promise.reject(new Error(`turnstile:${failure.current}`));
      return new Promise((resolve, reject) => {
        const w = { resolve, reject, timer: null };
        w.timer = setTimeout(() => {
          waiters.current = waiters.current.filter(x => x !== w);
          reject(new Error('turnstile:timeout'));
        }, timeoutMs);
        waiters.current.push(w);
      });
    },
    // A token is single-use: call this after every request that spent one, so the next one is already on its way.
    reset() {
      token.current = null;
      if (window.turnstile && widgetId.current != null) {
        try { window.turnstile.reset(widgetId.current); return; } catch { /* fall through */ }
      }
      setAttempt(a => a + 1);
    },
  }), []);

  return (
    <div className={className}>
      <div ref={boxRef} data-turnstile-action={action} />
      {failed && (
        <AuthNotice tone="warn" icon="shield" role="alert" className="mt-2">
          <p className="m-0">{TURNSTILE_SITE_KEY ? t('auth.captcha_failed') : t('auth.captcha_unavailable')}</p>
          {TURNSTILE_SITE_KEY && (
            <button type="button" onClick={() => setAttempt(a => a + 1)}
              className="-mb-1 mt-1.5 py-1 text-[13px] font-semibold underline underline-offset-2">
              {t('auth.captcha_retry')}
            </button>
          )}
        </AuthNotice>
      )}
    </div>
  );
});

export default Turnstile;
