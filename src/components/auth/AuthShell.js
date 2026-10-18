import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import useLivePoll from '../../hooks/useLivePoll';
import useMediaQuery from '../../hooks/useMediaQuery';
import { loadAuthStats } from '../../utils/liveStats';
import Icon from '../ds/Icon';
import CountUp from '../ds/CountUp';

/* The login / sign-up surface, after the supplied Stitch screens: a header across the top,
   then a split view — a brand panel (from 1024px) beside the form. The panel is always the
   opposite of the page: dark beside the light form, light beside the dark form, so every
   click on the theme toggle swaps the two sides. Every auth step (log in, sign up, e-mail
   code, forgot password, 2-step verification, account status…) renders inside the form
   side, so the page never changes shape when the step does.

   - A real dialog: labelled by the form title, focus moves in on open and returns to the
     trigger on close, Tab is kept inside, Escape closes it (when it is closable).
   - The logo + wordmark are the site's own, identical to the header and the footer. */

// Each language is shown by its own name, written in that language — what a visitor looks for — not a two-letter code.
const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function BrandMark({ linked, onClose }) {
  const inner = (
    <>
      <img src="/logo.png" alt="" className="block h-[30px] w-auto flex-none min-[360px]:h-[34px] sm:h-[38px]" style={{ mixBlendMode: 'var(--fm-logo-blend)' }} />
      <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-ds-ink min-[360px]:text-[16px] sm:text-[17px]">
        Fama<span className="ds-brand-accent">&nbsp;Mennou</span>
      </span>
    </>
  );
  return linked
    ? <Link to="/" onClick={onClose} aria-label="Fama Mennou" className="flex items-center gap-2 rounded-lg min-[360px]:gap-2.5">{inner}</Link>
    : <div className="flex items-center gap-2 min-[360px]:gap-2.5" aria-label="Fama Mennou">{inner}</div>;
}

