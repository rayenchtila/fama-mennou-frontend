import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SEOHead, { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd, FAQJsonLd } from '../components/Seohead';
import HomeAdVideo from '../components/HomeAdVideo';
import DemoVideoSection from '../components/DemoVideoSection';
import Icon from '../components/ds/Icon';
import CountUp from '../components/ds/CountUp';
import FadeIn from '../components/ds/FadeIn';
import CategoryPills from '../components/ds/CategoryPills';
import { cldImg } from '../utils/cloudinary';
import { firstWord, getInitials } from '../utils/names';
import { normalizeUser } from '../utils/normalizeUser';
import { budgetLabel } from '../utils/budget';
import { useTypewriter, TypeCursor, TypeCursorStyle } from '../hooks/useTypewriter';
import useLivePoll from '../hooks/useLivePoll';
import { loadFreelancerStats, loadProjectStats } from '../utils/liveStats';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
const SPRING = { type: 'spring', stiffness: 120, damping: 16 };
const nf = new Intl.NumberFormat('fr-TN');

// Direction (stated up front, per the frontend-design skill): the supplied
// "Dark Precision Minimalist" system — obsidian slate-indigo canvas, hairline
// glass borders, indigo→violet accents — applied to the page that already
// existed, section for section. The one recurring move is the *verification
// glow*: every "this has been checked" signal (the verified tick on a profile,
// the review step of the payment flow) carries the same soft accent halo, so
// trust has one visual vocabulary. Desktop and phone are laid out separately:
// the phone gets a stacked search, scroll-snap rails instead of tall stacks and
// a vertical timeline for the steps.

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#818cf8,#4f46e5)',
  'linear-gradient(135deg,#7c3aed,#818cf8)',
  'linear-gradient(135deg,#4f46e5,#06b6d4)',
];
function pickGradient(seed) {
  const code = (seed || '').charCodeAt(0) || 0;
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

const COURSE_GRADIENTS = {
  Technology: 'linear-gradient(135deg,#818cf8,#4f46e5)',
  Design: 'linear-gradient(135deg,#7c3aed,#818cf8)',
  Marketing: 'linear-gradient(135deg,#4f46e5,#06b6d4)',
  Writing: 'linear-gradient(135deg,#818cf8,#7c3aed)',
  'E-commerce': 'linear-gradient(135deg,#06b6d4,#4f46e5)',
  Finance: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
};
const DEFAULT_COURSE_GRADIENT = 'linear-gradient(135deg,#818cf8,#4f46e5)';

// Hero headline typewriter — useTypewriter/TypeCursor live in
// src/hooks/useTypewriter.js (shared with dashboard greetings), this just
// composes them into the specific two-line, gradient-on-line2 layout the
// hero needs.
function TypewriterHeadline({ title1, title2 }) {
  const fullText = `${title1}\n${title2}`;
  const { text: typed, done } = useTypewriter(fullText);
  const nlIdx = typed.indexOf('\n');
  const line1 = nlIdx === -1 ? typed : typed.slice(0, nlIdx);
  const line2 = nlIdx === -1 ? '' : typed.slice(nlIdx + 1);
  const typingLine2 = nlIdx !== -1;

  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    if (!done) { setShowCursor(true); return undefined; }
    const t = setTimeout(() => setShowCursor(false), 1000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <>
      <TypeCursorStyle />
      {line1}
      {showCursor && !typingLine2 && <TypeCursor color="rgb(var(--ds-accent))" />}
      <br />
      <span className="ds-gradient-text">{line2}</span>
      {showCursor && typingLine2 && <TypeCursor color="rgb(var(--ds-accent))" />}
    </>
  );
}

// ── Shared section pieces ─────────────────────────────────────────────────────
function SectionHeader({ title, sub, to, cta, center = false }) {
  return (
    <div className={`mb-6 flex flex-wrap items-end gap-4 md:mb-9 ${center ? 'justify-center text-center' : 'justify-between'}`}>
      <div className={center ? 'mx-auto max-w-2xl' : 'min-w-0 max-w-2xl'}>
        <h2 className="text-h-md-m text-ds-ink md:text-h-md">{title}</h2>
        {sub && <p className="mt-1.5 text-b-md text-ds-mute md:text-base">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="ds-btn ds-btn-glass ds-btn-sm flex-none">
          {cta} <Icon name="arrow_forward" size={16} flip />
        </Link>
      )}
    </div>
  );
}

