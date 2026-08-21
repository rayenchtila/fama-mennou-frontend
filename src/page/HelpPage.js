import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Seohead';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function HelpPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  return (
    <>
      <SEOHead title={t('help.seo_title')} description={t('help.seo_desc')} />
      <div style={{ minHeight: '100vh', background: 'var(--fm-bg)', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--fm-text-1)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>{t('help.title')}</h1>
            <p style={{ fontSize: 17, color: 'var(--fm-text-5)', lineHeight: 1.8 }}>{t('help.subtitle')}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_KEYS.map((i) => (
              <div key={i} style={{ borderRadius: 16, border: `1px solid ${open === i ? 'rgba(124,108,246,0.35)' : 'var(--fm-border)'}`, background: open === i ? 'rgba(124,108,246,0.07)' : 'var(--fm-surface-hover-soft)', overflow: 'hidden', transition: 'all .2s' }}>
                <button onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fm-text-1)', lineHeight: 1.4 }}>{t(`help.faq.${i}.q`)}</span>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--fm-primary-light)" strokeWidth={2.5} style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {open === i && (
                  <div style={{ padding: '0 22px 18px' }}>
                    <p style={{ fontSize: 14, color: 'var(--fm-text-5)', lineHeight: 1.8, margin: 0 }}>{t(`help.faq.${i}.a`)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52, padding: '32px', borderRadius: 20, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)' }}>
            <p style={{ fontSize: 15, color: 'var(--fm-text-5)', margin: '0 0 16px' }}>{t('help.not_found')}</p>
            <a href="mailto:famamennou.platform@gmail.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c6cf6,#5e4fd4)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {t('help.contact_us')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
