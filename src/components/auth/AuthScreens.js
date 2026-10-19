import { useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Icon from '../ds/Icon';
import { API, IS_DEV } from './config';
import { AuthField, AuthButton, AuthNotice, CodeInput, FieldError, Spinner } from './AuthControls';
import Turnstile from './Turnstile';
import { displayName } from '../../utils/names';

/* Every step of the auth flow that is not the main log-in / sign-up form. The behaviour
   of each screen is exactly what it was — only the presentation changed: one frame
   (back link, icon tile, title, text) and the shared controls. */

const TILE = {
  info: 'border-ds-accent-line bg-ds-accent-soft text-ds-accent',
  ok:   'border-ds-ok/30 bg-ds-ok/10 text-ds-ok',
  warn: 'border-ds-warn/30 bg-ds-warn/10 text-ds-warn',
  bad:  'border-ds-bad/30 bg-ds-bad/10 text-ds-bad',
};

export function ScreenFrame({ onBack, backLabel, icon, tone = 'info', pulse = false, title, subtitle, children }) {
  return (
    <div className="ds-auth-in ds-auth-form">
      {onBack && (
        <button type="button" onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg py-1 text-[13px] font-semibold text-ds-mute transition-colors hover:text-ds-ink">
          <Icon name="arrow_back" size={17} flip />{backLabel}
        </button>
      )}
      <span className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${TILE[tone]}`}>
        <Icon name={icon} size={28} className={pulse ? 'animate-pulse' : ''} />
      </span>
      <h1 id="auth-title" tabIndex={-1} className="m-0 text-balance [word-spacing:.06em] text-[26px] font-extrabold leading-tight tracking-tight text-ds-ink outline-none sm:text-[30px]">{title}</h1>
      {subtitle && <p className="mb-0 mt-2 text-pretty text-[14.5px] leading-relaxed text-ds-mute">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

// ── E-mail verification (sign-up) ────────────────────────────────────────────
//
// The code the visitor was e-mailed. The field is the star of the screen: six large
// cells that verify BY THEMSELVES the moment the sixth digit is in — typed, pasted or
// autofilled — and carry on to create the account. "Verify" stays below as the manual
// fallback (Enter works too). Around the field: the address the code went to (with a
// shortcut to Gmail when it is one), a countdown to the code's expiry, a Paste button,
// "Resend code" after a short wait (each resend spends a fresh security token), and how
// many tries are left after a wrong code. The server enforces every one of those limits;
// this screen only shows them.
//
//   onVerify(code, onAccepted) → { ok: true } | { error, attemptsLeft?, message? }
//                     onAccepted() is called the moment the server accepts the code, before the account is created,
//                     so the cells can light up while that happens
//                     (a null code means "the e-mail is verified, create the account again")
//   onResend(token) → { ok: true, expiresIn, resendIn, devCode? } | { error, retryAfter? }
const fmtClock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
export const fmtWait = (sec, t) => (sec >= 90 ? t('auth.minutes', { count: Math.ceil(sec / 60) }) : fmtClock(Math.max(sec, 1)));

// The current time, refreshed every second. `sync` refreshes it at once — used whenever a deadline is
// set, so a countdown never shows a second that is already gone.
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return [now, () => setNow(Date.now())];
}

export function VerifyEmailScreen({ email, initial = {}, onVerify, onResend, onBack, loading }) {
  const { t } = useTranslation();
  const [now, syncNow] = useNow(1000);
  const inputRef = useRef(null);
  const turnstile = useRef(null);
  const lastTried = useRef('');

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(initial.notice || '');
  const [dead, setDead] = useState(false);           // five wrong guesses, or no live code: only a new code helps
  const [verified, setVerified] = useState(false);
  const [failure, setFailure] = useState('');        // the e-mail IS verified but creating the account failed
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [devCode, setDevCode] = useState(initial.devCode || '');
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + (initial.expiresIn ?? 600) * 1000);
  const [resendAt, setResendAt] = useState(() => Date.now() + (initial.resendIn ?? 45) * 1000);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendWait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expired = secondsLeft === 0;
  const inputOff = busy || loading || verified || dead || expired;
  const isGmail = /@(gmail|googlemail)\.com$/i.test(email);

  // After a wrong code the cells shake, then empty themselves so the next try can start at once.
  const clearLater = value => setTimeout(() => {
    setCode(c => (c === value ? '' : c));
    lastTried.current = '';
    inputRef.current?.focus();
  }, 700);

  async function attempt(value) {
    setBusy(true); setError(''); setFailure('');
    let r;
    try { r = await onVerify(value, () => setVerified(true)); } catch { r = { error: 'network' }; }
    setBusy(false);
    if (r?.ok) { setVerified(true); return; }
    if (r?.error !== 'register') setVerified(false);   // the code was accepted but the e-mail proof was not (or nothing happened): back to a field to type in
    switch (r?.error) {
      case 'wrongCode':
        setError(t('auth.code_wrong', { count: r.attemptsLeft ?? 0 })); clearLater(value); break;
      case 'tooManyAttempts':
        setDead(true); setError(t('auth.code_locked')); break;
      case 'expired':
        syncNow(); setExpiresAt(Date.now()); setError(t('auth.code_expired')); break;
      case 'noCode':
        setDead(true); setError(t('auth.code_none')); break;
      case 'proofExpired':
        syncNow(); setExpiresAt(Date.now()); setError(t('auth.err_email_not_verified')); break;
      case 'register':
        setVerified(true); setFailure(r.message || t('Something went wrong. Please try again.')); break;
      case 'network':
        lastTried.current = ''; setError(t('Network error. Please check your connection and try again.')); break;
      default:
        lastTried.current = ''; setError(r?.message || t('Verification failed.'));
    }
  }
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const inputOffRef = useRef(inputOff);
  inputOffRef.current = inputOff;

  // As soon as the sixth digit is in, verify — once per distinct code.
  useEffect(() => {
    if (code.length !== 6 || code === lastTried.current || inputOffRef.current) return;
    lastTried.current = code;
    attemptRef.current(code);
  }, [code]);

  // Put the cursor in the field on arrival, and again after a new code is sent.
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);

  async function paste() {
    setError(''); setStatus('');
    let text = '';
    try { text = await navigator.clipboard.readText(); }
    catch { setError(t('auth.code_paste_blocked')); inputRef.current?.focus(); return; }
    // "482 915", "482-915" and "Your code is 482915." all work; a longer number is not mistaken for a code.
    const m = /\b\d{6}\b/.exec(text.replace(/(\d)[\s-]+(?=\d)/g, '$1'));
    if (!m) { setError(t('auth.code_paste_none')); return; }
    setCode(m[0]);
  }

  async function copyDevCode() {
    try { await navigator.clipboard.writeText(devCode); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = devCode; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  async function resend() {
    if (resendWait > 0 || resending || busy || verified) return;
    setResending(true); setError(''); setStatus('');
    let token;
    if (!IS_DEV) {
      try { token = await turnstile.current.getToken(); }
      catch { setResending(false); setError(t('auth.captcha_failed')); return; }
    }
    let r;
    try { r = await onResend(token); } catch { r = { error: 'network' }; }
    if (!IS_DEV) turnstile.current.reset();     // a token is good for one request
    setResending(false);
    if (r?.ok) {
      setCode(''); lastTried.current = ''; setDead(false);
      syncNow();
      setExpiresAt(Date.now() + (r.expiresIn ?? 600) * 1000);
      setResendAt(Date.now() + (r.resendIn ?? 45) * 1000);
      setDevCode(r.devCode || '');
      setStatus(t('auth.code_resent'));
      inputRef.current?.focus();
      return;
    }
    switch (r?.error) {
      case 'tooSoon':
        syncNow(); setResendAt(Date.now() + (r.retryAfter ?? 45) * 1000); setStatus(t('auth.code_already_sent')); break;
      case 'tooManySends':
        syncNow(); setResendAt(Date.now() + (r.retryAfter ?? 3600) * 1000); setError(t('auth.code_too_many_sends', { time: fmtWait(r.retryAfter ?? 3600, t) })); break;
      case 'invalidCaptcha':
        setError(t('auth.captcha_failed')); break;
      case 'captchaUnavailable':
        setError(t('auth.captcha_unavailable')); break;
      case 'network':
        setError(t('Network error. Please check your connection and try again.')); break;
      default:
        setError(t('Failed to send verification email. Try again.'));
    }
  }

  const warn = !expired && secondsLeft <= 60;

  return (
    <ScreenFrame onBack={onBack} backLabel={t('Back')} icon="mark_email_unread"
      title={t('Check your email')}
      subtitle={<>{t('We sent a 6-digit code to')} <strong className="font-semibold text-ds-ink" dir="ltr">{email}</strong></>}>

      {isGmail && (
        <a href={`https://mail.google.com/mail/?authuser=${encodeURIComponent(email)}`} target="_blank" rel="noopener noreferrer"
          className="ds-btn ds-btn-glass ds-btn-sm mb-5">
          <Icon name="open_in_new" size={16} />{t('auth.open_gmail')}
        </a>
      )}

      <form onSubmit={e => { e.preventDefault(); if (code.length === 6 && !inputOff && code !== lastTried.current) { lastTried.current = code; attempt(code); } }} noValidate className="space-y-4">
        <CodeInput value={code} onChange={v => { setCode(v); setError(''); setStatus(''); }} label={t('Verification code')}
          error={error} success={verified} disabled={inputOff} inputRef={inputRef} describedBy={error ? 'verify-code-error' : 'verify-code-hint'} />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className={`m-0 flex items-center gap-1.5 text-[12.5px] font-medium ${expired ? 'text-ds-bad' : warn ? 'text-ds-warn' : 'text-ds-faint'}`}>
            <Icon name="timer" size={15} />
            {expired ? t('auth.code_expired') : t('auth.code_expires_in', { time: fmtClock(secondsLeft) })}
          </p>
          <button type="button" onClick={paste} disabled={inputOff}
            className="-my-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-2 text-[13px] font-semibold text-ds-accent transition-colors hover:underline disabled:opacity-40 disabled:no-underline">
            <Icon name="content_paste" size={16} />{t('auth.code_paste')}
          </button>
        </div>

        {error && <FieldError id="verify-code-error">{error}</FieldError>}
        {!error && <p id="verify-code-hint" className="m-0 text-[12.5px] leading-relaxed text-ds-faint">{t('auth.code_auto')}</p>}
        {status && <AuthNotice tone="ok" icon="check_circle" role="status">{status}</AuthNotice>}
        {failure && <AuthNotice tone="bad" icon="error" role="alert">{failure}</AuthNotice>}

        {failure ? (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <AuthButton type="button" loading={busy || loading} onClick={() => attempt(null)} icon="refresh" className="sm:flex-1">{busy || loading ? t('auth.creating_account') : t('auth.try_again')}</AuthButton>
            <button type="button" onClick={onBack} className="ds-btn ds-btn-glass ds-btn-lg">{t('auth.back_to_form')}</button>
          </div>
        ) : (
          <AuthButton loading={busy || loading || verified} disabled={code.length !== 6 || dead || expired} icon="check">
            {verified ? t('auth.creating_account') : busy || loading ? t('Verifying…') : t('Verify & Create Account')}
          </AuthButton>
        )}

        {!verified && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[13px] text-ds-mute">
            <span>{t('auth.code_not_received')}</span>
            <button type="button" onClick={resend} disabled={resendWait > 0 || resending || busy}
              className="-my-1.5 py-2 font-semibold text-ds-accent transition-colors hover:underline disabled:cursor-default disabled:text-ds-mute disabled:no-underline">
              {resending ? t('Processing…') : resendWait > 0 ? t('auth.code_resend_in', { time: fmtClock(resendWait) }) : t('auth.code_resend')}
            </button>
          </div>
        )}

        {devCode && (
          <div className="rounded-xl border border-dashed border-ds-warn/50 bg-ds-warn/5 p-3.5" data-testid="dev-code">
            <p className="m-0 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-ds-ink-2"><Icon name="terminal" size={14} className="text-ds-warn" />{t('auth.dev_code_title')}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <output dir="ltr" className="font-mono text-[28px] font-bold tracking-[0.28em] text-ds-ink">{devCode}</output>
              <button type="button" onClick={copyDevCode} className="ds-btn ds-btn-glass ds-btn-sm" aria-live="polite">
                <Icon name={copied ? 'check' : 'content_copy'} size={16} />{copied ? t('auth.copied') : t('auth.copy')}
              </button>
            </div>
            <p className="mb-0 mt-2 text-[12px] leading-relaxed text-ds-mute">{t('auth.dev_code_text')}</p>
          </div>
        )}

        <p className="m-0 text-center text-[12.5px] leading-relaxed text-ds-faint">{t('auth.verify_hint')}</p>
      </form>

      {/* The invisible security check behind "Resend code" */}
      {!IS_DEV && <Turnstile ref={turnstile} action="resend_code" appearance="interaction-only" />}
    </ScreenFrame>
  );
}

