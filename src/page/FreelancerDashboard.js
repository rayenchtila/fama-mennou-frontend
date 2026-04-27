import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

const TUNISIAN_REGIONS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

const AVATAR_COLORS = [
  'from-indigo-500 to-indigo-600','from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600','from-amber-500 to-amber-600',
  'from-sky-500 to-sky-600','from-fuchsia-500 to-fuchsia-600',
  'from-violet-500 to-violet-600',
];

const TABS = [
  { id: 'profile',       label: 'Profil',          icon: '👤' },
  { id: 'dashboard',     label: 'Dashboard',        icon: '📊' },
  { id: 'find-projects', label: 'Trouver Projets',  icon: '🔎' },
  { id: 'missions',      label: 'Mes Missions',     icon: '📁' },
  { id: 'gains',         label: 'Gains',            icon: '💰' },
  { id: 'courses',       label: 'Mes Cours',        icon: '📚' },
  { id: 'settings',      label: 'Paramètres',       icon: '⚙️' },
  { id: 'logout',        label: 'Log out',          icon: '🚪', danger: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGradient(email = '') {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}
function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function Avi({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (user?.photo)
    return <img src={user.photo} alt={user.name} className={`${sz} rounded-2xl object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${getGradient(user?.email)} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(user?.name || user?.email || '?')}
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, loading }) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg mb-3 shadow-sm`}>{icon}</div>
      {loading
        ? <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-1" />
        : <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
      }
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          {action} →
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    open:        { label: 'Ouvert',   cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
    in_progress: { label: 'En cours', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    completed:   { label: 'Terminé',  cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

function Empty({ emoji, text, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-xs text-slate-400 font-medium">{text}</p>
      {action && (
        <button onClick={onAction} className="mt-3 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
  );
}

// ── TAB: Profil ───────────────────────────────────────────────────────────────

function ProfileTab({ user, updateUser }) {
  const [form, setForm]       = useState({ name: user.name || '', bio: user.bio || '', skills: user.skills || '', region: user.region || '', photo: user.photo || '' });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, ...form }),
      });
      if (!res.ok) throw new Error();
      await updateUser({ ...user, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center gap-5">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(user.email)} flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0`}>
          {form.photo
            ? <img src={form.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" onError={e => { e.target.style.display = 'none'; }} />
            : getInitials(form.name || user.email)
          }
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900 dark:text-white">{form.name || user.name}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
          <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">🧑‍💻 Freelancer</span>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Modifier le profil</h3>

        <InputField label="Nom complet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom" required />
        <InputField label="Photo (URL)" value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} placeholder="https://..." />

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Région</label>
          <select
            value={form.region}
            onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Choisir —</option>
            {TUNISIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Compétences</label>
          <input
            value={form.skills}
            onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="React, Node.js, Design…"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Séparées par des virgules</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder="Décrivez votre expertise…"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-sm shadow-indigo-500/30"
        >
          {saving ? 'Sauvegarde…' : saved ? '✅ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </form>

      {/* Skills chips */}
      {form.skills && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Compétences</p>
          <div className="flex flex-wrap gap-2">
            {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
              <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: Dashboard ────────────────────────────────────────────────────────────

function DashboardTab({ user, users, onNavigate, navigate }) {
  const [missions, setMissions]    = useState([]);
  const [convos, setConvos]        = useState([]);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
    ]).then(([m, c]) => {
      if (Array.isArray(m)) setMissions(m);
      if (Array.isArray(c)) setConvos(c);
      setLoading(false);
    });
  }, [user?.email]);

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user.name?.split(' ')[0] || 'Freelancer';

  const activeMissions    = missions.filter(p => p.status === 'in_progress').length;
  const completedMissions = missions.filter(p => p.status === 'completed').length;
  const unread            = convos.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;
  const recentMissions    = missions.slice(0, 5);
  const recentConvos      = convos.slice(0, 5);
  const clientContacts    = convos.filter(c => getUser(c.other_email)?.role === 'client').slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.photo
                ? <img src={user.photo} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                : <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(user.email)} flex items-center justify-center text-white text-lg font-bold shadow-md`}>{getInitials(user.name)}</div>
              }
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-0.5">{greeting} 👋</p>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{firstName}</h1>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">🧑‍💻 Freelancer</span>
            <button onClick={() => onNavigate('find-projects')} className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/30">
              Trouver des projets
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="⚡" label="Missions actives"   value={activeMissions}    sub={`sur ${missions.length} total`}                  gradient="from-indigo-500 to-indigo-600"  loading={loading} />
        <StatCard icon="✅" label="Missions terminées" value={completedMissions} sub={completedMissions > 0 ? 'Bien joué !' : 'Aucune'} gradient="from-emerald-500 to-emerald-600" loading={loading} />
        <StatCard icon="💬" label="Messages non lus"   value={unread}            sub={unread > 0 ? 'À consulter' : 'Tout lu'}           gradient="from-sky-500 to-sky-600"        loading={loading} />
        <StatCard icon="💰" label="Gains totaux"       value="—"                 sub="Bientôt disponible"                               gradient="from-violet-500 to-violet-600"  loading={false}   />
      </div>

      {/* Missions + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missions récentes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader icon="📁" title="Missions récentes" action="Voir tout" onAction={() => onNavigate('missions')} />
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            : recentMissions.length === 0
              ? <Empty emoji="📁" text="Aucune mission pour l'instant" action="Trouver des projets" onAction={() => onNavigate('find-projects')} />
              : (
                <div className="space-y-2">
                  {recentMissions.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-base shrink-0">
                        {p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⚡' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.budget ? <span className="text-emerald-600 font-semibold">{p.budget}</span> : 'Pas de budget'}
                          <span className="mx-1.5">·</span>
                          {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                  ))}
                </div>
              )
          }
        </div>

        {/* Messages récents */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader icon="💬" title="Messages récents" action="Ouvrir" onAction={() => navigate('/messages')} />
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            : recentConvos.length === 0
              ? <Empty emoji="💬" text="Aucune conversation" />
              : (
                <div className="space-y-1">
                  {recentConvos.map(c => {
                    const other   = getUser(c.other_email);
                    const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
                    return (
                      <button key={c.other_email} onClick={() => navigate('/messages')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left">
                        <div className="relative shrink-0">
                          <Avi user={other || { email: c.other_email }} size="sm" />
                          {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{other?.name || c.other_email}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.last_message || 'Aucun message'}</p>
                        </div>
                        {isUnread && <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                      </button>
                    );
                  })}
                </div>
              )
          }
        </div>
      </div>

      {/* Clients contactés */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon="⭐" title="Clients contactés" action="Explorer" onAction={() => navigate('/clients')} />
        {loading
          ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mx-auto" />
              </div>
            ))}</div>
          : clientContacts.length === 0
            ? <Empty emoji="⭐" text="Aucun client contacté pour l'instant" action="Parcourir les clients" onAction={() => navigate('/clients')} />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {clientContacts.map(c => {
                  const cl = getUser(c.other_email);
                  return (
                    <button key={c.other_email} onClick={() => navigate('/messages')}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-center group">
                      <div className="flex justify-center mb-2">
                        <Avi user={cl || { email: c.other_email }} size="md" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {cl?.name?.split(' ')[0] || c.other_email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{cl?.region || 'Client'}</p>
                      <span className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Contacter</span>
                    </button>
                  );
                })}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ── TAB: Trouver Projets ──────────────────────────────────────────────────────

function FindProjectsTab({ user, users, navigate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sent, setSent]         = useState({});

  useEffect(() => {
    fetch(`${API}/projects/open`)
      .then(r => r.json())
      .catch(() => [])
      .then(data => { if (Array.isArray(data)) setProjects(data); setLoading(false); });
  }, []);

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return !search || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.company?.toLowerCase().includes(q);
  });

  async function handleContact(clientEmail, projectId) {
    const key = `${clientEmail}-${projectId}`;
    setSent(s => ({ ...s, [key]: true }));
    navigate(`/messages?with=${encodeURIComponent(clientEmail)}`);
  }

  async function handleApply(project) {
    const key = `apply-${project.id}`;
    setSent(s => ({ ...s, [key]: true }));
    try {
      await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_email:   user.email,
          receiver_email: project.client_email || project.user_email,
          content: `Bonjour, je suis intéressé par votre projet "${project.title}". Je souhaite proposer mes services.`,
          project_id: project.id,
        }),
      });
    } catch {}
    navigate(`/messages?with=${encodeURIComponent(project.client_email || project.user_email)}`);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un projet…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Results */}
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}</div>
        : filtered.length === 0
          ? <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <Empty emoji="🔎" text={search ? 'Aucun projet correspond à votre recherche.' : 'Aucun projet ouvert pour l\'instant.'} />
            </div>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(p => {
                const client    = getUser(p.client_email || p.user_email);
                const contactKey = `${p.client_email || p.user_email}-${p.id}`;
                const applyKey   = `apply-${p.id}`;
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avi user={client || { email: p.client_email || p.user_email }} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400">{client?.name || (p.client_email || p.user_email)?.split('@')[0]}</p>
                        </div>
                      </div>
                      <StatusPill status={p.status || 'open'} />
                    </div>

                    {p.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                      {p.budget && <span className="font-semibold text-emerald-600 dark:text-emerald-400">💰 {p.budget}</span>}
                      {p.deadline && <span>📅 {new Date(p.deadline).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}</span>}
                      {p.company && <span>🏢 {p.company}</span>}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApply(p)}
                        disabled={sent[applyKey]}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        {sent[applyKey] ? '✅ Postulé' : '✉️ Postuler'}
                      </button>
                      <button
                        onClick={() => handleContact(p.client_email || p.user_email, p.id)}
                        className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        💬 Contacter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      }
    </div>
  );
}

// ── TAB: Mes Missions ─────────────────────────────────────────────────────────

function MissionsTab({ user, users, navigate }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .catch(() => [])
      .then(data => { if (Array.isArray(data)) setMissions(data); setLoading(false); });
  }, [user.email]);

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());

  const filtered = filter === 'all' ? missions : missions.filter(m => m.status === filter);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="⚡" label="En cours"  value={missions.filter(m => m.status === 'in_progress').length} gradient="from-amber-500 to-amber-600"   loading={loading} />
        <StatCard icon="✅" label="Terminées" value={missions.filter(m => m.status === 'completed').length}   gradient="from-emerald-500 to-emerald-600" loading={loading} />
        <StatCard icon="📋" label="Total"     value={missions.length}                                          gradient="from-indigo-500 to-indigo-600"   loading={loading} />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon="📁" title="Mes Missions" />
          <div className="flex gap-1">
            {[['all','Tout'],['in_progress','En cours'],['completed','Terminé'],['open','Ouvert']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${filter === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? <Empty emoji="📁" text="Aucune mission dans cette catégorie" />
            : (
              <div className="space-y-3">
                {filtered.map(p => {
                  const client = getUser(p.client_email || p.user_email);
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-lg shrink-0">
                        {p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⚡' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {client?.name || (p.client_email || p.user_email)}
                          {p.budget && <><span className="mx-1.5">·</span><span className="text-emerald-600 font-semibold">{p.budget}</span></>}
                          <span className="mx-1.5">·</span>
                          {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusPill status={p.status} />
                        <button
                          onClick={() => navigate(`/messages?with=${encodeURIComponent(p.client_email || p.user_email)}`)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors whitespace-nowrap"
                        >
                          💬 Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ── TAB: Gains ────────────────────────────────────────────────────────────────

function GainsTab({ user }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setMissions(data); setLoading(false); });
  }, [user.email]);

  const completed = missions.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gains récents',       value: '—', icon: '📥', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Paiements en attente', value: '—', icon: '⏳', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
          { label: 'Total gagné',         value: '—', icon: '✅', color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-5 flex items-center gap-3`}>
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Missions terminées */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon="✅" title="Missions terminées" />
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
          : completed.length === 0
            ? <Empty emoji="💰" text="Aucune mission terminée pour l'instant" />
            : (
              <div className="space-y-3">
                {completed.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-lg shrink-0">✅</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{p.budget || '—'}</p>
                      <p className="text-[10px] text-slate-400">Budget</p>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </div>

      {/* Coming soon */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
        <span className="text-3xl">🔧</span>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Intégration paiement en cours</p>
        <p className="text-xs text-slate-400">Le détail de vos gains et retraits apparaîtra ici</p>
      </div>
    </div>
  );
}

// ── TAB: Mes Cours ────────────────────────────────────────────────────────────

const COURSE_CATEGORIES = ['Design','Development','Marketing','Business','Music','Photography','Finance','Health','Other'];

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function CoursesTab({ user }) {
  const navigate = useNavigate();
  const [courses,      setCourses]      = useState([]);
  const [earnings,     setEarnings]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showLessons,  setShowLessons]  = useState(null);
  const [showSession,  setShowSession]  = useState(null);
  const [lessons,      setLessons]      = useState([]);

  const [form, setForm] = useState({ title:'', description:'', thumbnail_url:'', category:'', full_price:'', first_lesson_free: false, _videoFile: null, _photoFile: null });
  const [lForm, setLForm] = useState({ title:'', description:'', video_url:'', duration_min:'', price:'0', is_free_preview: false });
  const [sForm, setSForm] = useState({ title:'', description:'', scheduled_at:'', price:'0', join_url:'' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,   setCreateError]   = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [createdCourse, setCreatedCourse] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        fetch(`${API}/courses/instructor/${user.email}`),
        fetch(`${API}/course-purchases/instructor/${user.email}/earnings`),
      ]);
      const [c, e] = await Promise.all([cRes.json(), eRes.json()]);
      if (Array.isArray(c)) setCourses(c);
      if (e && !e.error)    setEarnings(e);
    } catch {}
    setLoading(false);
  }, [user.email]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fetchLessons = useCallback(async (courseId) => {
    try {
      const r = await fetch(`${API}/lessons/course/${courseId}`);
      const d = await r.json();
      if (Array.isArray(d)) setLessons(d);
    } catch {}
  }, []);

  useEffect(() => {
    if (showLessons) fetchLessons(showLessons);
  }, [showLessons, fetchLessons]);

  async function createCourse(e) {
    e.preventDefault();
    setCreateError('');

    // Validation
    if (!form.title.trim())                              { setCreateError('Le titre est obligatoire.'); return; }
    if (!form.description.trim())                        { setCreateError('La description est obligatoire.'); return; }
    if (!form._videoFile)                                { setCreateError('Veuillez choisir une vidéo MP4.'); return; }
    if (!form.category)                                  { setCreateError('Veuillez choisir une catégorie.'); return; }
    if (form.full_price === '' || Number(form.full_price) < 0) { setCreateError('Veuillez entrer un prix valide (0 = gratuit).'); return; }

    setCreateLoading(true);

    let thumbnail_url = '';
    if (form._photoFile) {
      try { thumbnail_url = await imageToBase64(form._photoFile); } catch {}
    }

    const payload = {
      title:            form.title.trim(),
      description:      form.description.trim(),
      thumbnail_url,
      category:         form.category,
      full_price:       Number(form.full_price),
      first_lesson_free: form.first_lesson_free,
      creator_email:    user.email,
    };

    try {
      const r = await fetch(`${API}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); } catch { d = {}; }
      if (!r.ok) {
        setCreateError(`Erreur ${r.status}: ${d.error || text.slice(0, 120)}`);
      } else if (d.id) {
        setCreatedCourse(d);
        setForm({ title:'', description:'', thumbnail_url:'', category:'', full_price:'', first_lesson_free: false, _videoFile: null, _photoFile: null });
        setCreateError('');
        fetchCourses();
      } else {
        setCreateError(d.error || d.message || 'Réponse inattendue. Réessayez.');
      }
    } catch (err) {
      setCreateError(`Erreur réseau: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  }

  async function togglePublish(course) {
    await fetch(`${API}/courses/${course.id}/publish`, { method: 'PATCH' });
    fetchCourses();
  }

  async function deleteCourse(id) {
    await fetch(`${API}/courses/${id}`, { method: 'DELETE' });
    setDeleteConfirmId(null);
    fetchCourses();
  }

  async function addLesson(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lForm, course_id: showLessons, price: Number(lForm.price), duration_min: Number(lForm.duration_min) || 0 }),
      });
      const d = await r.json();
      if (d.id) { setLForm({ title:'', description:'', video_url:'', duration_min:'', price:'0', is_free_preview: false }); fetchLessons(showLessons); }
    } catch {}
  }

  async function deleteLesson(id) {
    if (!window.confirm('Delete lesson?')) return;
    await fetch(`${API}/lessons/${id}`, { method: 'DELETE' });
    fetchLessons(showLessons);
  }

  async function createSession(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/live-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sForm, course_id: showSession, instructor_email: user.email, price: Number(sForm.price) }),
      });
      const d = await r.json();
      if (d.id) { setSForm({ title:'', description:'', scheduled_at:'', price:'0', join_url:'' }); setShowSession(null); }
    } catch {}
  }

  const totalStudents = earnings?.total_students ?? courses.reduce((a, c) => a + (c.total_students || 0), 0);
  const totalEarnings = earnings?.instructor_total ?? 0;
  const avgRating     = courses.length ? (courses.reduce((a,c) => a + Number(c.avg_rating || 0), 0) / courses.length).toFixed(1) : '—';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Stats — 4 cols always, compact on mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { icon:'📚', label:'Cours',     value: courses.length,                              gradient:'from-indigo-400 to-violet-500' },
          { icon:'👥', label:'Étudiants', value: totalStudents,                               gradient:'from-sky-400 to-cyan-500' },
          { icon:'💰', label:'Gains',     value:`${Number(totalEarnings).toFixed(0)} TND`,    gradient:'from-emerald-400 to-teal-500' },
          { icon:'⭐', label:'Note moy.', value: avgRating,                                   gradient:'from-amber-400 to-orange-500' },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} p-3 sm:p-4 text-white shadow-sm`}>
            <p className="text-lg sm:text-2xl font-extrabold leading-none truncate">{loading ? '…' : s.value}</p>
            <p className="text-[10px] sm:text-xs font-semibold opacity-80 mt-1 truncate">{s.label}</p>
            <span className="absolute top-2 right-2 text-lg sm:text-xl opacity-20">{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Course list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">📚 Mes Cours</h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nouveau
          </button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Aucun cours pour l'instant</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Créez votre premier cours et commencez à gagner</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              + Créer un cours
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map(course => (
              <div key={course.id} className="p-4 space-y-3">
                {/* Top row: thumbnail + info */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 shrink-0 flex items-center justify-center text-xl">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" /> : '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight break-words">{course.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {/* Status badge */}
                      {course.status === 'pending' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">⏳ En attente</span>
                      )}
                      {course.status === 'approved' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">✅ Approuvé</span>
                      )}
                      {course.status === 'rejected' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">❌ Refusé</span>
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{course.total_students} étudiants</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">⭐ {Number(course.avg_rating).toFixed(1)}</span>
                    </div>
                    {course.status === 'rejected' && course.admin_note && (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 leading-snug">💬 {course.admin_note}</p>
                    )}
                    {course.status === 'pending' && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">En attente de validation par l'admin</p>
                    )}
                  </div>
                </div>
                {/* Action buttons — 2 rows on mobile */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button onClick={() => setShowLessons(course.id)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-95 transition-all">
                    Leçons
                  </button>
                  <button onClick={() => setShowSession(course.id)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 active:scale-95 transition-all">
                    Live
                  </button>
                  <button onClick={() => navigate(`/courses/${course.id}`)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 active:scale-95 transition-all">
                    Voir
                  </button>
                  <button onClick={() => setDeleteConfirmId(course.id)}
                    className="py-2 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-200 active:scale-95 transition-all">
                    Supp.
                  </button>
                </div>
                <button onClick={() => togglePublish(course)}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                    course.is_published
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                  }`}>
                  {course.is_published ? '⏸ Dépublier' : '🚀 Publier'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-full flex justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Supprimer ce cours ?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cours et leçons supprimés définitivement.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
                Non, annuler
              </button>
              <button onClick={() => deleteCourse(deleteConfirmId)}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold active:scale-95 transition-all">
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                {!createdCourse && <span className="text-lg">📚</span>}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{createdCourse ? 'Cours créé ✅' : 'Créer un cours'}</h3>
              </div>
              <button onClick={() => { setShowCreate(false); setCreatedCourse(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Success screen */}
            {createdCourse ? (
              <div className="p-5 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">Cours soumis avec succès !</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">En attente de validation par l'admin. Vous serez notifié.</p>
                </div>
                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{createdCourse.title}</p>
                  {createdCourse.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{createdCourse.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">{createdCourse.category}</span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      {Number(createdCourse.full_price) === 0 ? 'Gratuit' : `${Number(createdCourse.full_price).toFixed(2)} TND`}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">⏳ En attente</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full pb-2">
                  <button onClick={() => setCreatedCourse(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Créer un autre
                  </button>
                  <button onClick={() => { setShowCreate(false); setCreatedCourse(null); }} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                    Voir mes cours
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={createCourse} className="p-5 space-y-4 pb-6">
                {/* Titre */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Titre <span className="text-rose-500">*</span></label>
                  <input
                    value={form.title}
                    onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setCreateError(''); }}
                    placeholder="Ex: Apprendre React de zéro"
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${!form.title.trim() && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>

                {/* Photo du cours */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Photo du cours <span className="text-slate-400 font-normal">(optionnel)</span></label>
                  <label className={`relative flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500 ${form._photoFile ? 'border-emerald-400 dark:border-emerald-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    {form._photoFile ? (
                      <>
                        <img src={URL.createObjectURL(form._photoFile)} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <span className="text-white text-xs font-bold">Changer la photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                        </svg>
                        <span className="text-xs font-semibold">Ajouter une photo</span>
                        <span className="text-[10px]">JPG, PNG — max 800px</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setForm(f => ({ ...f, _photoFile: file })); setCreateError(''); }
                      }}
                    />
                  </label>
                </div>

              {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Description <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setCreateError(''); }}
                    placeholder="Décrivez le contenu de votre cours…"
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${!form.description.trim() && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>

                {/* Upload vidéo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Upload Vidéo <span className="text-rose-500">*</span></label>
                  <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group ${!form._videoFile && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}>
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                      </svg>
                    </span>
                    <span className={`text-sm truncate flex-1 ${form._videoFile ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {form._videoFile ? `✓ ${form._videoFile.name}` : 'Choisir une vidéo MP4…'}
                    </span>
                    <input type="file" accept="video/mp4,video/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setForm(f => ({ ...f, thumbnail_url: URL.createObjectURL(file), _videoFile: file })); setCreateError(''); }
                      }}
                    />
                  </label>
                </div>

                {/* Catégorie + Prix — stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Catégorie <span className="text-rose-500">*</span></label>
                    <select
                      value={form.category}
                      onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setCreateError(''); }}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none ${!form.category && createError ? 'border-rose-400 text-slate-400 dark:text-slate-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}>
                      <option value="">Choisir une catégorie…</option>
                      {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Prix (TND) <span className="text-rose-500">*</span></label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.full_price}
                      onChange={e => { setForm(f => ({ ...f, full_price: e.target.value })); setCreateError(''); }}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${form.full_price === '' && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                  </div>
                </div>


                {/* Error */}
                {createError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{createError}</p>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={createLoading} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {createLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {createLoading ? 'Création en cours…' : '🚀 Créer le cours'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manage Lessons Modal */}
      {showLessons && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Lessons</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowLessons(null); navigate(`/courses/${showLessons}`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Voir le cours
                </button>
                <button onClick={() => setShowLessons(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Existing lessons */}
              {lessons.length > 0 && (
                <div className="space-y-2">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{l.title}</p>
                        <p className="text-[10px] text-slate-400">{l.duration_min > 0 ? `${l.duration_min} min` : ''} {l.is_free_preview ? '· Free Preview' : ''} {Number(l.price) > 0 ? `· ${Number(l.price).toFixed(2)} TND` : ''}</p>
                      </div>
                      <button onClick={() => deleteLesson(l.id)} className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add lesson form */}
              <form onSubmit={addLesson} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Add New Lesson</p>
                <input required placeholder="Title" value={lForm.title} onChange={e => setLForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea rows={2} placeholder="Description (optional)" value={lForm.description} onChange={e => setLForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                <input required placeholder="Video URL (YouTube or direct link)" value={lForm.video_url} onChange={e => setLForm(f => ({ ...f, video_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" placeholder="Duration (min)" value={lForm.duration_min} onChange={e => setLForm(f => ({ ...f, duration_min: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" min="0" step="0.01" placeholder="Price (0 TND = included)" value={lForm.price} onChange={e => setLForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={lForm.is_free_preview} onChange={e => setLForm(f => ({ ...f, is_free_preview: e.target.checked }))} className="rounded" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Free preview lesson</span>
                </label>
                <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                  Add Lesson
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Live Session Modal */}
      {showSession && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Live Session</h3>
              <button onClick={() => setShowSession(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={createSession} className="p-6 space-y-4">
              <input required placeholder="Session title" value={sForm.title} onChange={e => setSForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea rows={2} placeholder="Description (optional)" value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date & Time</label>
                  <input type="datetime-local" value={sForm.scheduled_at} onChange={e => setSForm(f => ({ ...f, scheduled_at: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Price (TND)</label>
                  <input type="number" min="0" step="0.01" value={sForm.price} onChange={e => setSForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <input placeholder="Join URL (Zoom, Meet, etc.)" value={sForm.join_url} onChange={e => setSForm(f => ({ ...f, join_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors">
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: Paramètres ───────────────────────────────────────────────────────────

function SettingsTab({ user, updateUser, onLogout }) {
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk]       = useState(false);
  const [saving, setSaving]   = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.next.length < 6) { setPwError('Le mot de passe doit avoir au moins 6 caractères.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erreur'); }
      setPwOk(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwOk(false), 2500);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon="👤" title="Informations du compte" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Nom</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Rôle</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Freelancer</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Statut CIN</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              user.cinStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : user.cinStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {user.cinStatus === 'approved' ? '✅ Vérifié' : user.cinStatus === 'pending' ? '⏳ En attente' : '❌ Non vérifié'}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <SectionHeader icon="🔒" title="Changer le mot de passe" />
        <InputField label="Mot de passe actuel" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
        <InputField label="Nouveau mot de passe" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
        <InputField label="Confirmer le nouveau mot de passe" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
        {pwError && <p className="text-xs text-rose-500">{pwError}</p>}
        {pwOk    && <p className="text-xs text-emerald-600">✅ Mot de passe changé avec succès !</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
          {saving ? 'Changement…' : 'Changer le mot de passe'}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-xl border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FreelancerDashboard() {
  const [searchParams]                   = useSearchParams();
  const navigate                         = useNavigate();
  const { user, updateUser, logout, users } = useAuth();
  const [activeTab, setActiveTab]        = useState(() => searchParams.get('tab') || 'dashboard');
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== 'logout') setActiveTab(tab);
  }, [searchParams]);

  function handleTabClick(tabId) {
    if (tabId === 'logout') { setLogoutConfirm(true); return; }
    setActiveTab(tabId);
  }

  if (!user) return null;

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'profile'       && <ProfileTab       user={user} updateUser={updateUser} />}
        {activeTab === 'dashboard'     && <DashboardTab     user={user} users={users} onNavigate={setActiveTab} navigate={navigate} />}
        {activeTab === 'find-projects' && <FindProjectsTab  user={user} users={users} navigate={navigate} />}
        {activeTab === 'missions'      && <MissionsTab      user={user} users={users} navigate={navigate} />}
        {activeTab === 'gains'         && <GainsTab         user={user} />}
        {activeTab === 'courses'       && <CoursesTab       user={user} />}
        {activeTab === 'settings'      && <SettingsTab      user={user} updateUser={updateUser} onLogout={() => setLogoutConfirm(true)} />}
      </div>

      {/* ── Logout modal ── */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-2xl">🚪</div>
              <button onClick={() => setLogoutConfirm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Se déconnecter ?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vous serez redirigé vers la page d'accueil.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
              <button onClick={() => { logout(); setLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-bold text-white transition-colors shadow-sm shadow-rose-500/30">Oui, déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
