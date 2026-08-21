import { useTranslation } from 'react-i18next';
import SEOHead from '../components/Seohead';

const SECTIONS = [
  {
    key: 's1',
    color: '#9b8cff',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  {
    key: 's2',
    color: '#3ec2e8',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/></svg>,
  },
  {
    key: 's3',
    color: '#10b981',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    key: 's4',
    color: '#f59e0b',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>,
  },
  {
    key: 's5',
    color: '#a78bfa',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  },
  {
    key: 's6',
    color: '#34d399',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    key: 's7',
    color: '#38bdf8',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    key: 's8',
    color: '#fb923c',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
];

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead title={t('privacy.seo_title')} description={t('privacy.seo_desc')} />
      <div style={{ minHeight: '100vh', background: 'var(--fm-bg)', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--fm-text-1)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>{t('privacy.title')}</h1>
            <p style={{ fontSize: 14, color: 'var(--fm-text-7)' }}>{t('privacy.last_updated')}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SECTIONS.map(({ key, color, icon }) => (
              <div key={key} style={{ padding: '24px 28px', borderRadius: 16, background: 'var(--fm-surface-hover-soft)', border: '1px solid var(--fm-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--fm-text-1)', margin: 0 }}>{t(`privacy.${key}.title`)}</h2>
                </div>
                <p style={{ fontSize: 14, color: 'var(--fm-text-5)', lineHeight: 1.8, margin: 0 }}>{t(`privacy.${key}.content`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
