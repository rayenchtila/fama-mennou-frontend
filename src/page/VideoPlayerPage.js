import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const C = {
  bg:     'var(--fm-bg)',
  panel:  'var(--fm-surface)',
  accent: 'var(--fm-primary)',
  purple: 'var(--fm-purple)',
  emerald:'var(--fm-success)',
  amber:  'var(--fm-warning)',
  rose:   'var(--fm-danger)',
  text:   'var(--fm-text-2)',
  muted:  'var(--fm-text-6)',
  dim:    'var(--fm-text-7)',
  border: 'var(--fm-border)',
  card:   'var(--fm-border-soft)',
};

const GS = `
@keyframes vpSpin{to{transform:rotate(360deg)}}
@keyframes vpUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes vpFade{from{opacity:0}to{opacity:1}}
@keyframes vpSlide{from{transform:translateX(100%)}to{transform:translateX(0)}}
.vp-sidebar-mobile{animation:vpSlide .22s cubic-bezier(.4,0,.2,1) both}
`;

function isYT(url=''){return /youtube\.com|youtu\.be/.test(url);}
function getYTId(url=''){const m=url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);return m?m[1]:'';}

function MuxPlayer({playbackId}){
  const ref=React.useRef(null);
  React.useEffect(()=>{
    const video=ref.current;if(!video||!playbackId)return;
    const src=`https://stream.mux.com/${playbackId}.m3u8`;
    if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=src;return;}
    const init=()=>{
      if(!window.Hls?.isSupported())return;
      const hls=new window.Hls({enableWorker:true,startLevel:-1,autoStartLoad:true,maxBufferLength:20,maxMaxBufferLength:40,maxBufferSize:20*1000*1000,lowLatencyMode:false,backBufferLength:10,abrEwmaDefaultEstimate:300000,abrBandWidthFactor:.8,abrBandWidthUpFactor:.5});
      hls.loadSource(src);hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR,(_,d)=>{if(d.fatal){if(d.type===window.Hls.ErrorTypes.NETWORK_ERROR)hls.startLoad();else if(d.type===window.Hls.ErrorTypes.MEDIA_ERROR)hls.recoverMediaError();else hls.destroy();}});
    };
    if(window.Hls){init();return;}
    const ex=document.getElementById('hls-js');
    if(ex){ex.addEventListener('load',init);return;}
    const s=document.createElement('script');s.id='hls-js';s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';s.onload=init;document.head.appendChild(s);
    return()=>{if(video)video.src='';};
  },[playbackId]);
  return(
    <video ref={ref} style={{width:'100%',aspectRatio:'16/9',background:'#000',display:'block'}}
      controls playsInline preload="auto"
      controlsList="nodownload nofullscreen"
      onContextMenu={e=>e.preventDefault()} draggable={false}/>
  );
}

