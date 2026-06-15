import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const STATUS_LABELS = {
  open:        { label: '🟢 Ouvert',     cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  in_progress: { label: '🔵 En cours',   cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
  completed:   { label: '✅ Terminé',    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState({}); // projectId -> array
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: '', experience: '', period: '' });
  const [posting, setPosting] = useState(false);

  function loadProjects() {
    if (!user?.email) return;
    fetch(`${API_URL}/projects/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(rows => setProjects(Array.isArray(rows) ? rows : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProjects(); }, [user?.email]);

  useEffect(() => {
    projects.filter(p => p.status === 'open').forEach(p => {
      fetch(`${API_URL}/proposals/project/${p.id}`)
        .then(r => r.json())
        .then(rows => setProposals(prev => ({ ...prev, [p.id]: Array.isArray(rows) ? rows : [] })))
        .catch(() => {});
    });
  }, [projects]);

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setPosting(true);
    try {
      await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: user.email, ...form }),
      });
      setForm({ title: '', description: '', budget: '', experience: '', period: '' });
      setShowForm(false);
      loadProjects();
    } catch {} finally { setPosting(false); }
  }

  async function handleAccept(proposalId, projectId) {
    try {
      await fetch(`${API_URL}/proposals/${proposalId}/accept`, { method: 'PATCH' });
      loadProjects();
      setProposals(prev => ({ ...prev, [projectId]: undefined }));
    } catch {}
  }

  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🗂️ {t('Projets')}</h1>
          <button
            onClick={() => setShowForm(s => !s)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            {showForm ? 'Annuler' : '+ Nouveau projet'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handlePost} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Titre du projet</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Budget (TND)</label>
              <input
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value.replace(/[^0-9]/g, '') }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Expérience</label>
              <input
                value={form.experience}
                onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Période estimée</label>
              <input
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={posting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {posting ? 'Publication…' : 'Publier le projet'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-sm text-slate-400">Chargement…</div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <span className="text-5xl mb-4 block">🗂️</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('No projects yet')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Your projects will appear here.')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(p => {
              const st = STATUS_LABELS[p.status] || STATUS_LABELS.open;
              const projProposals = proposals[p.id] || [];
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                      {p.budget && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">💰 {p.budget} TND</p>}
                      {(p.experience || p.period) && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.experience && `🎯 ${p.experience}`}
                          {p.experience && p.period && ' · '}
                          {p.period && `⏱️ ${p.period}`}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                  </div>

                  {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.description}</p>}

                  {p.status === 'open' && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Propositions reçues {projProposals.length > 0 && `(${projProposals.length})`}
                      </p>
                      {projProposals.length === 0 ? (
                        <p className="text-xs text-slate-400">Aucune proposition pour l'instant.</p>
                      ) : (
                        <div className="space-y-2">
                          {projProposals.map(pr => (
                            <div key={pr.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {pr.freelancer_name || pr.freelancer_email}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  💰 {Number(pr.price).toFixed(2)} TND · ⏱️ {pr.delivery_days}j
                                  {Number(pr.freelancer_rating) > 0 && ` · ⭐ ${Number(pr.freelancer_rating).toFixed(1)}`}
                                </p>
                                {pr.cover_letter && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{pr.cover_letter}</p>}
                              </div>
                              <button
                                onClick={() => handleAccept(pr.id, p.id)}
                                className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                              >
                                Accepter
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {p.status === 'in_progress' && p.freelancer_email && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        👤 Freelance assigné : <span className="font-bold text-slate-700 dark:text-slate-300">{p.freelancer_email}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
