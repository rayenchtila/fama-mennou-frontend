import { useState, useEffect, useRef, useCallback } from 'react';
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

function StatusBadge({ status }) {
  const map = {
    active:  { label: 'Actif',      color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
    paused:  { label: 'En pause',   color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    closed:  { label: 'Fermé',      color: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' },
  };
  const s = map[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>;
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
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
    availability: user?.availability || 'available',
  });
  const [saving, setSaving] = useState(false);
  const [portfolioList, setPortfolioList] = useState(
    Array.isArray(user?.portfolio) ? user.portfolio : []
  );
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const fileRef = useRef();
  const portfolioRef = useRef();

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSave() {
    setSaving(true);
    const skillsArr = form.skills
      ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
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
  }

  async function removePortfolioItem(idx) {
    const updated = portfolioList.filter((_, i) => i !== idx);
    setPortfolioList(updated);
    setPortfolioSaving(true);
    await updateUser(user.email, { portfolio: updated });
    setPortfolioSaving(false);
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Main info card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        {/* Photo + header */}
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
            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Freelancer</span>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0">
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nom complet</label>
            {editing ? (
              <input value={form.name} onChange={set('name')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            ) : <p className="text-sm text-slate-900 dark:text-white">{user?.name || '—'}</p>}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio</label>
            {editing ? (
              <textarea value={form.bio} onChange={set('bio')} rows={3} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Décrivez vos compétences et expériences..." />
            ) : <p className="text-sm text-slate-500 dark:text-slate-400">{user?.bio || '—'}</p>}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Compétences</label>
            {editing ? (
              <input value={form.skills} onChange={set('skills')} placeholder="Ex: React, Node.js, Figma (séparés par virgule)" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(user?.skills) ? user.skills : (user?.skills || '').split(',').map(s => s.trim()).filter(Boolean)).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold rounded-lg">{s}</span>
                ))}
                {!user?.skills && <p className="text-sm text-slate-500">—</p>}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Disponibilité</label>
            {editing ? (
              <div className="flex gap-2">
                {[{id:'available',label:'Disponible'},{id:'unavailable',label:'Indisponible'}].map(a => (
                  <button key={a.id} type="button" onClick={() => setForm(f => ({...f, availability: a.id}))}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${form.availability === a.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl ${user?.availability === 'available' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.availability === 'available' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {user?.availability === 'available' ? 'Disponible' : 'Indisponible'}
              </span>
            )}
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Région</label>
            {editing ? (
              <select value={form.region} onChange={set('region')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Sélectionnez</option>
                {TUNISIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : <p className="text-sm text-slate-900 dark:text-white">{user?.region || '—'}</p>}
          </div>

          {/* Gender */}
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
            ) : <p className="text-sm text-slate-900 dark:text-white capitalize">{user?.gender || '—'}</p>}
          </div>

          {/* DOB */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Date de naissance</label>
            {editing ? (
              <input type="date" value={form.dob} onChange={set('dob')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            ) : <p className="text-sm text-slate-900 dark:text-white">{user?.dob || '—'}</p>}
          </div>

          {editing && (
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          )}
        </div>
      </div>

      {/* Portfolio card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">💼 Portfolio</h3>
          <button onClick={() => portfolioRef.current?.click()} disabled={portfolioSaving}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
            {portfolioSaving ? '...' : '+ Ajouter'}
          </button>
          <input ref={portfolioRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={handlePortfolioFile} />
        </div>

        {portfolioList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Aucun fichier dans le portfolio</p>
        ) : (
          <div className="space-y-2">
            {portfolioList.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-lg">{item.type?.includes('image') ? '🖼️' : '📄'}</span>
                <a href={item.data} download={item.name} className="flex-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate hover:underline">
                  {item.name}
                </a>
                <button onClick={() => removePortfolioItem(i)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard Stats Tab ───────────────────────────────────────────────────────
function DashboardStatsTab({ user }) {
  const [jobs, setJobs] = useState([]);
  const [convCount, setConvCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/freelancer-jobs/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setJobs(d); }).catch(() => {});
    fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setConvCount(d.length);
        setUnreadCount(d.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length);
      }
    }).catch(() => {});
    fetch(`${API}/reviews`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReviewCount(d.filter(r => r.freelancer_email === user.email?.toLowerCase()).length);
    }).catch(() => {});
  }, [user.email]);

  const stats = [
    { label: 'Services publiés', value: jobs.length,                                       icon: '💼', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
    { label: 'Conversations',    value: convCount,                                          icon: '💬', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' },
    { label: 'Non lus',          value: unreadCount,                                       icon: '🔔', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
    { label: 'Avis reçus',       value: reviewCount,                                       icon: '⭐', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {jobs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Services récents</h3>
          <div className="space-y-3">
            {jobs.slice(0, 3).map(j => (
              <div key={j.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{j.title}</p>
                  <p className="text-xs text-slate-500">{j.category} {j.price ? `— ${j.price} TND` : ''}</p>
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

// ── Jobs Tab ──────────────────────────────────────────────────────────────────
function JobsTab({ user }) {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '' });
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    const res = await fetch(`${API}/freelancer-jobs/${encodeURIComponent(user.email)}`);
    const data = await res.json();
    if (Array.isArray(data)) setJobs(data);
  }, [user.email]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch(`${API}/freelancer-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerEmail: user.email, ...form }),
    });
    setForm({ title: '', description: '', price: '', category: '' });
    setShowForm(false);
    await fetchJobs();
    setLoading(false);
  }

  async function handleStatus(id, status) {
    await fetch(`${API}/freelancer-jobs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchJobs();
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    await fetch(`${API}/freelancer-jobs/${id}`, { method: 'DELETE' });
    fetchJobs();
  }

  const statusCycle = { active: 'paused', paused: 'active', closed: 'active' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Services ({jobs.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors">
          {showForm ? '✕ Annuler' : '+ Nouveau service'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Titre du service *" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description du service" rows={2} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

      {jobs.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">💼</p>
          <p className="font-semibold">Aucun service publié</p>
          <p className="text-sm mt-1">Publiez votre premier service</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map(j => (
          <div key={j.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{j.title}</h3>
                  <StatusBadge status={j.status} />
                </div>
                {j.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{j.description}</p>}
                <div className="flex items-center gap-3">
                  {j.price && <p className="text-xs font-semibold text-emerald-600">💰 {j.price} TND</p>}
                  {j.category && <p className="text-xs text-slate-400">{j.category}</p>}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(j.created_at).toLocaleDateString('fr-TN')}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleStatus(j.id, statusCycle[j.status] || 'active')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap">
                  {j.status === 'active' ? 'Mettre en pause' : 'Activer'}
                </button>
                <button onClick={() => handleDelete(j.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Messages Tab ──────────────────────────────────────────────────────────────
function MessagesTab({ user, allUsers, initialChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(initialChat || null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const chatEndRef = useRef();
  const pollRef = useRef();
  const msgPollRef = useRef();

  const fetchConvs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, [user.email]);

  const fetchMsgs = useCallback(async (otherEmail) => {
    try {
      const res = await fetch(`${API}/messages/${encodeURIComponent(user.email)}/${encodeURIComponent(otherEmail)}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      await fetch(`${API}/messages/read/${encodeURIComponent(otherEmail)}/${encodeURIComponent(user.email)}`, { method: 'PATCH' });
    } catch {}
  }, [user.email]);

  useEffect(() => {
    fetchConvs();
    pollRef.current = setInterval(fetchConvs, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchConvs]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMsgs(selectedChat);
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => fetchMsgs(selectedChat), 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, fetchMsgs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMsg() {
    if (!newMsg.trim() || !selectedChat) return;
    const content = newMsg.trim();
    setNewMsg('');
    await fetch(`${API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email, receiverEmail: selectedChat, content }),
    });
    fetchMsgs(selectedChat);
    fetchConvs();
  }

  const getUser = (email) => allUsers?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  const otherUser = selectedChat ? getUser(selectedChat) : null;
  const unreadConvs = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase());

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Conversation list */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Messages {unreadConvs.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">{unreadConvs.length}</span>}</h3>
          <button onClick={() => setShowPicker(!showPicker)} className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold hover:bg-indigo-700">+</button>
        </div>

        {showPicker && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 mb-2">Choisir un utilisateur :</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {allUsers?.filter(u => u.email !== user.email && u.cinStatus === 'approved').map(u => (
                <button key={u.email} onClick={() => { setSelectedChat(u.email.toLowerCase()); setShowPicker(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                  <Avatar user={u} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-xs">Aucune conversation</p>
              <p className="text-xs mt-1">Cliquez + pour démarrer</p>
            </div>
          )}
          {conversations.map(c => {
            const other = getUser(c.other_email);
            const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
            return (
              <button key={c.other_email} onClick={() => setSelectedChat(c.other_email)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${selectedChat === c.other_email ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                <Avatar user={other || { email: c.other_email, name: c.other_email }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                    {other?.name || c.other_email}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{c.last_message}</p>
                </div>
                {isUnread && <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
            <button className="md:hidden text-slate-400 hover:text-slate-600 mr-1" onClick={() => setSelectedChat(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <Avatar user={otherUser || { email: selectedChat }} size="sm" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{otherUser?.name || selectedChat}</p>
              <p className="text-[10px] text-slate-400 capitalize">{otherUser?.role || 'Utilisateur'}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p className="text-sm">Démarrez la conversation</p>
              </div>
            )}
            {messages.map(m => {
              const isMine = m.sender_email === user.email?.toLowerCase();
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'}`}>
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Votre message..." className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={sendMsg} disabled={!newMsg.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors">
              Envoyer
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-semibold">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ user, logout }) {
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  async function handlePasswordChange() {
    if (!pwForm.current || !pwForm.newPw) { setPwMsg({ type: 'error', text: 'Tous les champs sont requis' }); return; }
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'error', text: 'Minimum 6 caractères' }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' }); return; }
    setPwLoading(true);
    try {
      const verify = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: pwForm.current }) });
      const vData = await verify.json();
      if (vData.error) { setPwMsg({ type: 'error', text: 'Mot de passe actuel incorrect' }); return; }
      await fetch(`${API}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, newPassword: pwForm.newPw }) });
      setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès ✓' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch {
      setPwMsg({ type: 'error', text: 'Erreur réseau. Réessayez.' });
    } finally { setPwLoading(false); }
  }

  async function handleDeleteAccount() {
    await fetch(`${API}/users/${encodeURIComponent(user.email)}`, { method: 'DELETE' });
    logout();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🔒 Changer le mot de passe</h3>
        <div className="space-y-3">
          <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({...f, current: e.target.value}))} placeholder="Mot de passe actuel" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({...f, newPw: e.target.value}))} placeholder="Nouveau mot de passe (min 6)" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} placeholder="Confirmer le nouveau mot de passe" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {pwMsg && <p className={`text-xs font-semibold ${pwMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>{pwMsg.text}</p>}
          <button onClick={handlePasswordChange} disabled={pwLoading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {pwLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">🔔 Notifications</h3>
        <p className="text-xs text-slate-400">Vous recevez des notifications pour les mises à jour importantes de votre compte.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">💳 Méthodes de paiement</h3>
        <p className="text-xs text-slate-400">Bientôt disponible — intégration paiement en cours.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800/50 p-6">
        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2">⚠️ Supprimer le compte</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Cette action est irréversible. Toutes vos données seront supprimées.</p>
        {!delConfirm ? (
          <button onClick={() => setDelConfirm(true)} className="text-sm font-semibold text-rose-600 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleDeleteAccount} className="flex-1 text-sm font-bold bg-rose-600 text-white py-2 rounded-xl hover:bg-rose-700 transition-colors">Confirmer</button>
            <button onClick={() => setDelConfirm(false)} className="flex-1 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-xl">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main FreelancerDashboard ──────────────────────────────────────────────────
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

  if (!user) return null;

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 py-4">
            <Avatar user={user} size="md" />
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">{user.name}</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide -mb-px">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'profile'   && <ProfileTab user={user} updateUser={updateUser} />}
        {activeTab === 'dashboard' && <DashboardStatsTab user={user} />}
        {activeTab === 'jobs'      && <JobsTab user={user} />}
        {activeTab === 'messages'  && <MessagesTab user={user} allUsers={users} initialChat={initialChat} />}
        {activeTab === 'settings'  && <SettingsTab user={user} logout={logout} />}
      </div>
    </div>
  );
}
