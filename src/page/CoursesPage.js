import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import CreateCourseModal from '../components/CreateCourseModal';
import Pagination from '../components/Pagination';
import { cldImg } from '../utils/cloudinary';
import SEOHead from '../components/Seohead';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

/* ─────────────────────────────────────────────
   Design tokens  —  Teal / Emerald palette
   All colors verified readable on #040d0b bg
   ───────────────────────────────────────────── */
const C = {
  bg:       'var(--fm-bg)',
  accent:   '#0d9488',     // teal-600  — primary CTA / active states
  accentMid:'#14b8a6',     // teal-500  — lighter teal for gradients
  accentBr: '#5eead4',     // teal-300  — bright highlight, badge text
  teal:     '#0f766e',     // teal-700  — dark teal
  emerald:  '#10b981',     // emerald-500
  card:     'var(--fm-surface-hover-soft)',   // card surface (theme-reactive)
  cardHov:  'var(--fm-surface-hover)',        // stronger on hover
  border:   'var(--fm-border)',  // subtle dividers
  borderAcc:'rgba(13,148,136,0.38)',   // teal-tinted border
  text:     'var(--fm-text-1)',     // near-white, soft teal tint
  sub:      'var(--fm-text-4)',     // subtitles / descriptions
  muted:    'var(--fm-text-5)',     // secondary text
  dim:      'var(--fm-text-7)',     // very secondary / meta
};

const CATEGORIES = ['All', 'Technology', 'Design', 'Marketing', 'Writing', 'E-commerce', 'Finance'];

