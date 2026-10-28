import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../ds/Icon';

/* Form building blocks for the login / sign-up screens, all on the design-system
   tokens (so they follow the light/dark theme) and all keyboard- and
   screen-reader-friendly: real <label>s, aria-invalid + aria-describedby on a
   field that has an error, role="alert" on the message. */

export function Spinner({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg className={`animate-spin flex-none ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// The four-colour Google "G".
export function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className="flex-none">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l3-2.32z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-ds-bad">
      <Icon name="error" size={15} fill className="mt-px flex-none" />
      <span>{children}</span>
    </p>
  );
}

function FieldLabel({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ds-ink-2">
      {children}{required && <span aria-hidden="true" className="ms-0.5 text-ds-bad">*</span>}
    </label>
  );
}

const noCopy = e => e.preventDefault();

/* Text / email / password / date input. `aside` sits at the far end of the label row
   (the "Forgot password?" link); `extra` is always shown under the control (the
   password rules). A password field has its own show/hide button and warns when
   Caps Lock is on. Copy, cut and the context menu stay disabled on password fields,
   exactly as before. */
export const AuthField = forwardRef(function AuthField(
  { label, error, hint, extra, icon, aside, type = 'text', required, containerClass = '', className = '', id, ...props },
  ref
) {
  const { t } = useTranslation();
  const auto = useId();
  const fieldId = id || auto;
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={containerClass}>
      {(label || aside) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? <FieldLabel htmlFor={fieldId} required={required}>{label}</FieldLabel> : <span />}
          {aside}
        </div>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ds-faint" aria-hidden="true">
            {typeof icon === 'string' ? <Icon name={icon} size={19} /> : icon}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={fieldId}
          type={isPassword && show ? 'text' : type}
          // Clarity auto-masks type="password", but the show/hide toggle above
          // switches this to type="text" while revealed — an explicit mask
          // keeps it hidden from the recording either way.
          data-clarity-mask={isPassword ? 'true' : undefined}
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`ds-input !min-h-12 ${icon ? '!ps-11' : ''} ${isPassword ? '!pe-12' : ''} ${className}`}
          onKeyUp={e => { if (isPassword) setCaps(!!e.getModifierState?.('CapsLock')); props.onKeyUp?.(e); }}
          onBlur={e => { if (isPassword) setCaps(false); props.onBlur?.(e); }}
          onCopy={isPassword ? noCopy : props.onCopy}
          onCut={isPassword ? noCopy : props.onCut}
          onContextMenu={isPassword ? noCopy : props.onContextMenu}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(v => !v)} aria-pressed={show}
            aria-label={show ? t('input.hide_password') : t('input.show_password')}
            className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ds-faint transition-colors hover:bg-ds-high hover:text-ds-ink">
            <Icon name={show ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        )}
      </div>
      {isPassword && caps && !error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ds-warn">
          <Icon name="keyboard_capslock" size={15} />{t('auth.caps_on')}
        </p>
      )}
      <FieldError id={`${fieldId}-err`}>{error}</FieldError>
      {!error && hint && <p id={`${fieldId}-hint`} className="mt-1.5 text-xs leading-snug text-ds-faint">{hint}</p>}
      {extra}
    </div>
  );
});

// Native <select> in the same control style (so a phone shows its own picker).
export function AuthSelect({ label, error, required, value, onChange, placeholder, options, icon, id, containerClass = '', ...props }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className={containerClass}>
      {label && <div className="mb-1.5"><FieldLabel htmlFor={fieldId} required={required}>{label}</FieldLabel></div>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ds-faint" aria-hidden="true">
            <Icon name={icon} size={19} />
          </span>
        )}
        <select {...props} id={fieldId} value={value} onChange={onChange}
          aria-required={required || undefined} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${fieldId}-err` : undefined}
          className={`ds-input !min-h-12 appearance-none !pe-10 ${icon ? '!ps-11' : ''} ${value ? '' : '!text-ds-faint'}`}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="expand_more" size={20} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ds-faint" />
      </div>
      <FieldError id={`${fieldId}-err`}>{error}</FieldError>
    </div>
  );
}

/* Checkbox with a real (visually hidden) input, so it is reachable by Tab, toggled
   with Space and announced properly; the box beside it is decoration. */
