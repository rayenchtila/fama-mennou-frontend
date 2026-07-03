import { useState } from 'react';
import SEOHead from '../components/Seohead';

const FAQS = [
  { q: "Comment créer un compte ?", a: "Cliquez sur 'Sign up' en haut à droite, choisissez votre rôle (Freelancer ou Client), remplissez le formulaire et vérifiez votre email." },
  { q: "Pourquoi dois-je vérifier mon CIN ?", a: "La vérification CIN garantit la sécurité et l'authenticité de tous les utilisateurs sur la plateforme. L'admin vérifie votre identité sous 24-48h." },
  { q: "Comment contacter un freelancer ?", a: "Allez sur la page 'Find Freelancers', trouvez le profil qui vous intéresse et utilisez le chat pour le contacter directement." },
  { q: "Comment publier un cours ?", a: "Connectez-vous en tant que Freelancer, allez dans votre Dashboard → Courses, et créez un nouveau cours. Il sera soumis à validation avant publication." },
  { q: "Comment sont calculées les commissions ?", a: "Fama Mennou prend une commission de 5% sur chaque transaction. Vous recevez 95% de chaque paiement." },
  { q: "Comment retirer mes gains ?", a: "Allez dans Dashboard → Gains, puis cliquez sur 'Retirer'. Les retraits sont traités sous 2-5 jours ouvrables." },
  { q: "J'ai oublié mon mot de passe, que faire ?", a: "Sur la page de connexion, cliquez sur 'Mot de passe oublié' et suivez les instructions envoyées par email." },
  { q: "Comment signaler un problème ?", a: "Contactez-nous à famamennou.platform@gmail.com — nous répondons sous 24h." },
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <SEOHead title="Centre d'aide — Fama Mennou" description="Trouvez des réponses à toutes vos questions sur Fama Mennou." />
      <div style={{ minHeight: '100vh', background: '#0a0817', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9b8cff' }}>Support</span>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fbfbff', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>Centre d'aide</h1>
            <p style={{ fontSize: 17, color: '#a7abc8', lineHeight: 1.8 }}>Trouvez rapidement des réponses à vos questions.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderRadius: 16, border: `1px solid ${open === i ? 'rgba(124,108,246,0.35)' : 'rgba(255,255,255,0.08)'}`, background: open === i ? 'rgba(124,108,246,0.07)' : 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'all .2s' }}>
                <button onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fbfbff', lineHeight: 1.4 }}>{faq.q}</span>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2.5} style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {open === i && (
                  <div style={{ padding: '0 22px 18px' }}>
                    <p style={{ fontSize: 14, color: '#a7abc8', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52, padding: '32px', borderRadius: 20, background: 'rgba(124,108,246,0.06)', border: '1px solid rgba(124,108,246,0.15)' }}>
            <p style={{ fontSize: 15, color: '#a7abc8', margin: '0 0 16px' }}>Vous n'avez pas trouvé votre réponse ?</p>
            <a href="mailto:famamennou.platform@gmail.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c6cf6,#5e4fd4)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Contactez-nous
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