// ── Forgot password (2 steps: e-mail, then code + new password) ──────────────
export function ForgotPasswordScreen({ onBack, onSent }) {
  const { t } = useTranslation();
  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState('');
  const [code,            setCode]            = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [resetDone,       setResetDone]       = useState(false);
  const [resetDualRole,   setResetDualRole]   = useState(false);
  const [resendDone,      setResendDone]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const captchaRef = useRef(null);

  async function safeFetch(url, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      try { return await res.json(); }
      catch { return { error: 'serverError' }; }
    } catch {
      clearTimeout(timer);
      return { error: 'serverError' };
    }
  }

  // Every request that sends a reset code spends one single-use security token (Cloudflare
  // Turnstile), so the invisible widget is asked for a fresh one each time and then re-armed.
  async function requestResetCode() {
    let captchaToken;
    if (!IS_DEV) {
      try { captchaToken = await captchaRef.current.getToken(); }
      catch { return { error: 'captchaFailed' }; }
    }
    const data = await safeFetch(`${API}/auth/send-reset-code`, { email: email.toLowerCase(), captchaToken });
    if (!IS_DEV) captchaRef.current.reset();
    return data;
  }

  async function handleSendCode() {
    if (!email.trim())                { setError(t('Email is required'));   return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t('Enter a valid email')); return; }
    setLoading(true);
    try {
      let data = await requestResetCode();
      if (data.error === 'serverError') {
        await new Promise(r => setTimeout(r, 3000));
        data = await requestResetCode();
      }
      // Allowlist, not denylist — advance ONLY on confirmed success. Any
      // error (including ones this component doesn't special-case, e.g.
      // "invalidCaptcha") must block step 2, not silently fall through to
      // it — that previously let an unverified/nonexistent email reach the
      // "enter code" screen whenever the error wasn't one of a hardcoded few.
      if (data.error === 'noAccount')          { setError(t('No account found with this email')); return; }
      if (data.error === 'emailFailed')        { setError(t('Failed to send email. Try again.')); return; }
      if (data.error === 'serverError')        { setError(t('Server error. Please try again in a moment.')); return; }
      if (data.error === 'invalidCaptcha' || data.error === 'captchaFailed') { setError(t('auth.captcha_failed')); return; }
      if (data.error === 'captchaUnavailable') { setError(t('auth.captcha_unavailable')); return; }
      if (data.error === 'too_many_requests' || data.error === 'tooManySends') { setError(t('Too many attempts. Please wait a few minutes and try again.')); return; }
      if (data.error)                          { setError(t('Server error. Please try again in a moment.')); return; }
      setStep(2); setError('');
    } catch { setError(t('Network error. Please try again.')); }
    finally  { setLoading(false); }
  }

  async function handleReset() {
    if (!code || code.length !== 6)      { setError(t('Enter the 6-digit code'));  return; }
    if (!newPassword)                    { setError(t('Password is required'));    return; }
    if (newPassword.length < 8)          { setError(t('reset.pw_min8'));            return; }
    if (!/[0-9!@#$%^&*()\-_=+[\]{};':",.<>/?\\|`~]/.test(newPassword)) { setError(t('reset.pw_pattern')); return; }
    if (newPassword !== confirmPassword) { setError(t('Passwords do not match')); return; }
    setLoading(true);
    setError('');
    const delays = [0, 2000, 4000];
    for (const delay of delays) {
      try {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        const data = await safeFetch(`${API}/auth/reset-password`, { email: email.toLowerCase(), code, newPassword });
        if (data && data.success)                        { setResetDualRole(!!data.dualRole); setResetDone(true); setLoading(false); return; }
        if (data && data.error === 'noAccount')          { goBackToStep1(); setError(t('No account found with this email')); setLoading(false); return; }
        if (data && data.error === 'wrongCode')          { setError(t('Invalid code. Please check and try again.')); setLoading(false); return; }
        if (data && data.error === 'expired')            { setError(t('Code expired. Please request a new one.')); setLoading(false); return; }
        if (data && data.error === 'validation_error')   { setError(t('reset.pw_min8')); setLoading(false); return; }
      } catch { /* keep retrying */ }
    }
    setLoading(false);
    setError(t('Server error. Please try again.'));
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try {
      const data = await requestResetCode();
      if (data.error === 'invalidCaptcha' || data.error === 'captchaFailed') { setError(t('auth.captcha_failed')); return; }
      if (data.error === 'captchaUnavailable') { setError(t('auth.captcha_unavailable')); return; }
      if (data.error === 'tooManySends') { setError(t('Too many attempts. Please wait a few minutes and try again.')); return; }
      if (data.error) { setError(t('Failed to resend. Please try again.')); return; }
      setCode('');
      setResendDone(true);
    } catch {
      setError(t('Failed to resend. Please try again.'));
    } finally { setLoading(false); }
  }

  function goBackToStep1() {
    setStep(1);
    setCode('');
    setError('');
  }

  const handleSend = step === 1 ? handleSendCode : handleReset;

  if (resendDone) return (
    <ScreenFrame icon="mark_email_read" title={t('auth.code_resent_title')} subtitle={<>{t('auth.code_resent_msg')} <strong className="font-semibold text-ds-ink" dir="ltr">{email}</strong></>}>
      <p className="mb-6 mt-0 text-[13.5px] leading-relaxed text-ds-faint">{t('auth.code_resent_hint')}</p>
      <AuthButton type="button" onClick={() => setResendDone(false)}>{t('auth.enter_code')}</AuthButton>
    </ScreenFrame>
  );

  if (resetDone) return (
    <ScreenFrame icon="check_circle" tone="ok" title={t('auth.pw_reset_title')} subtitle={resetDualRole ? t('auth.pw_reset_msg_dual') : t('auth.pw_reset_msg')}>
      <p className="mb-6 mt-0 text-[13.5px] leading-relaxed text-ds-faint">{resetDualRole ? t('auth.pw_reset_hint_dual') : t('auth.pw_reset_hint')}</p>
      <AuthButton type="button" onClick={() => onSent(email, resetDualRole)}>{t('auth.login_cta')}</AuthButton>
    </ScreenFrame>
  );

  return (
    <ScreenFrame onBack={step === 2 ? goBackToStep1 : onBack} backLabel={step === 2 ? t('Back') : t('Back to login')}
      icon={step === 1 ? 'lock_reset' : 'password'}
      title={step === 1 ? t('Forgot your password?') : t('auth.verify_identity')}
      subtitle={step === 1 ? t('reset.subtitle') : <>{t('We sent a 6-digit code to')} <strong className="font-semibold text-ds-ink" dir="ltr">{email}</strong></>}>

      {/* Two-step progress */}
      <div className="mb-5 flex items-center gap-3" role="group" aria-label={t('auth.step_of', { current: step, total: 2 })}>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {[1, 2].map(s => <span key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= s ? 'bg-ds-fill' : 'bg-ds-highest'}`} />)}
        </div>
        <span className="text-[12px] font-semibold text-ds-faint">{t('auth.step_of', { current: step, total: 2 })}</span>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSend(); }} noValidate className="space-y-4">
        {step === 1 && (
          <AuthField label={t('Email address')} type="email" placeholder={t('you@example.com')} icon="mail" autoFocus
            autoComplete="email" required value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
        )}
        {step === 2 && (
          <>
            <AuthField label={t('Verification code')} placeholder="123456" className="ds-code !min-h-14" autoFocus
              autoComplete="one-time-code" inputMode="numeric" required
              value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} />
            <AuthField label={t('reset.new_password')} type="password" placeholder={t('auth.new_password_ph')} icon="lock"
              autoComplete="new-password" data-lpignore="true" data-form-type="other" required
              value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} />
            <AuthField label={t('Confirm password')} type="password" placeholder={t('auth.repeat_new_password_ph')} icon="lock"
              autoComplete="new-password" data-lpignore="true" data-form-type="other" required
              value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} />
          </>
        )}

        {/* The security check (a small visible box) — on both steps, because "Resend code" needs a token too */}
        {!IS_DEV && <Turnstile ref={captchaRef} action="forgot_password" />}

        {error && <AuthNotice tone="warn" icon="error" role="alert">{error}</AuthNotice>}

        <AuthButton loading={loading}>
          {loading ? t('Processing…') : step === 1 ? t('Envoyer le code') : t('Réinitialiser le mot de passe')}
        </AuthButton>

        {step === 2 && (
          <div className="text-center">
            <button type="button" onClick={handleResend} disabled={loading}
              className="text-[13px] font-semibold text-ds-accent transition-colors hover:underline disabled:opacity-40">
              {t('Renvoyer le code')}
            </button>
          </div>
        )}
      </form>
    </ScreenFrame>
  );
}

// ── Password reset success (dual-role aware) ─────────────────────────────────
export function PasswordFoundScreen({ email, dualRole, onBack }) {
  const { t } = useTranslation();
  return (
    <ScreenFrame icon="check_circle" tone="ok" title={t('reset.success_title')} subtitle={<strong className="font-semibold text-ds-ink" dir="ltr">{email}</strong>}>
      <p className="mb-6 mt-0 text-[14px] leading-relaxed text-ds-mute">{dualRole ? t('reset.success_msg_dual') : t('reset.success_msg')}</p>
      <AuthButton type="button" onClick={onBack} icon="arrow_forward">{t('Back to login')}</AuthButton>
    </ScreenFrame>
  );
}

// ── "Under review" — shown after a freelancer logs in before the CIN decision ─
export function PendingVerificationScreen({ userName, onClose }) {
  const { t } = useTranslation();
  const steps = [
    { icon: 'check',          label: t('Account created'),          state: 'done' },
    { icon: 'manage_search',  label: t('Verification in progress'), state: 'active' },
    { icon: 'how_to_reg',     label: t('Admin decision'),           state: 'todo' },
  ];
  return (
    <ScreenFrame icon="hourglass_top" tone="warn" pulse title={t('Account created successfully!')}
      subtitle={<span className="font-semibold text-ds-warn">{t('Under review…')}</span>}>
      <p className="mb-6 mt-0 text-[14px] leading-relaxed text-ds-mute">
        {t('Hello')} <strong className="font-bold text-ds-ink">{userName}</strong>{t(', your file has been submitted. Our team will review your information and CIN shortly.')}
      </p>
      <ol className="m-0 mb-6 flex list-none flex-col gap-2 p-0">
        {steps.map(s => (
          <li key={s.label} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[13.5px] font-semibold ${
            s.state === 'done' ? 'border-ds-ok/30 bg-ds-ok/10 text-ds-ok' : s.state === 'active' ? 'border-ds-warn/30 bg-ds-warn/10 text-ds-warn' : 'border-ds-line bg-ds-low text-ds-faint'}`}>
            <Icon name={s.icon} size={18} />
            <span className="flex-1">{s.label}</span>
            {s.state === 'active' && <Spinner className="h-4 w-4" />}
          </li>
        ))}
      </ol>
      <p className="mb-5 mt-0 text-[12.5px] leading-relaxed text-ds-faint">{t('You will be notified once your account is approved or rejected.')}</p>
      <AuthButton type="button" onClick={onClose} icon={null}>{t('Close')}</AuthButton>
    </ScreenFrame>
  );
}