export function AuthCheck({ checked, onChange, error, children, id }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div>
      <label htmlFor={fieldId} className="flex cursor-pointer select-none items-start gap-3">
        <input id={fieldId} type="checkbox" className="peer sr-only" checked={checked} onChange={onChange}
          aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${fieldId}-err` : undefined} />
        <span aria-hidden="true"
          className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 border-ds-line-strong text-white transition-colors peer-checked:border-ds-fill peer-checked:bg-ds-fill peer-checked:[&_.mark]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-ds-accent/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ds-canvas">
          <Icon name="check" size={14} className="mark opacity-0 transition-opacity" />
        </span>
        <span className="text-[13px] leading-relaxed text-ds-mute">{children}</span>
      </label>
      <FieldError id={`${fieldId}-err`}>{error}</FieldError>
    </div>
  );
}

/* Segmented control with a sliding pill: the Log in / Sign up tabs, the role picker, the
   gender choice. `value` may match no option (nothing chosen yet) — the pill then hides. */
export function Segmented({ value, onChange, options, label, className = '', size = 'md' }) {
  const { i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const idx = options.findIndex(o => o.value === value);
  const pad = size === 'sm' ? 'py-2 text-[13px]' : 'py-2.5 text-[13.5px]';
  // The very first choice fades the pill in where it belongs instead of sliding it across from the first slot.
  const before = useRef(idx);
  useEffect(() => { before.current = idx; }, [idx]);
  const appearing = before.current < 0 && idx >= 0;
  return (
    <div role="group" aria-label={label}
      className={`relative grid rounded-xl border border-ds-line bg-ds-lowest p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span aria-hidden="true"
        className={`absolute inset-y-1 rounded-lg bg-ds-fill shadow-ds-btn transition-[transform,opacity] duration-300 ease-out ${idx < 0 ? 'opacity-0' : 'opacity-100'}`}
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          insetInlineStart: '0.25rem',
          transform: `translateX(calc(${Math.max(idx, 0)} * 100% * ${rtl ? -1 : 1}))`,
          transitionProperty: appearing ? 'opacity' : undefined,
        }} />
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" aria-pressed={active} onClick={() => onChange(o.value)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 font-semibold transition-colors ${pad} ${active ? 'text-white' : 'text-ds-mute hover:text-ds-ink'}`}>
            {o.icon && <Icon name={o.icon} size={18} />}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const TONES = {
  info: 'border-ds-accent-line bg-ds-accent-soft text-ds-accent',
  ok:   'border-ds-ok/30 bg-ds-ok/10 text-ds-ok',
  warn: 'border-ds-warn/30 bg-ds-warn/10 text-ds-ink',
  bad:  'border-ds-bad/30 bg-ds-bad/10 text-ds-bad',
};

export function AuthNotice({ tone = 'info', icon, children, className = '', role }) {
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug ${TONES[tone]} ${className}`}>
      {icon && <Icon name={icon} size={18} fill className={`mt-px flex-none ${tone === 'warn' ? 'text-ds-warn' : ''}`} />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Primary action of a screen. `loading` swaps the arrow for a spinner and blocks double submits.
export function AuthButton({ loading = false, icon = 'arrow_forward', variant = 'primary', className = '', children, ...props }) {
  return (
    <button type="submit" {...props} disabled={loading || props.disabled} aria-busy={loading || undefined}
      className={`ds-btn ds-btn-lg w-full ${variant === 'primary' ? 'ds-btn-primary' : variant === 'glass' ? 'ds-btn-glass' : ''} ${className}`}>
      {loading && <Spinner />}
      <span>{children}</span>
      {!loading && icon && <Icon name={icon} size={18} flip />}
    </button>
  );
}

// A link inside the terms sentence. It opens in a new tab so a half-filled form is not lost.
export function LegalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="font-semibold text-ds-ink underline underline-offset-2 transition-colors hover:text-ds-accent">
      {children}
    </a>
  );
}

// "──── label ────" between the Google button and the e-mail form.
export function Divider({ children }) {
  return (
    <div className="flex items-center gap-3 text-[12px] font-medium text-ds-faint" role="separator">
      <span className="h-px flex-1" style={{ background: 'rgb(var(--ds-line) / var(--ds-line-a))' }} />
      <span>{children}</span>
      <span className="h-px flex-1" style={{ background: 'rgb(var(--ds-line) / var(--ds-line-a))' }} />
    </div>
  );
}

/* The one-time code, as big as the screen allows: `length` cells that fill as the
   digits arrive. The real control is ONE transparent <input> laid over the cells, so
   everything a text field does still works — typing, paste, long-press paste,
   password-manager / "code from your e-mail" autofill (autocomplete="one-time-code"),
   and a screen reader reading the field's value and error. The cells are decoration.
   When the code has just been accepted (`success`) they take the site's verification
   glow, the same signal as every other "checked" badge. Digits always run left to
   right, also in Arabic. */
export function CodeInput({ value, onChange, length = 6, label, error, success = false, disabled = false, autoFocus = false, id, describedBy, inputRef }) {
  const auto = useId();
  const fieldId = id || auto;
  const own = useRef(null);
  const ref = inputRef || own;
  const [focused, setFocused] = useState(false);
  const active = focused && !disabled && !success ? Math.min(value.length, length - 1) : -1;

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-[13px] font-semibold text-ds-ink-2">{label}</label>
      <div className="relative" dir="ltr">
        <input ref={ref} id={fieldId} type="text" value={value} disabled={disabled} autoFocus={autoFocus}
          inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={length} spellCheck={false}
          aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-transparent opacity-0 caret-transparent outline-none" />
        <div aria-hidden="true" className={`grid gap-2 sm:gap-2.5 ${error ? 'ds-shake' : ''}`}
          style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
          {Array.from({ length }, (_, i) => {
            const ch = value[i] || '';
            const tone = success ? 'ds-verified border-ds-ok bg-ds-ok/10 text-ds-ok'
              : error ? 'border-ds-bad/70 bg-ds-bad/5 text-ds-ink'
              : i === active ? 'border-ds-accent bg-ds-low text-ds-ink shadow-[0_0_0_3px_rgb(var(--ds-accent)/0.22)]'
              : ch ? 'border-ds-line-strong bg-ds-high text-ds-ink'
              : 'border-ds-line bg-ds-lowest text-ds-ink';
            return (
              <span key={i} className={`flex h-14 items-center justify-center rounded-xl border-2 font-mono text-[26px] font-semibold tabular-nums transition-[border-color,background-color,box-shadow] duration-150 sm:h-16 sm:text-[30px] ${tone}`}>
                {ch || (i === active ? <span className="h-6 w-0.5 animate-pulse rounded bg-ds-accent" /> : null)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
