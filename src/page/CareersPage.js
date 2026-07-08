import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Seohead';

export default function CareersPage() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead title={t('careers.seo_title')} description={t('careers.seo_desc')} />
      <div style={{ minHeight: '100vh', background: 'var(--fm-bg)', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fm-primary-light)' }}>{t('Careers')}</span>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--fm-text-1)', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>
            {t('careers.title')}
          </h1>
          <p style={{ fontSize: 17, color: 'var(--fm-text-5)', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 56px' }}>
            {t('careers.subtitle')}
          </p>

          <div style={{ padding: '56px 32px', borderRadius: 24, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(124,108,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--fm-primary-light)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fm-text-1)', margin: '0 0 10px' }}>{t('careers.no_openings')}</h2>
            <p style={{ fontSize: 15, color: 'var(--fm-text-5)', margin: '0 0 24px' }}>{t('careers.no_openings_desc')}</p>
            <a href="mailto:famamennou.platform@gmail.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c6cf6,#5e4fd4)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              {t('careers.spontaneous_application')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
