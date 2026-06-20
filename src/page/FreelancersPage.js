import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatDrawer from '../components/ChatDrawer';
import { cldImg } from '../utils/cloudinary';

const API = "https://famamennou-server.onrender.com/api";

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
            i <= (hovered || value) ? 'text-amber-400' : 'text-slate-700'].join(' ')}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────
   FREELANCER ROW — pure text-list SaaS style
───────────────────────────────────────────── */
function FreelancerRow({ freelancer, reviews, onAddReview, currentUser, updateUser, completedWith, onMarkComplete, allUsers, onMessage, serviceOffers }) {
  const [showForm,          setShowForm]          = useState(false);
  const [newRating,         setNewRating]         = useState(0);
  const [newComment,        setNewComment]        = useState('');
  const [showAllReviews,    setShowAllReviews]    = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioType,     setPortfolioType]     = useState('image');
  const [portfolioLabel,    setPortfolioLabel]    = useState('');
  const [lightboxImg,       setLightboxImg]       = useState(null);
  const [markingComplete,   setMarkingComplete]   = useState(false);
  const [expanded,          setExpanded]          = useState(false);
  const [ratingError,       setRatingError]       = useState(false);

  const fileRef          = useRef();
  const portfolioImgRef  = useRef();
  const portfolioFileRef = useRef();

  const key             = freelancer.email?.toLowerCase();
  const myReviews       = reviews[key] || [];
  const avgRating       = myReviews.length > 0
    ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length
    : 0;
  const isOwnCard       = currentUser?.email?.toLowerCase() === key;
  const isClient        = currentUser?.role === 'client';
  const alreadyReviewed = currentUser && myReviews.some(r => r.clientEmail === currentUser.email?.toLowerCase());
  const hasCompletedTask = completedWith?.includes(key);
  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 3);
  const skillTags       = freelancer.skills ? freelancer.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const portfolio       = freelancer.portfolio || [];
  const portfolioImages = portfolio.filter(i => i.type === 'image');

  const grad = AVATAR_GRADIENTS[(freelancer.email?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];

  const memberYear = freelancer.registeredAt
    ? new Date(freelancer.registeredAt).getFullYear()
    : null;

  async function handleMarkComplete() {
    setMarkingComplete(true);
    await onMarkComplete(key);
    setMarkingComplete(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!newRating) { setRatingError(true); return; }
    if (!newComment.trim()) return;
    onAddReview(key, {
      clientName: currentUser.name,
      clientEmail: currentUser.email?.toLowerCase(),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    });
    setShowForm(false); setNewRating(0); setNewComment(''); setRatingError(false);
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
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[300] bg-black/92 flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <img src={cldImg(lightboxImg)} alt="portfolio" className="max-w-full max-h-[88vh] rounded-xl shadow-2xl" />
          <button className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* ── ROW ── */}
      <div className="group py-5 sm:py-6 hover:bg-white/[0.018] transition-colors duration-150">
        <div className="flex gap-3 sm:gap-4">

          {/* Avatar — small circle */}
          <div className="shrink-0">
            {freelancer.photo
              ? <img src={cldImg(freelancer.photo)} alt={freelancer.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
              : <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/5`}>
                  {freelancer.name?.slice(0, 2).toUpperCase()}
                </div>
            }
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── Line 1: Name · meta ── */}
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1">
              <span className="text-[15px] font-semibold text-white leading-snug">
                {freelancer.name}
                {isOwnCard && (
                  <>
                    <button onClick={() => fileRef.current?.click()} title="Changer la photo"
                      className="ml-1.5 text-[10px] font-normal text-slate-600 hover:text-indigo-400 transition-colors align-middle">✏️</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </>
                )}
              </span>

              <span className="text-slate-700 text-xs select-none">·</span>
              <span className="text-[11px] font-semibold text-emerald-400">✓ Vérifié</span>

              {freelancer.region && (
                <>
                  <span className="text-slate-700 text-xs select-none">·</span>
                  <span className="text-[11px] text-slate-500">{freelancer.region}</span>
                </>
              )}

              {memberYear && (
                <>
                  <span className="text-slate-700 text-xs select-none">·</span>
                  <span className="text-[11px] text-slate-500">Depuis {memberYear}</span>
                </>
              )}

              {avgRating > 0 && (
                <>
                  <span className="text-slate-700 text-xs select-none">·</span>
                  <span className="text-[11px] text-amber-400 font-semibold">★ {avgRating.toFixed(1)}</span>
                  <span className="text-[11px] text-slate-600">({myReviews.length} avis)</span>
                </>
              )}

              {freelancer.availability === 'unavailable' && (
                <>
                  <span className="text-slate-700 text-xs select-none">·</span>
                  <span className="text-[11px] text-rose-400">Indisponible</span>
                </>
              )}
            </div>

            {/* ── Line 2: Bio / tagline — 1 line ── */}
            {freelancer.bio && (
              <p dir="auto" className="text-[13px] text-slate-400 leading-snug line-clamp-1 mb-2">
                {freelancer.bio}
              </p>
            )}

            {/* ── Line 3: Skills — inline plain text ── */}
            {skillTags.length > 0 && (
              <p className="text-[12px] text-slate-500 leading-relaxed mb-3">
                {skillTags.join(' · ')}
              </p>
            )}

            {/* ── Service offers — visible inline, no expansion needed ── */}
            {serviceOffers?.length > 0 && (
              <div className="mb-3 space-y-2">
                {serviceOffers.map(offer => {
                  const kws = (offer.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
                  const isOpen = !offer.status || offer.status === 'open';
                  return (
                    <div key={offer.id} className="pl-3 border-l-2 border-indigo-500/30">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-[12px] font-semibold text-slate-200">{offer.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
                          isOpen
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isOpen ? '🟢 Disponible' : '🔒 Pris'}
                        </span>
                      </div>
                      {offer.description && (
                        <p dir="auto" className="text-[11px] text-slate-500 line-clamp-1">{offer.description}</p>
                      )}
                      {(offer.experience || kws.length > 0) && (
                        <p className="text-[11px] text-slate-700 mt-0.5">
                          {[offer.experience, kws.join(' · ')].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Portfolio thumbnails strip ── */}
            {portfolioImages.length > 0 && (
              <div className="flex gap-1.5 mb-3.5">
                {portfolioImages.slice(0, 6).map((item, idx) => (
                  <button key={idx} onClick={() => setLightboxImg(item.data)}
                    className="w-14 h-9 rounded overflow-hidden opacity-60 hover:opacity-90 transition-opacity shrink-0">
                    <img src={cldImg(item.data)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {portfolioImages.length > 6 && (
                  <div className="w-14 h-9 rounded bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-500 shrink-0">
                    +{portfolioImages.length - 6}
                  </div>
                )}
              </div>
            )}

            {/* ── Actions — text links, no button boxes ── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium">
              {currentUser && !isOwnCard && (
                <button onClick={() => onMessage(key)}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  💬 Message
                </button>
              )}

              <button onClick={() => setExpanded(v => !v)}
                className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-0.5">
                {expanded ? '↑ Réduire' : '↓ Voir profil'}
              </button>

              {isClient && !isOwnCard && !hasCompletedTask && (
                <button onClick={handleMarkComplete} disabled={markingComplete}
                  className="text-slate-600 hover:text-amber-400 transition-colors disabled:opacity-40">
                  {markingComplete ? '…' : '✓ Travaillé ensemble'}
                </button>
              )}

              {isClient && !isOwnCard && hasCompletedTask && !alreadyReviewed && !showForm && (
                <button onClick={() => { setExpanded(true); setShowForm(true); }}
                  className="text-slate-600 hover:text-amber-400 transition-colors">
                  ⭐ Laisser un avis
                </button>
              )}

              {isOwnCard && (
                <span className="text-[11px] text-slate-600">Votre profil freelancer</span>
              )}
              {alreadyReviewed && (
                <span className="text-[11px] text-slate-600">Avis déjà soumis</span>
              )}
              {isOwnCard && portfolio.length === 0 && (
                <span className="text-[11px] text-amber-600">⚠ Ajoutez un portfolio</span>
              )}
            </div>

            {/* ── EXPANDED PANEL ── */}
            {expanded && (
              <div className="mt-5 pt-5 border-t border-slate-800/70 space-y-6">

                {/* Portfolio manager */}
                {(portfolio.length > 0 || isOwnCard) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Portfolio</p>
                      {isOwnCard && (
                        <button onClick={() => setShowPortfolioForm(v => !v)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                          {showPortfolioForm ? 'Annuler' : '+ Ajouter'}
                        </button>
                      )}
                    </div>

                    {showPortfolioForm && isOwnCard && (
                      <div className="mb-3 p-3 rounded-lg border border-slate-800 bg-slate-900 space-y-2.5">
                        <div className="flex">
                          {[{ id: 'image', label: 'Image' }, { id: 'file', label: 'Fichier' }].map(tab => (
                            <button key={tab.id} onClick={() => setPortfolioType(tab.id)}
                              className={`flex-1 py-1.5 text-[11px] font-semibold transition-all border-b ${portfolioType === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-600 hover:text-slate-400'}`}>
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        {portfolioType === 'image' && (
                          <button onClick={() => portfolioImgRef.current?.click()}
                            className="text-[12px] text-slate-300 hover:text-white transition-colors">
                            📂 Choisir une image
                          </button>
                        )}
                        {portfolioType === 'file' && (
                          <div className="space-y-2">
                            <input type="text" value={portfolioLabel} onChange={e => setPortfolioLabel(e.target.value)}
                              placeholder="Titre du fichier"
                              className="w-full text-[12px] bg-transparent border-b border-slate-700 text-white py-1 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700" />
                            <button onClick={() => portfolioFileRef.current?.click()}
                              className="text-[12px] text-slate-300 hover:text-white transition-colors">
                              📄 Choisir un fichier
                            </button>
                          </div>
                        )}
                        <input ref={portfolioImgRef} type="file" accept="image/*" className="hidden" onChange={e => handlePortfolioFile(e, 'image')} />
                        <input ref={portfolioFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" className="hidden" onChange={e => handlePortfolioFile(e, 'file')} />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {portfolio.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 group/p">
                          {item.type === 'image' && (
                            <button onClick={() => setLightboxImg(item.data)}
                              className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-indigo-400 transition-colors text-left flex-1 min-w-0">
                              <img src={cldImg(item.data)} alt="" className="w-6 h-4 object-cover rounded opacity-70" />
                              <span className="truncate">{item.label || 'Image'}</span>
                            </button>
                          )}
                          {item.type === 'file' && (
                            <a href={item.data} download={item.filename || item.label}
                              className="flex items-center gap-2 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors flex-1 min-w-0 truncate">
                              <span>📄</span><span className="truncate">{item.label || item.filename}</span>
                            </a>
                          )}
                          {isOwnCard && (
                            <button onClick={() => handleRemovePortfolio(idx)}
                              className="opacity-0 group-hover/p:opacity-100 text-slate-700 hover:text-rose-400 transition-all shrink-0">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {myReviews.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                      Avis clients — {myReviews.length} avis
                    </p>
                    <div className="space-y-4">
                      {displayedReviews.map((r, i) => {
                        const reviewer = allUsers?.find(u => u.email?.toLowerCase() === r.clientEmail?.toLowerCase());
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="shrink-0 mt-0.5">
                              {reviewer?.photo
                                ? <img src={cldImg(reviewer.photo)} alt={r.clientName} className="w-6 h-6 rounded-full object-cover" />
                                : <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-[9px] font-bold">{r.clientName?.slice(0,2).toUpperCase()}</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[12px] font-semibold text-slate-300">{r.clientName}</span>
                                <Stars value={r.rating} readonly size="sm" />
                              </div>
                              <p dir="auto" className="text-[12px] text-slate-500 leading-relaxed">{r.comment}</p>
                            </div>
                          </div>
                        );
                      })}
                      {myReviews.length > 3 && (
                        <button onClick={() => setShowAllReviews(v => !v)}
                          className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors">
                          {showAllReviews ? '↑ Voir moins' : `↓ ${myReviews.length - 3} avis de plus`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!myReviews.length && !showForm && !isOwnCard && (
                  <p className="text-[12px] text-slate-700">Aucun avis pour le moment.</p>
                )}

                {/* Review form */}
                {showForm && (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Laisser un avis</p>
                    <div>
                      <Stars value={newRating} onChange={v => { setNewRating(v); setRatingError(false); }} />
                      {ratingError && <p className="text-[11px] text-rose-500 mt-1">Veuillez choisir une note.</p>}
                    </div>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Votre commentaire…" rows={3} required
                      className="w-full text-[13px] bg-transparent border-b border-slate-700 text-white py-1.5 resize-none focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700" />
                    <div className="flex gap-4 pt-1">
                      <button type="submit" disabled={!newComment.trim()}
                        className="text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-40">
                        Envoyer
                      </button>
                      <button type="button"
                        onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); setRatingError(false); }}
                        className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors">
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   CATEGORIES & KEYWORDS
───────────────────────────────────────────── */
const CATEGORIES = ['Tous', 'Design', 'Développement', 'Marketing', 'Rédaction', 'Vidéo', 'Finance', 'Photo'];

const CATEGORY_KEYWORDS = {
  'Design':       ['design', 'figma', 'ui', 'ux', 'graphic', 'illustr', 'brand', 'logo', 'visual', 'sketch', 'photoshop'],
  'Développement':['develop', 'react', 'node', 'javascript', 'python', 'java', 'angular', 'vue', 'code', 'backend', 'frontend', 'fullstack', 'flutter', 'mobile', 'php', 'laravel', 'html', 'css', 'typescript'],
  'Marketing':    ['marketing', 'seo', 'ads', 'social media', 'content', 'growth', 'campaign', 'email', 'analytics', 'copywriting'],
  'Rédaction':    ['writing', 'copywriting', 'content', 'blog', 'article', 'editorial', 'redact', 'rédact', 'translation', 'traduct'],
  'Vidéo':        ['video', 'motion', 'animation', 'after effects', 'premiere', 'montage', 'editing', 'cinema', 'vfx'],
  'Finance':      ['finance', 'compta', 'accounting', 'audit', 'tax', 'fiscalit', 'invest', 'budget', 'excel'],
  'Photo':        ['photo', 'camera', 'lightroom', 'portrait', 'product photo', 'retouche'],
};

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function FreelancersPage() {
  const { users, user, updateUser } = useAuth();
  const [searchParams]  = useSearchParams();
  const [search,        setSearch]        = useState(searchParams.get('q') || '');
  const [category,      setCategory]      = useState('Tous');
  const [sortBy,        setSortBy]        = useState('rating');
  const [showFilters,   setShowFilters]   = useState(false);
  const [reviews,        setReviews]        = useState({});
  const [completedWith,  setCompletedWith]  = useState([]);
  const [chatWith,       setChatWith]       = useState(null);
  const [freelancerOffers, setFreelancerOffers] = useState([]);

  const approvedFreelancers = (users || []).filter(u => u?.role === 'freelancer' && u?.cinStatus === 'approved');

  const fetchAllReviews = useCallback(async () => {
    try {
      const emails  = approvedFreelancers.map(u => u.email);
      const results = await Promise.all(emails.map(email =>
        fetch(`${API}/reviews/${encodeURIComponent(email)}`).then(r => r.json()).catch(() => [])
      ));
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i] || []).map(r => ({
          clientName:  r.client_name,
          clientEmail: r.client_email,
          rating:      r.rating,
          comment:     r.comment,
          createdAt:   r.created_at,
        }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const fetchCompletedTasks = useCallback(async () => {
    if (!user || user.role !== 'client') return;
    try {
      const res  = await fetch(`${API}/tasks/${encodeURIComponent(user.email.toLowerCase())}`);
      const data = await res.json();
      if (Array.isArray(data)) setCompletedWith(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchAllReviews(); },    [fetchAllReviews]);
  useEffect(() => { fetchCompletedTasks(); }, [fetchCompletedTasks]);
  useEffect(() => {
    fetch(`${API}/projects/browse/freelancer-offers`)
      .then(r => r.json()).then(d => Array.isArray(d) && setFreelancerOffers(d)).catch(() => {});
  }, []);

  const filtered = approvedFreelancers.filter(f => {
    const q          = search.toLowerCase();
    const matchSearch = !search ||
      f.name?.toLowerCase().includes(q) ||
      f.region?.toLowerCase().includes(q) ||
      f.skills?.toLowerCase().includes(q) ||
      f.bio?.toLowerCase().includes(q);
    const haystack   = `${f.skills || ''} ${f.bio || ''}`.toLowerCase();
    const matchCat   = category === 'Tous' ||
      haystack.includes(category.toLowerCase()) ||
      (CATEGORY_KEYWORDS[category] || []).some(kw => haystack.includes(kw));
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      const ra = reviews[a.email?.toLowerCase()]?.reduce((s, r) => s + r.rating, 0) / (reviews[a.email?.toLowerCase()]?.length || 1) || 0;
      const rb = reviews[b.email?.toLowerCase()]?.reduce((s, r) => s + r.rating, 0) / (reviews[b.email?.toLowerCase()]?.length || 1) || 0;
      return rb - ra;
    }
    return a.name?.localeCompare(b.name);
  });

  async function handleAddReview(freelancerKey, review) {
    try {
      await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerEmail: freelancerKey,
          clientEmail:     review.clientEmail,
          clientName:      review.clientName,
          rating:          review.rating,
          comment:         review.comment,
        }),
      });
      fetchAllReviews();
    } catch {}
  }

  async function handleMarkComplete(freelancerEmail) {
    if (!user) return;
    try {
      await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: user.email, freelancerEmail }),
      });
      setCompletedWith(prev => [...prev, freelancerEmail]);
    } catch {}
  }

  const totalReviews = Object.values(reviews).flat().length;
  const totalRegions = new Set(approvedFreelancers.map(f => f.region).filter(Boolean)).size;

  return (
    <div className="dark min-h-screen bg-[#080810] overflow-x-hidden">

      {/* ══════════════════════════════════════
          HEADER — minimal, text-first
      ══════════════════════════════════════ */}
      <div className="pt-20 pb-10 px-4 sm:px-6 border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb label */}
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-4">
            Marketplace · Freelancers
          </p>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
            Trouver un freelancer
          </h1>
          <p className="text-[13px] text-slate-500 mb-7 leading-relaxed">
            Freelancers tunisiens vérifiés, disponibles pour vos projets.
          </p>

          {/* Search — underline style */}
          <div className="relative max-w-xl mb-6">
            <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, compétence, région…"
              className="w-full pl-6 pr-8 py-2 bg-transparent border-b border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {/* Stats — inline text */}
          <p className="text-[12px] text-slate-700">
            <span className="text-slate-400 font-semibold">{approvedFreelancers.length}</span> freelancers vérifiés
            <span className="mx-2 text-slate-800">·</span>
            <span className="text-slate-400 font-semibold">{totalReviews}</span> avis clients
            <span className="mx-2 text-slate-800">·</span>
            <span className="text-slate-400 font-semibold">{totalRegions}</span> régions
          </p>

        </div>
      </div>

      {/* ══════════════════════════════════════
          FILTER BAR — sticky, underline tabs
      ══════════════════════════════════════ */}
      <div className="sticky top-16 z-20 bg-[#080810]/96 backdrop-blur border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">

            {/* Category tabs */}
            <div className="flex overflow-x-auto scrollbar-hide -mb-px">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-3.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all ${
                    category === cat
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-600 hover:text-slate-400 hover:border-slate-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Right: count + sort */}
            <div className="flex items-center gap-3 shrink-0 pl-3 py-3">
              <span className="text-[11px] text-slate-700 hidden sm:block">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-[11px] text-slate-500 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-slate-300 transition-colors">
                <option value="rating">Mieux notés</option>
                <option value="name">A → Z</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FREELANCER LIST
      ══════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {filtered.map(f => (
              <FreelancerRow
                key={f.email}
                freelancer={f}
                reviews={reviews}
                onAddReview={handleAddReview}
                currentUser={user}
                updateUser={updateUser}
                completedWith={completedWith}
                onMarkComplete={handleMarkComplete}
                allUsers={users}
                onMessage={email => setChatWith(email.toLowerCase())}
                serviceOffers={freelancerOffers.filter(o => o.client_email?.toLowerCase() === f.email?.toLowerCase())}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[13px] font-semibold text-slate-400 mb-1">
              Aucun freelancer trouvé
            </p>
            <p className="text-[12px] text-slate-700 mb-5">
              {search ? `Aucun résultat pour "${search}".` : 'Aucun freelancer vérifié pour le moment.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')}
                className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        {/* Footer note */}
        {filtered.length > 0 && (
          <p className="text-[11px] text-slate-800 text-center py-8">
            {filtered.length} freelancer{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

      </div>

      {/* Chat drawer */}
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
