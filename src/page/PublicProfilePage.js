import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

/* ── Design tokens ───────────────────────────────────────────────── */
const C = {
  bg:         '#070b14',
  card:       'rgba(255,255,255,0.028)',
  border:     'rgba(255,255,255,0.07)',
  accent:     '#7c6cf6',
  accentMid:  '#9b8cff',
  accentDim:  'rgba(124,108,246,0.1)',
  accentBord: 'rgba(124,108,246,0.22)',
  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,0.1)',
  emeraldBord:'rgba(16,185,129,0.28)',
  amber:      '#f59e0b',
  amberDim:   'rgba(245,158,11,0.1)',
  amberBord:  'rgba(245,158,11,0.25)',
  rose:       '#f87171',
  roseDim:    'rgba(248,113,113,0.1)',
  roseBord:   'rgba(248,113,113,0.28)',
  sky:        '#0ea5e9',
  skyDim:     'rgba(14,165,233,0.1)',
  skyBord:    'rgba(14,165,233,0.28)',
  text:       '#f4f3fb',
  sub:        '#a7abc8',
  muted:      '#62668a',
};

/* ── Helpers ─────────────────────────────────────────────────────── */
const getTint = s => {
  const p = ['#7c6cf6','#a855f7','#3b82f6','#0ea5e9','#10b981','#f59e0b','#f43f5e'];
  return p[((s||'').charCodeAt(0)||0) % p.length];
};
const getInitials = n => (n||'').trim().split(/\s+/).map(w => w[0]?.toUpperCase()||'').slice(0,2).join('');
const ensureHttp  = url => url && !/^https?:\/\//.test(url) ? `https://${url}` : url;
const parseSkills = raw =>
  Array.isArray(raw) ? raw.filter(Boolean)
  : typeof raw === 'string' && raw.trim()
    ? raw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

