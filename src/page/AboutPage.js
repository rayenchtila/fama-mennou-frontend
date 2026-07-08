import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Seohead';

const SECTIONS = [
  {
    key: 'mission',
    color: '#9b8cff',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    key: 'vision',
    color: '#3ec2e8',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    key: 'team',
    color: '#10b981',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    key: 'why',
    color: '#f59e0b',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
];

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead title={t('about.seo_title')} description={t('about.seo_desc')} />
      <div style={{ minHeight: '100vh', background: 'var(--fm-bg)', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fm-primary-light)' }}>{t('about.eyebrow')}</span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--fm-text-1)', margin: '12px 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {t('about.title')}
            </h1>
            <p style={{ fontSize: 17, color: 'var(--fm-text-5)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
              {t('about.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SECTIONS.map(({ key, color, icon }) => (
              <div key={key} style={{ padding: '24px 28px', borderRadius: 20, background: 'var(--fm-surface-hover-soft)', border: '1px solid var(--fm-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fm-text-1)', margin: 0, letterSpacing: '-0.01em' }}>{t(`about.${key}.title`)}</h2>
                </div>
                <p style={{ fontSize: 14.5, color: 'var(--fm-text-5)', lineHeight: 1.8, margin: 0 }}>{t(`about.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
