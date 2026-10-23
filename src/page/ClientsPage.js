import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import ModalShell, { FieldLabel } from '../components/ds/ModalShell';
import useLivePoll from '../hooks/useLivePoll';
import { loadProjectStats, loadProjectsTotal } from '../utils/liveStats';
import { TUNISIAN_REGIONS } from '../utils/regions';
import { firstWord, getInitials } from '../utils/names';
import { timeAgo } from '../utils/relativeTime';
import { budgetLabel } from '../utils/budget';
import { cldImg } from '../utils/cloudinary';
import SEOHead from '../components/Seohead';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import ShareButton from '../components/ShareMenu';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

// Direction (frontend-design skill, steps 1–3): the same anchor as the Freelancers
// page — the user's supplied Stitch system, "Dark Precision Minimalist", an
// Aurora-family dark canvas with indigo/lilac accents — applied to the supplied
// Find-Clients screen: a payment note, a large title, one search "matrix"
// (keywords · region · action), four live figures, a boxed toolbar and then one
// full-width row per project. Depth comes from stacked surface tiers rather than
// hairlines. Every figure is live from production; the facts on a row (duration,
// experience, applications) are the project's own fields.

const PERIOD_OPTIONS = ['De 1 à 3 jours','De 4 à 7 jours','De 1 à 2 semaines','De 2 à 4 semaines','De 1 à 3 mois','Plus de 3 mois'];
const PERIOD_DAYS    = {'De 1 à 3 jours':2,'De 4 à 7 jours':5,'De 1 à 2 semaines':10,'De 2 à 4 semaines':21,'De 1 à 3 mois':60,'Plus de 3 mois':90};

const TINTS = [
  ['#818cf8','rgba(129,140,248,0.18)'], ['#6366f1','rgba(99,102,241,0.18)'],
  ['#10b981','rgba(16,185,129,0.18)'],  ['#f59e0b','rgba(245,158,11,0.18)'],
  ['#ec4899','rgba(236,72,153,0.18)'],  ['#8b5cf6','rgba(139,92,246,0.18)'],
  ['#06b6d4','rgba(6,182,212,0.18)'],   ['#f97316','rgba(249,115,22,0.18)'],
];
const getTint = s => TINTS[((s||'').charCodeAt(0)||0) % TINTS.length];

