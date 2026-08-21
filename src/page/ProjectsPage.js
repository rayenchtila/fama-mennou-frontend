import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { cldImg } from '../utils/cloudinary';
import SEOHead from '../components/Seohead';
import usePendingClientReadOnly from '../hooks/usePendingClientReadOnly';
import PendingClientBanner from '../components/PendingClientBanner';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const CATEGORIES    = ['All','Technology','Design','Marketing','E-commerce','Education','Finance'];
const CAT_KEYS = {
  Technology:  ['react','node','javascript','python','java','code','dev','flutter','mobile','backend','frontend','api','tech','web','app','software'],
  Design:      ['design','figma','ui','ux','graphic','logo','brand','visual','creative','illustration'],
  Marketing:   ['marketing','seo','ads','social','content','growth','campaign','email','analytics','digital'],
  'E-commerce':['ecommerce','e-commerce','shop','store','woocommerce','shopify','payment','stripe','cart'],
  Education:   ['education','cours','course','formation','training','e-learning','mooc','pedagogie'],
  Finance:     ['finance','compta','accounting','audit','tax','budget','excel','invoice','facture'],
};
const TINTS = [
  ['var(--fm-primary)','rgba(124,108,246,0.18)'],['#a855f7','rgba(168,85,247,0.18)'],
  ['#3b82f6','rgba(59,130,246,0.18)'], ['var(--fm-info)','rgba(14,165,233,0.18)'],
  ['var(--fm-success)','rgba(16,185,129,0.18)'], ['var(--fm-warning)','rgba(245,158,11,0.18)'],
  ['#f43f5e','rgba(244,63,94,0.18)'],  ['#06b6d4','rgba(6,182,212,0.18)'],
];
const STATUS_MAP = {
  open:        { label:'Ouvert',   color:'var(--fm-success)', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.28)'  },
  in_progress: { label:'En cours', color:'var(--fm-info)', bg:'rgba(14,165,233,0.1)',  border:'rgba(14,165,233,0.28)'  },
  completed:   { label:'Terminé',  color:'var(--fm-primary)', bg:'rgba(124,108,246,0.1)', border:'rgba(124,108,246,0.28)' },
};
const EXPERIENCE_OPTIONS = ['Débutant (0-1 an)','1-2 ans','3-5 ans','5-10 ans','10+ ans'];
const PERIOD_OPTIONS     = ['De 1 à 3 jours','De 4 à 7 jours','De 1 à 2 semaines','De 2 à 4 semaines','De 1 à 3 mois','Plus de 3 mois'];
const PERIOD_DAYS        = {'De 1 à 3 jours':2,'De 4 à 7 jours':5,'De 1 à 2 semaines':10,'De 2 à 4 semaines':21,'De 1 à 3 mois':60,'Plus de 3 mois':90};

const getTint     = s => TINTS[((s||'').charCodeAt(0)||0) % TINTS.length];
const getInitials = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 60)  return `${mins}m`;
  const h = Math.floor(mins/60);
  if (h < 24)     return `${h}h`;
  const d = Math.floor(h/24);
  if (d < 7)      return `${d}j`;
  if (d < 30)     return `${Math.floor(d/7)}sem`;
  return `${Math.floor(d/30)}mois`;
}