/* ── Premium SVG category icons ── */
const CAT_ICONS = {
  All: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Technology: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Design: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="13.5" cy="17.5" r="2.5"/>
      <path d="M11 7.5 8.5 11M11 16.5 8.5 13"/>
    </svg>
  ),
  Marketing: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Writing: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  'E-commerce': (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Finance: (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

/* ── Thumbnail gradients — each category gets a visually distinct palette ── */
const THUMB_GRAD = {
  Technology:   'linear-gradient(135deg,#0369a1 0%,#0d9488 100%)',   // blue → teal
  Design:       'linear-gradient(135deg,#7c3aed 0%,#0d9488 100%)',   // violet → teal
  Marketing:    'linear-gradient(135deg,#0d9488 0%,#0e7490 100%)',   // teal → dark cyan
  Writing:      'linear-gradient(135deg,#059669 0%,#0d9488 100%)',   // emerald → teal
  'E-commerce': 'linear-gradient(135deg,#0891b2 0%,#14b8a6 100%)',   // cyan → light teal
  Finance:      'linear-gradient(135deg,#d97706 0%,#0d9488 100%)',   // amber → teal
  All:          'linear-gradient(135deg,#0d9488 0%,#0369a1 100%)',
};

const CAT_COLORS = {
  Technology: '#0d9488', Design: '#8b5cf6', Marketing: '#0ea5e9',
  Writing: '#10b981', 'E-commerce': '#0891b2', Finance: '#f59e0b', All: '#0d9488',
};

const SORT_OPTIONS = [
  { value:'free_first', label:'Free first'     },
  { value:'newest',     label:'Newest'         },
  { value:'popular',    label:'Most popular'   },
  { value:'rating',     label:'Top rated'      },
  { value:'price_asc',  label:'Price ↑'        },
  { value:'price_desc', label:'Price ↓'        },
];

function fmtNum(n) {
  const v = Number(n||0);
  if (v >= 1000) return (v/1000).toFixed(1).replace(/\.0$/,'')+'k';
  return String(v);
}

const getTint = s => {
  const c = (s||'').charCodeAt(0) % 6;
  return ['#14b8a6','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#06b6d4'][c];
};
const getInits = n => (n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('');

/* ── Icon components ── */
const IcSearch = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
const IcPlus = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IcChev = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="m5 3 14 9-14 9V3z"/>
  </svg>
);
const IcStar = ({ on }) => (
  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" style={{ color: on ? '#f59e0b' : 'var(--fm-border-strong)' }}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);
const IcUsers = () => (
  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcBook = () => (
  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcX = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   Course Card
   ══════════════════════════════════════════════════════════════════ */
function CourseCard({ course, onClick, onDeleted }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [editForm, setEditForm]     = useState({ title: course.title||'', description: course.description||'', category: course.category||'', full_price: course.full_price||'', discount_pct: course.discount_pct||'' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');
  const EDIT_KEY = `fm_edited_course_${course.id}`;
  const alreadyEdited = !!localStorage.getItem(EDIT_KEY);
  const isOwner = user && course.creator_email && user.email === course.creator_email;

  const lockScroll = (open) => {
    if (open) {
      const y = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (top) window.scrollTo(0, -parseInt(top));
    }
  };

  useEffect(() => { lockScroll(confirmDel || editOpen); return () => lockScroll(false); }, [confirmDel, editOpen]); // eslint-disable-line

  async function handleEdit() {
    if (!editForm.title.trim()) { setEditError(t('Title is required')); return; }
    setEditSaving(true); setEditError('');
    try {
      const r = await fetch(`${API}/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editForm.title.trim(), description: editForm.description.trim(), category: editForm.category, full_price: Number(editForm.full_price)||0, discount_pct: Number(editForm.discount_pct)||0 }),
      });
      if (!r.ok) throw new Error();
      localStorage.setItem(EDIT_KEY, '1');
      setEditOpen(false);
      window.location.reload();
    } catch { setEditError(t('Failed to save. Try again.')); }
    setEditSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`${API}/courses/${course.id}`, { method: 'DELETE' });
    setDeleting(false);
    setConfirmDel(false);
    onDeleted?.(course.id);
  }
  const full       = Number(course.full_price||0);
  const pct        = Number(course.discount_pct||0);
  const final      = pct > 0 ? full*(1-pct/100) : full;
  const isFree     = full === 0;
  const hasDisc    = !isFree && pct > 0;
  const catColor   = CAT_COLORS[course.category] || C.accent;
  const thumbGrad  = THUMB_GRAD[course.category]  || THUMB_GRAD.All;
  const instructor = course.instructor_name || course.creator_email?.split('@')[0] || t('csp.instructor');
  const iColor     = getTint(instructor);
  const iInits     = getInits(instructor);
  const rating     = Number(course.avg_rating||0);
  const students   = fmtNum(course.total_students);
  const lessons    = Number(course.lesson_count||0);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:'100%', textAlign:'left', display:'flex', flexDirection:'column',
        borderRadius:20, overflow:'hidden', cursor:'pointer',
        border:      `1px solid ${hov ? C.borderAcc : C.border}`,
        background:  hov ? C.cardHov : C.card,
        transform:   hov ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow:   hov ? `0 20px 48px -12px var(--fm-shadow), 0 0 0 1px ${C.borderAcc}` : 'none',
        transition:  'all .25s cubic-bezier(.4,0,.2,1)',
      }}>

      {/* ── Thumbnail ── */}
      <div style={{ position:'relative', paddingTop:'56.25%', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:thumbGrad }}>
          {course.thumbnail_url && (
            <img
              src={cldImg(course.thumbnail_url)} alt={course.title}
              style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }}
            />
          )}
          {/* dim on hover */}
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.18)', opacity:hov?1:0, transition:'opacity .2s' }} />

          {/* Play button */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:`translate(-50%,-50%) scale(${hov?1:0.8})`,
            width:52, height:52, borderRadius:'50%',
            background:'rgba(255,255,255,0.22)', backdropFilter:'blur(6px)',
            border:'2px solid rgba(255,255,255,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 20px rgba(0,0,0,0.35)',
            transition:'transform .22s, opacity .22s',
            opacity: course.thumbnail_url ? (hov?1:0) : 1,
            paddingLeft:2,
          }}>
            <IcPlay />
          </div>

          {/* Category badge */}
          <span style={{
            position:'absolute', top:10, left:10,
            fontSize:10.5, fontWeight:700, color:'#fff',
            background: catColor+'cc', backdropFilter:'blur(4px)',
            padding:'3px 10px', borderRadius:8, letterSpacing:'0.02em',
          }}>
            {course.category}
          </span>

          {/* Price badge */}
          <span style={{
            position:'absolute', top:10, right:10,
            fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:8,
            background:'rgba(255,255,255,0.93)', letterSpacing:'0.01em',
            color: isFree ? '#0f766e' : hasDisc ? '#dc2626' : '#134e4a',
          }}>
            {isFree ? t('cc.free') : hasDisc ? `${final.toFixed(0)} TND` : `${full.toFixed(0)} TND`}
          </span>

          {/* Discount ribbon */}
          {hasDisc && (
            <span style={{
              position:'absolute', bottom:10, right:10,
              fontSize:10, fontWeight:800, color:'#fff',
              background:'#ef4444', padding:'2px 8px', borderRadius:6,
              boxShadow:'0 2px 8px rgba(239,68,68,0.5)',
            }}>
              -{pct}%
            </span>
          )}

        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'16px 18px 18px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>

        {/* Title row + 3-dot menu */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
          <h3 style={{
            flex:1, fontSize:15, fontWeight:800, color:C.text, margin:0,
            lineHeight:1.38, letterSpacing:'-0.01em',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>
            {course.title}
          </h3>
          {isOwner && (
            <div style={{ position:'relative', flexShrink:0 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--fm-border)', background:'var(--fm-surface-hover)', color:C.muted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, lineHeight:1 }}>
                ⋮
              </button>
              {menuOpen && (
                <div style={{ position:'absolute', top:32, right:0, background:'var(--fm-surface)', border:'1px solid var(--fm-border-strong)', borderRadius:10, overflow:'hidden', minWidth:170, boxShadow:'0 8px 24px var(--fm-shadow)', zIndex:50 }}>
                  {/* Edit option */}
                  <button
                    onClick={e => { e.stopPropagation(); if (!alreadyEdited) { setMenuOpen(false); setEditOpen(true); } }}
                    disabled={alreadyEdited}
                    style={{ width:'100%', padding:'10px 14px', border:'none', background:'transparent', color: alreadyEdited ? 'var(--fm-text-7)' : '#5eead4', fontSize:13, fontWeight:600, cursor: alreadyEdited ? 'not-allowed' : 'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8, opacity: alreadyEdited ? 0.6 : 1 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span style={{ flex:1 }}>{alreadyEdited ? t('Already edited') : t('Edit course')}</span>
                    {alreadyEdited && <span style={{ fontSize:10, background:'var(--fm-border)', borderRadius:4, padding:'1px 5px', color:'var(--fm-text-5)', fontWeight:700 }}>1×</span>}
                  </button>
                  {!alreadyEdited && (
                    <div style={{ padding:'2px 14px 6px', fontSize:10.5, color:'var(--fm-text-7)', lineHeight:1.4 }}>
                      {t('One-time edit only')}
                    </div>
                  )}
                  <div style={{ height:1, background:'var(--fm-border)', margin:'0 10px' }} />
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); setConfirmDel(true); }}
                    style={{ width:'100%', padding:'10px 14px', border:'none', background:'transparent', color:'var(--fm-danger)', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    {t('Delete course')}
                  </button>
                </div>
              )}
              {confirmDel && createPortal(
                <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--fm-overlay)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
                  onClick={() => setConfirmDel(false)}>
                  <div style={{ background:'var(--fm-surface)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:20, padding:'28px 24px 24px', maxWidth:360, width:'100%', position:'relative' }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => setConfirmDel(false)} style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:8, border:'1px solid var(--fm-border)', background:'var(--fm-surface-hover)', color:'var(--fm-text-5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, lineHeight:1 }}>✕</button>
                    <p style={{ fontWeight:800, fontSize:17, color:'var(--fm-text-1)', marginBottom:8, paddingRight:32 }}>{t('Delete this course?')}</p>
                    <p style={{ fontSize:13, color:'var(--fm-text-5)', marginBottom:24 }}>{t('This action cannot be undone.')}</p>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={() => setConfirmDel(false)} style={{ flex:1, padding:'11px 0', borderRadius:12, border:'1px solid var(--fm-border-strong)', background:'transparent', color:'var(--fm-text-5)', fontWeight:600, cursor:'pointer', fontSize:14 }}>{t('Cancel')}</button>
                      <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:'11px 0', borderRadius:12, border:'none', background:'#ef4444', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14, opacity:deleting?0.6:1, boxShadow:'0 4px 14px -4px rgba(239,68,68,0.6)' }}>{deleting ? t('Deleting…') : t('Delete')}</button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* ── Edit Modal ── */}
              {editOpen && createPortal(
                <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--fm-overlay)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}
                  onClick={() => setEditOpen(false)}>
                  <div style={{ background:'var(--fm-surface)', border:'1px solid rgba(94,234,212,0.22)', borderRadius:22, padding:'clamp(20px,5vw,30px)', maxWidth:480, width:'100%', position:'relative', boxShadow:'0 24px 64px var(--fm-shadow)', margin:'auto' }}
                    onClick={e => e.stopPropagation()}>

                    <button onClick={() => setEditOpen(false)} style={{ position:'absolute', top:14, right:14, width:30, height:30, borderRadius:8, border:'1px solid var(--fm-border)', background:'var(--fm-surface-hover)', color:'var(--fm-text-5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, lineHeight:1 }}>✕</button>
                    <p style={{ fontWeight:900, fontSize:'clamp(16px,4vw,19px)', color:'var(--fm-text-1)', marginBottom:4, paddingRight:36 }}>{t('Edit course')}</p>

                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'9px 12px', marginBottom:20 }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--fm-warning)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span style={{ fontSize:12, color:'#fbbf24', fontWeight:600, lineHeight:1.4 }}>{t('You can only edit this course once. This action cannot be repeated.')}</span>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div>
                        <label style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-text-5)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{t('Title')} *</label>
                        <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} maxLength={120}
                          style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:11, border:'1px solid rgba(94,234,212,0.2)', background:'var(--fm-border-soft)', color:'var(--fm-text-1)', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s' }}
                          onFocus={e => e.target.style.borderColor='rgba(94,234,212,0.45)'} onBlur={e => e.target.style.borderColor='rgba(94,234,212,0.2)'} />
                      </div>
                      <div>
                        <label style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-text-5)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{t('Description')}</label>
                        <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} maxLength={800}
                          style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:11, border:'1px solid rgba(94,234,212,0.2)', background:'var(--fm-border-soft)', color:'var(--fm-text-1)', fontSize:14, outline:'none', fontFamily:'inherit', resize:'vertical', minHeight:80, transition:'border-color .2s' }}
                          onFocus={e => e.target.style.borderColor='rgba(94,234,212,0.45)'} onBlur={e => e.target.style.borderColor='rgba(94,234,212,0.2)'} />
                      </div>
                      <div>
                        <label style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-text-5)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{t('Category')}</label>
                        <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                          style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:11, border:'1px solid rgba(94,234,212,0.2)', background:'var(--fm-surface)', color:'var(--fm-text-1)', fontSize:14, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
                        <div>
                          <label style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-text-5)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{t('Price')} (TND)</label>
                          <input type="number" min="0" step="0.01" value={editForm.full_price} onChange={e => setEditForm(p => ({ ...p, full_price: e.target.value }))}
                            style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:11, border:'1px solid rgba(94,234,212,0.2)', background:'var(--fm-border-soft)', color:'var(--fm-text-1)', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s' }}
                            onFocus={e => e.target.style.borderColor='rgba(94,234,212,0.45)'} onBlur={e => e.target.style.borderColor='rgba(94,234,212,0.2)'} />
                        </div>
                        <div>
                          <label style={{ fontSize:11.5, fontWeight:700, color:'var(--fm-text-5)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{t('Discount')} (%)</label>
                          <input type="number" min="0" max="100" step="1" value={editForm.discount_pct} onChange={e => setEditForm(p => ({ ...p, discount_pct: e.target.value }))}
                            style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:11, border:'1px solid rgba(94,234,212,0.2)', background:'var(--fm-border-soft)', color:'var(--fm-text-1)', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s' }}
                            onFocus={e => e.target.style.borderColor='rgba(94,234,212,0.45)'} onBlur={e => e.target.style.borderColor='rgba(94,234,212,0.2)'} />
                        </div>
                      </div>
                    </div>

                    {editError && <p style={{ fontSize:12.5, color:'var(--fm-danger)', marginTop:12, fontWeight:600 }}>{editError}</p>}

                    <div style={{ display:'flex', gap:10, marginTop:20 }}>
                      <button onClick={() => setEditOpen(false)} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid var(--fm-border-strong)', background:'transparent', color:'var(--fm-text-5)', fontWeight:600, cursor:'pointer', fontSize:14 }}>{t('Cancel')}</button>
                      <button onClick={handleEdit} disabled={editSaving} style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg,#14b8a6,#0d9488)', color:'#fff', fontWeight:700, cursor:editSaving?'not-allowed':'pointer', fontSize:14, opacity:editSaving?0.65:1, boxShadow:'0 4px 14px -4px rgba(13,148,136,0.6)', transition:'opacity .2s' }}>
                        {editSaving ? t('Saving…') : t('Save changes')}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>

        {/* Instructor */}
        <div style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}
          onClick={e => { e.stopPropagation(); navigate(`/profile/${encodeURIComponent(course.creator_email)}`); }}>
          <div style={{
            width:24, height:24, borderRadius:'50%', flexShrink:0,
            background: iColor + '28', color:iColor,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, fontWeight:800, border:`1px solid ${iColor}45`,
          }}>
            {iInits || '?'}
          </div>
          <span style={{ fontSize:12, color:C.muted, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {instructor}
          </span>
        </div>

        {/* Stars + stats */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:2 }}>
            {[1,2,3,4,5].map(i => <IcStar key={i} on={i <= Math.round(rating)} />)}
            <span style={{ fontSize:11.5, fontWeight:700, color:C.accentBr, marginLeft:4 }}>
              {rating.toFixed(1)}
            </span>
            <span style={{ fontSize:11, color:C.dim, marginLeft:2 }}>
              ({fmtNum(course.review_count||0)})
            </span>
          </div>
          <span style={{ width:1, height:10, background:'var(--fm-border)', flexShrink:0 }} />
          <div style={{ display:'flex', alignItems:'center', gap:4, color:C.muted }}>
            <IcUsers />
            <span style={{ fontSize:11 }}>{students}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, color:C.muted }}>
            <IcBook />
            <span style={{ fontSize:11 }}>{t('cc.lessons_count', { count: lessons })}</span>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height:1, background:'var(--fm-surface-hover)' }} />

        {/* Price + Enroll row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {isFree ? (
            <span style={{ fontSize:17, fontWeight:900, color:C.accentBr }}>{t('cc.free')}</span>
          ) : hasDisc ? (
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontSize:17, fontWeight:900, color:'var(--fm-danger)' }}>{final.toFixed(0)} TND</span>
              <span style={{ fontSize:12, color:C.dim, textDecoration:'line-through' }}>{full.toFixed(0)}</span>
            </div>
          ) : (
            <span style={{ fontSize:17, fontWeight:900, color:C.text }}>{full.toFixed(0)} TND</span>
          )}

          <span style={{
            padding:'7px 18px', borderRadius:10,
            background: `linear-gradient(135deg,${C.accentMid},${C.teal})`,
            color:'#fff', fontSize:12, fontWeight:700,
            boxShadow: hov ? `0 6px 18px -4px rgba(13,148,136,0.7)` : `0 4px 12px -4px rgba(13,148,136,0.45)`,
            transition:'box-shadow .2s',
            letterSpacing:'0.01em',
          }}>
            {t('csp.enroll')}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius:20, overflow:'hidden', background:C.card, border:`1px solid ${C.border}` }}>
      <div style={{ paddingTop:'56.25%', background:'var(--fm-surface-hover-soft)', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,var(--fm-border-soft),transparent)', animation:'cpShimmer 1.6s infinite' }} />
      </div>
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
        {[72, 44, 58].map((w, i) => (
          <div key={i} style={{ height: i===0 ? 16 : 12, width:`${w}%`, borderRadius:6, background:'var(--fm-border-soft)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,var(--fm-border-soft),transparent)', animation:'cpShimmer 1.6s infinite' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses,         setCourses]         = useState([]);
  const [total,           setTotal]           = useState(0);
  const [totalPages,      setTotalPages]      = useState(1);
  const [page,            setPage]            = useState(1);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [debSearch,       setDebSearch]       = useState('');
  const [category,        setCategory]        = useState('All');
  const [sort,            setSort]            = useState('free_first');
  const [priceFilter,     setPriceFilter]     = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType,      setCreateType]      = useState('paid');
  const [showTypeModal,   setShowTypeModal]   = useState(false);
  const [selectedType,    setSelectedType]    = useState('free');
  const PAGE_SIZE = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 320);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change invalidates the current page — start back at page 1.
  useEffect(() => { setPage(1); }, [debSearch, category, sort, priceFilter]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sort, page: String(page), limit: String(PAGE_SIZE) });
      if (debSearch)            p.set('search', debSearch.trim());
      if (category !== 'All')   p.set('category', category);
      if (priceFilter==='free') p.set('max_price','0');
      if (priceFilter==='paid') p.set('min_price','0.01');
      const url = `${API}/courses?${p}`;
      let d = await fetch(url).then(r => r.json());
      // A transient 429/500 (e.g. right as Neon wakes from an idle suspend)
      // returns a non-array error body — retry once instead of silently
      // showing "no courses" for a request that never actually succeeded.
      if (!d || !Array.isArray(d.rows)) {
        await new Promise(res => setTimeout(res, 2000));
        d = await fetch(url).then(r => r.json());
      }
      if (d && Array.isArray(d.rows)) {
        setCourses(d.rows);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      }
    } catch { /* leave existing courses in place rather than wiping to empty */ }
    finally  { setLoading(false); }
  }, [debSearch, category, sort, priceFilter, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    const lock = showTypeModal || showCreateModal;
    document.body.style.overflow = lock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showTypeModal, showCreateModal]);

  // Distinct-instructor count across the WHOLE catalog, not just this page —
  // fetched once (60s server cache) rather than derived from `courses`,
  // which is now just the current page's 10 rows.
  const [instructors, setInstructors] = useState(0);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/courses/stats`).then(r => r.json()).then(d => setInstructors(d.instructors || 0)).catch(() => {})
      .finally(() => setInstructorsLoading(false));
  }, []);
  const isFreelancer = user?.role === 'freelancer';

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", paddingBottom:80, position:'relative' }}>
      <SEOHead
        title="Cours en ligne en Tunisie"
        url="/courses"
        description="Apprenez de nouvelles compétences avec les meilleurs formateurs tunisiens. Cours de développement, design, marketing et plus sur FamaMennou."
        keywords="cours en ligne tunisie, formation freelance, apprendre développement, cours design, cours marketing tunisie, e-learning tunisie"
      />

      {/* ══ ANIMATED BACKGROUND BLOBS ══ */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,0.14) 0%,transparent 65%)', top:'-300px', left:'-200px', animation:'cpBlob1 22s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:660, height:660, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.09) 0%,transparent 65%)', top:'22%', right:'-240px', animation:'cpBlob2 27s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:540, height:540, borderRadius:'50%', background:'radial-gradient(circle,rgba(8,145,178,0.07) 0%,transparent 65%)', bottom:'-100px', left:'26%', animation:'cpBlob3 32s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,0.06) 0%,transparent 65%)', top:'58%', left:'3%', animation:'cpBlob4 24s ease-in-out infinite reverse' }} />
        {/* teal grid overlay */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'linear-gradient(rgba(13,148,136,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.035) 1px,transparent 1px)',
          backgroundSize:'52px 52px',
          WebkitMaskImage:'radial-gradient(ellipse 85% 55% at 50% 0%,#000 40%,transparent 100%)',
          maskImage:'radial-gradient(ellipse 85% 55% at 50% 0%,#000 40%,transparent 100%)',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ══ HERO ══ */}
        <div style={{
          background:`radial-gradient(ellipse 880px 440px at 22% -6%,rgba(13,148,136,0.18),transparent 66%),radial-gradient(ellipse 580px 300px at 84% -2%,rgba(20,184,166,0.1),transparent 65%)`,
          borderBottom:`1px solid ${C.border}`,
          paddingBottom:52,
        }}>
          <div style={{ maxWidth:860, margin:'0 auto', padding:'clamp(88px,10vw,100px) clamp(16px,4vw,24px) 0', textAlign:'center' }}>

            {/* Headline */}
            <h1 style={{ fontSize:'clamp(30px,8vw,52px)', fontWeight:900, color:C.text, margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.07 }}>
              {t('csp.hero_title_1')}{' '}
              <span style={{
                background:'linear-gradient(120deg,#5eead4 0%,#14b8a6 42%,#059669 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>
                {t('csp.hero_title_2')}
              </span>
            </h1>

            {/* Sub-headline */}
            <p style={{ fontSize:16, color:C.sub, margin:'0 auto 36px', lineHeight:1.7, letterSpacing:'0.01em', maxWidth:500 }}>
              {t('csp.hero_subtitle')}
            </p>

            {/* Search bar */}
            <div style={{ position:'relative', maxWidth:520, margin:'0 auto 28px' }}>
              <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:C.dim, pointerEvents:'none' }}>
                <IcSearch />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Search courses...')}
                style={{
                  width:'100%', boxSizing:'border-box',
                  padding:'14px 44px', borderRadius:14,
                  background:'var(--fm-border-soft)',
                  border:`1px solid ${C.border}`,
                  color:C.text, fontSize:14, outline:'none',
                  fontFamily:'inherit', textAlign:'center',
                  transition:'border-color .2s, background .2s',
                }}
                onFocus={e => { e.target.style.borderColor='rgba(94,234,212,0.4)'; e.target.style.background='rgba(13,148,136,0.06)'; e.target.style.textAlign='left'; }}
                onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background='var(--fm-border-soft)'; if (!search) e.target.style.textAlign='center'; }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.muted, cursor:'pointer', padding:4, display:'flex' }}>
                  <IcX />
                </button>
              )}
            </div>

            {/* Create course button — freelancers only */}
            {isFreelancer && (
              <div style={{ marginBottom:38 }}>
                <button
                  onClick={() => { setCreateType('paid'); setShowCreateModal(true); }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:9,
                    padding:'13px 30px', borderRadius:14,
                    background:`linear-gradient(135deg,${C.accentMid},${C.teal})`,
                    border:'none', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer',
                    boxShadow:`0 8px 28px -4px rgba(13,148,136,0.65)`,
                    transition:'opacity .18s, transform .18s',
                    letterSpacing:'0.01em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='0.9'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 36px -4px rgba(13,148,136,0.75)`; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 8px 28px -4px rgba(13,148,136,0.65)`; }}>
                  <IcPlus /> {t('fd.create_a_course')}
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="csp-stats-row" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, flexWrap:'wrap' }}>
              {[
                { n: total,                 label: t('csp.stat_courses'),     loading: loading },
                { n: CATEGORIES.length - 1, label: t('csp.stat_categories')  },
                { n: instructors,           label: t('csp.stat_instructors'), loading: instructorsLoading },
              ].map((s, i) => (
                <div key={i} className="csp-stat-item" style={{ display:'flex', alignItems:'center' }}>
                  {i > 0 && <span className="csp-stat-sep" style={{ width:1, height:32, background:'var(--fm-border)', margin:'0 clamp(12px,3vw,28px)' }} />}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:30, fontWeight:900, color:C.accentBr, lineHeight:1.1, letterSpacing:'-0.03em' }}>
                      {s.loading && s.n === 0 ? '…' : s.n}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ══ STICKY FILTER BAR ══ */}
        <div style={{
          position:'sticky', top:64, zIndex:20,
          background:'var(--fm-bg)', backdropFilter:'blur(20px)',
          borderBottom:`1px solid ${C.border}`, borderTop:'1px solid var(--fm-border-soft)',
        }}>
          <div className="csp-filter-inner" style={{ maxWidth:1240, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height:60, gap:0 }}>

            {/* Scrollable category pills */}
            <div className="csp-filter-pills" style={{ flex:1, display:'flex', gap:5, overflowX:'auto', scrollbarWidth:'none', minWidth:0, paddingRight:4 }}>
              {CATEGORIES.map(cat => {
                const active = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    style={{
                      flexShrink:0, display:'flex', alignItems:'center', gap:6,
                      padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight: active ? 700 : 500,
                      cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s',
                      background: active ? 'rgba(13,148,136,0.18)' : 'transparent',
                      border:     active ? '1px solid rgba(94,234,212,0.35)' : `1px solid var(--fm-border)`,
                      color:      active ? C.accentBr : C.muted,
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor='rgba(13,148,136,0.25)'; e.currentTarget.style.color=C.sub; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor='var(--fm-border)'; e.currentTarget.style.color=C.muted; } }}>
                    <span style={{ display:'flex', alignItems:'center', color:'inherit' }}>
                      {CAT_ICONS[cat]}
                    </span>
                    {t(cat)}
                  </button>
                );
              })}
            </div>

            {/* Right controls */}
            <div className="csp-filter-right" style={{ flexShrink:0, display:'flex', alignItems:'center', gap:10, borderLeft:`1px solid ${C.border}`, paddingLeft:16, marginLeft:8 }}>

              {/* All / Free / Paid toggle */}
              <div style={{ display:'flex', gap:3, background:'var(--fm-border-soft)', borderRadius:20, padding:3 }}>
                {[['all',t('All')],['free',t('cc.free')],['paid',t('csp.paid')]].map(([v,l]) => (
                  <button key={v} onClick={() => setPriceFilter(v)}
                    style={{
                      padding:'4px 12px', borderRadius:16, fontSize:11.5, fontWeight:700,
                      cursor:'pointer', border:'none', transition:'all .18s',
                      background: priceFilter===v ? C.accent : 'transparent',
                      color:      priceFilter===v ? '#fff'   : C.muted,
                    }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Course count */}
              <span className="csp-filter-count" style={{ fontSize:12, color:C.muted, whiteSpace:'nowrap', fontWeight:500 }}>
                <strong style={{ color:C.accentBr, fontWeight:800 }}>{total}</strong>
                {' '}{t('csp.courses_lower')}
              </span>

              {/* Sort select */}
              <div style={{ position:'relative' }}>
                <select
                  value={sort} onChange={e => setSort(e.target.value)}
                  style={{
                    padding:'6px 28px 6px 11px', borderRadius:10,
                    background:'var(--fm-border-soft)', border:`1px solid ${C.border}`,
                    color:C.sub, fontSize:11.5, outline:'none', cursor:'pointer',
                    appearance:'none', fontFamily:'inherit',
                  }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                </select>
                <div style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:C.muted }}>
                  <IcChev />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION HEADER + COURSE GRID ══ */}
        <div className="csp-content" style={{ maxWidth:1240, margin:'0 auto', padding:'36px 24px 0' }}>

          {/* Section label row */}
          {!loading && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:3, height:18, borderRadius:4, background:`linear-gradient(to bottom,${C.accentBr},${C.accent})` }} />
                <span style={{ fontSize:13, fontWeight:700, color:C.sub, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                  {category === 'All' ? t('csp.all_courses') : t(category)}
                </span>
              </div>
              {total > 0 && (
                <span style={{ fontSize:12, color:C.dim, fontWeight:500 }}>
                  {t('csp.courses_found', { count: total })}
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="csp-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:24 }}>
              {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          ) : courses.length === 0 ? (
            <div style={{
              textAlign:'center', padding:'80px 20px',
              background:'var(--fm-surface-hover-soft)',
              border:`1px solid ${C.border}`, borderRadius:24,
            }}>
              <div style={{
                width:64, height:64, borderRadius:20, margin:'0 auto 20px',
                background:'rgba(13,148,136,0.08)', border:'1px solid rgba(13,148,136,0.22)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={C.accentBr} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <p style={{ fontSize:18, fontWeight:800, color:C.text, margin:'0 0 8px' }}>{t('csp.no_courses_found')}</p>
              <p style={{ fontSize:13, color:C.muted, margin:'0 0 22px', lineHeight:1.6 }}>
                {search ? t('csp.no_results_for', { query: search }) : t('csp.adjust_filters')}
              </p>
              {(search || category !== 'All' || priceFilter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setCategory('All'); setPriceFilter('all'); }}
                  style={{
                    fontSize:13, fontWeight:700, color:C.accentBr,
                    background:'rgba(13,148,136,0.08)', border:`1px solid rgba(94,234,212,0.25)`,
                    borderRadius:10, padding:'9px 22px', cursor:'pointer',
                    transition:'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(13,148,136,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(13,148,136,0.08)'}>
                  {t('csp.clear_filters')}
                </button>
              )}
            </div>
          ) : (
            <div className="csp-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:24 }}>
              {courses.map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} onDeleted={id => setCourses(prev => prev.filter(x => x.id !== id))} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE}
            onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            accent={C.accentBr} loading={loading} />
        </div>
      </div>

      {/* ══ Type chooser modal ══ */}
      {showTypeModal && (
        <div
          style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--fm-overlay)', backdropFilter:'blur(8px)' }}
          onClick={() => { setShowTypeModal(false); setSelectedType('free'); }}>
          <div
            style={{ width:'100%', maxWidth:340, background:'var(--fm-surface)', border:`1px solid ${C.border}`, borderRadius:24, padding:28, boxShadow:'0 24px 64px var(--fm-shadow)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <p style={{ fontSize:17, fontWeight:900, color:C.text, margin:0 }}>{t('csp.course_type')}</p>
              <button
                onClick={() => { setShowTypeModal(false); setSelectedType('free'); }}
                style={{ width:32, height:32, borderRadius:10, background:'var(--fm-surface-hover)', border:'none', color:C.muted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IcX />
              </button>
            </div>
            <div style={{ display:'flex', padding:4, borderRadius:16, background:'var(--fm-border-soft)', marginBottom:22 }}>
              {[['free',t('cc.free'),'#5eead4'],['paid',t('csp.paid'),'#fbbf24']].map(([v,l,col]) => (
                <button key={v} onClick={() => setSelectedType(v)}
                  style={{
                    flex:1, padding:'13px', borderRadius:12,
                    fontSize:13, fontWeight:700, cursor:'pointer', border:'none', transition:'all .2s',
                    background: selectedType===v ? C.bg        : 'transparent',
                    color:      selectedType===v ? col          : C.muted,
                    boxShadow:  selectedType===v ? '0 2px 10px var(--fm-shadow)' : 'none',
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowTypeModal(false); setCreateType(selectedType); setShowCreateModal(true); }}
              style={{
                width:'100%', padding:'14px', borderRadius:14, border:'none', color:'#fff',
                fontSize:14, fontWeight:700, cursor:'pointer', transition:'opacity .15s',
                background: selectedType==='free'
                  ? `linear-gradient(135deg,${C.accent},${C.emerald})`
                  : 'linear-gradient(135deg,#d97706,#f59e0b)',
                boxShadow: selectedType==='free'
                  ? `0 4px 14px -3px rgba(16,185,129,0.5)`
                  : `0 4px 14px -3px rgba(245,158,11,0.5)`,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              {t('csp.continue_arrow')}
            </button>
          </div>
        </div>
      )}

      {/* ══ Create Course Modal ══ */}
      {showCreateModal && user && (
        <CreateCourseModal
          user={user}
          initialType={createType}
          onClose={() => setShowCreateModal(false)}
          onBack={null}
          onCreated={fetchCourses}
        />
      )}

      <style>{`
        @media (max-width:640px) {
          .csp-filter-inner { height:auto !important; flex-wrap:wrap !important; padding:8px 12px !important; gap:6px !important; }
          .csp-filter-pills { width:100% !important; padding-right:0 !important; }
          .csp-filter-right { border-left:none !important; padding-left:0 !important; margin-left:0 !important; width:100% !important; justify-content:space-between !important; }
          .csp-stats-row { gap:6px 0 !important; }
          .csp-stat-item { min-width:50% !important; justify-content:center !important; padding:10px 0 !important; }
          .csp-stat-sep  { display:none !important; }
          .csp-grid { grid-template-columns:1fr !important; gap:14px !important; }
          .csp-content { padding:20px 14px 0 !important; }
          .csp-filter-right { gap:6px !important; padding-left:10px !important; margin-left:4px !important; }
          .csp-filter-count { display:none !important; }
        }
        @keyframes cpBlob1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(55px,-45px) scale(1.08)} 66%{transform:translate(-35px,32px) scale(0.95)} }
        @keyframes cpBlob2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-55px,42px) scale(1.06)} 70%{transform:translate(22px,-22px) scale(0.97)} }
        @keyframes cpBlob3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(38px,38px) scale(1.1)} }
        @keyframes cpBlob4  { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-32px,-28px) scale(1.07)} }
        @keyframes cpPulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes cpShimmer{ 0%{transform:translateX(-200%)} 100%{transform:translateX(200%)} }
        input::placeholder  { color: var(--fm-text-7); }
        select option       { background: var(--fm-surface); color: var(--fm-text-4); }
      `}</style>
    </div>
  );
}
