import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { cldImg } from '../utils/cloudinary';
import { uploadFile } from '../utils/upload';
import { toast } from '../components/Toast';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const C = {
  bg:'var(--fm-bg)', card:'var(--fm-surface-hover-soft)', cardHov:'var(--fm-border-soft)',
  border:'var(--fm-border)', borderAcc:'rgba(124,108,246,0.45)',
  surface:'var(--fm-surface)',
  accent:'var(--fm-primary)', accentMid:'var(--fm-primary-light)', accentDim:'rgba(124,108,246,0.1)',
  emerald:'#10b981', emeraldDim:'rgba(16,185,129,0.1)', emeraldBord:'rgba(16,185,129,0.28)',
  sky:'#0ea5e9', skyDim:'rgba(14,165,233,0.1)', skyBord:'rgba(14,165,233,0.28)',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.1)', amberBord:'rgba(245,158,11,0.25)',
  rose:'#f87171', roseDim:'var(--fm-danger-bg)', roseBord:'rgba(248,113,113,0.28)',
  text:'var(--fm-text-2)', sub:'var(--fm-text-5)', muted:'var(--fm-text-7)',
};

const TUNISIAN_REGIONS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

const getTint     = s => { const p=['#7c6cf6','#a855f7','#3b82f6','#0ea5e9','#10b981','#f59e0b','#f43f5e']; return p[((s||'').charCodeAt(0)||0)%p.length]; };
const getInitials = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');

const INP = {
  width:'100%', boxSizing:'border-box', padding:'13px 16px', borderRadius:14,
  background:'var(--fm-surface-hover-soft)', border:`1.5px solid ${C.border}`,
  color:C.text, fontSize:14, outline:'none', fontFamily:'inherit',
  transition:'border-color .2s, background .2s, box-shadow .2s',
};
const focusOn  = e => { e.target.style.borderColor='rgba(124,108,246,0.55)'; e.target.style.background='rgba(124,108,246,0.07)'; e.target.style.boxShadow='0 0 0 3px rgba(124,108,246,0.12), inset 3px 0 0 rgba(124,108,246,0.55)'; };
const focusOff = e => { e.target.style.borderColor=C.border; e.target.style.background='var(--fm-surface-hover-soft)'; e.target.style.boxShadow='none'; };

/* ── Icons ── */
const IcCamera      = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcCheck       = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcPin         = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcMail        = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcShield      = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcClock       = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IcAlert       = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcUser        = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcEdit        = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcChev        = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcSpark       = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9 9H2l5.5 4.5L5 21l7-4.5L19 21l-2.5-7.5L22 9h-7z"/></svg>;

