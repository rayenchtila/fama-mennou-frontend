import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API = "https://famamennou-server.onrender.com/api";

const AVATAR_COLORS = [
  'bg-indigo-500','bg-emerald-500','bg-rose-500',
  'bg-amber-500','bg-sky-500','bg-fuchsia-500','bg-violet-500',
];

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg
          key={i}
          onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={[
            'w-4 h-4 transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer',
            i <= (hovered || value) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700',
          ].join(' ')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function RealFreelancerCard({ freelancer, reviews, onAddReview, currentUser, updateUser }) {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioType, setPortfolioType] = useState('link');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioLabel, setPortfolioLabel] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);
  const fileRef = useRef();
  const portfolioImgRef = useRef();

  const key = freelancer.email?.toLowerCase();
  const myReviews = reviews[key] || [];
  const avgRating = myReviews.length > 0
    ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length
    : 0;

  const isOwnCard = currentUser?.email?.toLowerCase() === key;
  const isClient = currentUser && (currentUser.role === 'client' || currentUser.provider === 'google' || currentUser.provider === 'facebook');
  const alreadyReviewed = currentUser && myReviews.some(r => r.clientEmail === currentUser.email?.toLowerCase());
  const colorIndex = (key?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 2);

  const skillTags = freelancer.skills
    ? freelancer.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const portfolio = freelancer.portfolio || [];

  function handleSubmit(e) {
    e.preventDefault();
    if (!newRating || !newComment.trim()) return;
    onAddReview(key, {
      clientName: currentUser.name,
      clientEmail: currentUser.email?.toLowerCase(),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    });
    setShowForm(false);
    setNewRating(0);
    setNewComment('');
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser(freelancer.email, { photo: ev.target.result });
    reader.readAsDataURL(file);
  }

  function handleAddPortfolioLink() {
    if (!portfolioUrl.trim()) return;
    const item = { type: 'link', url: portfolioUrl.trim(), label: portfolioLabel.trim() || portfolioUrl.trim() };
    updateUser(freelancer.email, { portfolio: [...portfolio, item] });
    setPortfolioUrl('');
    setPortfolioLabel('');
    setShowPortfolioForm(false);
  }

  function handlePortfolioImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      updateUser(freelancer.email, { portfolio: [...portfolio, { type: 'image', data: ev.target.result }] });
    };
    reader.readAsDataURL(file);
    setShowPortfolioForm(false);
  }

  function handleRemovePortfolio(idx) {
    const next = portfolio.filter((_, i) => i !== idx);
    updateUser(freelancer.email, { portfolio: next });
  }

  return (
    <>
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="portfolio" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/60 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative group/av">
              {freelancer.photo ? (
                <img src={freelancer.photo} alt={freelancer.name} className="w-12 h-12 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className={['w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md', AVATAR_COLORS[colorIndex]].join(' ')}>
                  {freelancer.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              {isOwnCard && (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover/av:opacity-100 flex items-center justify-center transition-opacity"
                    title="Changer la photo"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{freelancer.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{freelancer.region || 'Tunisie'}</p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full whitespace-nowrap">
            Vérifié ✓
          </span>
        </div>

        {/* Bio */}
        {freelancer.bio && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed line-clamp-2">
            {freelancer.bio}
          </p>
        )}

        {/* Skills */}
        {skillTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skillTags.slice(0, 5).map((tag, i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">
                {tag}
              </span>
            ))}
            {skillTags.length > 5 && (
              <span className="text-[11px] text-slate-400">+{skillTags.length - 5}</span>
            )}
          </div>
        )}

        {/* Stars summary */}
        <div className="flex items-center gap-2 mb-3">
          <StarRating value={Math.round(avgRating)} readonly />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-slate-400">({myReviews.length} avis)</span>
        </div>

        {/* Portfolio */}
        {(portfolio.length > 0 || isOwnCard) && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portfolio</span>
              {isOwnCard && (
                <button
                  onClick={() => setShowPortfolioForm(v => !v)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showPortfolioForm ? 'Annuler' : '+ Ajouter'}
                </button>
              )}
            </div>

            {/* Add portfolio form (own card only) */}
            {showPortfolioForm && isOwnCard && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-2 space-y-2">
                <div className="flex gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg">
                  {['link', 'image'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPortfolioType(t)}
                      className={['flex-1 py-1 text-xs font-semibold rounded-md transition-all', portfolioType === t ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'].join(' ')}
                    >
                      {t === 'link' ? '🔗 Lien' : '🖼 Image'}
                    </button>
                  ))}
                </div>
                {portfolioType === 'link' ? (
                  <>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={portfolioLabel}
                      onChange={e => setPortfolioLabel(e.target.value)}
                      placeholder="Label (optionnel)"
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPortfolioLink}
                      disabled={!portfolioUrl.trim()}
                      className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ajouter le lien
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => portfolioImgRef.current?.click()}
                    className="w-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition-colors"
                  >
                    📂 Choisir une image
                  </button>
                )}
                <input ref={portfolioImgRef} type="file" accept="image/*" className="hidden" onChange={handlePortfolioImage} />
              </div>
            )}

            {/* Portfolio items */}
            {portfolio.length > 0 && (
              <div className="space-y-1.5">
                {portfolio.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 group/p">
                    {item.type === 'link' ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">{item.label || item.url}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightboxImg(item.data)}
                        className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                      >
                        <img src={item.data} alt="portfolio" className="w-8 h-6 object-cover rounded" />
                        <span className="truncate">Capture d'écran</span>
                      </button>
                    )}
                    {isOwnCard && (
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolio(idx)}
                        className="opacity-0 group-hover/p:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity"
                        title="Supprimer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {myReviews.length > 0 && (
          <div className="mb-3 space-y-2">
            {displayedReviews.map((r, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating value={r.rating} readonly />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{r.clientName}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.comment}</p>
              </div>
            ))}
            {myReviews.length > 2 && (
              <button onClick={() => setShowAllReviews(v => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                {showAllReviews ? 'Voir moins' : `Voir ${myReviews.length - 2} avis de plus`}
              </button>
            )}
          </div>
        )}

        {/* Review form / CTA */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          {isClient && !isOwnCard && !alreadyReviewed && !showForm && (
            <button onClick={() => setShowForm(true)} className="w-full text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-left">
              + Laisser un avis
            </button>
          )}
          {alreadyReviewed && <p className="text-xs text-slate-400">Vous avez déjà laissé un avis.</p>}
          {isOwnCard && <p className="text-xs text-slate-400">Votre profil — survolez la photo pour la modifier.</p>}
          {!currentUser && <p className="text-xs text-slate-400">Connectez-vous pour laisser un avis.</p>}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <StarRating value={newRating} onChange={setNewRating} />
                {newRating > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{newRating}/5</span>}
              </div>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Votre commentaire..."
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <div className="flex gap-2">
                <button type="submit" disabled={!newRating || !newComment.trim()} className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  Envoyer
                </button>
                <button type="button" onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); }} className="flex-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const FreelancersPage = () => {
  const { t } = useTranslation();
  const { users, user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [reviews, setReviews] = useState({});

  const categories = ['All', 'Design', 'Development', 'Marketing', 'Writing', 'Video'];

  const fetchAllReviews = useCallback(async () => {
    try {
      const approvedEmails = users
        .filter(u => u && u.role === 'freelancer' && u.cinStatus === 'approved')
        .map(u => u.email);
      const results = await Promise.all(
        approvedEmails.map(email =>
          fetch(`${API}/reviews/${encodeURIComponent(email)}`).then(r => r.json())
        )
      );
      const map = {};
      approvedEmails.forEach((email, i) => {
        map[email.toLowerCase()] = results[i].map(r => ({
          clientName:  r.client_name,
          clientEmail: r.client_email,
          rating:      r.rating,
          comment:     r.comment,
          createdAt:   r.created_at,
        }));
      });
      setReviews(map);
    } catch {}
  }, [users]);

  useEffect(() => { fetchAllReviews(); }, [fetchAllReviews]);

  const approvedFreelancers = users.filter(u => u && u.role === 'freelancer' && u.cinStatus === 'approved');

  const filteredReal = approvedFreelancers.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      f.name?.toLowerCase().includes(q) ||
      f.region?.toLowerCase().includes(q) ||
      f.skills?.toLowerCase().includes(q) ||
      f.bio?.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'All' ||
      f.skills?.toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  async function handleAddReview(freelancerKey, review) {
    try {
      await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerEmail: freelancerKey,
          clientEmail:     review.clientEmail,
          clientName:      review.clientName,
          rating:          review.rating,
          comment:         review.comment,
        }),
      });
      await fetchAllReviews();
    } catch {}
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">{t("Find Freelancers")}</h1>
        <div className="mb-6">
          <Searchbar value={searchQuery} onChange={setSearchQuery} placeholder={t("Search freelancers...")} />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={filteredReal.length}
          label={t("Freelancers")}
        />
        <div className="mt-8">
          {filteredReal.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredReal.map(f => (
                <RealFreelancerCard
                  key={f.email}
                  freelancer={f}
                  reviews={reviews}
                  onAddReview={handleAddReview}
                  currentUser={user}
                  updateUser={updateUser}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-lg font-medium">Aucun freelancer trouvé</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Essayez un autre terme de recherche.' : 'Aucun freelancer vérifié pour le moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancersPage;
