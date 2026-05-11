import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'https://famamennou-server.onrender.com/api';

const CATEGORIES = [
  'Design','Development','Marketing','Business',
  'Music','Photography','Finance','Health','Other',
];

export default function CreateCourseModal({ user, initialType = 'free', onClose, onCreated, onBack }) {
  const isPaid = initialType === 'paid';
  const navigate = useNavigate();
  const photoRef = useRef();
  const videoRef = useRef();

  // ── accent palette — switches every color at once ──────────────────────────
  const ring        = isPaid ? 'focus:ring-amber-500'  : 'focus:ring-emerald-500';
  const hoverBorder = isPaid ? 'hover:border-amber-400 dark:hover:border-amber-600'   : 'hover:border-emerald-400 dark:hover:border-emerald-600';
  const hoverText   = isPaid ? 'hover:text-amber-600 dark:hover:text-amber-400'       : 'hover:text-emerald-600 dark:hover:text-emerald-400';
  const videoBg     = isPaid ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'     : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800';
  const videoTxt    = isPaid ? 'text-amber-600 dark:text-amber-400'  : 'text-emerald-600 dark:text-emerald-400';
  const videoLabel  = isPaid ? 'text-amber-700 dark:text-amber-400'  : 'text-emerald-700 dark:text-emerald-400';
  const submitBtn   = isPaid ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25';
  const successBg    = isPaid ? 'bg-amber-100 dark:bg-amber-900/30'                                              : 'bg-emerald-100 dark:bg-emerald-900/30';
  const successIcon  = isPaid ? 'text-amber-600 dark:text-amber-400'                                             : 'text-emerald-600 dark:text-emerald-400';
  const verifyBg     = isPaid ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800';
  const verifyTitle  = isPaid ? 'text-amber-700 dark:text-amber-400'                                             : 'text-emerald-700 dark:text-emerald-400';
  const verifySub    = isPaid ? 'text-amber-600/80 dark:text-amber-500'                                          : 'text-emerald-600/80 dark:text-emerald-500';

  const [form, setForm] = useState({
    title:       '',
    description: '',
    photo:       '',
    video_url:   '',
    category:    'Development',
    full_price:  '',
  });
  const [photoPreview,  setPhotoPreview]  = useState('');
  const [videoName,     setVideoName]     = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [priceError,    setPriceError]    = useState('');
  const [success,       setSuccess]       = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);

  // Lock scroll on both body and html — covers all browsers
  useEffect(() => {
    document.body.style.overflow          = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow          = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhotoPreview(ev.target.result); set('photo', ev.target.result); };
    reader.readAsDataURL(file);
  }

  function handleVideo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoName(file.name);
    set('video_url', file.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (isNaN(Number(form.full_price)) || Number(form.full_price) < 50) {
      setPriceError('Le prix minimum est 50 TND.');
      setError('Le prix minimum est 50 TND.'); return;
    }
    if (!form.description.trim()) { setError('La description est obligatoire.'); return; }
    if (!form.photo)              { setError('La photo du cours est obligatoire.'); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_email: user.email,
          title:         form.title.trim(),
          description:   form.description.trim(),
          photo_url:     form.photo,
          video_url:     form.video_url,
          category:      form.category,
          full_price:    Number(form.full_price) || 0,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Erreur lors de la création.'); setSubmitting(false); return; }
      setSuccess(true);
      setCreatedCourse(d);
      onCreated?.(d);
    } catch {
      setError('Impossible de joindre le serveur.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300]">

      {/* TRUE top-right X — only on success screen, color matches course type */}
      {success && (
        <button
          onClick={async () => {
            try {
              await fetch(`${API}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type:    'user',
                  kind:    `course_created_${createdCourse?.id ?? Date.now()}`,
                  title:   '📚 Cours en attente de vérification',
                  message: `Votre cours "${createdCourse?.title || form.title}" est en cours de vérification. Résultat sous 24h max.`,
                  email:   user.email,
                  name:    createdCourse?.title || form.title,
                }),
              });
            } catch {}
            onClose();
            navigate('/courses');
          }}
          className={`fixed top-4 right-4 z-[400] w-10 h-10 flex items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${
            isPaid ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}

      <div className="bg-white dark:bg-slate-900 w-full h-full overflow-y-auto flex flex-col">

        {/* Header */}
        <div className={`px-4 py-5 rounded-t-3xl flex items-center gap-3 bg-gradient-to-r ${isPaid ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-green-600'}`}>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">
              {isPaid ? '💰' : '🎁'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-extrabold text-sm leading-tight">Créer un cours</p>
              <p className="text-white/70 text-[11px] mt-0.5">Remplissez les informations de votre cours</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Success */}
        {success ? (
          <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center max-w-2xl mx-auto w-full">

            {/* Checkmark */}
            <div className={`w-16 h-16 rounded-full ${successBg} flex items-center justify-center mb-4`}>
              <svg className={`w-8 h-8 ${successIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <p className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Course créé et publié ! 🎉</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Votre course est maintenant visible par tout le monde. Ajoutez des leçons depuis la page du course.</p>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Une notification a été envoyée à votre compte.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 max-w-2xl mx-auto w-full">

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Titre du course <span className="text-rose-500">*</span>
              </label>
              <input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="ex: Maîtrisez React en 30 jours"
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition-all`} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description <span className="text-rose-500">*</span></label>
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Décrivez ce que les apprenants vont acquérir…"
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition-all resize-none`} />
            </div>

            {/* Photo du course */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Photo du course <span className="text-rose-500">*</span></label>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <button type="button" onClick={() => photoRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 ${hoverBorder} text-sm text-slate-500 dark:text-slate-400 ${hoverText} transition-all`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
              </button>
              {photoPreview && (
                <div className="mt-2 relative">
                  <img src={photoPreview} alt="preview"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setPhotoPreview(''); set('photo', ''); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
            </div>


            {/* Category + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Catégorie</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Prix (TND) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">TND</span>
                  <input type="number" min="50" step="0.01" required
                    value={form.full_price}
                    onChange={e => {
                      const val = e.target.value;
                      set('full_price', val);
                      if (val !== '' && Number(val) < 50) setPriceError('Le prix minimum est 50 TND.');
                      else setPriceError('');
                    }}
                    onBlur={e => {
                      if (e.target.value === '' || Number(e.target.value) < 50) setPriceError('Le prix minimum est 50 TND.');
                    }}
                    placeholder="50.00"
                    className={`w-full pl-12 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${priceError ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'}`} />
                {priceError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
                    Le prix minimum est 50 TND.
                  </p>
                )}
                </div>
              </div>
            </div>

            {/* Commission note — always visible */}
            <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                La plateforme retient une commission de <strong>5 %</strong> sur chaque vente.
                Vous recevez <strong>95 %</strong> du prix affiché.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.98] ${submitBtn}`}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Création…
                  </span>
                ) : 'Créer le cours'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
