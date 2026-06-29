import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ChatDrawer from '../components/ChatDrawer';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
const getLastName = name => { const p = (name||'').trim().split(/\s+/); return p[p.length - 1] || name; };

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

const CATEGORY_KEYWORDS = {
  Technology:   ['develop','react','node','javascript','python','java','angular','vue','code','backend','frontend','fullstack','flutter','mobile','php','laravel','html','css','typescript','tech','software','app','web','api','saas'],
  Design:       ['design','figma','ui','ux','graphic','illustr','brand','logo','visual','photoshop','sketch','creative'],
  Marketing:    ['marketing','seo','ads','social media','content','growth','campaign','email','analytics','digital'],
  Writing:      ['writing','copywriting','content','blog','article','editorial','rédact','translation','video','motion','animation','premiere','montage','editing','cinema','vfx'],
  'E-commerce': ['ecommerce','e-commerce','shop','store','woocommerce','shopify','payment','cart','boutique','retail'],
  Finance:      ['finance','compta','accounting','audit','tax','fiscalit','invest','budget','excel'],
};

const TINTS = [
  ['#7c6cf6','rgba(124,108,246,0.18)'],
  ['#a855f7','rgba(168,85,247,0.18)'],
  ['#3b82f6','rgba(59,130,246,0.18)'],
  ['#0ea5e9','rgba(14,165,233,0.18)'],
  ['#10b981','rgba(16,185,129,0.18)'],
  ['#f59e0b','rgba(245,158,11,0.18)'],
  ['#f43f5e','rgba(244,63,94,0.18)'],
];
const getTint     = (email) => TINTS[(email?.charCodeAt(0) || 0) % TINTS.length];
const getInitials = (name)  => (name||'').trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

/* ── Icons ── */
const IcShield  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/></svg>;
const IcPin     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcChat    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcLink    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const IcSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
const IcChev    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcStar    = ({ on }) => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" style={{ color: on ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const IcStarBig = ({ on }) => <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" style={{ color: on ? '#f59e0b' : 'rgba(255,255,255,0.18)', cursor:'pointer', transition:'color .1s' }}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;