// The language menu: globe, the current language's name, chevron. Escape or a click outside
// closes just the menu, not the dialog.
function LangMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const lang = i18n.resolvedLanguage || i18n.language;
  const active = LANGS.find(l => l.code === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* The accessible name starts from the visible text, so a screen reader and a sighted visitor hear/see the same word. */}
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="menu" aria-label={`${active.label} — ${t('nav.languages')}`}
        className="ds-iconbtn ds-iconbtn-boxed !w-auto gap-1.5 !px-2.5 text-[13px] font-semibold min-[480px]:!px-3">
        <Icon name="language" size={17} />
        {/* On a narrow phone the header only has room for the globe: the name is in the menu, ticked. */}
        <span lang={active.code} className="hidden max-w-[6.5rem] truncate min-[480px]:inline">{active.label}</span>
        <Icon name="expand_more" size={16} className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="ds-pop ds-auth-in absolute end-0 z-[60] mt-2 w-44 overflow-hidden">
          {LANGS.map(l => (
            <button key={l.code} type="button" role="menuitemradio" aria-checked={lang === l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
              className="ds-menuitem !px-3.5 !py-2.5">
              <span lang={l.code} className="flex-1 text-[13.5px] font-semibold">{l.label}</span>
              {lang === l.code && <Icon name="check" size={16} className="text-ds-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ closable, onClose }) {
  const { t } = useTranslation();
  const { isDark, toggle } = useTheme();
  // A <div>, not a <header>: inside the dialog it would count as a second "banner" landmark next to the site's own.
  return (
    <div className="sticky top-0 z-30 flex h-16 flex-none items-center justify-between gap-3 border-b border-ds-line bg-ds-canvas/85 px-3 backdrop-blur-xl min-[360px]:px-4 sm:px-8">
      <BrandMark linked={closable} onClose={onClose} />
      <div className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3">
        <LangMenu />
        <button type="button" onClick={toggle} className="ds-iconbtn ds-iconbtn-boxed"
          aria-label={isDark ? t('auth.theme_to_light') : t('auth.theme_to_dark')} title={isDark ? t('auth.theme_to_light') : t('auth.theme_to_dark')}>
          <Icon name={isDark ? 'light_mode' : 'dark_mode'} size={19} />
        </button>
        {closable && (
          <>
            <button type="button" onClick={onClose} aria-label={t('Close')} className="ds-iconbtn ds-iconbtn-boxed sm:!hidden">
              <Icon name="close" size={20} />
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost ds-btn-sm !hidden sm:!inline-flex">
              <Icon name="arrow_back" size={17} flip />{t('auth.back_home')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Left side (from 1024px): what the platform checks, in numbers and in words — only what it really does.
function BrandPanel({ variant }) {
  const { t } = useTranslation();
  // The panel is only drawn from 1024px: below that there is nothing to keep fresh, so no request is made either.
  const wide = useMediaQuery('(min-width: 1024px)');
  const { data: stats, loading } = useLivePoll(loadAuthStats, { enabled: wide });
  const fallback = loading ? '…' : '—';
  const points = [
    { icon: 'badge',    title: t('ap.t1.title'), text: t('ap.t1.text') },
    { icon: 'payments', title: t('ap.t2.title'), text: t('ap.t2.text') },
    { icon: 'percent',  title: t('ap.t3.title'), text: t('ap.t3.text') },
  ];
  const tiles = [
    { value: stats?.verified, label: t('Verified freelancers') },
    { value: stats?.clients,  label: t('clp.stat_active_clients') },
    { value: stats?.regions,  label: t('Regions covered') },
  ];
  return (
    <aside className="ds-auth-panel hidden lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:w-[44%] lg:flex-none lg:flex-col lg:justify-between lg:gap-8 lg:overflow-y-auto lg:px-10 lg:py-12 xl:px-16 xl:py-14">
      {/* The glows overhang the panel's corners; their own clipping layer keeps that overhang from becoming scrollable room. */}
      <span className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden" aria-hidden="true">
        <span className="ds-auth-glow -start-24 -top-24 bg-ap-glow-1" />
        <span className="ds-auth-glow -bottom-24 -end-24 bg-ap-glow-2" />
      </span>

      {/* Colours come from the panel's own tokens (text-ap-*, see "Auth" in design.css), which flip with the theme —
          nothing here is a fixed white or slate, so the text stays readable whichever side is dark.

          The panel never has to scroll: the shorter the window, the less of it is shown (see "ap-" in design.css) —
          first the live figures, then the sentence under each point, then the points themselves. */}
      <div className="relative space-y-6">
        <div key={variant} className="ds-auth-in space-y-3.5">
          <h2 className="m-0 text-balance [word-spacing:.06em] text-[2rem] font-extrabold leading-[1.12] tracking-[-0.025em] text-ap-ink xl:text-[2.25rem]">{t(`ap.${variant}.h1`)}</h2>
          <p className="m-0 max-w-lg text-pretty text-[14.5px] leading-relaxed text-ap-mute">{t(`ap.${variant}.sub`)}</p>
        </div>

        <ul className="ap-points m-0 list-none space-y-2.5 p-0">
          {points.map(p => (
            <li key={p.title} className="flex items-start gap-3.5 rounded-xl border border-ap-line bg-ap-tint p-3.5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-ap-chip text-ap-accent"><Icon name={p.icon} size={20} /></span>
              <span className="min-w-0 self-center">
                <span className="block text-[14px] font-semibold text-ap-ink">{p.title}</span>
                <span className="ap-point-text mt-0.5 block text-[12.5px] leading-snug text-ap-mute">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Live figures */}
        <dl className="ap-stats m-0 grid grid-cols-3 overflow-hidden rounded-xl border border-ap-line bg-ap-tint">
          {tiles.map((tile, i) => (
            <div key={tile.label} className={`px-4 py-3 ${i ? 'border-s border-ap-line' : ''}`}>
              <dd className="m-0"><CountUp value={tile.value} fallback={fallback} className="block text-[22px] font-extrabold leading-none tabular-nums text-ap-ink" /></dd>
              <dt className="mt-1.5 text-[11px] font-medium leading-tight text-ap-mute">{tile.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative border-t border-ap-line pt-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ap-mute">{t('ap.rails')}</p>
        <div className="flex flex-wrap gap-2">
          {['D17', 'Flouci', t('footer.bank_transfer')].map(m => <span key={m} className="ds-foot-chip">{m}</span>)}
        </div>
      </div>
    </aside>
  );
}

export default function AuthShell({ open, onClose, closable = true, variant = 'login', labelledBy, children }) {
  const rootRef = useRef(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape' && closable) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closable, onClose]);

  // Focus moves into the dialog when it opens and goes back to whatever opened it.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    rootRef.current?.focus({ preventScroll: true });
    return () => { if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true }); };
  }, [open]);

  // Keep Tab inside the dialog: from the last control it wraps to the first, and back.
  const trapTab = e => {
    if (e.key !== 'Tab') return;
    const items = [...rootRef.current.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  if (!open) return null;

  return createPortal(
    <div ref={rootRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onKeyDown={trapTab}
      className="ds ds-auth-shell fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-ds-canvas outline-none">
      <Header closable={closable} onClose={onClose} />
      {/* The form comes first in the document (so it is what a screen reader reaches first); the brand panel
          is laid out on the start side with flex-row-reverse, which also mirrors correctly in Arabic. */}
      <div className="flex flex-1 flex-col lg:flex-row-reverse">
        <main className="flex min-w-0 flex-1 items-start justify-center px-5 py-8 sm:px-10 sm:py-12 lg:items-center lg:px-10 lg:py-12 xl:px-16 xl:py-14">
          <div className="w-full max-w-[34rem]">{children}</div>
        </main>
        <BrandPanel variant={variant} />
      </div>
    </div>,
    document.body
  );
}