/* ── SVG Icons (all inline SVG, no emoji) ── */
const IcSearch    = ({s=15}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
const IcChev      = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcChevRight = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const IcVerified  = ({s=10}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/></svg>;
const IcPin       = ({s=11}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcClock     = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IcLevel     = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 12-4-4v3H3v2h15v3z"/></svg>;
const IcUsers     = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcDollar    = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcX         = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcPlus      = ({s=14}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcCheck     = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcTrash     = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcEdit      = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcLock      = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcFolder    = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IcGlobe     = ({s=16}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcLink      = ({s=11}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcStar      = ({s=12,filled=false}) => filled
  ? <svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
  : <svg width={s} height={s} fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;

/* ── Shared input styles ── */
const MI = { background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:12, color:'var(--fm-text-2)', padding:'10px 12px', fontSize:13, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' };
const onFoc = e => { e.target.style.borderColor='rgba(124,108,246,0.5)'; };
const onBlr = e => { e.target.style.borderColor='var(--fm-border)'; };

/* ── Period Dropdown (custom, fully dark) ── */
function PeriodSelect({ value, onChange, maxDays }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)} onBlur={()=>setTimeout(()=>setOpen(false),150)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--fm-border-soft)', border:`1px solid ${open?'rgba(124,108,246,0.5)':'var(--fm-border)'}`, borderRadius:12, color:value?'var(--fm-text-2)':'var(--fm-text-7)', padding:'10px 13px', fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'border-color .2s', boxSizing:'border-box' }}>
        <span>{value || t('prp.period_select')}</span>
        <div style={{ transform:open?'rotate(180deg)':'none', transition:'transform .2s', color:'var(--fm-text-7)', flexShrink:0, marginLeft:8 }}><IcChev s={13}/></div>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:600, background:'var(--fm-surface)', border:'1px solid rgba(124,108,246,0.3)', borderRadius:14, boxShadow:'0 16px 48px -8px var(--fm-overlay)', overflow:'hidden' }}>
          {PERIOD_OPTIONS.map(o => {
            const tooLong = maxDays !== undefined && (PERIOD_DAYS[o] || 0) > maxDays;
            return (
              <button key={o} type="button"
                onMouseDown={()=>{ if (!tooLong) { onChange(o); setOpen(false); } }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', textAlign:'left', padding:'11px 14px',
                  background: value===o ? 'rgba(124,108,246,0.12)' : 'transparent',
                  color: tooLong ? 'var(--fm-text-7)' : value===o ? 'var(--fm-primary-light)' : 'var(--fm-text-4)',
                  border:'none', cursor: tooLong ? 'not-allowed' : 'pointer', fontSize:13,
                  fontFamily:'inherit', fontWeight: value===o ? 700 : 400,
                  opacity: tooLong ? 0.55 : 1, transition:'background .12s' }}
                onMouseEnter={e=>{if(!tooLong && value!==o) e.currentTarget.style.background='var(--fm-border-soft)';}}
                onMouseLeave={e=>{if(!tooLong && value!==o) e.currentTarget.style.background='transparent';}}>
                <span>{o}</span>
                {tooLong && <span style={{ fontSize:10, fontWeight:700, color:'var(--fm-danger)', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, padding:'1px 7px', flexShrink:0, marginLeft:8 }}>{t('prp.too_long')}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPLY MODAL — freelancer applies to a project
   ══════════════════════════════════════════════════════════════ */
function ApplyModal({ project, user, onClose, onDone }) {
  const { t } = useTranslation();
  const [period,    setPeriod]    = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [letter,    setLetter]    = useState('');
  const [sending,   setSending]   = useState(false);
  const [err,       setErr]       = useState('');

  useBodyScrollLock(true); // this component only exists while the modal is open

  const clientMaxDays = PERIOD_DAYS[project.period]; // undefined if project has no period set

  async function submit(e) {
    e.preventDefault();
    if (!period)    { setErr(t('prp.err_period')); return; }
    if (!portfolio) { setErr(t('prp.err_portfolio')); return; }
    if (clientMaxDays !== undefined && (PERIOD_DAYS[period] || 0) > clientMaxDays) {
      setErr(t('prp.err_period_too_long', { period: project.period }));
      return;
    }
    setSending(true); setErr('');
    try {
      const res = await fetch(`${API}/proposals`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ projectId:project.id, freelancerEmail:user.email, price:1, deliveryDays:PERIOD_DAYS[period]||1, coverLetter:portfolio ? `[portfolio:${portfolio}]\n${letter}` : letter }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error||t('prp.err_already_applied')); return; }
      onDone();
    } catch { setErr(t('prp.err_server_unreachable')); }
    finally { setSending(false); }
  }

  return (
    <div className="fm-backdrop-blur-in" style={{ position:'fixed', inset:0, zIndex:1000, background:'var(--fm-overlay)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:480, background:'var(--fm-surface)', border:'1px solid rgba(124,108,246,0.3)', borderRadius:22, padding:'28px 28px 24px', boxShadow:'0 24px 80px -12px var(--fm-overlay)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--fm-primary)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>{t('prp.apply')}</p>
            <h3 style={{ fontSize:17, fontWeight:900, color:'var(--fm-text-1)', margin:0, lineHeight:1.3 }}>{project.title}</h3>
          </div>
          <button onClick={onClose} style={{ background:'var(--fm-surface-hover)', border:'1px solid var(--fm-border)', borderRadius:10, padding:6, cursor:'pointer', color:'var(--fm-text-6)', display:'flex', alignItems:'center', justifyContent:'center' }}><IcX s={14}/></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{t('prp.delivery_period')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
              {clientMaxDays !== undefined && (
                <span style={{ fontSize:10, fontWeight:700, color:'var(--fm-warning)', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:6, padding:'2px 8px' }}>
                  {t('prp.max', { period: project.period })}
                </span>
              )}
            </div>
            <PeriodSelect value={period} onChange={setPeriod} maxDays={clientMaxDays}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.portfolio_link')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="https://monportfolio.com" style={MI} onFocus={onFoc} onBlur={onBlr}/>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.cover_letter')}</p>
            <textarea value={letter} onChange={e=>setLetter(e.target.value)} rows={4} placeholder={t('prp.cover_letter_placeholder')} style={{...MI,resize:'none',lineHeight:1.6}} onFocus={onFoc} onBlur={onBlr}/>
          </div>
          {err && <p style={{ fontSize:12, color:'var(--fm-danger)', margin:0 }}>{err}</p>}
          <button type="submit" disabled={sending}
            style={{ padding:'12px', borderRadius:13, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:sending?'not-allowed':'pointer', opacity:sending?0.7:1, boxShadow:'0 6px 20px -4px rgba(124,108,246,0.5)', transition:'opacity .15s' }}>
            {sending ? t('prp.sending') : t('prp.send_application')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   POST MODAL — client posts a new project
   ══════════════════════════════════════════════════════════════ */
function PostModal({ user, onClose, onDone }) {
  const { t } = useTranslation();
  const [form, setForm]   = useState({ title:'', description:'', budget:'500', experience:'', period:'', keywords:['','','','',''] });
  const [errs, setErrs]   = useState({});
  const [posting,setPosting]=useState(false);
  const [err,  setErr]    = useState('');

  useBodyScrollLock(true); // this component only exists while the modal is open

  async function submit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.title.trim())       errors.title       = t('prp.required');
    if (!form.description.trim()) errors.description = t('prp.required');
    if (!form.experience)         errors.experience  = t('prp.required');
    if (!form.period)             errors.period      = t('prp.required');
    if (form.budget === '' || form.budget === null || isNaN(Number(form.budget)) || Number(form.budget) < 0)
      errors.budget = t('prp.required');
    if (form.keywords.some(k => !k.trim())) errors.keywords = t('prp.required');
    if (Object.keys(errors).length) { setErrs(errors); return; }
    setPosting(true); setErr('');
    try {
      const res = await fetch(`${API}/projects`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ clientEmail:user.email, ...form, keywords:form.keywords.filter(k=>k.trim()).map(k=>`#${k.trim()}`).join(' ') }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error||t('prp.err_server')); return; }
      onDone();
    } catch { setErr(t('prp.err_server_unreachable')); }
    finally { setPosting(false); }
  }

  return (
    <div className="fm-backdrop-blur-in" style={{ position:'fixed', inset:0, zIndex:1000, background:'var(--fm-overlay)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, overflowY:'auto' }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:560, background:'var(--fm-surface)', border:'1px solid rgba(124,108,246,0.3)', borderRadius:22, padding:28, boxShadow:'0 24px 80px -12px var(--fm-overlay)', marginBlock:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h3 style={{ fontSize:18, fontWeight:900, color:'var(--fm-text-1)', margin:0 }}>{t('prp.post_project')}</h3>
          <button onClick={onClose} style={{ background:'var(--fm-surface-hover)', border:'1px solid var(--fm-border)', borderRadius:10, padding:6, cursor:'pointer', color:'var(--fm-text-6)', display:'flex', alignItems:'center', justifyContent:'center' }}><IcX s={14}/></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.project_title')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={t('prp.project_title_placeholder')} style={MI} onFocus={onFoc} onBlur={onBlr}/>
            {errs.title && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.title}</p>}
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.description')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder={t('prp.description_placeholder')} style={{...MI,resize:'none'}} onFocus={onFoc} onBlur={onBlr}/>
            {errs.description && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.description}</p>}
          </div>
          <div className="prp-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.experience')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
              <select value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} style={{...MI,cursor:'pointer',appearance:'none'}} onFocus={onFoc} onBlur={onBlr}>
                <option value="">{t('prp.select')}</option>
                {EXPERIENCE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              {errs.experience && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.experience}</p>}
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.period')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
              <select value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))} style={{...MI,cursor:'pointer',appearance:'none'}} onFocus={onFoc} onBlur={onBlr}>
                <option value="">{t('prp.select')}</option>
                {PERIOD_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              {errs.period && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.period}</p>}
            </div>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.budget_tnd')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <div style={{ display:'flex', alignItems:'stretch', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:12, overflow:'hidden' }}>
              <button type="button" onClick={()=>setForm(f=>({...f,budget:String(Math.max(0,(Number(f.budget)||0)-100))}))}
                style={{ flexShrink:0, minWidth:44, padding:'0 16px', fontSize:18, fontWeight:700, color:'var(--fm-text-6)', background:'none', border:'none', cursor:'pointer' }}>−</button>
              <input type="number" step="1" min="0" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}
                style={{ flex:1, minWidth:0, background:'transparent', color:'var(--fm-text-2)', fontSize:14, fontWeight:700, textAlign:'center', border:'none', outline:'none' }}/>
              <button type="button" onClick={()=>setForm(f=>({...f,budget:String((Number(f.budget)||0)+100)}))}
                style={{ flexShrink:0, minWidth:44, padding:'0 16px', fontSize:18, fontWeight:700, color:'var(--fm-text-6)', background:'none', border:'none', cursor:'pointer' }}>+</button>
            </div>
            {errs.budget && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.budget}</p>}
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>{t('prp.keywords')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {form.keywords.map((kw,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', background:'var(--fm-border-soft)', border:`1px solid ${errs.keywords && !kw.trim() ? 'var(--fm-danger)' : 'var(--fm-border)'}`, borderRadius:10, overflow:'hidden' }}>
                  <span style={{ paddingLeft:10, fontSize:13, fontWeight:700, color:'var(--fm-text-6)' }}>#</span>
                  <input maxLength={25} value={kw} onChange={e=>{const v=e.target.value.replace(/[#\s]/g,'');setForm(f=>({...f,keywords:f.keywords.map((k,idx)=>idx===i?v:k)}));}}
                    placeholder={t('prp.word_n', { n: i+1 })} style={{ background:'transparent', color:'var(--fm-text-2)', fontSize:12, fontWeight:600, padding:'8px 8px 8px 4px', outline:'none', width:'9ch' }}/>
                </div>
              ))}
            </div>
            {errs.keywords && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.keywords}</p>}
          </div>
          {err && <p style={{fontSize:12,color:'var(--fm-danger)'}}>{err}</p>}
          <button type="submit" disabled={posting}
            style={{ padding:'12px', borderRadius:13, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:posting?'not-allowed':'pointer', opacity:posting?0.7:1, boxShadow:'0 6px 20px -4px rgba(124,108,246,0.5)', transition:'opacity .15s' }}>
            {posting ? t('prp.publishing') : t('prp.publish_project')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROPOSAL CARD — single freelancer proposal (in My Projects)
   ══════════════════════════════════════════════════════════════ */
function ProposalCard({ proposal, onAccept, accepting, onReject, rejecting, users, readOnly }) {
  const { t } = useTranslation();
  const [showFull, setShowFull] = useState(false);
  const [confirm,  setConfirm]  = useState(null); // null | 'accept' | 'reject'
  const navigate = useNavigate();
  const u = (users||[]).find(u=>u.email?.toLowerCase()===proposal.freelancer_email?.toLowerCase());
  const [tintFg, tintBg] = getTint(proposal.freelancer_email);
  const name    = u?.name || proposal.freelancer_email?.split('@')[0] || '?';
  const initials= getInitials(name);
  const photo   = u?.photo;
  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';
  const isPending  = !isAccepted && !isRejected;
  const DAYS_PERIOD  = {2:'De 1 à 3 jours',5:'De 4 à 7 jours',10:'De 1 à 2 semaines',21:'De 2 à 4 semaines',60:'De 1 à 3 mois',90:'Plus de 3 mois'};
  const rawDays    = proposal.delivery_days || proposal.deliveryDays || '';
  const period     = DAYS_PERIOD[rawDays] || rawDays;
  const rawLetter  = proposal.cover_letter || proposal.coverLetter || '';
  const portMatch  = rawLetter.match(/^\[portfolio:(.*?)\]\n?([\s\S]*)/);
  const rawPortfolio = portMatch ? portMatch[1]
    : (proposal.portfolio_link || proposal.portfolioLink || u?.portfolio_url || u?.portfolioUrl || '');
  const portfolio  = rawPortfolio && !/^https?:\/\//.test(rawPortfolio) ? `https://${rawPortfolio}` : rawPortfolio;
  const coverLetter= portMatch ? portMatch[2] : rawLetter;

  const isAccept = confirm === 'accept';

  useBodyScrollLock(!!confirm);

  function doConfirm() {
    setConfirm(null);
    if (isAccept) onAccept(proposal.id);
    else          onReject(proposal.id);
  }

  return (
    <>
      {/* ── Confirmation overlay ── */}
      {confirm && (
        <div
          className="fm-backdrop-blur-in"
          style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:24,
            background:'var(--fm-overlay)' }}
          onClick={e=>{ if(e.target===e.currentTarget) setConfirm(null); }}>
          <div style={{ width:'100%', maxWidth:400, background:'var(--fm-bg-2)', borderRadius:28,
            border:`1px solid ${isAccept?'rgba(124,108,246,0.35)':'rgba(248,113,113,0.3)'}`,
            boxShadow:`0 40px 100px -20px ${isAccept?'rgba(124,108,246,0.25)':'rgba(248,113,113,0.2)'}, 0 0 0 1px var(--fm-border-soft)`,
            padding:'36px 32px 32px', textAlign:'center' }}>

            {/* Icon circle */}
            <div style={{ width:72, height:72, borderRadius:22, margin:'0 auto 22px',
              background: isAccept ? 'linear-gradient(135deg,rgba(124,108,246,0.18),rgba(98,84,212,0.08))' : 'linear-gradient(135deg,rgba(248,113,113,0.15),rgba(220,38,38,0.06))',
              border:`1.5px solid ${isAccept?'rgba(124,108,246,0.4)':'rgba(248,113,113,0.4)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color: isAccept ? 'var(--fm-primary-light)' : 'var(--fm-danger)',
              boxShadow:`0 8px 32px -8px ${isAccept?'rgba(124,108,246,0.4)':'rgba(248,113,113,0.35)'}` }}>
              {isAccept ? <IcCheck s={30}/> : <IcX s={28}/>}
            </div>

            {/* Title */}
            <h3 style={{ fontSize:20, fontWeight:900, color:'var(--fm-text-1)', margin:'0 0 10px', letterSpacing:'-0.02em' }}>
              {isAccept ? t('prp.accept_application') : t('prp.reject_application')}
            </h3>

            {/* Freelancer chip */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:9, background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:50, padding:'7px 14px 7px 7px', marginBottom:18 }}>
              <div style={{ width:28, height:28, borderRadius:10, background:tintBg, color:tintFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11, overflow:'hidden', flexShrink:0 }}>
                {photo
                  ? <img src={photo.startsWith('data:')?photo:cldImg(photo)} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
                  : initials||'?'}
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--fm-text-4)' }}>{name}</span>
            </div>

            {/* Body text */}
            <p style={{ fontSize:13, color:'var(--fm-text-7)', margin:'0 0 28px', lineHeight:1.65 }}>
              {isAccept
                ? t('prp.accept_desc')
                : t('prp.reject_desc')}
            </p>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setConfirm(null)}
                style={{ flex:1, padding:'13px', borderRadius:14, background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', color:'var(--fm-text-6)', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--fm-border)';e.currentTarget.style.color='var(--fm-text-4)';e.currentTarget.style.borderColor='var(--fm-border-strong)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--fm-border-soft)';e.currentTarget.style.color='var(--fm-text-6)';e.currentTarget.style.borderColor='var(--fm-border)';}}>
                {t('prp.cancel')}
              </button>
              <button onClick={doConfirm} disabled={accepting||rejecting}
                style={{ flex:1.4, padding:'13px', borderRadius:14, border:'none', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                  background: isAccept ? 'linear-gradient(135deg,#7c6cf6 0%,#6254d4 100%)' : 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
                  boxShadow: isAccept ? '0 6px 24px -6px rgba(124,108,246,0.6)' : '0 6px 24px -6px rgba(239,68,68,0.5)' }}
                onMouseEnter={e=>{e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)';}}>
                {isAccept ? t('prp.yes_accept') : t('prp.yes_reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card ── */}
      <div className="prp-proposal-card" style={{ display:'flex', gap:14, padding:'16px 18px', borderRadius:16,
        background: isAccepted ? 'rgba(16,185,129,0.05)' : isRejected ? 'rgba(248,113,113,0.04)' : 'var(--fm-surface-hover-soft)',
        border:`1px solid ${isAccepted?'rgba(16,185,129,0.22)':isRejected?'rgba(248,113,113,0.18)':'var(--fm-border)'}`, transition:'all .2s' }}>
        {/* Avatar — clickable → profile */}
        <div
          onClick={() => navigate(`/profile/${encodeURIComponent(proposal.freelancer_email)}`)}
          title={t('prp.view_profile')}
          style={{ width:40, height:40, borderRadius:12, background:tintBg, color:tintFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0, border:`1.5px solid ${tintFg}35`, overflow:'hidden', cursor:'pointer', transition:'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow=`0 0 0 3px ${tintFg}35`; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>
          {photo
            ? <img src={photo.startsWith('data:')?photo:cldImg(photo)} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
            : initials||'?'}
        </div>
        {/* Body */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Name + actions row */}
          <div className="prp-proposal-row" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
            <div
              onClick={() => navigate(`/profile/${encodeURIComponent(proposal.freelancer_email)}`)}
              style={{ cursor:'pointer' }}>
              <p style={{ fontSize:14, fontWeight:800, color:'var(--fm-text-2)', margin:'0 0 2px', transition:'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#c4baff'}
                onMouseLeave={e => e.currentTarget.style.color='var(--fm-text-2)'}>{name}</p>
            </div>
            <div className="prp-proposal-actions" style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
              {isAccepted && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, color:'var(--fm-success)', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.28)', padding:'4px 12px', borderRadius:20 }}>
                  <IcCheck s={11}/> {t('prp.accepted')}
                </span>
              )}
              {isRejected && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, color:'var(--fm-danger)', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', padding:'4px 12px', borderRadius:20 }}>
                  <IcX s={11}/> {t('prp.rejected')}
                </span>
              )}
              {isPending && (
                <>
                  <button onClick={()=>setConfirm('reject')} disabled={rejecting || readOnly}
                    title={readOnly ? t("Your account is pending approval — you can browse, but this action isn't available yet.") : undefined}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:12, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.22)', color:'var(--fm-danger)', fontSize:12.5, fontWeight:700, cursor:readOnly?'not-allowed':'pointer', opacity:readOnly?0.5:1, transition:'all .15s' }}
                    onMouseEnter={e=>{if(!readOnly){e.currentTarget.style.background='rgba(248,113,113,0.15)';e.currentTarget.style.transform='translateY(-1px)';}}}
                    onMouseLeave={e=>{if(!readOnly){e.currentTarget.style.background='rgba(248,113,113,0.08)';e.currentTarget.style.transform='translateY(0)';}}}>
                    <IcX s={12}/>{rejecting?'…':t('prp.cancel_short')}
                  </button>
                  <button onClick={()=>setConfirm('accept')} disabled={accepting || readOnly}
                    title={readOnly ? t("Your account is pending approval — you can browse, but this action isn't available yet.") : undefined}
                    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:12, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:12.5, fontWeight:800, cursor:readOnly?'not-allowed':'pointer', opacity:(accepting||readOnly)?0.5:1, boxShadow:'0 4px 14px -4px rgba(124,108,246,0.5)', transition:'all .15s' }}
                    onMouseEnter={e=>{if(!readOnly){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.opacity='0.9';}}}
                    onMouseLeave={e=>{if(!readOnly){e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='1';}}}>
                    <IcCheck s={12}/>{accepting?'…':t('prp.accept')}
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Chips: period + portfolio */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            {period && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-primary-light)', background:'rgba(124,108,246,0.09)', border:'1px solid rgba(124,108,246,0.18)', borderRadius:8, padding:'4px 10px' }}>
                <span style={{fontSize:10,fontWeight:700,opacity:0.8,letterSpacing:'0.03em'}}>{t('prp.duration')}</span>{period}
              </span>
            )}
            {portfolio && (
              <a href={portfolio} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'var(--fm-cyan)', background:'rgba(62,194,232,0.08)', border:'1px solid rgba(62,194,232,0.22)', borderRadius:8, padding:'5px 11px', textDecoration:'none', transition:'all .15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(62,194,232,0.18)'; e.currentTarget.style.borderColor='rgba(62,194,232,0.4)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='rgba(62,194,232,0.08)'; e.currentTarget.style.borderColor='rgba(62,194,232,0.22)'; e.currentTarget.style.transform='translateY(0)'; }}>
                <IcLink s={11}/>
                {t('prp.portfolio')}
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.7}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
          </div>
          {/* Cover letter */}
          {coverLetter && (
            <div>
              <p style={{ fontSize:12.5, color:'var(--fm-text-6)', margin:0, lineHeight:1.6 }}>
                {showFull ? coverLetter : (coverLetter.length>150 ? coverLetter.slice(0,148)+'…' : coverLetter)}
              </p>
              {coverLetter.length>150 && (
                <button onClick={()=>setShowFull(v=>!v)} style={{ background:'none', border:'none', color:'var(--fm-primary)', fontSize:11.5, fontWeight:700, cursor:'pointer', padding:'3px 0', marginTop:2 }}>
                  {showFull?t('prp.see_less'):t('prp.see_more')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   EDIT MODAL — client edits a project (only once allowed)
   ══════════════════════════════════════════════════════════════ */
function EditModal({ project, onClose, onDone }) {
  const { t } = useTranslation();
  useBodyScrollLock(true); // this component only exists while the modal is open
  const parseKws = () => {
    const kws = (project.keywords||'').split(/\s+/).filter(Boolean).map(k=>k.replace(/^#/,''));
    while (kws.length < 5) kws.push('');
    return kws.slice(0,5);
  };
  const [form, setForm]     = useState({ title:project.title||'', description:project.description||'', budget:project.budget?String(project.budget):'0', experience:project.experience||'', period:project.period||'', keywords:parseKws() });
  const [errs, setErrs]     = useState({});
  const [posting,setPosting]= useState(false);
  const [err,  setErr]      = useState('');

  async function submit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.title.trim())       errors.title       = t('prp.required');
    if (!form.description.trim()) errors.description = t('prp.required');
    if (!form.experience)         errors.experience  = t('prp.required');
    if (!form.period)             errors.period      = t('prp.required');
    if (Object.keys(errors).length) { setErrs(errors); return; }
    setPosting(true); setErr('');
    try {
      const res = await fetch(`${API}/projects/${project.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, keywords:form.keywords.filter(k=>k.trim()).map(k=>`#${k.trim()}`).join(' ') }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErr(data.error||t('prp.err_server')); return; }
      onDone();
    } catch { setErr(t('prp.err_server_unreachable')); }
    finally { setPosting(false); }
  }

  return (
    <div className="fm-backdrop-blur-in" style={{ position:'fixed', inset:0, zIndex:1000, background:'var(--fm-overlay)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, overflowY:'auto' }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:560, background:'var(--fm-surface)', border:'1px solid rgba(124,108,246,0.3)', borderRadius:22, padding:28, boxShadow:'0 24px 80px -12px var(--fm-overlay)', marginBlock:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontSize:18, fontWeight:900, color:'var(--fm-text-1)', margin:0 }}>{t('prp.edit_project')}</h3>
          <button onClick={onClose} style={{ background:'var(--fm-surface-hover)', border:'1px solid var(--fm-border)', borderRadius:10, padding:6, cursor:'pointer', color:'var(--fm-text-6)', display:'flex', alignItems:'center', justifyContent:'center' }}><IcX s={14}/></button>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:12, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.22)', marginBottom:18 }}>
          <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="var(--fm-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize:12, color:'var(--fm-warning)', margin:0, fontWeight:600, lineHeight:1.55 }}>{t('prp.edit_warning_pre')} <strong>{t('prp.edit_warning_once')}</strong>{t('prp.edit_warning_post')}</p>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.project_title')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={MI} onFocus={onFoc} onBlur={onBlr}/>
            {errs.title && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.title}</p>}
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.description')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} style={{...MI,resize:'none'}} onFocus={onFoc} onBlur={onBlr}/>
            {errs.description && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.description}</p>}
          </div>
          <div className="prp-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.experience')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
              <select value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} style={{...MI,cursor:'pointer',appearance:'none'}} onFocus={onFoc} onBlur={onBlr}>
                <option value="">{t('prp.select')}</option>
                {EXPERIENCE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              {errs.experience && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.experience}</p>}
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.period')} <span style={{color:'var(--fm-danger)'}}>*</span></p>
              <select value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))} style={{...MI,cursor:'pointer',appearance:'none'}} onFocus={onFoc} onBlur={onBlr}>
                <option value="">{t('prp.select')}</option>
                {PERIOD_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              {errs.period && <p style={{fontSize:11,color:'var(--fm-danger)',margin:'3px 0 0'}}>{errs.period}</p>}
            </div>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px' }}>{t('prp.budget_tnd')}</p>
            <div style={{ display:'flex', alignItems:'stretch', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:12, overflow:'hidden' }}>
              <button type="button" onClick={()=>setForm(f=>({...f,budget:String(Math.max(0,(Number(f.budget)||0)-100))}))}
                style={{ flexShrink:0, minWidth:44, padding:'0 16px', fontSize:18, fontWeight:700, color:'var(--fm-text-6)', background:'none', border:'none', cursor:'pointer' }}>−</button>
              <input type="number" step="1" min="0" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}
                style={{ flex:1, minWidth:0, background:'transparent', color:'var(--fm-text-2)', fontSize:14, fontWeight:700, textAlign:'center', border:'none', outline:'none' }}/>
              <button type="button" onClick={()=>setForm(f=>({...f,budget:String((Number(f.budget)||0)+100)}))}
                style={{ flexShrink:0, minWidth:44, padding:'0 16px', fontSize:18, fontWeight:700, color:'var(--fm-text-6)', background:'none', border:'none', cursor:'pointer' }}>+</button>
            </div>
          </div>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>{t('prp.keywords')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {form.keywords.map((kw,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:10, overflow:'hidden' }}>
                  <span style={{ paddingLeft:10, fontSize:13, fontWeight:700, color:'var(--fm-text-6)' }}>#</span>
                  <input maxLength={25} value={kw} onChange={e=>{const v=e.target.value.replace(/[#\s]/g,'');setForm(f=>({...f,keywords:f.keywords.map((k,idx)=>idx===i?v:k)}));}}
                    placeholder={t('prp.word_n', { n: i+1 })} style={{ background:'transparent', color:'var(--fm-text-2)', fontSize:12, fontWeight:600, padding:'8px 8px 8px 4px', outline:'none', width:'9ch' }}/>
                </div>
              ))}
            </div>
          </div>
          {err && <p style={{fontSize:12,color:'var(--fm-danger)'}}>{err}</p>}
          <button type="submit" disabled={posting}
            style={{ padding:'12px', borderRadius:13, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:posting?'not-allowed':'pointer', opacity:posting?0.7:1, boxShadow:'0 6px 20px -4px rgba(124,108,246,0.5)', transition:'opacity .15s' }}>
            {posting ? t('prp.editing') : t('prp.save_changes')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MY PROJECT CARD — client's own project with proposals
   ══════════════════════════════════════════════════════════════ */
function MyProjectCard({ project, proposals, expanded, onExpand, onDelete, onAccept, acceptingId, onReject, rejectingId, onEdit, wasEdited, users, readOnly }) {
  const { t } = useTranslation();
  const st       = STATUS_MAP[project.status] || STATUS_MAP.open;
  const stLabel  = t(`fd.status.${project.status}`, st.label);
  const keywords = project.keywords ? project.keywords.split(/\s+/).filter(Boolean) : [];
  const pendingN  = (proposals||[]).filter(p=>!p.status||p.status==='pending').length;
  const rejectedN = (proposals||[]).filter(p=>p.status==='rejected').length;
  const accepted  = (proposals||[]).find(p=>p.status==='accepted');
  const isLocked  = !!accepted;

  return (
    <div style={{ borderRadius:20, background:'var(--fm-surface-hover-soft)', border:`1px solid ${expanded?'rgba(124,108,246,0.3)':'var(--fm-border)'}`, overflow:'hidden', boxShadow:expanded?'0 8px 32px -8px rgba(124,108,246,0.18)':'none', transition:'all .22s' }}>
      <div className="prp-myproject-inner" style={{ padding:'20px 24px' }}>
        {/* Top row */}
        <div className="prp-myproject-toprow" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:800, color:st.color, background:st.bg, border:`1px solid ${st.border}`, padding:'3px 11px', borderRadius:20 }}>{stLabel}</span>
              <span style={{ fontSize:11, color:'var(--fm-text-7)' }}>{t('prp.published_ago', { time: timeAgo(project.created_at) })}</span>
            </div>
            <h3 style={{ fontSize:18, fontWeight:900, color:'var(--fm-text-1)', margin:'0 0 6px', letterSpacing:'-0.02em', lineHeight:1.3 }}>{project.title}</h3>
            {project.description && (
              <p style={{ fontSize:13, color:'var(--fm-text-6)', margin:0, lineHeight:1.6 }}>
                {project.description.length>120 ? project.description.slice(0,118)+'…' : project.description}
              </p>
            )}
          </div>
          <div className="prp-myproject-right" style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {/* Edit button — one-time, hidden when locked */}
            {!isLocked && !wasEdited && (
              <button onClick={()=>onEdit(project)} title={t('prp.edit_project_once')}
                style={{ width:32, height:32, borderRadius:10, background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.2)', color:'var(--fm-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,108,246,0.16)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(124,108,246,0.08)';}}>
                <IcEdit s={13}/>
              </button>
            )}
            {!isLocked && wasEdited && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'var(--fm-primary)', background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.18)', padding:'4px 10px', borderRadius:8, whiteSpace:'nowrap' }}
                title={t('prp.edited_title')}>
                <IcEdit s={10}/> {t('prp.edited')}
              </span>
            )}
            {/* Delete button — replaced by lock badge when project is accepted */}
            {isLocked ? (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'var(--fm-success)', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.22)', padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap' }}
                title={t('prp.locked_title')}>
                <IcLock s={12}/> {t('prp.locked')}
              </span>
            ) : (
              <button onClick={()=>onDelete(project.id)}
                style={{ width:32, height:32, borderRadius:10, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.18)', color:'var(--fm-danger)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(248,113,113,0.16)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(248,113,113,0.08)';}}>
                <IcTrash s={13}/>
              </button>
            )}
          </div>
        </div>
        {/* Meta chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {project.budget && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:800, color:'var(--fm-primary-light)', background:'rgba(124,108,246,0.09)', border:'1px solid rgba(124,108,246,0.18)', borderRadius:8, padding:'4px 10px' }}>
              <span style={{fontSize:10,fontWeight:700,opacity:0.75,letterSpacing:'0.03em'}}>{t('prp.budget')}</span>{Number(project.budget).toLocaleString('fr-TN')} TND
            </span>
          )}
          {project.period && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-text-7)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.duration')}</span>{project.period}</span>}
          {project.experience && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-text-7)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.experience')}</span>{project.experience}</span>}
        </div>
        {keywords.length>0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
            {keywords.map((kw,i)=><span key={i} style={{ fontSize:11, fontWeight:700, color:'var(--fm-primary)', background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.16)', borderRadius:20, padding:'2px 9px' }}>{kw}</span>)}
          </div>
        )}
        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12.5, fontWeight:700, color:(proposals||[]).length>0?'var(--fm-primary-light)':'var(--fm-text-7)' }}>
              <span style={{fontSize:10,fontWeight:700,opacity:0.75,letterSpacing:'0.03em'}}>{t('prp.applications')}</span>{(proposals||[]).length}
            </span>
            {pendingN>0 && (
              <span style={{ fontSize:11, fontWeight:800, color:'var(--fm-warning)', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', padding:'3px 10px', borderRadius:20 }}>
                {t('prp.n_pending', { count: pendingN })}
              </span>
            )}
            {accepted && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:800, color:'var(--fm-success)', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', padding:'3px 10px', borderRadius:20 }}>
                <IcCheck s={10}/> {t('prp.accepted')}
              </span>
            )}
            {rejectedN>0 && (
              <span style={{ fontSize:11, fontWeight:800, color:'var(--fm-danger)', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', padding:'3px 10px', borderRadius:20 }}>
                {t('prp.n_rejected', { count: rejectedN })}
              </span>
            )}
          </div>
          {(proposals||[]).length>0 && (
            <button onClick={()=>onExpand(expanded?null:project.id)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:11, background:expanded?'rgba(124,108,246,0.15)':'var(--fm-border-soft)', border:`1px solid ${expanded?'rgba(124,108,246,0.35)':'var(--fm-border)'}`, color:expanded?'var(--fm-primary-light)':'var(--fm-text-6)', fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
              {expanded?t('prp.hide'):t('prp.view_applications')}
              <div style={{ transition:'transform .2s', transform:expanded?'rotate(90deg)':'none' }}><IcChevRight s={12}/></div>
            </button>
          )}
        </div>
      </div>
      {/* Proposals panel */}
      {expanded && (proposals||[]).length>0 && (
        <div style={{ borderTop:'1px solid var(--fm-border)', padding:'16px 24px', background:'rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:10, fontWeight:800, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>{t('prp.applications_received')}</p>
          {proposals.map(p=>(
            <ProposalCard key={p.id} proposal={p} onAccept={onAccept} accepting={acceptingId===p.id} onReject={onReject} rejecting={rejectingId===p.id} users={users} readOnly={readOnly}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROJECT CARD — marketplace browse view
   ══════════════════════════════════════════════════════════════ */
function ProjectCard({ project, clientUser, proposalCount, user, onApply, saved, onSave, onDelete }) {
  const { t } = useTranslation();
  const [tintFg, tintBg] = getTint(project.client_email);
  const displayName = clientUser?.name || project.client_email?.split('@')[0] || '?';
  const initials    = getInitials(displayName);
  const isVerified  = clientUser?.cinStatus==='approved' || !clientUser;
  const region      = clientUser?.region || '';
  const keywords    = project.keywords ? project.keywords.split(/\s+/).filter(Boolean) : [];
  const isOwn       = user?.email?.toLowerCase()===project.client_email?.toLowerCase();
  const isFreelancer= user?.role==='freelancer';

  return (
    <div className="prp-browse-card" style={{ background:'var(--fm-surface-hover-soft)', border:'1px solid var(--fm-border)', borderRadius:20, padding:'22px 24px', transition:'border-color .2s, background .2s, box-shadow .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,108,246,0.28)';e.currentTarget.style.background='var(--fm-border-soft)';e.currentTarget.style.boxShadow='0 8px 32px -8px rgba(124,108,246,0.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--fm-border)';e.currentTarget.style.background='var(--fm-surface-hover-soft)';e.currentTarget.style.boxShadow='none';}}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:tintBg, color:tintFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0, border:`1.5px solid ${tintFg}30` }}>{initials||'?'}</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--fm-text-2)' }}>{displayName}</span>
              {isVerified && <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'var(--fm-cyan)', background:'rgba(62,194,232,0.08)', border:'1px solid rgba(62,194,232,0.2)', padding:'2px 7px', borderRadius:20 }}><IcVerified s={10}/> {t('prp.verified')}</span>}
              {region && <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11.5, color:'var(--fm-text-7)' }}><IcPin s={11}/>{region}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11.5, color:'var(--fm-text-7)' }}>{t('prp.time_ago', { time: timeAgo(project.created_at) })}</span>
          {isOwn && (
            <button onClick={()=>onDelete(project.id)}
              style={{ width:28, height:28, borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', color:'var(--fm-danger)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';}}>
              <IcX s={13}/>
            </button>
          )}
        </div>
      </div>
      <h3 style={{ fontSize:19, fontWeight:900, color:'var(--fm-text-1)', margin:'0 0 8px', letterSpacing:'-0.02em', lineHeight:1.25 }}>{project.title}</h3>
      {project.description && <p style={{ fontSize:13, color:'var(--fm-text-6)', margin:'0 0 14px', lineHeight:1.65 }}>{project.description.length>120?project.description.slice(0,118)+'…':project.description}</p>}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, marginBottom:14 }}>
        {project.budget && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:800, color:'var(--fm-primary-light)', background:'rgba(124,108,246,0.09)', border:'1px solid rgba(124,108,246,0.18)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.75,letterSpacing:'0.03em'}}>{t('prp.budget')}</span>{Number(project.budget).toLocaleString('fr-TN')} TND</span>}
        {project.period && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-text-7)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.duration')}</span>{project.period}</span>}
        {project.experience && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-text-7)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.experience')}</span>{project.experience}</span>}
        {proposalCount>0 && <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--fm-text-7)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:8, padding:'4px 10px' }}><span style={{fontSize:10,fontWeight:700,opacity:0.85,letterSpacing:'0.03em'}}>{t('prp.applications')}</span>{proposalCount}</span>}
      </div>
      {keywords.length>0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
          {keywords.map((kw,i)=><span key={i} style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-primary)', background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.16)', borderRadius:20, padding:'3px 11px' }}>{kw}</span>)}
        </div>
      )}
      <div style={{ height:1, background:'var(--fm-surface-hover)', marginBottom:16 }}/>
      <div className="prp-browse-footer" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10 }}>
        <button onClick={()=>onSave(project.id)}
          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'9px 18px', borderRadius:12, background:'none', border:`1px solid ${saved?'rgba(124,108,246,0.5)':'var(--fm-border-strong)'}`, color:saved?'var(--fm-primary-light)':'var(--fm-text-6)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,108,246,0.4)';e.currentTarget.style.color='var(--fm-primary-light)';}}
          onMouseLeave={e=>{if(!saved){e.currentTarget.style.borderColor='var(--fm-border-strong)';e.currentTarget.style.color='var(--fm-text-6)';}}}>
          <IcStar s={12} filled={saved}/> {saved?t('prp.saved'):t('prp.save')}
        </button>
        {!isOwn && isFreelancer && (
          <button onClick={()=>onApply(project)}
            style={{ padding:'9px 22px', borderRadius:12, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px -4px rgba(124,108,246,0.5)', transition:'opacity .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.opacity='0.85';}}
            onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
            {t('prp.apply_btn')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */
export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user, users } = useAuth();
  const isClient     = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const readOnly     = usePendingClientReadOnly();

  const [showPost,      setShowPost]      = useState(false);
  const [searchParams]  = useSearchParams();

  // Deep link from the homepage's "+ Publier" button (?post=1) — auto-open
  // the post-project modal on arrival. Only for an approved client; a
  // pending client would just find the same button disabled here anyway,
  // so silently doing nothing is the right outcome rather than popping a
  // modal whose own submit is going to be refused.
  useEffect(() => {
    if (searchParams.get('post') === '1' && isClient && !readOnly) setShowPost(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, readOnly]);
  const [editingProject,setEditingProject]= useState(null);
  const [editedProjects,setEditedProjects]= useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('fm_edited_projects')||'[]')); } catch { return new Set(); }
  });
  /* My Projects state */
  const PAGE_SIZE = 10;
  const [myProjects, setMyProjects] = useState([]);
  const [myTotal,     setMyTotal]     = useState(0);
  const [myTotalPages,setMyTotalPages]= useState(1);
  const [myPage,       setMyPage]       = useState(1);
  const [myPropsMap, setMyPropsMap] = useState({});
  const [myLoading,  setMyLoading]  = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [acceptingId,setAcceptingId]= useState(null);
  const [rejectingId,setRejectingId]= useState(null);

  /* Load client's own projects (paginated) + proposals per project */
  const loadMyProjects = useCallback(async () => {
    if (!isClient || !user?.email) return;
    setMyLoading(true);
    try {
      const url = `${API}/projects/${encodeURIComponent(user.email)}?page=${myPage}&limit=${PAGE_SIZE}`;
      let d = await fetch(url).then(r=>r.json()).catch(()=>null);
      if (!d || !Array.isArray(d.rows)) {
        await new Promise(res => setTimeout(res, 2000));
        d = await fetch(url).then(r=>r.json()).catch(()=>null);
      }
      const arr = (d && Array.isArray(d.rows)) ? d.rows : [];
      setMyProjects(arr);
      if (d && Array.isArray(d.rows)) { setMyTotal(d.total || 0); setMyTotalPages(d.totalPages || 1); }
      const map = {};
      await Promise.all(arr.map(async p => {
        const props = await fetch(`${API}/proposals/project/${p.id}`).then(r=>r.json()).catch(()=>[]);
        map[p.id] = Array.isArray(props) ? props : [];
      }));
      setMyPropsMap(map);
    } catch {}
    finally { setMyLoading(false); }
  }, [isClient, user?.email, myPage]);

  useEffect(() => { loadMyProjects(); }, [loadMyProjects]);

  async function handleDelete(projectId) {
    const props = myPropsMap[projectId] || [];
    if (props.some(p => p.status === 'accepted')) return; // locked — button should already be hidden
    if (!window.confirm(t('prp.confirm_delete'))) return;
    try {
      await fetch(`${API}/projects/${projectId}`, { method:'DELETE' });
      // Full reload (not a local filter) so total/totalPages stay accurate —
      // e.g. deleting the last item on a page must recompute the page count.
      loadMyProjects();
    } catch {}
  }

  function handleEditDone(projectId) {
    const next = new Set(editedProjects);
    next.add(projectId);
    setEditedProjects(next);
    localStorage.setItem('fm_edited_projects', JSON.stringify([...next]));
    setEditingProject(null);
    loadMyProjects();
  }

  async function handleAccept(proposalId) {
    setAcceptingId(proposalId);
    try {
      await fetch(`${API}/proposals/${proposalId}/accept`, { method:'PATCH', headers:{'Content-Type':'application/json'} });
      await loadMyProjects();
    } catch {}
    finally { setAcceptingId(null); }
  }

  async function handleReject(proposalId) {
    setRejectingId(proposalId);
    try {
      await fetch(`${API}/proposals/${proposalId}/reject`, { method:'PATCH', headers:{'Content-Type':'application/json'} });
      await loadMyProjects();
    } catch {}
    finally { setRejectingId(null); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--fm-bg)', paddingBottom:80, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>
      <SEOHead
        title="Projets Freelance"
        url="/projects"
        description="Parcourez tous les projets freelance disponibles sur FamaMennou. Développement, design, marketing, e-commerce et plus — trouvez votre prochaine mission."
        keywords="projets freelance tunisie, missions freelance, offres freelance, projets développement, projets design, missions marketing tunisie"
      />

      {/* Blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,108,246,0.1),transparent 68%)', top:'-200px', left:'-150px', animation:'prBlob1 22s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07),transparent 68%)', bottom:'15%', right:'-120px', animation:'prBlob2 28s ease-in-out infinite' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', margin:'0 auto', padding:'clamp(88px,10vw,100px) clamp(16px,3vw,24px) 0' }}>

        {/* ─── Header ─── */}
        <div style={{ marginBottom:28 }}>
          <button onClick={()=>!readOnly && setShowPost(true)} disabled={readOnly}
            title={readOnly ? t("Your account is pending approval — you can browse, but this action isn't available yet.") : undefined}
            style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:7, padding:'11px 20px', borderRadius:13, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:readOnly?'not-allowed':'pointer', opacity:readOnly?0.5:1, boxShadow:'0 4px 18px -4px rgba(124,108,246,0.5)', whiteSpace:'nowrap', transition:'opacity .15s, transform .15s' }}
            onMouseEnter={e=>{if(!readOnly){e.currentTarget.style.opacity='0.88';e.currentTarget.style.transform='translateY(-1px)';}}}
            onMouseLeave={e=>{if(!readOnly){e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)';}}}>
            <IcPlus s={14}/> {t('prp.publish')}
          </button>
        </div>

        {readOnly && <PendingClientBanner className="mb-4" />}

        {/* ═══════════════════════════════════════
            MES PROJETS
            ═══════════════════════════════════════ */}
        {/* key={`${myPage}-${myLoading}`}: a fresh key on every page change
            (and on the loading->loaded flip) makes AnimatePresence smoothly
            cross-fade in whatever replaces it, instead of it snapping
            instantly to the new page. */}
        <AnimatePresence mode="wait">
          <motion.div key={`${myPage}-${myLoading}`}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.25, ease:'easeOut' }}>
            {myLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[...Array(3)].map((_,i)=><div key={i} style={{ height:130, borderRadius:20, background:'var(--fm-surface-hover-soft)', animation:'prPulse 1.5s ease infinite' }}/>)}
              </div>
            ) : myProjects.length===0 ? (
              <div style={{ textAlign:'center', padding:'64px 24px', background:'var(--fm-surface-hover-soft)', border:'1px solid var(--fm-border)', borderRadius:22 }}>
                <div style={{ width:60, height:60, borderRadius:18, background:'rgba(124,108,246,0.09)', border:'1px solid rgba(124,108,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'var(--fm-primary-light)' }}>
                  <IcFolder s={26}/>
                </div>
                <p style={{ fontSize:16, fontWeight:700, color:'var(--fm-text-4)', margin:'0 0 6px' }}>{t('prp.no_projects')}</p>
                <p style={{ fontSize:13, color:'var(--fm-text-7)', margin:0 }}>{t('prp.no_projects_sub')}</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize:13, color:'var(--fm-text-7)', margin:'0 0 16px' }}>
                  {t('prp.n_projects_published', { count: myTotal })}
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {myProjects.map(p=>(
                    <MyProjectCard
                      key={p.id}
                      project={p}
                      proposals={myPropsMap[p.id]||[]}
                      expanded={expandedId===p.id}
                      onExpand={id=>setExpandedId(id)}
                      onDelete={handleDelete}
                      onAccept={handleAccept}
                      acceptingId={acceptingId}
                      onReject={handleReject}
                      rejectingId={rejectingId}
                      onEdit={setEditingProject}
                      wasEdited={editedProjects.has(p.id)}
                      users={users}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
                <Pagination page={myPage} totalPages={myTotalPages} total={myTotal} limit={PAGE_SIZE}
                  onPageChange={pg => { setMyPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  accent="#7c6cf6" loading={myLoading} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Post modal */}
      {showPost && (
        <PostModal user={user} onClose={()=>setShowPost(false)}
          onDone={()=>{ setShowPost(false); loadMyProjects(); }}/>
      )}

      {/* Edit modal */}
      {editingProject && (
        <EditModal
          project={editingProject}
          onClose={()=>setEditingProject(null)}
          onDone={()=>handleEditDone(editingProject.id)}
        />
      )}

      <style>{`
        @media (max-width:640px) {
          /* Proposal card — Accepted/Accept/Reject row wraps below name */
          .prp-proposal-card { padding:12px 12px !important; }
          .prp-proposal-row { flex-wrap:wrap !important; gap:8px !important; }
          .prp-proposal-actions { width:100% !important; justify-content:flex-start !important; flex-wrap:wrap !important; }
          .prp-proposal-actions > * { flex:1 !important; justify-content:center !important; }

          /* My project card */
          .prp-myproject-inner { padding:14px 14px !important; }
          .prp-myproject-toprow { flex-wrap:wrap !important; gap:8px !important; }
          .prp-myproject-right { flex-shrink:0 !important; }

          /* Browse project card */
          .prp-browse-card { padding:14px 14px !important; border-radius:14px !important; }
          .prp-browse-footer { flex-wrap:wrap !important; }
          .prp-browse-footer > * { flex:1 !important; justify-content:center !important; }

          /* Modal grids 2-col → 1-col */
          .prp-modal-grid { grid-template-columns:1fr !important; }
        }
        @keyframes prBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(50px,-40px)scale(1.08)} }
        @keyframes prBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-40px,30px)scale(1.06)} }
        @keyframes prPulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
        input::placeholder  { color:var(--fm-text-7); }
        textarea::placeholder { color:var(--fm-text-7); }
        select option { background:var(--fm-surface); color:var(--fm-text-5); }
      `}</style>
    </div>
  );
}
