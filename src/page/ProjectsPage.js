import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">🗂️ {t('Projets')}</h1>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="text-5xl mb-4 block">🗂️</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('No projects yet')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Your projects will appear here.')}</p>
        </div>
      </div>
    </div>
  );
}
