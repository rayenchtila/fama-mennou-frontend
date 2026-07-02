import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { uploadVideo, warmVideoUpload } from '../utils/upload';
import { cldImg } from '../utils/cloudinary';
import SEOHead, { CourseJsonLd } from '../components/Seohead';

const API    = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
const IS_DEV = process.env.REACT_APP_DEV_MODE === 'true';

const C = {
  bg:     '#0a0817',
  accent: '#7c6cf6',
  purple: '#a855f7',
  emerald:'#10b981',
  amber:  '#f59e0b',
  rose:   '#f43f5e',
  sky:    '#0ea5e9',
  text:   '#f1f5f9',
  muted:  '#94a3b8',
  dim:    '#475569',
  card:   'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
};

const GS = `
@keyframes cdB1{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(55px,-45px)scale(1.14)}66%{transform:translate(-38px,52px)scale(0.91)}}
@keyframes cdB2{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(-65px,32px)scale(1.09)}66%{transform:translate(48px,-58px)scale(0.94)}}
@keyframes cdB3{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(42px,38px)scale(1.11)}}
@keyframes cdB4{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-48px,-28px)scale(1.07)}}
@keyframes cdSpin{to{transform:rotate(360deg)}}
@keyframes cdUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes cdPls{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes cdShim{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes soonDot{0%,80%,100%{opacity:0}40%{opacity:1}}
`;

/* ── helpers ── */
function fmtNum(n){return n>=1000?(n/1000).toFixed(1).replace(/\.0$/,'')+'k':String(n||0);}
function relTime(iso){if(!iso)return'';const d=(Date.now()-new Date(iso))/1000;if(d<60)return'à l\'instant';if(d<3600)return`il y a ${Math.floor(d/60)}m`;if(d<86400)return`il y a ${Math.floor(d/3600)}h`;return`il y a ${Math.floor(d/86400)}j`;}