function VideoPlayer({url}){
  const { t } = useTranslation();
  const isMux=(url||'').startsWith('mux:');
  if(isMux)return <MuxPlayer playbackId={(url||'').replace('mux:','')}/>;
  if(!url)return(
    <div style={{width:'100%',aspectRatio:'16/9',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:C.muted,fontSize:14}}>{t('vp.no_video')}</p>
    </div>
  );
  if(isYT(url)){
    return(
      <iframe style={{width:'100%',aspectRatio:'16/9',display:'block',border:'none'}}
        src={`https://www.youtube.com/embed/${getYTId(url)}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen title={t('vpp.lesson_video')}/>
    );
  }
  return(
    <video style={{width:'100%',aspectRatio:'16/9',background:'#000',display:'block'}}
      src={url} controls playsInline
      controlsList="nodownload nofullscreen"
      onContextMenu={e=>e.preventDefault()} draggable={false}/>
  );
}

function CertificateCard({cert}){
  const { t } = useTranslation();
  return(
    <div style={{marginTop:24,padding:'24px',borderRadius:18,background:'linear-gradient(135deg,rgba(245,158,11,.12),rgba(251,191,36,.08))',border:'2px solid rgba(245,158,11,.35)',textAlign:'center',animation:'vpUp .4s ease'}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
        <svg width={44} height={44} fill="none" viewBox="0 0 24 24" stroke="var(--fm-warning)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H2V2h4M18 9h4V2h-4M6 9a6 6 0 0 0 12 0M12 15v4M8 19h8"/></svg>
      </div>
      <h3 style={{fontSize:17,fontWeight:900,color:'var(--fm-warning)',marginBottom:8}}>{t('vpp.cert_title')}</h3>
      <p style={{color:'#f59e0b',fontSize:13,lineHeight:1.6,marginBottom:14}}>
        {t('vpp.cert_awarded_to')} <strong style={{color:'#fff'}}>{cert.student_name}</strong> {t('vpp.cert_for_completing')}<br/>
        <strong style={{color:'#fff'}}>{cert.course_title}</strong>
      </p>
      <code style={{display:'inline-block',fontSize:12,color:'var(--fm-warning)',background:'rgba(245,158,11,.15)',borderRadius:8,padding:'6px 14px',marginBottom:12,fontFamily:'monospace'}}>
        {cert.certificate_uid}
      </code>
      <p style={{color:'#d97706',fontSize:12}}>
        {t('vpp.cert_issued_on',{date:new Date(cert.issued_at).toLocaleDateString('fr-FR')})}
        {cert.instructor_name?` · ${t('vpp.cert_instructor',{name:cert.instructor_name})}`:''}
      </p>
    </div>
  );
}

export default function VideoPlayerPage(){
  const { t } = useTranslation();
  const {courseId,lessonId}=useParams();
  const navigate=useNavigate();
  const {user}=useAuth();

  const [lessons,   setLessons]   = useState([]);
  const [lesson,    setLesson]    = useState(null);
  const [course,    setCourse]    = useState(null);
  const [progress,  setProgress]  = useState({completed_ids:[],pct:0});
  const [cert,      setCert]      = useState(null);
  const [marking,   setMarking]   = useState(false);
  const [certLoad,  setCertLoad]  = useState(false);
  const [sideOpen,  setSideOpen]  = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [isMobile,  setIsMobile]  = useState(typeof window!=='undefined'&&window.innerWidth<768);
  useBodyScrollLock(isMobile && sideOpen);

  useEffect(()=>{
    const handle=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',handle);
    return()=>window.removeEventListener('resize',handle);
  },[]);

  // On desktop, sidebar defaults open; on mobile, closed
  useEffect(()=>{setSideOpen(!isMobile);},[isMobile]);

  const email=user?.email;

  const fetchAll=useCallback(async()=>{
    try{
      const [lsR,cR,pR,certR,purR]=await Promise.all([
        fetch(`${API}/lessons/course/${courseId}`),
        fetch(`${API}/courses/${courseId}`),
        fetch(`${API}/progress/${email}/${courseId}`),
        fetch(`${API}/certificates/${email}/${courseId}`),
        email?fetch(`${API}/course-purchases/user/${email}`):Promise.resolve({json:()=>[]}),
      ]);
      const [ls,c,p,certD,pur]=await Promise.all([lsR.json(),cR.json(),pR.json(),certR.json(),email?purR.json():[]]);
      if(Array.isArray(ls))setLessons(ls);
      if(c&&c.id)setCourse(c);
      if(p&&p.completed_ids)setProgress(p);
      if(certD&&certD.id)setCert(certD);
      if(Array.isArray(pur))setPurchases(pur.filter(p=>Number(p.course_id)===Number(courseId)));
    }catch{}
  },[courseId,email]);

  useEffect(()=>{fetchAll();},[fetchAll]);

  const hasFull      = purchases.some(p=>!p.lesson_id);
  const isInstructor = course&&user?.email===course.creator_email;

  function canWatch(l){
    if(!l)return false;
    if(l.is_free_preview)return true;
    if(!user)return false;
    if(user.isAdmin||isInstructor||hasFull)return true;
    return false;
  }

  useEffect(()=>{
    if(lessons.length&&lessonId){
      const f=lessons.find(l=>String(l.id)===String(lessonId));
      setLesson(f||lessons[0]);
    }else if(lessons.length){setLesson(lessons[0]);}
  },[lessons,lessonId]);

  const curIdx = lessons.findIndex(l=>l.id===lesson?.id);
  const prevL  = curIdx>0?lessons[curIdx-1]:null;
  const nextL  = curIdx<lessons.length-1?lessons[curIdx+1]:null;
  const isDone = progress.completed_ids.includes(lesson?.id);

  async function markComplete(){
    if(!lesson||marking||isDone)return;
    setMarking(true);
    try{
      await fetch(`${API}/progress`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_email:email,lesson_id:lesson.id,course_id:Number(courseId)})});
      await fetchAll();
    }catch{}
    setMarking(false);
  }

  async function claimCert(){
    if(cert||certLoad)return;
    setCertLoad(true);
    try{
      const r=await fetch(`${API}/certificates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_email:email,course_id:Number(courseId)})});
      const d=await r.json();if(d.id)setCert(d);
    }catch{}
    setCertLoad(false);
  }

  function goTo(l){navigate(`/courses/${courseId}/lesson/${l.id}`);setLesson(l);if(isMobile)setSideOpen(false);}

  const topBarH = 64 + 52; // navbar + player topbar

  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',paddingTop:64}}>
      <style>{GS}</style>

      {/* ── Top bar ── */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:'0 12px',height:52,display:'flex',alignItems:'center',gap:10,position:'sticky',top:64,zIndex:30,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',flexShrink:0}}>

        {/* Back */}
        <button
          onClick={()=>navigate(`/courses/${courseId}`)}
          style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',color:C.muted,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0,padding:'6px 8px',borderRadius:8,transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--fm-surface-hover)';e.currentTarget.style.color='#fff';}}
          onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=C.muted;}}>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {!isMobile && <span>{t('vpp.back')}</span>}
        </button>

        <div style={{width:1,height:20,background:C.border,flexShrink:0}}/>

        {/* Title block */}
        <div style={{flex:1,minWidth:0}}>
          <p style={{color:'#fff',fontSize:isMobile?12:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0,lineHeight:1.3}}>
            {lesson?.title||course?.title||'…'}
          </p>
          {isMobile&&course?.title&&(
            <p style={{color:C.dim,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0,lineHeight:1.2}}>
              {course.title}
            </p>
          )}
        </div>

        {/* Progress bar + % */}
        <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          <div style={{width:isMobile?52:90,height:4,borderRadius:2,background:'var(--fm-border)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress.pct}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:2,transition:'width .5s ease'}}/>
          </div>
          <span style={{color:progress.pct===100?C.emerald:C.muted,fontSize:11,fontWeight:700,minWidth:28,textAlign:'right'}}>{Math.round(progress.pct)}%</span>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={()=>setSideOpen(v=>!v)}
          style={{padding:'7px',borderRadius:8,background:sideOpen?'rgba(124,108,246,.2)':'var(--fm-surface-hover)',border:`1px solid ${sideOpen?'rgba(124,108,246,.5)':C.border}`,color:sideOpen?C.accent:C.muted,cursor:'pointer',flexShrink:0,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center'}}
          title={t('vpp.toggle_sidebar')}>
          <svg width={17} height={17} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0,position:'relative'}}>

        {/* Main content */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',overflowY:'auto'}}>

          {/* Video */}
          <div style={{background:'#000',position:'relative'}}>
            {canWatch(lesson)?(
              <div style={{position:'relative',userSelect:'none'}} onContextMenu={e=>e.preventDefault()}>
                <VideoPlayer url={lesson?.video_url}/>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,pointerEvents:'none'}}>
                  <p style={{color:'var(--fm-surface-hover)',fontSize:13,fontWeight:700,letterSpacing:'.05em',transform:'rotate(-22deg)',whiteSpace:'nowrap',userSelect:'none',pointerEvents:'none'}}>
                    {user?.name||user?.email}
                  </p>
                </div>
              </div>
            ):(
              <div style={{width:'100%',aspectRatio:'16/9',background:'linear-gradient(135deg,#0a0817,#131024)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:'24px',textAlign:'center',boxSizing:'border-box'}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(124,108,246,.12)',border:'1px solid rgba(124,108,246,.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <div>
                  <p style={{color:'#fff',fontWeight:800,fontSize:16,marginBottom:6,margin:'0 0 6px'}}>{t('vpp.lesson_locked')}</p>
                  <p style={{color:C.muted,fontSize:13,maxWidth:280,margin:'0 auto'}}>{t('cdp.locked_msg')}</p>
                </div>
                <button onClick={()=>navigate(`/courses/${courseId}`)}
                  style={{padding:'11px 24px',borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontSize:14,fontWeight:700,border:'none',cursor:'pointer',boxShadow:'0 8px 24px rgba(124,108,246,.35)'}}>
                  {t('vpp.buy_course_arrow')}
                </button>
              </div>
            )}
          </div>

          {/* Lesson info */}
          <div style={{maxWidth:860,margin:'0 auto',width:'100%',padding:isMobile?'20px 16px 60px':'28px 24px 80px',boxSizing:'border-box',animation:'vpUp .4s ease'}}>

            {/* Title + mark complete */}
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:isMobile?'wrap':'nowrap'}}>
                <div style={{flex:1,minWidth:0}}>
                  <h1 style={{fontSize:isMobile?'18px':'clamp(18px,3vw,24px)',fontWeight:800,color:'#fff',margin:'0 0 5px',lineHeight:1.25}}>{lesson?.title}</h1>
                  {lesson?.description&&<p style={{color:C.muted,fontSize:13,margin:0,lineHeight:1.6}}>{lesson.description}</p>}
                </div>
                <button onClick={markComplete} disabled={marking||isDone}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 16px',borderRadius:11,background:isDone?'rgba(16,185,129,.12)':'linear-gradient(135deg,#7c6cf6,#a855f7)',color:isDone?C.emerald:'#fff',border:isDone?'1px solid rgba(16,185,129,.3)':'none',fontWeight:700,fontSize:13,cursor:isDone?'default':'pointer',opacity:marking?.7:1,transition:'all .2s',boxShadow:isDone?'none':'0 6px 20px rgba(124,108,246,.3)',whiteSpace:'nowrap',flexShrink:0,...(isMobile&&{width:'100%'})}}>
                  <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {isDone?t('vpp.completed'):marking?t('vpp.saving'):t('vpp.mark_complete')}
                </button>
              </div>
            </div>

            {/* Progress */}
            <div style={{marginBottom:22,padding:'14px 16px',borderRadius:12,background:C.card,border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,gap:8}}>
                <span style={{color:C.muted,fontSize:12,fontWeight:600}}>{t('vpp.course_progress')}</span>
                <span style={{color:progress.pct===100?C.emerald:C.accent,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>
                  {Math.round(progress.pct)}% · {t('vpp.lessons_fraction',{done:progress.completed_ids.length,total:lessons.length})}
                </span>
              </div>
              <div style={{height:5,borderRadius:3,background:'var(--fm-border)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress.pct}%`,background:progress.pct===100?`linear-gradient(90deg,${C.emerald},#059669)`:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:3,transition:'width .6s ease'}}/>
              </div>
            </div>

            {/* Prev / Next */}
            <div style={{display:'flex',gap:10,marginBottom:28}}>
              <button onClick={()=>prevL&&goTo(prevL)} disabled={!prevL}
                style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:10,background:'var(--fm-surface-hover)',border:`1px solid ${C.border}`,color:prevL?C.text:C.dim,fontWeight:600,fontSize:13,cursor:prevL?'pointer':'not-allowed',transition:'all .2s',opacity:prevL?1:.4,flex:1,justifyContent:'center'}}
                onMouseEnter={e=>prevL&&(e.currentTarget.style.background='var(--fm-border)')}
                onMouseLeave={e=>e.currentTarget.style.background='var(--fm-surface-hover)'}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                {t('vpp.previous')}
              </button>
              <button onClick={()=>nextL&&goTo(nextL)} disabled={!nextL}
                style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:10,background:nextL?`linear-gradient(135deg,${C.accent},${C.purple})`:'var(--fm-surface-hover)',border:'none',color:nextL?'#fff':C.dim,fontWeight:700,fontSize:13,cursor:nextL?'pointer':'not-allowed',transition:'all .2s',opacity:nextL?1:.4,flex:1,justifyContent:'center',boxShadow:nextL?'0 4px 16px rgba(124,108,246,.3)':'none'}}>
                {t('vpp.next')}
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Certificate */}
            {progress.pct===100&&(
              cert?<CertificateCard cert={cert}/>:(
                <div style={{padding:'24px',borderRadius:18,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',textAlign:'center',animation:'vpFade .5s ease'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
                    <svg width={38} height={38} fill="none" viewBox="0 0 24 24" stroke="var(--fm-warning)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <p style={{color:'var(--fm-warning)',fontWeight:800,fontSize:16,marginBottom:14}}>{t('vpp.all_lessons_done')}</p>
                  <button onClick={claimCert} disabled={certLoad}
                    style={{padding:'11px 28px',borderRadius:11,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:'pointer',opacity:certLoad?.6:1,boxShadow:'0 6px 20px rgba(245,158,11,.3)'}}>
                    {certLoad?t('vpp.generating'):t('vpp.get_certificate')}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile backdrop */}
        {isMobile&&sideOpen&&(
          <div
            className="fm-backdrop-blur-in"
            onClick={()=>setSideOpen(false)}
            style={{position:'fixed',inset:0,background:'var(--fm-overlay)',zIndex:40}}
          />
        )}

        {/* ── Sidebar ── */}
        {sideOpen&&(
          <div
            className={isMobile?'vp-sidebar-mobile':''}
            style={isMobile?{
              position:'fixed',
              right:0,
              top:topBarH,
              bottom:0,
              width:'min(88vw, 320px)',
              zIndex:50,
              background:C.panel,
              borderLeft:`1px solid ${C.border}`,
              borderTop:`1px solid ${C.border}`,
              display:'flex',
              flexDirection:'column',
              overflow:'hidden',
            }:{
              width:300,
              background:C.panel,
              borderLeft:`1px solid ${C.border}`,
              display:'flex',
              flexDirection:'column',
              overflow:'hidden',
              flexShrink:0,
              maxHeight:`calc(100vh - ${topBarH}px)`,
              position:'sticky',
              top:topBarH,
            }}>

            {/* Sidebar header */}
            <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.border}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
              <div style={{minWidth:0}}>
                <p style={{color:'#fff',fontWeight:800,fontSize:14,margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t('vpp.course_content')}</p>
                <p style={{color:C.muted,fontSize:11,margin:0}}>
                  {t('vpp.lessons_fraction',{done:progress.completed_ids.length,total:lessons.length})}
                </p>
              </div>
              {isMobile&&(
                <button onClick={()=>setSideOpen(false)}
                  style={{background:'var(--fm-surface-hover)',border:`1px solid ${C.border}`,borderRadius:8,padding:'6px',cursor:'pointer',color:C.muted,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Lesson list */}
            <div style={{flex:1,overflowY:'auto'}}>
              {lessons.map((l,i)=>{
                const done  = progress.completed_ids.includes(l.id);
                const act   = l.id===lesson?.id;
                const watch = canWatch(l);
                return(
                  <button key={l.id}
                    onClick={()=>watch?goTo(l):navigate(`/courses/${courseId}`)}
                    style={{width:'100%',textAlign:'left',padding:'11px 14px',display:'flex',alignItems:'flex-start',gap:11,background:act?'rgba(124,108,246,.15)':'transparent',borderLeft:act?`3px solid ${C.accent}`:'3px solid transparent',borderRight:'none',borderTop:'none',borderBottom:`1px solid ${C.border}`,cursor:'pointer',transition:'background .15s',boxSizing:'border-box'}}
                    onMouseEnter={e=>{if(!act)e.currentTarget.style.background='var(--fm-border-soft)';}}
                    onMouseLeave={e=>{if(!act)e.currentTarget.style.background='transparent';}}>

                    <div style={{marginTop:1,width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,
                      background:!watch?'var(--fm-border-soft)':done?'rgba(16,185,129,.18)':act?'rgba(124,108,246,.22)':'var(--fm-border-soft)',
                      border:`1px solid ${!watch?C.dim:done?C.emerald:act?C.accent:C.border}`,
                      color:!watch?C.dim:done?C.emerald:act?C.accent:C.muted}}>
                      {!watch?(
                        <svg width={10} height={10} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      ):done?(
                        <svg width={10} height={10} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                      ):i+1}
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:600,lineHeight:1.4,margin:'0 0 3px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',
                        color:!watch?C.dim:act?'#fff':done?C.muted:C.text}}>
                        {l.title}
                      </p>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        {l.duration_min>0&&<span style={{color:C.dim,fontSize:10}}>{l.duration_min}m</span>}
                        {!watch&&<span style={{color:C.dim,fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.3,background:'var(--fm-surface-hover)',padding:'1px 6px',borderRadius:4}}>{t('cdp.paid')}</span>}
                        {l.is_free_preview&&<span style={{color:C.emerald,fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.3,background:'rgba(16,185,129,.1)',padding:'1px 6px',borderRadius:4}}>{t('cdp.free')}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
