import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const C = {
  bg:'#070b14', card:'rgba(255,255,255,0.028)', cardHov:'rgba(255,255,255,0.05)',
  border:'rgba(255,255,255,0.07)', borderAcc:'rgba(124,108,246,0.45)',
  surface:'#0d1220',
  accent:'#7c6cf6', accentMid:'#9b8cff', accentDim:'rgba(124,108,246,0.1)',
  emerald:'#10b981', emeraldDim:'rgba(16,185,129,0.1)', emeraldBord:'rgba(16,185,129,0.28)',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.1)', amberBord:'rgba(245,158,11,0.28)',
  rose:'#f87171', roseDim:'rgba(248,113,113,0.1)', roseBord:'rgba(248,113,113,0.28)',
  text:'#f4f3fb', sub:'#a7abc8', muted:'#62668a',
};

const INP = {
  width:'100%', boxSizing:'border-box', padding:'13px 16px', borderRadius:14,
  background:'rgba(255,255,255,0.04)', border:`1.5px solid ${C.border}`,
  color:C.text, fontSize:14, outline:'none', fontFamily:'inherit',
  transition:'border-color .2s, background .2s, box-shadow .2s',
};
const focusOn  = e => { e.target.style.borderColor='rgba(124,108,246,0.5)'; e.target.style.background='rgba(124,108,246,0.06)'; e.target.style.boxShadow='0 0 0 3px rgba(124,108,246,0.1)'; };
const focusOff = e => { e.target.style.borderColor=C.border; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; };

