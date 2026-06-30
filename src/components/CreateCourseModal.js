import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const CATEGORIES = [
  'Design','Development','Marketing','Business',
  'Music','Photography','Finance','Health','Other',
];

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  background: '#15122c', border: '1px solid rgba(255,255,255,.12)',
  color: '#f4f3fb', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color .15s',
};

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 700, color: '#dcdef0', marginBottom: 6,
};

export default function CreateCourseModal({ user, initialType = 'free', onClose, onCreated, onBack }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const photoRef = useRef();

  const [form, setForm] = useState({
    title: '', description: '', photo: '', video_url: '', category: 'Development', full_price: '',
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [priceError,   setPriceError]   = useState('');
  const [success,      setSuccess]      = useState(false);
  const [createdCourse,setCreatedCourse]= useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError(t('ccm.err_title')); return; }
    if (isNaN(Number(form.full_price)) || Number(form.full_price) < 50) {
      setPriceError(t('ccm.err_min_price'));
      setError(t('ccm.err_min_price')); return;
    }
    if (!form.description.trim()) { setError(t('ccm.err_description')); return; }
    if (!form.photo) { setError(t('ccm.err_photo')); return; }
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
      if (!r.ok) { setError(d.error || t('ccm.err_failed')); setSubmitting(false); return; }
      setSuccess(true);
      setCreatedCourse(d);
      onCreated?.(d);
    } catch {
      setError(t('ccm.err_server'));
      setSubmitting(false);
    }
  }

  async function handleSuccessClose() {
    try {
      await fetch(`${API}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:    'user',
          kind:    `course_created_${createdCourse?.id ?? Date.now()}`,
          title:   t('ccm.notif_title'),
          message: t('ccm.notif_msg', { title: createdCourse?.title || form.title }),
          email:   user.email,
          name:    createdCourse?.title || form.title,
        }),
      });
    } catch {}
    onClose();
    navigate('/courses');
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: 480, maxHeight: '90vh',
          background: '#15132e',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 20,
          boxShadow: '0 32px 80px -20px rgba(0,0,0,.9)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,108,246,.18)', border: '1px solid rgba(124,108,246,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: '#fbfbff', margin: '0 0 3px', lineHeight: 1.2 }}>{t('fd.create_a_course')}</h2>
              <p style={{ fontSize: 13, color: '#7e82a0', margin: 0 }}>{t('ccm.subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7e82a0', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.13)'; e.currentTarget.style.color = '#f4f3fb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#7e82a0'; }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {success ? (
            /* Success screen */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: 18, color: '#fbfbff', margin: '0 0 8px' }}>{t('ccm.created_title')}</p>
              <p style={{ fontSize: 13, color: '#a7abc8', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 320 }}>
                {t('ccm.created_desc')}
              </p>
              <button
                onClick={handleSuccessClose}
                style={{ padding: '11px 28px', borderRadius: 12, background: '#7c6cf6', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, boxShadow: '0 6px 16px -5px rgba(124,108,246,.7)' }}
              >
                {t('ccm.view_courses')}
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Course title */}
              <div>
                <label style={labelStyle}>
                  {t('ccm.course_title')} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={t('ccm.title_ph')}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,108,246,.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>
                  {t('fd.description')} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder={t('ccm.desc_ph')}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,108,246,.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>

              {/* Course photo */}
              <div>
                <label style={labelStyle}>
                  {t('fd.course_photo')} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  style={{ width: '100%', padding: '18px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1.5px dashed rgba(255,255,255,.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#7e82a0', fontSize: 13, fontFamily: 'inherit', transition: 'border-color .15s, color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; e.currentTarget.style.color = '#9b8cff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; e.currentTarget.style.color = '#7e82a0'; }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {photoPreview ? t('fd.change_photo') : t('ccm.choose_photo')}
                </button>
                {photoPreview && (
                  <div style={{ marginTop: 10, position: 'relative' }}>
                    <img src={photoPreview} alt="preview" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)' }} />
                    <button type="button" onClick={() => { setPhotoPreview(''); set('photo', ''); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Category + Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>{t('fd.category')}</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(124,108,246,.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#15122c' }}>{c}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#62668a' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    {t('fd.price_tnd')} <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#62668a' }}>TND</span>
                    <input
                      type="number" min="50" step="0.01" required
                      value={form.full_price}
                      onChange={e => {
                        const val = e.target.value;
                        set('full_price', val);
                        if (val !== '' && Number(val) < 50) setPriceError(t('ccm.min_50'));
                        else setPriceError('');
                      }}
                      onBlur={e => {
                        if (e.target.value === '' || Number(e.target.value) < 50) setPriceError(t('ccm.min_50'));
                      }}
                      placeholder="50.00"
                      style={{ ...inputStyle, paddingLeft: 44, borderColor: priceError ? 'rgba(248,113,113,.6)' : 'rgba(255,255,255,.12)' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(124,108,246,.5)'}
                    />
                  </div>
                  {priceError && <p style={{ marginTop: 4, fontSize: 11, color: '#f87171' }}>{priceError}</p>}
                </div>
              </div>

              {/* Commission note */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(124,108,246,.08)', border: '1px solid rgba(124,108,246,.2)', borderRadius: 12, padding: '11px 14px' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p style={{ fontSize: 12, color: '#9b8cff', lineHeight: 1.6, margin: 0 }}>
                  {t('ccm.commission_pre')} <strong>6%</strong>. {t('ccm.commission_mid')} <strong>94%</strong> {t('ccm.commission_post')}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 12, padding: '10px 14px' }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
                <button type="button" onClick={onClose}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#a7abc8', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {t('ccm.cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#7c6cf6', border: 'none', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 6px 16px -5px rgba(124,108,246,.7)', transition: 'background .15s' }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#6a5cf0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#7c6cf6'; }}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t('ccm.creating')}
                    </span>
                  ) : t('ccm.create_course')}
                </button>
              </div>
            </form>
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
