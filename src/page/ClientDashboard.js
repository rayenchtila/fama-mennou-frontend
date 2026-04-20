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

const AVATAR_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];

function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  const color = AVATAR_COLORS[(user?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  if (user?.photo) return <img src={user.photo} alt={user.name} className={`${sz} rounded-2xl object-cover`} />;
  return <div className={`${sz} ${color} rounded-2xl flex items-center justify-center text-white font-bold shrink-0`}>{user?.name?.slice(0,2).toUpperCase()}</div>;
}

function StatusBadge({ status }) {
  const map = {
    open:        { label: 'Ouvert',    color: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
    in_progress: { label: 'En cours',  color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    completed:   { label: 'Terminé',   color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  };
  const s = map[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>;
}

// ── 1. PROFILE TAB ────────────────────────────────────────────────────────────
function ProfileTab({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    company: user?.company || '',
    region: user?.region || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSave() {
    setSaving(true);
    await updateUser(user.email, form);
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

  const previewUser = { ...user, ...form };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Main card */}
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
            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">Client</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setPreview(!preview)} className="text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {preview ? 'Masquer aperçu' : 'Aperçu public'}
            </button>
            <button onClick={() => setEditing(!editing)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nom complet</label>
              {editing ? <input value={form.name} onChange={set('name')} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              : <p className="text-sm text-slate-900 dark:text-white">{user?.name || '—'}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Entreprise / Société</label>
              {editing ? <input value={form.company} onChange={set('company')} placeholder="Nom de votre entreprise" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              : <p className="text-sm text-slate-900 dark:text-white">{user?.company || '—'}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio</label>
            {editing ? <textarea value={form.bio} onChange={set('bio')} rows={3} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Parlez de vous ou de votre entreprise..." />
            : <p className="text-sm text-slate-500 dark:text-slate-400">{user?.bio || '—'}</p>}
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
            ) : <p className="text-sm text-slate-900 dark:text-white capitalize">{user?.gender === 'male' ? 'Homme' : user?.gender === 'female' ? 'Femme' : '—'}</p>}
          </div>

          {editing && (
            <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          )}
        </div>
      </div>

      {/* Public profile preview */}
      {preview && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 p-6">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-wider">Aperçu de votre profil public</p>
          <div className="flex items-center gap-4 mb-4">
            <Avatar user={previewUser} size="lg" />
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{previewUser.name || 'Votre nom'}</p>
              {previewUser.company && <p className="text-sm text-slate-500">{previewUser.company}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700">Client</span>
                {previewUser.region && <span className="text-xs text-slate-400">📍 {previewUser.region}</span>}
              </div>
            </div>
          </div>
          {previewUser.bio && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{previewUser.bio}</p>}
          {!previewUser.bio && <p className="text-sm text-slate-400 italic">Aucune bio renseignée.</p>}
        </div>
      )}
    </div>
  );
}

// ── 2. DASHBOARD STATS TAB ────────────────────────────────────────────────────
function DashboardStatsTab({ user, notifications }) {
  const [projects, setProjects] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetch(`${API}/projects/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d); }).catch(() => {});
    fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setConversations(d); }).catch(() => {});
    fetch(`${API}/users`).then(r => r.json()).then(d => { if (Array.isArray(d)) setAllUsers(d); }).catch(() => {});
  }, [user.email]);

  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const unreadMsgs = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;
  const freelancersContacted = conversations.filter(c => {
    const other = allUsers.find(u => u.email?.toLowerCase() === c.other_email);
    return other?.role === 'freelancer';
  }).length;
  const unreadNotifs = (notifications || []).filter(n => !n.read).length;

  const stats = [
    { label: 'Projets actifs',        value: activeProjects,       icon: '⚡', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Messages non lus',       value: unreadMsgs,           icon: '💬', color: 'from-sky-500 to-sky-600' },
    { label: 'Freelancers contactés',  value: freelancersContacted, icon: '👥', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Notifications',          value: unreadNotifs,         icon: '🔔', color: 'from-amber-500 to-amber-600' },
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
        {/* Recent projects */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">🗂️ Projets récents</h3>
          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Aucun projet pour l'instant</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                    {p.budget && <p className="text-[10px] text-emerald-600 font-semibold">💰 {p.budget}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}

// ── 3. PROJECTS TAB ───────────────────────────────────────────────────────────
function ProjectsTab({ user, allUsers }) {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: '' });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchProjects = useCallback(async () => {
    const res = await fetch(`${API}/projects/${encodeURIComponent(user.email)}`);
    const data = await res.json();
    if (Array.isArray(data)) setProjects(data);
  }, [user.email]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function handleCreate() {
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch(`${API}/projects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientEmail: user.email, ...form }),
    });
    setForm({ title: '', description: '', budget: '' });
    setShowForm(false);
    await fetchProjects();
    setLoading(false);
  }

  async function handleStatus(id, status) {
    await fetch(`${API}/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchProjects();
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce projet ?')) return;
    await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  }

  const statusCycle = { open: 'in_progress', in_progress: 'completed', completed: 'open' };
  const statusNext  = { open: 'Démarrer',    in_progress: 'Terminer',   completed: 'Rouvrir' };

  const getFreelancer = (email) => allUsers?.find(u => u.email?.toLowerCase() === email?.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mes Projets <span className="text-slate-400 font-normal text-sm">({projects.length})</span></h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors">
          {showForm ? '✕ Annuler' : '+ Nouveau projet'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Titre du projet *" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description du projet — objectifs, livrables attendus..." rows={3} className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} placeholder="Budget (ex: 500 TND)" className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={handleCreate} disabled={loading || !form.title.trim()} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
            {loading ? 'Création...' : 'Créer le projet'}
          </button>
        </div>
      )}

      {projects.length === 0 && !showForm && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-3">🗂️</p>
          <p className="font-semibold text-slate-600 dark:text-slate-300">Aucun projet pour l'instant</p>
          <p className="text-sm mt-1">Créez votre premier projet et trouvez un freelancer</p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map(p => {
          const freelancer = p.freelancer_email ? getFreelancer(p.freelancer_email) : null;
          const isExpanded = expanded === p.id;
          return (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {p.budget && <span className="text-xs font-semibold text-emerald-600">💰 {p.budget}</span>}
                      <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString('fr-TN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
                      {isExpanded ? 'Moins' : 'Détails'}
                    </button>
                    <button onClick={() => handleStatus(p.id, statusCycle[p.status] || 'open')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap">
                      {statusNext[p.status] || 'Changer'}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Supprimer</button>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                  {freelancer ? (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                      <Avatar user={freelancer} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Freelancer assigné</p>
                        <p className="text-xs text-slate-500">{freelancer.name} — {p.freelancer_email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun freelancer assigné. Contactez-en un depuis la page Freelancers.</p>
                  )}
                  {p.description && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description complète</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{p.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 4. MESSAGES TAB ───────────────────────────────────────────────────────────
function MessagesTab({ user, allUsers, initialChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(initialChat || null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMsg() {
    if (!newMsg.trim() || !selectedChat) return;
    const content = newMsg.trim();
    setNewMsg('');
    await fetch(`${API}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email, receiverEmail: selectedChat, content }),
    });
    fetchMsgs(selectedChat);
    fetchConvs();
  }

  const getUser = (email) => allUsers?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  const otherUser = selectedChat ? getUser(selectedChat) : null;
  const unreadCount = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;

  const filteredUsers = allUsers?.filter(u =>
    u.email !== user.email && u.cinStatus === 'approved' &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Left: Conversation list */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r border-slate-100 dark:border-slate-800 shrink-0`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Messages {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">{unreadCount}</span>}
          </h3>
          <button onClick={() => setShowPicker(!showPicker)} className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-indigo-700 transition-colors">+</button>
        </div>

        {showPicker && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filteredUsers.map(u => (
                <button key={u.email} onClick={() => { setSelectedChat(u.email.toLowerCase()); setShowPicker(false); setSearch(''); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-left transition-colors">
                  <Avatar user={u} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Aucun résultat</p>}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-xs font-semibold">Aucune conversation</p>
              <p className="text-xs mt-1 opacity-60">Cliquez + pour démarrer</p>
            </div>
          )}
          {conversations.map(c => {
            const other = getUser(c.other_email);
            const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
            return (
              <button key={c.other_email} onClick={() => setSelectedChat(c.other_email)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800/50 ${selectedChat === c.other_email ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''}`}>
                <Avatar user={other || { email: c.other_email, name: c.other_email }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
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

      {/* Right: Chat window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button className="md:hidden text-slate-400 hover:text-slate-600 mr-1" onClick={() => setSelectedChat(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <Avatar user={otherUser || { email: selectedChat }} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{otherUser?.name || selectedChat}</p>
              <p className="text-[10px] text-slate-400 capitalize">{otherUser?.role || 'Utilisateur'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm font-semibold">Démarrez la conversation</p>
                <p className="text-xs mt-1 opacity-60">Négociez, discutez, collaborez</p>
              </div>
            )}
            {messages.map(m => {
              const isMine = m.sender_email === user.email?.toLowerCase();
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700'}`}>
                    <p className="leading-relaxed">{m.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Votre message..." className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={sendMsg} disabled={!newMsg.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors shrink-0">
              Envoyer
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-semibold text-slate-600 dark:text-slate-300">Sélectionnez une conversation</p>
            <p className="text-xs mt-1">ou cliquez + pour en démarrer une</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 5. SETTINGS TAB ───────────────────────────────────────────────────────────
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
            { label: 'Rôle', value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Client' },
            { label: 'Plan', value: user.plan === 'premium' ? 'Premium ✦' : 'Free' },
            { label: 'Membre depuis', value: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('fr-TN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
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
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Vous recevez des notifications pour les mises à jour importantes de votre compte.</p>
        <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Notifications email</span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Actif</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">💳 Méthodes de paiement</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Gérez vos méthodes de paiement pour les projets.</p>
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
              <button onClick={handleDeleteAccount} className="flex-1 text-sm font-bold bg-rose-600 text-white py-2.5 rounded-xl hover:bg-rose-700 transition-colors">Confirmer la suppression</button>
              <button onClick={() => setDelConfirm(false)} className="flex-1 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ClientDashboard ──────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profil',     icon: '👤' },
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'projects',  label: 'Projets',    icon: '🗂️' },
  { id: 'messages',  label: 'Messages',   icon: '💬' },
  { id: 'settings',  label: 'Paramètres', icon: '⚙️' },
];

export default function ClientDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile');
  const [initialChat] = useState(() => searchParams.get('with') || null);
  const { user, updateUser, logout, users, getUserNotifications } = useAuth();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (initialChat) setActiveTab('messages');
  }, [initialChat]);

  if (!user) return null;

  const notifications = getUserNotifications(user.email);

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
            <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 shrink-0">Client</span>
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
        {activeTab === 'dashboard' && <DashboardStatsTab user={user} notifications={notifications} />}
        {activeTab === 'projects'  && <ProjectsTab user={user} allUsers={users} />}
        {activeTab === 'messages'  && <MessagesTab user={user} allUsers={users} initialChat={initialChat} />}
        {activeTab === 'settings'  && <SettingsTab user={user} logout={logout} />}
      </div>
    </div>
  );
}
