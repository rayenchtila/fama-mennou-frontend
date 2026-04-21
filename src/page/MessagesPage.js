import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import MessagesTab from '../components/MessagesTab';

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">💬 {t('Messages')}</h1>
        <MessagesTab user={user} />
      </div>
    </div>
  );
}