/* ── Period dropdown (custom, so the "too long" options can be disabled) ── */
function PeriodSelect({ value, onChange, maxDays }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`ds-input flex items-center justify-between text-start text-[14px] ${value ? '' : '!text-ds-faint'}`}
        style={open ? { borderColor: 'rgb(var(--ds-accent))' } : undefined}>
        <span>{value || t('prp.period_select')}</span>
        <Icon name="expand_more" size={20} className={`ms-2 flex-none text-ds-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="ds-pop absolute inset-x-0 top-[calc(100%+6px)] z-[600] overflow-hidden">
          {PERIOD_OPTIONS.map(o => {
            const tooLong = maxDays !== undefined && (PERIOD_DAYS[o] || 0) > maxDays;
            return (
              <button key={o} type="button" role="option" aria-selected={value === o} disabled={tooLong}
                onMouseDown={() => { if (!tooLong) { onChange(o); setOpen(false); } }}
                className={`ds-menuitem !justify-between !px-3.5 !py-2.5 text-[13.5px] ${value === o ? '!text-ds-accent font-bold' : ''} ${tooLong ? 'cursor-not-allowed opacity-50' : ''}`}>
                <span>{o}</span>
                {tooLong && <span className="ms-2 flex-none rounded-md bg-ds-bad/10 px-1.5 py-0.5 text-[10px] font-bold text-ds-bad">{t('prp.too_long')}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Apply Modal ── */
function ApplyModal({ project, user, onClose, onDone }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  useBodyScrollLock(true); // this component only exists while the modal is open
  const [period,    setPeriod]    = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [letter,    setLetter]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');
  const expiredTimer = useRef(null);
  useEffect(() => () => { if (expiredTimer.current) clearTimeout(expiredTimer.current); }, []);

  const clientMaxDays = PERIOD_DAYS[project.period]; // undefined if project has no period

  async function submit(e) {
    e.preventDefault();
    if (!period)    { setErr(t('prp.err_period')); return; }
    if (!portfolio) { setErr(t('prp.err_portfolio')); return; }
    if (clientMaxDays !== undefined && (PERIOD_DAYS[period] || 0) > clientMaxDays) {
      setErr(t('prp.err_period_too_long', { period: project.period }));
      return;
    }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, freelancerEmail: user.email, price: 1, deliveryDays: PERIOD_DAYS[period]||1, coverLetter: portfolio ? `[portfolio:${portfolio}]\n${letter}` : letter }),
      });
      const d = await res.json().catch(() => ({}));
      // Session/token dead server-side: never show the raw backend error.
      // Logging out flips `user` to null, which PrivateRoute (App.js) picks
      // up on its own to reopen the login modal and remember this page as
      // the post-login redirect target — no new plumbing needed here.
      if (res.status === 401) {
        setErr(t('prp.err_session_expired'));
        expiredTimer.current = setTimeout(logout, 1800);
        return;
      }
      if (!res.ok || d.error) { setErr(d.error || t('prp.err_already_applied')); return; }
      onDone();
    } catch { setErr(t('clp.server_unreachable')); }
    finally { setLoading(false); }
  }

  return (
    <ModalShell onClose={onClose} labelledBy="apply-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ds-accent">{t('clp.apply_to_project')}</p>
          <h3 id="apply-title" className="m-0 text-[17px] font-extrabold leading-[1.3] text-ds-ink">{project.title}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label={t('Cancel')} className="ds-iconbtn ds-iconbtn-boxed"><Icon name="close" size={20} /></button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <FieldLabel required extra={clientMaxDays !== undefined && (
            <span className="rounded-md border border-ds-warn/25 bg-ds-warn/10 px-2 py-0.5 text-[10px] font-bold text-ds-warn">{t('prp.max', { period: project.period })}</span>
          )}>{t('prp.delivery_period')}</FieldLabel>
          <PeriodSelect value={period} onChange={setPeriod} maxDays={clientMaxDays} />
        </div>
        <div>
          <FieldLabel required>{t('prp.portfolio_link')}</FieldLabel>
          <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://monportfolio.com" className="ds-input text-[14px]" />
        </div>
        <div>
          <FieldLabel>{t('prp.cover_letter')}</FieldLabel>
          <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={4} placeholder={t('clp.cover_letter_placeholder')} className="ds-input resize-none text-[14px] leading-[1.6]" />
        </div>
        {err && <p role="alert" className="m-0 text-xs text-ds-bad">{err}</p>}
        <button type="submit" disabled={loading} className="ds-btn ds-btn-primary ds-btn-lg w-full">
          {loading ? t('prp.sending') : t('clp.send_application_arrow')}
        </button>
      </form>
    </ModalShell>
  );
}

/* ── Review Modal ── */
function ReviewModal({ client, user, onClose, onDone }) {
  const { t } = useTranslation();
  useBodyScrollLock(true); // this component only exists while the modal is open
  const [stars,   setStars]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!stars)          { setErr(t('clp.choose_rating')); return; }
    if (!comment.trim()) { setErr(t('clp.comment_required')); return; }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/client-reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: client.email, freelancerEmail: user.email, freelancerName: user.name, rating: stars, comment: comment.trim() }),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setErr(d.error || t('clp.error')); return; }
      onDone();
    } catch { setErr(t('clp.server_unreachable')); }
    finally { setLoading(false); }
  }

  return (
    <ModalShell onClose={onClose} maxWidth={440} labelledBy="review-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ds-warn">{t('Leave a review')}</p>
          <h3 id="review-title" className="m-0 text-base font-extrabold text-ds-ink">{firstWord(client.name) || client.email}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label={t('Cancel')} className="ds-iconbtn ds-iconbtn-boxed"><Icon name="close" size={20} /></button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <FieldLabel>{t('clp.rating')}</FieldLabel>
          <div role="radiogroup" aria-label={t('clp.rating')} className="flex gap-1.5">
            {[1,2,3,4,5].map(i => (
              <button key={i} type="button" role="radio" aria-checked={i === stars} aria-label={`${i}`}
                onClick={() => setStars(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
                className="p-1 leading-none">
                <Icon name="star" size={30} fill className={`transition-colors ${i <= (hovered || stars) ? 'text-ds-warn' : 'text-ds-line-strong'}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>{t('clp.comment')}</FieldLabel>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder={t('clp.review_placeholder')} className="ds-input resize-none text-[14px] leading-[1.6]" />
        </div>
        {err && <p role="alert" className="m-0 text-xs text-ds-bad">{err}</p>}
        <button type="submit" disabled={loading} className="ds-btn ds-btn-lg w-full text-white hover:brightness-110"
          style={{ background: '#d97706', boxShadow: '0 8px 22px -8px rgba(245,158,11,.55)' }}>
          {loading ? t('prp.sending') : t('clp.send_review_arrow')}
        </button>
      </form>
    </ModalShell>
  );
}

