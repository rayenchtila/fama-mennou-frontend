// Official Fama Mennou demo video — homepage.
//
// The video lives on YouTube (its canonical source) and is intentionally not
// proxied or re-hosted here: production's CSP (set at the Nginx level,
// outside this repo — see DEPLOYMENT.md) only allows media/frames from
// res.cloudinary.com and stream.mux.com, so an embedded YouTube iframe or a
// hotlinked YouTube thumbnail would be silently blocked in production.
// Instead this renders a fully self-hosted poster card (no external
// requests, so nothing for the CSP to block) that opens the video on
// YouTube in a new tab. CSP-safe today, no server-side changes required.
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DEMO_VIDEO_URL = 'https://youtu.be/Ern0_oRKSKE';

function PlayIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export default function DemoVideoSection() {
  const { t } = useTranslation();

  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', letterSpacing: '-.025em', margin: '0 0 8px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.demo.title')}
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.demo.sub')}</p>
      </div>

      <motion.a
        href={DEMO_VIDEO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('home.demo.cta')}
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="fm-demo-card"
        style={{
          position: 'relative', display: 'block', maxWidth: '820px', margin: '0 auto',
          width: '100%', aspectRatio: '16 / 9', borderRadius: '22px', overflow: 'hidden',
          border: '1px solid var(--fm-border)', textDecoration: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#6c5cf6 0%,#7d5cf0 45%,#3a8ce0 100%)',
          boxShadow: '0 28px 64px -26px rgba(108,92,246,.55)',
        }}
      >
        <style>{`
          .fm-demo-card { transition: transform .25s ease, box-shadow .25s ease; }
          .fm-demo-card:hover, .fm-demo-card:focus-visible { transform: translateY(-3px); box-shadow: 0 34px 76px -24px rgba(108,92,246,.7); }
          .fm-demo-card .fm-demo-play { transition: transform .2s ease, background .2s ease; }
          .fm-demo-card:hover .fm-demo-play, .fm-demo-card:focus-visible .fm-demo-play { transform: scale(1.08); background: #fff; }
        `}</style>

        {/* Decorative glow — same treatment as the final CTA section */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(440px 240px at 12% 0%,rgba(255,255,255,.2),transparent 70%),radial-gradient(420px 240px at 90% 100%,rgba(255,255,255,.12),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', textAlign: 'center' }}>
          <span className="fm-demo-play" style={{
            width: 'clamp(58px,9vw,84px)', height: 'clamp(58px,9vw,84px)', borderRadius: '50%',
            background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6a5cf0', boxShadow: '0 12px 30px -8px rgba(0,0,0,.45)', flex: 'none',
          }}>
            <PlayIcon size={30} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 'clamp(14px,2vw,16px)', color: '#fff' }}>
            {t('home.demo.cta')}
          </span>
        </div>
      </motion.a>
    </section>
  );
}
