// Official Fama Mennou demo video — homepage.
//
// The video is embedded and playable in place, from youtube-nocookie.com (the
// privacy-preserving host: no cookie is set unless the visitor actually
// plays). The poster frame is YouTube's own thumbnail.
//
// CSP NOTE — this section only works because production's Content-Security-
// Policy (set in Nginx, outside this repo — see DEPLOYMENT.md) allows:
//     frame-src  https://www.youtube-nocookie.com https://www.youtube.com
//     img-src    https://i.ytimg.com
// Without those two entries the iframe and its poster are silently blocked and
// the section renders as an empty box. If the CSP is ever rebuilt, they must
// be carried over.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DEMO_VIDEO_ID = 'Ern0_oRKSKE';
const DEMO_VIDEO_URL = `https://youtu.be/${DEMO_VIDEO_ID}`;

// Official YouTube mark, inline so it costs no extra request and cannot be
// blocked by img-src.
function YouTubeLogo({ height = 22 }) {
  return (
    <svg height={height} viewBox="0 0 90 20" aria-label="YouTube" role="img" style={{ display: 'block' }}>
      <path fill="#FF0000" d="M27.97 3.12A3.57 3.57 0 0 0 25.45.6C23.23 0 14.32 0 14.32 0S5.41 0 3.19.6A3.57 3.57 0 0 0 .67 3.12C.07 5.35.07 10 .07 10s0 4.65.6 6.88a3.57 3.57 0 0 0 2.52 2.52c2.22.6 11.13.6 11.13.6s8.91 0 11.13-.6a3.57 3.57 0 0 0 2.52-2.52c.6-2.23.6-6.88.6-6.88s0-4.65-.6-6.88z"/>
      <path fill="#fff" d="M11.48 14.29 18.88 10l-7.4-4.29z"/>
      <path fill="currentColor" d="M41.6 18.16c-.56-.38-.96-.97-1.2-1.77-.23-.8-.35-1.87-.35-3.2v-1.81c0-1.34.13-2.42.4-3.24.27-.81.69-1.4 1.26-1.77.57-.37 1.32-.55 2.25-.55.91 0 1.65.19 2.2.56.55.38.96.97 1.21 1.77.26.8.39 1.88.39 3.23v1.81c0 1.33-.13 2.4-.38 3.2-.25.8-.66 1.4-1.21 1.77-.56.38-1.31.56-2.26.56-.98 0-1.75-.19-2.31-.56zm3.13-1.96c.16-.4.23-1.06.23-1.97v-3.85c0-.88-.08-1.53-.23-1.94a.83.83 0 0 0-.82-.61c-.39 0-.66.2-.81.61-.15.41-.23 1.06-.23 1.94v3.85c0 .91.07 1.57.22 1.97.15.41.42.61.82.61.4 0 .67-.2.82-.61zM85.13 13.22v.63l.04 1.8c.03.4.09.7.19.88.1.19.26.28.47.28.29 0 .49-.11.6-.34.11-.22.17-.6.18-1.12l2.53.15c.02.11.02.27.02.47 0 1.15-.31 2-.94 2.57-.63.56-1.51.85-2.66.85-1.38 0-2.35-.44-2.9-1.3-.56-.86-.83-2.2-.83-4.01v-2.17c0-1.86.29-3.22.86-4.08.57-.85 1.56-1.28 2.96-1.28.97 0 1.71.18 2.23.53.52.36.88.91 1.1 1.66.2.75.31 1.79.31 3.11v2.13h-4.16zm.37-5.24c-.1.18-.16.47-.19.87-.03.4-.04 1.01-.04 1.83v.9h1.8v-.9c0-.81-.02-1.42-.05-1.83-.03-.4-.1-.7-.2-.88a.55.55 0 0 0-.51-.26.53.53 0 0 0-.51.27zM36.38 12.96 33.04 .89h2.91l1.17 5.47c.3 1.35.52 2.5.66 3.45h.09c.1-.68.32-1.82.66-3.43L39.74.89h2.91l-3.38 12.07v5.79h-2.89v-5.79zM57.5 6.35v12.4h-2.29l-.26-1.59h-.06c-.62 1.2-1.56 1.8-2.8 1.8-.87 0-1.51-.28-1.92-.85-.41-.57-.62-1.46-.62-2.67V6.35h2.93v8.93c0 .58.06.99.19 1.24.13.24.34.37.64.37.26 0 .5-.08.74-.24.24-.16.41-.36.52-.6V6.35h2.93zM72.53 6.35v12.4h-2.29l-.26-1.59h-.06c-.62 1.2-1.56 1.8-2.8 1.8-.87 0-1.51-.28-1.92-.85-.41-.57-.62-1.46-.62-2.67V6.35h2.93v8.93c0 .58.06.99.19 1.24.13.24.34.37.64.37.26 0 .5-.08.74-.24.24-.16.41-.36.52-.6V6.35h2.93zM65.46 3.26h-2.91v15.49h-2.86V3.26h-2.91V.89h8.68v2.37zM81.48 8.44c-.18-.82-.46-1.42-.86-1.79-.39-.37-.94-.55-1.63-.55-.54 0-1.04.15-1.5.45-.47.3-.83.7-1.08 1.19h-.02V.24h-2.83v18.51h2.42l.3-1.23h.06c.23.44.57.78 1.02 1.04.46.25.96.38 1.52.38 1 0 1.74-.46 2.21-1.38.47-.93.71-2.37.71-4.33v-2.08c0-1.48-.09-2.63-.32-3.45zm-2.69 5.36c0 .96-.04 1.71-.12 2.25-.08.55-.21.94-.4 1.17-.19.23-.44.35-.75.35a1.2 1.2 0 0 1-.57-.14 1.06 1.06 0 0 1-.42-.42V9.36c.07-.26.2-.48.38-.65.18-.17.38-.25.59-.25.3 0 .53.12.7.35.16.24.28.64.34 1.2.06.56.09 1.36.09 2.4v1.39z"/>
    </svg>
  );
}

