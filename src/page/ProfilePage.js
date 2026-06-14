import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { cldImg } from '../utils/cloudinary';

const AVATAR_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const fileRef = useRef();
  const [saved, setSaved] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');

  if (!user) return null;

  const color = AVATAR_COLORS[(user.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUser(user.email, { photo: ev.target.result });
    reader.readAsDataURL(file);
  }

  function handleSave() {
    updateUser(user.email, { bio, skills });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">👤 {t('Profil')}</h1>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-4">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {user.photo ? (
                <img src={cldImg(user.photo)} alt={user.name} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl ${color} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                  {user.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-bold">📷</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: t('Région'), value: user.region },
              { label: t('Genre'), value: user.gender },
              { label: t('Date de naissance'), value: user.dob },
              { label: t('Statut'), value: user.cinStatus },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            {user.role === 'freelancer' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('Skills')}</label>
                <input
                  type="text"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="React, Figma, SEO..."
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('Bio')}</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder={t('Tell us about yourself...')}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {saved ? '✅ ' + t('Saved!') : t('Save changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