/* ── Project row ──────────────────────────────────────────────────────────
   One full-width row per project, as on the supplied Find-Clients screen:
   client identity (avatar · name · region · age) with the payment note and share
   button in the corner, the title with the budget pill beside it, the description,
   the keywords, and — after a divider — the facts (duration, experience,
   applications) on one side and the two actions on the other. */
function ProjectRow({ project, clientUser, accountsLoaded, proposalCount, user, onApply, onGuestApply, onReview, myReviews, hasApplied }) {
  const { t, i18n } = useTranslation();
  const navigate  = useNavigate();
  const colon     = i18n.language === 'fr' ? '\u00a0:' : ':';
  const [tintFg, tintBg] = getTint(project.client_email);
  // Falling back to the raw email prefix (e.g. "mckhnan") was previously the
  // ONLY fallback, including while the account list simply hadn't finished
  // loading yet (accounts/users always start empty on a fresh page load) —
  // so real users with real names briefly, and sometimes persistently on a
  // slow connection, showed as their email prefix instead. Now that fallback
  // only applies once accounts have genuinely finished loading and there's
  // still no match; until then it shows a neutral placeholder instead of a
  // wrong-looking value.
  const displayName = clientUser?.company
    || firstWord(clientUser?.name)
    || (accountsLoaded ? project.client_email?.split('@')[0] : '…')
    || '?';
  const initials    = getInitials(displayName);
  const photoUrl    = clientUser?.photo ? cldImg(clientUser.photo) : null;
  const region      = clientUser?.region || '';
  const keywords    = project.keywords ? project.keywords.split(/\s+/).filter(Boolean) : [];
  const isOwn       = user?.email?.toLowerCase() === project.client_email?.toLowerCase();
  const isFreelancer= user?.role === 'freelancer';
  const avgRating   = myReviews.length ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length : 0;
  const alreadyReviewed = myReviews.some(r => r.freelancer_email?.toLowerCase() === user?.email?.toLowerCase());
  const isTaken     = !!project.status && project.status !== 'open';
  const profileHref = `/profile/${encodeURIComponent(project.client_email)}`;
  const posted      = t('clp.posted', { time: timeAgo(project.created_at, i18n.language) });
  // The client's own figure, whatever it is ("0 TND" included) — see utils/budget.js. Every row has its budget slot.
  const budgetText  = budgetLabel(project.budget);
  // Stored as "De 1 à 3 jours" — the leading "De" reads oddly after the label "Durée".
  const period      = project.period ? String(project.period).replace(/^de\s+/i, '') : '';
  // A visitor may press "Apply" (it leads to login first); a client never applies.
  const canApply    = !isOwn && !isTaken && (isFreelancer || !user);
  const payChip     = (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-ds-accent-soft px-2.5 py-1.5 text-[11px] font-semibold text-ds-accent">
      <Icon name="verified_user" size={14} fill />{t('cp.pay_chip')}
    </span>
  );

  return (
    <article className="ds-tonal ds-tonal-hover p-5 lg:p-7">

      {/* Client identity · corner actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link to={profileHref} className="flex-none" aria-label={displayName}>
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover lg:h-14 lg:w-14" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-extrabold lg:h-14 lg:w-14 lg:text-lg"
                style={{ background: tintBg, color: tintFg }}>
                {initials || '?'}
              </span>
            )}
          </Link>
          <div className="min-w-0">
            <Link to={profileHref} dir="auto" className="block truncate py-0.5 text-[16px] font-bold leading-tight text-ds-ink transition-colors hover:text-ds-accent">{displayName}</Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ds-mute">
              {region && <span className="inline-flex items-center gap-0.5"><Icon name="location_on" size={14} />{region}</span>}
              {region && <span aria-hidden="true">•</span>}
              <span>{posted}</span>
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="star" size={14} fill className="text-ds-warn" />
                  <strong className="font-bold tabular-nums text-ds-warn">{avgRating.toFixed(1)}</strong>
                  <span className="tabular-nums text-ds-faint">({myReviews.length})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-none items-center gap-2">
          {!isTaken && <span className="hidden lg:block">{payChip}</span>}
          {isFreelancer && !isOwn && (
            <>
              <button type="button" onClick={() => navigate(`/messages?with=${encodeURIComponent(project.client_email)}`)}
                className="ds-iconbtn ds-iconbtn-boxed" title={t('Message')} aria-label={t('Message')}>
                <Icon name="chat_bubble" size={18} />
              </button>
              {!alreadyReviewed && (
                <button type="button" onClick={() => onReview(project)}
                  className="ds-iconbtn ds-iconbtn-boxed !text-ds-warn" title={t('clp.review')} aria-label={t('clp.review')}>
                  <Icon name="star" size={18} fill />
                </button>
              )}
            </>
          )}
          <ShareButton url={`${window.location.origin}/project/${project.id}`} title={project.title} size={36}
            accent="rgb(var(--ds-accent))" accentBg="rgb(var(--ds-accent) / .1)" accentBorder="rgb(var(--ds-accent) / .28)" accentHoverBg="rgb(var(--ds-accent) / .2)" />
        </div>
      </div>

      {/* Status chips; on a phone the payment note moves here from the corner. */}
      <div className={`mt-3.5 flex flex-wrap items-center gap-2 ${isTaken || isOwn ? '' : 'lg:hidden'}`}>
        {isTaken && <span className="ds-chip !border-0 !bg-ds-warn/10 text-ds-warn"><Icon name="lock" size={13} />{t('clp.taken')}</span>}
        {isOwn && <span className="ds-chip ds-chip-accent">{t('clp.your_project')}</span>}
        {!isTaken && <span className="lg:hidden">{payChip}</span>}
      </div>

      {/* Title · budget. Beside the title from tablet up (as on the supplied screen); on a
          phone it gets a row of its own, pushed to the end of the line and filled with the
          accent colour so the amount is the first thing the eye finds. */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <h3 dir="auto" className="m-0 min-w-0 text-[19px] font-extrabold leading-[1.25] tracking-[-0.02em] text-ds-ink lg:text-[22px]">{project.title}</h3>
        {budgetText ? (
          <span dir="auto" className="inline-flex max-w-full flex-none items-center gap-1.5 self-end whitespace-nowrap rounded-xl border border-transparent bg-ds-accent px-4 py-2.5 text-[14px] font-semibold text-ds-on-accent shadow-ds-btn md:self-start md:rounded-lg md:border-ds-accent-line md:bg-ds-accent-soft md:px-3 md:py-1.5 md:text-[13px] md:text-ds-accent md:shadow-none">
            {t('prp.budget')}{colon}<bdi className="min-w-0 truncate text-[17px] font-extrabold tabular-nums md:text-[13px]">{budgetText}</bdi>
          </span>
        ) : (
          <span className="inline-flex flex-none items-center self-end whitespace-nowrap rounded-xl border border-ds-line bg-ds-low px-4 py-2.5 text-[13px] font-medium text-ds-mute md:self-start md:rounded-lg md:px-3 md:py-1.5 md:text-[12.5px]">
            {t('prp.budget_unset')}
          </span>
        )}
      </div>

      {project.description && (
        <p dir="auto" className="m-0 mt-2.5 line-clamp-3 text-[14px] leading-[1.65] text-ds-mute md:line-clamp-2">{project.description}</p>
      )}

      {keywords.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {keywords.map((kw, i) => <span key={i} className="ds-tag"><bdi>{kw}</bdi></span>)}
        </div>
      )}

      {/* Facts · actions */}
      <div className="mt-5 flex flex-col gap-4 border-t border-ds-line pt-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <dl className="m-0 flex flex-wrap gap-2">
          {period && (
            <div className="ds-cell inline-flex items-center gap-1.5 !rounded-lg px-3 py-1.5 text-xs">
              <Icon name="schedule" size={15} className="text-ds-faint" />
              <dt className="font-medium text-ds-mute">{t('prp.duration')}{colon}</dt>
              <dd dir="auto" className="m-0 font-bold text-ds-ink">{period}</dd>
            </div>
          )}
          {project.experience && (
            <div className="ds-cell inline-flex items-center gap-1.5 !rounded-lg px-3 py-1.5 text-xs">
              <Icon name="workspace_premium" size={15} className="text-ds-faint" />
              <dt className="font-medium text-ds-mute">{t('prp.experience')}{colon}</dt>
              <dd dir="auto" className="m-0 font-bold text-ds-ink">{project.experience}</dd>
            </div>
          )}
          {proposalCount != null && (
            <div className="ds-cell inline-flex items-center gap-1.5 !rounded-lg px-3 py-1.5 text-xs">
              <Icon name="group" size={15} className="text-ds-faint" />
              <dt className="font-medium text-ds-mute">{t('prp.applications')}{colon}</dt>
              <dd className="m-0 font-bold tabular-nums text-ds-ink">{t('cp.n_received', { count: proposalCount })}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap items-center gap-2 md:flex-none md:flex-nowrap">
          <Link to={`/project/${project.id}`} className="ds-btn ds-btn-tonal !rounded-xl flex-1 md:flex-none">
            <Icon name="visibility" size={16} />{t('cp.view_details')}
          </Link>
          {canApply && (
            hasApplied ? (
              <span className="ds-chip !px-3.5 !py-2.5 text-[12.5px] text-ds-ok" style={{ background: 'rgb(var(--ds-ok) / .1)', borderColor: 'rgb(var(--ds-ok) / .28)' }}>
                <Icon name="check" size={15} />{t('clp.application_sent')}
              </span>
            ) : (
              <button type="button" onClick={() => (isFreelancer ? onApply(project) : onGuestApply(project))}
                className="ds-btn ds-btn-accent !rounded-xl flex-1 md:flex-none">
                <Icon name="send" size={16} />{t('clp.apply_to_project')}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function ClientsPage({ onLogin }) {
  const { t } = useTranslation();
  const { user, users, accountsLoaded } = useAuth();
  const [searchParams] = useSearchParams();

  // The project list now comes from the paginated /projects/browse/open
  // endpoint (search/category/region/sort applied server-side) instead of a full
  // fetch filtered client-side — `projects` below IS the current page.
  const PAGE_SIZE = 10;
  const [projects,        setProjects]        = useState([]);
  const [total,           setTotal]           = useState(null);
  const [totalPages,      setTotalPages]      = useState(1);
  const [page,            setPage]            = useState(1);
  const [proposals,       setProposals]       = useState(null);   // null until the counts request succeeds
  const [myApplications,  setMyApplications]  = useState(new Set());
  const [reviews,         setReviews]         = useState({});
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState(searchParams.get('q') || '');
  const [debSearch,       setDebSearch]       = useState(searchParams.get('q') || '');
  const [category,        setCategory]        = useState('All');
  const [region,          setRegion]          = useState('');
  const [sortBy,          setSortBy]          = useState('newest');
  const [applyFor,        setApplyFor]        = useState(null);
  const [reviewFor,       setReviewFor]       = useState(null);

  // Site-wide counters from the public endpoints, refreshed while the page stays
  // open so they rise and fall with production data. `allTotal` is every project
  // the list can show (open and taken) — the figure on the "All" chip.
  const { data: stats, loading: statsLoading } = useLivePoll(loadProjectStats);
  const { data: allTotal } = useLivePoll(loadProjectsTotal);

  useEffect(() => {
    const tmr = setTimeout(() => setDebSearch(search), 320);
    return () => clearTimeout(tmr);
  }, [search]);

  // Deep link from a shared project's detail page (ProjectDetailPage.js ->
  // "Postuler" -> /clients?applyProjectId=X, after login if needed). Fetches
  // that one project directly by id rather than relying on it being present
  // in the current (paginated/filtered) `projects` page — it may well not
  // be, and this needs to work regardless of what filter/page happens to be
  // active when the link is opened.
  useEffect(() => {
    const applyProjectId = searchParams.get('applyProjectId');
    if (!applyProjectId || !user || user.role !== 'freelancer') return;
    fetch(`${API}/projects/by-id/${encodeURIComponent(applyProjectId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(p => { if (p) setApplyFor(p); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.email]);

  // Any filter change invalidates the current page — start back at page 1.
  useEffect(() => { setPage(1); }, [debSearch, category, sortBy, region]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortBy });
      const text = debSearch.trim();
      // `region` is filtered server-side. A backend that predates that parameter
      // ignores it, so with no text query the region name is also sent as the search
      // term — the project search already matches the client's region — and the
      // filter keeps working until the backend is updated.
      if (text) p.set('search', text); else if (region) p.set('search', region);
      if (region)             p.set('region', region);
      if (category !== 'All') p.set('category', category);
      const url = `${API}/projects/browse/open?${p}`;
      let d = await fetch(url).then(r => r.json());
      // A transient 429/500 (e.g. right as Neon wakes from an idle suspend)
      // returns a non-array error body — retry once instead of silently
      // showing "no projects" for a request that never actually succeeded.
      if (!d || !Array.isArray(d.rows)) {
        await new Promise(res => setTimeout(res, 2000));
        d = await fetch(url).then(r => r.json());
      }
      const open = (d && Array.isArray(d.rows)) ? d.rows : [];
      setProjects(open);
      if (d && Array.isArray(d.rows)) { setTotal(d.total || 0); setTotalPages(d.totalPages || 1); }

      // Counts come from the public aggregate endpoint. This previously called
      // /proposals/project/:id once per project — a route restricted to the
      // project owner — so any other visitor got 401/403 and every card showed
      // "0 propositions". Now one batched request, and a live COUNT(*) that
      // rises on its own as real proposals arrive. If it fails the count is left
      // out of the row rather than shown as a wrong 0.
      let pmap = open.length ? null : {};
      if (open.length) {
        try {
          const counts = await fetch(`${API}/proposals/counts?ids=${open.map(pr => pr.id).join(',')}`).then(r => r.json());
          if (counts && typeof counts === 'object' && !counts.error) pmap = counts;
        } catch { /* leave blank rather than show a wrong number */ }
      }

      // "Have I already applied" needs the caller's OWN proposals, which
      // /proposals/mine returns for the authenticated user — one request
      // instead of reading every project's full proposal list.
      const applied = new Set();
      if (user?.role === 'freelancer' && user?.email) {
        try {
          const mine = await fetch(`${API}/proposals/mine?email=${encodeURIComponent(user.email)}`).then(r => r.json());
          if (Array.isArray(mine)) mine.forEach(pr => applied.add(pr.project_id));
        } catch { /* absence of data must not imply "not applied" incorrectly */ }
      }

      setProposals(pmap);
      setMyApplications(applied);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  }, [user?.email, user?.role, page, debSearch, category, sortBy, region]);

  const loadReviews = useCallback(async () => {
    try {
      const clientEmails = [...new Set((Array.isArray(projects) ? projects : []).map(p => p.client_email).filter(Boolean))];
      const results = await Promise.all(clientEmails.map(e =>
        fetch(`${API}/client-reviews/${encodeURIComponent(e)}`).then(r => r.json()).catch(() => [])
      ));
      const rmap = {};
      clientEmails.forEach((e, i) => { rmap[e.toLowerCase()] = Array.isArray(results[i]) ? results[i] : []; });
      setReviews(rmap);
    } catch {}
  }, [projects]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (projects.length) loadReviews(); }, [loadReviews, projects.length]);

  function getClient(email) {
    return (users || []).find(u => u.email?.toLowerCase() === email?.toLowerCase());
  }

  // A visitor who presses "Apply" is sent to log in first and lands back here with the
  // application dialog open (the deep link handled above).
  const guestApply = project => onLogin?.('login', false, `/clients?applyProjectId=${project.id}`);

  const sortOptions = [
    { value: 'newest',    label: t('Newest') },
    { value: 'oldest',    label: t('clp.sort_oldest') },
    { value: 'budget',    label: t('clp.sort_budget') },
    { value: 'proposals', label: t('clp.sort_proposals') },
  ];

  return (
    <div className="ds relative min-h-screen bg-ds-canvas pt-[66px] text-ds-ink">
      <SEOHead
        title="Clients & Projets en Tunisie"
        url="/clients"
        description="Découvrez les meilleurs clients tunisiens qui recrutent des freelancers. Parcourez les projets disponibles et soumettez vos propositions sur FamaMennou."
        keywords="clients freelance tunisie, projets freelance, offres de mission, recrutement freelancer, appel d'offres tunisie"
      />

      <NoticeBar title={t('ds.pay_notice_title')} to="/help" cta={t('ds.learn_more')}>{t('ds.pay_notice_text')}</NoticeBar>

      <DirectoryHero
        title={t('cp.page_title')}
        subtitle={t('cp.page_sub')}
        search={search} onSearch={setSearch} onSubmit={() => setDebSearch(search)}
        placeholder={t('cp.search_ph')}
        region={{ value: region, onChange: setRegion, options: TUNISIAN_REGIONS, allLabel: t('fp.all_regions'), label: t('fp.region') }}
        filterLabel={t('cp.filter_btn')}
        stats={[
          <StatCard key="o" variant="tonal" value={stats?.openProjects}   label={t('clp.stat_open_projects')}  loading={statsLoading} accent />,
          <StatCard key="c" variant="tonal" value={stats?.activeClients}  label={t('clp.stat_active_clients')} loading={statsLoading} />,
          <StatCard key="r" variant="tonal" value={stats?.regionsCovered} label={t('Regions covered')}         loading={statsLoading} />,
          <StatCard key="p" variant="tonal" value={stats?.proposalsSent}  label={t('clp.stat_proposals_sent')} loading={statsLoading} />,
        ]}
      />

      {/* ── Directory ── */}
      <section className="w-full pb-14">
        <div className="ds-wrap">
          <DirectoryToolbar
            category={category} onCategory={setCategory} allCount={allTotal}
            sortValue={sortBy} onSort={setSortBy} sortOptions={sortOptions}
            count={total} countLabel={t('clp.projects_count', { count: total || 0 })}
          />

          {/* key={page}: a fresh key on every page change makes AnimatePresence
              smoothly cross-fade the list in, instead of it snapping instantly
              — old rows stay on screen (no spinner flash) until it does. */}
          <AnimatePresence mode="wait">
            <motion.div key={page}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-4 lg:gap-5">
              {loading && projects.length === 0 ? (
                [0, 1, 2].map(i => <div key={i} className="ds-tonal ds-skeleton h-[230px]" aria-hidden="true" />)
              ) : projects.length === 0 ? (
                <div className="ds-tonal px-5 py-16 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-high text-ds-accent">
                    <Icon name="search_off" size={26} />
                  </span>
                  <p className="m-0 text-[15px] font-extrabold text-ds-ink-2">{t('clp.no_projects_found')}</p>
                  <p className="mb-5 mt-1.5 text-[13px] text-ds-mute">{(search || region) ? t('clp.try_different_search') : t('clp.no_open_projects')}</p>
                  {(search || region) && (
                    <button type="button" onClick={() => { setSearch(''); setRegion(''); }} className="ds-btn ds-btn-tonal ds-btn-sm">{t('Clear search')}</button>
                  )}
                </div>
              ) : (
                projects.map(p => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    clientUser={getClient(p.client_email)}
                    accountsLoaded={accountsLoaded}
                    proposalCount={proposals ? (proposals[p.id] || 0) : null}
                    user={user}
                    onApply={setApplyFor}
                    onGuestApply={guestApply}
                    onReview={setReviewFor}
                    myReviews={reviews[p.client_email?.toLowerCase()] || []}
                    hasApplied={myApplications.has(p.id)}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>

          <Pagination page={page} totalPages={totalPages} total={total || 0} limit={PAGE_SIZE}
            onPageChange={pg => { setPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            loading={loading} itemLabel={t('clp.projects_count', { count: total || 0 })} />
        </div>
      </section>

      <TrustBand items={[
        { icon: 'payments',   title: t('cp.trust1.title'), text: t('cp.trust1.text') },
        { icon: 'how_to_reg', title: t('cp.trust2.title'), text: t('cp.trust2.text') },
        { icon: 'send',       title: t('cp.trust3.title'), text: t('cp.trust3.text') },
      ]} />

      {/* ── Apply modal ── */}
      {applyFor && (
        <ApplyModal project={applyFor} user={user} onClose={() => setApplyFor(null)}
          onDone={() => { setApplyFor(null); loadData(); }} />
      )}

      {/* ── Review modal ── */}
      {reviewFor && (
        <ReviewModal
          client={getClient(reviewFor.client_email) || { email: reviewFor.client_email, name: reviewFor.client_email }}
          user={user}
          onClose={() => setReviewFor(null)}
          onDone={() => { setReviewFor(null); loadReviews(); }} />
      )}
    </div>
  );
}