/* ── SVG icons ───────────────────────────────────────────────────── */
const IcBack   = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IcPin    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcShield = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcLink   = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const IcExt    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcUser   = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcMail   = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcStar   = ({ on }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={on?'#f59e0b':'none'} stroke={on?'#f59e0b':'#4a4e6e'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcChat   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcCalendar = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcBriefcase = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>;
const IcDot = ({ color }) => <span style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}`, display:'inline-block', flexShrink:0 }}/>;

/* ── Shared sub-components ───────────────────────────────────────── */

function SectionCard({ title, icon, children, accent = C.accent }) {
  return (
    <div style={{ borderRadius:22, padding:'22px 24px', marginBottom:14, background:C.card, border:`1px solid ${C.border}`, boxShadow:'0 4px 20px -8px rgba(0,0,0,0.4)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <span style={{ width:3, height:14, borderRadius:2, background:`linear-gradient(to bottom,${accent},${accent}88)`, display:'inline-block' }}/>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}{title}
        </p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign:'center', padding:'24px 0 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p style={{ fontSize:13, color:C.muted, margin:0, fontStyle:'italic' }}>{text}</p>
    </div>
  );
}

function StarRow({ value, count }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      {[1,2,3,4,5].map(i => <IcStar key={i} on={i <= Math.round(value)}/>)}
      <strong style={{ fontSize:13, color:C.text, marginLeft:2 }}>{value.toFixed(1)}</strong>
      <span style={{ fontSize:12, color:C.muted }}>({count})</span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — single unified profile layout for ALL users
   ════════════════════════════════════════════════════════════════════ */
export default function PublicProfilePage() {
  const { email: rawEmail } = useParams();
  const { users, user: currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reviews, setReviews]           = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const email   = decodeURIComponent(rawEmail || '');
  const list    = users || [];
  const profile = list.find(u => u.email?.toLowerCase() === email.toLowerCase());
  const tint    = getTint(email);

  /* fetch reviews for this profile — same for everyone */
  useEffect(() => {
    if (!email) return;
    setLoadingReviews(true);
    fetch(`${API}/reviews/${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [email]);

  /* ── Loading ── */
  if (!profile && list.length === 0) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${C.accent}`, borderTopColor:'transparent', animation:'ppSpin 0.8s linear infinite' }}/>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>{t('Loading…', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!profile) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:72, height:72, borderRadius:22, background:C.accentDim, border:`1px solid ${C.accentBord}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IcUser/>
        </div>
        <p style={{ fontSize:17, fontWeight:800, color:C.sub, margin:0 }}>{t('Profile not found', 'Profile not found')}</p>
        <button onClick={() => navigate(-1)} style={{ fontSize:13, color:C.accent, background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
          ← {t('Back', 'Back')}
        </button>
      </div>
    );
  }

  /* ── Derived values ── */
  const inits      = getInitials(profile.name || profile.email);
  const skills     = parseSkills(profile.skills);
  const avgRating  = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const memberYear = profile.registeredAt ? new Date(profile.registeredAt).getFullYear() : null;
  const isOwnProfile = currentUser?.email?.toLowerCase() === email.toLowerCase();

  const isApproved = profile.cinStatus === 'approved';
  const isPending  = profile.cinStatus === 'pending';
  const statusColor = isApproved ? C.emerald  : isPending ? C.amber : C.rose;
  const statusDim   = isApproved ? C.emeraldDim  : isPending ? C.amberDim : C.roseDim;
  const statusBord  = isApproved ? C.emeraldBord : isPending ? C.amberBord : C.roseBord;
  const statusLabel = isApproved ? t('Verified') : isPending ? t('Pending') : t('Unverified');

  const availColor = profile.availability === 'unavailable' ? C.rose
                   : profile.availability === 'busy'        ? C.amber : C.emerald;
  const availLabel = profile.availability === 'unavailable' ? t('Unavailable')
                   : profile.availability === 'busy'        ? t('Busy') : t('Available');

  const portfolioHref = ensureHttp(profile.portfolio_url);
  const roleLabel  = profile.role === 'freelancer' ? 'Freelancer'
                   : profile.role === 'client'     ? 'Client'
                   : profile.role || '—';
  const roleColor  = profile.role === 'freelancer' ? C.accent : C.sky;
  const roleDim    = profile.role === 'freelancer' ? C.accentDim : C.skyDim;
  const roleBord   = profile.role === 'freelancer' ? C.accentBord : C.skyBord;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", paddingBottom:80 }}>

      {/* ── Background blobs ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:`radial-gradient(circle,${tint}14,transparent 68%)`, top:'-200px', left:'-150px', animation:'ppBlob1 22s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.08),transparent 68%)', bottom:'0', right:'-100px', animation:'ppBlob2 28s ease-in-out infinite' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto', padding:'clamp(80px,10vw,90px) clamp(16px,4vw,24px) 0' }}>

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(-1)}
          style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:C.muted, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:12, padding:'8px 14px', cursor:'pointer', marginBottom:24, transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
          <IcBack/> {t('Back', 'Back')}
        </button>

        {/* ════════════════
            1. HERO CARD
            ════════════════ */}
        <div style={{
          borderRadius:28, overflow:'hidden', marginBottom:14, position:'relative',
          background:'linear-gradient(140deg,rgba(124,108,246,0.09) 0%,rgba(10,13,26,0.98) 55%)',
          border:'1px solid rgba(124,108,246,0.2)',
          boxShadow:'0 40px 100px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {/* Decorative overlays */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 500px 300px at -5% -20%,${tint}1e,transparent 65%)` }}/>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)',
            backgroundSize:'26px 26px',
            WebkitMaskImage:'radial-gradient(ellipse 60% 50% at 50% 0%,black,transparent)',
            maskImage:'radial-gradient(ellipse 60% 50% at 50% 0%,black,transparent)' }}/>

          <div style={{ position:'relative', padding:'32px 32px 28px' }}>

            {/* Role + Status chips — identical structure for all users */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, background:roleDim, border:`1px solid ${roleBord}`, color:roleColor, fontSize:10.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                <IcUser/> {roleLabel}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:20, background:statusDim, border:`1px solid ${statusBord}`, color:statusColor, fontSize:10.5, fontWeight:700 }}>
                <IcShield/> {statusLabel}
              </span>
              {profile.availability && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:20, background:`${availColor}14`, border:`1px solid ${availColor}44`, color:availColor, fontSize:10.5, fontWeight:700 }}>
                  <IcDot color={availColor}/> {availLabel}
                </span>
              )}
            </div>

            {/* Avatar + identity — identical for all users */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:22, marginBottom:22 }}>
              <div style={{ width:96, height:96, borderRadius:24, overflow:'hidden', flexShrink:0, background:`linear-gradient(135deg,${tint}30,${tint}10)`, color:tint, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:30, border:`2px solid ${tint}45`, boxShadow:`0 0 0 5px ${tint}12, 0 20px 48px -12px ${tint}45` }}>
                {profile.photo
                  ? <img src={profile.photo.startsWith('data:') ? profile.photo : cldImg(profile.photo)} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }}/>
                  : inits}
              </div>
              <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
                <h1 style={{ fontSize:26, fontWeight:900, color:C.text, margin:'0 0 6px', letterSpacing:'-0.03em', lineHeight:1.15 }}>
                  {profile.name || email.split('@')[0]}
                </h1>
                {profile.title && (
                  <p style={{ fontSize:12.5, fontWeight:700, color:C.accentMid, margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {profile.title}
                  </p>
                )}
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:13, color:C.muted, fontWeight:500 }}>
                    <IcMail/> {profile.email}
                  </span>
                  {profile.region && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:13, color:C.sub, fontWeight:600, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px' }}>
                      <IcPin/> {profile.region}
                    </span>
                  )}
                  {memberYear && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:13, color:C.muted, fontWeight:500 }}>
                      <IcCalendar/> {t('Since {{year}}', { year: memberYear })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio preview inside hero — always shown (empty state if none) */}
            <div style={{ padding:'18px 0 0', borderTop:`1px solid rgba(255,255,255,0.06)` }}>
              {profile.bio
                ? <p style={{ fontSize:14, color:C.sub, lineHeight:1.75, margin:0 }}>{profile.bio}</p>
                : <p style={{ fontSize:14, color:C.muted, margin:0, fontStyle:'italic' }}>{t('No bio added yet.', 'No bio added yet.')}</p>
              }
            </div>
          </div>
        </div>

        {/* ════════════════
            2. STATS ROW — always 4 identical stat blocks
            ════════════════ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label: t('Skills', 'Skills'),   value: skills.length,         color: C.accentMid },
            { label: t('Reviews', 'Reviews'),  value: reviews.length,        color: C.emerald   },
            { label: t('Rating', 'Rating'),    value: reviews.length ? avgRating.toFixed(1) : '—', color: C.amber },
            { label: t('Member since', 'Member since'), value: memberYear || '—', color: C.sky },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ borderRadius:18, padding:'16px 14px', background:C.card, border:`1px solid ${C.border}`, textAlign:'center', boxShadow:'0 4px 20px -8px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize:22, fontWeight:900, color, lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:5 }}>{value}</div>
              <div style={{ fontSize:10.5, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ════════════════
            3. SKILLS SECTION — always rendered, empty state when no data
            ════════════════ */}
        <SectionCard title={t('Skills & Expertise', 'Skills & Expertise')} accent={C.accentMid}>
          {skills.length > 0
            ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ display:'inline-flex', alignItems:'center', fontSize:12.5, fontWeight:700, color:C.accentMid, background:C.accentDim, border:'1px solid rgba(124,108,246,0.2)', borderRadius:20, padding:'5px 13px' }}>
                    {s}
                  </span>
                ))}
              </div>
            )
            : <EmptyState text={t('No skills added yet.', 'No skills added yet.')}/>
          }
        </SectionCard>

        {/* ════════════════
            4. SERVICES & RATES — always rendered, empty state when no data
            ════════════════ */}
        <SectionCard title={t('Portfolio', 'Portfolio')} accent={C.emerald}>
          {portfolioHref
            ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {portfolioHref && (
                  <a href={portfolioHref} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:14, textDecoration:'none', background:C.emeraldDim, border:`1px solid ${C.emeraldBord}`, transition:'all .18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.16)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.emeraldDim; e.currentTarget.style.borderColor = C.emeraldBord; }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:'rgba(16,185,129,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:C.emerald, flexShrink:0 }}>
                      <IcLink/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:10, fontWeight:700, color:'rgba(16,185,129,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 2px' }}>Portfolio</p>
                      <p style={{ fontSize:13, fontWeight:700, color:C.emerald, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{portfolioHref}</p>
                    </div>
                    <div style={{ color:C.emerald, opacity:0.7, flexShrink:0 }}><IcExt/></div>
                  </a>
                )}
              </div>
            )
            : <EmptyState text={t('No portfolio link added yet.', 'No portfolio link added yet.')}/>
          }
        </SectionCard>

        {/* ════════════════
            5. REVIEWS SECTION — always rendered, empty state when no data
            ════════════════ */}
        <SectionCard title={t('Reviews & Ratings', 'Reviews & Ratings')} accent={C.amber}>
          {loadingReviews
            ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'16px 0' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${C.amber}`, borderTopColor:'transparent', animation:'ppSpin 0.8s linear infinite' }}/>
              </div>
            )
            : reviews.length > 0
              ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Rating summary */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:4 }}>
                    <span style={{ fontSize:32, fontWeight:900, color:C.amber, lineHeight:1 }}>{avgRating.toFixed(1)}</span>
                    <div>
                      <StarRow value={avgRating} count={reviews.length}/>
                      <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>{reviews.length} {t('review', 'review')}{reviews.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {/* Individual reviews */}
                  {reviews.map((r, i) => (
                    <div key={i} style={{ padding:'14px 16px', borderRadius:14, background:C.card, border:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{r.clientName || r.client_name}</span>
                        <span style={{ display:'inline-flex', gap:2 }}>
                          {[1,2,3,4,5].map(n => <IcStar key={n} on={n <= r.rating}/>)}
                        </span>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize:13, color:C.sub, margin:0, lineHeight:1.6 }}>{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
              : <EmptyState text={t('No reviews yet.', 'No reviews yet.')}/>
          }
        </SectionCard>

        {/* ════════════════
            6. CONTACT SECTION — always shown (different state for own profile vs others)
            ════════════════ */}
        <div style={{ marginTop:6 }}>
          {isOwnProfile
            ? (
              <div style={{ borderRadius:18, padding:'18px 22px', background:C.accentDim, border:`1px solid ${C.accentBord}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:'0 0 2px' }}>{t('This is your profile', 'This is your profile')}</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>{t('Update your info from the dashboard', 'Update your info from the dashboard')}</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard?tab=profile')}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${C.accent},#6254d4)`, border:'none', borderRadius:12, padding:'10px 20px', cursor:'pointer', boxShadow:'0 4px 16px -4px rgba(124,108,246,0.5)', flexShrink:0 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {t('Edit profile', 'Edit profile')}
                </button>
              </div>
            )
            : currentUser
              ? (
                <button
                  onClick={() => navigate(`/messages?with=${encodeURIComponent(email)}`)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:9, padding:'15px 0', borderRadius:18, background:`linear-gradient(135deg,${C.accent},#6254d4)`, border:'none', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px -8px rgba(124,108,246,0.55)', transition:'opacity .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                  <IcChat/> {t('Send a message', 'Send a message')}
                </button>
              )
              : null
          }
        </div>

      </div>

      <style>{`
        @keyframes ppBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(50px,-40px)scale(1.08)} }
        @keyframes ppBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-40px,30px)scale(1.06)} }
        @keyframes ppSpin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
