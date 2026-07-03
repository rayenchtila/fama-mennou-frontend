import SEOHead from '../components/Seohead';

export default function CareersPage() {
  return (
    <>
      <SEOHead title="Carrières — Fama Mennou" description="Rejoignez l'équipe Fama Mennou et participez à la construction de la meilleure plateforme freelance de Tunisie." />
      <div style={{ minHeight: '100vh', background: '#0a0817', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9b8cff' }}>Carrières</span>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbfbff', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>
            Rejoignez notre équipe
          </h1>
          <p style={{ fontSize: 17, color: '#a7abc8', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 56px' }}>
            Nous construisons l'avenir du freelancing en Tunisie. Si vous êtes passionné et talentueux, nous voulons vous connaître.
          </p>

          <div style={{ padding: '56px 32px', borderRadius: 24, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(124,108,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fbfbff', margin: '0 0 10px' }}>Aucun poste ouvert pour le moment</h2>
            <p style={{ fontSize: 15, color: '#a7abc8', margin: '0 0 24px' }}>Revenez bientôt ou envoyez-nous votre candidature spontanée.</p>
            <a href="mailto:famamennou.platform@gmail.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c6cf6,#5e4fd4)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Candidature spontanée
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
