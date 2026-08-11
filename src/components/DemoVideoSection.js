// Official Fama Mennou demo video — homepage.
//
// Clicking the poster opens the video on YouTube in a new tab (no inline
// player, no iframe). The poster itself is YouTube's own thumbnail for this
// video, loaded from i.ytimg.com — allowed by production's CSP img-src (see
// DEPLOYMENT.md; that entry was added alongside this section).
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DEMO_VIDEO_ID = 'Ern0_oRKSKE';
const DEMO_VIDEO_URL = `https://youtu.be/${DEMO_VIDEO_ID}`;

export default function DemoVideoSection() {
  const { t } = useTranslation();

  return (
    // This section sits immediately under the hero's CTA buttons, so it adds no
    // top padding of its own — the hero's (small) bottom padding is the entire
    // gap. A fixed 72px here used to stack on top of it and pushed the video
    // most of a screen away on a phone. The remaining values scale with the
    // viewport so the spacing reads the same on every device.
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(12px,2.2vw,20px)' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', letterSpacing: '-.025em', margin: 0, color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.demo.title')}
        </h2>
      </div>

      <motion.a
        href={DEMO_VIDEO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('home.demo.cta')}
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="fm-demo-card fm-demo-trigger"
        style={{
          position: 'relative', display: 'block', maxWidth: '820px', margin: '0 auto', width: '100%',
          aspectRatio: '16 / 9', borderRadius: '22px', overflow: 'hidden',
          border: '1px solid var(--fm-border)', background: '#000', textDecoration: 'none',
          boxShadow: '0 28px 64px -26px rgba(108,92,246,.55)',
        }}
      >
        <style>{`
          .fm-demo-card .fm-demo-play { transition: transform .2s ease, filter .2s ease; }
          .fm-demo-trigger:hover .fm-demo-play, .fm-demo-trigger:focus-visible .fm-demo-play { transform: scale(1.08); filter: brightness(1.1); }
        `}</style>

        {/* YouTube's own poster frame for this video */}
        <img
          src={`https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/maxresdefault.jpg`}
          alt=""
          loading="lazy"
          onError={e => {
            // maxres does not exist for every upload; hqdefault always does.
            if (!e.currentTarget.dataset.fallback) {
              e.currentTarget.dataset.fallback = '1';
              e.currentTarget.src = `https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/hqdefault.jpg`;
            }
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.5))' }} />

        {/* Big YouTube play button — the only thing left in the overlay */}
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg className="fm-demo-play" width="clamp(68px,10vw,92px)" height="64" viewBox="0 0 68 48" style={{ width: 'clamp(68px,10vw,92px)', height: 'auto', filter: 'drop-shadow(0 10px 26px rgba(0,0,0,.5))' }} aria-hidden="true">
            <path fill="#FF0000" d="M66.52 7.74a8.57 8.57 0 0 0-6.03-6.06C55.16.24 34 .24 34 .24s-21.16 0-26.49 1.44a8.57 8.57 0 0 0-6.03 6.06C.05 13.09.05 24 .05 24s0 10.91 1.43 16.26a8.57 8.57 0 0 0 6.03 6.06C12.84 47.76 34 47.76 34 47.76s21.16 0 26.49-1.44a8.57 8.57 0 0 0 6.03-6.06C67.95 34.91 67.95 24 67.95 24s0-10.91-1.43-16.26z"/>
            <path fill="#fff" d="M27.2 34.29 44.79 24 27.2 13.71z"/>
          </svg>
        </span>
      </motion.a>
    </section>
  );
}
