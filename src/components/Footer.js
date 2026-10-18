import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Brand glyphs (simple-icons paths, 24×24).
const SOCIALS = [
  {
    key: 'YouTube', href: 'https://youtube.com/@famamennou?si=6xCP4zz2yXrpS3gA',
    path: 'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  },
  {
    key: 'Instagram', href: 'https://www.instagram.com/famamennou.tn?igsh=MXhpZXA1Y2J0dG9idQ==',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  {
    key: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591248832140',
    path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
  },
];

export default function Footer() {
  const { t } = useTranslation();

  const COLUMNS = [
    { title: t('Platform'), links: [
      { key: 'Find Freelancers', to: '/freelancers' },
      { key: 'Find Clients',     to: '/clients' },
      { key: 'Courses',          to: '/courses' },
      { key: 'footer.post_project', to: '/projects?post=1' },
    ] },
    { title: t('Company'), links: [
      { key: 'About Us', to: '/about' },
      { key: 'Blog',     to: '/blog' },
      { key: 'Careers',  to: '/careers' },
    ] },
    { title: t('Support'), links: [
      { key: 'Help Center',      to: '/help' },
      { key: 'Privacy Policy',   to: '/privacy' },
      { key: 'Terms of Service', to: '/terms' },
    ] },
  ];

  return (
    <footer className="ds ds-footer">
      <div className="ds-wrap py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Fama Mennou">
              {/* The footer is dark in both themes, so the logo's black plate is always screened away. */}
              <img src="/logo.png" alt="" className="block h-9 w-auto" style={{ mixBlendMode: 'screen' }} />
              <span className="text-lg font-bold tracking-tight" style={{ color: 'rgb(var(--ds-foot-ink))' }}>
                Fama<span className="ds-brand-accent">&nbsp;Mennou</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6">{t('footer.blurb')}</p>

            {/* Contact — the real inbox already linked from /help and /careers. */}
            <a href="mailto:famamennou.platform@gmail.com" className="mt-2 inline-block break-all py-1.5 text-sm transition-colors">
              famamennou.platform@gmail.com
            </a>

            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map(s => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="ds-foot-social" title={s.key} aria-label={s.key}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>

            {/* Payment methods — the real options from the project payment flow
                (src/components/ProjectPaymentPanel.js): D17, Flouci, bank transfer. */}
            <div className="mt-6">
              <p className="mb-2.5 text-[11px] font-bold tracking-wide" style={{ color: 'rgb(var(--ds-foot-ink))' }}>{t('footer.payment_methods')}</p>
              <div className="flex flex-wrap gap-2">
                {[t('footer.bank_transfer'), 'Flouci', 'D17'].map(label => (
                  <span key={label} className="ds-foot-chip">{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns — two across on a phone, three from sm up */}
          <nav className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-7 lg:ps-10" aria-label="Footer">
            {COLUMNS.map(col => (
              <div key={col.title}>
                <h3 className="ds-foot-title">{col.title}</h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {col.links.map(l => (
                    <li key={l.key}><Link to={l.to} className="ds-foot-link">{t(l.key)}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--ds-foot-line)' }}>
        <div className="ds-wrap flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">© {new Date().getFullYear()} Fama Mennou. {t('All rights reserved.')}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link to="/privacy" className="py-1.5 transition-colors">{t('Privacy Policy')}</Link>
            <Link to="/terms" className="py-1.5 transition-colors">{t('Terms of Service')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
