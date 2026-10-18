import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CreateCourseModal from '../components/CreateCourseModal';
import Pagination from '../components/Pagination';
import MarketHero from '../components/ds/MarketHero';
import StatCard from '../components/ds/StatCard';
import SortSelect from '../components/ds/SortSelect';
import CategoryPills from '../components/ds/CategoryPills';
import TrustBand from '../components/ds/TrustBand';
import { CATEGORIES } from '../components/ds/categories';
import Icon from '../components/ds/Icon';
import ModalShell, { FieldLabel } from '../components/ds/ModalShell';
import useLivePoll from '../hooks/useLivePoll';
import { loadCourseStats } from '../utils/liveStats';
import SEOHead from '../components/Seohead';
import { firstWord } from '../utils/names';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

// Direction: the supplied Courses screen — light, white and emerald (brand-50 wash
// behind the hero, brand-700 actions, hairline green borders); in dark mode the same
// layout runs on the slate canvas with a bright-emerald accent. A search console
// (keywords · category · action), four live figures, chips + price + sort, then
// text cards in two columns: instructor (initials, verified tick, role • city),
// title, rating · video length · chapters, price, and the two actions "Programme" and
// "Suivre ce cours". Everything on a card is a field the course really has — there is
// no level, no tag list and no refund promise to show, so none is invented. The
// owner tools (edit once, delete) and the discount display the page already had stay.

function fmtNum(n) {
  const v = Number(n||0);
  if (v >= 1000) return (v/1000).toFixed(1).replace(/\.0$/,'')+'k';
  return String(v);
}