export default function DemoVideoSection() {
  const { t } = useTranslation();
  // Click-to-load: the iframe is only mounted once the visitor asks for it, so
  // the homepage does not pull YouTube's player on every visit.
  const [playing, setPlaying] = useState(false);

  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', letterSpacing: '-.025em', margin: 0, color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.demo.title')}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="fm-demo-card"
        style={{
          position: 'relative', maxWidth: '820px', margin: '0 auto', width: '100%',
          aspectRatio: '16 / 9', borderRadius: '22px', overflow: 'hidden',
          border: '1px solid var(--fm-border)', background: '#000',
          boxShadow: '0 28px 64px -26px rgba(108,92,246,.55)',
        }}
      >
        <style>{`
          .fm-demo-card .fm-demo-play { transition: transform .2s ease, filter .2s ease; }
          .fm-demo-trigger:hover .fm-demo-play, .fm-demo-trigger:focus-visible .fm-demo-play { transform: scale(1.08); filter: brightness(1.1); }
        `}</style>

        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            title={t('home.demo.title')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            className="fm-demo-trigger"
            onClick={() => setPlaying(true)}
            aria-label={t('home.demo.cta')}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0,
              border: 0, cursor: 'pointer', background: 'transparent', display: 'block',
            }}
          >
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

            <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {/* YouTube play button */}
              <svg className="fm-demo-play" width="clamp(68px,10vw,92px)" height="64" viewBox="0 0 68 48" style={{ width: 'clamp(68px,10vw,92px)', height: 'auto', filter: 'drop-shadow(0 10px 26px rgba(0,0,0,.5))' }} aria-hidden="true">
                <path fill="#FF0000" d="M66.52 7.74a8.57 8.57 0 0 0-6.03-6.06C55.16.24 34 .24 34 .24s-21.16 0-26.49 1.44a8.57 8.57 0 0 0-6.03 6.06C.05 13.09.05 24 .05 24s0 10.91 1.43 16.26a8.57 8.57 0 0 0 6.03 6.06C12.84 47.76 34 47.76 34 47.76s21.16 0 26.49-1.44a8.57 8.57 0 0 0 6.03-6.06C67.95 34.91 67.95 24 67.95 24s0-10.91-1.43-16.26z"/>
                <path fill="#fff" d="M27.2 34.29 44.79 24 27.2 13.71z"/>
              </svg>
              <span style={{ color: '#fff' }}>
                <YouTubeLogo height={20} />
              </span>
            </span>
          </button>
        )}
      </motion.div>

      {/* Fallback for anyone who cannot use the embed */}
      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
        <a href={DEMO_VIDEO_URL} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--fm-text-5)', textDecoration: 'underline' }}>
          {t('home.demo.cta')}
        </a>
      </p>
    </section>
  );
}
