import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const STATUS_INFO = {
  en_attente: { label: '🟡 En attente', desc: 'Votre preuve de paiement est en cours de vérification par notre équipe.', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  en_cours:   { label: '🔵 En cours',   desc: 'Votre paiement est en cours de traitement.',                              cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
  termine:    { label: '🟢 Terminé',    desc: 'Paiement confirmé et accès activé. Merci pour votre confiance.',          cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

const PROJECT_STATUS_INFO = {
  en_attente: { label: '🟡 En attente', desc: 'Le paiement du projet est en attente de confirmation.',  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  recu:       { label: '🟢 Payé',       desc: 'Paiement confirmé pour ce projet. Merci pour votre confiance.', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { user, accounts } = useAuth();
  const [courses,  setCourses]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;

    const fetchCourses = fetch(`${API_URL}/course-requests/mine?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(rows => Array.isArray(rows) ? rows : [])
      .catch(() => []);

    const projectEndpoint = user.role === 'freelancer'
      ? `${API_URL}/projects/assigned/${encodeURIComponent(email)}`
      : `${API_URL}/projects/${encodeURIComponent(email)}`;

    const fetchProjects = fetch(projectEndpoint)
      .then(r => r.json())
      .then(rows => (Array.isArray(rows) ? rows : []).filter(p => p.status === 'in_progress' || p.status === 'completed'))
      .catch(() => []);

    Promise.all([fetchCourses, fetchProjects]).then(([c, p]) => {
      setCourses(c);
      setProjects(p);
      setLoading(false);
    });
  }, [user?.email, user?.role]);

  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">💳 {t('Paiements')}</h1>

        {/* How it works */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Comment ça marche ?</p>
          <ol className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span> Envoyez votre preuve de paiement à l'équipe via le Chat.</li>
            <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span> Notre équipe vérifie et met à jour le statut ci-dessous.</li>
            <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span> Vous recevez un email avec un reçu PDF à chaque étape.</li>
          </ol>
        </div>

        {/* Courses History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Historique des paiements ( COURSES ) :</p>
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-400">Chargement…</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm text-slate-400">{t('Aucun paiement pour le moment')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((item) => {
                const info = STATUS_INFO[item.payment_status] || STATUS_INFO.en_attente;
                const dateStr = new Date(item.requested_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });
                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.course_title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{Number(item.amount || 0).toFixed(2)} TND</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{info.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Historique des paiements ( PROJECTS ) :</p>
          {loading ? (
            <div className="text-center py-8 text-sm text-slate-400">Chargement…</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm text-slate-400">{t('Aucun paiement pour le moment')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((item) => {
                const info = PROJECT_STATUS_INFO[item.payment_status] || PROJECT_STATUS_INFO.en_attente;
                const dateStr = new Date(item.accepted_at || item.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });
                const otherEmail = user.role === 'freelancer' ? item.client_email : item.freelancer_email;
                const otherAccount = accounts?.[otherEmail?.toLowerCase()];
                const otherName = otherAccount?.name || item.client_name || item.freelancer_name || otherEmail || '—';
                const otherLabel = user.role === 'freelancer' ? 'Client' : 'Freelance';
                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{otherLabel} : {otherName}</p>
                        <p className="text-xs text-slate-400">{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{Number(item.amount || 0).toFixed(2)} TND</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{info.desc}</p>
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
