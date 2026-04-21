import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function handleChangePassword() {
    setMsg(''); setError('');
    if (!newPassword) { setError(t('Password is required')); return; }
    if (newPassword.length < 6) { setError(t('At least 6 characters')); return; }
    if (newPassword !== confirmPassword) { setError(t('Passwords do not match')); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPassword }),
      });
      const data = await res.json();
      if (data.success) { setMsg(t('Password changed successfully!')); setNewPassword(''); setConfirmPassword(''); }
      else setError(t('Something went wrong.'));
    } catch { setError(t('Network error.')); }
    finally { setLoading(false); }
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">⚙️ {t('Paramètres')}</h1>

        {/* Account info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Account')}</p>
          <div className="space-y-3">
            {[
              { label: t('Name'), value: user.name },
              { label: t('Email'), value: user.email },
              { label: t('Role'), value: user.role },
              { label: t('Plan'), value: user.plan },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Change Password')}</p>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t('New password')}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t('Confirm password')}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            {msg && <p className="text-xs text-emerald-500">{msg}</p>}
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
            >
              {loading ? t('Processing…') : t('Update Password')}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Danger Zone')}</p>
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            {t('Log out')}
          </button>
        </div>
      </div>
    </div>
  );
}
