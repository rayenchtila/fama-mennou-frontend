// Admin → "Publicité": manage homepage promotional video campaigns.
//
// Reuses the existing admin auth (authFetch carries the JWT), the existing
// upload endpoint (POST /api/uploads/video → Cloudinary), and the existing
// user directory (GET /api/users/lite) for the profile picker — no new
// upload, auth, or user system.
//
// Status is computed by the server from the campaign dates, so this component
// only ever displays it; there is nothing here that can put a row into a state
// the homepage would disagree with.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const STATUS_STYLE = {
  active:    { label: 'Active',      cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  scheduled: { label: 'Programmée',  cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
  paused:    { label: 'En pause',    cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  expired:   { label: 'Expirée',     cls: 'bg-slate-500/15 text-slate-500 dark:text-slate-400' },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const INPUT_CLS =
  'w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 ' +
  'text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30';

export default function AdvertisementsAdmin() {
  const { authFetch } = useAuth();

  const [ads,     setAds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [users,   setUsers]   = useState([]);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [videoUrl,  setVideoUrl]  = useState('');
  const [videoId,   setVideoId]   = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [startsAt,  setStartsAt]  = useState(todayISO());
  const [endsAt,    setEndsAt]    = useState(todayISO());
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API}/advertisements`);
      const d = await r.json();
      if (Array.isArray(d)) setAds(d);
    } catch { /* leave the previous list rather than blanking it */ }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    authFetch(`${API}/users/lite`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setUsers(d); })
      .catch(() => {});
  }, [authFetch]);

  function resetForm() {
    setEditingId(null);
    setVideoUrl(''); setVideoId(''); setUserEmail(''); setUserQuery('');
    setStartsAt(todayISO()); setEndsAt(todayISO());
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function uploadVideo(file) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'famamennou/ads');
      const r = await authFetch(`${API}/uploads/video`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok || !d.secure_url) { setError(d.error || "Échec de l'envoi de la vidéo."); }
      else { setVideoUrl(d.secure_url); setVideoId(d.public_id || ''); }
    } catch {
      setError("Échec de l'envoi de la vidéo.");
    }
    setUploading(false);
  }

  async function submit() {
    setError('');
    // Mirrors the server rules so the admin gets an instant answer; the server
    // re-checks all of it, which is what actually protects the data.
    if (!videoUrl)  return setError('Ajoutez une vidéo.');
    if (!userEmail) return setError('Sélectionnez un profil.');
    if (endsAt < startsAt) return setError('La date de fin ne peut pas précéder la date de début (minimum 1 jour).');

    setBusy(true);
    try {
      const body = JSON.stringify({
        video_url: videoUrl, video_public_id: videoId || null,
        user_email: userEmail, starts_at: startsAt, ends_at: endsAt,
      });
      const r = await authFetch(
        editingId ? `${API}/advertisements/${editingId}` : `${API}/advertisements`,
        { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Enregistrement impossible.');
      else { resetForm(); await load(); }
    } catch {
      setError('Enregistrement impossible.');
    }
    setBusy(false);
  }

  async function togglePause(ad) {
    await authFetch(`${API}/advertisements/${ad.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: !ad.paused }),
    }).catch(() => {});
    load();
  }

  async function remove(ad) {
    if (!window.confirm('Supprimer définitivement cette publicité ?')) return;
    await authFetch(`${API}/advertisements/${ad.id}`, { method: 'DELETE' }).catch(() => {});
    load();
  }

  function startEdit(ad) {
    setEditingId(ad.id);
    setVideoUrl(ad.video_url);
    setVideoId(ad.video_public_id || '');
    setUserEmail(ad.user_email);
    setUserQuery(ad.profile_name || ad.user_email);
    setStartsAt(String(ad.starts_at).slice(0, 10));
    setEndsAt(String(ad.ends_at).slice(0, 10));
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const q = userQuery.trim().toLowerCase();
  // Only offer suggestions once something is typed and no profile is locked in,
  // so the list is not a dump of every account on the platform.
  const suggestions = q && !userEmail
    ? users.filter(u =>
        (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  const days = (() => {
    const a = new Date(`${startsAt}T00:00:00Z`), b = new Date(`${endsAt}T00:00:00Z`);
    if (Number.isNaN(a) || Number.isNaN(b)) return 0;
    return Math.round((b - a) / 86400000) + 1; // inclusive: same day = 1 day
  })();

  return (
    <div>
      {/* ── Create / edit ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4">
          {editingId ? 'Modifier la publicité' : 'Nouvelle publicité'}
        </h3>

        {/* Video */}
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="ad-video">Vidéo</label>
        <input
          id="ad-video" ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime"
          onChange={e => uploadVideo(e.target.files?.[0])}
          className="w-full text-sm text-slate-600 dark:text-slate-300 mb-2 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-bold"
        />
        {uploading && <p className="text-xs text-indigo-500 font-semibold mb-2">Envoi en cours…</p>}
        {videoUrl && !uploading && (
          <video src={videoUrl} muted playsInline controls className="w-full max-w-xs rounded-xl mb-3 border border-slate-200 dark:border-slate-700" />
        )}

        {/* Profile picker */}
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 mt-2" htmlFor="ad-user">Profil associé</label>
        <div className="relative mb-3">
          <input
            id="ad-user" type="text" value={userQuery}
            placeholder="Rechercher un nom ou un email…"
            onChange={e => { setUserQuery(e.target.value); setUserEmail(''); }}
            className={INPUT_CLS}
          />
          {userEmail && (
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Sélectionné : {userEmail}</p>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              {suggestions.map(u => (
                <li key={`${u.email}-${u.role}`}>
                  <button
                    type="button"
                    onClick={() => { setUserEmail(u.email); setUserQuery(u.name || u.email); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name || u.email}</span>
                    <span className="block text-[11px] text-slate-500">{u.email} · {u.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="ad-start">Date de début</label>
            <input id="ad-start" type="date" value={startsAt}
              onChange={e => {
                setStartsAt(e.target.value);
                // Keep the range valid as the admin types rather than letting
                // them build an impossible campaign and rejecting it on submit.
                if (endsAt < e.target.value) setEndsAt(e.target.value);
              }}
              className={INPUT_CLS}/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="ad-end">Date de fin</label>
            <input id="ad-end" type="date" value={endsAt} min={startsAt}
              onChange={e => setEndsAt(e.target.value)} className={INPUT_CLS}/>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5">
          Durée : <span className="font-bold">{days > 0 ? days : 0} jour{days > 1 ? 's' : ''}</span> (minimum 1 jour)
        </p>

        {error && <p className="text-xs font-bold text-rose-500 mt-3">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="button" onClick={submit} disabled={busy || uploading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold"
          >
            {busy ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Publier'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-8">Chargement…</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Aucune publicité pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => {
            const s = STATUS_STYLE[ad.status] || STATUS_STYLE.expired;
            return (
              <div key={ad.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-4">
                <video src={ad.video_url} muted playsInline
                  className="w-full sm:w-40 aspect-video rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"/>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${s.cls}`}>{s.label}</span>
                    <span className="text-[11px] text-slate-500">#{ad.id}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {ad.profile_name || ad.user_email}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{ad.user_email}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {String(ad.starts_at).slice(0, 10)} → {String(ad.ends_at).slice(0, 10)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => togglePause(ad)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {ad.paused ? 'Reprendre' : 'Mettre en pause'}
                    </button>
                    <button type="button" onClick={() => startEdit(ad)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      Modifier
                    </button>
                    <button type="button" onClick={() => remove(ad)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
