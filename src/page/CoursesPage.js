import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

const CATEGORIES = ['All','Design','Development','Marketing','Business','Music','Photography','Finance','Health','Other'];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Les plus récents' },
  { value: 'popular',    label: 'Les plus populaires' },
  { value: 'rating',     label: 'Mieux notés' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
        </svg>
      ))}
      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-0.5">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const isFree = Number(course.full_price) === 0;
  return (
    <button onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left group w-full">
      <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
        }
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-400 max-w-[45%] truncate">
          {course.category}
        </span>
        {course.first_lesson_free && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
            Aperçu
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
          {course.title}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 truncate">
          {course.instructor_name || course.creator_email?.split('@')[0]}
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={course.avg_rating} />
          <span className="text-[10px] text-slate-400">({course.total_students})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-extrabold ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
            {isFree ? 'Gratuit' : `${Number(course.full_price).toFixed(2)} TND`}
          </span>
          <span className="text-[10px] text-slate-400">{course.lesson_count ?? 0} leçons</span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-100 dark:bg-slate-800" />
      <div className="p-3 space-y-2">
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

  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('All');
  const [sort,        setSort]        = useState('newest');
  const [priceFilter, setPriceFilter] = useState('all');
  const [minRating,   setMinRating]   = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sort });
      if (search)             p.set('search', search);
      if (category !== 'All') p.set('category', category);
      if (priceFilter === 'free') p.set('max_price', '0');
      if (priceFilter === 'paid') p.set('min_price', '0.01');
      if (minRating > 0)      p.set('min_rating', minRating);
      const r = await fetch(`${API}/courses?${p}`);
      const d = await r.json();
      if (Array.isArray(d)) setCourses(d);
    } catch { setCourses([]); }
    finally  { setLoading(false); }
  }, [search, category, sort, priceFilter, minRating]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const isInstructor = user?.role === 'freelancer';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 pt-24 pb-14 px-4 overflow-hidden min-h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.3),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold">{courses.length} cours disponibles</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Parcourez les cours<br className="hidden sm:block" /> professionnels
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Enseignés par des freelancers experts. Apprenez à votre rythme.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher des cours…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white/10 backdrop-blur border border-white/20 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all" />
          </div>

          {isInstructor && (
            <button onClick={() => navigate('/dashboard?tab=courses')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-md">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Créer un cours — Gratuit
            </button>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-8">
            {[
              { label: 'Cours', value: courses.length },
              { label: 'Catégories', value: CATEGORIES.length - 1 },
              { label: 'Instructeurs', value: new Set(courses.map(c => c.creator_email)).size },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] text-emerald-200 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 py-3 w-max">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pb-3 gap-2 flex-wrap">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {!loading && `${courses.length} cours trouvé${courses.length !== 1 ? 's' : ''}${search ? ` pour "${search}"` : ''}${category !== 'All' ? ` · ${category}` : ''}`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                {[['all','Tous'],['free','Gratuit'],['paid','Payant']].map(([v,l]) => (
                  <button key={v} onClick={() => setPriceFilter(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${priceFilter === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                {[[0,'Tous'],[3,'3+'],[4,'4+'],[4.5,'4.5+']].map(([v,l]) => (
                  <button key={v} onClick={() => setMinRating(v)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${minRating === v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                    {v === 0 ? '⭐ Tous' : `⭐ ${l}`}
                  </button>
                ))}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Instructor CTA banner */}
        {isInstructor && (
          <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-slate-700/50 shadow-xl">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.1),transparent_60%)]" />
            <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-emerald-500/10 to-transparent" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-extrabold text-white mb-1">Partagez votre expertise</p>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs">Créez un cours, touchez des milliers d'apprenants et générez des revenus passifs.</p>
                  <div className="flex items-center gap-4 mt-3">
                    {[['💰','Revenus passifs'],['👥','Large audience'],['✅','Publication rapide']].map(([icon, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="text-xs">{icon}</span>
                        <span className="text-[11px] font-semibold text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => navigate('/dashboard?tab=courses')}
                className="group shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/25 whitespace-nowrap">
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Créer mon cours
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(8)].map((_,i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aucun cours trouvé</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Modifiez vos filtres ou votre recherche</p>
            {isInstructor && (
              <button onClick={() => navigate('/dashboard?tab=courses')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                Soyez le premier à créer un cours →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {courses.map(c => (
              <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
