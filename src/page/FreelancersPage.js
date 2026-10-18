import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import NoticeBar from '../components/ds/NoticeBar';
import DirectoryHero from '../components/ds/DirectoryHero';
import DirectoryToolbar from '../components/ds/DirectoryToolbar';
import TrustBand from '../components/ds/TrustBand';
import StatCard from '../components/ds/StatCard';
import Icon from '../components/ds/Icon';
import useLivePoll from '../hooks/useLivePoll';
import useMediaQuery from '../hooks/useMediaQuery';
import { loadFreelancerStats } from '../utils/liveStats';
import { firstWord, getInitials } from '../utils/names';
import { TUNISIAN_REGIONS } from '../utils/regions';
import { normalizeUser } from '../utils/normalizeUser';
import { cldImg } from '../utils/cloudinary';
import SEOHead from '../components/Seohead';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

// Direction (frontend-design skill, steps 1–3): the user's supplied Stitch system
// is the anchor — "Dark Precision Minimalist", an Aurora-family dark canvas with
// indigo/lilac accents. This page follows the supplied Freelancers screen
// closely: depth comes from stacking surface tiers (no hairlines), a ghosted
// illustration sits behind a large title, search is one "matrix" panel, and each
// freelancer is a row with a square avatar and a corner availability pill. The one
// memorable move is the verification glow: the tick on every avatar carries the
// same soft halo as every other "checked" signal on the site. Every figure is
// live from production; no invented guarantees, personas or numbers.

const TINTS = [
  ['rgb(var(--ds-accent))', 'rgb(var(--ds-accent) / .16)'],
  ['#a855f7', 'rgba(168,85,247,.18)'],
  ['#3b82f6', 'rgba(59,130,246,.18)'],
  ['#0ea5e9', 'rgba(14,165,233,.18)'],
  ['rgb(var(--ds-ok))', 'rgb(var(--ds-ok) / .16)'],
  ['rgb(var(--ds-warn))', 'rgb(var(--ds-warn) / .16)'],
  ['#f43f5e', 'rgba(244,63,94,.18)'],
];
const getTint = email => TINTS[(email?.charCodeAt(0) || 0) % TINTS.length];

function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="star" size={size} fill className={i <= Math.round(value) ? 'text-ds-warn' : 'text-ds-line-strong'} />
      ))}
    </span>
  );
}

function StarRow({ value, count }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Stars value={value} />
      <strong className="text-xs font-bold tabular-nums text-ds-ink">{value.toFixed(1)}</strong>
      <span className="text-xs tabular-nums text-ds-faint">({count})</span>
    </span>
  );
}