// Phone: a scroll-snap rail that bleeds to the screen edges. Tablet and up: a
// regular grid. Children size themselves with `w-[84%] sm:w-[55%] md:w-auto`.
function CardRail({ children, className = '' }) {
  return (
    <div className={`ds-snap-x -mx-5 scroll-px-5 px-5 pb-3 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}
const RAIL_ITEM = 'w-[84%] sm:w-[55%] md:w-auto';

function SkeletonCard({ height = 220 }) {
  return <div className={`ds-card ds-skeleton ${RAIL_ITEM}`} style={{ height }} aria-hidden="true" />;
}
function StateMessage({ text }) {
  return (
    <div className="ds-card w-full px-6 py-10 text-center text-[14.5px] text-ds-mute md:col-span-full">
      {text}
    </div>
  );
}

// ── Section: Hero ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [typeIdx, setTypeIdx] = useState(0);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const SEARCH_LABELS = [t('home.search.tab1'), t('home.search.tab2'), t('home.search.tab3')];
  const SEARCH_PLACEHOLDERS = [t('home.search.ph1'), t('home.search.ph2'), t('home.search.ph3')];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    const paths = ['/freelancers', '/clients', '/courses'];
    navigate(q ? `${paths[typeIdx]}?q=${encodeURIComponent(q)}` : paths[typeIdx]);
  };

  const title1 = t('home.hero.title1');
  const title2 = t('home.hero.title2');

  return (
    <section className="relative overflow-hidden">
      <div className="ds-ambient" aria-hidden="true" />
      <div className="ds-wrap relative grid items-center gap-10 pb-12 pt-9 md:pb-16 md:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24 lg:pt-16">

        {/* Copy column */}
        <div className="min-w-0">
          {/* H1 — typed out live. The full text is laid out invisibly underneath
              so the block keeps its final height from the first frame (no
              content jumping while it types), and stays available to screen
              readers/crawlers via aria-label even mid-type. */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
            aria-label={`${title1} ${title2}`}
            className="relative text-h-xl-m text-ds-ink md:text-[2.75rem] md:leading-[1.08] xl:text-h-xl">
            <span className="invisible block" aria-hidden="true">{title1}<br />{title2}</span>
            <span className="absolute inset-0 block" aria-hidden="true">
              <TypewriterHeadline title1={title1} title2={title2} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.17 }}
            className="mt-5 max-w-xl text-[16px] leading-[1.6] text-ds-mute md:text-b-lg">
            {t('home.hero.subtitle')}
          </motion.p>

          {/* Post-a-project shortcut — client accounts only, new or old,
              approved or still pending (the /projects page itself already
              disables the actual Publier button and explains why for a
              pending client, so no extra gating is needed here). */}
          {user?.role === 'client' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.22 }} className="mt-6">
              <Link to="/projects?post=1" className="ds-btn ds-btn-primary ds-btn-lg">
                {t('home.publish_cta')}
              </Link>
            </motion.div>
          )}

          {/* Type tabs + search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.26 }}
            className="mt-8 w-full max-w-xl">
            <div role="tablist" aria-label={t('home.search.btn')}
              className="mb-3 flex w-full rounded-xl border border-ds-line bg-ds-low p-1 sm:inline-flex sm:w-auto">
              {SEARCH_LABELS.map((label, i) => (
                <button key={label} type="button" role="tab" aria-selected={typeIdx === i} onClick={() => setTypeIdx(i)}
                  className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all sm:flex-none sm:px-5 ${
                    typeIdx === i ? 'bg-ds-fill text-white shadow-ds-btn' : 'text-ds-mute hover:text-ds-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="ds-search ps-4" role="search">
              <Icon name="search" size={20} className="flex-none text-ds-faint" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={SEARCH_PLACEHOLDERS[typeIdx]}
                aria-label={SEARCH_PLACEHOLDERS[typeIdx]} />
              <button type="submit" className="ds-btn ds-btn-primary !min-h-11 flex-none !px-3.5 sm:!px-5" aria-label={t('home.search.btn')}>
                <span className="hidden sm:inline">{t('home.search.btn')}</span>
                <Icon name="arrow_forward" size={20} flip className="sm:hidden" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Visual — the admin's sponsored video when one is live, the static
            photo otherwise. HomeAdVideo draws its own glow + card chrome so
            either state fills this exact spot with no layout shift. */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING, delay: 0.15 }}>
          <HomeAdVideo variant="hero" fallbackSrc="/images/home-hero.jpg" fallbackAlt={t('home.hero.visual_alt')} />
        </motion.div>

      </div>
    </section>
  );
}

// ── Section: Trust strip — live platform counts. Every tile reads the same
// public /stats endpoints the Freelancers and Clients pages use, so each number
// is real, refreshes itself while the page is open, and moves up *or down* as
// freelancers get verified (or leave) and clients post projects — nobody
// hand-edits a figure here. No "+" suffix: the values are exact.
function TrustStripSection() {
  const { t } = useTranslation();
  const { data, loading } = useLivePoll(async () => {
    const [fl, pr] = await Promise.all([loadFreelancerStats(), loadProjectStats()]);
    return { verified: fl.verified, activeClients: pr.activeClients, regions: fl.regions, proposals: pr.proposalsSent };
  });

  const tiles = [
    { value: data?.verified,      desc: t('home.trust.t1d'), accent: true },
    { value: data?.activeClients, desc: t('home.trust.t2d') },
    { value: data?.regions,       desc: t('home.trust.t3d') },
    { value: data?.proposals,     desc: t('home.trust.t4d') },
  ];
  return (
    <section className="border-y border-ds-line bg-ds-low py-8 md:py-10">
      <div className="ds-wrap grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map((tile, i) => (
          <FadeIn key={i} delay={i * 0.07} className="ds-card p-4 sm:p-5">
            <CountUp value={tile.value} fallback={loading ? '…' : '—'} className={`block text-[28px] font-extrabold leading-none tracking-tight tabular-nums sm:text-[34px] ${tile.accent ? 'text-ds-accent' : 'text-ds-ink'}`} />
            <p className="mt-2.5 text-[12.5px] leading-[1.45] text-ds-mute sm:text-[13px]">{tile.desc}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Section: Action Cards ─────────────────────────────────────────────────────
function ActionCardsSection() {
  const { t } = useTranslation();
  const cards = [
    { to: '/freelancers', icon: 'group', title: t('home.ac.hire.title'), desc: t('home.ac.hire.desc'), cta: t('home.ac.hire.cta') },
    { to: '/clients', icon: 'work', title: t('home.ac.client.title'), desc: t('home.ac.client.desc'), cta: t('home.ac.client.cta') },
    { to: '/courses', icon: 'school', title: t('home.ac.learn.title'), desc: t('home.ac.learn.desc'), cta: t('home.ac.learn.cta') },
  ];
  return (
    <section className="ds-wrap pt-12 md:pt-16 lg:pt-20">
      <div className="grid gap-3 md:grid-cols-3 md:gap-5">
        {cards.map((card, i) => (
          <FadeIn key={card.to} delay={i * 0.08}>
            <Link to={card.to}
              className="ds-card ds-card-hover flex h-full items-center gap-4 p-4 md:flex-col md:items-start md:gap-3.5 md:p-6">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-ds-accent-line bg-ds-accent-soft text-ds-accent">
                <Icon name={card.icon} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold text-ds-ink md:text-lg">{card.title}</span>
                <span className="mt-0.5 block text-[13.5px] leading-[1.5] text-ds-mute md:mt-1 md:text-sm">{card.desc}</span>
              </span>
              <span className="hidden items-center gap-1.5 text-[13.5px] font-semibold text-ds-accent md:mt-auto md:flex">
                {card.cta} <Icon name="arrow_forward" size={16} flip />
              </span>
              <Icon name="chevron_right" size={22} flip className="flex-none text-ds-faint md:hidden" />
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Section: How It Works ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    { num: '1', title: t('home.hiw.s1t'), desc: t('home.hiw.s1d') },
    { num: '2', title: t('home.hiw.s2t'), desc: t('home.hiw.s2d') },
    { num: '3', title: t('home.hiw.s3t'), desc: t('home.hiw.s3d') },
  ];
  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <SectionHeader center title={t('home.hiw.title')} sub={t('home.hiw.sub')} />
      <ol className="relative m-0 grid list-none gap-0 p-0 md:grid-cols-3 md:gap-8">
        {/* Desktop connector between the three number tiles */}
        <span className="pointer-events-none absolute start-[16.66%] end-[16.66%] top-6 hidden border-t-2 border-dashed border-ds-line-strong md:block" aria-hidden="true" />
        {steps.map((step, i) => (
          <FadeIn as="li" key={step.num} delay={i * 0.1} className="relative flex gap-4 pb-8 last:pb-0 md:flex-col md:items-center md:gap-0 md:pb-0 md:text-center">
            {/* Phone: vertical connector down the number column */}
            {i < steps.length - 1 && <span className="absolute start-6 top-12 bottom-0 w-px -translate-x-1/2 bg-ds-line-strong md:hidden" aria-hidden="true" />}
            <span className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-ds-fill font-mono text-lg font-bold text-white shadow-ds-btn md:mb-4"
              style={{ background: 'linear-gradient(135deg, rgb(var(--ds-fill)), rgb(var(--ds-fill-2)))' }}>
              {step.num}
            </span>
            <div className="min-w-0 pt-1 md:pt-0">
              <h3 className="text-[17px] font-bold text-ds-ink">{step.title}</h3>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-ds-mute md:mx-auto md:max-w-[17rem]">{step.desc}</p>
            </div>
          </FadeIn>
        ))}
      </ol>
    </section>
  );
}

// ── Section: Payment verification — the real flow, laid out like the supplied
// "contract" card: a header, three steps (done · current · next) and a footer row.
// The card is an illustration of the process and says so ("example"); it carries no
// amounts, dates or reference numbers. ─────────────────────────────────────────────
const STEP_STYLE = {
  done:    { row: 'border-ds-accent-line bg-ds-accent-soft', bubble: 'ds-verified bg-ds-fill text-white', chip: 'bg-ds-high text-ds-ok' },
  current: { row: 'border-transparent bg-ds-high', bubble: 'bg-ds-highest text-ds-ink', chip: 'bg-ds-accent-soft text-ds-accent' },
  next:    { row: 'border-ds-line bg-transparent', bubble: 'bg-ds-high text-ds-mute', chip: 'bg-ds-high text-ds-faint' },
};

function PaymentVerificationSection() {
  const { t } = useTranslation();
  const steps = [
    { state: 'done',    icon: 'check', title: t('home.trust2.s1t'), desc: t('home.trust2.s1d'), badge: t('home.trust2.st_done') },
    { state: 'current', icon: null,    title: t('home.trust2.s2t'), desc: t('home.trust2.s2d'), badge: t('home.trust2.st_now') },
    { state: 'next',    icon: null,    title: t('home.trust2.s3t'), desc: t('home.trust2.s3d'), badge: t('home.trust2.st_next') },
  ];
  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div className="lg:sticky lg:top-24">
          <h2 className="text-h-md-m text-ds-ink md:text-h-md">{t('home.trust2.title')}</h2>
          <p className="mt-3 max-w-md text-[15.5px] leading-[1.6] text-ds-mute">{t('home.trust2.sub')}</p>
          <p className="mt-6 hidden items-start gap-2.5 text-[13.5px] leading-[1.5] text-ds-mute lg:flex">
            <Icon name="shield" size={18} className="mt-px flex-none text-ds-accent" />
            <span>{t('home.trust2.note')}</span>
          </p>
        </div>

        <div className="ds-card p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-ds-line pb-4">
            <div className="min-w-0">
              <p className="m-0 text-[11.5px] font-semibold text-ds-faint">{t('home.trust2.example')}</p>
              <p className="m-0 mt-0.5 text-[15px] font-bold text-ds-ink">{t('home.trust2.card_title')}</p>
            </div>
            <span className="ds-chip ds-chip-accent flex-none"><Icon name="verified" size={14} />{t('home.trust2.verified')}</span>
          </div>

          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {steps.map((step, i) => {
              const st = STEP_STYLE[step.state];
              return (
                <FadeIn as="li" key={step.title} delay={i * 0.09} className={`flex items-start gap-4 rounded-xl border p-4 ${st.row}`}>
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-sm font-bold ${st.bubble}`}>
                    {step.icon ? <Icon name={step.icon} size={20} /> : <span className="font-mono">{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <h3 className="m-0 text-[15px] font-bold text-ds-ink">{step.title}</h3>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${st.chip}`}>{step.badge}</span>
                    </div>
                    <p className="m-0 mt-1 text-[13.5px] leading-[1.55] text-ds-mute">{step.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </ol>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl bg-ds-high px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-ds-mute">{t('home.trust2.methods')}</span>
              {['D17', 'Flouci', t('footer.bank_transfer')].map(m => <span key={m} className="ds-tag !bg-ds-highest font-mono">{m}</span>)}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ds-ink-2">
              <Icon name="verified" size={16} className="text-ds-accent" />{t('home.trust2.reviewed')}
            </span>
          </div>

          <p className="mb-0 mt-3 flex items-start gap-2.5 rounded-xl bg-ds-high px-4 py-3.5 text-[13px] leading-[1.5] text-ds-mute lg:hidden">
            <Icon name="shield" size={18} className="mt-px flex-none text-ds-accent" />
            <span>{t('home.trust2.note')}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section: Available talent — live from the directory endpoint (the same one the
// Freelancers page uses), with the same category tabs. Top-rated first; only
// freelancers who mark themselves available. ─────────────────────────────────────
const TALENT_COUNT = 4;

function useTalents(category) {
  const [state, setState] = useState({ items: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: false }));
    const q = new URLSearchParams({ page: '1', limit: String(TALENT_COUNT), sort: 'rating', availability: 'available' });
    if (category !== 'All') q.set('category', category);
    const url = `${API}/users/public/freelancers?${q}`;
    const load = () => fetch(url).then(r => r.json());
    // A transient 429/500 (e.g. right as Neon wakes from an idle suspend) answers with a
    // non-list body — retry once before showing an error.
    load()
      .then(d => (Array.isArray(d?.rows) ? d : new Promise(res => setTimeout(res, 2000)).then(load)))
      .then(d => {
        if (cancelled) return;
        const ok = Array.isArray(d?.rows);
        setState({
          items: ok ? d.rows.slice(0, TALENT_COUNT).map(r => ({
            ...normalizeUser(r, false),
            aggRating: Number(r.agg_rating) || 0,
            aggReviews: Number(r.agg_review_count) || 0,
          })) : [],
          loading: false,
          error: !ok,
        });
      })
      .catch(() => { if (!cancelled) setState({ items: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, [category]);

  return state;
}

function TalentCard({ f, index }) {
  const { t } = useTranslation();
  const skills = (Array.isArray(f.skills) ? f.skills : String(f.skills || '').split(',')).map(s => String(s).trim()).filter(Boolean).slice(0, 4);
  const role = f.title || skills[0] || '';
  const availCls = f.availability === 'unavailable' ? 'text-ds-bad' : f.availability === 'busy' ? 'text-ds-warn' : 'text-ds-ok';
  const availLabel = f.availability === 'unavailable' ? t('Unavailable') : f.availability === 'busy' ? t('Busy') : t('Available');

  return (
    <FadeIn as="article" delay={index * 0.07} className={`ds-card ds-card-hover relative flex flex-col p-5 ${RAIL_ITEM}`}>
      <div className="flex items-start gap-3.5">
        <span className="relative flex-none">
          {f.photo ? (
            <img src={cldImg(f.photo)} alt="" loading="lazy" className="h-14 w-14 rounded-xl bg-ds-high object-cover"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
          ) : null}
          <span className="h-14 w-14 items-center justify-center rounded-xl text-base font-bold text-white"
            style={{ background: pickGradient(f.email || f.name), display: f.photo ? 'none' : 'flex' }}>
            {getInitials(f.name)}
          </span>
          <span className="ds-verified absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4338ca] text-white ring-2 ring-ds-card" title={t('Verified')}>
            <Icon name="check" size={13} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h3 dir="auto" className="m-0 truncate text-[16px] font-bold text-ds-ink">{firstWord(f.name)}</h3>
          {role && <p dir="auto" className="m-0 mt-0.5 line-clamp-2 text-[13px] font-semibold leading-[1.35] text-ds-accent">{role}</p>}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {f.region && <span className="inline-flex items-center gap-1 text-ds-faint"><Icon name="location_on" size={14} />{f.region}</span>}
        <span className={`inline-flex items-center gap-1.5 font-semibold ${availCls}`}><span className="ds-dot" />{availLabel}</span>
      </div>

      {f.bio && <p dir="auto" className="m-0 mt-3 line-clamp-3 text-[13.5px] leading-5 text-ds-mute">{f.bio}</p>}

      {skills.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {skills.map(s => <span key={s} className="ds-tag"><bdi>{s}</bdi></span>)}
        </div>
      )}

      <div className="mt-auto pt-[18px]">
        <div className="flex items-end justify-between gap-3 border-t border-ds-line pt-4">
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-ds-faint">{t('home.tl.rating')}</span>
            {f.aggRating > 0 ? (
              <span className="inline-flex items-center gap-1 text-[15px] font-bold text-ds-ink">
                <Icon name="star" size={16} fill className="text-ds-warn" />
                <span className="tabular-nums">{f.aggRating.toFixed(1)}</span>
                {f.aggReviews > 0 && <span className="text-xs font-medium tabular-nums text-ds-faint">({f.aggReviews})</span>}
              </span>
            ) : (
              <span className="text-[15px] font-bold text-ds-ink">{t('home.ff.new')}</span>
            )}
          </div>
          {/* The whole card is the link target (stretched): a single tab stop. */}
          <Link to={`/profile/${encodeURIComponent(f.email)}`} className="ds-btn ds-btn-accent ds-btn-sm after:absolute after:inset-0 after:content-['']">
            {t('home.tl.profile')}
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}

function TalentsSection() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('All');
  const { items, loading, error } = useTalents(category);
  const firstLoad = loading && items.length === 0;
  const empty = !loading && !error && items.length === 0;

  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <div className="mb-6 flex flex-col gap-4 md:mb-9 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-xl">
          <h2 className="text-h-md-m text-ds-ink md:text-h-md">{t('home.tl.title')}</h2>
          <p className="mt-1.5 text-b-md text-ds-mute md:text-base">{t('home.tl.sub')}</p>
        </div>
        <CategoryPills variant="tonal" value={category} onChange={setCategory} label={t('Category')}
          className="-mx-5 px-5 lg:mx-0 lg:max-w-[44rem] lg:justify-end lg:px-0" />
      </div>

      <CardRail className={`lg:!grid-cols-4 transition-opacity ${loading && !firstLoad ? 'opacity-60' : ''}`}>
        {firstLoad && [0, 1, 2, 3].map(i => <SkeletonCard key={i} height={300} />)}
        {!firstLoad && error && <StateMessage text={t('home.tl.error')} />}
        {empty && <StateMessage text={t('home.tl.empty')} />}
        {!firstLoad && !error && items.map((f, i) => <TalentCard key={f.email} f={f} index={i} />)}
      </CardRail>

      <div className="mt-6 text-center md:mt-8">
        <Link to="/freelancers" className="ds-btn ds-btn-glass">
          {t('home.tl.view_all')} <Icon name="arrow_forward" size={16} flip />
        </Link>
      </div>
    </section>
  );
}

// ── Section: Open missions — the newest open projects, with a live count of how many
// are open in total. ──────────────────────────────────────────────────────────────
const MISSION_COUNT = 3;

function useOpenMissions() {
  const [state, setState] = useState({ items: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    const url = `${API}/projects/browse/open?page=1&limit=${MISSION_COUNT * 2}&sort=newest&status=open`;
    const load = () => fetch(url).then(r => r.json());
    load()
      .then(d => (Array.isArray(d?.rows) ? d : new Promise(res => setTimeout(res, 2000)).then(load)))
      .then(d => {
        if (cancelled) return;
        const ok = Array.isArray(d?.rows);
        // The filter is repeated here: a backend that predates the status parameter
        // also returns projects that have already been taken.
        setState({ items: ok ? d.rows.filter(p => (p.status || 'open') === 'open').slice(0, MISSION_COUNT) : [], loading: false, error: !ok });
      })
      .catch(() => { if (!cancelled) setState({ items: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}

function MissionCard({ p, index, client }) {
  const { t } = useTranslation();
  const name = client?.company || firstWord(client?.name) || p.client_email?.split('@')[0] || '?';
  const place = [name, client?.region].filter(Boolean).join(' — ');
  // The client's own figure, whatever it is ("0 TND" included) — the same reading as every other project card.
  const budgetText = budgetLabel(p.budget);

  return (
    <FadeIn as="article" delay={index * 0.08} className={`ds-card ds-card-hover relative flex flex-col gap-3.5 p-5 ${RAIL_ITEM}`}>
      <div className="flex items-center justify-between gap-3">
        <span dir="auto" className="ds-tag min-w-0 max-w-[68%] font-mono"><span className="truncate">{place}</span></span>
        {p.period && <span dir="auto" className="flex-none text-xs text-ds-faint">{String(p.period).replace(/^de\s+/i, '')}</span>}
      </div>

      <h3 dir="auto" className="m-0 line-clamp-2 text-[17px] font-bold leading-[1.3] tracking-[-0.01em] text-ds-ink">{p.title}</h3>
      {p.description && <p dir="auto" className="m-0 line-clamp-3 text-[13.5px] leading-[1.6] text-ds-mute">{p.description}</p>}

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-ds-line pt-4">
        {budgetText ? (
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-ds-faint">{t('prp.budget')}</span>
            <bdi className="block truncate text-[18px] font-extrabold tabular-nums text-ds-accent">{budgetText}</bdi>
          </div>
        ) : <span className="min-w-0 text-[12.5px] font-medium text-ds-faint">{t('prp.budget_unset')}</span>}
        {/* The public project page carries the apply flow (it asks visitors to log in first). */}
        <Link to={`/project/${p.id}`} className="ds-btn ds-btn-accent ds-btn-sm after:absolute after:inset-0 after:content-['']">
          {t('home.tp.apply')}
        </Link>
      </div>
    </FadeIn>
  );
}

function MissionsSection({ users }) {
  const { t } = useTranslation();
  const { items, loading, error } = useOpenMissions();
  const { data: stats } = useLivePoll(loadProjectStats);
  const open = stats?.openProjects;
  const empty = !loading && !error && items.length === 0;
  const getClient = email => (users || []).find(u => u.email?.toLowerCase() === email?.toLowerCase());

  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1 md:mb-9">
        <h2 className="text-h-md-m text-ds-ink md:text-h-md">{t('home.mi.title')}</h2>
        <Link to="/clients" className="inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-ds-accent transition-colors hover:text-ds-ink">
          <span>{open > 0 ? t('home.mi.view_all', { count: open }) : t('home.tp.view_all')}</span>
          <Icon name="arrow_forward" size={16} flip />
        </Link>
      </div>
      <CardRail>
        {loading && [0, 1, 2].map(i => <SkeletonCard key={i} height={230} />)}
        {!loading && error && <StateMessage text={t('home.tp.error')} />}
        {empty && <StateMessage text={t('home.tp.empty')} />}
        {!loading && !error && items.map((p, i) => <MissionCard key={p.id} p={p} index={i} client={getClient(p.client_email)} />)}
      </CardRail>
    </section>
  );
}


// ── Data: top courses (most enrolled, then cheapest, then oldest) ────────────
function useTopCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // Same retry-once-on-non-array-response fix as useTopProjects — a
    // transient 429/500 previously rendered as "no courses" permanently.
    const fetchCourses = () => fetch(`${API}/courses`).then(r => r.json());
    fetchCourses().then(rows => Array.isArray(rows) ? rows
      : new Promise(res => setTimeout(res, 2000)).then(fetchCourses)
    ).then(rows => {
      if (!cancelled) setCourses(Array.isArray(rows) ? rows : []);
    }).catch(() => { if (!cancelled) { setError(true); setCourses([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => {
    const priceOf = c => {
      const full = Number(c.full_price || 0);
      const pct  = Number(c.discount_pct || 0);
      return pct > 0 ? full * (1 - pct / 100) : full;
    };
    return [...courses].sort((a, b) => {
      const studentsDiff = Number(b.total_students || 0) - Number(a.total_students || 0);
      if (studentsDiff !== 0) return studentsDiff;
      const priceDiff = priceOf(a) - priceOf(b);
      if (priceDiff !== 0) return priceDiff;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }).slice(0, 3);
  }, [courses]);

  return { items, loading, error };
}

// ── Section: Courses Preview ──────────────────────────────────────────────────
function CoursePreviewCard({ c, index }) {
  const { t } = useTranslation();
  const instructor = firstWord(c.instructor_name) || c.creator_email?.split('@')[0] || '';
  const rating   = Number(c.avg_rating || 0);
  const students = Number(c.total_students || 0);
  const full     = Number(c.full_price || 0);
  const pct      = Number(c.discount_pct || 0);
  const final    = pct > 0 ? full * (1 - pct / 100) : full;
  const isFree   = full === 0;
  const cover    = COURSE_GRADIENTS[c.category] || DEFAULT_COURSE_GRADIENT;

  return (
    <FadeIn as="article" delay={index * 0.08} className={`ds-card ds-card-hover relative flex flex-col overflow-hidden ${RAIL_ITEM}`}>
      <div className="relative flex h-32 items-center justify-center md:h-36" style={{ background: cover }}>
        {c.thumbnail_url && <img src={cldImg(c.thumbnail_url)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {c.category && (
          <span className="absolute start-3 top-3 rounded-md bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{t(c.category)}</span>
        )}
        {!c.thumbnail_url && <Icon name="school" size={32} className="text-white/90" />}
        {pct > 0 && !isFree && (
          <span className="absolute end-3 top-3 rounded-md bg-red-500 px-2 py-1 text-[11px] font-extrabold text-white">-{pct}%</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 dir="auto" className="line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-[1.35] text-ds-ink">{c.title}</h3>
        {instructor && <p dir="auto" className="mt-1.5 truncate text-[13px] text-ds-mute">{instructor}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ds-mute">
            {rating > 0 ? (
              <><Icon name="star" size={15} fill className="text-ds-warn" /><strong className="font-bold tabular-nums text-ds-ink">{rating.toFixed(1)}</strong></>
            ) : (
              <span className="font-semibold">{t('home.ff.new')}</span>
            )}
            {students > 0 && <span className="tabular-nums">· {nf.format(students)}</span>}
          </span>
          <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
            {pct > 0 && !isFree && <span className="text-xs tabular-nums text-ds-faint line-through">{full.toFixed(0)}</span>}
            <bdi className="text-[15px] font-bold tabular-nums text-ds-ink">{isFree ? t('cc.free') : `${final.toFixed(0)} TND`}</bdi>
          </span>
        </div>
      </div>
      <Link to={`/courses/${c.id}`} aria-label={c.title} className="absolute inset-0" />
    </FadeIn>
  );
}

function CoursesPreviewSection({ items, loading, error }) {
  const { t } = useTranslation();
  const empty = !loading && !error && items.length === 0;
  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <SectionHeader title={t('home.cp.title')} sub={t('home.cp.sub')} to="/courses" cta={t('home.cp.view_all')} />
      <CardRail>
        {loading && [0, 1, 2].map(i => <SkeletonCard key={i} height={260} />)}
        {!loading && error && <StateMessage text={t('home.cp.error')} />}
        {empty && <StateMessage text={t('home.cp.empty')} />}
        {!loading && !error && items.map((c, i) => <CoursePreviewCard key={c.id} c={c} index={i} />)}
      </CardRail>
    </section>
  );
}

// ── Section: Dual trust columns (Businesses / Freelancers). Each bullet is
// "Lead: sentence" — the lead is set in bold, as in the supplied design. Every line
// states something the platform does (ID checks, payment-proof review, in-app
// messaging, the 6% commission, withdrawal times). ──────────────────────────────
function splitLead(text) {
  const m = String(text).match(/^([^:：]{2,48}?)\s*[:：]\s*([\s\S]+)$/);
  return m ? { lead: m[1], rest: m[2] } : { lead: null, rest: String(text) };
}

function DualTrustSection() {
  const { t, i18n } = useTranslation();
  const colon = i18n.language === 'fr' ? '\u00a0: ' : ': ';
  const columns = [
    {
      icon: 'apartment', title: t('home.dual.biz.title'), sub: t('home.dual.biz.sub'),
      bullets: [t('home.dual.biz.b1'), t('home.dual.biz.b2'), t('home.dual.biz.b3')],
    },
    {
      icon: 'verified_user', title: t('home.dual.fl.title'), sub: t('home.dual.fl.sub'),
      bullets: [t('home.dual.fl.b1'), t('home.dual.fl.b2'), t('home.dual.fl.b3')],
    },
  ];
  return (
    <section className="ds-wrap pt-14 md:pt-20">
      <SectionHeader center title={t('home.dual.title')} />
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {columns.map((col, i) => (
          <FadeIn key={col.title} delay={i * 0.1} className="ds-card p-5 md:p-7">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-ds-line bg-ds-high text-ds-accent">
              <Icon name={col.icon} size={24} />
            </span>
            <h3 className="text-lg font-bold text-ds-ink">{col.title}</h3>
            <p className="mb-5 mt-1.5 text-sm leading-[1.55] text-ds-mute">{col.sub}</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {col.bullets.map(b => {
                const { lead, rest } = splitLead(b);
                return (
                  <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-ds-mute">
                    <Icon name="check_circle" size={18} fill className="mt-px flex-none text-ds-accent" />
                    <span>{lead && <strong className="font-semibold text-ds-ink">{lead}{colon}</strong>}{rest}</span>
                  </li>
                );
              })}
            </ul>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ── Section: FAQ ──────────────────────────────────────────────────────────────
// Seven questions, each answered from what the platform really does (see the help
// centre and the terms). The same keys feed the structured data in <Home/>.
const FAQ_COUNT = 7;

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  const { t } = useTranslation();
  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => ({ question: t(`home.faq.q${i + 1}`), answer: t(`home.faq.a${i + 1}`) }));

  return (
    <section className="ds-wrap max-w-[56rem] pt-14 md:pt-20">
      <SectionHeader center title={t('home.faq.title')} />
      <div className="flex flex-col gap-2.5 md:gap-3">
        {faqItems.map((q, i) => {
          const isOpen = openIdx === i;
          return (
            <FadeIn key={q.question} delay={i * 0.05}
              className={`overflow-hidden rounded-xl border bg-ds-card transition-colors ${isOpen ? 'border-ds-accent-line' : 'border-ds-line'}`}>
              <h3 className="m-0">
                <button type="button" onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen} aria-controls={`faq-answer-${i}`} id={`faq-q-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-start md:px-5">
                  <span className="text-[15px] font-bold text-ds-ink md:text-[15.5px]">{q.question}</span>
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-ds-accent-line bg-ds-accent-soft text-ds-accent">
                    <Icon name="expand_more" size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
              </h3>
              {/* grid-rows 0fr→1fr animates height without measuring it */}
              <div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-q-${i}`}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="m-0 px-4 pb-5 text-[14.5px] leading-[1.65] text-ds-mute md:px-5">{q.answer}</p>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

// ── Section: Final CTA ────────────────────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="mt-16 md:mt-24">
      <FadeIn y={24} className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 52%, #2563eb 100%)' }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true"
          style={{ background: 'radial-gradient(440px 240px at 12% 0%, rgba(255,255,255,.2), transparent 70%), radial-gradient(420px 240px at 90% 100%, rgba(255,255,255,.12), transparent 70%)' }} />
        <div className="ds-wrap relative grid items-center gap-8 py-14 text-center md:py-20 lg:grid-cols-[1fr_auto] lg:gap-14 lg:text-start">
          <div>
            <h2 className="text-h-md-m text-white md:text-h-lg">{t('home.final.title')}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[16px] leading-[1.55] text-white/85 md:text-[17px] lg:mx-0">{t('home.final.sub')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/projects?post=1" className="ds-btn ds-btn-white ds-btn-lg">{t('home.final.post')}</Link>
            <Link to="/freelancers" className="ds-btn ds-btn-outline-white ds-btn-lg">{t('home.final.explore')}</Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

// ── Main Home page ────────────────────────────────────────────────────────────
export default function Home() {
  const { user, users } = useAuth();
  const { i18n } = useTranslation();
  const courses = useTopCourses();

  // The structured data always speaks French (the site's search language) but is
  // built from the same keys as the visible FAQ, so the two can never drift apart.
  const tFr = i18n.getFixedT('fr');
  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({ question: tFr(`home.faq.q${i + 1}`), answer: tFr(`home.faq.a${i + 1}`) }));

  if (user?.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    // pt-[66px] clears the fixed header. The brand strip above it (TopBar) lives in App.js.
    <div className="ds relative min-h-screen overflow-x-clip bg-ds-canvas pt-[66px] text-ds-ink">
      <SEOHead
        url="/"
        description="FamaMennou — La plateforme tunisienne de freelance. Trouvez des freelancers, publiez vos projets et suivez des formations en ligne."
        keywords="freelance tunisie, trouver freelancer, cours en ligne tunisie, projets freelance, développeur tunisie, designer tunisie, formation en ligne"
      />
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <LocalBusinessJsonLd />
      <FAQJsonLd faqs={faqs} />
      <HeroSection />
      <DemoVideoSection />
      <TrustStripSection />
      <ActionCardsSection />
      <HowItWorksSection />
      <PaymentVerificationSection />
      <TalentsSection />
      <MissionsSection users={users} />
      <CoursesPreviewSection {...courses} />
      <DualTrustSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
