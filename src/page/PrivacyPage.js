import SEOHead from '../components/Seohead';

const SECTIONS = [
  { title: "1. Informations collectées", content: "Nous collectons les informations que vous nous fournissez lors de l'inscription : nom, email, date de naissance, région, genre, photo de profil et photos CIN. Nous collectons également des données d'utilisation anonymisées pour améliorer la plateforme." },
  { title: "2. Utilisation des données", content: "Vos données sont utilisées pour : créer et gérer votre compte, vérifier votre identité (CIN), faciliter les transactions entre freelancers et clients, envoyer des notifications importantes par email, et améliorer nos services." },
  { title: "3. Protection des données", content: "Toutes les données sensibles (mots de passe, photos CIN) sont chiffrées. Nous ne vendons jamais vos données à des tiers. L'accès aux données est strictement limité à l'équipe Fama Mennou." },
  { title: "4. Cookies", content: "Nous utilisons des cookies essentiels pour maintenir votre session de connexion et mémoriser vos préférences. Nous n'utilisons pas de cookies publicitaires." },
  { title: "5. Partage des données", content: "Vos informations publiques de profil (nom, compétences, bio, portfolio) sont visibles par les autres utilisateurs. Votre email, date de naissance et CIN restent privés." },
  { title: "6. Vos droits", content: "Vous pouvez à tout moment : accéder à vos données, les modifier via votre profil, ou demander la suppression de votre compte en nous contactant à famamennou.platform@gmail.com." },
  { title: "7. Conservation des données", content: "Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont effacées sous 30 jours, sauf obligations légales." },
  { title: "8. Contact", content: "Pour toute question relative à la confidentialité : famamennou.platform@gmail.com" },
];

export default function PrivacyPage() {
  return (
    <>
      <SEOHead title="Politique de Confidentialité — Fama Mennou" description="Politique de confidentialité de Fama Mennou — comment nous collectons, utilisons et protégeons vos données." />
      <div style={{ minHeight: '100vh', background: '#0a0817', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9b8cff' }}>Légal</span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbfbff', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>Politique de Confidentialité</h1>
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