// 840 min → "14h", 570 min → "9h30", 45 min → "45 min".
function fmtDuration(min) {
  const m = Math.round(Number(min) || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rest = m % 60;
  return rest ? `${h}h${String(rest).padStart(2, '0')}` : `${h}h`;
}

const getTint = s => {
  const c = (s||'').charCodeAt(0) % 6;
  return ['#14b8a6','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#06b6d4'][c];
};
const getInits = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');

const Dot = () => <span aria-hidden="true" className="text-ds-faint">•</span>;

/* ══════════════════════════════════════════════════════════════════
   Course Card
   ══════════════════════════════════════════════════════════════════ */
function CourseCard({ course, onDeleted }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editForm, setEditForm]     = useState({ title: course.title||'', description: course.description||'', category: course.category||'', full_price: course.full_price||'', discount_pct: course.discount_pct||'' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');
  useBodyScrollLock(confirmDel || editOpen);
  const EDIT_KEY = `fm_edited_course_${course.id}`;
  const alreadyEdited = !!localStorage.getItem(EDIT_KEY);
  const isOwner = user && course.creator_email && user.email === course.creator_email;

  async function handleEdit() {
    if (!editForm.title.trim()) { setEditError(t('Title is required')); return; }
    setEditSaving(true); setEditError('');
    try {
      const r = await fetch(`${API}/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editForm.title.trim(), description: editForm.description.trim(), category: editForm.category, full_price: Number(editForm.full_price)||0, discount_pct: Number(editForm.discount_pct)||0 }),
      });
      if (!r.ok) throw new Error();
      localStorage.setItem(EDIT_KEY, '1');
      setEditOpen(false);
      window.location.reload();
    } catch { setEditError(t('Failed to save. Try again.')); }
    setEditSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`${API}/courses/${course.id}`, { method: 'DELETE' });
    setDeleting(false);
    setConfirmDel(false);
    onDeleted?.(course.id);
  }

  const full       = Number(course.full_price||0);
  const pct        = Number(course.discount_pct||0);
  const final      = pct > 0 ? full*(1-pct/100) : full;
  const isFree     = full === 0;
  const hasDisc    = !isFree && pct > 0;
  const instructor = firstWord(course.instructor_name) || course.creator_email?.split('@')[0] || t('csp.instructor');
  const iColor     = getTint(instructor);
  // "Role • city" — each half only when the instructor's profile has it.
  const subline    = [course.instructor_title, course.instructor_region].filter(Boolean).join(' • ');
  const rating     = Number(course.avg_rating||0);
  const students   = Number(course.total_students||0);
  // Lesson, review and duration figures only exist on responses from a backend that
  // computes them; when a field is absent, show nothing rather than a made-up "0".
  const lessons    = course.lesson_count == null ? null : Number(course.lesson_count);
  const reviews    = course.review_count == null ? null : Number(course.review_count);
  const minutes    = course.total_duration_min == null ? null : Number(course.total_duration_min);
  const detailHref = `/courses/${course.id}`;

  return (
    <article className="ds-card ds-card-hover relative flex flex-col p-5 lg:p-6">

      {/* Instructor · owner menu */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/profile/${encodeURIComponent(course.creator_email)}`} className="flex min-w-0 items-center gap-3">
          <span className="relative flex-none">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold"
              style={{ background: iColor + '28', color: iColor, boxShadow: `inset 0 0 0 1px ${iColor}45` }}>
              {getInits(instructor) || '?'}
            </span>
            <span className="ds-verified absolute -bottom-1 -end-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ds-fill text-white ring-2 ring-ds-card" title={t('Verified')}>
              <Icon name="check" size={12} />
            </span>
          </span>
          <span className="min-w-0">
            <span dir="auto" className="block truncate text-[14px] font-bold leading-tight text-ds-ink">{instructor}</span>
            {subline && <span dir="auto" className="mt-0.5 block truncate text-xs text-ds-mute">{subline}</span>}
          </span>
        </Link>

        {isOwner && (
          <div className="relative z-[3] flex-none">
            <button type="button" onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen}
              aria-label={t('Edit course')} className="ds-iconbtn ds-iconbtn-boxed !h-8 !w-8">
              <Icon name="more_vert" size={18} />
            </button>
            {menuOpen && (
              <div role="menu" className="ds-pop absolute end-0 top-9 z-50 min-w-[11rem] overflow-hidden">
                <button type="button" role="menuitem" disabled={alreadyEdited}
                  onClick={() => { if (!alreadyEdited) { setMenuOpen(false); setEditOpen(true); } }}
                  className={`ds-menuitem !py-2.5 !text-[13px] font-semibold ${alreadyEdited ? 'cursor-not-allowed opacity-60' : '!text-ds-accent'}`}>
                  <Icon name="edit" size={16} />
                  <span className="flex-1">{alreadyEdited ? t('Already edited') : t('Edit course')}</span>
                  {alreadyEdited && <span className="rounded bg-ds-high px-1.5 py-px text-[10px] font-bold text-ds-mute">1×</span>}
                </button>
                {!alreadyEdited && <p className="m-0 px-3.5 pb-2 text-[10.5px] leading-[1.4] text-ds-faint">{t('One-time edit only')}</p>}
                <div className="mx-2.5 h-px bg-ds-line" />
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setConfirmDel(true); }}
                  className="ds-menuitem !py-2.5 !text-[13px] font-semibold !text-ds-bad">
                  <Icon name="delete" size={16} />{t('Delete course')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 dir="auto" className="m-0 mt-4 text-[18px] font-extrabold leading-[1.3] tracking-[-0.015em] text-ds-ink lg:text-[19px]">
        <Link to={detailHref} className="transition-colors hover:text-ds-accent">{course.title}</Link>
      </h3>

      {/* Rating · video length · chapters · learners */}
      <p className="m-0 mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-ds-mute">
        {rating > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Icon name="star" size={15} fill className="text-ds-warn" />
            <strong className="font-bold tabular-nums text-ds-ink">{rating.toFixed(1)}</strong>
            {reviews != null && <span className="tabular-nums text-ds-faint">({t('fp.reviews', { count: reviews })})</span>}
          </span>
        ) : (
          <span className="font-semibold text-ds-accent">{t('home.ff.new')}</span>
        )}
        {minutes > 0 && <><Dot /><span>{t('csp.video_length', { duration: fmtDuration(minutes) })}</span></>}
        {lessons > 0 && <><Dot /><span>{t('csp.chapters', { count: lessons })}</span></>}
        {students > 0 && <><Dot /><span>{t('csp.learners', { count: students, formatted: fmtNum(students) })}</span></>}
      </p>

      {course.category && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="ds-tag">{t(course.category)}</span>
        </div>
      )}

      {/* Price · actions */}
      <div className="mt-auto pt-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-ds-line pt-4">
        <div className="min-w-0 pt-1">
          <span className="block text-[11px] font-semibold text-ds-faint">{t('csp.price_label')}</span>
          {isFree ? (
            <span className="text-[20px] font-extrabold leading-tight text-ds-accent">{t('cc.free')}</span>
          ) : hasDisc ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <bdi className="text-[20px] font-extrabold leading-tight tabular-nums text-ds-bad">{final.toFixed(0)} <span className="text-[12px] font-bold">TND</span></bdi>
              <span className="text-xs tabular-nums text-ds-faint line-through">{full.toFixed(0)}</span>
              <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">-{pct}%</span>
            </span>
          ) : (
            <bdi className="text-[20px] font-extrabold leading-tight tabular-nums text-ds-ink">{full.toFixed(0)} <span className="text-[12px] font-bold">TND</span></bdi>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-none">
          <Link to={`${detailHref}?tab=curriculum`} className="ds-btn ds-btn-tonal ds-btn-sm flex-1 !rounded-lg sm:flex-none">{t('csp.programme')}</Link>
          <Link to={detailHref} className="ds-btn ds-btn-primary ds-btn-sm flex-1 !rounded-lg sm:flex-none">{t('csp.follow')}</Link>
        </div>
      </div>
      </div>

      {/* ── Delete confirmation ── */}
      {confirmDel && createPortal(
        <ModalShell onClose={() => setConfirmDel(false)} maxWidth={380} labelledBy={`del-${course.id}`}>
          <h3 id={`del-${course.id}`} className="m-0 mb-2 pe-8 text-[17px] font-extrabold text-ds-ink">{t('Delete this course?')}</h3>
          <p className="mb-6 mt-0 text-[13px] text-ds-mute">{t('This action cannot be undone.')}</p>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setConfirmDel(false)} className="ds-btn ds-btn-glass flex-1">{t('Cancel')}</button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="ds-btn flex-1 bg-red-500 text-white hover:bg-red-600"
              style={{ boxShadow: '0 8px 20px -8px rgba(239,68,68,.6)' }}>
              {deleting ? t('Deleting…') : t('Delete')}
            </button>
          </div>
        </ModalShell>,
        document.body
      )}

      {/* ── Edit modal ── */}
      {editOpen && createPortal(
        <ModalShell onClose={() => setEditOpen(false)} labelledBy={`edit-${course.id}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 id={`edit-${course.id}`} className="m-0 text-[19px] font-extrabold text-ds-ink">{t('Edit course')}</h3>
            <button type="button" onClick={() => setEditOpen(false)} aria-label={t('Cancel')} className="ds-iconbtn ds-iconbtn-boxed"><Icon name="close" size={20} /></button>
          </div>

          <p className="mb-5 flex items-start gap-2 rounded-xl border border-ds-warn/30 bg-ds-warn/10 px-3 py-2.5 text-xs font-semibold leading-[1.4] text-ds-warn">
            <Icon name="warning" size={17} className="flex-none" />
            <span>{t('You can only edit this course once. This action cannot be repeated.')}</span>
          </p>

          <div className="flex flex-col gap-3.5">
            <div>
              <FieldLabel required>{t('Title')}</FieldLabel>
              <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} maxLength={120} className="ds-input text-[14px]" />
            </div>
            <div>
              <FieldLabel>{t('Description')}</FieldLabel>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={800}
                className="ds-input min-h-[80px] resize-y text-[14px]" />
            </div>
            <div>
              <FieldLabel>{t('Category')}</FieldLabel>
              <div className="relative">
                <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="ds-input pe-10 text-[14px]">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
                <Icon name="expand_more" size={20} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ds-faint" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>{t('Price')} (TND)</FieldLabel>
                <input type="number" min="0" step="0.01" value={editForm.full_price} onChange={e => setEditForm(p => ({ ...p, full_price: e.target.value }))} className="ds-input text-[14px]" />
              </div>
              <div>
                <FieldLabel>{t('Discount')} (%)</FieldLabel>
                <input type="number" min="0" max="100" step="1" value={editForm.discount_pct} onChange={e => setEditForm(p => ({ ...p, discount_pct: e.target.value }))} className="ds-input text-[14px]" />
              </div>
            </div>
          </div>

          {editError && <p role="alert" className="mb-0 mt-3 text-[12.5px] font-semibold text-ds-bad">{editError}</p>}

          <div className="mt-5 flex gap-2.5">
            <button type="button" onClick={() => setEditOpen(false)} className="ds-btn ds-btn-glass flex-1">{t('Cancel')}</button>
            <button type="button" onClick={handleEdit} disabled={editSaving} className="ds-btn ds-btn-primary flex-[2]">
              {editSaving ? t('Saving…') : t('Save changes')}
            </button>
          </div>
        </ModalShell>,
        document.body
      )}
    </article>
  );
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="ds-card flex flex-col gap-4 p-5 lg:p-6" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="ds-skeleton h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="ds-skeleton h-3.5 w-1/3 rounded-md" />
          <div className="ds-skeleton h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <div className="ds-skeleton h-5 w-4/5 rounded-md" />
      <div className="ds-skeleton h-3 w-3/5 rounded-md" />
      <div className="ds-skeleton mt-2 h-10 w-full rounded-lg" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses,         setCourses]         = useState([]);
  const [total,           setTotal]           = useState(null);
  const [totalPages,      setTotalPages]      = useState(1);
  const [page,            setPage]            = useState(1);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState(searchParams.get('q') || '');
  const [debSearch,       setDebSearch]       = useState(searchParams.get('q') || '');
  const [category,        setCategory]        = useState('All');
  const [sort,            setSort]            = useState('rating');
  const [priceFilter,     setPriceFilter]     = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const PAGE_SIZE = 10;

  // Catalog-wide figures (courses, categories, instructors, enrollments) come from the
  // public stats endpoint — not from the filtered list, so they no longer change when a
  // category is picked — and refresh while the page stays open.
  const { data: stats, loading: statsLoading } = useLivePoll(loadCourseStats);

  useEffect(() => {
    const tmr = setTimeout(() => setDebSearch(search), 320);
    return () => clearTimeout(tmr);
  }, [search]);

  // Any filter change invalidates the current page — start back at page 1.
  useEffect(() => { setPage(1); }, [debSearch, category, sort, priceFilter]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sort, page: String(page), limit: String(PAGE_SIZE) });
      if (debSearch)            p.set('search', debSearch.trim());
      if (category !== 'All')   p.set('category', category);
      if (priceFilter==='free') p.set('max_price','0');
      if (priceFilter==='paid') p.set('min_price','0.01');
      const url = `${API}/courses?${p}`;
      let d = await fetch(url).then(r => r.json());
      // A transient 429/500 (e.g. right as Neon wakes from an idle suspend)
      // returns a non-array error body — retry once instead of silently
      // showing "no courses" for a request that never actually succeeded.
      if (!d || !Array.isArray(d.rows)) {
        await new Promise(res => setTimeout(res, 2000));
        d = await fetch(url).then(r => r.json());
      }
      if (d && Array.isArray(d.rows)) {
        setCourses(d.rows);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      }
    } catch { /* leave existing courses in place rather than wiping to empty */ }
    finally  { setLoading(false); }
  }, [debSearch, category, sort, priceFilter, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useBodyScrollLock(showCreateModal);

  const isFreelancer = user?.role === 'freelancer';

  // The header's "Proposer un cours" button arrives here as ?create=1: open the form
  // (freelancers only) and tidy the address bar.
  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    if (isFreelancer) setShowCreateModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, isFreelancer]);

  const colon = i18n.language === 'fr' ? ' : ' : ': ';
  // The supplied screen words the options "Trier par : Mieux notés … Prix : Croissant".
  const by = label => `${t('ds.sort_by')}${colon}${label}`;
  const sortOptions = [
    { value: 'rating',     label: by(t('Top rated')) },
    { value: 'newest',     label: by(t('Newest')) },
    { value: 'price_asc',  label: t('csp.sort_price_asc') },
    { value: 'price_desc', label: t('csp.sort_price_desc') },
    { value: 'popular',    label: by(t('Most popular')) },
    { value: 'free_first', label: by(t('Free first')) },
  ];
  const sortLabel = t('ds.sort_by');
  const categoryOptions = [
    { value: 'All', label: t('csp.all_categories') },
    ...CATEGORIES.filter(c => c !== 'All').map(c => ({ value: c, label: t(c) })),
  ];
  const priceTabs = [['all', t('All')], ['free', t('cc.free')], ['paid', t('csp.paid')]];
  // Price filter as a segmented control: full width (three equal segments) on a
  // phone, a compact pill inside the sticky bar from tablet up.
  const priceSegment = (className = '') => (
    <div role="group" aria-label={t('Price')} className={`flex flex-none rounded-full border border-ds-line bg-ds-high p-0.5 ${className}`}>
      {priceTabs.map(([v, l]) => (
        <button key={v} type="button" onClick={() => setPriceFilter(v)} aria-pressed={priceFilter === v}
          className={`flex-1 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors md:py-1.5 ${priceFilter === v ? 'bg-ds-fill text-white shadow-ds-btn' : 'text-ds-mute hover:text-ds-ink'}`}>
          {l}
        </button>
      ))}
    </div>
  );
  // "Affichage de 1 à 10 sur 28 cours" — the caption the supplied screen puts at the
  // end of the section header.
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to   = total ? Math.min(page * PAGE_SIZE, total) : 0;
  const caption = total > 0 && (
    <p className="m-0 text-[13px] text-ds-mute">
      <Trans i18nKey="ds.showing" values={{ from, to, total }} components={{ b: <strong className="font-bold text-ds-ink" /> }} /> {t('csp.courses_lower')}
    </p>
  );

  return (
    <div className="ds relative min-h-screen bg-ds-canvas pt-[66px] text-ds-ink">
      <SEOHead
        title="Cours en ligne en Tunisie"
        url="/courses"
        description="Apprenez de nouvelles compétences avec les meilleurs formateurs tunisiens. Cours de développement, design, marketing et plus sur FamaMennou."
        keywords="cours en ligne tunisie, formation freelance, apprendre développement, cours design, cours marketing tunisie, e-learning tunisie"
      />

      <MarketHero
        title={<>{t('csp.hero_title_1')}<br className="hidden md:block" />{' '}<span className="text-ds-accent">{t('csp.hero_title_2')}</span></>}
        subtitle={t('csp.hero_subtitle')}
        search={search} onSearch={setSearch} onSubmit={() => setDebSearch(search)}
        placeholder={t('csp.search_ph')}
        select={{ value: category, onChange: setCategory, options: categoryOptions, label: t('Category') }}
        submitLabel={t('csp.search_btn')}
        stats={[
          <StatCard key="c" value={stats?.courses}     label={t('csp.stat_courses')}     loading={statsLoading} accent compact />,
          <StatCard key="k" value={stats?.categories}  label={t('csp.stat_categories')}  loading={statsLoading} compact />,
          <StatCard key="i" value={stats?.instructors} label={t('csp.stat_instructors')} loading={statsLoading} compact />,
          <StatCard key="e" value={stats?.enrollments} label={t('csp.stat_enrollments')} loading={statsLoading} compact />,
        ]}
      >
        {/* Offer a course — freelancers only */}
        {isFreelancer && (
          <div className="mt-5">
            <button type="button" onClick={() => setShowCreateModal(true)} className="ds-btn ds-btn-primary ds-btn-lg">
              <Icon name="add" size={20} />{t('nav.cta_course')}
            </button>
          </div>
        )}
      </MarketHero>

      {/* ── Filters: chips · price · sort. On a phone the chips scroll sideways and the bar stays
          pinned under the header; from tablet up the chips wrap onto a second line instead of hiding
          behind a scroll bar, and the bar scrolls with the page. ── */}
      <div className="sticky top-[calc(66px+var(--fm-announcement-h,0px))] z-20 border-b border-ds-line bg-ds-canvas/90 backdrop-blur-lg md:static">
        <div className="ds-wrap flex items-center gap-4 py-2.5 md:py-3.5">
          <CategoryPills value={category} onChange={setCategory} label={t('Category')} allCount={stats?.courses}
            className="-mx-5 min-w-0 flex-1 px-5 md:mx-0 md:flex-wrap md:px-0" />
          <div className="hidden flex-none items-center gap-3 border-s border-ds-line ps-4 md:flex">
            {priceSegment()}
            <SortSelect value={sort} onChange={setSort} options={sortOptions} label={sortLabel} className="w-[15.5rem]" />
          </div>
        </div>
      </div>

      {/* ── Section header + course grid ── */}
      <div className="ds-wrap pt-4 md:pt-8">
        {/* Phone: price filter and sort on their own full-width rows */}
        <div className="mb-4 flex flex-col gap-3 md:hidden">
          {priceSegment('w-full')}
          <SortSelect value={sort} onChange={setSort} options={sortOptions} label={sortLabel} className="w-full" />
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 md:mb-5 md:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-[18px] w-[3px] flex-none rounded-full bg-ds-accent" aria-hidden="true" />
            <h2 className="m-0 text-[15px] font-bold text-ds-ink-2">
              {category === 'All' ? t('csp.all_courses') : t(category)}
            </h2>
          </div>
          {caption}
        </div>

        {/* key={`${page}-${loading}`}: a fresh key on every page change (and on
            the loading->loaded flip) makes AnimatePresence smoothly cross-fade
            in whatever replaces it, instead of the grid just snapping to the
            new page instantly. */}
        <AnimatePresence mode="wait">
          <motion.div key={`${page}-${loading}`}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.25, ease:'easeOut' }}>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="ds-card px-5 py-16 text-center">
                <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] border border-ds-accent-line bg-ds-accent-soft text-ds-accent">
                  <Icon name="menu_book" size={30} />
                </span>
                <p className="m-0 text-lg font-extrabold text-ds-ink">{t('csp.no_courses_found')}</p>
                <p className="mb-5 mt-2 text-[13px] leading-[1.6] text-ds-mute">
                  {search ? t('csp.no_results_for', { query: search }) : (category === 'All' && priceFilter === 'all') ? t('csp.catalog_empty') : t('csp.adjust_filters')}
                </p>
                {(search || category !== 'All' || priceFilter !== 'all') && (
                  <button type="button" className="ds-btn ds-btn-glass ds-btn-sm"
                    onClick={() => { setSearch(''); setCategory('All'); setPriceFilter('all'); }}>
                    {t('csp.clear_filters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {courses.map(c => (
                  <CourseCard key={c.id} course={c} onDeleted={id => setCourses(prev => prev.filter(x => x.id !== id))} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <Pagination page={page} totalPages={totalPages} total={total || 0} limit={PAGE_SIZE} showCaption={false}
          onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          loading={loading} />
      </div>

      <TrustBand
        eyebrow={t('csp.why_eyebrow')}
        heading={t('csp.why_heading')}
        items={[
          { icon: 'school',           title: t('csp.why1.title'), text: t('csp.why1.text') },
          { icon: 'fact_check',       title: t('csp.why2.title'), text: t('csp.why2.text') },
        ]}
      />

      {/* ══ Create Course Modal ══ */}
      {showCreateModal && user && (
        <CreateCourseModal
          user={user}
          initialType="paid"
          onClose={() => setShowCreateModal(false)}
          onBack={null}
          onCreated={fetchCourses}
        />
      )}
    </div>
  );
}
