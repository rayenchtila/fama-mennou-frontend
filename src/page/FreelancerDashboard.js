import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useRealtimeChannel } from '../lib/useRealtimeChannel';
import { uploadVideo, uploadImage, warmVideoUpload } from '../utils/upload';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const TUNISIAN_REGIONS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

const AVATAR_COLORS = [
  'from-indigo-500 to-indigo-600','from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600','from-amber-500 to-amber-600',
  'from-sky-500 to-sky-600','from-fuchsia-500 to-fuchsia-600',
  'from-violet-500 to-violet-600',
];

const TABS = [
  { id: 'profile',   label: 'Profil',    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'dashboard', label: 'Dashboard', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'logout',    label: 'Log out',   icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>, danger: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGradient(email = '') {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}
function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function Avi({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (user?.photo)
    return <img src={cldImg(user.photo)} alt={user.name} className={`${sz} rounded-2xl object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${getGradient(user?.email)} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(user?.name || user?.email || '?')}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "#7c6cf6", loading }) {
  return (
    <div style={{ background: "#16142e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,108,246,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      {loading
        ? <div style={{ height: 28, width: 64, background: "rgba(255,255,255,0.06)", borderRadius: 8, marginBottom: 4 }} />
        : <p style={{ fontSize: 26, fontWeight: 800, color: "#f4f3fb", letterSpacing: "-0.02em" }}>{value}</p>
      }
      <p style={{ fontSize: 11, fontWeight: 600, color: "#62668a", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      {sub && <p style={{ fontSize: 10, color: "#62668a", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ display: "flex", alignItems: "center", color: "#9b8cff", opacity: 0.8 }}>{icon}</span>}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#f4f3fb" }}>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: "#9b8cff", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = "#b5aaff"}
          onMouseLeave={e => e.currentTarget.style.color = "#9b8cff"}>
          {action} →
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const { t } = useTranslation();
  const map = {
    open:        { label: t('fd.status.open'),   dot: '#3ec2e8' },
    in_progress: { label: t('fd.status.in_progress'), dot: '#f59e0b' },
    completed:   { label: t('fd.status.completed'),  dot: '#10b981' },
  };
  const s = map[status] || { label: status, dot: '#62668a' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: s.dot + '18', color: s.dot, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

function Empty({ icon, text, action, onAction }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 16px", textAlign:"center", gap:8 }}>
      <div style={{ width:44, height:44, borderRadius:14, background:"rgba(124,108,246,0.08)", border:"1px solid rgba(124,108,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4, color:"#9b8cff" }}>
        {icon}
      </div>
      <p style={{ fontSize:12, fontWeight:600, color:"#62668a" }}>{text}</p>
      {action && (
        <button onClick={onAction}
          style={{ marginTop:8, fontSize:12, fontWeight:700, padding:"7px 16px", borderRadius:10, background:"rgba(124,108,246,0.1)", border:"1px solid rgba(124,108,246,0.2)", color:"#9b8cff", cursor:"pointer", transition:"all 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(124,108,246,0.18)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(124,108,246,0.10)"}>
          {action}
        </button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', ...props }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          style={{ paddingRight: isPassword ? 44 : undefined }}
          onCopy={isPassword ? e => e.preventDefault() : undefined}
          onCut={isPassword ? e => e.preventDefault() : undefined}
          onContextMenu={isPassword ? e => e.preventDefault() : undefined}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw(v => !v)}
            style={{ position:'absolute', top:'50%', right:10, transform:'translateY(-50%)', zIndex:10, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color: showPw ? '#7c6cf6' : '#8a8eb8', transition:'color .18s, background .18s', outline:'none' }}
            onMouseEnter={e => { e.currentTarget.style.color='#7c6cf6'; e.currentTarget.style.background='rgba(124,108,246,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = showPw ? '#7c6cf6' : '#8a8eb8'; e.currentTarget.style.background='transparent'; }}
          >
            {showPw
              ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ── ProfileTab: design tokens & helpers ──────────────────────────────────────

const PC = {
  bg:'#070b14', border:'rgba(255,255,255,0.07)',
  accent:'#7c6cf6', accentMid:'#9b8cff', accentDim:'rgba(124,108,246,0.1)',
  emerald:'#10b981', emeraldDim:'rgba(16,185,129,0.1)', emeraldBord:'rgba(16,185,129,0.28)',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.1)', amberBord:'rgba(245,158,11,0.25)',
  rose:'#f87171', roseDim:'rgba(248,113,113,0.1)', roseBord:'rgba(248,113,113,0.28)',
  text:'#f4f3fb', sub:'#a7abc8', muted:'#62668a',
};
const getTint_P = s => { const p=['#7c6cf6','#a855f7','#3b82f6','#0ea5e9','#10b981','#f59e0b','#f43f5e']; return p[((s||'').charCodeAt(0)||0)%p.length]; };
const getInits_P = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');
const PINP = { width:'100%', boxSizing:'border-box', padding:'13px 16px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.07)', color:'#f4f3fb', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s, background .2s, box-shadow .2s' };
const focusOn_P  = e => { e.target.style.borderColor='rgba(124,108,246,0.55)'; e.target.style.background='rgba(124,108,246,0.07)'; e.target.style.boxShadow='0 0 0 3px rgba(124,108,246,0.12), inset 3px 0 0 rgba(124,108,246,0.55)'; };
const focusOff_P = e => { e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; };
function PFieldLabel({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, margin:'0 0 10px', display:'flex', alignItems:'center', gap:7, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(155,140,255,0.8)' }}>
      <span style={{ width:2.5, height:12, borderRadius:2, background:'linear-gradient(to bottom,#7c6cf6,#a78bfa)', display:'inline-block', flexShrink:0 }}/>
      {children}
    </p>
  );
}
const PIcCamera    = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const PIcCheck     = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const PIcPin       = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const PIcMail      = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const PIcShield    = ({s=18}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const PIcClock     = ({s=18}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const PIcAlert     = ({s=18}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const PIcUser      = ({s=10}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PIcEdit      = ({s=19}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const PIcSpark     = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const PIcLink      = ({s=15}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const PIcBriefcase = ({s=15}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;

// ── TAB: Profil ───────────────────────────────────────────────────────────────

function ProfileTab({ user, updateUser, fetchAccounts }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [photo,        setPhoto]        = useState(user.photo || '');
  const [bio,          setBio]          = useState(user.bio || '');
  const [title,        setTitle]        = useState(user.title || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolio_url || '');
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [profileLive,  setProfileLive]  = useState(false);
  const [portfolioError, setPortfolioError] = useState('');
  const photoRef = useRef();

  useEffect(() => { setBio(user.bio || ''); }, [user.bio]);
  useEffect(() => { setTitle(user.title || ''); }, [user.title]);
  useEffect(() => { setPortfolioUrl(user.portfolio_url || ''); }, [user.portfolio_url]);

  async function handleSave() {
    if (!photo && !user.photo) { setPortfolioError(t('fd.err_photo')); return; }
    if (!title.trim())        { setPortfolioError(t('fd.err_title')); return; }
    if (!bio.trim())          { setPortfolioError(t('fd.err_bio')); return; }
    if (!portfolioUrl.trim()) { setPortfolioError(t('fd.err_portfolio')); return; }
    try { const u = new URL(portfolioUrl.trim()); if (!['http:','https:'].includes(u.protocol)) throw new Error(); }
    catch { setPortfolioError(t('fd.err_portfolio_url')); return; }
    const hasSkills = user.skills && (Array.isArray(user.skills) ? user.skills.length > 0 : String(user.skills).trim().length > 0);
    if (!hasSkills) { setPortfolioError('Ajoutez d\'abord vos compétences dans l\'onglet Dashboard → Compétences'); return; }
    setPortfolioError('');
    setSaving(true);
    try {
      await updateUser(user.email, { bio, title, portfolio_url: portfolioUrl });
      fetch(`${API}/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user', kind: `profile_saved_${Date.now()}`,
          title: t('fd.notif_updated_title'),
          message: t('fd.notif_updated_msg'),
          email: user.email, name: user.name,
        }),
      }).catch(() => {});
      setSaved(true);
      setProfileLive(true);
      setTimeout(() => navigate('/freelancers'), 5000);
    } catch {}
    setSaving(false);
  }

  async function savePhoto(newPhoto) {
    try {
      await updateUser(user.email, { photo: newPhoto });
    } catch {}
  }

  function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhoto(ev.target.result); savePhoto(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function deletePhoto() { setPhoto(''); savePhoto(''); }

  // ── UI-only computed values ──
  const tintP      = getTint_P(user.email || '');
  const initsP     = getInits_P(user.name || user.email);
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? t('dash.greet.morning') : hour < 18 ? t('dash.greet.afternoon') : t('dash.greet.evening');
  const firstName  = (user.name || 'Freelancer').split(' ')[0];
  const avatarSrc  = photo || user.photo;

  const cinStatus   = user.cinStatus;
  const isApproved  = cinStatus === 'approved';
  const isPending   = cinStatus === 'pending';
  const statusColor = isApproved ? PC.emerald : isPending ? PC.amber : PC.rose;
  const statusDim   = isApproved ? PC.emeraldDim : isPending ? PC.amberDim : PC.roseDim;
  const statusBord  = isApproved ? PC.emeraldBord : isPending ? PC.amberBord : PC.roseBord;
  const statusLabel = isApproved ? t('dash.identity.verified') : isPending ? t('dash.identity.verifying') : t('dash.identity.not_verified');
  const StatusIcon  = isApproved ? PIcShield : isPending ? PIcClock : PIcAlert;
  const statusDesc  = isApproved
    ? t('fd.identity.verified_desc')
    : isPending
    ? t('fd.identity.pending_desc')
    : t('fd.identity.none_desc');

  const skillTags = user.skills
    ? (Array.isArray(user.skills) ? user.skills : user.skills.split(',').map(s => s.trim()).filter(Boolean))
    : [];

  const completionItems = [
    { done: !!avatarSrc,                            label: t('cd.item.photo')     },
    { done: !!(title || user.title || '').trim(),   label: t('fd.item.title') },
    { done: !!(bio   || user.bio   || '').trim(),   label: t('cd.item.bio')          },
    { done: !!(portfolioUrl || user.portfolio_url), label: t('fd.item.portfolio')    },
    { done: !!(user.skills && (Array.isArray(user.skills) ? user.skills.length > 0 : String(user.skills).trim().length > 0)), label: t('fd.skills') || 'Compétences' },
  ];
  const completion    = Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100);
  const missing       = completionItems.filter(i => !i.done);
  const isComplete    = completion === 100;
  const progressColor = isComplete
    ? `linear-gradient(90deg,${PC.emerald},#34d399)`
    : `linear-gradient(90deg,${PC.accent},${PC.accentMid},#a78bfa)`;

  return (
    <div style={{ maxWidth:780, margin:'0 auto', paddingTop:'clamp(80px,10vw,96px)', paddingBottom:80, paddingLeft:'clamp(16px,3vw,24px)', paddingRight:'clamp(16px,3vw,24px)' }}>

      {/* ── Animated background blobs ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:800, height:800, borderRadius:'50%', background:`radial-gradient(circle,${tintP}14,transparent 68%)`, top:'-280px', left:'-180px', animation:'fdBlob1 22s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.09),transparent 68%)', top:'20%', right:'-200px', animation:'fdBlob2 28s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.07),transparent 68%)', bottom:'-60px', left:'35%', animation:'fdBlob3 32s ease-in-out infinite' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ════ HERO CARD ════ */}
        <div style={{ borderRadius:28, marginBottom:18, position:'relative', overflow:'hidden', background:'linear-gradient(140deg,rgba(124,108,246,0.1) 0%,rgba(10,13,26,0.98) 50%,rgba(7,11,20,1) 100%)', border:'1px solid rgba(124,108,246,0.2)', boxShadow:'0 40px 100px -24px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 600px 320px at -8% -30%,${tintP}1c,transparent 65%),radial-gradient(ellipse 400px 280px at 108% 115%,rgba(168,85,247,0.09),transparent 65%)` }}/>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(rgba(255,255,255,0.028) 1px,transparent 1px)', backgroundSize:'28px 28px', WebkitMaskImage:'radial-gradient(ellipse 70% 60% at 50% 0%,black 40%,transparent 100%)', maskImage:'radial-gradient(ellipse 70% 60% at 50% 0%,black 40%,transparent 100%)' }}/>

          {/* Top bar */}
          <div style={{ position:'relative', padding:'28px clamp(18px,4vw,32px) 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:tintP, boxShadow:`0 0 8px ${tintP}` }}/>
                <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(155,140,255,0.65)', textTransform:'uppercase', letterSpacing:'0.12em', margin:0 }}>{t('dash.my_account')}</p>
              </div>
              <h1 style={{ fontSize:30, fontWeight:900, color:PC.text, margin:0, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                {greeting},{' '}
                <span style={{ background:`linear-gradient(110deg,#c4baff 0%,${tintP} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{firstName}</span>
              </h1>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:7, flexShrink:0 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, background:PC.accentDim, border:'1px solid rgba(124,108,246,0.3)', color:PC.accentMid, fontSize:10.5, fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase' }}>
                <PIcUser s={10}/> {t('dash.role.freelancer')}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, background:statusDim, border:`1px solid ${statusBord}`, color:statusColor, fontSize:10.5, fontWeight:700 }}>
                <StatusIcon s={10}/> {isApproved ? t('dash.badge.verified') : isPending ? t('dash.badge.pending') : t('dash.badge.not_verified')}
              </span>
            </div>
          </div>

          {/* Avatar + identity */}
          <div style={{ position:'relative', padding:'24px clamp(18px,4vw,32px) 0', display:'flex', alignItems:'flex-start', gap:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:96, height:96, borderRadius:24, overflow:'hidden', background:`linear-gradient(135deg,${tintP}30,${tintP}10)`, color:tintP, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:30, letterSpacing:'-0.02em', border:`2px solid ${tintP}45`, boxShadow:`0 0 0 5px ${tintP}12, 0 20px 48px -12px ${tintP}45` }}>
                {avatarSrc
                  ? <img src={avatarSrc.startsWith('data:') ? avatarSrc : cldImg(avatarSrc)} alt={user.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }}/>
                  : initsP}
              </div>
              <button onClick={() => photoRef.current?.click()} style={{ position:'absolute', bottom:-5, right:-5, width:34, height:34, borderRadius:12, background:`linear-gradient(135deg,${PC.accent},#6254d4)`, border:'2.5px solid #0a0817', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', boxShadow:'0 4px 16px -4px rgba(124,108,246,0.75)', transition:'all .18s cubic-bezier(.4,0,.2,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.12)'; e.currentTarget.style.boxShadow='0 6px 22px -4px rgba(124,108,246,0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 16px -4px rgba(124,108,246,0.75)'; }}>
                <PIcCamera s={14}/>
              </button>
              <input type="file" accept="image/*" ref={photoRef} style={{ display:'none' }} onChange={handlePhotoFile}/>
            </div>
            <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
              <p style={{ fontSize:24, fontWeight:900, color:PC.text, margin:'0 0 4px', letterSpacing:'-0.028em', lineHeight:1.1 }}>{user.name || '—'}</p>
              {(title || user.title) && (
                <p style={{ fontSize:12.5, fontWeight:700, color:PC.accentMid, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{title || user.title}</p>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ color:PC.muted, display:'flex' }}><PIcMail s={13}/></span>
                <span style={{ fontSize:13, color:PC.muted, fontWeight:500 }}>{user.email}</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {user.region && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5, color:PC.sub, fontWeight:600, background:'rgba(255,255,255,0.05)', border:`1px solid ${PC.border}`, borderRadius:10, padding:'5px 12px' }}>
                    <PIcPin s={11}/> {user.region}
                  </span>
                )}
                {skillTags.slice(0, 3).map(s => (
                  <span key={s} style={{ display:'inline-flex', alignItems:'center', fontSize:11.5, fontWeight:700, color:PC.accentMid, background:PC.accentDim, border:'1px solid rgba(124,108,246,0.2)', borderRadius:20, padding:'4px 11px' }}>{s}</span>
                ))}
                {skillTags.length > 3 && <span style={{ fontSize:11.5, color:PC.muted, padding:'4px 8px' }}>+{skillTags.length - 3}</span>}
              </div>
            </div>
          </div>

          {/* Completion bar */}
          <div style={{ position:'relative', margin:'24px 0 0', padding:'20px clamp(18px,4vw,32px) 26px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <PIcSpark s={12}/>
                <p style={{ fontSize:11.5, fontWeight:700, color: isComplete ? PC.emerald : PC.sub, margin:0 }}>{isComplete ? t('cd.profile_complete') : t('cd.complete_profile')}</p>
              </div>
              <span style={{ fontSize:13, fontWeight:900, color: isComplete ? PC.emerald : PC.accentMid, letterSpacing:'-0.02em' }}>{completion}%</span>
            </div>
            <div style={{ height:5, borderRadius:10, background:'rgba(255,255,255,0.07)', overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:'100%', width:`${completion}%`, borderRadius:10, background:progressColor, transition:'width .7s cubic-bezier(.4,0,.2,1)', boxShadow: isComplete ? '0 0 14px rgba(16,185,129,0.5)' : '0 0 14px rgba(124,108,246,0.45)' }}/>
            </div>
            {missing.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                {missing.map(item => (
                  <span key={item.label} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:PC.muted, background:'rgba(255,255,255,0.04)', border:`1px solid ${PC.border}`, borderRadius:20, padding:'3px 10px', fontWeight:500 }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.18)', display:'inline-block', flexShrink:0 }}/>{item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ CIN STATUS CARD ════ */}
        <div style={{ borderRadius:20, marginBottom:18, padding:'18px 22px', background:statusDim, border:`1px solid ${statusBord}`, display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:13, flexShrink:0, background:`${statusColor}18`, border:`1px solid ${statusColor}35`, display:'flex', alignItems:'center', justifyContent:'center', color:statusColor }}>
            <StatusIcon s={18}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:800, color:statusColor, margin:'0 0 3px' }}>{statusLabel}</p>
            <p style={{ fontSize:12.5, color:PC.sub, margin:0, lineHeight:1.6 }}>{statusDesc}</p>
          </div>
        </div>

        {/* ════ EDIT FORM CARD ════ */}
        <div style={{ borderRadius:26, overflow:'hidden', position:'relative', background:'linear-gradient(155deg,rgba(124,108,246,0.08) 0%,rgba(10,13,26,0.97) 38%,rgba(7,11,20,1) 100%)', border:'1px solid rgba(124,108,246,0.22)', boxShadow:'0 24px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
          <div style={{ height:2.5, background:'linear-gradient(90deg,#7c6cf6 0%,#a78bfa 55%,#6366f1 100%)' }}/>
          <div style={{ position:'absolute', width:360, height:230, top:-90, left:-70, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,108,246,0.1),transparent 70%)', pointerEvents:'none' }}/>

          {/* Card header */}
          <div style={{ padding:'22px 30px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:14, position:'relative' }}>
            <div style={{ width:44, height:44, borderRadius:15, flexShrink:0, background:'linear-gradient(135deg,rgba(124,108,246,0.3),rgba(124,108,246,0.08))', border:'1px solid rgba(124,108,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9b8cff', boxShadow:'0 4px 20px -6px rgba(124,108,246,0.55)' }}>
              <PIcEdit s={19}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15.5, fontWeight:800, margin:'0 0 2px', letterSpacing:'-0.025em', background:'linear-gradient(90deg,#f4f3fb 0%,#c4baff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{t('fd.profile_info')}</p>
              <p style={{ fontSize:12, color:'#62668a', margin:0 }}>{t('fd.visible_clients')}</p>
            </div>
            <span style={{ padding:'5px 13px', borderRadius:20, flexShrink:0, background:'rgba(124,108,246,0.1)', border:'1px solid rgba(124,108,246,0.22)', color:'rgba(155,140,255,0.85)', fontSize:10, fontWeight:800, letterSpacing:'0.09em', textTransform:'uppercase' }}>{t('cd.edit')}</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>

            {/* Titre professionnel */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <PFieldLabel>{t('fd.title')}</PFieldLabel>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:PC.muted, pointerEvents:'none', display:'flex' }}><PIcBriefcase s={15}/></div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={t('fd.title_placeholder')}
                  style={{ ...PINP, paddingLeft:42 }}
                  onFocus={focusOn_P} onBlur={focusOff_P}/>
              </div>
            </div>

            {/* Biographie */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <PFieldLabel>{t('fd.bio')}</PFieldLabel>
                <span style={{ fontSize:11, fontWeight:600, color: bio.length > 260 ? PC.amber : PC.muted, transition:'color .2s' }}>{bio.length}/300</span>
              </div>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={4}
                placeholder={t('fd.bio_placeholder')}
                style={{ ...PINP, resize:'none', lineHeight:1.7 }}
                onFocus={focusOn_P} onBlur={focusOff_P}/>
            </div>

            {/* Portfolio */}
            <div style={{ padding:'22px 30px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <PFieldLabel>{t('fd.portfolio_label')} <span style={{ color:'#f87171', marginLeft:4 }}>*</span></PFieldLabel>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:PC.muted, pointerEvents:'none', display:'flex' }}><PIcLink s={15}/></div>
                <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  style={{ ...PINP, paddingLeft:42, paddingRight: portfolioUrl && /^https?:\/\//.test(portfolioUrl) ? 50 : 16 }}
                  onFocus={focusOn_P} onBlur={focusOff_P}/>
                {portfolioUrl && /^https?:\/\//.test(portfolioUrl) && (
                  <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title={t('fd.portfolio_open')}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:'rgba(124,108,246,0.15)', border:'1px solid rgba(124,108,246,0.25)', color:'#9b8cff', textDecoration:'none', transition:'all .15s', flexShrink:0 }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(124,108,246,0.28)'; e.currentTarget.style.color='#c4baff'; e.currentTarget.style.borderColor='rgba(124,108,246,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(124,108,246,0.15)'; e.currentTarget.style.color='#9b8cff'; e.currentTarget.style.borderColor='rgba(124,108,246,0.25)'; }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
              </div>
              <p style={{ fontSize:11, color:PC.muted, marginTop:7 }}>{t('fd.portfolio_hint')}</p>
              {portfolioError && <p style={{ fontSize:12, color:'#f87171', marginTop:6, fontWeight:600 }}>{portfolioError}</p>}
            </div>

            {/* Footer */}
            <div style={{ padding:'20px 30px', background:'rgba(0,0,0,0.22)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
              {saved && profileLive && (
                <button onClick={() => navigate('/freelancers')}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', marginBottom:16, borderRadius:14, background:'linear-gradient(135deg,rgba(124,108,246,0.15),rgba(16,185,129,0.1))', border:'1px solid rgba(124,108,246,0.4)', cursor:'pointer', textAlign:'left', animation:'fdFadeIn .3s ease' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7c6cf6,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:800, color:'#b5aaff', margin:'0 0 2px' }}>🎉 Votre profil est en ligne sur Hire Freelancers !</p>
                    <p style={{ fontSize:11.5, color:'rgba(16,185,129,0.8)', margin:0 }}>Cliquez ici pour voir votre profil → redirection automatique dans 5s</p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
              {saved && !profileLive && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', marginBottom:16, borderRadius:14, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', animation:'fdFadeIn .3s ease' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:PC.emerald }}><PIcCheck s={15}/></div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:PC.emerald, margin:'0 0 1px' }}>{t('cd.profile_saved')}</p>
                    <p style={{ fontSize:11.5, color:'rgba(16,185,129,0.7)', margin:0 }}>{t('fd.changes_visible')}</p>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                <p style={{ fontSize:12, color:PC.muted, margin:0, lineHeight:1.6 }}>{t('cd.changes_immediate')}</p>
                <button onClick={handleSave} disabled={saving} className="fd-save-btn"
                  style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:10, padding:'14px 34px', borderRadius:16, background:'linear-gradient(135deg,#7c6cf6 0%,#5e4fd4 100%)', border:'1px solid rgba(155,140,255,0.2)', color:'#fff', fontWeight:800, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1, boxShadow:'0 8px 32px -6px rgba(124,108,246,0.65), inset 0 1px 0 rgba(255,255,255,0.16)', transition:'all .2s cubic-bezier(.4,0,.2,1)', letterSpacing:'0.01em', whiteSpace:'nowrap', position:'relative', overflow:'hidden' }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 16px 44px -6px rgba(124,108,246,0.78), inset 0 1px 0 rgba(255,255,255,0.2)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px -6px rgba(124,108,246,0.65), inset 0 1px 0 rgba(255,255,255,0.16)'; }}>
                  {saved ? <><PIcCheck s={15}/> {t('cd.saved')}</> : saving ? t('cd.saving') : <><PIcEdit s={14}/> {t('cd.save_profile')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fdBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(55px,-45px)scale(1.09)} 66%{transform:translate(-35px,32px)scale(0.94)} }
        @keyframes fdBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(-60px,42px)scale(1.06)} 70%{transform:translate(25px,-25px)scale(0.97)} }
        @keyframes fdBlob3 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(40px,40px)scale(1.11)} }
        @keyframes fdFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fdShimmer { 0%{transform:translateX(-140%)} 100%{transform:translateX(340%)} }
        .fd-save-btn::after { content:''; position:absolute; inset:0; width:45%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent); animation:fdShimmer 2.8s ease-in-out infinite; pointer-events:none; }
        input::placeholder, textarea::placeholder { color:#3a3d5c; }
      `}</style>
    </div>
  );
}

// ── TAB: Dashboard ────────────────────────────────────────────────────────────

function DashboardTab({ user, users, onNavigate, navigate }) {
  const { t } = useTranslation();
  const [missions, setMissions]    = useState([]);
  const [convos, setConvos]        = useState([]);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json()).catch(() => []),
    ]).then(([m, c]) => {
      if (Array.isArray(m)) setMissions(m);
      if (Array.isArray(c)) setConvos(c);
      setLoading(false);
    });
  }, [user?.email]);

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? t('dash.greet.morning') : hour < 18 ? t('dash.greet.afternoon') : t('dash.greet.evening');
  const firstName = user.name?.split(' ')[0] || 'Freelancer';

  const activeMissions    = missions.filter(p => p.status === 'in_progress').length;
  const completedMissions = missions.filter(p => p.status === 'completed').length;
  const unread            = convos.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;
  const recentMissions    = missions.slice(0, 5);
  const recentConvos      = convos.slice(0, 5);
  const clientContacts    = convos.filter(c => getUser(c.other_email)?.role === 'client').slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.photo
                ? <img src={cldImg(user.photo)} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                : <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(user.email)} flex items-center justify-center text-white text-lg font-bold shadow-md`}>{getInitials(user.name)}</div>
              }
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-0.5">{greeting}</p>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{firstName}</h1>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(124,108,246,0.12)', border: '1px solid rgba(124,108,246,0.25)', color: '#9b8cff' }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {t('dash.role.freelancer')}
            </span>
            <button onClick={() => onNavigate('find-projects')} className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/30">
              {t('fd.find_projects')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<><path d="M13 10V3L4 14h7v7l9-11h-7z"/></>}                                                                                   color="#7c6cf6" label={t('fd.stat.active_missions')}   value={activeMissions}    sub={t('fd.stat.of_total', { count: missions.length })}                  loading={loading} />
        <StatCard icon={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></>}                                        color="#10b981" label={t('fd.stat.completed_missions')} value={completedMissions} sub={completedMissions > 0 ? t('fd.well_done') : t('fd.none_f')} loading={loading} />
        <StatCard icon={<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>}                                               color="#3ec2e8" label={t('fd.stat.unread_messages')}   value={unread}            sub={unread > 0 ? t('fd.to_review') : t('fd.all_read')}           loading={loading} />
        <StatCard icon={<><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></>}                                             color="#f59e0b" label={t('fd.stat.total_earnings')}       value="—"                 sub={t('fd.coming_soon')}                               loading={false}   />
      </div>

      {/* Missions + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missions récentes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>} title={t('fd.recent_missions')} action={t('fd.see_all')} onAction={() => onNavigate('missions')} />
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            : recentMissions.length === 0
              ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>} text={t('fd.no_missions')} action={t('fd.find_projects')} onAction={() => onNavigate('find-projects')} />
              : (
                <div className="space-y-2">
                  {recentMissions.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : p.status === 'in_progress' ? 'rgba(62,194,232,0.1)' : 'rgba(124,108,246,0.1)', border: `1px solid ${p.status === 'completed' ? 'rgba(16,185,129,0.2)' : p.status === 'in_progress' ? 'rgba(62,194,232,0.2)' : 'rgba(124,108,246,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={p.status === 'completed' ? '#10b981' : p.status === 'in_progress' ? '#3ec2e8' : '#9b8cff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          {p.status === 'completed' ? <polyline points="20 6 9 17 4 12"/> : p.status === 'in_progress' ? <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.budget ? <span className="text-emerald-600 font-semibold">{p.budget}</span> : t('fd.no_budget')}
                          <span className="mx-1.5">·</span>
                          {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                  ))}
                </div>
              )
          }
        </div>

        {/* Messages récents */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} title={t('fd.recent_messages')} action={t('fd.open')} onAction={() => navigate('/messages')} />
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            : recentConvos.length === 0
              ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} text={t('fd.no_conversation')} />
              : (
                <div className="space-y-1">
                  {recentConvos.map(c => {
                    const other   = getUser(c.other_email);
                    const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
                    return (
                      <button key={c.other_email} onClick={() => navigate('/messages')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left">
                        <div className="relative shrink-0">
                          <Avi user={other || { email: c.other_email }} size="sm" />
                          {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{other?.name || c.other_email}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.last_message || t('fd.no_message')}</p>
                        </div>
                        {isUnread && <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                      </button>
                    );
                  })}
                </div>
              )
          }
        </div>
      </div>

      {/* Clients contactés */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} title={t('fd.contacted_clients')} action={t('fd.explore')} onAction={() => navigate('/clients')} />
        {loading
          ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mx-auto" />
              </div>
            ))}</div>
          : clientContacts.length === 0
            ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} text={t('fd.no_client_contacted')} action={t('fd.browse_clients')} onAction={() => navigate('/clients')} />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {clientContacts.map(c => {
                  const cl = getUser(c.other_email);
                  return (
                    <button key={c.other_email} onClick={() => navigate('/messages')}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-center group">
                      <div className="flex justify-center mb-2">
                        <Avi user={cl || { email: c.other_email }} size="md" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {cl?.name?.split(' ')[0] || c.other_email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{cl?.region || t('dash.role.client')}</p>
                      <span className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{t('fd.contact')}</span>
                    </button>
                  );
                })}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ── TAB: Trouver Projets ──────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS_FL = ['Débutant (0-1 an)', '1-2 ans', '3-5 ans', '5-10 ans', '10+ ans'];
const PERIOD_OPTIONS_FL     = ['De 1 à 3 jours', 'De 4 à 7 jours', 'De 1 à 2 semaines', 'De 2 à 4 semaines', 'De 1 à 3 mois', 'Plus de 3 mois'];
const EXPERIENCE_KEY_FL     = { 'Débutant (0-1 an)': 'fd.exp.beginner', '1-2 ans': 'fd.exp.1_2', '3-5 ans': 'fd.exp.3_5', '5-10 ans': 'fd.exp.5_10', '10+ ans': 'fd.exp.10plus' };
const STATUS_LABELS_FL      = {
  open:        { key: 'fd.status.open',        dot: '#10b981', cls: 'bg-emerald-500/10 text-emerald-400' },
  in_progress: { key: 'fd.status.in_progress', dot: '#3ec2e8', cls: 'bg-sky-500/10 text-sky-400' },
  completed:   { key: 'fd.status.completed',   dot: '#9b8cff', cls: 'bg-slate-700 text-slate-300' },
};

function FindProjectsTab({ user, navigate }) {
  const { t } = useTranslation();
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [posting,     setPosting]     = useState(false);
  const [postError,   setPostError]   = useState('');
  const [formErrors,  setFormErrors]  = useState({});
  const [form, setForm] = useState({
    title: '', description: '',
    keywords: ['', '', '', '', ''],
    experience: '',
  });

  const loadProjects = useCallback(() => {
    setLoading(true);
    fetch(`${API}/projects/${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setProjects(data); setLoading(false); });
  }, [user.email]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  async function handlePost(e) {
    e.preventDefault();
    const errors = {};
    if (!form.experience) errors.experience = true;
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setPosting(true); setPostError('');
    const keywords = form.keywords.filter(k => k.trim()).join(' ');
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail:  user.email,
          title:        form.title.trim(),
          description:  form.description.trim(),
          keywords,
          experience:   form.experience,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPostError(data.error || 'Erreur lors de la publication.'); }
      else {
        setForm({ title:'', description:'', keywords:['','','','',''], experience:'' });
        setFormErrors({});
        setShowForm(false);
        loadProjects();
      }
    } catch { setPostError('Erreur réseau. Réessayez.'); }
    setPosting(false);
  }

  async function handleDelete(projectId) {
    if (!window.confirm('Supprimer ce projet ?')) return;
    try {
      await fetch(`${API}/projects/${projectId}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, color: '#f4f3fb' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Projets
        </h2>
        <button
          onClick={() => { setShowForm(s => !s); setFormErrors({}); setPostError(''); }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
        >
          {showForm ? 'Annuler' : '+ Nouveau projet'}
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <form onSubmit={handlePost} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">

          {/* Titre */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Titre de l'offre <span className="text-rose-500">*</span></label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ex: Développement d'une application web React"
              className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description de vos services <span className="text-rose-500">*</span></label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez ce que vous proposez, vos méthodes de travail…"
              className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          {/* Compétences */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Compétences</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {form.keywords.map((kw, i) => (
                <div key={i}
                  style={{ width: `${Math.max(5.5, kw.length + 2)}ch` }}
                  className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-[width] duration-150">
                  <span className="pl-2.5 text-sm font-semibold text-slate-400">#</span>
                  <input maxLength={25} value={kw}
                    onChange={e => { const val = e.target.value.replace(/[#\s]/g, '').slice(0, 25); setForm(f => ({ ...f, keywords: f.keywords.map((k, idx) => idx === i ? val : k) })); }}
                    placeholder={`skill ${i + 1}`}
                    className="w-full min-w-0 px-1 py-2 text-sm font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Mon niveau d'expérience */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mon niveau d'expérience <span className="text-rose-500">*</span></label>
            <select value={form.experience}
              onChange={e => { setForm(f => ({ ...f, experience: e.target.value })); setFormErrors(fe => ({ ...fe, experience: false })); }}
              className={`mt-1 w-full px-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formErrors.experience ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-700'}`}>
              <option value="">Sélectionner...</option>
              {EXPERIENCE_OPTIONS_FL.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {formErrors.experience && <p className="mt-1 text-xs text-rose-500">Veuillez sélectionner votre niveau d'expérience.</p>}
          </div>

          {postError && <p className="text-red-500 text-sm text-center font-medium">{postError}</p>}

          <button type="submit" disabled={posting || !form.title.trim() || !form.description.trim() || !form.experience}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {posting ? 'Publication…' : 'Publier le projet'}
          </button>
        </form>
      )}

      {/* ── Projects list ── */}
      {loading ? (
        <div className="text-center py-8 text-sm text-slate-400">Chargement…</div>
      ) : projects.length === 0 ? (
        <div style={{ background: '#16142e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(124,108,246,0.1)', border: '1px solid rgba(124,108,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#f4f3fb', marginBottom: 6 }}>Aucune offre pour l'instant</p>
          <p style={{ fontSize: 12, color: '#62668a' }}>Publiez votre première offre de service en cliquant sur + Nouveau projet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => {
            const st       = STATUS_LABELS_FL[p.status] || STATUS_LABELS_FL.open;
            const keywords = p.keywords ? p.keywords.split(/\s+/).filter(Boolean) : [];
            const dateStr  = p.created_at ? (() => { const _d = new Date(p.created_at); return _d.toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) + ' , ' + _d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false }); })() : '';
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.dot + '18', color: st.dot }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                        {st.label}
                      </span>
                      {dateStr && <span className="text-[11px] text-slate-500">{dateStr}</span>}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{p.title}</h3>
                  </div>
                  <button onClick={() => handleDelete(p.id)}
                    className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {p.budget     && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{p.budget} TND</span>}
                  {p.experience && <span>Expérience : {p.experience}</span>}
                  {p.period     && <span>Période : {p.period}</span>}
                </div>

                {p.description && (
                  <p dir="auto" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{p.description}</p>
                )}

                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, i) => (
                      <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ── TAB: Mes Missions ─────────────────────────────────────────────────────────

const PROPOSAL_STATUS = {
  pending:  { label: 'En attente', dot: '#f59e0b', cls: 'bg-amber-500/10 text-amber-400' },
  accepted: { label: 'Acceptée',   dot: '#10b981', cls: 'bg-emerald-500/10 text-emerald-400' },
  rejected: { label: 'Refusée',    dot: '#f87171', cls: 'bg-rose-500/10 text-rose-400' },
};

function MissionsTab({ user, users, navigate }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  const fetchMissions = useCallback(() => {
    fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .catch(() => [])
      .then(data => { if (Array.isArray(data)) setMissions(data); setLoading(false); });
  }, [user.email]);

  const fetchProposals = useCallback(() => {
    fetch(`${API}/proposals/mine?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .catch(() => [])
      .then(data => { if (Array.isArray(data)) setProposals(data); setProposalsLoading(false); });
  }, [user.email]);

  useEffect(() => {
    fetchMissions();
    fetchProposals();
  }, [fetchMissions, fetchProposals]);

  // Refresh missions/proposals as soon as a client accepts/rejects one of our proposals
  useRealtimeChannel(user.email, {
    new_notification: useCallback((payload) => {
      if (payload?.kind?.startsWith('proposal_accepted') || payload?.kind?.startsWith('proposal_rejected')) {
        fetchMissions();
        fetchProposals();
      }
    }, [fetchMissions, fetchProposals]),
  });

  const getUser = email => (users ?? []).find(u => u.email?.toLowerCase() === email?.toLowerCase());

  const filtered = filter === 'all' ? missions : missions.filter(m => m.status === filter);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<><path d="M13 10V3L4 14h7v7l9-11h-7z"/></>}                                          color="#f59e0b" label="En cours"  value={missions.filter(m => m.status === 'in_progress').length} loading={loading} />
        <StatCard icon={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></>} color="#10b981" label="Terminées" value={missions.filter(m => m.status === 'completed').length}   loading={loading} />
        <StatCard icon={<><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></>} color="#7c6cf6" label="Total" value={missions.length} loading={loading} />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>} title="Mes Missions" />
          <div className="flex gap-1">
            {[['all','Tout'],['in_progress','En cours'],['completed','Terminé'],['open','Ouvert']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${filter === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>} text="Aucune mission dans cette catégorie" />
            : (
              <div className="space-y-3">
                {filtered.map(p => {
                  const client = getUser(p.client_email || p.user_email);
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : p.status === 'in_progress' ? 'rgba(62,194,232,0.1)' : 'rgba(124,108,246,0.1)', border: `1px solid ${p.status === 'completed' ? 'rgba(16,185,129,0.2)' : p.status === 'in_progress' ? 'rgba(62,194,232,0.2)' : 'rgba(124,108,246,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={p.status === 'completed' ? '#10b981' : p.status === 'in_progress' ? '#3ec2e8' : '#9b8cff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          {p.status === 'completed' ? <polyline points="20 6 9 17 4 12"/> : p.status === 'in_progress' ? <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {client?.name || (p.client_email || p.user_email)}
                          {p.budget && <><span className="mx-1.5">·</span><span className="text-emerald-600 font-semibold">{p.budget}</span></>}
                          <span className="mx-1.5">·</span>
                          {new Date(p.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusPill status={p.status} />
                        {p.chat_unlocked && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', whiteSpace: 'nowrap' }}>
                            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
                            Chat débloqué
                          </span>
                        )}
                        <button
                          onClick={() => navigate(`/messages?with=${encodeURIComponent(p.client_email || p.user_email)}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(124,108,246,0.1)', color: '#9b8cff', border: '1px solid rgba(124,108,246,0.2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(124,108,246,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(124,108,246,0.1)'; }}
                        >
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>

      {/* My Proposals */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} title="Mes Propositions" />
        {proposalsLoading
          ? [...Array(2)].map((_, i) => <SkeletonRow key={i} />)
          : proposals.length === 0
            ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} text="Aucune proposition envoyée" />
            : (
              <div className="space-y-3 mt-3">
                {proposals.map(pr => {
                  const st = PROPOSAL_STATUS[pr.status] || PROPOSAL_STATUS.pending;
                  return (
                    <div key={pr.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,108,246,0.1)', border: '1px solid rgba(124,108,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{pr.project_title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          <span className="text-emerald-600 font-semibold">{pr.price} TND</span>
                          <span className="mx-1.5">·</span>
                          {pr.delivery_days}j de livraison
                          <span className="mx-1.5">·</span>
                          {new Date(pr.created_at).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.dot + '18', color: st.dot, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ── TAB: Gains ────────────────────────────────────────────────────────────────

const PROJECT_PAY_STATUS = {
  en_attente: { label: 'Gain en attente', dot: '#f59e0b', desc: 'Le paiement de votre mission est en attente de confirmation.',    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  en_cours:   { label: 'Projet en cours', dot: '#3ec2e8', desc: 'Votre mission est en cours de traitement.',                       cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
  termine:    { label: 'Gain confirmé',   dot: '#10b981', desc: 'Paiement confirmé et ajouté à votre solde. Merci pour votre confiance.', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  recu:       { label: 'Payé',            dot: '#10b981', desc: 'Paiement reçu pour cette mission.',                                cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

const COURSE_PAY_STATUS = {
  en_attente: { label: 'En attente', dot: '#f59e0b', desc: 'Votre preuve de paiement est en cours de vérification par notre équipe.', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  en_cours:   { label: 'En cours',   dot: '#3ec2e8', desc: 'Votre paiement est en cours de traitement.',                              cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
  termine:    { label: 'Terminé',    dot: '#10b981', desc: 'Paiement confirmé et accès activé. Merci pour votre confiance.',          cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

function GainsTab({ user }) {
  const { resolveEmail } = useAuth();
  const [missions,           setMissions]           = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [wallet,             setWallet]             = useState(null);
  const [transactions,       setTransactions]       = useState([]);
  const [courseHistory,      setCourseHistory]      = useState([]);
  const [instructorGains,    setInstructorGains]    = useState([]);

  useEffect(() => {
    fetch(`${API}/projects/assigned/${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setMissions(data); setLoading(false); });

    fetch(`${API}/wallets/me?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => null)
      .then(data => setWallet(data));

    fetch(`${API}/wallets/transactions?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setTransactions(data); });

    fetch(`${API}/course-requests/mine?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setCourseHistory(data); });

    fetch(`${API}/course-requests/instructor-gains?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json()).catch(() => [])
      .then(data => { if (Array.isArray(data)) setInstructorGains(data); });
  }, [user.email]);

  const completed        = missions.filter(m => m.status === 'completed');
  const projectPayments  = missions.filter(m => m.status === 'in_progress' || m.status === 'completed');
  const incoming    = transactions.filter(t => t.direction === 'incoming');
  const totalEarned = incoming.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance     = Number(wallet?.balance || 0);
  const currency    = wallet?.currency || 'TND';

  return (
    <div className="space-y-6">

      {/* Comment ça marche */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Comment ça marche ?</p>
        <ol className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span> Terminez une mission ou vendez un cours pour générer un gain ou un paiement.</li>
          <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span> Une commission de 6% est déduite automatiquement par la plateforme.</li>
          <li className="flex gap-2"><span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span> Le reste est ajouté à votre solde et vous recevez un reçu PDF par email.</li>
        </ol>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Solde disponible', value: `${balance.toFixed(2)} ${currency}`,     svgPath: "M1 4h22v16H1z", svgPath2: "M1 10h22", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          { label: 'Transactions',     value: incoming.length,                          svgPath: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
          { label: 'Total gagné',      value: `${totalEarned.toFixed(2)} ${currency}`, svgPath: "M23 6l-9.5 9.5-5-5L1 18", svgPath2: "M17 6h6v6",          color: "#7c6cf6", bg: "rgba(124,108,246,0.08)" },
        ].map(item => (
          <div key={item.label} style={{ background: "#16142e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <path d={item.svgPath}/>{item.svgPath2 && <path d={item.svgPath2}/>}
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: item.color, letterSpacing: "-0.02em" }}>{item.value}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#62668a", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Missions terminées */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>} title="Missions terminées" />
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
          : (() => {
              const completedCoursesBuyer = courseHistory.filter(c => c.payment_status === 'termine');
              const allDone = [
                ...missions.filter(m => m.status === 'completed' || m.payment_status === 'termine').map(p => ({ _type: 'project', _key: `p-${p.id}`, title: p.title, amount: `${Number(p.amount || 0).toFixed(2)} TND`, date: p.accepted_at || p.created_at, tag: 'Projet', sub: `Client : ${resolveEmail(p.client_email)}` })),
                ...instructorGains.map(g => ({ _type: 'course_sale', _key: `s-${g.id}`, title: g.course_title, amount: `+${Number(g.instructor_net || 0).toFixed(2)} TND`, date: g.processed_at || g.requested_at, tag: 'Cours vendu', sub: `Acheteur : ${resolveEmail(g.buyer_email)}` })),
                ...completedCoursesBuyer.map(c => ({ _type: 'course_buy', _key: `b-${c.id}`, title: c.course_title, amount: `${Number(c.amount || 0).toFixed(2)} TND`, date: c.requested_at, tag: 'Cours acheté', sub: `Instructeur : ${resolveEmail(c.instructor_email)}` })),
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              return allDone.length === 0
                ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} text="Aucune mission terminée" />
                : (
                  <div className="space-y-3">
                    {allDone.map(item => (
                      <div key={item._key} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{item.tag}</span>
                            <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })} , {new Date(item.date).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{item.amount}</p>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            Terminé
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
            })()
        }
      </div>

      {/* Historique des gains ( PROJECTS ) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} title="Historique des gains — Projets" />
        {projectPayments.length === 0
          ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} text="Aucun gain pour l'instant" />
          : (
            <div className="space-y-3">
              {projectPayments.map(p => {
                const info = PROJECT_PAY_STATUS[p.payment_status] || PROJECT_PAY_STATUS.en_attente;
                const _d0 = new Date(p.accepted_at || p.created_at);
                const dateStr = _d0.toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) + ' , ' + _d0.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false });
                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Client : {resolveEmail(p.client_email)}</p>
                        <p className="text-xs text-slate-400">{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{Number(p.amount || 0).toFixed(2)} TND</p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: info.dot + '18', color: info.dot }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: info.dot, display: 'inline-block' }} />
                          {info.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{info.desc}</p>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {/* Historique des Gains ( COURSES ) — instructor earnings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} title="Historique des gains — Cours" />
        {instructorGains.length === 0
          ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} text="Aucun gain de cours" />
          : (
            <div className="space-y-3">
              {instructorGains.map(item => {
                const _d1 = new Date(item.processed_at || item.requested_at);
                const dateStr = _d1.toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) + ' , ' + _d1.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false });
                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.course_title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Acheteur : {resolveEmail(item.buyer_email)}</p>
                        <p className="text-xs text-slate-400">{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+{Number(item.instructor_net || 0).toFixed(2)} TND</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Brut : {Number(item.gross_amount || 0).toFixed(2)} TND</p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          Gain confirmé
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Commission plateforme (6%) : -{Number(item.commission || 0).toFixed(2)} TND</p>
                  </div>
                );
              })}
            </div>
          )
        }
        {instructorGains.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total gagné (cours)</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {instructorGains.reduce((s, i) => s + Number(i.instructor_net || 0), 0).toFixed(2)} TND
            </p>
          </div>
        )}
      </div>

      {/* Historique des paiements ( COURSES ) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} title="Historique des paiements — Cours" />
        {courseHistory.length === 0
          ? <Empty icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} text="Aucun paiement pour le moment" />
          : (
            <div className="space-y-3">
              {courseHistory.map(item => {
                const info = COURSE_PAY_STATUS[item.payment_status] || COURSE_PAY_STATUS.en_attente;
                const _d2 = new Date(item.requested_at);
                const dateStr = _d2.toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }) + ' , ' + _d2.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', hour12: false });
                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.course_title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Instructeur : {resolveEmail(item.instructor_email)}</p>
                        <p className="text-xs text-slate-400">{dateStr}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{Number(item.amount || 0).toFixed(2)} TND</p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: info.dot + '18', color: info.dot }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: info.dot, display: 'inline-block' }} />
                          {info.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{info.desc}</p>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── TAB: Mes Cours ────────────────────────────────────────────────────────────

const COURSE_CATEGORIES = ['Design','Development','Marketing','Business','Music','Photography','Finance','Health','Other'];

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function CoursesTab({ user }) {
  const navigate = useNavigate();
  const [courses,      setCourses]      = useState([]);
  const [earnings,     setEarnings]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showLessons,  setShowLessons]  = useState(null);
  const [showSession,  setShowSession]  = useState(null);
  const [lessons,      setLessons]      = useState([]);

  const [form, setForm] = useState({ title:'', description:'', thumbnail_url:'', category:'', full_price:'', first_lesson_free: false, _videoFile: null, _photoFile: null });
  const [courseNameEdit,  setCourseNameEdit]  = useState('');
  const [savingCourseName, setSavingCourseName] = useState(false);
  const [lForm,           setLForm]           = useState({ title:'', description:'', video_url:'', duration_min:'', price:'0', is_free_preview: false });
  const [lVideoUploading, setLVideoUploading] = useState(false);
  const [lVideoProgress,  setLVideoProgress]  = useState(0);
  const [lVideoName,      setLVideoName]      = useState('');
  const lVideoRef = useRef();
  const [sForm, setSForm] = useState({ title:'', description:'', scheduled_at:'', price:'0', join_url:'' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,   setCreateError]   = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [createdCourse, setCreatedCourse] = useState(null);
  const [discountCourseId, setDiscountCourseId] = useState(null);
  const [discountInput,    setDiscountInput]    = useState('');
  const [discountSaving,   setDiscountSaving]   = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([
        fetch(`${API}/courses/instructor/${user.email}`),
        fetch(`${API}/course-purchases/instructor/${user.email}/earnings`),
      ]);
      const [c, e] = await Promise.all([cRes.json(), eRes.json()]);
      if (Array.isArray(c)) setCourses(c);
      if (e && !e.error)    setEarnings(e);
    } catch {}
    setLoading(false);
  }, [user.email]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fetchLessons = useCallback(async (courseId) => {
    try {
      const r = await fetch(`${API}/lessons/course/${courseId}`);
      const d = await r.json();
      if (Array.isArray(d)) setLessons(d);
    } catch {}
  }, []);

  useEffect(() => {
    if (showLessons) {
      fetchLessons(showLessons);
      const c = courses.find(c => c.id === showLessons);
      if (c) setCourseNameEdit(c.title || '');
    }
  }, [showLessons, fetchLessons]);

  async function createCourse(e) {
    e.preventDefault();
    setCreateError('');

    // Validation
    if (!form.title.trim())                              { setCreateError('Le titre est obligatoire.'); return; }
    if (!form.description.trim())                        { setCreateError('La description est obligatoire.'); return; }
    if (!form._videoFile)                                { setCreateError('Veuillez choisir une vidéo MP4.'); return; }
    if (!form.category)                                  { setCreateError('Veuillez choisir une catégorie.'); return; }
    if (form.full_price === '' || Number(form.full_price) < 0) { setCreateError('Veuillez entrer un prix valide (0 = gratuit).'); return; }

    setCreateLoading(true);

    let thumbnail_url = '';
    if (form._photoFile) {
      try {
        const r = await uploadImage(form._photoFile, 'famamennou/thumbnails');
        thumbnail_url = r.secure_url;
      } catch { try { thumbnail_url = await imageToBase64(form._photoFile); } catch {} }
    }

    const payload = {
      title:            form.title.trim(),
      description:      form.description.trim(),
      thumbnail_url,
      category:         form.category,
      full_price:       Number(form.full_price),
      first_lesson_free: form.first_lesson_free,
      creator_email:    user.email,
    };

    try {
      const r = await fetch(`${API}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); } catch { d = {}; }
      if (!r.ok) {
        setCreateError(`Erreur ${r.status}: ${d.error || text.slice(0, 120)}`);
      } else if (d.id) {
        setCreatedCourse(d);
        setForm({ title:'', description:'', thumbnail_url:'', category:'', full_price:'', first_lesson_free: false, _videoFile: null, _photoFile: null });
        setCreateError('');
        fetchCourses();
      } else {
        setCreateError(d.error || d.message || 'Réponse inattendue. Réessayez.');
      }
    } catch (err) {
      setCreateError(`Erreur réseau: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  }

  async function togglePublish(course) {
    await fetch(`${API}/courses/${course.id}/publish`, { method: 'PATCH' });
    fetchCourses();
  }

  async function deleteCourse(id) {
    await fetch(`${API}/courses/${id}`, { method: 'DELETE' });
    setDeleteConfirmId(null);
    fetchCourses();
  }

  async function saveCourseName() {
    if (!courseNameEdit.trim() || !showLessons) return;
    setSavingCourseName(true);
    try {
      await fetch(`${API}/courses/${showLessons}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: courseNameEdit.trim() }),
      });
      fetchCourses();
    } catch {}
    setSavingCourseName(false);
  }

  async function saveDiscount(courseId) {
    const pct = Math.max(0, Math.min(100, Math.round(Number(discountInput))));
    setDiscountSaving(true);
    try {
      await fetch(`${API}/courses/${courseId}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_pct: pct, instructor_email: user.email }),
      });
      fetchCourses();
      setDiscountCourseId(null);
      setDiscountInput('');
    } catch {}
    setDiscountSaving(false);
  }

  async function addLesson(e) {
    e.preventDefault();
    if (lVideoUploading) return;
    if (!lForm.video_url) { alert('Veuillez uploader une vidéo MP4 d\'abord.'); return; }
    try {
      const r = await fetch(`${API}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lForm, course_id: showLessons, price: 0, duration_min: Number(lForm.duration_min) || 0 }),
      });
      const d = await r.json();
      if (d.id) {
        setLForm({ title:'', description:'', video_url:'', duration_min:'', price:'0', is_free_preview: false });
        setLVideoName(''); setLVideoProgress(0);
        fetchLessons(showLessons);
      }
    } catch {}
  }

  async function deleteLesson(id) {
    if (!window.confirm('Delete lesson?')) return;
    await fetch(`${API}/lessons/${id}`, { method: 'DELETE' });
    fetchLessons(showLessons);
  }

  async function createSession(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/live-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sForm, course_id: showSession, instructor_email: user.email, price: Number(sForm.price) }),
      });
      const d = await r.json();
      if (d.id) { setSForm({ title:'', description:'', scheduled_at:'', price:'0', join_url:'' }); setShowSession(null); }
    } catch {}
  }

  const totalStudents = earnings?.total_students ?? courses.reduce((a, c) => a + (c.total_students || 0), 0);
  const totalEarnings = earnings?.instructor_total ?? 0;
  const avgRating     = courses.length ? (courses.reduce((a,c) => a + Number(c.avg_rating || 0), 0) / courses.length).toFixed(1) : '—';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Stats — 4 cols always, compact on mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { d: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z', label:'Cours',     value: courses.length,                           gradient:'from-indigo-400 to-violet-500' },
          { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', label:'Étudiants', value: totalStudents,                              gradient:'from-sky-400 to-cyan-500' },
          { d: 'M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',                                            label:'Gains',     value:`${Number(totalEarnings).toFixed(0)} TND`, gradient:'from-emerald-400 to-teal-500' },
          { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',   label:'Note moy.', value: avgRating,                                  gradient:'from-amber-400 to-orange-500' },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} p-3 sm:p-4 text-white shadow-sm`}>
            <p className="text-lg sm:text-2xl font-extrabold leading-none truncate">{loading ? '…' : s.value}</p>
            <p className="text-[10px] sm:text-xs font-semibold opacity-80 mt-1 truncate">{s.label}</p>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 8, right: 8, opacity: 0.2 }}>
              {s.d.split(' M').filter(Boolean).map((seg, i) => <path key={i} d={(i > 0 ? 'M' : '') + seg} />)}
            </svg>
          </div>
        ))}
      </div>

      {/* Course list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#f4f3fb' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Mes Cours
          </h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nouveau
          </button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,108,246,0.1)', border: '1px solid rgba(124,108,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Aucun cours pour l'instant</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Créez votre premier cours et commencez à gagner</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              + Créer un cours
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map(course => (
              <div key={course.id} className="p-4 space-y-3">
                {/* Top row: thumbnail + info */}
                <div className="flex items-start gap-3">
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', background: 'rgba(124,108,246,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {course.thumbnail_url ? <img src={cldImg(course.thumbnail_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight break-words">{course.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {/* Status badge */}
                      {course.status === 'pending' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />En attente
                        </span>
                      )}
                      {course.status === 'approved' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Approuvé
                        </span>
                      )}
                      {course.status === 'rejected' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Refusé
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{course.total_students} étudiants</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#f59e0b' }}>
                        <svg width="9" height="9" fill="#f59e0b" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {Number(course.avg_rating).toFixed(1)}
                      </span>
                    </div>
                    {course.status === 'rejected' && course.admin_note && (
                      <p style={{ fontSize: 10, color: '#f87171', marginTop: 4, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                        <svg width="10" height="10" style={{ marginTop: 1, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        {course.admin_note}
                      </p>
                    )}
                    {course.status === 'pending' && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">En attente de validation par l'admin</p>
                    )}
                  </div>
                </div>
                {/* Discount badge */}
                {course.discount_pct > 0 && (
                  <div className="flex items-center gap-2">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      -{course.discount_pct}% de remise active
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prix final : {(Number(course.full_price) * (1 - course.discount_pct / 100)).toFixed(2)} TND
                    </span>
                  </div>
                )}

                {/* Inline discount form */}
                {discountCourseId === course.id && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-500 shrink-0">Remise (%)</span>
                    <input
                      type="number" min="0" max="100" step="1"
                      value={discountInput}
                      onChange={e => setDiscountInput(e.target.value)}
                      placeholder="ex: 20"
                      className="w-20 text-sm font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">%</span>
                    {discountInput !== '' && Number(discountInput) > 0 && Number(course.full_price) > 0 && (
                      <span className="text-xs text-emerald-500 font-semibold">
                        → {(Number(course.full_price) * (1 - Number(discountInput) / 100)).toFixed(2)} TND
                      </span>
                    )}
                    <button onClick={() => saveDiscount(course.id)} disabled={discountSaving}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50">
                      {discountSaving ? '…' : 'Appliquer'}
                    </button>
                    <button onClick={() => { setDiscountCourseId(null); setDiscountInput(''); }}
                      className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                      Annuler
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button onClick={() => setShowLessons(course.id)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-95 transition-all">
                    Leçons
                  </button>
                  <button onClick={() => setShowSession(course.id)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 active:scale-95 transition-all">
                    Live
                  </button>
                  <button onClick={() => navigate(`/courses/${course.id}`)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40 active:scale-95 transition-all">
                    Voir
                  </button>
                  <button
                    onClick={() => {
                      setDiscountCourseId(discountCourseId === course.id ? null : course.id);
                      setDiscountInput(course.discount_pct > 0 ? String(course.discount_pct) : '');
                    }}
                    className={`py-2 rounded-xl text-[10px] font-bold active:scale-95 transition-all ${
                      course.discount_pct > 0
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400'
                    }`}>
                    Remise
                  </button>
                  <button onClick={() => setDeleteConfirmId(course.id)}
                    className="py-2 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-200 active:scale-95 transition-all">
                    Supp.
                  </button>
                </div>
                <button onClick={() => togglePublish(course)}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                    course.is_published
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                  }`}>
                  {course.is_published
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Dépublier</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>Publier</span>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-full flex justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">Supprimer ce cours ?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cours et leçons supprimés définitivement.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
                Non, annuler
              </button>
              <button onClick={() => deleteCourse(deleteConfirmId)}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold active:scale-95 transition-all">
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: createdCourse ? 'rgba(16,185,129,0.12)' : 'rgba(124,108,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {createdCourse
                    ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                  }
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{createdCourse ? 'Cours créé' : 'Créer un cours'}</h3>
              </div>
              <button onClick={() => { setShowCreate(false); setCreatedCourse(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Success screen */}
            {createdCourse ? (
              <div className="p-5 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">Cours soumis avec succès !</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">En attente de validation par l'admin. Vous serez notifié.</p>
                </div>
                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{createdCourse.title}</p>
                  {createdCourse.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{createdCourse.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">{createdCourse.category}</span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      {Number(createdCourse.full_price) === 0 ? 'Gratuit' : `${Number(createdCourse.full_price).toFixed(2)} TND`}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>En attente</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full pb-2">
                  <button onClick={() => setCreatedCourse(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Créer un autre
                  </button>
                  <button onClick={() => { setShowCreate(false); setCreatedCourse(null); }} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                    Voir mes cours
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={createCourse} className="p-5 space-y-4 pb-6">
                {/* Titre */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Titre <span className="text-rose-500">*</span></label>
                  <input
                    value={form.title}
                    onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setCreateError(''); }}
                    placeholder="Ex: Apprendre React de zéro"
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${!form.title.trim() && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>

                {/* Photo du cours */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Photo du cours <span className="text-slate-400 font-normal">(optionnel)</span></label>
                  <label className={`relative flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-500 ${form._photoFile ? 'border-emerald-400 dark:border-emerald-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    {form._photoFile ? (
                      <>
                        <img src={URL.createObjectURL(form._photoFile)} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <span className="text-white text-xs font-bold">Changer la photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                        </svg>
                        <span className="text-xs font-semibold">Ajouter une photo</span>
                        <span className="text-[10px]">JPG, PNG — max 800px</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setForm(f => ({ ...f, _photoFile: file })); setCreateError(''); }
                      }}
                    />
                  </label>
                </div>

              {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Description <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setCreateError(''); }}
                    placeholder="Décrivez le contenu de votre cours…"
                    className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${!form.description.trim() && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>

                {/* Upload vidéo */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Upload Vidéo <span className="text-rose-500">*</span></label>
                  <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group ${!form._videoFile && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}>
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                      </svg>
                    </span>
                    <span className={`text-sm truncate flex-1 ${form._videoFile ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {form._videoFile ? `✓ ${form._videoFile.name}` : 'Choisir une vidéo MP4…'}
                    </span>
                    <input type="file" accept="video/mp4,video/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setForm(f => ({ ...f, thumbnail_url: URL.createObjectURL(file), _videoFile: file })); setCreateError(''); }
                      }}
                    />
                  </label>
                </div>

                {/* Catégorie + Prix — stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Catégorie <span className="text-rose-500">*</span></label>
                    <select
                      value={form.category}
                      onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setCreateError(''); }}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none ${!form.category && createError ? 'border-rose-400 text-slate-400 dark:text-slate-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}>
                      <option value="">Choisir une catégorie…</option>
                      {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Prix (TND) <span className="text-rose-500">*</span></label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.full_price}
                      onChange={e => { setForm(f => ({ ...f, full_price: e.target.value })); setCreateError(''); }}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${form.full_price === '' && createError ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                  </div>
                </div>


                {/* Error */}
                {createError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{createError}</p>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={createLoading} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {createLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {createLoading ? 'Création en cours…' : <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg> Créer le cours</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manage Lessons Modal */}
      {showLessons && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Lessons</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowLessons(null); navigate(`/courses/${showLessons}`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Voir le cours
                </button>
                <button onClick={() => setShowLessons(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Nom du cours */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom du cours
                </label>
                <div className="flex gap-2">
                  <input
                    value={courseNameEdit}
                    onChange={e => setCourseNameEdit(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCourseName(); }}
                    placeholder="Nom du cours…"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button onClick={saveCourseName} disabled={savingCourseName || !courseNameEdit.trim()}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all">
                    {savingCourseName ? '…' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
              {/* Existing lessons */}
              {lessons.length > 0 && (
                <div className="space-y-2">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{l.title}</p>
                        <p className="text-[10px] text-slate-400">{l.duration_min > 0 ? `${l.duration_min} min` : ''} {l.is_free_preview ? '· Free Preview' : ''} {Number(l.price) > 0 ? `· ${Number(l.price).toFixed(2)} TND` : ''}</p>
                      </div>
                      <button onClick={() => deleteLesson(l.id)} className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add lesson form */}
              <form onSubmit={addLesson} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Add New Lesson</p>
                {/* FREE / PAID toggle */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Lesson Type *</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setLForm(f => ({ ...f, is_free_preview: true, price: '0' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${lForm.is_free_preview ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300'}`}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>Free
                    </button>
                    <button type="button" onClick={() => setLForm(f => ({ ...f, is_free_preview: false, price: f.price === '0' ? '' : f.price }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${!lForm.is_free_preview ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-300'}`}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>Paid
                    </button>
                  </div>
                </div>
                <input required placeholder="Title" value={lForm.title} onChange={e => setLForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea rows={2} placeholder="Description (optional)" value={lForm.description} onChange={e => setLForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                {/* Video upload */}
                <input ref={lVideoRef} type="file" accept="video/mp4,video/*" className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setLVideoName(file.name); setLVideoUploading(true); setLVideoProgress(0);
                    try {
                      const res = await uploadVideo(file, 'famamennou/videos', p => setLVideoProgress(p));
                      setLForm(f => ({ ...f, video_url: res.secure_url }));
                    } catch (err) { alert('Upload échoué: ' + err.message); setLVideoName(''); }
                    finally { setLVideoUploading(false); }
                  }} />
                <button type="button" onClick={() => { if (!lVideoUploading) { warmVideoUpload(); lVideoRef.current?.click(); } }} disabled={lVideoUploading}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed text-sm transition-all ${lVideoUploading ? 'border-indigo-300 text-indigo-500' : lForm.video_url ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400'}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                  </svg>
                  {lVideoUploading ? `Envoi… ${lVideoProgress}%` : lForm.video_url ? `✓ ${lVideoName}` : 'Choisir un fichier MP4 *'}
                </button>
                {lVideoUploading && <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className="h-1.5 bg-indigo-500 rounded-full transition-all" style={{ width: `${lVideoProgress}%` }} /></div>}
                <input type="number" min="0" placeholder="Duration (min)" value={lForm.duration_min} onChange={e => setLForm(f => ({ ...f, duration_min: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                  Add Lesson
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Live Session Modal */}
      {showSession && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Live Session</h3>
              <button onClick={() => setShowSession(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={createSession} className="p-6 space-y-4">
              <input required placeholder="Session title" value={sForm.title} onChange={e => setSForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea rows={2} placeholder="Description (optional)" value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date & Time</label>
                  <input type="datetime-local" value={sForm.scheduled_at} onChange={e => setSForm(f => ({ ...f, scheduled_at: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Price (TND)</label>
                  <input type="number" min="0" step="0.01" value={sForm.price} onChange={e => setSForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <input placeholder="Join URL (Zoom, Meet, etc.)" value={sForm.join_url} onChange={e => setSForm(f => ({ ...f, join_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors">
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: Paramètres ───────────────────────────────────────────────────────────

function SettingsTab({ user, updateUser, onLogout }) {
  const { addNotification } = useAuth();
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk]       = useState(false);
  const [saving, setSaving]   = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError(''); setPwOk(false);

    if (!pwForm.current)            { setPwError('Le mot de passe actuel est requis.');       return; }
    if (pwForm.next.length < 6)     { setPwError('Le mot de passe doit avoir au moins 6 caractères.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return; }

    setSaving(true);
    try {
      /* Single call — verifies current password AND stores new hash atomically */
      const res  = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (data.error === 'wrongPassword') { setPwError('Mot de passe actuel incorrect.'); setSaving(false); return; }
      if (data.error) { setPwError('Erreur. Réessayez.'); setSaving(false); return; }

      /* Success */
      setPwOk(true);
      setPwForm({ current: '', next: '', confirm: '' });
      await addNotification({
        type:    'user',
        kind:    'password_changed',
        title:   '🔒 Mot de passe modifié',
        message: 'Votre mot de passe a été mis à jour avec succès.',
        email:   user.email,
        name:    user.name,
      });
    } catch { setPwError('Erreur réseau. Réessayez.'); }
    finally  { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} title="Informations du compte" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Nom</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Rôle</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Freelancer</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Statut CIN</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              user.cinStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : user.cinStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {user.cinStatus === 'approved'
                ? <span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>Verified</span>
                : user.cinStatus === 'pending'
                ? <span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Pending</span>
                : <span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Unverified</span>
              }
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <SectionHeader icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>} title="Changer le mot de passe" />
        <InputField label="Mot de passe actuel" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
        <InputField label="Nouveau mot de passe" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
        <InputField label="Confirmer le nouveau mot de passe" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
        {pwError && <p className="text-xs text-rose-500">{pwError}</p>}
        {pwOk && <p style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Mot de passe changé avec succès !</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
          {saving ? 'Changement…' : 'Changer le mot de passe'}
        </button>
      </form>

      <button onClick={onLogout}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px", borderRadius:14, background:"#ef4444", border:"none", cursor:"pointer", color:"#fff", fontSize:14, fontWeight:700, boxShadow:"0 6px 20px -4px rgba(239,68,68,0.45)", transition:"all 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.background="#dc2626"}
        onMouseLeave={e=>e.currentTarget.style.background="#ef4444"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign out
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FreelancerDashboard() {
  const { t } = useTranslation();
  const [searchParams]                   = useSearchParams();
  const navigate                         = useNavigate();
  const { user, updateUser, logout, users, fetchAccounts, fetchNotifications, getUserNotifications, markNotificationRead } = useAuth();
  const [activeTab, setActiveTab]        = useState(() => searchParams.get('tab') || 'profile');
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notifOpen, setNotifOpen]        = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== 'logout') setActiveTab(tab);
  }, [searchParams]);

  // Notifications are fetched on mount and kept fresh via Realtime (AuthContext)
  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabClick(tabId) {
    if (tabId === 'logout') { setLogoutConfirm(true); return; }
    setActiveTab(tabId);
  }

  if (!user) return null;

  const userNotifs  = getUserNotifications(user?.email);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  return (
    <div className="pt-16 min-h-screen" style={{ background: "#0a0817" }}>

      {/* ── Notification bell — fixed top-right ── */}
      <div className="fixed top-20 right-4 z-50">
        <div className="relative">
          <button onClick={() => setNotifOpen(p => !p)} className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <svg className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-2rem))] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                  {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">{unreadCount}</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotifs.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                      <p className="text-xs font-semibold">Aucune notification</p>
                    </div>
                  ) : userNotifs.map(n => (
                    <div key={n.id} onClick={() => { markNotificationRead(n.id); setNotifOpen(false); const kind = n.kind||''; let route = null; if (kind.startsWith('course_access:')) { const id=kind.split(':')[1]; route=id?`/courses/${id}`:'/courses'; } else if (kind.includes('_course_')) { const id=kind.split('_course_')[1]; route=id?`/courses/${id}`:'/courses'; } else if (/^course_(approved|rejected|created)_/.test(kind)) { const id=kind.split('_').pop(); route=id&&!isNaN(id)?`/courses/${id}`:'/courses'; } if(route) navigate(route); }} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors last:border-0 group ${n.read ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.kind.startsWith('course_access') ? 'rgba(16,185,129,0.12)' : n.kind.includes('approved') ? 'rgba(16,185,129,0.12)' : n.kind.includes('rejected') ? 'rgba(248,113,113,0.12)' : n.kind.includes('lesson') ? 'rgba(124,108,246,0.12)' : 'rgba(245,158,11,0.12)' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={n.kind.startsWith('course_access') ? '#10b981' : n.kind.includes('approved') ? '#10b981' : n.kind.includes('rejected') ? '#f87171' : n.kind.includes('lesson') ? '#9b8cff' : '#f59e0b'} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                          {n.kind.startsWith('course_access') ? <path d="M22 10v6M2 10l10-5 10 5-10 5z"/> : n.kind.includes('approved') ? <polyline points="20 6 9 17 4 12"/> : n.kind.includes('rejected') ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : n.kind.includes('lesson') ? <><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></> : <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold mb-0.5 ${n.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                        <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'profile'       && <ProfileTab       user={user} updateUser={updateUser} fetchAccounts={fetchAccounts} />}
        {activeTab === 'dashboard'     && <DashboardTab     user={user} users={users} onNavigate={setActiveTab} navigate={navigate} />}
        {activeTab === 'find-projects' && <FindProjectsTab  user={user} users={users} navigate={navigate} />}
        {activeTab === 'missions'      && <MissionsTab      user={user} users={users} navigate={navigate} />}
        {activeTab === 'gains'         && <GainsTab         user={user} />}
        {activeTab === 'courses'       && <CoursesTab       user={user} />}
        {activeTab === 'settings'      && <SettingsTab      user={user} updateUser={updateUser} onLogout={() => setLogoutConfirm(true)} />}
      </div>

      {/* ── Logout modal ── */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <button onClick={() => setLogoutConfirm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Se déconnecter ?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vous serez redirigé vers la page d'accueil.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
              <button onClick={() => { logout(); setLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-bold text-white transition-colors shadow-sm shadow-rose-500/30">Oui, déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
