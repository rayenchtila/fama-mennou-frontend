import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cldImg } from '../utils/cloudinary';

const API = "https://famamennou-server.onrender.com/api";

const AVATAR_GRADIENTS = [
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

function Stars({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)} onMouseLeave={() => !readonly && setHovered(0)}
          className={[sz, 'transition-colors', readonly ? 'cursor-default' : 'cursor-pointer',
            i <= (hovered || value) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'].join(' ')}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

function ClientCard({ client, reviews, onAddReview, currentUser, projects }) {
  const navigate = useNavigate();
  const [showForm,       setShowForm]       = useState(false);
  const [newRating,      setNewRating]      = useState(0);
  const [newComment,     setNewComment]     = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [ratingError,    setRatingError]    = useState(false);
  const [expanded,       setExpanded]       = useState(false);

  const key           = client.email?.toLowerCase();
  const myReviews     = reviews[key] || [];
  const avgRating     = myReviews.length > 0 ? myReviews.reduce((s,r) => s+r.rating,0)/myReviews.length : 0;
  const isOwnCard     = currentUser?.email?.toLowerCase() === key;
  const isFreelancer  = currentUser?.role === 'freelancer';
  const alreadyReviewed = currentUser && myReviews.some(r => r.freelancerEmail === currentUser.email?.toLowerCase());
  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 2);
  const grad = AVATAR_GRADIENTS[(key?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];

  function handleSubmit(e) {
    e.preventDefault();
    if (!newRating) { setRatingError(true); return; }
    if (!newComment.trim()) return;
    onAddReview(key, { freelancerName: currentUser.name, freelancerEmail: currentUser.email?.toLowerCase(), rating: newRating, comment: newComment.trim() });
    setShowForm(false); setNewRating(0); setNewComment(''); setRatingError(false);
  }

  return (
    <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden hover:shadow-2xl hover:shadow-brand-cyan/10 hover:border-brand-cyan/30 hover:-translate-y-1 transition-all duration-300 flex flex-col group">

      {/* Cover */}
      <div className={`h-20 bg-gradient-to-br ${grad} opacity-80 relative`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
        {myReviews.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
            <svg className="w-3 h-3 text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-white text-[10px] font-bold">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Avatar overlap */}
      <div className="px-5 pb-0 -mt-8 flex items-end justify-between">
        <div className="w-16 h-16 rounded-2xl ring-4 ring-white dark:ring-slate-900 shadow-lg relative">
          {client.photo
            ? <img src={cldImg(client.photo)} alt={client.name} className="w-full h-full object-cover rounded-2xl" />
            : <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-lg`}>{client.name?.slice(0, 2).toUpperCase()}</div>
          }
        </div>
        <span className="mb-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
          Client ✓
        </span>
      </div>

      <div className="px-5 pt-3 pb-5 flex flex-col flex-1">
        {/* Name + location */}
        <div className="mb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{client.name?.split(' ')[0]}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {client.region || 'Tunisie'}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <Stars value={Math.round(avgRating)} readonly size="sm" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
          <span className="text-xs text-slate-400">({myReviews.length} avis)</span>
        </div>

        {/* Bio */}
        {client.bio && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2">{client.bio}</p>
        )}

        {/* Project for this card */}
        {projects && projects.length > 0 && (
          <div className="space-y-2 mb-4">
            {projects.map(p => (
              <div key={p.id} className="bg-slate-800/60 border border-white/5 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">{p.title}</p>
                  {p.budget && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shrink-0">
                      💰 {p.budget} TND
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300">🎯 {p.experience || '—'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300">⏱️ {p.period || '—'}</span>
                  {p.created_at && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                      📅 {new Date(p.created_at).toLocaleString('fr-TN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.keywords && p.keywords.split(/\s+/).filter(Boolean).length > 0
                    ? p.keywords.split(/\s+/).filter(Boolean).map((kw, i) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">
                          {kw}
                        </span>
                      ))
                    : <span className="text-[10px] text-slate-400">Mots clés : —</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Member since */}
        {client.registeredAt && (
          <div className="flex items-center gap-1.5 mb-4">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="text-[10px] text-slate-400">Membre depuis {new Date(client.registeredAt).toLocaleDateString('fr-TN', { month: 'long', year: 'numeric' })}</span>
          </div>
        )}

        {/* Expanded: reviews + form */}
        {expanded && (
          <div className="space-y-3 mb-4">
            {myReviews.length > 0 ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avis des freelancers</p>
                <div className="space-y-2">
                  {displayedReviews.map((r, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {r.freelancerName?.slice(0,2).toUpperCase()}
                        </div>
                        <Stars value={r.rating} readonly size="sm" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{r.freelancerName}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                  {myReviews.length > 2 && (
                    <button onClick={() => setShowAllReviews(v => !v)} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
                      {showAllReviews ? 'Voir moins' : `Voir ${myReviews.length - 2} avis de plus`}
                    </button>
                  )}
                </div>
              </div>
            ) : !showForm && (
              <div className="flex items-center gap-2 py-3 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p className="text-xs text-slate-400 dark:text-slate-500">Aucun avis pour le moment.</p>
              </div>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-2.5 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800/40">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Votre avis sur ce client</p>
                <Stars value={newRating} onChange={v => { setNewRating(v); setRatingError(false); }} />
                {ratingError && <p className="text-[11px] text-rose-500">Choisissez une note avant d'envoyer.</p>}
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Votre commentaire..." rows={2}
                  className="w-full text-xs rounded-xl border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                <div className="flex gap-2">
                  <button type="submit" disabled={!newComment.trim()} className="flex-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl transition-colors disabled:opacity-50">Envoyer</button>
                  <button type="button" onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); setRatingError(false); }} className="flex-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl transition-colors">Annuler</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {isFreelancer && !isOwnCard && (
            <button onClick={() => navigate(`/messages?with=${encodeURIComponent(client.email)}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-violet hover:shadow-lg hover:shadow-brand-cyan/30 text-white text-xs font-bold transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Envoyer un message
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => setExpanded(v => !v)}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1">
              {expanded ? 'Réduire' : 'Voir profil'}
              <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {isFreelancer && !isOwnCard && !alreadyReviewed && !showForm && (
              <button onClick={() => { setExpanded(true); setShowForm(true); }}
                className="flex-1 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-100 transition-colors">
                ⭐ Laisser un avis
              </button>
            )}
          </div>
          {isOwnCard && <p className="text-[10px] text-slate-400 text-center">Votre profil client</p>}
          {alreadyReviewed && <p className="text-[10px] text-slate-400 text-center">Vous avez déjà laissé un avis.</p>}
        </div>
      </div>
    </div>
  );
}

const INDUSTRIES = ['All','Technology','Design','Marketing','Finance','E-commerce','Education','Health'];

export default function ClientsPage() {
  const { users, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search,   setSearch]   = useState(searchParams.get('q') || '');
  const [industry, setIndustry] = useState('All');
  const [sortBy,   setSortBy]   = useState('rating');
  const [reviews,  setReviews]  = useState({});
  const [openProjects, setOpenProjects] = useState([]);

  const approvedClients = (users || []).filter(u => u?.role === 'client' && u?.cinStatus === 'approved');

  useEffect(() => {
    fetch(`${API}/projects/browse/open`).then(r => r.json()).then(d => { if (Array.isArray(d)) setOpenProjects(d); }).catch(() => {});
  }, []);

  const projectsByClient = openProjects.reduce((acc, p) => {
    const key = p.client_email?.toLowerCase();
    if (!key) return acc;
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  const fetchAllReviews = useCallback(async () => {
    try {
      const emails = approvedClients.map(u => u.email);
      const results = await Promise.all(emails.map(email => fetch(`${API}/client-reviews/${encodeURIComponent(email)}`).then(r => r.json()).catch(() => [])));
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i] || []).map(r => ({ freelancerName: r.freelancer_name, freelancerEmail: r.freelancer_email, rating: r.rating, comment: r.comment }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  useEffect(() => { fetchAllReviews(); }, [fetchAllReviews]);

  const INDUSTRY_KEYWORDS = {
    Technology:  ['tech', 'software', 'it ', 'digital', 'developer', 'startup', 'saas', 'app'],
    Design:      ['design', 'creative', 'visual', 'brand', 'ui', 'ux', 'graphic'],
    Marketing:   ['marketing', 'ads', 'seo', 'social media', 'content', 'growth', 'campaign'],
    Finance:     ['finance', 'bank', 'invest', 'accounting', 'fintech', 'insurance', 'audit'],
    'E-commerce':['ecommerce', 'e-commerce', 'shop', 'retail', 'store', 'boutique', 'vente'],
    Education:   ['education', 'school', 'training', 'formation', 'learning', 'teach'],
    Health:      ['health', 'medical', 'clinic', 'pharma', 'santé', 'wellness', 'hospital'],
  };

  const filtered = approvedClients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q) || c.bio?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
    const haystack = `${c.bio || ''} ${c.company || ''}`.toLowerCase();
    const matchIndustry = industry === 'All' || haystack.includes(industry.toLowerCase()) ||
      (INDUSTRY_KEYWORDS[industry] || []).some(kw => haystack.includes(kw));
    return matchSearch && matchIndustry;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      const ra = reviews[a.email?.toLowerCase()]?.reduce((s,r) => s+r.rating,0) / (reviews[a.email?.toLowerCase()]?.length||1) || 0;
      const rb = reviews[b.email?.toLowerCase()]?.reduce((s,r) => s+r.rating,0) / (reviews[b.email?.toLowerCase()]?.length||1) || 0;
      return rb - ra;
    }
    return a.name?.localeCompare(b.name);
  });

  async function handleAddReview(clientKey, review) {
    try {
      await fetch(`${API}/client-reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientEmail: clientKey, freelancerEmail: review.freelancerEmail, freelancerName: review.freelancerName, rating: review.rating, comment: review.comment }) });
      fetchAllReviews();
    } catch {}
  }

  const totalReviews = Object.values(reviews).flat().length;

  return (
    <div className="dark min-h-screen bg-slate-950 overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-950 pt-24 pb-14 px-4 overflow-hidden min-h-[420px] flex flex-col justify-center">
        <div className="absolute -top-32 -right-24 w-96 h-96 bg-brand-cyan/25 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] bg-brand-violet/20 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold">{approvedClients.length} clients vérifiés disponibles</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Trouvez vos <span className="bg-gradient-to-r from-brand-cyan-light to-brand-violet-light bg-clip-text text-transparent">prochains</span><br className="hidden sm:block" /> clients
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Des clients tunisiens vérifiés, à la recherche de freelancers talentueux pour leurs projets.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, région…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white/5 backdrop-blur border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:bg-white/10 transition-all shadow-xl" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {[
              { label: 'Clients', value: approvedClients.length },
              { label: 'Avis reçus', value: totalReviews },
              { label: 'Régions', value: new Set(approvedClients.map(c => c.region).filter(Boolean)).size },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-white/5 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 py-3 w-max">
              {INDUSTRIES.map(ind => (
                <button key={ind} onClick={() => setIndustry(ind)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${industry === ind ? 'bg-gradient-to-r from-brand-cyan to-brand-violet text-white shadow-lg shadow-brand-cyan/30' : 'text-slate-300 hover:bg-white/5'}`}>
                  {ind}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pb-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {openProjects.filter(p => filtered.some(c => c.email?.toLowerCase() === p.client_email?.toLowerCase())).length || filtered.length} projet{openProjects.length !== 1 ? 's' : ''} ouvert{openProjects.length !== 1 ? 's' : ''}
              {search ? ` pour "${search}"` : ''}
            </p>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
              <option value="rating">Mieux notés</option>
              <option value="name">Par nom</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid — one card per project ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.flatMap(c =>
              (projectsByClient[c.email?.toLowerCase()] || []).map(p => (
                <ClientCard key={`${c.email}-${p.id}`} client={c} reviews={reviews} onAddReview={handleAddReview} currentUser={user} projects={[p]} />
              ))
            ).concat(
              filtered
                .filter(c => !(projectsByClient[c.email?.toLowerCase()]?.length))
                .map(c => <ClientCard key={c.email} client={c} reviews={reviews} onAddReview={handleAddReview} currentUser={user} projects={[]} />)
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun client trouvé</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search ? 'Essayez un autre terme.' : 'Aucun client vérifié pour le moment.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition-colors">
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
