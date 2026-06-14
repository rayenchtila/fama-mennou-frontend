import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

const AVATAR_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-sky-500 to-sky-600',
  'from-fuchsia-500 to-fuchsia-600',
  'from-violet-500 to-violet-600',
];

function getAvatarGradient(email = '') {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function MiniAvatar({ user, size = 'sm' }) {
  const sz = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (user?.photo) return <img src={user.photo} alt={user?.name} className={`${sz} rounded-xl object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${getAvatarGradient(user?.email)} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(user?.name || user?.email || '?')}
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, loading }) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden group hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg mb-3 shadow-sm`}>
        {icon}
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
      )}
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
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

function EmptyState({ emoji, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-3xl mb-2">{emoji}</span>
      <p className="text-xs text-slate-400 font-medium">{text}</p>
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

export default function ClientDashboard() {
  const { user, users, fetchNotifications, getUserNotifications, markNotificationRead } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects]       = useState([]);
  const [conversations, setConvos]    = useState([]);
  const [loading, setLoading]         = useState(true);
  const [notifOpen, setNotifOpen]     = useState(false);

  // Notifications are fetched on mount and kept fresh via Realtime (AuthContext)
  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/projects/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
    ]).then(([p, c]) => {
      if (Array.isArray(p)) setProjects(p);
      if (Array.isArray(c)) setConvos(c);
      setLoading(false);
    });
  }, [user?.email]);

  if (!user) return null;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeProjects    = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const unreadMessages    = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());

  const freelancerContacts = conversations
    .filter(c => {
      const other = getUser(c.other_email);
      return other?.role === 'freelancer';
    })
    .slice(0, 4);

  const recentProjects = projects.slice(0, 5);
  const recentMessages = conversations.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user.name?.split(' ')[0] || 'Client';
  const userNotifs  = getUserNotifications(user?.email);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  return (
    <div className="pt-16 min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.photo
                  ? <img src={user.photo} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                  : <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(user.email)} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                      {getInitials(user.name)}
                    </div>
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
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">💼 Client</span>

              {/* Notification bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(p => !p)} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-[min(320px,calc(100vw-2rem))] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                        {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">{unreadCount}</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {userNotifs.length === 0 ? (
                          <div className="flex flex-col items-center py-8 text-slate-400">
                            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            <p className="text-xs font-semibold">Aucune notification</p>
                          </div>
                        ) : userNotifs.map(n => (
                          <div key={n.id} onClick={() => { markNotificationRead(n.id); setNotifOpen(false); const kind = n.kind||''; let route = null; if (kind.startsWith('course_access:')) { const id=kind.split(':')[1]; route=id?`/courses/${id}`:'/courses'; } else if (kind.includes('_course_')) { const id=kind.split('_course_')[1]; route=id?`/courses/${id}`:'/courses'; } else if (/^course_(approved|rejected|created)_/.test(kind)) { const id=kind.split('_').pop(); route=id&&!isNaN(id)?`/courses/${id}`:'/courses'; } if(route) navigate(route); }} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors last:border-0 group ${n.read ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${n.kind.startsWith('course_access') ? 'bg-emerald-100 dark:bg-emerald-900/30' : n.kind.includes('approved') ? 'bg-emerald-100 dark:bg-emerald-900/30' : n.kind.includes('rejected') ? 'bg-rose-100 dark:bg-rose-900/30' : n.kind.includes('lesson') ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                              {n.kind.startsWith('course_access') ? '🎓' : n.kind.includes('approved') ? '✅' : n.kind.includes('rejected') ? '❌' : n.kind.includes('lesson') ? '📖' : '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold mb-0.5 ${n.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                              <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => navigate('/freelancers')}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/30"
              >
                Trouver un freelancer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── 📌 Overview / Stats ──────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="⚡"
              label="Projets actifs"
              value={activeProjects}
              sub={`sur ${projects.length} total`}
              gradient="from-indigo-500 to-indigo-600"
              loading={loading}
            />
            <StatCard
              icon="✅"
              label="Projets terminés"
              value={completedProjects}
              sub={completedProjects > 0 ? 'Bien joué !' : 'Aucun encore'}
              gradient="from-emerald-500 to-emerald-600"
              loading={loading}
            />
            <StatCard
              icon="💬"
              label="Messages non lus"
              value={unreadMessages}
              sub={unreadMessages > 0 ? 'À consulter' : 'Tout lu'}
              gradient="from-sky-500 to-sky-600"
              loading={loading}
            />
            <StatCard
              icon="💳"
              label="Dépenses totales"
              value="—"
              sub="Bientôt disponible"
              gradient="from-violet-500 to-violet-600"
              loading={false}
            />
          </div>
        </section>

        {/* ── 🗂️ Recent Projects + 💬 Recent Messages ──────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Projects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <SectionHeader
              icon="🗂️"
              title="Projets récents"
              action="Voir tout"
              onAction={() => navigate('/projects')}
            />
            {loading ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : recentProjects.length === 0 ? (
              <EmptyState emoji="🗂️" text="Aucun projet pour l'instant" />
            ) : (
              <div className="space-y-2">
                {recentProjects.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-default">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-base shrink-0">
                      {p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⚡' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.budget
                          ? <span className="text-emerald-600 font-semibold">{p.budget}</span>
                          : <span>Pas de budget défini</span>
                        }
                        <span className="mx-1.5">·</span>
                        {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                ))}
              </div>
            )}
            {!loading && projects.length > 5 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Voir {projects.length - 5} projet{projects.length - 5 > 1 ? 's' : ''} de plus
                </button>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <SectionHeader
              icon="💬"
              title="Messages récents"
              action="Ouvrir"
              onAction={() => navigate('/messages')}
            />
            {loading ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : recentMessages.length === 0 ? (
              <EmptyState emoji="💬" text="Aucune conversation pour l'instant" />
            ) : (
              <div className="space-y-1">
                {recentMessages.map(c => {
                  const other = getUser(c.other_email);
                  const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
                  return (
                    <button
                      key={c.other_email}
                      onClick={() => navigate('/messages')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div className="relative shrink-0">
                        <MiniAvatar user={other || { email: c.other_email, name: c.other_email }} />
                        {isUnread && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {other?.name || c.other_email}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{c.last_message || 'Aucun message'}</p>
                      </div>
                      {isUnread && (
                        <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── ⭐ Freelancers engagés ───────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader
            icon="⭐"
            title="Freelancers contactés"
            action="Explorer"
            onAction={() => navigate('/freelancers')}
          />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mx-auto" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : freelancerContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">⭐</span>
              <p className="text-xs text-slate-400 font-medium">Vous n'avez pas encore contacté de freelancers</p>
              <button onClick={() => navigate('/freelancers')} className="mt-3 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                Trouver un freelancer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {freelancerContacts.map(c => {
                const f = getUser(c.other_email);
                return (
                  <button
                    key={c.other_email}
                    onClick={() => navigate('/messages')}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-center group"
                  >
                    <div className="flex justify-center mb-2">
                      <MiniAvatar user={f || { email: c.other_email, name: c.other_email }} size="md" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {f?.name?.split(' ')[0] || c.other_email.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{f?.skills?.split(',')[0]?.trim() || 'Freelancer'}</p>
                    <div className="mt-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        Contacter
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 💳 Payments Summary ──────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader
            icon="💳"
            title="Résumé des paiements"
            action="Voir tout"
            onAction={() => navigate('/payments')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Dépenses récentes', value: '—', icon: '📤', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { label: 'Paiements en attente', value: '—', icon: '⏳', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Total payé', value: '—', icon: '✅', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4 flex items-center gap-3`}>
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className={`text-lg font-extrabold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-6 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-2xl">🔧</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Intégration paiement en cours</p>
            <p className="text-[10px] text-slate-400">L'historique de vos paiements apparaîtra ici</p>
          </div>
        </section>

      </div>
    </div>
  );
}