function StarRow({ value, count }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
      <span style={{ display:'inline-flex', gap:1 }}>
        {[1,2,3,4,5].map(i => <IcStar key={i} on={i <= Math.round(value)} />)}
      </span>
      <strong style={{ fontSize:12, color:'#fbfbff', marginLeft:2 }}>{value.toFixed(1)}</strong>
      <span style={{ fontSize:12, color:'#7e82a0' }}>({count})</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FreelancerCard
   ══════════════════════════════════════════════════════════════════ */
function FreelancerCard({ freelancer, reviews, onAddReview, currentUser, completedWith, navigate }) {
  const { t } = useTranslation();
  const [showReview, setShowReview] = useState(false);
  const [rating,     setRating]     = useState(0);
  const [hovStar,    setHovStar]    = useState(0);
  const [comment,    setComment]    = useState('');
  const [ratingErr,  setRatingErr]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const key             = freelancer.email?.toLowerCase();
  const myReviews       = reviews[key] || [];
  const avgRating       = myReviews.length > 0 ? myReviews.reduce((s,r) => s + r.rating, 0) / myReviews.length : 0;
  const isOwn           = currentUser?.email?.toLowerCase() === key;
  const isClient        = currentUser?.role === 'client';
  const alreadyReviewed = currentUser && myReviews.some(r => r.clientEmail === currentUser.email?.toLowerCase());
  const hasCompleted    = completedWith?.includes(key);
  const canReview       = isClient && !isOwn && !alreadyReviewed && (hasCompleted || myReviews.length === 0);
  const skillTags       = freelancer.skills ? freelancer.skills.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const memberYear      = freelancer.registeredAt ? new Date(freelancer.registeredAt).getFullYear() : null;
  const [tintFg, tintBg] = getTint(freelancer.email);
  const inits           = getInitials(freelancer.name);
  const availDot        = freelancer.availability === 'unavailable' ? '#ef4444'
                        : freelancer.availability === 'busy'        ? '#f59e0b' : '#10b981';
  const availLabel      = freelancer.availability === 'unavailable' ? t('Unavailable')
                        : freelancer.availability === 'busy'        ? t('Busy') : t('Available');

  async function submitReview(e) {
    e.preventDefault();
    if (!rating) { setRatingErr(true); return; }
    if (!comment.trim()) return;
    setSubmitting(true);
    await onAddReview(key, {
      clientName: currentUser.name, clientEmail: currentUser.email?.toLowerCase(),
      rating, comment: comment.trim(), createdAt: new Date().toISOString(),
    });
    setShowReview(false); setRating(0); setComment(''); setRatingErr(false);
    setSubmitting(false);
  }

  return (
    <div style={{ background:'rgba(255,255,255,0.026)', border:'1px solid rgba(255,255,255,0.075)', borderRadius:24, padding:'26px 30px', transition:'all .28s cubic-bezier(.4,0,.2,1)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,108,246,0.35)'; e.currentTarget.style.background='rgba(124,108,246,0.045)'; e.currentTarget.style.boxShadow='0 16px 48px -12px rgba(124,108,246,0.2), 0 0 0 1px rgba(124,108,246,0.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.075)'; e.currentTarget.style.background='rgba(255,255,255,0.026)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}>

      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* Avatar — clickable → profile */}
        <div
          onClick={() => navigate(`/profile/${encodeURIComponent(freelancer.email)}`)}
          title="View profile"
          style={{ width:64, height:64, borderRadius:'50%', flexShrink:0, background:tintBg, color:tintFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:22, overflow:'hidden', border:`2.5px solid ${tintFg}40`, boxShadow:`0 0 0 4px ${tintBg}`, cursor:'pointer', transition:'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow=`0 0 0 4px ${tintBg}, 0 0 0 6px ${tintFg}40`; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=`0 0 0 4px ${tintBg}`; }}>
          {freelancer.photo
            ? <img src={freelancer.photo.startsWith('data:') ? freelancer.photo : cldImg(freelancer.photo)}
                alt={freelancer.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}
                onError={e => { e.target.style.display='none'; }} />
            : inits}
        </div>

        {/* Center info */}
        <div style={{ flex:1, minWidth:0 }}>

          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'4px 8px', marginBottom:3 }}>
            <span
              onClick={() => navigate(`/profile/${encodeURIComponent(freelancer.email)}`)}
              style={{ fontSize:17, fontWeight:900, color:'#f9f8ff', letterSpacing:'-0.02em', lineHeight:1.2, cursor:'pointer', textDecoration:'none', transition:'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color='#c4baff'}
              onMouseLeave={e => e.currentTarget.style.color='#f9f8ff'}>{getLastName(freelancer.name)}</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10.5, fontWeight:800, color:'#3ec2e8', background:'rgba(62,194,232,0.08)', border:'1px solid rgba(62,194,232,0.2)', padding:'3px 8px', borderRadius:20 }}>
              <IcShield /> {t('Verified')}
            </span>
            {freelancer.region && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:12, color:'#62668a', fontWeight:500 }}>
                <IcPin /> {freelancer.region}
              </span>
            )}
            {memberYear && <span style={{ fontSize:12, color:'#4a4e6e', fontWeight:500 }}>· {t('Since {{year}}', { year: memberYear })}</span>}
            {avgRating > 0 && <StarRow value={avgRating} count={myReviews.length} />}
          </div>

          {freelancer.title && (
            <p style={{ fontSize:13, fontWeight:700, color:'#9b8cff', margin:'0 0 7px', letterSpacing:'0.01em', textTransform:'uppercase' }}>
              {freelancer.title}
            </p>
          )}

          {freelancer.bio && (
            <p style={{ fontSize:13, color:'#8a8eb0', margin:'0 0 11px', lineHeight:1.65, fontStyle:'italic' }}>
              {freelancer.bio}
            </p>
          )}

          {skillTags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {skillTags.map(s => (
                <span key={s} style={{ fontSize:11.5, fontWeight:700, color:'#7c6cf6', background:'rgba(124,108,246,0.09)', border:'1px solid rgba(124,108,246,0.18)', borderRadius:20, padding:'3px 11px' }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {freelancer.portfolio_url && (
            <a href={/^https?:\/\//.test(freelancer.portfolio_url) ? freelancer.portfolio_url : `https://${freelancer.portfolio_url}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, color:'#6ee7b7', textDecoration:'none', padding:'5px 12px', borderRadius:10, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.22)', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(16,185,129,0.16)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.42)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(16,185,129,0.07)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.22)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <IcLink /> {t('View portfolio')}
              <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.6}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}


          {myReviews.length > 0 && (
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
              {myReviews.map((r, i) => (
                <div key={i} style={{ padding:'11px 14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#dcdef0' }}>{r.clientName}</span>
                    <span style={{ display:'inline-flex', gap:1 }}>
                      {[1,2,3,4,5].map(i2 => <IcStar key={i2} on={i2 <= r.rating} />)}
                    </span>
                  </div>
                  <p style={{ fontSize:12.5, color:'#7e82a0', margin:0, lineHeight:1.5 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          {showReview && (
            <form onSubmit={submitReview} style={{ marginTop:14, padding:'14px 16px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#62668a', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{t('Leave a review')}</p>
              <div>
                <div style={{ display:'inline-flex', gap:4 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} onClick={() => { setRating(i); setRatingErr(false); }} onMouseEnter={() => setHovStar(i)} onMouseLeave={() => setHovStar(0)}>
                      <IcStarBig on={i <= (hovStar || rating)} />
                    </span>
                  ))}
                </div>
                {ratingErr && <p style={{ fontSize:11, color:'#f87171', margin:'4px 0 0' }}>{t('Please choose a rating.')}</p>}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t('Your comment…')} rows={3} required
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#f4f3fb', fontFamily:'inherit', fontSize:13, padding:'10px 12px', outline:'none', resize:'none' }}
                onFocus={e => { e.target.style.borderColor='rgba(124,108,246,0.4)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; }} />
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={submitting || !comment.trim()}
                  style={{ padding:'8px 18px', borderRadius:10, background:'#7c6cf6', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!comment.trim()||submitting)?0.5:1 }}>
                  {t('Submit')}
                </button>
                <button type="button" onClick={() => { setShowReview(false); setRating(0); setComment(''); setRatingErr(false); }}
                  style={{ padding:'8px 14px', borderRadius:10, background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#7e82a0', fontSize:13, cursor:'pointer' }}>
                  {t('Cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'stretch', gap:10, flexShrink:0, width:168 }}>

          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'flex-end', gap:6, fontSize:12.5, fontWeight:700, color:availDot }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:availDot, boxShadow:`0 0 6px ${availDot}`, flexShrink:0 }} />
            {availLabel}
          </div>

          <div style={{ height:1, background:'rgba(255,255,255,0.06)', borderRadius:1 }} />

          {isOwn ? (
            <a href="/dashboard?tab=profile"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:12, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px -4px rgba(124,108,246,0.5)', transition:'opacity .15s', marginTop:'auto' }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t('Edit profile')}
            </a>
          ) : currentUser ? (
            <>
              <button onClick={() => navigate(`/messages?with=${encodeURIComponent(freelancer.email)}`)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:12, background:'none', border:'1px solid rgba(124,108,246,0.35)', color:'#b5aaff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(124,108,246,0.12)'; e.currentTarget.style.borderColor='rgba(124,108,246,0.6)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(124,108,246,0.35)'; e.currentTarget.style.color='#b5aaff'; }}>
                <IcChat /> {t('Message')}
              </button>
            </>
          ) : null}

          {canReview && !showReview && (
            <button onClick={() => setShowReview(true)}
              style={{ fontSize:12, color:'#4a4e6e', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontWeight:600, textAlign:'center', transition:'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#9b8cff'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#4a4e6e'; }}>
              <svg width={12} height={12} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {t('Leave a review')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function FreelancersPage() {
  const { t } = useTranslation();
  const { users, user } = useAuth();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  const [search,   setSearch]   = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('All');
  const [sortBy,   setSortBy]   = useState('rating');
  const [reviews,  setReviews]  = useState({});
  const [completedWith, setCompletedWith] = useState([]);

  const isLocal  = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const approved = (users||[]).filter(u => u?.role === 'freelancer' && (isLocal || u?.cinStatus === 'approved'));

  const fetchReviews = useCallback(async () => {
    if (!approved.length) return;
    try {
      const emails  = approved.map(u => u.email);
      const results = await Promise.all(
        emails.map(email => fetch(`${API}/reviews/${encodeURIComponent(email)}`).then(r=>r.json()).catch(()=>[]))
      );
      const map = {};
      emails.forEach((email, i) => {
        map[email.toLowerCase()] = (results[i]||[]).map(r => ({
          clientName: r.client_name, clientEmail: r.client_email,
          rating: r.rating, comment: r.comment,
        }));
      });
      setReviews(map);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const fetchCompleted = useCallback(async () => {
    if (!user || user.role !== 'client') return;
    try {
      const res  = await fetch(`${API}/tasks/${encodeURIComponent(user.email.toLowerCase())}`);
      const data = await res.json();
      if (Array.isArray(data)) setCompletedWith(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchReviews(); },   [fetchReviews]);
  useEffect(() => { fetchCompleted(); }, [fetchCompleted]);

  const filtered = approved.filter(f => {
    const q   = search.toLowerCase();
    const ok  = !search || f.name?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q)
              || f.skills?.toLowerCase().includes(q) || f.bio?.toLowerCase().includes(q);
    const hay = `${f.skills||''} ${f.bio||''} ${f.title||''}`.toLowerCase();
    const cat = category === 'All' || hay.includes(category.toLowerCase())
              || (CATEGORY_KEYWORDS[category]||[]).some(kw => hay.includes(kw));
    return ok && cat;
  }).sort((a, b) => {
    const rA = reviews[a.email?.toLowerCase()] || [];
    const rB = reviews[b.email?.toLowerCase()] || [];
    if (sortBy === 'rating') {
      const ra = rA.reduce((s,r)=>s+r.rating,0) / (rA.length||1);
      const rb = rB.reduce((s,r)=>s+r.rating,0) / (rB.length||1);
      return rb - ra;
    }
    if (sortBy === 'reviews') return rB.length - rA.length;
    if (sortBy === 'newest')  return new Date(b.registeredAt||0) - new Date(a.registeredAt||0);
    return (a.name||'').localeCompare(b.name||'');
  });

  async function handleAddReview(freelancerEmail, review) {
    try {
      await fetch(`${API}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerEmail, clientEmail: review.clientEmail, clientName: review.clientName, rating: review.rating, comment: review.comment }),
      });
      fetchReviews();
    } catch {}
  }

  const totalRegions = new Set(approved.map(f => f.region).filter(Boolean)).size;
  const totalReviews = Object.values(reviews).flat().length;

  return (
    <div style={{ minHeight:'100vh', background:'#0a0817', position:'relative', paddingBottom:80 }}>

      {/* ══ ANIMATED BACKGROUND BLOBS ══ */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,108,246,0.16) 0%, transparent 68%)', top:'-280px', left:'-180px', animation:'fpBlob1 18s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.11) 0%, transparent 68%)', top:'30%', right:'-200px', animation:'fpBlob2 22s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 68%)', bottom:'-80px', left:'25%', animation:'fpBlob3 26s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,108,246,0.07) 0%, transparent 68%)', top:'55%', left:'10%', animation:'fpBlob4 20s ease-in-out infinite reverse' }} />
      </div>

      {/* Content wrapper above blobs */}
      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Header ── */}
        <div style={{ background:'radial-gradient(ellipse 1100px 520px at 50% -10%, rgba(124,108,246,0.16), transparent 65%), radial-gradient(ellipse 700px 380px at 90% -6%, rgba(168,85,247,0.11), transparent 65%)', borderBottom:'1px solid rgba(255,255,255,0.055)', paddingBottom:56, textAlign:'center' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(88px,10vw,100px) clamp(16px,4vw,24px) 0' }}>

          {/* Headline */}
          <h1 style={{ fontSize:'clamp(32px,8vw,54px)', fontWeight:900, color:'#f4f3fb', margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.07 }}>
            <span style={{ background:'linear-gradient(120deg,#c4baff 0%,#9b8cff 42%,#7c6cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {t('Hire a freelancer')}
            </span>
          </h1>

          <p style={{ fontSize:'clamp(14px,2vw,16px)', color:'#7e82a0', margin:'0 auto 38px', lineHeight:1.7, letterSpacing:'0.01em', maxWidth:480 }}>
            {t('Verified Tunisian talent, ready to start your projects.')}
          </p>

          {/* Search */}
          <div className="fm-search-wrap" style={{ position:'relative', maxWidth:560, margin:'0 auto 44px' }}>
            <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#62668a', pointerEvents:'none' }}>
              <IcSearch />
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('Name, skill, region…')}
              className="fm-search-input"
              style={{ width:'100%', boxSizing:'border-box', padding:'15px 130px 15px 48px', borderRadius:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#f4f3fb', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s, background .2s' }}
              onFocus={e => { e.target.style.borderColor='rgba(124,108,246,0.5)'; e.target.style.background='rgba(124,108,246,0.04)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }} />
            <button
              style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', padding:'9px 24px', borderRadius:12, background:'linear-gradient(135deg,#9b8cff,#7c6cf6)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'opacity .15s', boxShadow:'0 4px 16px -4px rgba(124,108,246,0.65)' }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}>
              {t('Search')}
            </button>
          </div>

          {/* Stats row with separators */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, flexWrap:'wrap' }}>
            {[
              { n: approved.length, label: t('Verified freelancers') },
              { n: totalRegions,    label: t('Regions covered')      },
              { n: totalReviews,    label: t('Reviews received')     },
              { n: filtered.length, label: t('Matching now')         },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                {i > 0 && <span style={{ width:1, height:36, background:'rgba(255,255,255,0.08)', margin:'0 clamp(12px,3vw,32px)' }} />}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:900, color:'#9b8cff', lineHeight:1.1, letterSpacing:'-0.03em' }}>{s.n}</div>
                  <div style={{ fontSize:11, color:'#62668a', fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>{/* end header gradient wrapper */}

        {/* ── STICKY FILTER BAR ── */}
        <div style={{ position:'sticky', top:64, zIndex:20, background:'rgba(10,8,23,0.94)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(255,255,255,0.07)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height:58, gap:0 }}>

            {/* Scrollable category pills */}
            <div style={{ flex:1, display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', minWidth:0, paddingRight:4 }}>
              {CATEGORIES.map(cat => {
                const active = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s',
                      background: active ? 'rgba(124,108,246,0.18)' : 'transparent',
                      border:     active ? '1px solid rgba(124,108,246,0.55)' : '1px solid rgba(255,255,255,0.09)',
                      color:      active ? '#c4baff' : '#62668a' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; e.currentTarget.style.color='#a7abc8'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.color='#62668a'; }}}>
                    <span style={{ display:'flex', alignItems:'center' }}>{CAT_SVG[cat]}</span>
                    {t(cat)}
                  </button>
                );
              })}
            </div>

            {/* Separator + count + sort */}
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:14, borderLeft:'1px solid rgba(255,255,255,0.08)', paddingLeft:16, marginLeft:8 }}>
              <span style={{ fontSize:12, color:'#4a4e6e', whiteSpace:'nowrap' }}>
                <strong style={{ color:'#9b8cff', fontWeight:700 }}>{filtered.length}</strong>
                <span style={{ color:'#4a4e6e' }}> {t('Freelancers').toLowerCase()}</span>
              </span>
              <div style={{ position:'relative' }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ padding:'7px 30px 7px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#9ca3af', fontSize:12, outline:'none', cursor:'pointer', appearance:'none', fontFamily:'inherit' }}>
                  <option value="rating">{t('Top rated')}</option>
                  <option value="reviews">{t('Most reviews')}</option>
                  <option value="newest">{t('Newest')}</option>
                  <option value="name">{t('A → Z')}</option>
                </select>
                <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#62668a' }}><IcChev /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Freelancer list ── */}
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px clamp(16px,3vw,24px) 0', display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'70px 20px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c6cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <p style={{ fontSize:15, fontWeight:800, color:'#c2c5dd', margin:'0 0 6px' }}>{t('No freelancers found')}</p>
              <p style={{ fontSize:13, color:'#62668a', margin:'0 0 18px' }}>{t('Try a different search or category.')}</p>
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ fontSize:13, fontWeight:700, color:'#9b8cff', background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.2)', borderRadius:10, padding:'8px 18px', cursor:'pointer' }}>
                  {t('Clear search')}
                </button>
              )}
            </div>
          ) : filtered.map(f => (
            <FreelancerCard
              key={f.email}
              freelancer={f}
              reviews={reviews}
              onAddReview={handleAddReview}
              currentUser={user}
              completedWith={completedWith}
              navigate={navigate}
            />
          ))}

          {filtered.length > 0 && (
            <p style={{ textAlign:'center', fontSize:13, color:'#4a4e6e', padding:'10px 0 4px' }}>
              {t('freelancers shown', { count: filtered.length })}
            </p>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fpPulse {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(155,140,255,0.5); }
          50%      { opacity:0.6; box-shadow:0 0 0 5px rgba(155,140,255,0); }
        }
        @keyframes fpBlob1 {
          0%,100% { transform:translate(0,0) scale(1); }
          33%      { transform:translate(50px,-40px) scale(1.07); }
          66%      { transform:translate(-30px,35px) scale(0.95); }
        }
        @keyframes fpBlob2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(-60px,45px) scale(1.05); }
          70%     { transform:translate(25px,-25px) scale(0.97); }
        }
        @keyframes fpBlob3 {
          0%,100% { transform:translate(0,0) scale(1); }
          50%     { transform:translate(40px,40px) scale(1.1); }
        }
        @keyframes fpBlob4 {
          0%,100% { transform:translate(0,0) scale(1); }
          45%     { transform:translate(-35px,-30px) scale(1.06); }
        }
      `}</style>
    </div>
  );
}