function FieldLabel({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, margin:'0 0 10px', display:'flex', alignItems:'center', gap:7,
      textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(155,140,255,0.8)' }}>
      <span style={{ width:2.5, height:12, borderRadius:2, background:'linear-gradient(to bottom,#7c6cf6,#a78bfa)', display:'inline-block', flexShrink:0 }}/>
      {children}
    </p>
  );
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const photoRef = useRef();

  /* ── All original state — unchanged ── */
  const [name,   setName]   = useState(user?.name   || '');
  const [bio,    setBio]    = useState(user?.bio    || '');
  const [region, setRegion] = useState(user?.region || '');
  const [photo,  setPhoto]  = useState(user?.photo  || '');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState('');

  if (!user) return null;

  const tint      = getTint(user.email || '');
  const inits     = getInitials(name || user.email);
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? t('dash.greet.morning') : hour < 18 ? t('dash.greet.afternoon') : t('dash.greet.evening');
  const firstName = (name || user.name || 'Client').split(' ')[0];
  const avatarSrc = photo || user.photo;

  const cinStatus   = user.cinStatus;
  const isApproved  = cinStatus === 'approved';
  const isPending   = cinStatus === 'pending';
  const statusColor = isApproved ? C.emerald : isPending ? C.amber : C.rose;
  const statusDim   = isApproved ? C.emeraldDim  : isPending ? C.amberDim  : C.roseDim;
  const statusBord  = isApproved ? C.emeraldBord  : isPending ? C.amberBord  : C.roseBord;
  const statusLabel = isApproved ? t('dash.identity.verified') : isPending ? t('dash.identity.verifying') : t('dash.identity.not_verified');
  const StatusIcon  = isApproved ? IcShield : isPending ? IcClock : IcAlert;
  const statusDesc  = isApproved ? t('cd.status_approved') : isPending ? t('cd.status_pending') : t('cd.status_none');

  /* ── All original handlers — unchanged ── */
  async function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPhoto(localPreview);
    try {
      const { secure_url } = await uploadFile({ file, upload_type: 'profile' });
      setPhoto(secure_url);
      await updateUser(user.email, { photo: secure_url });
    } catch (err) {
      setPhoto(user.photo || null);
      toast.error(err.message || 'Photo upload failed');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!photo && !user.photo) { setSaveError(t('cd.err_photo')); return; }
    if (!name.trim())         { setSaveError(t('cd.err_name'));      return; }
    if (!region.trim())       { setSaveError(t('cd.err_region'));           return; }
    if (!bio.trim())          { setSaveError(t('cd.err_bio'));       return; }
    setSaveError('');
    setSaving(true);
    try {
      await updateUser(user.email, { name, bio, region, photo });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  /* ── UI-only: profile completion (no effect on data/API) ── */
  const completionItems = [
    { done: !!avatarSrc,                       label: t('cd.item.photo') },
    { done: !!(name || user.name || '').trim(), label: t('cd.item.full_name')     },
    { done: !!region,                           label: t('cd.item.region')           },
    { done: !!(bio  || user.bio  || '').trim(), label: t('cd.item.bio')       },
  ];
  const completion    = Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100);
  const missing       = completionItems.filter(i => !i.done);
  const isComplete    = completion === 100;
  const progressColor = isComplete
    ? `linear-gradient(90deg,${C.emerald},#34d399)`
    : `linear-gradient(90deg,${C.accent},${C.accentMid},#a78bfa)`;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", paddingBottom:120 }}>

      {/* ── Animated background blobs ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:800, height:800, borderRadius:'50%', background:`radial-gradient(circle,${tint}14,transparent 68%)`, top:'-280px', left:'-180px', animation:'cdBlob1 22s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.09),transparent 68%)', top:'20%', right:'-200px', animation:'cdBlob2 28s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.07),transparent 68%)', bottom:'-60px', left:'35%', animation:'cdBlob3 32s ease-in-out infinite' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:780, margin:'0 auto', padding:'clamp(80px,10vw,90px) clamp(16px,3vw,24px) 0' }}>

        {/* ════════════════════════════════════════════
            HERO PROFILE CARD
            ════════════════════════════════════════════ */}
        <div style={{
          borderRadius:28, marginBottom:18, position:'relative', overflow:'hidden',
          background:'linear-gradient(140deg,rgba(124,108,246,0.1) 0%,var(--fm-surface) 50%,var(--fm-bg) 100%)',
          border:'1px solid rgba(124,108,246,0.2)',
          boxShadow:`0 40px 100px -24px rgba(0,0,0,0.75), 0 0 0 1px var(--fm-border-soft), inset 0 1px 0 var(--fm-border)`,
        }}>

          {/* Decorative: radial glow + dot grid */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            background:`radial-gradient(ellipse 600px 320px at -8% -30%, ${tint}1c, transparent 65%), radial-gradient(ellipse 400px 280px at 108% 115%, rgba(168,85,247,0.09), transparent 65%)` }}/>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(var(--fm-surface-hover-soft) 1px, transparent 1px)',
            backgroundSize:'28px 28px',
            WebkitMaskImage:'radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)',
            maskImage:'radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)' }}/>

          {/* ── Top bar: greeting ── */}
          <div style={{ position:'relative', padding:'28px 32px 0' }}>
            <h1 style={{ fontSize:30, fontWeight:900, color:C.text, margin:0, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              {greeting},{' '}
              <span style={{ background:`linear-gradient(110deg,var(--fm-text-1) 0%,${tint} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {firstName}
              </span>
            </h1>
          </div>

          {/* ── Avatar + identity ── */}
          <div style={{ position:'relative', padding:'24px 32px 0', display:'flex', alignItems:'flex-start', gap:24 }}>

            {/* Avatar with upload */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:96, height:96, borderRadius:24, overflow:'hidden',
                background:`linear-gradient(135deg,${tint}30,${tint}10)`,
                color:tint, display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:900, fontSize:30, letterSpacing:'-0.02em',
                border:`2px solid ${tint}45`,
                boxShadow:`0 0 0 5px ${tint}12, 0 20px 48px -12px ${tint}45`,
              }}>
                {avatarSrc
                  ? <img src={avatarSrc.startsWith('data:') ? avatarSrc : cldImg(avatarSrc)} alt={name}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}/>
                  : inits}
              </div>
              <button onClick={() => photoRef.current?.click()}
                style={{
                  position:'absolute', bottom:-5, right:-5,
                  width:34, height:34, borderRadius:12,
                  background:`linear-gradient(135deg,${C.accent},#6254d4)`,
                  border:`2.5px solid ${C.bg}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', color:'#fff',
                  boxShadow:'0 4px 16px -4px rgba(124,108,246,0.75)',
                  transition:'all .18s cubic-bezier(.4,0,.2,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 22px -4px rgba(124,108,246,0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(124,108,246,0.75)'; }}>
                <IcCamera s={14}/>
              </button>
              <input type="file" accept="image/*" ref={photoRef} style={{ display:'none' }} onChange={handlePhotoFile}/>
            </div>

            {/* Name / email / location */}
            <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
              <p style={{ fontSize:24, fontWeight:900, color:C.text, margin:'0 0 7px', letterSpacing:'-0.028em', lineHeight:1.1 }}>
                {name || user.name || '—'}
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ color:C.muted, display:'flex' }}><IcMail s={13}/></span>
                <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{user.email}</span>
              </div>
              {region ? (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5, color:C.sub, fontWeight:600, background:'var(--fm-surface-hover)', border:`1px solid ${C.border}`, borderRadius:10, padding:'5px 12px' }}>
                  <IcPin s={11}/> {region}
                </span>
              ) : (
                <span style={{ fontSize:12, color:C.muted, fontStyle:'italic' }}>{t('cd.no_region')}</span>
              )}
            </div>
          </div>

          {/* ── Profile completion bar ── */}
          <div style={{ position:'relative', margin:'24px 0 0', padding:'20px 32px 26px', borderTop:`1px solid var(--fm-border-soft)` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <IcSpark s={12} style={{ color: isComplete ? C.emerald : C.accentMid }}/>
                <p style={{ fontSize:11.5, fontWeight:700, color: isComplete ? C.emerald : C.sub, margin:0 }}>
                  {isComplete ? t('cd.profile_complete') : t('cd.complete_profile')}
                </p>
              </div>
              <span style={{ fontSize:13, fontWeight:900, color: isComplete ? C.emerald : C.accentMid, letterSpacing:'-0.02em' }}>
                {completion}%
              </span>
            </div>

            {/* Progress track */}
            <div style={{ height:5, borderRadius:10, background:'var(--fm-surface-hover)', overflow:'hidden', marginBottom:10 }}>
              <div style={{
                height:'100%', width:`${completion}%`, borderRadius:10,
                background: progressColor,
                transition:'width .7s cubic-bezier(.4,0,.2,1)',
                boxShadow: isComplete ? `0 0 14px rgba(16,185,129,0.5)` : `0 0 14px rgba(124,108,246,0.45)`,
              }}/>
            </div>

            {/* Missing items */}
            {missing.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                {missing.map(item => (
                  <span key={item.label} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:C.muted, background:'var(--fm-surface-hover-soft)', border:`1px solid ${C.border}`, borderRadius:20, padding:'3px 10px', fontWeight:500 }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--fm-border-strong)', display:'inline-block', flexShrink:0 }}/>
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CIN VERIFICATION STATUS CARD
            ════════════════════════════════════════════ */}
        <div style={{
          borderRadius:20, marginBottom:18, padding:'18px 22px',
          background: statusDim,
          border:`1px solid ${statusBord}`,
          display:'flex', alignItems:'flex-start', gap:14,
        }}>
          <div style={{
            width:40, height:40, borderRadius:13, flexShrink:0,
            background:`${statusColor}18`, border:`1px solid ${statusColor}35`,
            display:'flex', alignItems:'center', justifyContent:'center', color:statusColor,
          }}>
            <StatusIcon s={18}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:800, color:statusColor, margin:'0 0 3px' }}>{statusLabel}</p>
            <p style={{ fontSize:12.5, color:C.sub, margin:0, lineHeight:1.6 }}>{statusDesc}</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            EDIT FORM CARD — PREMIUM
            ════════════════════════════════════════════ */}
        <div style={{
          borderRadius:26, overflow:'hidden', position:'relative',
          background:'linear-gradient(155deg,rgba(124,108,246,0.08) 0%,var(--fm-surface) 38%,var(--fm-bg) 100%)',
          border:'1px solid rgba(124,108,246,0.22)',
          boxShadow:'0 24px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px var(--fm-border-soft), inset 0 1px 0 var(--fm-border)',
        }}>

          {/* Top gradient accent line */}
          <div style={{ height:2.5, background:'linear-gradient(90deg,#7c6cf6 0%,#a78bfa 55%,#6366f1 100%)', flexShrink:0 }}/>

          {/* Corner ambient glow */}
          <div style={{ position:'absolute', width:360, height:230, top:-90, left:-70, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,108,246,0.1),transparent 70%)', pointerEvents:'none' }}/>

          {/* ── Card header ── */}
          <div style={{
            padding:'22px 30px 20px', borderBottom:'1px solid var(--fm-border-soft)',
            display:'flex', alignItems:'center', gap:14, position:'relative',
          }}>
            <div style={{
              width:44, height:44, borderRadius:15, flexShrink:0,
              background:'linear-gradient(135deg,rgba(124,108,246,0.3),rgba(124,108,246,0.08))',
              border:'1px solid rgba(124,108,246,0.35)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#9b8cff',
              boxShadow:'0 4px 20px -6px rgba(124,108,246,0.55)',
            }}>
              <IcEdit s={19}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{
                fontSize:15.5, fontWeight:800, margin:'0 0 2px', letterSpacing:'-0.025em',
                background:'linear-gradient(90deg,var(--fm-text-1) 0%,var(--fm-primary-light) 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>{t('cd.profile_info')}</p>
              <p style={{ fontSize:12, color:'var(--fm-text-7)', margin:0 }}>{t('cd.visible_clients')}</p>
            </div>
          </div>

          {/* ── Form — field sections ── */}
          <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column' }}>

            {/* Nom complet */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid var(--fm-border-soft)' }}>
              <FieldLabel>{t('cd.full_name')}</FieldLabel>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.muted, pointerEvents:'none', display:'flex' }}>
                  <IcUser s={15}/>
                </div>
                <input
                  value={name}
                  readOnly
                  placeholder={t('cd.full_name_placeholder')}
                  style={{ ...INP, paddingLeft:42, opacity:0.6, cursor:'not-allowed' }}
                />
              </div>
            </div>

            {/* Région */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid var(--fm-border-soft)' }}>
              <FieldLabel>{t('cd.region')}</FieldLabel>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.muted, pointerEvents:'none', display:'flex' }}>
                  <IcPin s={15}/>
                </div>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  style={{ ...INP, appearance:'none', cursor:'pointer', paddingLeft:42, paddingRight:44 }}
                  onFocus={focusOn} onBlur={focusOff}>
                  <option value="">{t('cd.select_region')}</option>
                  {TUNISIAN_REGIONS.map(r => <option key={r} value={r} style={{ background:C.surface }}>{r}</option>)}
                </select>
                <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:C.muted }}>
                  <IcChev s={12}/>
                </div>
              </div>
            </div>

            {/* Biographie */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid var(--fm-border-soft)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <FieldLabel>{t('cd.bio')} <span style={{ fontWeight:500, textTransform:'none', letterSpacing:0, opacity:0.55 }}>{t('cd.optional')}</span></FieldLabel>
                <span style={{ fontSize:11, fontWeight:600, color: bio.length > 260 ? C.amber : C.muted, transition:'color .2s' }}>{bio.length}/300</span>
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder={t('cd.bio_placeholder')}
                style={{ ...INP, resize:'none', lineHeight:1.7 }}
                onFocus={focusOn} onBlur={focusOff}
              />
            </div>

            {/* ── Footer: save action ── */}
            <div style={{ padding:'20px 30px', background:'var(--fm-bg-2)', borderTop:'1px solid var(--fm-border-soft)' }}>

              {/* Error banner */}
              {saveError && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', marginBottom:14, borderRadius:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--fm-danger)', margin:0 }}>{saveError}</p>
                </div>
              )}

              {/* Success banner */}
              {saved && (
                <div style={{
                  display:'flex', alignItems:'center', gap:12, padding:'13px 16px', marginBottom:16,
                  borderRadius:14, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
                  animation:'cdFadeIn .3s ease',
                }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:C.emerald }}>
                    <IcCheck s={15}/>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:C.emerald, margin:'0 0 1px' }}>{t('cd.profile_saved')}</p>
                    <p style={{ fontSize:11.5, color:'rgba(16,185,129,0.7)', margin:0 }}>{t('cd.changes_visible')}</p>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.6 }}>
                  {t('cd.changes_immediate')}
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="cd-save-btn"
                  style={{
                    flexShrink:0, display:'inline-flex', alignItems:'center', gap:10,
                    padding:'14px 34px', borderRadius:16,
                    background:'linear-gradient(135deg,#7c6cf6 0%,#5e4fd4 100%)',
                    border:'1px solid rgba(155,140,255,0.2)',
                    color:'#fff', fontWeight:800, fontSize:14,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.65 : 1,
                    boxShadow:'0 8px 32px -6px rgba(124,108,246,0.65), inset 0 1px 0 rgba(255,255,255,0.16)',
                    transition:'all .2s cubic-bezier(.4,0,.2,1)',
                    letterSpacing:'0.01em', whiteSpace:'nowrap',
                    position:'relative', overflow:'hidden',
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 16px 44px -6px rgba(124,108,246,0.78), inset 0 1px 0 rgba(255,255,255,0.2)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px -6px rgba(124,108,246,0.65), inset 0 1px 0 rgba(255,255,255,0.16)'; }}>
                  {saved
                    ? <><IcCheck s={15}/> {t('cd.saved')}</>
                    : saving
                    ? t('cd.saving')
                    : <><IcEdit s={14}/> {t('cd.save_profile')}</>}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      <style>{`
        @keyframes cdBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(55px,-45px)scale(1.09)} 66%{transform:translate(-35px,32px)scale(0.94)} }
        @keyframes cdBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(-60px,42px)scale(1.06)} 70%{transform:translate(25px,-25px)scale(0.97)} }
        @keyframes cdBlob3 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(40px,40px)scale(1.11)} }
        @keyframes cdFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cdShimmer { 0%{transform:translateX(-140%)} 100%{transform:translateX(340%)} }
        .cd-save-btn::after { content:''; position:absolute; inset:0; width:45%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent); animation:cdShimmer 2.8s ease-in-out infinite; pointer-events:none; }
        select option { background:var(--fm-surface); color:var(--fm-text-5); }
        input::placeholder, textarea::placeholder { color:var(--fm-text-7); }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(124,108,246,0.3); border-radius:10px; }
      `}</style>
    </div>
  );
}
