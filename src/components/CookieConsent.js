import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'fm_cookie_consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return 'accepted'; }
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status) return;
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, [status]);

  const choose = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    setVisible(false);
    setTimeout(() => setStatus(value), 300);
  };

  if (status) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 sm:pb-6 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        className="mx-auto max-w-3xl rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: 'var(--fm-surface)', borderColor: 'var(--fm-border)', boxShadow: '0 16px 48px var(--fm-shadow)' }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--fm-primary-soft)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fm-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="9" cy="10" r="1.1" fill="var(--fm-primary)" stroke="none" />
              <circle cx="14.5" cy="9" r="1.1" fill="var(--fm-primary)" stroke="none" />
              <circle cx="10.5" cy="14.5" r="1.1" fill="var(--fm-primary)" stroke="none" />
              <circle cx="15" cy="14.5" r="1.1" fill="var(--fm-primary)" stroke="none" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fm-text-4)' }}>
            {t('cookie.message')}{' '}
            <Link to="/privacy" className="font-semibold underline underline-offset-2" style={{ color: 'var(--fm-text-2)' }}>
              {t('Privacy Policy')}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => choose('declined')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--fm-border-strong)', color: 'var(--fm-text-3)', background: 'transparent' }}
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.97]"
            style={{ background: 'var(--fm-primary)' }}
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
