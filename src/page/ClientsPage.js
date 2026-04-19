import React, { useState, useEffect, useCallback } from 'react';
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

function ClientCard({ client, reviews, onAddReview, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [ratingError, setRatingError] = useState(false);

  const key = client.email?.toLowerCase();
  const myReviews = reviews[key] || [];
  const avgRating = myReviews.length > 0
    ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length
    : 0;

  const isOwnCard = currentUser?.email?.toLowerCase() === key;
  const isFreelancer = currentUser?.role === 'freelancer';
  const alreadyReviewed = currentUser && myReviews.some(r => r.freelancerEmail === currentUser.email?.toLowerCase());
  const colorIndex = (key?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const displayedReviews = showAllReviews ? myReviews : myReviews.slice(0, 2);

  function handleSubmit(e) {
    e.preventDefault();
    if (!newRating) { setRatingError(true); return; }
    if (!newComment.trim()) return;
    onAddReview(key, {
      freelancerName: currentUser.name,
      freelancerEmail: currentUser.email?.toLowerCase(),
      rating: newRating,
      comment: newComment.trim(),
    });
    setShowForm(false);
    setNewRating(0);
    setNewComment('');
    setRatingError(false);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-800/60 flex flex-col">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {client.photo ? (
            <img src={client.photo} alt={client.name} className="w-12 h-12 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className={['w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md', AVATAR_COLORS[colorIndex]].join(' ')}>
              {client.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
              {client.name?.split(' ')[0]}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.region || 'Tunisie'}</p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-full whitespace-nowrap">
          Client ✓
        </span>
      </div>

      {/* Bio */}
      {client.bio && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed line-clamp-2">
          {client.bio}
        </p>
      )}

      {/* Stars summary */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating value={Math.round(avgRating)} readonly />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {avgRating > 0 ? avgRating.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-slate-400">({myReviews.length} avis)</span>
      </div>

      {/* Reviews list */}
      {myReviews.length > 0 && (
        <div className="mb-3 space-y-2">
          {displayedReviews.map((r, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={r.rating} readonly />
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
      )}

      {/* Review form / CTA */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        {isFreelancer && !isOwnCard && !alreadyReviewed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline text-left"
          >
            + Laisser un avis
          </button>
        )}
        {alreadyReviewed && <p className="text-xs text-slate-400">Vous avez déjà laissé un avis.</p>}
        {isOwnCard && <p className="text-xs text-slate-400">Votre profil client.</p>}
        {!currentUser && <p className="text-xs text-slate-400">Connectez-vous pour laisser un avis.</p>}
        {currentUser && currentUser.role !== 'freelancer' && !isOwnCard && (
          <p className="text-xs text-slate-400">Seuls les freelancers peuvent noter les clients.</p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <div className="flex items-center gap-2">
                <StarRating value={newRating} onChange={v => { setNewRating(v); setRatingError(false); }} />
                {newRating > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{newRating}/5</span>}
              </div>
              {ratingError && (
                <p className="text-[11px] text-rose-500 mt-0.5">⚠️ Veuillez choisir une note avant d'envoyer.</p>
              )}
            </div>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Votre commentaire sur ce client..."
              rows={2}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="flex-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Envoyer
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewRating(0); setNewComment(''); setRatingError(false); }}
                className="flex-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const ClientsPage = () => {
  const { t } = useTranslation();
  const { users, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [reviews, setReviews] = useState({});

  const categories = ['All', 'Technology', 'Design', 'Marketing', 'Writing'];

  const approvedClients = users.filter(u => u && u.role === 'client' && u.cinStatus === 'approved');

  const fetchAllReviews = useCallback(async () => {
    try {
      const emails = approvedClients.map(u => u.email);
      const results = await Promise.all(
        emails.map(email =>
          fetch(`${API}/client-reviews/${encodeURIComponent(email)}`).then(r => r.json())
        )
      );
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i] || []).map(r => ({
          freelancerName:  r.freelancer_name,
          freelancerEmail: r.freelancer_email,
          rating:          r.rating,
          comment:         r.comment,
          createdAt:       r.created_at,
        }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  useEffect(() => { fetchAllReviews(); }, [fetchAllReviews]);

  const filteredClients = approvedClients.filter(c => {
    const q = searchQuery.toLowerCase();
    return searchQuery === '' ||
      c.name?.toLowerCase().includes(q) ||
      c.region?.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q);
  });

  async function handleAddReview(clientKey, review) {
    try {
      await fetch(`${API}/client-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail:     clientKey,
          freelancerEmail: review.freelancerEmail,
          freelancerName:  review.freelancerName,
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">{t("Find Clients")}</h1>
        <div className="mb-6">
          <Searchbar value={searchQuery} onChange={setSearchQuery} placeholder={t("Search clients...")} />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={filteredClients.length}
          label={t("Clients")}
        />
        <div className="mt-8">
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClients.map(c => (
                <ClientCard
                  key={c.email}
                  client={c}
                  reviews={reviews}
                  onAddReview={handleAddReview}
                  currentUser={user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-lg font-medium">Aucun client trouvé</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Essayez un autre terme de recherche.' : 'Aucun client vérifié pour le moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
