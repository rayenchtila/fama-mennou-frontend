import SEOHead from '../components/Seohead';

const SECTIONS = [
  { title: "1. Acceptation des conditions", content: "En utilisant Fama Mennou, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme." },
  { title: "2. Éligibilité", content: "Vous devez avoir au moins 18 ans pour utiliser Fama Mennou. En créant un compte, vous confirmez avoir l'âge requis et la capacité légale d'accepter ces conditions." },
  { title: "3. Vérification d'identité (CIN)", content: "Tout utilisateur doit soumettre une photo de sa Carte d'Identité Nationale (CIN) valide. Fama Mennou se réserve le droit de refuser ou suspendre tout compte dont l'identité ne peut être vérifiée." },
  { title: "4. Comportement des utilisateurs", content: "Vous vous engagez à : fournir des informations exactes, ne pas usurper l'identité d'autrui, respecter les autres utilisateurs, ne pas publier de contenu illégal, frauduleux ou offensant." },
  { title: "5. Transactions et paiements", content: "Fama Mennou prélève une commission de 5% sur chaque transaction. Les paiements sont traités de manière sécurisée. Fama Mennou n'est pas responsable des litiges entre freelancers et clients." },
  { title: "6. Propriété intellectuelle", content: "Tout le contenu que vous publiez (cours, portfolio, descriptions) reste votre propriété. En le publiant sur Fama Mennou, vous nous accordez une licence non-exclusive pour l'afficher sur la plateforme." },
  { title: "7. Suspension et suppression", content: "Fama Mennou se réserve le droit de suspendre ou supprimer tout compte qui viole ces conditions, sans préavis ni remboursement." },
  { title: "8. Limitation de responsabilité", content: "Fama Mennou est une plateforme de mise en relation. Nous ne sommes pas responsables de la qualité des services fournis par les freelancers ni des projets publiés par les clients." },
  { title: "9. Modifications", content: "Fama Mennou peut modifier ces conditions à tout moment. Les utilisateurs seront notifiés par email. L'utilisation continue de la plateforme après modification vaut acceptation." },
  { title: "10. Contact", content: "Pour toute question : famamennou.platform@gmail.com" },
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {SECTIONS.map(({ title, content }) => (
              <div key={title} style={{ padding: '24px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fbfbff', margin: '0 0 10px' }}>{title}</h2>
                <p style={{ fontSize: 14, color: '#a7abc8', lineHeight: 1.8, margin: 0 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
