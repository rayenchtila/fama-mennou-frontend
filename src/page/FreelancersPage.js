import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatDrawer from '../components/ChatDrawer';
import { cldImg } from '../utils/cloudinary';

const API = "https://famamennou-server.onrender.com/api";

const SKILL_COLORS = [
  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40',
  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/40',
  'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/40',
  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/40',
  'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/40',
];

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
];

function Stars({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={[sz, 'transition-colors', readonly ? 'cursor-default' : 'cursor-pointer',
            i <= (hovered || value) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'].join(' ')}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

function Avatar({ user: u, size = 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-[10px]';
  const grad = AVATAR_GRADIENTS[(u?.email?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];
  if (u?.photo) return <img src={cldImg(u.photo)} alt={u.name} className={`${sz} rounded-2xl object-cover`} />;
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0`}>
      {u?.name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

function RealFreelancerCard({ freelancer, reviews, onAddReview, currentUser, updateUser, completedWith, onMarkComplete, allUsers, onMessage }) {
  // renamed internally but kept as list row — no card
  const [showForm,         setShowForm]         = useState(false);
  const [newRating,        setNewRating]        = useState(0);
  const [newComment,       setNewComment]       = useState('');
  const [showAllReviews,   setShowAllReviews]   = useState(false);
  const [showPortfolioForm,setShowPortfolioForm]= useState(false);
  const [portfolioType,    setPortfolioType]    = useState('image');
  const [portfolioLabel,   setPortfolioLabel]   = useState('');
  const [lightboxImg,      setLightboxImg]      = useState(null);
  const [markingComplete,  setMarkingComplete]  = useState(false);
  const [expanded,         setExpanded]         = useState(false);
  const fileRef         = useRef();
  const portfolioImgRef = useRef();
  const portfolioFileRef= useRef();

  const key           = freelancer.email?.toLowerCase();
  const myReviews     = reviews[key] || [];
  const avgRating     = myReviews.length > 0 ? myReviews.reduce((s,r) => s + r.rating, 0) / myReviews.length : 0;
  const isOwnCard     = currentUser?.email?.toLowerCase() === key;
  const isClient      = currentUser?.role === 'client';
  const alreadyReviewed = currentUser && myReviews.some(r => r.clientEmail === currentUser.email?.toLowerCase());
  const hasCompletedTask = completedWith?.includes(key);
  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 2);
  const skillTags     = freelancer.skills ? freelancer.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const portfolio     = freelancer.portfolio || [];

  async function handleMarkComplete() {
    setMarkingComplete(true);
    await onMarkComplete(key);
    setMarkingComplete(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!newRating || !newComment.trim()) return;
    onAddReview(key, { clientName: currentUser.name, clientEmail: currentUser.email?.toLowerCase(), rating: newRating, comment: newComment.trim(), createdAt: new Date().toISOString() });
    setShowForm(false); setNewRating(0); setNewComment('');
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser(freelancer.email, { photo: ev.target.result });
    reader.readAsDataURL(file);
  }

  function handlePortfolioFile(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const item = type === 'image'
        ? { type: 'image', data: ev.target.result, label: file.name }
        : { type: 'file', data: ev.target.result, label: portfolioLabel.trim() || file.name, filename: file.name };
      updateUser(freelancer.email, { portfolio: [...portfolio, item] });
    };
    reader.readAsDataURL(file);
    setPortfolioLabel(''); setShowPortfolioForm(false);
  }

  function handleRemovePortfolio(idx) {
    updateUser(freelancer.email, { portfolio: portfolio.filter((_, i) => i !== idx) });
  }

  return (
    <>
      {lightboxImg && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightboxImg(null)}>
          <img src={cldImg(lightboxImg)} alt="portfolio" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* ── List row — no card ── */}
      <div className="py-6 flex gap-4">

        {/* Small avatar — inline, not dominant */}
        <div className="relative group/av shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <Avatar user={freelancer} size="md" />
          </div>
          {isOwnCard && (
            <>
              <button onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover/av:opacity-100 flex items-center justify-center transition-opacity">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">

          {/* Meta line */}
          <p className="text-xs text-slate-500 mb-1">
            Freelancer &nbsp;·&nbsp; <span className="text-emerald-400 font-semibold">✓ Vérifié</span>
            {freelancer.registeredAt && <> &nbsp;·&nbsp; Membre depuis {new Date(freelancer.registeredAt).toLocaleDateString('fr-TN', { month: 'long', year: 'numeric' })}</>}
          </p>

          {/* Name */}
          <h3 className="text-base font-extrabold text-brand-violet-light hover:text-brand-fuchsia transition-colors cursor-default mb-1 leading-tight">
            {freelancer.name}
          </h3>

          {/* Location · Rating */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {freelancer.region || 'Tunisie'}
            </span>
            <span className="flex items-center gap-1.5">
              <Stars value={Math.round(avgRating)} readonly size="sm" />
              <span className="font-bold text-white">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <span className="text-slate-500">({myReviews.length} avis)</span>
            </span>
          </div>

          {/* Bio */}
          {freelancer.bio && (
            <p dir="auto" className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-2">{freelancer.bio}</p>
          )}

          {/* Skills */}
          {skillTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {skillTags.slice(0, 6).map((tag, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-300">
                  {tag}
                </span>
              ))}
              {skillTags.length > 6 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-white/8 text-slate-500">
                  +{skillTags.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Portfolio thumbnails */}
          {portfolio.filter(i => i.type === 'image').length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {portfolio.filter(i => i.type === 'image').slice(0, 5).map((item, idx) => (
                <button key={idx} onClick={() => setLightboxImg(item.data)}
                  className="w-14 h-10 rounded-lg overflow-hidden border border-white/10 hover:opacity-80 transition-opacity shrink-0">
                  <img src={cldImg(item.data)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {portfolio.filter(i => i.type === 'image').length > 5 && (
                <div className="w-14 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white/10 shrink-0">
                  +{portfolio.filter(i => i.type === 'image').length - 5}
                </div>
              )}
            </div>
          )}

          {/* Expanded section */}
          {expanded && (
            <div className="space-y-4 mt-4 pt-4 border-t border-white/8">
              {/* Portfolio manager */}
              {(portfolio.length > 0 || isOwnCard) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portfolio</span>
                    {isOwnCard && (
                      <button onClick={() => setShowPortfolioForm(v => !v)} className="text-[10px] font-semibold text-indigo-400 hover:underline">
                        {showPortfolioForm ? 'Annuler' : '+ Ajouter'}
                      </button>
                    )}
                  </div>
                  {showPortfolioForm && isOwnCard && (
                    <div className="bg-slate-800/60 rounded-xl p-3 mb-3 space-y-2">
                      <div className="flex gap-0.5 p-0.5 bg-slate-700 rounded-lg">
                        {[{id:'image',icon:'🖼',label:'Image'},{id:'file',icon:'📄',label:'Fichier'}].map(tab => (
                          <button key={tab.id} onClick={() => setPortfolioType(tab.id)}
                            className={['flex-1 py-1 text-[10px] font-semibold rounded-md transition-all', portfolioType === tab.id ? 'bg-slate-600 text-indigo-400 shadow-sm' : 'text-slate-400'].join(' ')}>
                            {tab.icon} {tab.label}
                          </button>
                        ))}
                      </div>
                      {portfolioType === 'image' && (
                        <button onClick={() => portfolioImgRef.current?.click()} className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors">📂 Choisir une image</button>
                      )}
                      {portfolioType === 'file' && (
                        <div className="space-y-2">
                          <input type="text" value={portfolioLabel} onChange={e => setPortfolioLabel(e.target.value)} placeholder="Titre du fichier"
                            className="w-full text-xs rounded-lg border border-white/10 bg-slate-900 text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <button onClick={() => portfolioFileRef.current?.click()} className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors">📄 Choisir un fichier</button>
                        </div>
                      )}
                      <input ref={portfolioImgRef} type="file" accept="image/*" className="hidden" onChange={e => handlePortfolioFile(e, 'image')} />
                      <input ref={portfolioFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" className="hidden" onChange={e => handlePortfolioFile(e, 'file')} />
                    </div>
                  )}
                  <div className="space-y-1">
                    {portfolio.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group/p py-1.5">
                        {item.type === 'image' && (
                          <button onClick={() => setLightboxImg(item.data)} className="flex-1 flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 text-left">
                            <img src={cldImg(item.data)} alt="" className="w-8 h-6 object-cover rounded" />
                            <span className="truncate">{item.label || 'Image'}</span>
                          </button>
                        )}
                        {item.type === 'file' && (
                          <a href={item.data} download={item.filename || item.label} className="flex-1 flex items-center gap-2 text-xs text-indigo-400 hover:underline truncate">
                            <span>📄</span><span className="truncate">{item.label || item.filename}</span>
                          </a>
                        )}
                        {isOwnCard && (
                          <button onClick={() => handleRemovePortfolio(idx)} className="opacity-0 group-hover/p:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {myReviews.length === 0 && !showForm && !isOwnCard && (
                <p className="text-xs text-slate-500">Aucun avis pour le moment.</p>
              )}
              {myReviews.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Avis clients</p>
                  <div className="space-y-2">
                    {displayedReviews.map((r, i) => {
                      const reviewer = allUsers?.find(u => u.email?.toLowerCase() === r.clientEmail?.toLowerCase());
                      return (
                        <div key={i} className="pl-3 border-l-2 border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="shrink-0">
                              {reviewer?.photo
                                ? <img src={cldImg(reviewer.photo)} alt={r.clientName} className="w-5 h-5 rounded-full object-cover" />
                                : <div className="w-5 h-5 rounded-full bg-indigo-500/70 flex items-center justify-center text-white text-[8px] font-bold">{r.clientName?.slice(0,2).toUpperCase()}</div>
                              }
                            </div>
                            <Stars value={r.rating} readonly size="sm" />
                            <span className="text-xs font-semibold text-slate-300">{r.clientName}</span>
                          </div>
                          <p dir="auto" className="text-xs text-slate-400 leading-relaxed">{r.comment}</p>
                        </div>
                      );
                    })}
                    {myReviews.length > 2 && (
                      <button onClick={() => setShowAllReviews(v => !v)} className="text-xs text-indigo-400 hover:underline">
                        {showAllReviews ? 'Voir moins' : `Voir ${myReviews.length - 2} avis de plus`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Review form */}
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-2.5 pl-3 border-l-2 border-indigo-500/40">
                  <p className="text-xs font-bold text-slate-300">Votre avis</p>
                  <Stars value={newRating} onChange={setNewRating} />
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Votre commentaire..." rows={2}
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-800 text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  <div className="flex gap-2">
                    <button type="submit" disabled={!newRating || !newComment.trim()} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl transition-colors disabled:opacity-40">Envoyer</button>
                    <button type="button" onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); }} className="text-xs font-semibold text-slate-400 hover:text-slate-300 px-3 py-1.5 transition-colors">Annuler</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {currentUser && !isOwnCard && (
              <button onClick={() => onMessage(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-fuchsia hover:opacity-90 text-white text-xs font-bold transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Envoyer un message
              </button>
            )}
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors">
              {expanded ? 'Réduire' : 'Voir profil'}
              <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {isClient && !isOwnCard && !hasCompletedTask && (
              <button onClick={handleMarkComplete} disabled={markingComplete}
                className="px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/10 transition-colors disabled:opacity-40">
                {markingComplete ? '...' : '✓ Travaillé ensemble'}
              </button>
            )}
            {isClient && !isOwnCard && hasCompletedTask && !alreadyReviewed && !showForm && (
              <button onClick={() => { setExpanded(true); setShowForm(true); }}
                className="px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/10 transition-colors">
                ⭐ Laisser un avis
              </button>
            )}
            {isOwnCard && portfolio.length === 0 && (
              <span className="text-[10px] font-semibold text-amber-500">⚠️ Ajoutez un élément au portfolio</span>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

const CATEGORIES = ['All','Design','Development','Marketing','Writing','Video','Finance','Photography'];

export default function FreelancersPage() {
  const { users, user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [search,       setSearch]       = useState(searchParams.get('q') || '');
  const [category,     setCategory]     = useState('All');
  const [sortBy,       setSortBy]       = useState('rating');
  const [reviews,      setReviews]      = useState({});
  const [completedWith,setCompletedWith]= useState([]);
  const [chatWith,     setChatWith]     = useState(null);

  const approvedFreelancers = (users || []).filter(u => u?.role === 'freelancer' && u?.cinStatus === 'approved');

  const fetchAllReviews = useCallback(async () => {
    try {
      const emails = approvedFreelancers.map(u => u.email);
      const results = await Promise.all(emails.map(email => fetch(`${API}/reviews/${encodeURIComponent(email)}`).then(r => r.json()).catch(() => [])));
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i] || []).map(r => ({ clientName: r.client_name, clientEmail: r.client_email, rating: r.rating, comment: r.comment, createdAt: r.created_at }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const fetchCompletedTasks = useCallback(async () => {
    if (!user || user.role !== 'client') return;
    try {
      const res = await fetch(`${API}/tasks/${encodeURIComponent(user.email.toLowerCase())}`);
      const data = await res.json();
      if (Array.isArray(data)) setCompletedWith(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchAllReviews(); }, [fetchAllReviews]);
  useEffect(() => { fetchCompletedTasks(); }, [fetchCompletedTasks]);

  const CATEGORY_KEYWORDS = {
    Design:      ['design', 'figma', 'ui', 'ux', 'graphic', 'illustr', 'brand', 'logo', 'visual', 'sketch', 'photoshop', 'indesign'],
    Development: ['develop', 'react', 'node', 'javascript', 'python', 'java', 'angular', 'vue', 'code', 'backend', 'frontend', 'fullstack', 'flutter', 'mobile', 'php', 'laravel', 'html', 'css', 'typescript', 'swift', 'kotlin'],
    Marketing:   ['marketing', 'seo', 'ads', 'social media', 'content', 'growth', 'campaign', 'email', 'analytics', 'copywriting', 'branding'],
    Writing:     ['writing', 'copywriting', 'content', 'blog', 'article', 'editorial', 'redact', 'rédact', 'translation', 'traduct'],
    Video:       ['video', 'motion', 'animation', 'after effects', 'premiere', 'montage', 'editing', 'cinema', 'vfx', 'lottie'],
    Finance:     ['finance', 'compta', 'accounting', 'audit', 'tax', 'fiscalit', 'invest', 'budget', 'excel'],
    Photography: ['photo', 'camera', 'lightroom', 'portrait', 'product photo', 'retouche'],
  };

  const filtered = approvedFreelancers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !search || f.name?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q) || f.skills?.toLowerCase().includes(q) || f.bio?.toLowerCase().includes(q);
    const haystack = `${f.skills || ''} ${f.bio || ''}`.toLowerCase();
    const matchCat = category === 'All' || haystack.includes(category.toLowerCase()) ||
      (CATEGORY_KEYWORDS[category] || []).some(kw => haystack.includes(kw));
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      const ra = reviews[a.email?.toLowerCase()]?.reduce((s,r) => s+r.rating, 0) / (reviews[a.email?.toLowerCase()]?.length || 1) || 0;
      const rb = reviews[b.email?.toLowerCase()]?.reduce((s,r) => s+r.rating, 0) / (reviews[b.email?.toLowerCase()]?.length || 1) || 0;
      return rb - ra;
    }
    return a.name?.localeCompare(b.name);
  });

  async function handleAddReview(freelancerKey, review) {
    try {
      await fetch(`${API}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ freelancerEmail: freelancerKey, clientEmail: review.clientEmail, clientName: review.clientName, rating: review.rating, comment: review.comment }) });
      fetchAllReviews();
    } catch {}
  }

  async function handleMarkComplete(freelancerEmail) {
    if (!user) return;
    try {
      await fetch(`${API}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientEmail: user.email, freelancerEmail }) });
      setCompletedWith(prev => [...prev, freelancerEmail]);
    } catch {}
  }

  function handleMessage(email) {
    setChatWith(email.toLowerCase());
  }

  const totalReviews = Object.values(reviews).flat().length;

  return (
    <div className="dark min-h-screen bg-slate-950 overflow-x-hidden">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 pt-24 pb-14 px-4 overflow-hidden min-h-[420px] flex flex-col justify-center">
        <div className="absolute -top-32 -right-24 w-96 h-96 bg-brand-violet/30 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] bg-brand-cyan/20 rounded-full blur-3xl animate-orb-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold">{approvedFreelancers.length} freelancers vérifiés disponibles</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Trouvez le <span className="bg-gradient-to-r from-brand-violet-light to-brand-cyan-light bg-clip-text text-transparent">talent</span><br className="hidden sm:block" /> qu'il vous faut
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Des freelancers tunisiens vérifiés, prêts à transformer vos projets en réalité.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, compétence, région…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white/5 backdrop-blur border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-violet focus:bg-white/10 transition-all shadow-xl" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {[
              { label: 'Freelancers', value: approvedFreelancers.length },
              { label: 'Avis clients', value: totalReviews },
              { label: 'Régions', value: new Set(approvedFreelancers.map(f => f.region).filter(Boolean)).size },
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
          {/* Category scroll */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 py-3 w-max">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === cat ? 'bg-gradient-to-r from-brand-violet to-brand-fuchsia text-white shadow-lg shadow-brand-violet/30' : 'text-slate-300 hover:bg-white/5'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {/* Results + sort */}
          <div className="flex items-center justify-between pb-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filtered.length} freelancer{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
              {search ? ` pour "${search}"` : ''}
            </p>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-violet">
              <option value="rating">Mieux notés</option>
              <option value="name">Par nom</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {filtered.length > 0 ? (
          <div className="divide-y divide-white/8">
            {filtered.map(f => (
              <RealFreelancerCard key={f.email} freelancer={f} reviews={reviews} onAddReview={handleAddReview}
                currentUser={user} updateUser={updateUser} completedWith={completedWith}
                onMarkComplete={handleMarkComplete} allUsers={users} onMessage={handleMessage} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun freelancer trouvé</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search ? 'Essayez un autre terme de recherche.' : 'Aucun freelancer vérifié pour le moment.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                Effacer la recherche
              </button>
            )}
          </div>
        )}
      </div>

      {chatWith && user && (
        <ChatDrawer
          user={user}
          initialEmail={chatWith}
          onClose={() => setChatWith(null)}
        />
      )}
    </div>
  );
}