/* ── StarRating ── */
function StarRating({rating=0,interactive=false,onRate,size=17}){
  const [hov,setHov]=useState(0);
  const disp=interactive?(hov||rating):rating;
  return(
    <div style={{display:'flex',alignItems:'center',gap:3}}>
      {[1,2,3,4,5].map(s=>(
        <button key={s} type="button"
          onClick={()=>interactive&&onRate?.(s)}
          onMouseEnter={()=>interactive&&setHov(s)}
          onMouseLeave={()=>interactive&&setHov(0)}
          style={{background:'none',border:'none',padding:0,cursor:interactive?'pointer':'default'}}>
          <svg width={size} height={size} fill={s<=Math.round(disp)?C.amber:C.dim} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ── Avatar ── */
function Avatar({name,photo,size=40}){
  return(
    <div style={{width:size,height:size,borderRadius:size*0.26,background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:size*0.38,flexShrink:0,overflow:'hidden'}}>
      {photo?<img src={cldImg(photo)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(name||'?')[0].toUpperCase()}
    </div>
  );
}

/* ── Chip ── */
function Chip({label,col}){
  return <span style={{display:'inline-block',padding:'2px 9px',borderRadius:20,background:`${col}1a`,border:`1px solid ${col}44`,color:col,fontSize:11,fontWeight:700,flexShrink:0}}>{label}</span>;
}

/* ── LockIcon ── */
function LockSvg(){
  return(
    <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={C.dim} strokeWidth={2} style={{flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  );
}

/* ── PlaySvg ── */
function PlaySvg({size=18,col=C.accent}){
  return(
    <svg width={size} height={size} fill={col} viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function CourseDetailPage() {
  const { t }      = useTranslation();
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [sp]       = useSearchParams();

  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [purchases,    setPurchases]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('curriculum');

  const [buying,        setBuying]        = useState(false);
  const [buyMsg,        setBuyMsg]        = useState('');
  const [buyMsgOk,      setBuyMsgOk]      = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [requesting,    setRequesting]    = useState(false);
  const [lockedMsg,     setLockedMsg]     = useState(false);

  const [myRating,    setMyRating]    = useState(0);
  const [myReview,    setMyReview]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [replyDraft,  setReplyDraft]  = useState({});
  const [replyingId,  setReplyingId]  = useState(null);
  const [replySend,   setReplySend]   = useState(false);

  const [showDisc,    setShowDisc]    = useState(false);
  const [discInput,   setDiscInput]   = useState('');
  const [discSaving,  setDiscSaving]  = useState(false);

  const [showAdd,      setShowAdd]      = useState(false);
  const [lessSub,      setLessSub]      = useState(false);
  const [newLesson,    setNewLesson]    = useState({title:'',video_url:'',is_free_preview:true,price:0});
  const [addingL,      setAddingL]      = useState(false);
  const [upState,      setUpState]      = useState('idle');
  const [upPct,        setUpPct]        = useState(0);
  const [upFile,       setUpFile]       = useState('');
  const muxRef = {current:null};

  const isInstructor  = course && user?.email?.toLowerCase() === course.creator_email?.toLowerCase();
  const hasFull       = purchases.some(p => !p.lesson_id);
  const visLessons    = lessons.filter(l => l.status !== 'rejected' || user?.isAdmin || isInstructor);

  function canWatch(l) {
    if (l.is_free_preview) return true;
    if (!user) return false;
    if (user.isAdmin || isInstructor || hasFull) return true;
    return false;
  }

  /* ── data ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/courses/${id}`).then(r=>r.json()),
      user?.email ? fetch(`${API}/course-purchases/user/${user.email}`).then(r=>r.json()) : Promise.resolve([]),
      user?.email ? fetch(`${API}/course-requests/status?email=${encodeURIComponent(user.email)}&courseId=${id}`).then(r=>r.json()).catch(()=>({status:null})) : Promise.resolve({status:null}),
    ]).then(([c,mp,rs]) => {
      setCourse(c);
      setPurchases(Array.isArray(mp)?mp.filter(p=>Number(p.course_id)===Number(id)):[]);
      setRequestStatus(rs?.status||null);
      setPaymentStatus(rs?.payment_status||null);
      setLoading(false);
      Promise.all([
        fetch(`${API}/lessons/course/${id}`).then(r=>r.json()),
        fetch(`${API}/course-reviews/course/${id}`).then(r=>r.json()),
        fetch(`${API}/live-sessions/course/${id}`).then(r=>r.json()),
      ]).then(([ls,rv,live]) => {
        setLessons(Array.isArray(ls)?ls:[]);
        setReviews(Array.isArray(rv)?rv:[]);
        setLiveSessions(Array.isArray(live)?live:[]);
        const tab=sp.get('tab');
        if(tab==='reviews'){
          setActiveTab('reviews');
          const hash=window.location.hash;
          if(hash.startsWith('#review-')){
            setTimeout(()=>{const el=document.getElementById(hash.slice(1));if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},200);
          }
        }
      }).catch(()=>{});
    }).catch(()=>setLoading(false));
  },[id,user?.email]);

  /* ── buyFull ── */
  async function buyFull() {
    if (!user) return;
    const isFreeC = Number(course?.full_price) === 0;
    const now = new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Africa/Tunis'});
    const aType = user.role==='client'?'Client':user.role==='freelancer'?'Freelancer':user.role||'Utilisateur';
    async function sendAdmin(title,cid,type,amt){
      const msg=type==='free'
        ?`Bonjour Fama Mennou TEAM 👋\n\nJe viens de m'inscrire au cours gratuit suivant.\n\n👤 Nom complet : ${user.name||'N/A'}\n📧 Email : ${user.email}\n🏷️ Type de compte : ${aType}\n\n📚 Cours : ${title} (ID: #${cid})\n\n📅 Date : ${now}`
        :`Je veux acheter ce cours "${title}" du ${now} avec montant ${amt} TND.`;
      try{await fetch(`${API}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderEmail:user.email,receiverEmail:'admin@famamennou.com',content:msg})});}catch{}
      if(type==='paid'){
        try{await fetch(`${API}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderEmail:'admin@famamennou.com',receiverEmail:user.email,content:`Avec plaisir Mr/Mme ${user.name||''}, merci d'envoyer votre preuve de paiement afin que nous puissions activer l'accès au cours. Merci pour votre confiance.`})});}catch{}
      }
    }
    if(isFreeC){
      setBuying(true);setBuyMsg('');
      try{
        const r=await fetch(`${API}/course-purchases`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({buyer_email:user.email,course_id:id})});
        const d=await r.json();
        if(d.success){setPurchases(p=>[...p,{course_id:id,lesson_id:null}]);setBuyMsg(t('cdp.enroll_success'));setBuyMsgOk(true);sendAdmin(course?.title||`Cours #${id}`,id,'free');}
        else{setBuyMsg(t('cdp.enroll_failed'));setBuyMsgOk(false);}
      }catch{setBuyMsg(t('cdp.enroll_failed'));setBuyMsgOk(false);}
      finally{setBuying(false);}
      return;
    }
    setRequesting(true);setBuyMsg('');setBuyMsgOk(null);
    try{
      const r=await fetch(`${API}/course-requests`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_email:user.email,user_name:user.name||'',course_id:id})});
      const d=await r.json();
      if(d.success){
        if(d.already_has_access){setPurchases(p=>[...p,{course_id:id,lesson_id:null}]);}
        else{
          setRequestStatus(d.status||'pending');setBuyMsg(t('cdp.request_sent'));setBuyMsgOk(true);
          const _d=Number(course?.discount_pct)||0,_fp=Number(course?.full_price)||0;
          await sendAdmin(course?.title||`Cours #${id}`,id,'paid',(_d>0?_fp*(1-_d/100):_fp).toFixed(2));
          navigate('/messages?with=admin@famamennou.com');
        }
      }else{setBuyMsg(t('cdp.request_failed'));setBuyMsgOk(false);}
    }catch{setBuyMsg(t('cdp.request_failed'));setBuyMsgOk(false);}
    finally{setRequesting(false);}
  }

  /* ── discount ── */
  async function saveDisc(){
    const pct=Math.max(0,Math.min(100,Math.round(Number(discInput))));
    setDiscSaving(true);
    try{
      const r=await fetch(`${API}/courses/${id}/discount`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({discount_pct:pct,instructor_email:user.email})});
      const d=await r.json();
      if(d.id){setCourse(p=>({...p,discount_pct:pct}));setShowDisc(false);setDiscInput('');}
    }catch{}
    setDiscSaving(false);
  }

  /* ── upload ── */
  async function handleUpload(file){
    if(!file)return;
    setUpFile(file.name);setUpState('uploading');setUpPct(0);
    for(let a=1;a<=2;a++){
      try{
        const res=await uploadVideo(file,'famamennou/videos',p=>setUpPct(p));
        setNewLesson(p=>({...p,video_url:res.secure_url}));setUpState('done');return;
      }catch{
        if(a<2){setUpPct(0);await new Promise(r=>setTimeout(r,1500));}
        else setUpState('error');
      }
    }
  }

  async function addLesson(e){
    e.preventDefault();
    if(!newLesson.title.trim()||!newLesson.video_url)return;
    setAddingL(true);
    try{
      const r=await fetch(`${API}/lessons`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_id:id,title:newLesson.title.trim(),video_url:newLesson.video_url||'',is_free_preview:newLesson.is_free_preview,price:newLesson.is_free_preview?0:Number(newLesson.price)||0})});
      const d=await r.json();
      if(d.id){setLessons(p=>[...p,d]);setNewLesson({title:'',video_url:'',is_free_preview:true,price:0});setUpFile('');setShowAdd(false);setLessSub(true);setTimeout(()=>setLessSub(false),6000);}
    }catch{}
    setAddingL(false);
  }

  /* ── reviews ── */
  async function submitReview(){
    if(!myRating||!user)return;
    setSubmitting(true);
    try{
      const r=await fetch(`${API}/course-reviews`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_id:id,reviewer_email:user.email,rating:myRating,review_text:myReview})});
      const d=await r.json();
      if(d.id){setReviews(p=>[{...d,reviewer_name:user.name},...p.filter(x=>x.reviewer_email!==user.email)]);setMyRating(0);setMyReview('');setCourse(p=>({...p,avg_rating:d.rating}));}
      else alert(d.error||t('cdp.failed'));
    }catch{}finally{setSubmitting(false);}
  }

  async function submitReply(rid,text){
    const txt=(text||'').trim();if(!txt||!user)return;
    setReplySend(true);
    try{
      const r=await fetch(`${API}/course-reviews/${rid}/reply`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({instructor_email:user.email,reply:txt})});
      const d=await r.json();
      if(d.id){setReviews(p=>p.map(rv=>rv.id===rid?{...rv,instructor_reply:d.instructor_reply,replied_at:d.replied_at}:rv));setReplyingId(null);setReplyDraft(p=>{const n={...p};delete n[rid];return n;});}
      else alert(d.error||t('cdp.error'));
    }catch(e){alert(t('cdp.network_error')+': '+e.message);}
    finally{setReplySend(false);}
  }

  /* ── loading / error ── */
  if(loading) return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <style>{GS}</style>
      <div style={{width:42,height:42,borderRadius:'50%',border:`3px solid ${C.border}`,borderTopColor:C.accent,animation:'cdSpin .85s linear infinite'}}/>
      <p style={{color:C.muted,fontSize:14,fontWeight:600}}>{t('cdp.loading')}</p>
    </div>
  );

  if(!course||course.error) return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
      <style>{GS}</style>
      <div style={{width:72,height:72,borderRadius:20,background:'rgba(124,108,246,.1)',border:'1px solid rgba(124,108,246,.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width={34} height={34} fill="none" viewBox="0 0 24 24" stroke="rgba(124,108,246,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p style={{color:C.text,fontWeight:700,fontSize:18}}>{t('cdp.not_found')}</p>
      <button onClick={()=>navigate('/courses')} style={{color:C.accent,background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{t('cdp.browse_courses')}</button>
    </div>
  );

  const isFree     = Number(course.full_price)===0;
  const discPct    = Number(course.discount_pct)||0;
  const finalPrice = discPct>0?Number(course.full_price)*(1-discPct/100):Number(course.full_price);
  const hasDisc    = !isFree&&discPct>0;
  const totalMin   = visLessons.reduce((s,l)=>s+(Number(l.duration_min)||0),0);

  const TABS=[
    {id:'curriculum',label:isInstructor?t('cdp.tab_my_lessons',{count:visLessons.length}):t('cdp.tab_lessons',{count:visLessons.length})},
    {id:'reviews',   label:isInstructor?t('cdp.tab_my_reviews',{count:reviews.length}):t('cdp.tab_reviews',{count:reviews.length})},
    {id:'live',      label:t('cdp.tab_live')},
  ];

  /* ── render ── */
  return(
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,position:'relative',overflowX:'hidden'}}>
      <SEOHead
        title={course.title}
        url={`/courses/${id}`}
        description={course.description ? course.description.slice(0, 155) : `${course.title} — Cours en ligne sur FamaMennou par ${course.creator_name || 'un formateur expert'}.`}
        image={course.cover_url || undefined}
        type="article"
        keywords={`${course.title}, cours en ligne, formation, ${course.category || 'tunisie'}, FamaMennou`}
      />
      <CourseJsonLd course={{ ...course, id }} />
      <style>{GS}</style>

      {/* blobs */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',width:680,height:680,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,108,246,.13) 0%,transparent 70%)',top:-180,left:-180,animation:'cdB1 22s ease-in-out infinite'}}/>
        <div style={{position:'absolute',width:580,height:580,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,.10) 0%,transparent 70%)',bottom:-140,right:-90,animation:'cdB2 28s ease-in-out infinite'}}/>
        <div style={{position:'absolute',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)',top:'40%',right:'20%',animation:'cdB3 20s ease-in-out infinite'}}/>
        <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,108,246,.08) 0%,transparent 70%)',bottom:'30%',left:'15%',animation:'cdB4 25s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,paddingTop:64}}>

        {/* ═══ HERO ═══ */}
        <div style={{background:'linear-gradient(180deg,rgba(124,108,246,.13) 0%,transparent 100%)',borderBottom:`1px solid ${C.border}`,padding:'44px 24px 52px'}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'flex',gap:40,alignItems:'flex-start',flexWrap:'wrap'}}>

            {/* Left */}
            <div style={{flex:'1 1 480px',minWidth:0,animation:'cdUp .5s ease both'}}>
              <button onClick={()=>navigate('/courses')} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.accent,fontWeight:700,fontSize:13,cursor:'pointer',marginBottom:22,padding:0}}>
                <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                {t('cdp.all_courses')}
              </button>

              <span style={{display:'inline-flex',alignItems:'center',padding:'4px 12px',borderRadius:20,background:'rgba(124,108,246,.16)',border:'1px solid rgba(124,108,246,.32)',color:C.accent,fontSize:11,fontWeight:800,letterSpacing:.5,textTransform:'uppercase',marginBottom:16}}>
                {course.category}
              </span>

              <h1 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:900,color:'#fff',lineHeight:1.2,margin:'0 0 14px',letterSpacing:'-.4px'}}>
                {course.title}
              </h1>
              <p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:22,maxWidth:640}}>
                {course.description}
              </p>

              {/* stats */}
              <div style={{display:'flex',alignItems:'center',gap:18,flexWrap:'wrap',marginBottom:26}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <svg width={15} height={15} fill={C.amber} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                  <span style={{color:'#fff',fontWeight:800,fontSize:14}}>{Number(course.avg_rating).toFixed(1)}</span>
                  <span style={{color:C.muted,fontSize:13}}>({t('cdp.reviews_count',{count:reviews.length})})</span>
                </div>
                {[
                    ['users',fmtNum(course.total_students),t('cdp.students')],
                    ['book',visLessons.length,t('cdp.lessons')],
                    totalMin>0?['clock',`${Math.floor(totalMin/60)}h${totalMin%60>0?' '+totalMin%60+'m':''}`,t('cdp.duration')]:null,
                  ].filter(Boolean).map(([ic,v,lb],i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:5}}>
                    {ic==='users' && <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                    {ic==='book'  && <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
                    {ic==='clock' && <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                    <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{v}</span>
                    <span style={{color:C.dim,fontSize:13}}>{lb}</span>
                  </div>
                ))}
              </div>

              {/* instructor */}
              <div onClick={() => navigate(`/profile/${encodeURIComponent(course.creator_email)}`)} style={{display:'inline-flex',alignItems:'center',gap:13,padding:'11px 18px',borderRadius:14,background:C.card,border:`1px solid ${C.border}`,cursor:'pointer'}}>
                <Avatar name={course.instructor_name||course.creator_email} photo={course.instructor_photo} size={42}/>
                <div>
                  <p style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:.3,textTransform:'uppercase',marginBottom:2}}>{t('cdp.instructor')}</p>
                  <p style={{color:'#fff',fontSize:14,fontWeight:700}}>{course.instructor_name||course.creator_email}</p>
                </div>
              </div>
            </div>

            {/* Right — buy card */}
            <div style={{width:340,flexShrink:0,animation:'cdUp .5s .1s ease both'}}>
              <div style={{borderRadius:20,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
                {course.thumbnail_url?(
                  <div style={{aspectRatio:'16/9',overflow:'hidden'}}>
                    <img src={cldImg(course.thumbnail_url)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                ):(
                  <div style={{aspectRatio:'16/9',background:'linear-gradient(135deg,rgba(124,108,246,.3),rgba(168,85,247,.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width={52} height={52} fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.5)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                )}

                <div style={{padding:'22px 22px 24px'}}>
                  {/* price */}
                  <div style={{marginBottom:18}}>
                    {isFree?(
                      <p style={{fontSize:30,fontWeight:900,color:C.emerald,margin:0}}>{t('cdp.free')}</p>
                    ):hasDisc?(
                      <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap'}}>
                        <p style={{fontSize:30,fontWeight:900,color:C.rose,margin:0}}>{finalPrice.toFixed(2)} TND</p>
                        <p style={{fontSize:14,color:C.dim,textDecoration:'line-through',margin:0}}>{Number(course.full_price).toFixed(2)} TND</p>
                        <span style={{padding:'2px 9px',borderRadius:20,background:'rgba(244,63,94,.15)',border:'1px solid rgba(244,63,94,.35)',color:C.rose,fontSize:11,fontWeight:800}}>-{discPct}%</span>
                      </div>
                    ):(
                      <p style={{fontSize:30,fontWeight:900,color:C.text,margin:0}}>{Number(course.full_price).toFixed(2)} TND</p>
                    )}
                  </div>

                  {/* buy msg */}
                  {buyMsg&&(
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 13px',borderRadius:10,marginBottom:14,background:buyMsgOk?'rgba(16,185,129,.1)':'rgba(244,63,94,.1)',border:`1px solid ${buyMsgOk?'rgba(16,185,129,.3)':'rgba(244,63,94,.3)'}`,color:buyMsgOk?C.emerald:C.rose,fontSize:12,fontWeight:600}}>
                      {buyMsgOk
                        ? <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        : <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      }
                      {buyMsg}
                    </div>
                  )}

                  {/* CTAs */}
                  {isInstructor?(
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div style={{padding:'10px 13px',borderRadius:10,background:'rgba(124,108,246,.1)',border:'1px solid rgba(124,108,246,.25)',color:C.accent,fontSize:12,fontWeight:600,textAlign:'center'}}>
                        {t('cdp.you_are_instructor')}
                      </div>
                      {!isFree&&(
                        <>
                          {discPct>0&&(
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'0 2px'}}>
                              <span style={{display:'flex',alignItems:'center',gap:5,color:C.rose,fontWeight:700}}><svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>{t('cdp.discount_active',{pct:discPct})}</span>
                              <span style={{color:C.dim}}>{finalPrice.toFixed(2)} TND</span>
                            </div>
                          )}
                          <button onClick={()=>{setShowDisc(v=>!v);setDiscInput(discPct>0?String(discPct):'');}}
                            style={{padding:'11px 13px',borderRadius:10,background:discPct>0?'rgba(244,63,94,.1)':'rgba(255,255,255,.06)',border:`1px solid ${discPct>0?'rgba(244,63,94,.3)':'rgba(255,255,255,.1)'}`,color:discPct>0?C.rose:C.muted,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                            <svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                            {discPct>0?t('cdp.edit_discount',{pct:discPct}):t('cdp.apply_discount')}
                          </button>
                          {showDisc&&(
                            <div style={{padding:'14px',borderRadius:12,background:'rgba(255,255,255,.04)',border:`1px solid ${C.border}`}}>
                              <p style={{color:C.dim,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:.4,marginBottom:10}}>{t('cdp.discount_pct')}</p>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                                <input type="number" min="0" max="100" step="1" value={discInput} onChange={e=>setDiscInput(e.target.value)} placeholder={t('cdp.discount_placeholder')}
                                  style={{width:64,textAlign:'center',padding:'8px',borderRadius:8,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.05)',color:C.text,fontWeight:800,fontSize:14,outline:'none'}}/>
                                <span style={{color:C.dim,fontSize:13}}>%</span>
                                {discInput!==''&&Number(discInput)>0&&<span style={{color:C.emerald,fontWeight:700,fontSize:12}}>→ {(Number(course.full_price)*(1-Number(discInput)/100)).toFixed(2)} TND</span>}
                              </div>
                              <p style={{color:C.dim,fontSize:11,marginBottom:10}}>{t('cdp.discount_hint')}</p>
                              <div style={{display:'flex',gap:8}}>
                                <button onClick={saveDisc} disabled={discSaving||discInput===''} style={{flex:1,padding:'9px',borderRadius:9,background:'linear-gradient(135deg,#f43f5e,#e11d48)',color:'#fff',fontWeight:700,fontSize:12,border:'none',cursor:'pointer',opacity:(discSaving||discInput==='')?0.5:1}}>
                                  {discSaving?t('cdp.saving'):t('cdp.apply')}
                                </button>
                                <button onClick={()=>{setShowDisc(false);setDiscInput('');}} style={{padding:'9px 13px',borderRadius:9,background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,color:C.muted,fontWeight:600,fontSize:12,cursor:'pointer'}}>
                                  {t('cdp.cancel')}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ):hasFull||requestStatus==='approved'?(
                    <button onClick={()=>document.getElementById('curr-sec')?.scrollIntoView({behavior:'smooth'})}
                      style={{width:'100%',padding:'14px',borderRadius:12,background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',marginBottom:12,boxShadow:'0 8px 24px rgba(16,185,129,.3)'}}>
                      {t('cdp.view_course')}
                    </button>
                  ):requestStatus==='pending'?(
                    paymentStatus==='en_cours'?(
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px',borderRadius:12,background:'rgba(14,165,233,.1)',border:'1px solid rgba(14,165,233,.3)',color:C.sky,fontWeight:700,fontSize:13,marginBottom:12}}><svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/><path d="M12 6v6l4 2"/></svg>{t('cdp.payment_processing')}</div>
                    ):(
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px',borderRadius:12,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',color:C.amber,fontWeight:700,fontSize:13,marginBottom:12}}><svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{t('cdp.request_pending')}</div>
                    )
                  ):requestStatus==='rejected'?(
                    <>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',borderRadius:10,background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.3)',color:C.rose,fontSize:12,marginBottom:10}}><svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>{t('cdp.request_rejected')}</div>
                      <button onClick={buyFull} disabled={requesting} style={{width:'100%',padding:'14px',borderRadius:12,background:'linear-gradient(135deg,#7c6cf6,#a855f7)',color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',marginBottom:12,opacity:requesting?.6:1,boxShadow:'0 8px 24px rgba(124,108,246,.3)'}}>
                        {requesting?t('cdp.sending'):t('cdp.resend_request')}
                      </button>
                    </>
                  ):(
                    <button onClick={buyFull} disabled={buying||requesting} style={{width:'100%',padding:'14px',borderRadius:12,background:'linear-gradient(135deg,#7c6cf6,#a855f7)',color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',marginBottom:12,opacity:(buying||requesting)?.6:1,boxShadow:'0 8px 24px rgba(124,108,246,.35)'}}>
                      {requesting?t('cdp.sending_progress'):buying?t('cdp.processing'):isFree?t('cdp.enroll_free'):t('cdp.buy_course')}
                    </button>
                  )}

                  {/* perks */}
                  <div style={{display:'flex',flexDirection:'column',gap:7,marginTop:14}}>
                    {[
                      ['check',t('cdp.lifetime_access')],
                      course.first_lesson_free?['unlock',t('cdp.first_lesson_free')]:null,
                    ].filter(Boolean).map(([ic,tx],i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                        {ic==='check'
                          ? <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke={C.emerald} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                          : <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                        }
                        <span style={{color:C.dim,fontSize:12}}>{tx}</span>
                      </div>
                    ))}
                    {!isInstructor&&(
                      <button onClick={()=>navigate(`/messages?with=${encodeURIComponent(course.creator_email)}`)}
                        style={{width:'100%',marginTop:6,padding:'11px',borderRadius:12,background:'rgba(255,255,255,.04)',border:`1px solid ${C.border}`,color:C.muted,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,108,246,.1)';e.currentTarget.style.borderColor='rgba(124,108,246,.4)';e.currentTarget.style.color=C.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                        <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        {t('cdp.contact_instructor')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{position:'sticky',top:64,zIndex:20,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',background:'rgba(10,8,23,.88)',borderBottom:`1px solid ${C.border}`}}>
          <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',display:'flex',gap:2}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                style={{padding:'15px 20px',background:'none',border:'none',borderBottom:`2px solid ${activeTab===tab.id?C.accent:'transparent'}`,color:activeTab===tab.id?C.accent:C.muted,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .2s',whiteSpace:'nowrap'}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ TAB BODY ═══ */}
        <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px 80px'}}>

          {/* ── Curriculum ── */}
          {activeTab==='curriculum'&&(
            <div id="curr-sec" style={{maxWidth:780}}>
              {lessSub&&(
                <div style={{display:'flex',gap:13,alignItems:'flex-start',padding:16,borderRadius:14,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',marginBottom:16}}>
                  <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <div>
                    <p style={{color:'#fbbf24',fontWeight:800,fontSize:14,margin:0}}>{t('cdp.lesson_sent_admin')}</p>
                    <p style={{color:'#d97706',fontSize:12,marginTop:4,margin:0}}>{t('cdp.lesson_sent_desc')}</p>
                  </div>
                </div>
              )}

              {/* add lesson — instructor */}
              {isInstructor&&(
                <div style={{marginBottom:20}}>
                  {!showAdd?(
                    <button onClick={()=>setShowAdd(true)}
                      style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:9,padding:'16px',borderRadius:16,border:'2px dashed rgba(124,108,246,.35)',background:'rgba(124,108,246,.05)',color:C.accent,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .25s',boxSizing:'border-box'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,108,246,.11)';e.currentTarget.style.borderColor='rgba(124,108,246,.65)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 24px -6px rgba(124,108,246,0.2)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(124,108,246,.05)';e.currentTarget.style.borderColor='rgba(124,108,246,.35)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
                      <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                      {t('cdp.add_lesson')}
                    </button>
                  ):(
                    <form onSubmit={addLesson} style={{padding:24,borderRadius:20,background:'rgba(124,108,246,0.04)',border:'1px solid rgba(124,108,246,.28)',boxShadow:'0 8px 32px -8px rgba(124,108,246,0.12)'}}>
                      <p style={{fontWeight:900,fontSize:16,color:C.text,margin:'0 0 20px',letterSpacing:'-0.01em'}}>{t('cdp.new_lesson')}</p>
                      <input type="file" accept="video/mp4,video/*" style={{display:'none'}} ref={r=>{muxRef.current=r;}} onChange={e=>{const f=e.target.files?.[0];if(f)handleUpload(f);}}/>

                      <p style={{color:C.muted,fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>{t('cdp.type_label')}</p>
                      <div style={{display:'flex',gap:8,marginBottom:18,padding:4,borderRadius:14,background:'rgba(255,255,255,0.04)'}}>
                        {[{v:true,lb:t('cdp.free'),col:C.emerald},{v:false,lb:t('cdp.paid'),col:C.accent}].map(({v,lb,col})=>(
                          <button key={String(v)} type="button" onClick={()=>setNewLesson(p=>({...p,is_free_preview:v,...(v&&{price:0})}))}
                            style={{flex:1,padding:'11px 10px',borderRadius:11,border:`2px solid ${newLesson.is_free_preview===v?col:'transparent'}`,background:newLesson.is_free_preview===v?`${col}18`:C.bg,color:newLesson.is_free_preview===v?col:C.muted,fontWeight:800,fontSize:13,cursor:'pointer',transition:'all .22s',boxShadow:newLesson.is_free_preview===v?`0 4px 14px -4px ${col}55`:'none'}}>
                            {lb}
                          </button>
                        ))}
                      </div>

                      <p style={{color:C.muted,fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>{t('cdp.title_label')}</p>
                      <input required placeholder={t('cdp.lesson_title_placeholder')} value={newLesson.title} onChange={e=>setNewLesson(p=>({...p,title:e.target.value}))}
                        style={{width:'100%',padding:'12px 15px',borderRadius:12,border:`1.5px solid ${C.border}`,background:'rgba(255,255,255,.05)',color:C.text,fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:16,fontFamily:'inherit',transition:'border-color .2s, background .2s'}}
                        onFocus={e=>{e.target.style.borderColor='rgba(124,108,246,0.55)';e.target.style.background='rgba(124,108,246,0.04)';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.background='rgba(255,255,255,.05)';}}/>

                      {upState==='idle'&&(
                        <button type="button" onClick={()=>{warmVideoUpload();muxRef.current?.click();}}
                          style={{width:'100%',padding:'16px',borderRadius:12,border:'2px dashed rgba(124,108,246,.35)',background:'rgba(124,108,246,.04)',color:C.accent,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:9,marginBottom:16,transition:'all .22s',boxSizing:'border-box'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,108,246,.1)';e.currentTarget.style.borderColor='rgba(124,108,246,.65)';e.currentTarget.style.transform='translateY(-1px)';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='rgba(124,108,246,.04)';e.currentTarget.style.borderColor='rgba(124,108,246,.35)';e.currentTarget.style.transform='translateY(0)';}}>
                          <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                          {t('cdp.import_mp4')}
                        </button>
                      )}
                      {upState==='uploading'&&(
                        <div style={{borderRadius:10,border:`1px solid ${C.border}`,padding:'12px 14px',marginBottom:12}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                            <span style={{color:C.muted,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{upFile}</span>
                            <span style={{color:C.accent,fontWeight:700,fontSize:12}}>{upPct}%</span>
                          </div>
                          <div style={{height:5,borderRadius:4,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${upPct}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:4,transition:'width .3s ease'}}/>
                          </div>
                        </div>
                      )}
                      {upState==='processing'&&(
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',marginBottom:12}}>
                          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" style={{animation:'cdSpin .9s linear infinite',flexShrink:0}}><circle cx="12" cy="12" r="10" stroke={C.amber} strokeWidth="4" strokeOpacity=".25"/><path fill={C.amber} d="M4 12a8 8 0 018-8v8z"/></svg>
                          <div><p style={{color:C.amber,fontWeight:700,fontSize:13,margin:0}}>{t('cdp.processing')}</p><p style={{color:'#d97706',fontSize:11,margin:0}}>{t('cdp.processing_time')}</p></div>
                        </div>
                      )}
                      {upState==='done'&&(
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.25)',marginBottom:12}}>
                          <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke={C.emerald} strokeWidth={2.5} style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{color:C.emerald,fontWeight:700,fontSize:13,margin:0}}>{t('cdp.video_ready')}</p>
                            <p style={{color:'#059669',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>{upFile}</p>
                          </div>
                          <button type="button" onClick={()=>{setUpState('idle');setUpPct(0);setUpFile('');setNewLesson(p=>({...p,video_url:''}));if(muxRef.current)muxRef.current.value='';}} style={{background:'none',border:'none',cursor:'pointer',color:C.dim,padding:0}}>
                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      )}
                      {upState==='error'&&(
                        <div style={{marginBottom:12}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:10,background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)',marginBottom:8}}>
                            <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke={C.rose} strokeWidth={2} style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <div><p style={{color:C.rose,fontWeight:700,fontSize:13,margin:0}}>{t('cdp.upload_failed')}</p><p style={{color:'#e11d48',fontSize:11,margin:0}}>{t('cdp.upload_failed_desc')}</p></div>
                          </div>
                          <button type="button" onClick={()=>{setUpState('idle');setUpPct(0);setUpFile('');setNewLesson(p=>({...p,video_url:''}));if(muxRef.current)muxRef.current.value='';}}
                            style={{width:'100%',padding:'10px',borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>
                            {t('cdp.reimport_video')}
                          </button>
                        </div>
                      )}

                      <div style={{display:'flex',gap:10,marginTop:8}}>
                        <button type="button" onClick={()=>{setShowAdd(false);setUpFile('');setUpState('idle');setUpPct(0);setNewLesson({title:'',video_url:'',is_free_preview:true,price:0});if(muxRef.current)muxRef.current.value='';}}
                          style={{flex:1,padding:'12px',borderRadius:12,border:`1.5px solid ${C.border}`,background:'transparent',color:C.muted,fontWeight:700,fontSize:13,cursor:'pointer',transition:'all .18s'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';e.currentTarget.style.color=C.text;}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
                          {t('cdp.cancel')}
                        </button>
                        <button type="submit" disabled={addingL||!newLesson.title.trim()||(!IS_DEV&&!newLesson.video_url)||upState==='uploading'||upState==='processing'}
                          style={{flex:1,padding:'12px',borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontWeight:800,fontSize:13,border:'none',cursor:'pointer',transition:'opacity .18s, transform .18s',opacity:(addingL||!newLesson.title.trim()||(!IS_DEV&&!newLesson.video_url)||upState==='uploading'||upState==='processing')?.45:1,boxShadow:'0 6px 20px -4px rgba(124,108,246,0.5)'}}
                          onMouseEnter={e=>{if(!(addingL||!newLesson.title.trim()||(!IS_DEV&&!newLesson.video_url)))e.currentTarget.style.opacity='0.88';}}
                          onMouseLeave={e=>{e.currentTarget.style.opacity=(addingL||!newLesson.title.trim()||(!IS_DEV&&!newLesson.video_url))?.45:'1';}}>
                          {addingL?t('cdp.adding'):upState==='uploading'?t('cdp.upload_short'):upState==='processing'?t('cdp.processing'):t('cdp.add')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* locked msg */}
              {lockedMsg&&(
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:12,background:'rgba(124,108,246,.12)',border:'1px solid rgba(124,108,246,.3)',marginBottom:12,animation:'cdPls 1.5s ease infinite'}}>
                  <LockSvg/>
                  <p style={{color:C.accent,fontSize:13,fontWeight:600,margin:0}}>{t('cdp.locked_msg')}</p>
                </div>
              )}

              {/* lessons */}
              {visLessons.length===0?(
                <div style={{textAlign:'center',paddingTop:80,paddingBottom:80}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:14}}>
                    <svg width={44} height={44} fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p style={{color:C.dim,fontSize:14}}>{lessons.length===0?t('cdp.no_lessons_added'):t('cdp.no_lessons_available')}</p>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {visLessons.map((lesson,idx)=>{
                    const w=canWatch(lesson);
                    return(
                      <div key={lesson.id}
                        onClick={()=>{if(w)navigate(`/courses/${id}/lesson/${lesson.id}`);else if(!lesson.is_free_preview){setBuyMsg(t('cdp.buy_full_course'));setLockedMsg(true);setTimeout(()=>setLockedMsg(false),4000);}}}
                        style={{display:'flex',alignItems:'center',gap:15,padding:'13px 17px',borderRadius:14,background:w?C.card:'rgba(255,255,255,.02)',border:`1px solid ${w?C.border:'rgba(255,255,255,.04)'}`,cursor:'pointer',transition:'all .2s',userSelect:'none'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(124,108,246,.08)';e.currentTarget.style.borderColor='rgba(124,108,246,.3)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background=w?C.card:'rgba(255,255,255,.02)';e.currentTarget.style.borderColor=w?C.border:'rgba(255,255,255,.04)';}}>

                        <div style={{width:34,height:34,borderRadius:9,background:w?'rgba(124,108,246,.18)':'rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {w?<PlaySvg size={17} col={C.accent}/>:<span style={{color:C.dim,fontSize:12,fontWeight:700}}>{idx+1}</span>}
                        </div>

                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            <p style={{color:w?C.text:C.muted,fontSize:14,fontWeight:600,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lesson.title}</p>
                            {lesson.status==='pending'&&<Chip label={t('cdp.chip_pending')} col={C.amber}/>}
                            {lesson.status==='rejected'&&<Chip label={t('cdp.chip_rejected')} col={C.rose}/>}
                          </div>
                          {lesson.description&&<p style={{color:C.dim,fontSize:12,margin:'3px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lesson.description}</p>}
                        </div>

                        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                          {lesson.is_free_preview&&<Chip label={t('cdp.free')} col={C.emerald}/>}
                          {!lesson.is_free_preview&&!w&&<Chip label={t('cdp.paid')} col={C.muted}/>}
                          {lesson.duration_min>0&&<span style={{color:C.dim,fontSize:12}}>{lesson.duration_min}m</span>}
                          {!w&&<LockSvg/>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Reviews ── */}
          {activeTab==='reviews'&&(
            <div style={{maxWidth:780,display:'flex',flexDirection:'column',gap:20}}>
              {/* rating summary */}
              <div style={{display:'flex',alignItems:'center',gap:30,padding:'22px 26px',borderRadius:18,background:C.card,border:`1px solid ${C.border}`,flexWrap:'wrap'}}>
                <div style={{textAlign:'center',minWidth:80}}>
                  <p style={{fontSize:50,fontWeight:900,color:'#fff',lineHeight:1,margin:0}}>{Number(course.avg_rating).toFixed(1)}</p>
                  <div style={{marginTop:8}}><StarRating rating={course.avg_rating} size={15}/></div>
                  <p style={{color:C.muted,fontSize:12,marginTop:6}}>{t('cdp.reviews_count',{count:reviews.length})}</p>
                </div>
                <div style={{flex:1,minWidth:160,display:'flex',flexDirection:'column',gap:7}}>
                  {[5,4,3,2,1].map(s=>{
                    const cnt=reviews.filter(r=>r.rating===s).length;
                    const pct=reviews.length?Math.round(cnt/reviews.length*100):0;
                    return(
                      <div key={s} style={{display:'flex',alignItems:'center',gap:9}}>
                        <span style={{color:C.muted,fontSize:12,width:10}}>{s}</span>
                        <svg width={12} height={12} fill={C.amber} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>
                        <div style={{flex:1,height:5,borderRadius:3,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.amber},#fbbf24)`,borderRadius:3,transition:'width .6s ease'}}/>
                        </div>
                        <span style={{color:C.dim,fontSize:11,width:28,textAlign:'right'}}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* review form */}
              {hasFull&&!isInstructor&&!reviews.some(r=>r.reviewer_email===user?.email)&&(
                <div style={{padding:'22px',borderRadius:18,background:C.card,border:`1px solid ${C.border}`}}>
                  <p style={{fontWeight:800,fontSize:15,marginBottom:14}}>{t('cdp.leave_review')}</p>
                  <StarRating rating={myRating} interactive onRate={setMyRating} size={24}/>
                  <textarea value={myReview} onChange={e=>setMyReview(e.target.value)} rows={3} placeholder={t('cdp.share_experience')}
                    style={{marginTop:13,width:'100%',padding:'11px 15px',borderRadius:11,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.04)',color:C.text,fontSize:14,resize:'none',outline:'none',boxSizing:'border-box'}}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <div style={{display:'flex',gap:10,marginTop:12}}>
                    <button onClick={submitReview} disabled={!myRating||submitting}
                      style={{padding:'10px 22px',borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer',opacity:(!myRating||submitting)?.5:1}}>
                      {submitting?t('cdp.sending'):t('cdp.send_review')}
                    </button>
                    <button onClick={()=>{setMyRating(0);setMyReview('');}}
                      style={{padding:'10px 22px',borderRadius:10,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:C.muted,fontWeight:600,fontSize:13,cursor:'pointer'}}>
                      {t('cdp.cancel')}
                    </button>
                  </div>
                </div>
              )}

              {/* reviews list */}
              {reviews.length===0?(
                <div style={{textAlign:'center',paddingTop:60,paddingBottom:60}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:14}}>
                    <svg width={42} height={42} fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p style={{color:C.dim,fontSize:14}}>{t('cdp.no_reviews_yet')}</p>
                </div>
              ):reviews.map(r=>(
                <div key={r.id} id={`review-${r.id}`} style={{display:'flex',gap:15,padding:'18px 22px',borderRadius:18,background:C.card,border:`1px solid ${C.border}`,scrollMarginTop:80}}>
                  <div onClick={() => navigate(`/profile/${encodeURIComponent(r.reviewer_email)}`)} style={{cursor:'pointer',flexShrink:0}}>
                    <Avatar name={r.reviewer_name||r.reviewer_email} photo={r.reviewer_photo} size={40}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                      <span onClick={() => navigate(`/profile/${encodeURIComponent(r.reviewer_email)}`)} style={{color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer'}}>{r.reviewer_name||r.reviewer_email}</span>
                      <StarRating rating={r.rating} size={13}/>
                      <span style={{color:C.dim,fontSize:11,marginLeft:'auto'}}>{relTime(r.created_at)}</span>
                    </div>
                    {r.review_text&&<p style={{color:C.muted,fontSize:14,lineHeight:1.65,margin:0}}>{r.review_text}</p>}

                    {r.instructor_reply&&(
                      <div style={{marginTop:13,paddingLeft:13,borderLeft:'2px solid rgba(124,108,246,.4)',display:'flex',gap:11}}>
                        <div onClick={() => navigate(`/profile/${encodeURIComponent(course?.creator_email)}`)} style={{cursor:'pointer',flexShrink:0}}>
                          <Avatar name={course?.instructor_name||course?.creator_email} photo={course?.instructor_photo} size={30}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p onClick={() => navigate(`/profile/${encodeURIComponent(course?.creator_email)}`)} style={{color:C.accent,fontSize:12,fontWeight:700,marginBottom:4,cursor:'pointer'}}>{course?.instructor_name||course?.creator_email}</p>
                          <p style={{color:C.muted,fontSize:13,lineHeight:1.6,margin:0}}>{r.instructor_reply}</p>
                          <p style={{color:C.dim,fontSize:11,marginTop:4}}>{relTime(r.replied_at)}</p>
                        </div>
                      </div>
                    )}

                    {isInstructor&&!r.instructor_reply&&(
                      replyingId===r.id?(
                        <div style={{marginTop:11}}>
                          <textarea value={replyDraft[r.id]||''} rows={2} onChange={e=>setReplyDraft(p=>({...p,[r.id]:e.target.value}))} placeholder={t('cdp.your_reply')}
                            style={{width:'100%',padding:'9px 13px',borderRadius:10,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.04)',color:C.text,fontSize:13,resize:'none',outline:'none',boxSizing:'border-box'}}
                            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                          <div style={{display:'flex',gap:8,marginTop:8}}>
                            <button onClick={()=>submitReply(r.id,replyDraft[r.id])} disabled={!replyDraft[r.id]?.trim()||replySend}
                              style={{padding:'7px 15px',borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontWeight:700,fontSize:12,border:'none',cursor:'pointer',opacity:(!replyDraft[r.id]?.trim()||replySend)?.5:1}}>
                              {replySend?t('cdp.sending'):t('cdp.reply')}
                            </button>
                            <button onClick={()=>{setReplyingId(null);setReplyDraft(p=>{const n={...p};delete n[r.id];return n;});}}
                              style={{padding:'7px 15px',borderRadius:8,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:C.muted,fontWeight:600,fontSize:12,cursor:'pointer'}}>
                              {t('cdp.cancel')}
                            </button>
                          </div>
                        </div>
                      ):(
                        <button onClick={()=>setReplyingId(r.id)}
                          style={{background:'none',border:'none',color:C.accent,fontSize:12,fontWeight:600,cursor:'pointer',marginTop:8,padding:0}}>
                          {t('cdp.reply_arrow')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Live Sessions ── */}
          {activeTab==='live'&&(
            <div style={{maxWidth:780,textAlign:'center',paddingTop:80}}>
              <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:76,height:76,borderRadius:'50%',background:'rgba(124,108,246,.12)',border:'1px solid rgba(124,108,246,.25)',marginBottom:22}}>
                <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="rgba(124,108,246,0.8)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 6c0 0 4-4 11-4s11 4 11 4"/><path d="M5 10c0 0 2.5-2.5 7-2.5S19 10 19 10"/><path d="M9 14c0 0 1-1 3-1s3 1 3 1"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth={2.5}/></svg>
              </div>
              <p style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:.4}}>
                {t('cdp.coming_soon')}
                <span style={{animation:'soonDot 1.4s infinite',marginLeft:2,animationDelay:'0s'}}>.</span>
                <span style={{animation:'soonDot 1.4s infinite',animationDelay:'.2s'}}>.</span>
                <span style={{animation:'soonDot 1.4s infinite',animationDelay:'.4s'}}>.</span>
              </p>
              <p style={{color:C.muted,fontSize:14,marginTop:8}}>{t('cdp.live_coming')}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