function AvailabilityPill({ availability, className = '' }) {
  const { t } = useTranslation();
  const tone = availability === 'unavailable' ? 'text-ds-bad' : availability === 'busy' ? 'text-ds-warn' : 'text-ds-ok';
  const label = availability === 'unavailable' ? t('Unavailable') : availability === 'busy' ? t('Busy') : t('Available');
  return (
    <span className={`items-center gap-1.5 rounded-full bg-ds-high px-3 py-1 text-[11px] font-semibold ${tone} ${className}`}>
      <span className="ds-dot ds-dot-live" />{label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FreelancerCard
   ══════════════════════════════════════════════════════════════════ */
function FreelancerCard({ freelancer, reviews, onAddReview, currentUser, completedWith, navigate, verified = true }) {
  const { t } = useTranslation();
  const isWide = useMediaQuery('(min-width: 768px)');
  const [showReview, setShowReview] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(null);   // null = follow the screen size
  const [rating,     setRating]     = useState(0);
  const [hovStar,    setHovStar]    = useState(0);
  const [comment,    setComment]    = useState('');
  const [ratingErr,  setRatingErr]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const key             = freelancer.email?.toLowerCase();
  const myReviews       = reviews[key] || [];
  const avgRating       = myReviews.length > 0 ? myReviews.reduce((s,r) => s + r.rating, 0) / myReviews.length : 0;
  const isOwn           = currentUser?.email?.toLowerCase() === key;
  const isClient        = currentUser?.role === 'client';
  const alreadyReviewed = currentUser && myReviews.some(r => r.clientEmail === currentUser.email?.toLowerCase());
  const hasCompleted    = completedWith?.includes(key);
  const canReview       = isClient && !isOwn && !alreadyReviewed && (hasCompleted || myReviews.length === 0);
  const skillTags       = freelancer.skills ? freelancer.skills.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const memberYear      = freelancer.registeredAt ? new Date(freelancer.registeredAt).getFullYear() : null;
  const [tintFg, tintBg] = getTint(freelancer.email);
  const profileHref     = `/profile/${encodeURIComponent(freelancer.email)}`;
  const reviewsVisible  = reviewsOpen ?? isWide;
  const maxTags         = isWide ? skillTags.length : 4;
  const portfolioHref   = freelancer.portfolio_url
    ? (/^https?:\/\//.test(freelancer.portfolio_url) ? freelancer.portfolio_url : `https://${freelancer.portfolio_url}`)
    : null;

  async function submitReview(e) {
    e.preventDefault();
    if (!rating) { setRatingErr(true); return; }
    if (!comment.trim()) return;
    setSubmitting(true);
    await onAddReview(key, {
      clientName: currentUser.name, clientEmail: currentUser.email?.toLowerCase(),
      rating, comment: comment.trim(), createdAt: new Date().toISOString(),
    });
    setShowReview(false); setRating(0); setComment(''); setRatingErr(false);
    setSubmitting(false);
  }

  return (
    <article className="ds-tonal ds-tonal-hover relative p-5 lg:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-6">

        {/* ── Identity + details ── */}
        <div className="flex min-w-0 flex-1 items-start gap-4 lg:gap-5">
          <Link to={profileHref} className="relative h-16 w-16 flex-none lg:h-20 lg:w-20" aria-label={t('common.view_profile')} title={t('common.view_profile')}>
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl text-xl font-extrabold shadow-sm"
              style={{ background: tintBg, color: tintFg }}>
              {freelancer.photo
                ? <img src={freelancer.photo.startsWith('data:') ? freelancer.photo : cldImg(freelancer.photo)} alt=""
                    className="h-full w-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                : getInitials(freelancer.name)}
            </span>
            {verified && (
              <span className="ds-verified absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4338ca] text-white ring-2 ring-ds-low" aria-hidden="true">
                <Icon name="check" size={13} />
              </span>
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <Link to={profileHref} dir="auto" className="py-0.5 text-[17px] font-bold leading-tight tracking-[-0.01em] text-ds-ink transition-colors hover:text-ds-accent">
                {firstWord(freelancer.name)}
              </Link>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-ds-high px-2 py-0.5 text-[11px] font-semibold text-ds-accent">
                  <Icon name="verified" size={13} /> {t('Verified')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-ds-high px-2 py-0.5 text-[11px] font-semibold text-ds-warn">
                  <Icon name="schedule" size={13} /> {t('fp.pending_badge')}
                </span>
              )}
              {freelancer.region && (
                <span className="inline-flex items-center gap-1 text-[13px] text-ds-mute"><Icon name="location_on" size={14} />{freelancer.region}</span>
              )}
              {memberYear && <span className="text-[13px] text-ds-mute">• {t('fp.member_since', { year: memberYear })}</span>}
              {avgRating > 0 && <StarRow value={avgRating} count={myReviews.length} />}
              <AvailabilityPill availability={freelancer.availability} className="inline-flex lg:hidden" />
            </div>

            {freelancer.title && (
              <h4 dir="auto" className="m-0 mb-2 text-[13px] font-bold uppercase leading-snug tracking-wide text-ds-accent">{freelancer.title}</h4>
            )}

            {freelancer.bio && (
              <p dir="auto" className="m-0 mb-3 line-clamp-3 text-[14px] leading-[1.6] text-ds-mute md:line-clamp-2">{freelancer.bio}</p>
            )}

            {skillTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {skillTags.slice(0, maxTags).map(s => <span key={s} className="ds-tag"><bdi>#{s}</bdi></span>)}
                {skillTags.length > maxTags && <span className="ds-tag">+{skillTags.length - maxTags}</span>}
              </div>
            )}

            {myReviews.length > 0 && (
              <div className="mt-4">
                <button type="button" onClick={() => setReviewsOpen(!reviewsVisible)} aria-expanded={reviewsVisible}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ds-mute transition-colors hover:text-ds-ink">
                  <Icon name="forum" size={16} />
                  {t('fp.reviews', { count: myReviews.length })}
                  <Icon name="expand_more" size={18} className={`transition-transform ${reviewsVisible ? 'rotate-180' : ''}`} />
                </button>
                {reviewsVisible && (
                  <div className="mt-2.5 flex flex-col gap-2">
                    {myReviews.map((r, i) => (
                      <div key={i} className="ds-cell px-3.5 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ds-ink-2">{firstWord(r.clientName) || r.clientName}</span>
                          <Stars value={r.rating} size={13} />
                        </div>
                        <p dir="auto" className="m-0 text-[12.5px] leading-[1.5] text-ds-mute">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showReview && (
              <form onSubmit={submitReview} className="ds-cell mt-4 flex flex-col gap-3 p-4">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-ds-faint">{t('Leave a review')}</p>
                <div>
                  <div role="radiogroup" aria-label={t('Rating')} className="inline-flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button" role="radio" aria-checked={i === rating}
                        aria-label={t('rate_n_stars', { count: i, defaultValue: `${i} star${i > 1 ? 's' : ''}` })}
                        onClick={() => { setRating(i); setRatingErr(false); }}
                        onMouseEnter={() => setHovStar(i)} onMouseLeave={() => setHovStar(0)}
                        onFocus={() => setHovStar(i)} onBlur={() => setHovStar(0)}
                        className="p-0.5 leading-none">
                        <Icon name="star" size={26} fill className={`transition-colors ${i <= (hovStar || rating) ? 'text-ds-warn' : 'text-ds-line-strong'}`} />
                      </button>
                    ))}
                  </div>
                  {ratingErr && <p className="mt-1 text-[11px] text-ds-bad">{t('Please choose a rating.')}</p>}
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t('Your comment…')} rows={3} required
                  className="ds-input resize-none text-[13px]" />
                <div className="flex gap-2.5">
                  <button type="submit" disabled={submitting || !comment.trim()} className="ds-btn ds-btn-accent ds-btn-sm">
                    {submitting ? t('prp.sending') : t('Submit')}
                  </button>
                  <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm"
                    onClick={() => { setShowReview(false); setRating(0); setComment(''); setRatingErr(false); }}>
                    {t('Cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Actions: side by side, as in the supplied screen ── */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-none lg:flex-nowrap lg:justify-end lg:self-center lg:pt-6">
          {portfolioHref && (
            <a href={portfolioHref} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-tonal !rounded-xl flex-1 lg:flex-none">
              <Icon name="open_in_new" size={16} />{t('View portfolio')}
            </a>
          )}

          {isOwn ? (
            <Link to="/dashboard?tab=profile" className="ds-btn ds-btn-accent !rounded-xl flex-1 lg:flex-none">
              <Icon name="edit" size={16} />{t('Edit profile')}
            </Link>
          ) : currentUser ? (
            <button type="button" onClick={() => navigate(`/messages?with=${encodeURIComponent(freelancer.email)}`)}
              className="ds-btn ds-btn-accent !rounded-xl flex-1 lg:flex-none">
              {t('fp.contact')}
            </button>
          ) : (
            <Link to={profileHref} className="ds-btn ds-btn-accent !rounded-xl flex-1 lg:flex-none">
              {t('common.view_profile')}
            </Link>
          )}

          {canReview && !showReview && (
            <button type="button" onClick={() => setShowReview(true)}
              className="ds-btn !rounded-xl flex-1 bg-ds-warn/10 text-ds-warn hover:bg-ds-warn/15 lg:flex-none">
              <Icon name="star" size={16} fill />{t('Leave a review')}
            </button>
          )}
        </div>
      </div>

      {/* Availability: the corner pill of the supplied screen (inline on a phone) */}
      <AvailabilityPill availability={freelancer.availability} className="absolute end-4 top-4 hidden lg:inline-flex" />
    </article>
  );
}

function SkeletonRow() {
  return <div className="ds-tonal ds-skeleton h-[170px]" aria-hidden="true" />;
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function FreelancersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [searchParams]     = useSearchParams();
  const [search,    setSearch]    = useState(searchParams.get('q') || '');
  const [debSearch, setDebSearch] = useState(searchParams.get('q') || '');
  const [category,  setCategory]  = useState('All');
  const [region,    setRegion]    = useState('');
  const [sortBy,    setSortBy]    = useState('rating');
  const [reviews,   setReviews]   = useState({});
  const [completedWith, setCompletedWith] = useState([]);

  // The directory itself now comes from a dedicated, paginated, server-
  // filtered endpoint (GET /users/public/freelancers) instead of the global
  // AuthContext `users` map — that map has to stay the FULL unpaginated
  // directory for other features (chat, admin, profile lookups), so this
  // page can't paginate it client-side without breaking those.
  const PAGE_SIZE = 10;
  const [freelancers, setFreelancers] = useState([]);
  const [total,       setTotal]       = useState(null);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [listLoading, setListLoading] = useState(true);

  // A freelancer who has just completed their profile is sent here by the dashboard with a flag in the router
  // state. It is read once and removed from the history entry, so a reload or the Back button never replays it.
  // While it is set, their own card is pinned above the directory (it is not a search result: filters and paging
  // leave it alone) and is left out of the rows below so it never shows twice.
  const [justCompleted, setJustCompleted] = useState(false);
  const ownBannerRef = useRef(null);
  useEffect(() => {
    if (!location.state?.profileCompleted) return;
    setJustCompleted(true);
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [location, navigate]);

  const ownEmail    = user?.email?.toLowerCase();
  const showOwn     = justCompleted && user?.role === 'freelancer';
  const ownVerified = user?.cinStatus === 'approved';
  const own = useMemo(() => (showOwn ? {
    email: user.email, name: user.name, photo: user.photo, title: user.title, bio: user.bio,
    skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
    region: user.region, availability: user.availability, registeredAt: user.registeredAt,
    portfolio_url: user.portfolio_url,
  } : null), [showOwn, user]);

  // Bring the confirmation and the card into view — the hero above them is tall.
  useEffect(() => {
    if (!showOwn) return undefined;
    const id = setTimeout(() => ownBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(id);
  }, [showOwn]);

  // Site-wide counters: loaded from the public stats endpoint, refreshed while
  // the page stays open, so the figures rise and fall with production data.
  const { data: stats, loading: statsLoading } = useLivePoll(loadFreelancerStats);

  useEffect(() => {
    const tmr = setTimeout(() => setDebSearch(search), 320);
    return () => clearTimeout(tmr);
  }, [search]);

  // Any filter change invalidates the current page — start back at page 1.
  useEffect(() => { setPage(1); }, [debSearch, category, sortBy, region]);

  const fetchFreelancers = useCallback(async () => {
    setListLoading(true);
    try {
      const p = new URLSearchParams({ sort: sortBy, page: String(page), limit: String(PAGE_SIZE) });
      const text = debSearch.trim();
      // `region` is filtered server-side. A backend that predates that parameter
      // ignores it, so with no text query the region name is also sent as the search
      // term — the directory search already matches the region column — and the
      // filter keeps working until the backend is updated.
      if (text) p.set('search', text); else if (region) p.set('search', region);
      if (region)              p.set('region', region);
      if (category !== 'All')  p.set('category', category);
      const url = `${API}/users/public/freelancers?${p}`;
      let d = await fetch(url).then(r => r.json());
      // A transient 429/500 (e.g. right as Neon wakes from an idle suspend)
      // returns a non-array error body — retry once instead of silently
      // showing "no freelancers" for a request that never actually succeeded.
      if (!d || !Array.isArray(d.rows)) {
        await new Promise(res => setTimeout(res, 2000));
        d = await fetch(url).then(r => r.json());
      }
      if (d && Array.isArray(d.rows)) {
        setFreelancers(d.rows.map(r => normalizeUser(r, false)));
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      }
    } catch { /* leave existing freelancers in place rather than wiping to empty */ }
    finally { setListLoading(false); }
  }, [debSearch, category, sortBy, page, region]);

  useEffect(() => { fetchFreelancers(); }, [fetchFreelancers]);

  const fetchReviews = useCallback(async () => {
    const emails = [...new Set([...freelancers.map(u => u.email), ...(showOwn ? [user.email] : [])])];
    if (!emails.length) return;
    try {
      const results = await Promise.all(
        emails.map(email => fetch(`${API}/reviews/${encodeURIComponent(email)}`).then(r=>r.json()).catch(()=>[]))
      );
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i]||[]).map(r => ({
          clientName: r.client_name, clientEmail: r.client_email,
          rating: r.rating, comment: r.comment,
        }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancers, showOwn]);

  const fetchCompleted = useCallback(async () => {
    if (!user || user.role !== 'client') return;
    try {
      const res  = await fetch(`${API}/tasks/${encodeURIComponent(user.email.toLowerCase())}`);
      const data = await res.json();
      if (Array.isArray(data)) setCompletedWith(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchReviews(); },   [fetchReviews]);
  useEffect(() => { fetchCompleted(); }, [fetchCompleted]);

  async function handleAddReview(freelancerEmail, review) {
    try {
      await fetch(`${API}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerEmail, clientEmail: review.clientEmail, clientName: review.clientName, rating: review.rating, comment: review.comment }),
      });
      fetchReviews();
    } catch {}
  }

  const rows = showOwn ? freelancers.filter(f => f.email?.toLowerCase() !== ownEmail) : freelancers;
  const filtersActive = !!(debSearch.trim() || region || category !== 'All');

  const sortOptions = [
    { value: 'rating',    label: t('Top rated') },
    { value: 'newest',    label: t('Newest') },
    { value: 'available', label: t('fp.sort_available') },
    { value: 'reviews',   label: t('Most reviews') },
    { value: 'name',      label: t('A → Z') },
  ];

  return (
    <div className="ds relative min-h-screen bg-ds-canvas pt-[66px] text-ds-ink">
      <SEOHead
        title="Freelancers en Tunisie"
        url="/freelancers"
        description="Trouvez les meilleurs freelancers tunisiens : développeurs, designers, marketeurs et plus. Contactez directement les talents vérifiés sur FamaMennou."
        keywords="freelancer tunisie, développeur freelance, designer freelance, trouver freelancer, talent tunisien, mission freelance"
      />

      <NoticeBar title={t('ds.pay_notice_title')} to="/help" cta={t('ds.learn_more')}>{t('ds.pay_notice_text')}</NoticeBar>

      <DirectoryHero
        title={t('Hire a freelancer')}
        subtitle={t('fp.page_sub')}
        search={search} onSearch={setSearch} onSubmit={() => setDebSearch(search)}
        placeholder={t('fp.search_ph')}
        region={{ value: region, onChange: setRegion, options: TUNISIAN_REGIONS, allLabel: t('fp.all_regions'), label: t('fp.region') }}
        filterLabel={t('fp.filter_btn')}
        stats={[
          <StatCard key="v" variant="tonal" value={stats?.verified} label={t('Verified freelancers')} loading={statsLoading} accent />,
          <StatCard key="r" variant="tonal" value={stats?.regions}  label={t('Regions covered')}      loading={statsLoading} />,
          <StatCard key="rv" variant="tonal" value={stats?.reviews} label={t('Reviews received')}     loading={statsLoading} />,
          <StatCard key="m" variant="tonal" value={total}           label={t('Matching now')}         loading={listLoading} />,
        ]}
      />

      {/* ── Directory ── */}
      <section className="w-full pb-14">
        <div className="ds-wrap">
          {showOwn && own && (
            <section ref={ownBannerRef} aria-label={t('fp.own_title')} className="mb-8 scroll-mt-24" data-testid="own-profile">
              <div role="status" className="ds-tonal mb-3 flex items-start gap-3.5 p-4 lg:p-5">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${ownVerified ? 'ds-verified bg-ds-ok text-white' : 'bg-ds-high text-ds-warn'}`} aria-hidden="true">
                  <Icon name={ownVerified ? 'check' : 'schedule'} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-extrabold text-ds-ink">{t(ownVerified ? 'fp.own_live_title' : 'fp.own_pending_title')}</p>
                  <p className="mb-0 mt-1 text-[13px] leading-relaxed text-ds-mute">{t(ownVerified ? 'fp.own_live_text' : 'fp.own_pending_text')}</p>
                </div>
                <button type="button" onClick={() => setJustCompleted(false)} aria-label={t('fp.own_dismiss')}
                  className="ds-btn ds-btn-ghost ds-btn-sm !px-2">
                  <Icon name="close" size={18} />
                </button>
              </div>
              <FreelancerCard
                freelancer={own}
                reviews={reviews}
                onAddReview={handleAddReview}
                currentUser={user}
                completedWith={completedWith}
                navigate={navigate}
                verified={ownVerified}
              />
            </section>
          )}

          <DirectoryToolbar
            category={category} onCategory={setCategory} allCount={stats?.verified}
            sortValue={sortBy} onSort={setSortBy} sortOptions={sortOptions}
            count={total} countLabel={t('Freelancers').toLowerCase()}
          />

          {/* key={page}: a fresh key on every page change makes AnimatePresence
              smoothly cross-fade the list in, instead of it snapping instantly
              — old data stays on screen (no spinner flash) until it does. */}
          <AnimatePresence mode="wait">
            <motion.div key={page}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              transition={{ duration:0.25, ease:'easeOut' }}
              className="flex flex-col gap-4 lg:gap-5">
              {listLoading && freelancers.length === 0 ? (
                [0, 1, 2].map(i => <SkeletonRow key={i} />)
              ) : rows.length === 0 && !(showOwn && !filtersActive) ? (
                <div className="ds-tonal px-5 py-16 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-high text-ds-accent">
                    <Icon name="search_off" size={26} />
                  </span>
                  <p className="m-0 text-[15px] font-extrabold text-ds-ink-2">{t('No freelancers found')}</p>
                  <p className="mb-5 mt-1.5 text-[13px] text-ds-mute">{t('Try a different search or category.')}</p>
                  {(search || region) && (
                    <button type="button" onClick={() => { setSearch(''); setRegion(''); }} className="ds-btn ds-btn-tonal ds-btn-sm">{t('Clear search')}</button>
                  )}
                </div>
              ) : rows.map(f => (
                <FreelancerCard
                  key={f.email}
                  freelancer={f}
                  reviews={reviews}
                  onAddReview={handleAddReview}
                  currentUser={user}
                  completedWith={completedWith}
                  navigate={navigate}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <Pagination page={page} totalPages={totalPages} total={total || 0} limit={PAGE_SIZE}
            onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            loading={listLoading} itemLabel={t('Freelancers').toLowerCase()} />
        </div>
      </section>

      <TrustBand items={[
        { icon: 'payments', title: t('fp.trust1.title'), text: t('fp.trust1.text') },
        { icon: 'badge',    title: t('fp.trust2.title'), text: t('fp.trust2.text') },
        { icon: 'forum',    title: t('fp.trust3.title'), text: t('fp.trust3.text') },
      ]} />
    </div>
  );
}
