import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const PLATFORM_LINKS = [
    { key: 'Find Freelancers', to: '/freelancers' },
    { key: 'Find Clients',     to: '/clients' },
    { key: 'Courses',          to: '/courses' },
  ];

  const COMPANY_LINKS = [
    { key: 'About Us',  to: '/about' },
    { key: 'Blog',      to: '/blog' },
    { key: 'Careers',   to: '/careers' },
  ];

  const SUPPORT_LINKS = [
    { key: 'Help Center',       to: '/help' },
    { key: 'Privacy Policy',    to: '/privacy' },
    { key: 'Terms of Service',  to: '/terms' },
  ];

  const linkStyle = {
    fontSize: '13.5px',
    color: 'var(--fm-text-5)',
    textDecoration: 'none',
    transition: 'color .15s',
  };

  return (
    <footer style={{ borderTop: '1px solid var(--fm-border)', background: 'var(--fm-bg)' }}>
      <div className="fm-footer-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '52px 20px 28px' }}>

        {/* Brand */}
        <div style={{ minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px' }}>
            <img src="/logo.png" alt="Fama Mennou" style={{ height: '30px', width: 'auto', objectFit: 'contain', mixBlendMode: 'var(--fm-logo-blend)' }} />
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Fama<span style={{ color: 'var(--fm-primary-light)' }}>&nbsp;Mennou</span>
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--fm-text-6)', lineHeight: 1.6, maxWidth: '250px', margin: '0 0 18px' }}>
            {t('The all-in-one platform connecting professionals, clients, and learners worldwide.')}
          </p>

          {/* Social icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* YouTube */}
            <a href="https://youtube.com/@famamennou?si=6xCP4zz2yXrpS3gA" target="_blank" rel="noopener noreferrer"
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-5)', transition: 'background .15s,color .15s,border-color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,0,.15)'; e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = 'rgba(255,68,68,.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-5)'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}
              title="YouTube">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a href="https://www.instagram.com/famamennou.tn?igsh=MXhpZXA1Y2J0dG9idQ==" target="_blank" rel="noopener noreferrer"
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-5)', transition: 'background .15s,color .15s,border-color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(228,64,95,.15)'; e.currentTarget.style.color = '#e4405f'; e.currentTarget.style.borderColor = 'rgba(228,64,95,.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-5)'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}
              title="Instagram">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a href="https://www.facebook.com/profile.php?id=61591248832140" target="_blank" rel="noopener noreferrer"
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-text-5)', transition: 'background .15s,color .15s,border-color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(24,119,242,.15)'; e.currentTarget.style.color = '#1877f2'; e.currentTarget.style.borderColor = 'rgba(24,119,242,.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-5)'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}
              title="Facebook">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Platform */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--fm-text-7)', marginBottom: '13px', textTransform: 'uppercase' }}>
            {t('Platform')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLATFORM_LINKS.map(l => (
              <Link key={l.key} to={l.to} style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--fm-primary-light)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--fm-text-5)'}>
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--fm-text-7)', marginBottom: '13px', textTransform: 'uppercase' }}>
            {t('Company')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {COMPANY_LINKS.map(l => (
              <Link key={l.key} to={l.to} style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--fm-primary-light)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--fm-text-5)'}>
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>

        {/* Support */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', color: 'var(--fm-text-7)', marginBottom: '13px', textTransform: 'uppercase' }}>
            {t('Support')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SUPPORT_LINKS.map(l => (
              <Link key={l.key} to={l.to} style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--fm-primary-light)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--fm-text-5)'}>
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '18px 20px', borderTop: '1px solid var(--fm-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '12.5px', color: 'var(--fm-text-7)', margin: 0 }}>
          © {new Date().getFullYear()} Fama Mennou. {t('All rights reserved.')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--fm-success)', boxShadow: '0 0 7px var(--fm-success)', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: '12.5px', color: 'var(--fm-text-7)' }}>{t('All systems operational')}</span>
        </div>
      </div>
    </footer>
  );
}
