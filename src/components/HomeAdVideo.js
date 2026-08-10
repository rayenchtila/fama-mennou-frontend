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

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const ROTATE_MS = 5000;

function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
}

export default function HomeAdVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [idx, setIdx] = useState(0);
  const videoRefs = useRef([]);

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
    if (ads.length < 2) return undefined;
    const id = setInterval(() => setIdx(i => (i + 1) % ads.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [ads.length]);

  // Drive playback imperatively so only one element is ever playing, and so a
  // video restarts from the beginning each time it comes back around.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === idx) {
        v.currentTime = 0;
        // Autoplay can still be refused (data saver, reduced motion); the
        // poster frame remains, which is an acceptable degradation.
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });

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
  }, [idx, ads.length]);

  if (!ads.length) return null;

  const current = ads[idx];
  const email = current.profile_email;
  const name  = current.profile_name || email;
  const goToProfile = () => { if (email) navigate(`/profile/${encodeURIComponent(email)}`); };

  return (
    <div data-testid="home-ad" style={{ maxWidth: 560, margin: '0 auto 34px', width: '100%' }}>
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16 / 9',
        borderRadius: 18, overflow: 'hidden',
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
            muted
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
    </div>
  );
}
