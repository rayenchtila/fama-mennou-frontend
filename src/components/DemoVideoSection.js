// Official Fama Mennou demo video — homepage.
//
// Clicking the card opens the video on YouTube in a new tab (no inline
// player, no iframe). The poster is YouTube's own thumbnail for this video,
// loaded from i.ytimg.com — allowed by production's CSP img-src (see
// DEPLOYMENT.md; that entry was added alongside this section).
//
// The heading and subtitle sit on the page background and follow the theme
// tokens; the video frame itself stays permanently dark (with white text and
// icons drawn on it), like any video player, in both themes.
import { useTranslation } from 'react-i18next';
import FadeIn from './ds/FadeIn';

const DEMO_VIDEO_ID = 'Ern0_oRKSKE';
const DEMO_VIDEO_URL = `https://youtu.be/${DEMO_VIDEO_ID}`;

export default function DemoVideoSection() {
  const { t } = useTranslation();

  return (
    // This section sits immediately under the hero, which already carries the
    // spacing above it, so it only adds a little top padding of its own.
    <section className="ds ds-wrap relative pt-2 md:pt-4">
      <div className="relative mb-6 text-center md:mb-8">
        <h2 className="text-h-md-m text-ds-ink md:text-h-md">{t('home.demo.title')}</h2>
        <p className="mx-auto mt-2 max-w-md text-b-md text-ds-mute md:text-base">{t('home.demo.sub')}</p>
      </div>

      <FadeIn>
        <a
          href={DEMO_VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('home.demo.cta')} — ${t('home.demo.title')}`}
          className="ds-demo group relative mx-auto block aspect-[4/3] w-full max-w-[56rem] overflow-hidden rounded-[20px] border border-white/10 sm:aspect-video sm:rounded-[22px]"
          style={{ background: '#182236', boxShadow: '0 24px 60px -24px rgba(0,0,0,.6)' }}
        >
          {/* YouTube's own poster frame for this video, shown un-cropped
              (contain) rather than cover — the recording is portrait, so
              cropping to 16:9 would slice most of the on-screen UI out of
              frame. The radial backdrop fills the remaining space. */}
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
            className="absolute inset-0 h-full w-full object-contain"
          />

          {/* Legibility gradient for the badge/CTA strip, clear over the video itself */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0"
            style={{ background: 'rgba(6,9,16,.4)' }} />

          {/* Top-start "recording" badge */}
          <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[rgba(6,9,16,.55)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.04em] text-white backdrop-blur-md sm:start-4 sm:top-4">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t('home.demo.badge')}
          </span>

          {/* Play button with a soft accent glow ring */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="ds-demo-play flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20"
              style={{ background: 'rgba(129,140,248,.2)', boxShadow: '0 0 0 1px rgba(129,140,248,.4), 0 14px 34px -8px rgba(129,140,248,.65)' }}>
              <svg width="32%" height="32%" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="rtl:-scale-x-100">
                <path d="M8 5.5v13l11-6.5-11-6.5z" fill="#fff" />
              </svg>
            </span>
          </span>

          {/* Bottom CTA strip */}
          <span className="absolute inset-x-3.5 bottom-3 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-3.5">
            <span className="text-[13px] font-bold text-white sm:text-[15px]">{t('home.demo.cta')}</span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/75">
              {t('home.demo.cta_sub')}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </span>
        </a>
      </FadeIn>
    </section>
  );
}
