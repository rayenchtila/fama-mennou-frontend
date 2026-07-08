import SEOHead from '../components/Seohead';

export default function BlogPage() {
  return (
    <>
      <SEOHead title="Blog — Fama Mennou" description="Actualités, conseils et ressources pour freelancers, clients et apprenants sur Fama Mennou." />
      <div style={{ minHeight: '100vh', background: 'var(--fm-bg)', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fm-primary-light)' }}>Blog</span>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--fm-text-1)', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>
            Actualités & Conseils
          </h1>
          <p style={{ fontSize: 17, color: 'var(--fm-text-5)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 56px' }}>
            Des articles, guides et ressources pour vous aider à réussir sur Fama Mennou.
          </p>

          <div style={{ padding: '56px 32px', borderRadius: 24, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(124,108,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--fm-primary-light)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fm-text-1)', margin: '0 0 10px' }}>Bientôt disponible</h2>
            <p style={{ fontSize: 15, color: 'var(--fm-text-5)', margin: 0 }}>Notre blog arrive très bientôt avec des articles exclusifs sur le freelancing, la formation et le marché tunisien.</p>
          </div>
        </div>
      </div>
    </>
  );
}
