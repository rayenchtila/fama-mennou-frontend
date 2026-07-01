import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

/* ────────────────────────────────────────────────────────────────
   Design tokens — CYAN / TEAL palette (distinct from FreelancersPage purple)
   ──────────────────────────────────────────────────────────────── */
const C = {
  accent:     '#0ea5e9',          // sky-500
  accentDim:  'rgba(14,165,233,0.12)',
  accentBord: 'rgba(14,165,233,0.3)',
  accentGlow: '0 6px 22px -4px rgba(14,165,233,0.45)',
  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,0.1)',
  emeraldBord:'rgba(16,185,129,0.25)',
  indigo:     '#6366f1',
  indigoDim:  'rgba(99,102,241,0.1)',
  amber:      '#f59e0b',
  amberDim:   'rgba(245,158,11,0.1)',
  amberBord:  'rgba(245,158,11,0.22)',
};

const PERIOD_OPTIONS = ['De 1 à 3 jours','De 4 à 7 jours','De 1 à 2 semaines','De 2 à 4 semaines','De 1 à 3 mois','Plus de 3 mois'];
const PERIOD_DAYS    = {'De 1 à 3 jours':2,'De 4 à 7 jours':5,'De 1 à 2 semaines':10,'De 2 à 4 semaines':21,'De 1 à 3 mois':60,'Plus de 3 mois':90};
const CATEGORIES = ['All', 'Technology', 'Design', 'Marketing', 'Writing', 'E-commerce', 'Finance'];