// ── Decision screen — account approved or rejected ───────────────────────────
export function CINStatusScreen({ user, onClose, onLogout }) {
  const { t } = useTranslation();
  const isApproved = user.cinStatus === 'approved';

  if (isApproved) {
    return (
      <ScreenFrame icon="verified" tone="ok" title={t('auth.approved_title')} subtitle={<span className="font-semibold text-ds-ok">{t('Your verification has been accepted')}</span>}>
        {user.cinApprovalReason && (
          <AuthNotice tone="ok" className="mb-5">
            <p className="m-0 mb-1 text-[11px] font-bold uppercase tracking-wider">{t('Admin message')}</p>
            <p className="m-0 text-[14px] font-medium">{user.cinApprovalReason}</p>
          </AuthNotice>
        )}
        <p className="mb-6 mt-0 text-[14px] leading-relaxed text-ds-mute">
          {t('Welcome to the platform,')} <strong className="font-bold text-ds-ink">{displayName(user.name)}</strong>{t('! Your account is now fully active.')}
        </p>
        <AuthButton type="button" onClick={onClose}>{t('auth.go_account')}</AuthButton>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame icon="cancel" tone="bad" title={t('Account rejected')} subtitle={<span className="font-semibold text-ds-bad">{t('Your verification was not accepted')}</span>}>
      {user.cinRejectionReason && (
        <AuthNotice tone="bad" className="mb-5">
          <p className="m-0 mb-1 text-[11px] font-bold uppercase tracking-wider">{t('Rejection reason')}</p>
          <p className="m-0 text-[14px] font-medium">{user.cinRejectionReason}</p>
        </AuthNotice>
      )}
      <p className="mb-6 mt-0 text-[14px] leading-relaxed text-ds-mute">
        {t('If you believe this is an error, please contact us or create a new account with correct information.')}
      </p>
      <AuthButton type="button" onClick={onLogout} icon={null} variant="glass">{t('Close')}</AuthButton>
    </ScreenFrame>
  );
}

// ── New-device approval: waits for the link in the e-mail to be opened ───────
export function DeviceApprovalScreen({ attemptId, device, onApproved, onBack }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'approved' | 'rejected' | 'expired' | 'error'
  const [dots,   setDots]   = useState('');

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(id);
  }, []);

  // Poll every 3 seconds
  useEffect(() => {
    if (status !== 'waiting') return;
    const poll = async () => {
      try {
        const res  = await fetch(`${API}/auth/check-approval/${attemptId}`);
        const data = await res.json();
        if (data.status === 'approved')  { onApproved(data.user, data.accessToken); setStatus('approved'); }
        else if (data.status === 'rejected') setStatus('rejected');
        else if (data.status === 'expired')  setStatus('expired');
      } catch {}
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [attemptId, status, onApproved]);

  if (status === 'rejected') return (
    <ScreenFrame icon="gpp_bad" tone="bad" title={t('device.login_refused')} subtitle={<span className="text-ds-bad">{t('device.attempt_rejected')}</span>}>
      <p className="mb-6 mt-0 text-[13.5px] leading-relaxed text-ds-faint">{t('device.retry_approve')}</p>
      <AuthButton type="button" onClick={onBack}>{t('Back to login')}</AuthButton>
    </ScreenFrame>
  );

  if (status === 'expired' || status === 'error') return (
    <ScreenFrame icon="timer_off" tone="warn" title={t('device.link_expired')} subtitle={t('device.link_expired_msg')}>
      <div className="mt-6"><AuthButton type="button" onClick={onBack}>{t('device.retry')}</AuthButton></div>
    </ScreenFrame>
  );

  return (
    <ScreenFrame onBack={onBack} backLabel={t('Back')} icon="mark_email_unread" pulse title={t('device.check_email')}
      subtitle={<Trans i18nKey="device.security_sent" components={{ b: <strong className="font-semibold text-ds-ink" /> }} />}>
      {device && (
        <dl className="m-0 mb-5 space-y-2.5 rounded-xl border border-ds-line bg-ds-low p-4">
          {[
            [t('device.browser'), `${device.browser} · ${device.deviceType}`],
            ['OS', device.os],
            [t('device.ip'), device.ip || t('device.unknown')],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-[12.5px] text-ds-faint">{label}</dt>
              <dd className="m-0 text-[12.5px] font-semibold text-ds-ink-2">{val}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mb-4 mt-0 flex items-center justify-center gap-2 text-[13px] font-semibold text-ds-mute" role="status">
        <Spinner className="h-4 w-4 text-ds-accent" />{t('device.waiting_approval')}{dots}
      </p>
      <p className="m-0 text-center text-[12.5px] leading-relaxed text-ds-faint">
        <Trans i18nKey="device.link_expires" components={{ b: <strong /> }} />
      </p>
    </ScreenFrame>
  );
}

// ── Two-step verification (authenticator app) ────────────────────────────────
export function TOTPScreen({ pendingToken, onSuccess, onBack, verifyTOTP, loginWithUserData }) {
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const { t } = useTranslation();

  async function handleVerify() {
    if (code.length !== 6) { setError(t('Enter the 6-digit code')); return; }
    setBusy(true); setError('');
    const result = await verifyTOTP(pendingToken, code);
    setBusy(false);
    if (result.error === 'invalidTOTP') { setError(t('Invalid code. Try again.')); return; }
    if (result.error) { setError(t('Verification failed. Please try again.')); return; }
    const loggedUser = loginWithUserData(result.user);
    onSuccess?.(loggedUser);
  }

  return (
    <ScreenFrame onBack={onBack} backLabel={t('Back')} icon="lock" title={t('Two-Factor Authentication')} subtitle={t('Enter the 6-digit code from your authenticator app.')}>
      <form onSubmit={e => { e.preventDefault(); handleVerify(); }} noValidate className="space-y-5">
        <AuthField label={t('Verification code')} placeholder="------" className="ds-code !min-h-14" autoFocus
          inputMode="numeric" autoComplete="one-time-code" required
          value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} error={error} />
        <AuthButton loading={busy} disabled={code.length !== 6} icon="check">{busy ? `${t('Verifying')}…` : t('Verify')}</AuthButton>
      </form>
    </ScreenFrame>
  );
}

// ── This e-mail has both a freelancer and a client account ───────────────────
export function RoleSelectScreen({ roles, loading, onSelect, onBack }) {
  const { t } = useTranslation();
  const META = {
    freelancer: { icon: 'work',           label: t('Freelancer'), hint: t('Looking for work & clients') },
    client:     { icon: 'business_center', label: t('Client'),     hint: t('Looking to hire talent') },
  };
  return (
    <ScreenFrame onBack={onBack} backLabel={t('Back')} icon="switch_account" title={t('Choose account')}
      subtitle={t('This email has multiple accounts. Choose which one to log into:')}>
      <div className="flex flex-col gap-3">
        {roles.map(r => (
          <button key={r} type="button" disabled={loading} onClick={() => onSelect(r)}
            className="group flex items-center gap-4 rounded-2xl border border-ds-line bg-ds-low p-4 text-start transition-colors hover:border-ds-accent hover:bg-ds-high disabled:opacity-60">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-ds-accent-soft text-ds-accent"><Icon name={META[r]?.icon || 'person'} size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ds-ink">{META[r]?.label || r}</span>
              {META[r] && <span className="mt-0.5 block text-[12.5px] text-ds-faint">{META[r].hint}</span>}
            </span>
            <Icon name="arrow_forward" size={20} flip className="flex-none text-ds-faint transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </button>
        ))}
      </div>
    </ScreenFrame>
  );
}
