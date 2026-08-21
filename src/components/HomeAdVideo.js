// Homepage promotional video ("Publicité").
//
// Renders whatever campaigns are live today, directly under the hero subtitle.
// The server already filters by date and paused state, so this component never
// has to reason about scheduling — an expired or paused campaign simply stops
// arriving. When nothing is live the API returns [] and this renders nothing.
//
// PLAYBACK NOTES
//   * muted + playsInline + autoPlay is the only combination browsers allow to
//     start without a user gesture. Dropping `muted` silently breaks autoplay
//     on every modern browser, so it is not optional.
//   * Every video stays mounted and only the active one is visible and
//     playing. Unmounting on each switch would re-fetch the file every five
//     seconds; keeping them mounted lets the browser reuse what it buffered
//     and makes the crossfade a plain opacity transition.
//   * Exactly one video plays at a time: the effect below pauses every other
//     element whenever the index changes.
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cldImg, cldVideo } from '../utils/cloudinary';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

// How much of each campaign is shown when several are live. Measured in the
// clip's own playback time, so it is five seconds of video rather than five
// seconds of wall clock.
const SEGMENT_SECONDS = 5;
// If a clip cannot decode at all, move on rather than freezing the rotation.
const STALL_GRACE_MS = 3000;

function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
}

export default function HomeAdVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [idx, setIdx] = useState(0);
  // The campaign being watched in full, or null. Opening it suspends the
  // rotation entirely: the teaser loop is a preview, and it must not keep
  // running (or keep a second video playing) behind someone actually watching.
  const [watching, setWatching] = useState(null);
  useBodyScrollLock(!!watching);
  // Teasers MUST start muted — every browser refuses to autoplay a video with
  // sound, and an unmuted autoplay simply never starts. The toggle below is the
  // user gesture that makes sound legal, and the choice then applies to every
  // clip in the rotation, not just the one that was on screen.
  const [teaserMuted, setTeaserMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const videoRefs = useRef([]);
  const fullRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/advertisements/active`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (!cancelled && Array.isArray(d)) setAds(d); })
      .catch(() => { /* homepage must render fine with no ads */ });
    return () => { cancelled = true; };
  }, []);

  // Rotate only when there is something to rotate between. With a single
  // campaign this interval is never created, so the one video just loops.
  useEffect(() => {
    if (ads.length < 2 || watching) return undefined;
    const v = videoRefs.current[idx];
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      setIdx(i => (i + 1) % ads.length);
    };

    // Driven by the clip's OWN playback position, not a wall-clock timer.
    // A wall-clock interval measures how long the slot lasted, not how much
    // video was seen: a clip that stalls while buffering keeps the timer
    // running and gets cut early — measured as little as 2.55s of content in
    // a 5s slot. Watching currentTime means every campaign shows its first
    // five seconds however slow the network is.
    let prev = 0;
    const onTime = () => {
      const t = v.currentTime;
      // A clip shorter than the segment loops instead of reaching 5s; the
      // playhead jumping backwards means it has just played in full.
      if (t < prev - 0.25) { advance(); return; }
      prev = t;
      if (t >= SEGMENT_SECONDS) advance();
    };

    v?.addEventListener('timeupdate', onTime);

    // Safety net: a clip that never decodes at all would otherwise freeze the
    // rotation on a black frame forever.
    const stallCap = setTimeout(advance, SEGMENT_SECONDS * 1000 + STALL_GRACE_MS);

    return () => {
      v?.removeEventListener('timeupdate', onTime);
      clearTimeout(stallCap);
    };
  }, [idx, ads.length, watching]);

  // Drive playback imperatively so only one element is ever playing, and so a
  // video restarts from the beginning each time it comes back around.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      // While the full video is open, every teaser is silenced — otherwise two
      // soundtracks would overlap and the preview would keep burning bandwidth
      // behind the viewer.
      if (watching) { v.pause(); return; }
      if (i === idx) {
        v.currentTime = 0;
        // Autoplay can still be refused (data saver, reduced motion); the
        // poster frame remains, which is an acceptable degradation.
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    if (watching) return;

    // Warm the NEXT clip while the current one is on screen. Each clip only
    // gets a five-second window, so one that starts buffering at the moment it
    // becomes visible burns part of its own slot and shows less than its first
    // five seconds — measured at 3.3s of content in a 5s slot before this.
    // Loading it a slot early means it is decodable the instant it is shown.
    if (ads.length > 1) {
      const next = videoRefs.current[(idx + 1) % ads.length];
      // readyState < HAVE_FUTURE_DATA means it could not play through yet.
      if (next && next.readyState < 3) next.load();
    }
  }, [idx, ads.length, watching]);

  // Mute state is applied imperatively to every clip: React sets `muted` as a
  // property only on first mount, so a re-render alone would leave already
  // mounted <video> elements at their original state.
  useEffect(() => {
    videoRefs.current.forEach(v => { if (v) v.muted = teaserMuted; });
  }, [teaserMuted, ads.length]);

  // Keep the chosen speed applied — including after entering fullscreen, which
  // does not recreate the element but does re-run this on reopen.
  useEffect(() => {
    if (fullRef.current) fullRef.current.playbackRate = speed;
  }, [speed, watching]);

  // Escape closes the viewer, and the page behind it must not scroll while it
  // is open — both are what people expect of a lightbox, and without them the
  // only way out on mobile is the browser's back button.
  useEffect(() => {
    if (!watching) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setWatching(null); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [watching]);

  if (!ads.length) return null;

  const current = ads[idx];
  const email = current.profile_email;
  const name  = current.profile_name || email;
  const goToProfile = () => { if (email) navigate(`/profile/${encodeURIComponent(email)}`); };

  return (
    <div data-testid="home-ad" style={{ maxWidth: 560, margin: '0 auto 34px', width: '100%' }}>
      {/* The teaser is a button: clicking whichever clip is on screen opens it
          in full. Keyboard users get the same affordance for free. */}
      <div
        role="button"
        tabIndex={0}
        data-testid="home-ad-open"
        aria-label={t('home.ad.watch_full')}
        onClick={() => setWatching(current)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWatching(current); } }}
        style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
          border: '1px solid var(--fm-border)', background: 'var(--fm-surface-hover)',
        }}>
        {ads.map((ad, i) => (
          <video
            key={ad.id}
            ref={el => { videoRefs.current[i] = el; }}
            data-testid="home-ad-video"
            // cldVideo, not the raw URL: the stored URL points at the ORIGINAL
            // upload, and a video recorded on a phone is usually HEVC/H.265,
            // which Chrome cannot decode — it renders a broken frame that never
            // plays. f_auto,q_auto,vc_auto makes Cloudinary transcode to a codec
            // the requesting browser actually supports. Same helper the course
            // player and the admin course preview already use.
            src={cldVideo(ad.video_url)}
            muted={teaserMuted}
            playsInline
            loop
            autoPlay={i === 0}
            // Every clip is fetched eagerly, not just the first. With a five
            // second slot each, a clip that only has metadata when its turn
            // arrives spends part of that slot buffering and shows less than
            // its first five seconds. Ads are short, so the extra fetch is
            // cheaper than a visibly truncated rotation.
            preload="auto"
            aria-hidden={i !== idx}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: i === idx ? 1 : 0,
              transition: 'opacity .6s ease',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Sound toggle. stopPropagation so muting does not also open the full
            viewer — they are two different intents on the same surface. */}
        <button
          type="button"
          data-testid="home-ad-mute"
          aria-label={teaserMuted ? t('home.ad.unmute') : t('home.ad.mute')}
          aria-pressed={!teaserMuted}
          onClick={e => { e.stopPropagation(); setTeaserMuted(m => !m); }}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,.4)', background: 'rgba(0,0,0,.5)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {teaserMuted ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>
            </svg>
          )}
        </button>

        {/* Play affordance — without it nothing signals the teaser is clickable */}
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{
            width: 54, height: 54, borderRadius: '50%',
            background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,.75)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" style={{ marginLeft: 3 }}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          </span>
        </span>

        {/* Progress pips, only meaningful with more than one campaign */}
        {ads.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {ads.map((ad, i) => (
              <span key={ad.id} style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'width .3s ease, background .3s ease',
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Advertised profile — clicking anywhere opens their public profile */}
      <button
        type="button"
        onClick={goToProfile}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%',
          marginTop: 12, padding: '10px 13px', borderRadius: 14,
          border: '1px solid var(--fm-border)', background: 'var(--fm-surface-hover)',
          cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--fm-primary-light)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--fm-border)'; }}
      >
        {current.profile_photo ? (
          <img
            src={cldImg(current.profile_photo)}
            alt={name}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span style={{
            width: 40, height: 40, borderRadius: '50%', flex: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', color: '#fff',
            fontWeight: 700, fontSize: 14,
          }}>{initials(current.profile_name)}</span>
        )}

        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fm-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
            {current.profile_verified && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fm-primary-light)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </span>
          {current.profile_title && (
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fm-text-5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.profile_title}
            </span>
          )}
        </span>

        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fm-text-6)', flex: 'none' }}>
          {t('home.ad.sponsored')}
        </span>
      </button>

      {/* ── Full video viewer ────────────────────────────────────────────────
          A lightbox rather than a route: closing it returns to exactly the
          homepage state that was already there, so the rotation simply picks
          up again with no reload and no lost scroll position. */}
      {watching && (
        <div
          data-testid="home-ad-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={watching.profile_name || t('home.ad.watch_full')}
          onClick={() => setWatching(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            // Clicks inside the player must not reach the backdrop's close
            // handler, or scrubbing the timeline would dismiss the video.
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 900 }}
          >
            <video
              data-testid="home-ad-full"
              ref={fullRef}
              src={cldVideo(watching.video_url)}
              controls
              // Native controls carry volume, fullscreen and the browser's own
              // speed menu, and they keep working once fullscreen is entered —
              // a custom overlay would disappear at that moment, which is why
              // playback is left to them rather than reimplemented.
              controlsList="nodownload"
              autoPlay
              playsInline
              onLoadedMetadata={e => { e.currentTarget.playbackRate = speed; }}
              // Deliberately NOT muted and NOT looping: this is the full
              // viewing experience, and the click that opened it is the user
              // gesture browsers require before allowing sound.
              style={{ width: '100%', maxHeight: '80vh', borderRadius: 14, background: '#000', display: 'block' }}
            />

            {/* Explicit speed control: Chrome hides playback speed behind the
                overflow menu and Safari offers none at all, so the one thing
                that is genuinely hard to reach gets a visible control. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {t('home.ad.speed')}
              </span>
              {[0.5, 1, 1.25, 1.5, 2].map(r => (
                <button
                  key={r}
                  type="button"
                  data-testid={`home-ad-speed-${r}`}
                  onClick={() => setSpeed(r)}
                  aria-pressed={speed === r}
                  style={{
                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    border: `1px solid ${speed === r ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.25)'}`,
                    background: speed === r ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.06)',
                    color: '#fff',
                  }}
                >
                  {r}×
                </button>
              ))}
            </div>

            <button
              type="button"
              data-testid="home-ad-close"
              onClick={() => setWatching(null)}
              aria-label={t('home.ad.close')}
              style={{
                position: 'absolute', top: -14, right: -8,
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.75)',
                color: '#fff', cursor: 'pointer', fontSize: 20, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => { setWatching(null); goToProfile(); }}
              style={{
                marginTop: 12, width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}
            >
              {watching.profile_name || watching.profile_email}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