const IcShield  = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcKey     = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IcGlobe   = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcBell    = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcLogout  = ({s=15}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcTrash   = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcArrow   = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const IcCheck   = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcEye     = ({s=15,off}) => off
  ? <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ marginBottom:18, borderRadius:22, background:C.card, border:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'18px 24px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ color:C.accentMid }}>{icon}</div>
        <p style={{ fontSize:12, fontWeight:800, color:C.text, margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</p>
      </div>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBlock:12, borderBottom:`1px solid ${C.border}` }}>
      <p style={{ fontSize:13, fontWeight:500, color:C.sub, margin:0 }}>{label}</p>
      {badge
        ? <span style={{ fontSize:11.5, fontWeight:800, color:badge.color, background:badge.bg, border:`1px solid ${badge.border}`, padding:'3px 12px', borderRadius:20 }}>{value}</span>
        : <p style={{ fontSize:13, fontWeight:600, color:C.muted, margin:0 }}>{value}</p>
      }
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout, addNotification } = useAuth();
  const [currPass,  setCurrPass]  = useState('');
  const [showCurr,  setShowCurr]  = useState(false);
  const [newPass,   setNewPass]   = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [confirm,   setConfirm]   = useState('');
  const [showConf,  setShowConf]  = useState(false);
  const [passMsg,   setPassMsg]   = useState('');
  const [passErr,   setPassErr]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  if (!user) return null;

  const cinStatus = user.cinStatus;
  const statusBadge = cinStatus==='approved'
    ? { color:C.emerald, bg:C.emeraldDim, border:C.emeraldBord, label:t('sp.verified') }
    : cinStatus==='pending'
    ? { color:C.amber,   bg:C.amberDim,   border:C.amberBord,   label:t('sp.pending') }
    : { color:C.rose,    bg:C.roseDim,    border:C.roseBord,    label:t('sp.not_verified') };

  async function handleChangePassword(e) {
    e.preventDefault();
    setPassMsg(''); setPassErr('');

    if (!currPass)           { setPassErr(t('sp.err_current_required'));        return; }
    if (!newPass)            { setPassErr(t('sp.err_new_required'));        return; }
    if (newPass.length < 6)  { setPassErr(t('sp.err_min'));                     return; }
    if (newPass !== confirm)  { setPassErr(t('sp.err_mismatch'));  return; }

    setLoading(true);
    try {
      /* Single call — verifies current password AND stores new hash atomically */
      const res  = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword: currPass, newPassword: newPass }),
      });
      const data = await res.json();

      if (data.error === 'wrongPassword') {
        setPassErr(t('sp.err_wrong'));
        setLoading(false);
        return;
      }
      if (data.error) {
        setPassErr(t('sp.err_generic'));
        setLoading(false);
        return;
      }

      /* Step 3 — success: clear fields, show message, fire notification */
      setCurrPass(''); setNewPass(''); setConfirm('');
      setPassMsg(t('sp.pw_updated'));

      await addNotification({
        type:    'user',
        kind:    'password_changed',
        title:   t('sp.pw_notif_title'),
        message: t('sp.pw_notif_msg'),
        email:   user.email,
        name:    user.name,
      });

    } catch { setPassErr(t('sp.err_network')); }
    finally  { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", paddingBottom:80 }}>

      {/* Blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,108,246,0.12),transparent 68%)', top:'-200px', left:'-150px', animation:'spBlob1 20s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.08),transparent 68%)', top:'40%', right:'-160px', animation:'spBlob2 26s ease-in-out infinite' }}/>
      </div>

      <div className="fm-page-header" style={{ position:'relative', zIndex:1, maxWidth:680, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:36 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>{t('sp.my_account')}</p>
          <h1 style={{ fontSize:38, fontWeight:900, color:C.text, margin:'0 0 8px', letterSpacing:'-0.03em', lineHeight:1.1 }}>
            {t('sp.my')}{' '}
            <span style={{ background:'linear-gradient(120deg,#c4baff 0%,#9b8cff 42%,#7c6cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {t('sp.settings')}
            </span>
          </h1>
          <p style={{ fontSize:14, color:C.muted, margin:0 }}>{t('sp.subtitle')}</p>
        </div>

        {/* Account info */}
        <SectionCard title={t('sp.account_info')} icon={<IcShield s={16}/>}>
          <InfoRow label={t('sp.full_name')} value={user.name || '—'}/>
          <InfoRow label={t('sp.email')} value={user.email}/>
          <InfoRow label={t('sp.role')} value={user.role === 'client' ? t('dash.role.client') : user.role === 'freelancer' ? t('dash.role.freelancer') : user.role}/>
          <InfoRow label={t('sp.status')} value={statusBadge.label} badge={statusBadge}/>
          <div style={{ borderBottom:`1px solid ${C.border}` }}/>
        </SectionCard>

        {/* Password */}
        <SectionCard title={t('sp.change_password')} icon={<IcKey s={16}/>}>
          <form onSubmit={handleChangePassword} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* ── reusable eye button renderer ── */}
            {[
              { label:t('sp.current_pw'),           show:showCurr, setShow:setShowCurr, val:currPass, setVal:setCurrPass },
              { label:t('sp.new_pw'),           show:showNew,  setShow:setShowNew,  val:newPass,  setVal:setNewPass  },
              { label:t('sp.confirm_pw'), show:showConf, setShow:setShowConf, val:confirm, setVal:setConfirm },
            ].map(({ label, show, setShow, val, setVal }) => (
              <div key={label}>
                <p style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 7px' }}>{label}</p>
                <div style={{ position:'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    value={val} onChange={e => setVal(e.target.value)}
                    placeholder=""
                    style={{ ...INP, paddingRight:50 }} onFocus={focusOn} onBlur={focusOff}
                    onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShow(v => !v)}
                    style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)', zIndex:10, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color: show ? '#9b8cff' : '#8a8eb8', transition:'color .18s, background .18s', outline:'none' }}
                    onMouseEnter={e => { e.currentTarget.style.color='#9b8cff'; e.currentTarget.style.background='rgba(124,108,246,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = show ? '#9b8cff' : '#8a8eb8'; e.currentTarget.style.background='transparent'; }}
                  >
                    {show
                      ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
            {passErr && (
              <div style={{ padding:'11px 16px', borderRadius:12, background:C.roseDim, border:`1px solid ${C.roseBord}` }}>
                <p style={{ fontSize:12.5, color:C.rose, margin:0, fontWeight:600 }}>{passErr}</p>
              </div>
            )}
            {passMsg && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:12, background:C.emeraldDim, border:`1px solid ${C.emeraldBord}` }}>
                <IcCheck s={14}/> <p style={{ fontSize:12.5, color:C.emerald, margin:0, fontWeight:700 }}>{passMsg}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 28px', borderRadius:14, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontWeight:800, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'0 8px 24px -6px rgba(124,108,246,0.55)', transition:'opacity .15s, transform .15s', letterSpacing:'0.01em', alignSelf:'flex-start' }}
              onMouseEnter={e=>{if(!loading){e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)';}}}
              onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)';}}>
              {loading ? t('sp.saving') : t('sp.update_password')}
            </button>
          </form>
        </SectionCard>

        {/* Session */}
        <SectionCard title={t('sp.session')} icon={<IcLogout s={16}/>}>
          <button onClick={()=>setLogoutModal(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'12px 26px', borderRadius:13, background:C.roseDim, border:`1.5px solid ${C.roseBord}`, color:C.rose, fontWeight:700, fontSize:13.5, cursor:'pointer', transition:'all .18s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(248,113,113,0.18)';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.roseDim;e.currentTarget.style.transform='translateY(0)';}}>
            <IcLogout s={15}/> {t('sp.logout')}
          </button>
        </SectionCard>

      </div>

      {/* Logout modal */}
      {logoutModal && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
          onClick={()=>setLogoutModal(false)}>
          <div style={{ width:'100%', maxWidth:380, background:'#0d1120', border:`1px solid ${C.border}`, borderRadius:24, boxShadow:'0 24px 64px rgba(0,0,0,0.8)', overflow:'hidden' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 24px 0' }}>
              <div style={{ width:48, height:48, borderRadius:16, background:C.roseDim, border:`1px solid ${C.roseBord}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.rose }}><IcLogout s={22}/></div>
              <button onClick={()=>setLogoutModal(false)} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer', color:C.sub, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding:'16px 24px 22px' }}>
              <p style={{ fontSize:16, fontWeight:900, color:C.text, margin:'0 0 6px' }}>{t('sp.logout_confirm')}</p>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 24px', lineHeight:1.5 }}>{t('sp.logout_redirect')}</p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setLogoutModal(false)}
                  style={{ flex:1, padding:'12px', borderRadius:13, border:`1px solid ${C.border}`, background:'none', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', transition:'background .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
                  {t('sp.cancel')}
                </button>
                <button onClick={()=>{logout();setLogoutModal(false);}}
                  style={{ flex:1, padding:'12px', borderRadius:13, background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 4px 14px -3px rgba(239,68,68,0.45)' }}>
                  {t('sp.yes_logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(50px,-40px)scale(1.08)} }
        @keyframes spBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-40px,35px)scale(1.06)} }
        select option { background:#0d1220; }
        input::placeholder { color:#3a3d5c; }
      `}</style>
    </div>
  );
}
