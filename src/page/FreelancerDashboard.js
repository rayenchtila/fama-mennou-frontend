import { useState, useEffect, useRef, useCallback } from 'react';
import MessagesTab from '../components/MessagesTab';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

const TUNISIAN_REGIONS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

const CATEGORIES = [
  'Développement Web','Design','Marketing','Rédaction','Vidéo','Photo',
  'Traduction','SEO','Mobile','DevOps','Data','Autre',
];

const AVATAR_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];

function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  const color = AVATAR_COLORS[(user?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  if (user?.photo) return <img src={user.photo} alt={user.name} className={`${sz} rounded-2xl object-cover`} />;
  return <div className={`${sz} ${color} rounded-2xl flex items-center justify-center text-white font-bold shrink-0`}>{user?.name?.slice(0,2).toUpperCase()}</div>;
}

function Stars({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <span className={sz}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:  { label: 'Actif',    color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
    paused:  { label: 'En pause', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    closed:  { label: 'Fermé',    color: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' },
    open:    { label: 'Ouvert',   color: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
  };
  const s = map[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>;
}

// ── 1. PROFILE TAB ────────────────────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
  const skillsStr = Array.isArray(user?.skills)
    ? user.skills.join(', ')
    : (user?.skills || '');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    region: user?.region || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    skills: skillsStr,
  });
  const [saving, setSaving] = useState(false);
  const [portfolioList, setPortfolioList] = useState(
    Array.isArray(user?.portfolio) ? user.portfolio : []
  );
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const fileRef = useRef();
  const portfolioRef = useRef();

  useEffect(() => {
    fetch(`${API}/reviews/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => {});
  }, [user.email]);

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSave() {
    setSaving(true);
    const skillsArr = form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    await updateUser(user.email, { ...form, skills: skillsArr });
    setSaving(false);
    setEditing(false);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = ev => {
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        updateUser(user.email, { photo: canvas.toDataURL('image/jpeg', 0.7) });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handlePortfolioFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newItem = { name: file.name, type: file.type, data: ev.target.result };
      const updated = [...portfolioList, newItem];
      setPortfolioList(updated);
      setPortfolioSaving(true);
      updateUser(user.email, { portfolio: updated }).finally(() => setPortfolioSaving(false));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function removePortfolioItem(idx) {
    const updated = portfolioList.filter((_, i) => i !== idx);
    setPortfolioList(updated);
    setPortfolioSaving(true);
    await updateUser(user.email, { portfolio: updated });
    setPortfolioSaving(false);
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;
  const skills = Array.isArray(user?.skills) ? user.skills : (user?.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Main info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar user={user} size="lg" />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Freelancer</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${user?.availability === 'available' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.availability === 'available' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {user?.availability === 'available' ? 'Disponible' : 'Indisponible'}
              </span>
              {avgRating && <span className="text-[10px] font-bold text-amber-600">★ {avgRating} ({reviews.length} avis)</span>}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0">
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nom complet</label>
            {editing ? <input value={form.name} onChange={set('name')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            : <p className="text-sm text-slate-900 dark:text-white">{user?.name || '—'}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio professionnelle</label>
            {editing ? <textarea value={form.bio} onChange={set('bio')} rows={3} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Décrivez votre expertise, expériences et ce que vous offrez..." />
            : <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{user?.bio || '—'}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Compétences & Tags</label>
            {editing ? <input value={form.skills} onChange={set('skills')} placeholder="Ex: React, Node.js, Figma, SEO (séparés par virgule)" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            : (
              <div className="flex flex-wrap gap-1.5">
                {skills.length > 0
                  ? skills.map((s, i) => <span key={i} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-xl">{s}</span>)
                  : <p className="text-sm text-slate-500">—</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Région</label>
              {editing ? (
                <select value={form.region} onChange={set('region')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Sélectionnez</option>
                  {TUNISIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : <p className="text-sm text-slate-900 dark:text-white">{user?.region || '—'}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date de naissance</label>
              {editing ? <input type="date" value={form.dob} onChange={set('dob')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              : <p className="text-sm text-slate-900 dark:text-white">{user?.dob || '—'}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Genre</label>
            {editing ? (
              <div className="flex gap-2">
                {[{id:'male',label:'Homme'},{id:'female',label:'Femme'}].map(g => (
                  <button key={g.id} type="button" onClick={() => setForm(f => ({...f, gender: g.id}))}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${form.gender === g.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            ) : <p className="text-sm text-slate-900 dark:text-white">{user?.gender === 'male' ? 'Homme' : user?.gender === 'female' ? 'Femme' : '—'}</p>}
          </div>

          {editing && (
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          )}
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">💼 Portfolio</h3>
          <button onClick={() => portfolioRef.current?.click()} disabled={portfolioSaving}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
            {portfolioSaving ? '...' : '+ Ajouter un fichier'}
          </button>
          <input ref={portfolioRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={handlePortfolioFile} />
        </div>
        {portfolioList.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p className="text-2xl mb-2">📁</p>
            <p className="text-xs text-slate-400 font-semibold">Aucun fichier</p>
            <p className="text-[10px] text-slate-400 mt-1">Ajoutez des PDF, images ou documents</p>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolioList.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-lg shrink-0">{item.type?.includes('image') ? '🖼️' : '📄'}</span>
                <a href={item.data} download={item.name} className="flex-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate hover:underline">{item.name}</a>
                <button onClick={() => removePortfolioItem(i)} className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings & Reviews */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">⭐ Avis & Évaluations</h3>
          {avgRating && (
            <div className="flex items-center gap-2">
              <Stars rating={parseFloat(avgRating)} />
              <span className="text-sm font-extrabold text-amber-600">{avgRating}</span>
              <span className="text-xs text-slate-400">({reviews.length})</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">⭐</p>
            <p className="text-xs text-slate-400 font-semibold">Aucun avis pour l'instant</p>
            <p className="text-[10px] text-slate-400 mt-1">Terminez des projets pour recevoir des évaluations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${AVATAR_COLORS[(r.client_email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]}`}>
                    {(r.client_name || r.client_email || 'U').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{r.client_name || r.client_email}</p>
                    <div className="flex items-center gap-1.5">
                      <Stars rating={r.rating} />
                      <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('fr-TN')}</span>
                    </div>
                  </div>
                </div>
                {r.comment && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2. DASHBOARD STATS TAB ────────────────────────────────────────────────────
function DashboardStatsTab({ user }) {
  const [jobs, setJobs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetch(`${API}/freelancer-jobs/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setJobs(d); }).catch(() => {});
    fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setConversations(d); }).catch(() => {});
    fetch(`${API}/projects/browse/open`).then(r => r.json()).then(d => { if (Array.isArray(d)) setOpenProjects(d); }).catch(() => {});
    fetch(`${API}/reviews/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => {});
    fetch(`${API}/users`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAllUsers(d); }).catch(() => {});
  }, [user.email]);

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const unreadMsgs = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;
  const avgRating  = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  const stats = [
    { label: 'Services actifs',  value: activeJobs,          icon: '💼', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Nouvelles offres', value: openProjects.length,  icon: '🎯', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Messages non lus', value: unreadMsgs,           icon: '💬', color: 'from-sky-500 to-sky-600' },
    { label: 'Note moyenne',     value: avgRating,            icon: '⭐', color: 'from-amber-500 to-amber-600' },
  ];

  const getOtherUser = (email) => allUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-br ${s.color} opacity-10`} />
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent messages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">💬 Messages récents</h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Aucune conversation</p>
          ) : (
            <div className="space-y-3">
              {conversations.slice(0, 4).map(c => {
                const other = getOtherUser(c.other_email);
                const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
                return (
                  <div key={c.other_email} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    {other?.photo
                      ? <img src={other.photo} alt={other.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                      : <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${AVATAR_COLORS[(other?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]}`}>{(other?.name || c.other_email).slice(0,2).toUpperCase()}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{other?.name || c.other_email}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.last_message}</p>
                    </div>
                    {isUnread && <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New offers (open client projects) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🎯 Nouvelles offres clients</h3>
          {openProjects.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Aucune offre disponible</p>
          ) : (
            <div className="space-y-3">
              {openProjects.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                    {p.budget && <p className="text-[10px] text-emerald-600 font-semibold">💰 {p.budget}</p>}
                  </div>
                  <StatusBadge status="open" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My services summary */}
      {jobs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">💼 Mes services récents</h3>
          <div className="space-y-3">
            {jobs.slice(0, 3).map(j => (
              <div key={j.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{j.title}</p>
                  <p className="text-[10px] text-slate-500">{j.category}{j.price ? ` — ${j.price} TND` : ''}</p>
                </div>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. JOBS / GIGS TAB ────────────────────────────────────────────────────────
function JobsTab({ user, allUsers }) {
  const [subTab, setSubTab] = useState('offers');
  const [myJobs, setMyJobs] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '' });
  const [loading, setLoading] = useState(false);

  const fetchMyJobs = useCallback(async () => {
    const res = await fetch(`${API}/freelancer-jobs/${encodeURIComponent(user.email)}`);
    const data = await res.json();
    if (Array.isArray(data)) setMyJobs(data);
  }, [user.email]);

  useEffect(() => {
    fetchMyJobs();
    fetch(`${API}/projects/browse/open`).then(r => r.json()).then(d => { if (Array.isArray(d)) setOpenProjects(d); }).catch(() => {});
    fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setContracts(d); }).catch(() => {});
  }, [fetchMyJobs, user.email]);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch(`${API}/freelancer-jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerEmail: user.email, ...form }),
    });
    setForm({ title: '', description: '', price: '', category: '' });
    setShowForm(false);
    await fetchMyJobs();
    setLoading(false);
  }

  async function handleStatus(id, status) {
    await fetch(`${API}/freelancer-jobs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchMyJobs();
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    await fetch(`${API}/freelancer-jobs/${id}`, { method: 'DELETE' });
    fetchMyJobs();
  }

  const getClient = (email) => allUsers?.find(u => u.email?.toLowerCase() === email?.toLowerCase());

  const SUB_TABS = [
    { id: 'offers',    label: 'Offres disponibles', count: openProjects.length },
    { id: 'mygigs',   label: 'Mes services',        count: myJobs.length },
    { id: 'contracts',label: 'Contrats actifs',     count: contracts.length },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${subTab === t.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            {t.label}
            {t.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subTab === t.id ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Offres disponibles */}
      {subTab === 'offers' && (
        <div className="space-y-3">
          {openProjects.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-3">🎯</p>
              <p className="font-semibold text-slate-600 dark:text-slate-300">Aucune offre disponible</p>
              <p className="text-sm mt-1">Les projets ouverts des clients apparaîtront ici</p>
            </div>
          ) : openProjects.map(p => {
            const client = getClient(p.client_email);
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <Avatar user={client || { email: p.client_email, name: p.client_email }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{p.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{client?.name || p.client_email}</p>
                    {p.description && <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-3 flex-wrap">
                      {p.budget && <span className="text-xs font-bold text-emerald-600">💰 {p.budget}</span>}
                      <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString('fr-TN')}</span>
                    </div>
                  </div>
                  <StatusBadge status="open" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mes services */}
      {subTab === 'mygigs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Mes Services <span className="text-slate-400 font-normal text-sm">({myJobs.length})</span></h2>
            <button onClick={() => setShowForm(!showForm)} className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors">
              {showForm ? '✕ Annuler' : '+ Nouveau service'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Titre du service *" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description du service..." rows={3} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="Prix (TND)" type="number" min="0" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Catégorie</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={loading || !form.title.trim()} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                {loading ? 'Publication...' : 'Publier le service'}
              </button>
            </div>
          )}

          {myJobs.length === 0 && !showForm && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-3">💼</p>
              <p className="font-semibold text-slate-600 dark:text-slate-300">Aucun service publié</p>
              <p className="text-sm mt-1">Publiez vos services pour attirer des clients</p>
            </div>
          )}

          <div className="space-y-3">
            {myJobs.map(j => (
              <div key={j.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{j.title}</h3>
                      <StatusBadge status={j.status} />
                    </div>
                    {j.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 line-clamp-2">{j.description}</p>}
                    <div className="flex items-center gap-3">
                      {j.price && <span className="text-xs font-bold text-emerald-600">💰 {j.price} TND</span>}
                      {j.category && <span className="text-xs text-slate-400">{j.category}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <button onClick={() => handleStatus(j.id, j.status === 'active' ? 'paused' : 'active')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap">
                      {j.status === 'active' ? 'Mettre en pause' : 'Activer'}
                    </button>
                    <button onClick={() => handleDelete(j.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contrats actifs */}
      {subTab === 'contracts' && (
        <div className="space-y-3">
          {contracts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-3">🤝</p>
              <p className="font-semibold text-slate-600 dark:text-slate-300">Aucun contrat actif</p>
              <p className="text-sm mt-1">Les projets où vous êtes assigné apparaîtront ici</p>
            </div>
          ) : contracts.map(p => {
            const client = getClient(p.client_email);
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <Avatar user={client || { email: p.client_email }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-slate-500">{client?.name || p.client_email}</p>
                    {p.budget && <p className="text-xs font-bold text-emerald-600 mt-1">💰 {p.budget}</p>}
                    {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



// ── 5. SETTINGS TAB ───────────────────────────────────────────────────────────
function SettingsTab({ user, logout, updateUser }) {
  const [availability, setAvailability] = useState(user?.availability || 'available');
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  async function handleAvailability(val) {
    setAvailability(val);
    await updateUser(user.email, { availability: val });
  }

  async function handlePasswordChange() {
    if (!pwForm.current || !pwForm.newPw) { setPwMsg({ type: 'error', text: 'Tous les champs sont requis' }); return; }
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'error', text: 'Minimum 6 caractères' }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' }); return; }
    setPwLoading(true);
    try {
      const verify = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: pwForm.current }) });
      const vData = await verify.json();
      if (vData.error) { setPwMsg({ type: 'error', text: 'Mot de passe actuel incorrect' }); setPwLoading(false); return; }
      await fetch(`${API}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, newPassword: pwForm.newPw }) });
      setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès ✓' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch { setPwMsg({ type: 'error', text: 'Erreur réseau. Réessayez.' }); }
    finally { setPwLoading(false); }
  }

  async function handleDeleteAccount() {
    await fetch(`${API}/users/${encodeURIComponent(user.email)}`, { method: 'DELETE' });
    logout();
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Account info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">👤 Informations du compte</h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: user.email },
            { label: 'Rôle', value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Freelancer' },
            { label: 'Membre depuis', value: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('fr-TN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">🟢 Statut de disponibilité</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Contrôlez si les clients peuvent vous voir comme disponible pour de nouveaux projets.</p>
        <div className="flex gap-2">
          {[{id:'available',label:'Disponible',desc:'Visible pour de nouveaux projets'},{id:'unavailable',label:'Indisponible',desc:'Caché des recherches actives'}].map(a => (
            <button key={a.id} onClick={() => handleAvailability(a.id)}
              className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${availability === a.id ? (a.id === 'available' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-400 bg-slate-50 dark:bg-slate-800') : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${a.id === 'available' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className={`text-xs font-bold ${availability === a.id ? (a.id === 'available' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300') : 'text-slate-500'}`}>{a.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 pl-4">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🔒 Changer le mot de passe</h3>
        <div className="space-y-3">
          <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({...f, current: e.target.value}))} placeholder="Mot de passe actuel" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({...f, newPw: e.target.value}))} placeholder="Nouveau mot de passe (min 6 caractères)" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} placeholder="Confirmer le nouveau mot de passe" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {pwMsg && <p className={`text-xs font-semibold ${pwMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>{pwMsg.text}</p>}
          <button onClick={handlePasswordChange} disabled={pwLoading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {pwLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">🔔 Notifications</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Recevez des alertes pour les nouveaux messages et offres clients.</p>
        <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Notifications email</span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Actif</span>
        </div>
      </div>

      {/* Payout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">💰 Paiements & Revenus</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Configurez vos méthodes de réception de paiement.</p>
        <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <p className="text-2xl mb-2">💳</p>
          <p className="text-xs font-semibold text-slate-500">Bientôt disponible</p>
          <p className="text-[10px] text-slate-400 mt-1">Intégration paiement en cours</p>
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800/40 p-6">
        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">⚠️ Supprimer le compte</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Cette action est irréversible. Toutes vos données seront supprimées définitivement.</p>
        {!delConfirm ? (
          <button onClick={() => setDelConfirm(true)} className="text-sm font-semibold text-rose-600 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-rose-600">Êtes-vous sûr ? Cette action ne peut pas être annulée.</p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} className="flex-1 text-sm font-bold bg-rose-600 text-white py-2.5 rounded-xl hover:bg-rose-700 transition-colors">Confirmer</button>
              <button onClick={() => setDelConfirm(false)} className="flex-1 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl transition-colors">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN FreelancerDashboard ──────────────────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profil',     icon: '👤' },
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'jobs',      label: 'Services',   icon: '💼' },
  { id: 'messages',  label: 'Messages',   icon: '💬' },
  { id: 'settings',  label: 'Paramètres', icon: '⚙️' },
];

export default function FreelancerDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile');
  const [initialChat] = useState(() => searchParams.get('with') || null);
  const { user, updateUser, logout, users } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (initialChat) setActiveTab('messages');
  }, [initialChat]);

  if (!user) return null;

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 py-4">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">{user.name}</h1>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shrink-0">Freelancer</span>
          </div>
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'profile'   && <ProfileTab user={user} updateUser={updateUser} />}
        {activeTab === 'dashboard' && <DashboardStatsTab user={user} />}
        {activeTab === 'jobs'      && <JobsTab user={user} allUsers={users} />}
        {activeTab === 'messages'  && <MessagesTab user={user} allUsers={users} initialChat={initialChat} />}
        {activeTab === 'settings'  && <SettingsTab user={user} logout={logout} updateUser={updateUser} />}
      </div>
    </div>
  );
}
