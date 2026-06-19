import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const EXPERIENCE_OPTIONS = [
  'Débutant (0-1 an)',
  '1-2 ans',
  '3-5 ans',
  '5-10 ans',
  '10+ ans',
];

const PERIOD_OPTIONS = [
  'De 1 à 3 jours',
  'De 4 à 7 jours',
  'De 1 à 2 semaines',
  'De 2 à 4 semaines',
  'De 1 à 3 mois',
  'Plus de 3 mois',
];

const STATUS_LABELS = {
  open:        { label: '🟢 Ouvert',     cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  in_progress: { label: '🔵 En cours',   cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
  completed:   { label: '✅ Terminé',    cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user, resolveEmail } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState({}); // projectId -> array
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: '10', experience: '', period: '', keywords: ['', '', '', '', ''] });
  const [posting, setPosting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [postError, setPostError] = useState('');

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
    const errors = {};
    if (!form.title.trim()) errors.title = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.experience) errors.experience = true;
    if (!form.period) errors.period = true;
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    setPostError('');
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: user.email, ...form, keywords: form.keywords.filter(k => k.trim()).map(k => `#${k.trim()}`).join(' ') }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPostError(data.error || 'Erreur serveur');
        return;
      }
      setForm({ title: '', description: '', budget: '10', experience: '', period: '', keywords: ['', '', '', '', ''] });
      setFormErrors({});
      setPostError('');
      setShowForm(false);
      loadProjects();
    } catch (err) {
      setPostError('Impossible de joindre le serveur. Réessayez.');
    } finally { setPosting(false); }
  }

  async function handleAccept(proposalId, projectId) {
    try {
      await fetch(`${API_URL}/proposals/${proposalId}/accept`, { method: 'PATCH' });
      loadProjects();
      setProposals(prev => ({ ...prev, [projectId]: undefined }));
    } catch {}
  }

  async function handleReject(proposalId, projectId) {
    try {
      await fetch(`${API_URL}/proposals/${proposalId}/reject`, { method: 'PATCH' });
      setProposals(prev => ({ ...prev, [projectId]: (prev[projectId] || []).filter(pr => pr.id !== proposalId) }));
    } catch {}
  }

  async function handlePayment(projectId, action) {
    try {
      await fetch(`${API_URL}/projects/${projectId}/notify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'client', action }),
      });
      loadProjects();
    } catch {}
  }

  async function handleDelete(projectId) {
    if (!window.confirm('Supprimer ce projet ?')) return;
    try {
      await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch {}
  }

  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-10">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🗂️ {t('Projets')}</h1>
          <button
            onClick={() => { setShowForm(s => !s); setFormErrors({}); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            {showForm ? 'Annuler' : '+ Nouveau projet'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handlePost} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Titre du projet <span className="text-rose-500">*</span></label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description <span className="text-rose-500">*</span></label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mots clés</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.keywords.map((kw, i) => (
                  <div
                    key={i}
                    style={{ width: `${Math.max(5.5, kw.length + 2)}ch` }}
                    className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-[width] duration-150"
                  >
                    <span className="pl-2.5 text-sm font-semibold text-slate-400">#</span>
                    <input
                      maxLength={25}
                      value={kw}
                      onChange={e => {
                        const val = e.target.value.replace(/[#\s]/g, '').slice(0, 25);
                        setForm(f => ({ ...f, keywords: f.keywords.map((k, idx) => idx === i ? val : k) }));
                      }}
                      placeholder={`mot ${i + 1}`}
                      className="w-full min-w-0 px-1 py-2 text-sm font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Expérience <span className="text-rose-500">*</span></label>
              <select
                value={form.experience}
                onChange={e => { setForm(f => ({ ...f, experience: e.target.value })); setFormErrors(fe => ({ ...fe, experience: false })); }}
                className={`mt-1 w-full px-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.experience ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <option value="">Sélectionner...</option>
                {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {formErrors.experience && <p className="mt-1 text-xs text-rose-500">Veuillez sélectionner l'expérience requise.</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Période estimée <span className="text-rose-500">*</span></label>
              <select
                value={form.period}
                onChange={e => { setForm(f => ({ ...f, period: e.target.value })); setFormErrors(fe => ({ ...fe, period: false })); }}
                className={`mt-1 w-full px-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.period ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <option value="">Sélectionner...</option>
                {PERIOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {formErrors.period && <p className="mt-1 text-xs text-rose-500">Veuillez sélectionner la période estimée.</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Budget (TND) <span className="text-rose-500">*</span></label>
              <div className="mt-1 flex items-stretch rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, budget: String(Math.max(10, (Number(f.budget) || 10) - 10)) }))}
                  className="px-4 text-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Diminuer le budget"
                >
                  −
                </button>
                <input
                  type="number"
                  step="10"
                  min="10"
                  inputMode="numeric"
                  value={form.budget}
                  onChange={e => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setForm(f => ({ ...f, budget: digits }));
                  }}
                  onBlur={e => {
                    const n = Math.max(10, Number(e.target.value) || 10);
                    setForm(f => ({ ...f, budget: String(n) }));
                  }}
                  className="flex-1 min-w-0 px-3 py-2 text-sm text-center bg-transparent text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, budget: String((Number(f.budget) || 10) + 10) }))}
                  className="px-4 text-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Augmenter le budget"
                >
                  +
                </button>
              </div>
            </div>
            {postError && (
              <p className="text-red-500 text-sm text-center font-medium">{postError}</p>
            )}
            <button
              type="submit"
              disabled={posting || !form.title.trim() || !form.description.trim() || !form.experience || !form.period}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="space-y-6 pt-2">
            {projects.map(p => {
              const st = STATUS_LABELS[p.status] || STATUS_LABELS.open;
              const projProposals = proposals[p.id] || [];
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">💰 {p.budget ? `${p.budget} TND` : '—'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        🎯 {p.experience || '—'} · ⏱️ {p.period || '—'}
                        {p.created_at && <> · 📅 {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                        aria-label="Supprimer le projet"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.description || '—'}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {p.keywords && p.keywords.split(/\s+/).filter(Boolean).length > 0
                      ? p.keywords.split(/\s+/).filter(Boolean).map((kw, i) => (
                          <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                            {kw}
                          </span>
                        ))
                      : <span className="text-[11px] text-slate-400">Mots clés : —</span>
                    }
                  </div>

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
                              <div className="shrink-0 flex gap-2">
                                <button
                                  onClick={() => handleAccept(pr.id, p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() => handleReject(pr.id, p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {p.status === 'in_progress' && p.freelancer_email && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        👤 Freelance assigné : <span className="font-bold text-slate-700 dark:text-slate-300">{resolveEmail(p.freelancer_email)}</span>
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
