import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreateCourseModal from '../components/CreateCourseModal';

const API = 'https://famamennou-server.onrender.com/api';

const CATEGORIES = ['All','Design','Development','Marketing','Business','Music','Photography','Finance','Health','Other'];

const SORT_OPTIONS = [
  { value: 'free_first',  label: 'Free First' },
  { value: 'newest',      label: 'Newest' },
  { value: 'popular',     label: 'Most Popular' },
  { value: 'rating',      label: 'Highest Rated' },
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
];

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
        </svg>
      ))}
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const isFree = Number(course.full_price) === 0;
  const instructorFirst = (course.instructor_name || course.creator_email?.split('@')[0] || '').split(' ')[0];
  return (
    <button onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left group w-full">
      <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
        }
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-400">
          {course.category}
        </span>
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isFree ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
          {isFree ? 'Gratuit' : '🔒 Payant'}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
          {instructorFirst}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={course.avg_rating} />
          <span className="text-[10px] text-slate-400">({course.total_students})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-base font-extrabold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
            {isFree ? 'Gratuit' : `${Number(course.full_price).toFixed(2)} TND`}
          </span>
          <span className="text-[10px] text-slate-400">{course.lesson_count ?? 0} lessons</span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInstructor = user?.role === 'freelancer';

  const [courses,       setCourses]       = useState([]);
  const [recommended,   setRecommended]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('All');
  const [sort,          setSort]          = useState('free_first');
  const [priceFilter,   setPriceFilter]   = useState('all');
  const [minRating,     setMinRating]     = useState(0);

  const [showTypeModal,   setShowTypeModal]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType,      setCreateType]      = useState('free');
  const [selectedType,    setSelectedType]    = useState('free');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sort });
      if (search)                 p.set('search', search);
      if (category !== 'All')     p.set('category', category);
      if (priceFilter === 'free') p.set('max_price', '0');
      if (priceFilter === 'paid') p.set('min_price', '0.01');
      if (minRating > 0)          p.set('min_rating', minRating);
      const r = await fetch(`${API}/courses?${p}`);
      const d = await r.json();
      if (Array.isArray(d)) setCourses(d);
    } catch { setCourses([]); }
    finally  { setLoading(false); }
  }, [search, category, sort, priceFilter, minRating]);

  const fetchRecommended = useCallback(async () => {
    try {
      const r = await fetch(`${API}/courses/recommended`);
      const d = await r.json();
      if (Array.isArray(d)) setRecommended(d);
    } catch {}
  }, []);

  useEffect(() => { fetchCourses(); },    [fetchCourses]);
  useEffect(() => { fetchRecommended(); }, [fetchRecommended]);

  // Lock page scroll whenever any modal is open
  useEffect(() => {
    const lock = showTypeModal || showCreateModal;
    document.body.style.overflow            = lock ? 'hidden' : '';
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    return () => {
      document.body.style.overflow            = '';
      document.documentElement.style.overflow = '';
    };
  }, [showTypeModal, showCreateModal]);

  const instructors  = new Set(courses.map(c => c.creator_email)).size;
  const freeCourses  = courses.filter(c => Number(c.full_price) === 0);
  const paidCourses  = courses.filter(c => Number(c.full_price) > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">

      {/* ── Hero — same structure as Find Freelancers & Find Clients ── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-24 pb-14 px-4 overflow-hidden min-h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.3),transparent_60%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold">{courses.length} cours disponibles</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Parcourez les cours<br className="hidden sm:block" /> professionnels
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Enseignés par des freelancers experts. Apprenez à votre rythme. Obtenez des certificats.
          </p>

          {/* Search bar — identical classes to Find pages */}
          <div className="relative max-w-lg mx-auto mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher des cours…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white/10 backdrop-blur border border-white/20 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all" />
          </div>

          {/* Create Course button */}
          <button onClick={() => setShowTypeModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-md mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Créer un cours
          </button>

          {/* Stats row — identical layout to Find pages */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {[
              { label: 'Cours',        value: courses.length },
              { label: 'Catégories',   value: CATEGORIES.length - 1 },
              { label: 'Instructeurs', value: instructors },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] text-emerald-200 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar — identical structure to Find pages ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Category chips */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 py-3 w-max">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Count + extra filters row */}
          <div className="flex items-center justify-between pb-3 gap-2 flex-wrap">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {!loading && `${courses.length} cours trouvé${courses.length !== 1 ? 's' : ''}${search ? ` pour "${search}"` : ''}${category !== 'All' ? ` · ${category}` : ''}`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Price filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                {[['all','Tous'],['free','Gratuit'],['paid','Payant']].map(([v,l]) => (
                  <button key={v} onClick={() => setPriceFilter(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                      priceFilter === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Rating filter */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                {[[0,'Tous'],[3,'3+'],[4,'4+'],[4.5,'4.5+']].map(([v,l]) => (
                  <button key={v} onClick={() => setMinRating(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                      minRating === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {v === 0 ? '⭐ Tous' : `⭐ ${l}`}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Recommendations — shown only when not searching/filtering */}
        {!search && category === 'All' && recommended.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⭐</span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Recommandés pour vous</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">· Basé sur la popularité et les avis</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommended.slice(0, 4).map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />
              ))}
            </div>
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800" />
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_,i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Free courses — always first */}
        {!loading && freeCourses.length > 0 && priceFilter !== 'paid' && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎁</span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Cours gratuits</h2>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{freeCourses.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {freeCourses.map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Paid courses — always after free */}
        {!loading && paidCourses.length > 0 && priceFilter !== 'free' && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔒</span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Cours payants</h2>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{paidCourses.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paidCourses.map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun cours trouvé</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search ? 'Essayez un autre terme de recherche.' : 'Modifiez vos filtres ou votre recherche.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors">
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Free / Paid type chooser — pill toggle ── */}
      {showTypeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Type de cours</p>
              <button onClick={() => { setShowTypeModal(false); setSelectedType('free'); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Pill toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
              <button onClick={() => setSelectedType('free')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  selectedType === 'free'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                </svg>
                Gratuit
              </button>
              <button onClick={() => setSelectedType('paid')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  selectedType === 'paid'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Payant
              </button>
            </div>

            {/* Description */}
            <div className={`rounded-2xl px-4 py-3 mb-6 text-center transition-all duration-200 ${
              selectedType === 'free'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40'
            }`}>
              {selectedType === 'free' ? (
                <>
                  <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mb-0.5">Accessible à tous</p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500">Partagez vos connaissances gratuitement avec la communauté</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-extrabold text-amber-700 dark:text-amber-400 mb-0.5">Générez des revenus</p>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-500">Monétisez votre expertise · Commission plateforme 5 %</p>
                </>
              )}
            </div>

            {/* Continue button */}
            <button onClick={() => { setShowTypeModal(false); setCreateType(selectedType); setShowCreateModal(true); }}
              className={`w-full py-3 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-[.98] shadow-sm ${
                selectedType === 'free'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              }`}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── Create Course form ── */}
      {showCreateModal && user && (
        <CreateCourseModal
          user={user}
          initialType={createType}
          onClose={() => setShowCreateModal(false)}
          onBack={() => { setShowCreateModal(false); setShowTypeModal(true); }}
          onCreated={fetchCourses}
        />
      )}
    </div>
  );
}
