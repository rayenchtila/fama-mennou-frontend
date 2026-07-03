import SEOHead from '../components/Seohead';

export default function AboutPage() {
  return (
    <>
      <SEOHead title="About Us — Fama Mennou" description="Learn about Fama Mennou, the all-in-one platform connecting freelancers, clients, and learners in Tunisia and beyond." />
      <div style={{ minHeight: '100vh', background: '#0a0817', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9b8cff' }}>À propos</span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbfbff', margin: '12px 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Qui sommes-nous ?
            </h1>
            <p style={{ fontSize: 17, color: '#a7abc8', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
              Fama Mennou est une plateforme tout-en-un qui connecte les professionnels, les clients et les apprenants en Tunisie et dans le monde entier.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { title: 'Notre mission', text: 'Permettre à chaque professionnel tunisien de montrer son talent, trouver des clients et développer ses compétences — tout en un seul endroit.' },
              { title: 'Notre vision', text: 'Devenir la référence numéro 1 du freelancing et de la formation en ligne en Tunisie et dans le monde arabe.' },
              { title: 'Notre équipe', text: 'Une équipe passionnée de développeurs, designers et entrepreneurs basée en Tunisie, dédiée à créer la meilleure expérience pour nos utilisateurs.' },
              { title: 'Pourquoi Fama Mennou ?', text: '"Fama Mennou" signifie "Il y en a" en arabe tunisien — un clin d\'œil à l\'abondance de talents qui existent en Tunisie et qui méritent d\'être reconnus.' },
            ].map(({ title, text }) => (
              <div key={title} style={{ padding: '28px 32px', borderRadius: 20, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fbfbff', margin: '0 0 12px', letterSpacing: '-0.01em' }}>{title}</h2>
                <p style={{ fontSize: 15, color: '#a7abc8', lineHeight: 1.8, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
