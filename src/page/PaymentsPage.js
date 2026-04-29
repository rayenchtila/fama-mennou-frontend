import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const CLICK2PAY_MERCHANT_ID = process.env.REACT_APP_CLICK2PAY_MERCHANT_ID || 'YOUR_MERCHANT_ID';
const CLICK2PAY_URL = 'https://www.clictopay.com.tn/paymentpage/payment';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!user) return null;

  const history = [];

  function handlePay(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setError('Veuillez entrer un montant valide.'); return; }
    setError('');
    setLoading(true);

    const form = document.createElement('form');
    form.method  = 'POST';
    form.action  = CLICK2PAY_URL;
    form.target  = '_self';

    const fields = {
      currency:       '788',
      language:       'fr',
      orderNumber:    `ORDER-${Date.now()}`,
      amount:         String(Math.round(Number(amount) * 1000)),
      returnUrl:      `${window.location.origin}/payments?status=success`,
      failUrl:        `${window.location.origin}/payments?status=failed`,
      userName:       CLICK2PAY_MERCHANT_ID,
      description:    `Paiement FamaMennou - ${user.name}`,
      email:          user.email,
    };

    Object.entries(fields).forEach(([k, v]) => {
      const input   = document.createElement('input');
      input.type    = 'hidden';
      input.name    = k;
      input.value   = v;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  const urlStatus = new URLSearchParams(window.location.search).get('status');

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">💳 {t('Paiements')}</h1>

        {/* Status banners */}
        {urlStatus === 'success' && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Paiement réussi !</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Votre paiement a été traité avec succès.</p>
            </div>
          </div>
        )}
        {urlStatus === 'failed' && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl px-5 py-4">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Paiement échoué</p>
              <p className="text-xs text-rose-600 dark:text-rose-500">Veuillez réessayer ou contacter le support.</p>
            </div>
          </div>
        )}

        {/* Click2Pay payment card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-white font-extrabold text-base">Payer avec Click2Pay</p>
              <p className="text-indigo-200 text-xs mt-0.5">Paiement sécurisé · Tunisie</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span className="text-xs font-bold text-indigo-700">Click2Pay</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePay} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Montant (TND)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">TND</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 space-y-1.5">
              {[
                ['Nom', user.name],
                ['Email', user.email],
                ['Devise', 'Dinar Tunisien (TND)'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[60%] text-right">{val}</span>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading || !amount}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition-all disabled:opacity-50 active:scale-[.98] shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Redirection…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  Payer {amount ? `${Number(amount).toFixed(2)} TND` : 'maintenant'}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <p className="text-[11px] text-slate-400">Paiement sécurisé via Click2Pay · Banque de Tunisie</p>
            </div>
          </form>
        </div>

        {/* History */}
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
