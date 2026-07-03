import SEOHead from '../components/Seohead';

const SECTIONS = [
  {
    title: "1. Acceptation des conditions",
    content: "En utilisant Fama Mennou, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.",
    color: '#9b8cff',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    title: "2. Éligibilité",
    content: "Vous devez avoir au moins 18 ans pour utiliser Fama Mennou. En créant un compte, vous confirmez avoir l'âge requis et la capacité légale d'accepter ces conditions.",
    color: '#3ec2e8',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    title: "3. Vérification d'identité (CIN)",
    content: "Tout utilisateur doit soumettre une photo de sa Carte d'Identité Nationale (CIN) valide. Fama Mennou se réserve le droit de refuser ou suspendre tout compte dont l'identité ne peut être vérifiée.",
    color: '#f59e0b',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  },
  {
    title: "4. Comportement des utilisateurs",
    content: "Vous vous engagez à : fournir des informations exactes, ne pas usurper l'identité d'autrui, respecter les autres utilisateurs, ne pas publier de contenu illégal, frauduleux ou offensant.",
    color: '#10b981',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    title: "5. Transactions et paiements",
    content: "Fama Mennou prélève une commission de 5% sur chaque transaction. Les paiements sont traités de manière sécurisée. Fama Mennou n'est pas responsable des litiges entre freelancers et clients.",
    color: '#34d399',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    title: "6. Propriété intellectuelle",
    content: "Tout le contenu que vous publiez (cours, portfolio, descriptions) reste votre propriété. En le publiant sur Fama Mennou, vous nous accordez une licence non-exclusive pour l'afficher sur la plateforme.",
    color: '#a78bfa',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  },
  {
    title: "7. Suspension et suppression",
    content: "Fama Mennou se réserve le droit de suspendre ou supprimer tout compte qui viole ces conditions, sans préavis ni remboursement.",
    color: '#f87171',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
  {
    title: "8. Limitation de responsabilité",
    content: "Fama Mennou est une plateforme de mise en relation. Nous ne sommes pas responsables de la qualité des services fournis par les freelancers ni des projets publiés par les clients.",
    color: '#fb923c',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    title: "9. Modifications",
    content: "Fama Mennou peut modifier ces conditions à tout moment. Les utilisateurs seront notifiés par email. L'utilisation continue de la plateforme après modification vaut acceptation.",
    color: '#38bdf8',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    title: "10. Contact",
    content: "Pour toute question : famamennou.platform@gmail.com",
    color: '#9b8cff',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
];

export default function TermsPage() {
  return (
    <>
      <SEOHead title="Conditions d'Utilisation — Fama Mennou" description="Conditions générales d'utilisation de la plateforme Fama Mennou." />
      <div style={{ minHeight: '100vh', background: '#0a0817', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9b8cff' }}>Légal</span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbfbff', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>Conditions d'Utilisation</h1>
            <p style={{ fontSize: 14, color: '#62668a' }}>Dernière mise à jour : Juillet 2026</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SECTIONS.map(({ title, content, color, icon }) => (
              <div key={title} style={{ padding: '24px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fbfbff', margin: 0 }}>{title}</h2>
                </div>
                <p style={{ fontSize: 14, color: '#a7abc8', lineHeight: 1.8, margin: 0 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
