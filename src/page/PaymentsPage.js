import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;

  const history = []; // placeholder — replace with real fetch when backend ready

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">💳 {t('Paiements')}</h1>

        {/* Payment history */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Historique des paiements')}</p>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-sm text-slate-400">{t('Aucun paiement pour le moment')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