const CAT_SVG = {
  All: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Technology: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Design: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="13.5" cy="17.5" r="2.5"/><path d="M11 7.5 8.5 11M11 16.5 8.5 13"/></svg>,
  Marketing: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Writing: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  'E-commerce': <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Finance: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

const CAT_KEYS = {
  Technology:   ['react','node','javascript','python','java','flutter','mobile','backend','frontend','api','web','app','software','dev','code','tech','saas','angular','vue','typescript'],
  Design:       ['design','figma','ui','ux','graphic','logo','brand','visual','creative','illustration','photoshop','sketch'],
  Marketing:    ['marketing','seo','ads','social','content','growth','campaign','email','analytics','digital'],
  Writing:      ['writing','copywriting','blog','article','editorial','rédact','translation','video','motion','animation','montage','editing','cinema','vfx','premiere'],
  'E-commerce': ['ecommerce','e-commerce','shop','store','woocommerce','shopify','payment','cart','boutique','retail'],
  Finance:      ['finance','compta','accounting','audit','tax','budget','invoice','facture','invest','excel'],
};

const TINTS = [
  ['#0ea5e9','rgba(14,165,233,0.18)'],  ['#6366f1','rgba(99,102,241,0.18)'],
  ['#10b981','rgba(16,185,129,0.18)'],  ['#f59e0b','rgba(245,158,11,0.18)'],
  ['#ec4899','rgba(236,72,153,0.18)'],  ['#8b5cf6','rgba(139,92,246,0.18)'],
  ['#06b6d4','rgba(6,182,212,0.18)'],   ['#f97316','rgba(249,115,22,0.18)'],
];
const getTint     = s => TINTS[((s||'').charCodeAt(0)||0) % TINTS.length];
const getInitials = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');

function timeAgo(date) {
  if (!date) return '';
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d < 1)   return 'Today';
  if (d === 1) return '1d ago';
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.floor(d/7)}w ago`;
  return `${Math.floor(d/30)}mo ago`;
}

/* ── Icons ── */
const IcSearch   = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
const IcChev     = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcVerified = () => <svg width="9"  height="9"  viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/></svg>;
const IcPin      = () => <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcDollar   = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcClock    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IcLevel    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const IcUsers    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcMsg      = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcStar     = () => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const IcX        = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

/* ── Period Dropdown (custom, fully dark) ── */
function PeriodSelect({ value, onChange, maxDays }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} onBlur={()=>setTimeout(()=>setOpen(false),150)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.05)', border:`1px solid ${open?C.accentBord:'rgba(255,255,255,0.1)'}`, borderRadius:12, color:value?'#f4f3fb':'#6b7280', padding:'10px 13px', fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'border-color .2s', boxSizing:'border-box' }}>
        <span>{value || t('prp.period_select')}</span>
        <div style={{ transform:open?'rotate(180deg)':'none', transition:'transform .2s', color:'#6b7280', flexShrink:0, marginLeft:8 }}><IcChev /></div>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:600, background:'#111827', border:`1px solid ${C.accentBord}`, borderRadius:14, boxShadow:'0 16px 48px -8px rgba(0,0,0,0.85)', overflow:'hidden' }}>
          {PERIOD_OPTIONS.map(o => {
            const tooLong = maxDays !== undefined && (PERIOD_DAYS[o] || 0) > maxDays;
            return (
              <button key={o} type="button"
                onMouseDown={()=>{ if (!tooLong) { onChange(o); setOpen(false); } }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', textAlign:'left', padding:'11px 14px',
                  background: value===o ? C.accentDim : 'transparent',
                  color: tooLong ? '#374151' : value===o ? C.accent : '#c2c5dd',
                  border:'none', cursor: tooLong ? 'not-allowed' : 'pointer', fontSize:13,
                  fontFamily:'inherit', fontWeight: value===o ? 700 : 400,
                  opacity: tooLong ? 0.55 : 1, transition:'background .12s' }}
                onMouseEnter={e=>{if(!tooLong && value!==o) e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                onMouseLeave={e=>{if(!tooLong && value!==o) e.currentTarget.style.background='transparent';}}>
                <span>{o}</span>
                {tooLong && <span style={{ fontSize:10, fontWeight:700, color:'#f87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, padding:'1px 7px', flexShrink:0, marginLeft:8 }}>{t('prp.too_long')}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Apply Modal ── */
function ApplyModal({ project, user, onClose, onDone }) {
  const { t } = useTranslation();
  const [period,    setPeriod]    = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [letter,    setLetter]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');

  const clientMaxDays = PERIOD_DAYS[project.period]; // undefined if project has no period

  async function submit(e) {
    e.preventDefault();
    if (!period)    { setErr(t('prp.err_period')); return; }
    if (!portfolio) { setErr(t('prp.err_portfolio')); return; }
    if (clientMaxDays !== undefined && (PERIOD_DAYS[period] || 0) > clientMaxDays) {
      setErr(t('prp.err_period_too_long', { period: project.period }));
      return;
    }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, freelancerEmail: user.email, price: 1, deliveryDays: PERIOD_DAYS[period]||1, coverLetter: portfolio ? `[portfolio:${portfolio}]\n${letter}` : letter }),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setErr(d.error || t('prp.err_already_applied')); return; }
      onDone();
    } catch { setErr(t('clp.server_unreachable')); }
    finally { setLoading(false); }
  }

  const F = { width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#f4f3fb', padding:'10px 13px', fontSize:13, outline:'none', fontFamily:'inherit', transition:'border-color .2s' };
  const onFoc = e => { e.target.style.borderColor = C.accentBord; };
  const onBlr = e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(7px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:480, background:'#111827', border:`1px solid ${C.accentBord}`, borderRadius:24, padding:'28px 28px 24px', boxShadow:`0 28px 80px -12px rgba(0,0,0,0.8), ${C.accentGlow}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:C.accent, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{t('clp.apply_to_project')}</p>
            <h3 style={{ fontSize:17, fontWeight:900, color:'#f9f8ff', margin:0, lineHeight:1.3 }}>{project.title}</h3>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:6, cursor:'pointer', color:'#6b7280', display:'flex' }}><IcX /></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{t('prp.delivery_period')} <span style={{color:'#f87171'}}>*</span></p>
              {clientMaxDays !== undefined && (
                <span style={{ fontSize:10, fontWeight:700, color:'#f59e0b', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:6, padding:'2px 8px' }}>
                  {t('prp.max', { period: project.period })}
                </span>
              )}
            </div>
            <PeriodSelect value={period} onChange={setPeriod} maxDays={clientMaxDays}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.portfolio_link')} <span style={{color:'#f87171'}}>*</span></p>
            <input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="https://monportfolio.com" style={F} onFocus={onFoc} onBlur={onBlr}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.cover_letter')}</p>
            <textarea value={letter} onChange={e=>setLetter(e.target.value)} rows={4} placeholder={t('clp.cover_letter_placeholder')}
              style={{...F, resize:'none', lineHeight:1.6}} onFocus={onFoc} onBlur={onBlr}/>
          </div>
          {err && <p style={{ fontSize:12, color:'#f87171', margin:0 }}>{err}</p>}
          <button type="submit" disabled={loading}
            style={{ padding:'12px', borderRadius:13, background:`linear-gradient(135deg,${C.accent},#0284c7)`, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:C.accentGlow }}>
            {loading ? t('prp.sending') : t('clp.send_application_arrow')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Review Modal ── */
function ReviewModal({ client, user, onClose, onDone }) {
  const { t } = useTranslation();
  const [stars,   setStars]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!stars)          { setErr(t('clp.choose_rating')); return; }
    if (!comment.trim()) { setErr(t('clp.comment_required')); return; }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/client-reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: client.email, freelancerEmail: user.email, freelancerName: user.name, rating: stars, comment: comment.trim() }),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setErr(d.error || t('clp.error')); return; }
      onDone();
    } catch { setErr(t('clp.server_unreachable')); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(7px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:440, background:'#111827', border:`1px solid ${C.amberBord}`, borderRadius:24, padding:'28px', boxShadow:'0 28px 80px -12px rgba(0,0,0,0.8)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:C.amber, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{t('Leave a review')}</p>
            <h3 style={{ fontSize:16, fontWeight:900, color:'#f9f8ff', margin:0 }}>{client.name || client.email}</h3>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:6, cursor:'pointer', color:'#6b7280', display:'flex' }}><IcX /></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Stars */}
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>{t('clp.rating')}</p>
            <div style={{ display:'flex', gap:8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} type="button" onClick={()=>setStars(i)} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(0)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color: i<=(hovered||stars) ? C.amber : 'rgba(255,255,255,0.15)', transition:'color .15s', display:'flex', alignItems:'center' }}>
                  <svg width={26} height={26} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{t('clp.comment')}</p>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={4} placeholder={t('clp.review_placeholder')}
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#f4f3fb', padding:'10px 13px', fontSize:13, outline:'none', resize:'none', fontFamily:'inherit', lineHeight:1.6 }}
              onFocus={e=>{e.target.style.borderColor=C.amberBord;}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';}} />
          </div>
          {err && <p style={{ fontSize:12, color:'#f87171', margin:0 }}>{err}</p>}
          <button type="submit" disabled={loading}
            style={{ padding:'12px', borderRadius:13, background:`linear-gradient(135deg,${C.amber},#d97706)`, border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'0 6px 20px -4px rgba(245,158,11,0.4)' }}>
            {loading ? t('prp.sending') : t('clp.send_review_arrow')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Project Card ── */
function ProjectCard({ project, clientUser, proposalCount, user, saved, onSave, onApply, onReview, myReviews, hasApplied }) {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const [tintFg, tintBg] = getTint(project.client_email);
  const displayName = clientUser?.company || clientUser?.name || project.client_email?.split('@')[0] || '?';
  const initials    = getInitials(displayName);
  const photoUrl    = clientUser?.photo ? cldImg(clientUser.photo) : null;
  const isVerified  = clientUser?.cinStatus === 'approved' || !clientUser;
  const region      = clientUser?.region || '';
  const keywords    = project.keywords ? project.keywords.split(/\s+/).filter(Boolean) : [];
  const isOwn       = user?.email?.toLowerCase() === project.client_email?.toLowerCase();
  const isFreelancer= user?.role === 'freelancer';
  const avgRating   = myReviews.length ? myReviews.reduce((s,r)=>s+r.rating,0)/myReviews.length : 0;
  const alreadyReviewed = myReviews.some(r=>r.freelancer_email?.toLowerCase()===user?.email?.toLowerCase());
  const isTaken     = project.status && project.status !== 'open';

  return (
    <div className="cp-card" style={{ background:'rgba(255,255,255,0.024)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:'26px 30px', transition:'all .28s cubic-bezier(.4,0,.2,1)' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentBord;e.currentTarget.style.background='rgba(14,165,233,0.04)';e.currentTarget.style.boxShadow=`0 16px 48px -12px rgba(14,165,233,0.18), 0 0 0 1px ${C.accentBord}`;e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.024)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='translateY(0)';}}>

      {/* Top: avatar + client info + posted time */}
      <div className="cp-card-top" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} onClick={() => navigate(`/profile/${encodeURIComponent(project.client_email)}`)} style={{ width:44, height:44, borderRadius:14, objectFit:'cover', flexShrink:0, border:`1.5px solid ${tintFg}30`, cursor:'pointer' }} />
          ) : (
            <div onClick={() => navigate(`/profile/${encodeURIComponent(project.client_email)}`)} style={{ width:44, height:44, borderRadius:14, background:tintBg, color:tintFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0, border:`1.5px solid ${tintFg}30`, letterSpacing:'0.02em', cursor:'pointer' }}>
              {initials || '?'}
            </div>
          )}
          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
              <span onClick={() => navigate(`/profile/${encodeURIComponent(project.client_email)}`)} style={{ fontSize:14, fontWeight:800, color:'#f4f3fb', lineHeight:1.2, cursor:'pointer', transition:'color .15s' }} onMouseEnter={e=>e.currentTarget.style.color='#c4baff'} onMouseLeave={e=>e.currentTarget.style.color='#f4f3fb'}>{displayName}</span>
              {isVerified && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, border:`1px solid ${C.accentBord}`, padding:'2px 7px', borderRadius:20 }}>
                  <IcVerified /> {t('Verified')}
                </span>
              )}
              {region && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, color:'#6b7280', fontWeight:500 }}>
                  <IcPin /> {region}
                </span>
              )}
            </div>
            {avgRating > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <IcStar style={{ color:C.amber }} />
                <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize:11, color:'#6b7280' }}>({myReviews.length})</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:11, color:'#4b5563', fontWeight:500, whiteSpace:'nowrap' }}>{t('clp.posted', { time: timeAgo(project.created_at) })}</span>
          {isTaken && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:C.amber, background:C.amberDim, border:`1px solid ${C.amberBord}`, padding:'2px 8px', borderRadius:20 }}>
              <svg width={9} height={9} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {t('clp.taken')}
            </span>
          )}
          {isOwn && (
            <span style={{ fontSize:10, fontWeight:700, color:C.accent, background:C.accentDim, border:`1px solid ${C.accentBord}`, padding:'2px 8px', borderRadius:20 }}>{t('clp.your_project')}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize:20, fontWeight:900, color:'#f9f8ff', margin:'0 0 8px', letterSpacing:'-0.025em', lineHeight:1.2 }}>{project.title}</h3>

      {/* Description */}
      {project.description && (
        <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 16px', lineHeight:1.7 }}>
          {project.description.length > 130 ? project.description.slice(0,128)+'…' : project.description}
        </p>
      )}

      {/* Meta chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
        {project.budget && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:800, color:C.emerald, background:C.emeraldDim, border:`1px solid ${C.emeraldBord}`, borderRadius:9, padding:'4px 11px' }}>
            <span style={{fontSize:10,fontWeight:700,opacity:0.75,letterSpacing:'0.03em'}}>{t('prp.budget')}</span>{Number(project.budget).toLocaleString('fr-TN')} TND
          </span>
        )}
        {project.period && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#6b7280', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'4px 11px' }}>
            <span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.duration')}</span>{project.period}
          </span>
        )}
        {project.experience && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#6b7280', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'4px 11px' }}>
            <span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.experience')}</span>{project.experience}
          </span>
        )}
        {proposalCount > 0 && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#6b7280', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'4px 11px' }}>
            <span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.applications')}</span>{proposalCount}
          </span>
        )}
      </div>

      {/* Keyword tags */}
      {keywords.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:18 }}>
          {keywords.map((kw,i) => (
            <span key={i} style={{ fontSize:11.5, fontWeight:700, color:C.accent, background:C.accentDim, border:`1px solid ${C.accentBord}`, borderRadius:20, padding:'3px 11px' }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height:1, background:'rgba(255,255,255,0.055)', marginBottom:16 }} />

      {/* Actions */}
      <div className="cp-card-actions" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        {/* Left: review */}
        <div className="cp-btn-group" style={{ display:'flex', gap:8 }}>
          {isFreelancer && !isOwn && !alreadyReviewed && (
            <button onClick={()=>onReview(project)}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 15px', borderRadius:12, background:'none', border:`1px solid ${C.amberBord}`, color:C.amber, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=C.amberDim;}}
              onMouseLeave={e=>{e.currentTarget.style.background='none';}}>
              <svg width={12} height={12} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {t('clp.review')}
            </button>
          )}
        </div>

        {/* Right: Message + Apply */}
        <div className="cp-btn-group" style={{ display:'flex', gap:8 }}>
          {isFreelancer && !isOwn && (
            <button onClick={()=>navigate(`/messages?with=${encodeURIComponent(project.client_email)}`)}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 15px', borderRadius:12, background:'none', border:'1px solid rgba(255,255,255,0.12)', color:'#9ca3af', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentBord;e.currentTarget.style.color=C.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';e.currentTarget.style.color='#9ca3af';}}>
              <IcMsg /> {t('Message')}
            </button>
          )}
          {isFreelancer && !isOwn && !isTaken && (
            hasApplied ? (
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', color:'#10b981', fontSize:12, fontWeight:700 }}>
                <svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t('clp.application_sent')}
              </span>
            ) : (
              <button onClick={()=>onApply(project)}
                style={{ padding:'8px 22px', borderRadius:12, background:`linear-gradient(135deg,${C.accent},#0284c7)`, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:C.accentGlow, transition:'opacity .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.opacity='0.85';}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
                {t('prp.apply')}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function ClientsPage() {
  const { t } = useTranslation();
  const { user, users } = useAuth();
  const navigate = useNavigate();

  const [projects,        setProjects]        = useState([]);
  const [proposals,       setProposals]       = useState({});
  const [myApplications,  setMyApplications]  = useState(new Set());
  const [reviews,         setReviews]         = useState({});
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [category,        setCategory]        = useState('All');
  const [sortBy,          setSortBy]          = useState('newest');
  const [saved,           setSaved]           = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('fm_saved_clients')||'[]')); } catch { return new Set(); } });
  const [applyFor,        setApplyFor]        = useState(null);
  const [reviewFor,       setReviewFor]       = useState(null);
  const searchRef = useRef();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res   = await fetch(`${API}/projects/browse/open`);
      const rows  = await res.json();
      const open  = Array.isArray(rows) ? rows : [];
      setProjects(open);

      const propLists = await Promise.all(open.map(p =>
        fetch(`${API}/proposals/project/${p.id}`).then(r=>r.json()).catch(()=>[])
      ));
      const pmap    = {};
      const applied = new Set();
      open.forEach((p,i) => {
        const arr = Array.isArray(propLists[i]) ? propLists[i] : [];
        pmap[p.id] = arr.length;
        if (user?.role === 'freelancer' && user?.email) {
          if (arr.some(prop => prop.freelancer_email?.toLowerCase() === user.email.toLowerCase())) {
            applied.add(p.id);
          }
        }
      });
      setProposals(pmap);
      setMyApplications(applied);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  }, [user?.email, user?.role]);

  const loadReviews = useCallback(async () => {
    try {
      const clientEmails = [...new Set((Array.isArray(projects)?projects:[]).map(p=>p.client_email).filter(Boolean))];
      const results = await Promise.all(clientEmails.map(e =>
        fetch(`${API}/client-reviews/${encodeURIComponent(e)}`).then(r=>r.json()).catch(()=>[])
      ));
      const rmap = {};
      clientEmails.forEach((e,i) => { rmap[e.toLowerCase()] = Array.isArray(results[i]) ? results[i] : []; });
      setReviews(rmap);
    } catch {}
  }, [projects]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (projects.length) loadReviews(); }, [loadReviews, projects.length]);

  function getClient(email) {
    return (users||[]).find(u => u.email?.toLowerCase() === email?.toLowerCase());
  }

  function toggleSave(id) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('fm_saved_clients', JSON.stringify([...next]));
      return next;
    });
  }

  const filtered = projects.filter(p => {
    const q   = search.toLowerCase();
    const cl  = getClient(p.client_email);
    const hay = `${p.title||''} ${p.description||''} ${p.keywords||''} ${p.experience||''} ${cl?.name||''} ${cl?.company||''} ${cl?.region||''}`.toLowerCase();
    const okQ = !search || hay.includes(q);
    const okC = category === 'All' || (CAT_KEYS[category]||[]).some(k=>hay.includes(k));
    return okQ && okC;
  }).sort((a,b) => {
    if (sortBy === 'newest')    return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest')    return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'budget')    return Number(b.budget||0) - Number(a.budget||0);
    if (sortBy === 'proposals') return (proposals[b.id]||0) - (proposals[a.id]||0);
    return 0;
  });

  const totalClients = new Set(projects.map(p=>p.client_email?.toLowerCase()).filter(Boolean)).size;
  const totalRegions = new Set(projects.map(p => getClient(p.client_email)?.region).filter(Boolean)).size;

  return (
    <div style={{ minHeight:'100vh', background:'#070b14', fontFamily:"'Plus Jakarta Sans', 'Inter', sans-serif", paddingBottom:80, position:'relative' }}>

      {/* ══ ANIMATED BACKGROUND BLOBS ══ */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:750, height:750, borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.13) 0%, transparent 68%)', top:'-250px', left:'-160px', animation:'cpBlob1 20s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:580, height:580, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 68%)', top:'35%', right:'-180px', animation:'cpBlob2 24s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 68%)', bottom:'-60px', left:'28%', animation:'cpBlob3 28s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 68%)', top:'60%', left:'8%', animation:'cpBlob4 22s ease-in-out infinite reverse' }} />
      </div>

      <div style={{ position:'relative', zIndex:1 }}>

      {/* ── HERO HEADER ── */}
      <div style={{ background:'radial-gradient(ellipse 1100px 520px at 50% -10%, rgba(14,165,233,0.15), transparent 65%), radial-gradient(ellipse 700px 380px at 88% -6%, rgba(99,102,241,0.12), transparent 65%)', paddingBottom:56, borderBottom:'1px solid rgba(255,255,255,0.055)', textAlign:'center' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(88px,10vw,100px) clamp(16px,4vw,24px) 0' }}>

          {/* Headline */}
          <h1 style={{ fontSize:'clamp(32px,8vw,54px)', fontWeight:900, color:'#f4f3fb', margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.07 }}>
            {t('clp.hero_title_1')}{' '}
            <span style={{ background:`linear-gradient(120deg,#7dd3fc 0%,${C.accent} 42%,#0369a1 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {t('clp.hero_title_2')}
            </span>
          </h1>

          <p style={{ fontSize:'clamp(14px,2vw,16px)', color:'#6b7280', margin:'0 auto 38px', lineHeight:1.7, letterSpacing:'0.01em', maxWidth:480 }}>
            {t('clp.hero_subtitle')}
          </p>

          {/* Search bar */}
          <div className="fm-search-wrap" style={{ position:'relative', maxWidth:560, margin:'0 auto 44px' }}>
            <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#6b7280', pointerEvents:'none' }}>
              <IcSearch />
            </div>
            <input ref={searchRef} type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={t('Search clients...')}
              className="fm-search-input"
              style={{ width:'100%', boxSizing:'border-box', padding:'15px 130px 15px 48px', borderRadius:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#f4f3fb', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s, background .2s' }}
              onFocus={e=>{e.target.style.borderColor=C.accentBord; e.target.style.background=C.accentDim;}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)';}} />
            <button
              style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', padding:'9px 24px', borderRadius:12, background:`linear-gradient(135deg,${C.accent},#0284c7)`, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:C.accentGlow, transition:'opacity .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';}} onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
              {t('Search')}
            </button>
            {search && (
              <button onClick={()=>{setSearch('');searchRef.current?.focus();}}
                style={{ position:'absolute', right:110, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:4, display:'flex' }}>
                <IcX />
              </button>
            )}
          </div>

          {/* Stats row with separators */}
          <div className="cp-stats-row" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, flexWrap:'wrap' }}>
            {[
              { n: projects.filter(p=>p.status==='open').length, label:t('clp.stat_open_projects') },
              { n: totalClients, label:t('clp.stat_active_clients') },
              { n: totalRegions, label:t('Regions covered') },
              { n: Object.values(proposals).reduce((s,v)=>s+v,0), label:t('clp.stat_proposals_sent') },
            ].map((s,i) => (
              <div key={i} className="cp-stat-item" style={{ display:'flex', alignItems:'center' }}>
                {i > 0 && <span className="cp-stat-sep" style={{ width:1, height:36, background:'rgba(255,255,255,0.08)', margin:'0 clamp(12px,3vw,32px)' }} />}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:900, color:C.accent, lineHeight:1.1, letterSpacing:'-0.03em' }}>{s.n}</div>
                  <div style={{ fontSize:11, color:'#6b7280', fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ position:'sticky', top:64, zIndex:20, background:'rgba(7,11,20,0.94)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(255,255,255,0.07)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height:58, gap:0 }}>

          {/* Scrollable category pills */}
          <div style={{ flex:1, display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', minWidth:0, paddingRight:4 }}>
            {CATEGORIES.map(cat => {
              const active = category === cat;
              return (
                <button key={cat} onClick={()=>setCategory(cat)}
                  style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s',
                    background: active ? C.accentDim : 'transparent',
                    border:     active ? `1px solid ${C.accent}` : '1px solid rgba(255,255,255,0.09)',
                    color:      active ? C.accent : '#6b7280' }}
                  onMouseEnter={e=>{ if(!active){e.currentTarget.style.borderColor='rgba(255,255,255,0.18)';e.currentTarget.style.color='#9ca3af';}}}
                  onMouseLeave={e=>{ if(!active){e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';e.currentTarget.style.color='#6b7280';}}}>
                  <span style={{ display:'flex', alignItems:'center' }}>{CAT_SVG[cat]}</span>
                  {t(cat)}
                </button>
              );
            })}
          </div>

          {/* Separator + count + sort */}
          <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:14, borderLeft:'1px solid rgba(255,255,255,0.08)', paddingLeft:16, marginLeft:8 }}>
            <span style={{ fontSize:12, whiteSpace:'nowrap' }}>
              <strong style={{ color:C.accent, fontWeight:700 }}>{filtered.length}</strong>
              <span style={{ color:'#4b5563' }}> {t('clp.projects_count', { count: filtered.length })}</span>
            </span>
            <div style={{ position:'relative' }}>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ padding:'7px 30px 7px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#9ca3af', fontSize:12, outline:'none', cursor:'pointer', appearance:'none', fontFamily:'inherit' }}>
                <option value="newest">{t('Newest')}</option>
                <option value="oldest">{t('clp.sort_oldest')}</option>
                <option value="budget">{t('clp.sort_budget')}</option>
                <option value="proposals">{t('clp.sort_proposals')}</option>
              </select>
              <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#6b7280' }}><IcChev /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROJECT CARDS ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px clamp(16px,3vw,24px) 0', display:'flex', flexDirection:'column', gap:14 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'70px 0', color:'#4b5563', fontSize:14 }}>
            <div style={{ width:32, height:32, border:`2px solid ${C.accentBord}`, borderTopColor:C.accent, borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }} />
            {t('clp.loading_projects')}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.065)', borderRadius:22 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:C.accentDim, border:`1px solid ${C.accentBord}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <p style={{ fontSize:16, fontWeight:800, color:'#e5e7eb', margin:'0 0 7px' }}>{t('clp.no_projects_found')}</p>
            <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 18px' }}>{search ? t('clp.try_different_search') : t('clp.no_open_projects')}</p>
            {search && (
              <button onClick={()=>setSearch('')}
                style={{ fontSize:13, fontWeight:700, color:C.accent, background:C.accentDim, border:`1px solid ${C.accentBord}`, borderRadius:10, padding:'8px 18px', cursor:'pointer' }}>
                {t('Clear search')}
              </button>
            )}
          </div>
        ) : (
          filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              clientUser={getClient(p.client_email)}
              proposalCount={proposals[p.id] || 0}
              user={user}
              saved={saved.has(p.id)}
              onSave={toggleSave}
              onApply={setApplyFor}
              onReview={setReviewFor}
              myReviews={reviews[p.client_email?.toLowerCase()] || []}
              hasApplied={myApplications.has(p.id)}
            />
          ))
        )}

        {filtered.length > 0 && (
          <p style={{ textAlign:'center', fontSize:13, color:'#374151', padding:'12px 0 4px' }}>
            {t('clp.projects_shown', { count: filtered.length })}
          </p>
        )}
      </div>

      {/* ── Apply modal ── */}
      {applyFor && (
        <ApplyModal project={applyFor} user={user} onClose={()=>setApplyFor(null)}
          onDone={()=>{ setApplyFor(null); loadData(); }} />
      )}

      {/* ── Review modal ── */}
      {reviewFor && (
        <ReviewModal
          client={getClient(reviewFor.client_email) || { email:reviewFor.client_email, name:reviewFor.client_email }}
          user={user}
          onClose={()=>setReviewFor(null)}
          onDone={()=>{ setReviewFor(null); loadReviews(); }} />
      )}

      <style>{`
        @media (max-width:640px) {
          .cp-card { padding:16px 14px !important; border-radius:16px !important; }
          .cp-card-top { flex-wrap:wrap !important; gap:8px !important; }
          .cp-card-actions { gap:8px !important; }
          .cp-btn-group { flex:1 !important; }
          .cp-btn-group button,
          .cp-btn-group a,
          .cp-btn-group span { flex:1 !important; width:100% !important; justify-content:center !important; }
          .cp-stats-row { gap:6px 0 !important; }
          .cp-stat-item { min-width:50% !important; justify-content:center !important; padding:10px 0 !important; }
          .cp-stat-sep { display:none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cpPulse {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(14,165,233,0.5); }
          50%      { opacity:0.6; box-shadow:0 0 0 5px rgba(14,165,233,0); }
        }
        @keyframes cpBlob1 {
          0%,100% { transform:translate(0,0) scale(1); }
          33%      { transform:translate(55px,-45px) scale(1.07); }
          66%      { transform:translate(-35px,30px) scale(0.95); }
        }
        @keyframes cpBlob2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(-55px,40px) scale(1.05); }
          70%     { transform:translate(20px,-20px) scale(0.97); }
        }
        @keyframes cpBlob3 {
          0%,100% { transform:translate(0,0) scale(1); }
          50%     { transform:translate(35px,35px) scale(1.1); }
        }
        @keyframes cpBlob4 {
          0%,100% { transform:translate(0,0) scale(1); }
          45%     { transform:translate(-30px,-28px) scale(1.06); }
        }
      `}</style>
      </div>{/* end zIndex:1 wrapper */}
    </div>
  );
}
