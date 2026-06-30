import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const C = {
  bg:     '#07060f',
  panel:  '#0e0c1a',
  accent: '#7c6cf6',
  purple: '#a855f7',
  emerald:'#10b981',
  amber:  '#f59e0b',
  rose:   '#f43f5e',
  text:   '#f1f5f9',
  muted:  '#94a3b8',
  dim:    '#475569',
  border: 'rgba(255,255,255,0.08)',
  card:   'rgba(255,255,255,0.04)',
};

const GS = `
@keyframes vpSpin{to{transform:rotate(360deg)}}
@keyframes vpUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes vpFade{from{opacity:0}to{opacity:1}}
`;

/* ── YouTube helpers ── */
function isYT(url=''){return /youtube\.com|youtu\.be/.test(url);}
function getYTId(url=''){const m=url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);return m?m[1]:'';}

/* ── MuxPlayer ── */
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

/* ── VideoPlayer ── */
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

/* ── CertificateCard ── */
function CertificateCard({cert}){
  const { t } = useTranslation();
  return(
    <div style={{marginTop:24,padding:'28px',borderRadius:18,background:'linear-gradient(135deg,rgba(245,158,11,.12),rgba(251,191,36,.08))',border:'2px solid rgba(245,158,11,.35)',textAlign:'center',animation:'vpUp .4s ease'}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
        <svg width={44} height={44} fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H2V2h4M18 9h4V2h-4M6 9a6 6 0 0 0 12 0M12 15v4M8 19h8"/></svg>
      </div>
      <h3 style={{fontSize:18,fontWeight:900,color:'#fbbf24',marginBottom:8}}>{t('vpp.cert_title')}</h3>
      <p style={{color:'#f59e0b',fontSize:14,lineHeight:1.6,marginBottom:14}}>
        {t('vpp.cert_awarded_to')} <strong style={{color:'#fff'}}>{cert.student_name}</strong> {t('vpp.cert_for_completing')}<br/>
        <strong style={{color:'#fff'}}>{cert.course_title}</strong>
      </p>
      <code style={{display:'inline-block',fontSize:12,color:'#fbbf24',background:'rgba(245,158,11,.15)',borderRadius:8,padding:'6px 14px',marginBottom:12,fontFamily:'monospace'}}>
        {cert.certificate_uid}
      </code>
      <p style={{color:'#d97706',fontSize:12}}>
        {t('vpp.cert_issued_on', { date: new Date(cert.issued_at).toLocaleDateString('fr-FR') })}
        {cert.instructor_name?` · ${t('vpp.cert_instructor', { name: cert.instructor_name })}`:''}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function VideoPlayerPage(){
  const { t } = useTranslation();
  const {courseId,lessonId}=useParams();
  const navigate=useNavigate();
  const {user}=useAuth();

  const [lessons,     setLessons]     = useState([]);
  const [lesson,      setLesson]      = useState(null);
  const [course,      setCourse]      = useState(null);
  const [progress,    setProgress]    = useState({completed_ids:[],pct:0});
  const [cert,        setCert]        = useState(null);
  const [marking,     setMarking]     = useState(false);
  const [certLoad,    setCertLoad]    = useState(false);
  const [sideOpen,    setSideOpen]    = useState(true);
  const [purchases,   setPurchases]   = useState([]);

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

  const curIdx  = lessons.findIndex(l=>l.id===lesson?.id);
  const prevL   = curIdx>0?lessons[curIdx-1]:null;
  const nextL   = curIdx<lessons.length-1?lessons[curIdx+1]:null;
  const isDone  = progress.completed_ids.includes(lesson?.id);

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

  function goTo(l){navigate(`/courses/${courseId}/lesson/${l.id}`);setLesson(l);}

  /* ── render ── */
  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',paddingTop:64}}>
      <style>{GS}</style>

      {/* ── top bar ── */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',position:'sticky',top:64,zIndex:30,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'}}>
        <button onClick={()=>navigate(`/courses/${courseId}`)}
          style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.muted,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0,padding:0,transition:'color .2s'}}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'}
          onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
          <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {t('vpp.back')}
        </button>

        <div style={{width:1,height:20,background:C.border,flexShrink:0}}/>

        <div style={{flex:1,minWidth:0}}>
          <p style={{color:'#fff',fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>{course?.title}</p>
        </div>

        {/* progress */}
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:100,height:5,borderRadius:3,background:'rgba(255,255,255,.1)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress.pct}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:3,transition:'width .5s ease'}}/>
          </div>
          <span style={{color:C.muted,fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{Math.round(progress.pct)}%</span>
        </div>

        {/* sidebar toggle */}
        <button onClick={()=>setSideOpen(v=>!v)}
          style={{padding:'7px 9px',borderRadius:9,background:sideOpen?'rgba(124,108,246,.18)':'rgba(255,255,255,.06)',border:`1px solid ${sideOpen?'rgba(124,108,246,.4)':C.border}`,color:sideOpen?C.accent:C.muted,cursor:'pointer',flexShrink:0,transition:'all .2s'}}
          title={t('vpp.toggle_sidebar')}>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      {/* ── body ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>

        {/* main */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',overflowY:'auto'}}>

          {/* video */}
          <div style={{background:'#000',position:'relative'}}>
            {canWatch(lesson)?(
              <div style={{position:'relative',userSelect:'none'}} onContextMenu={e=>e.preventDefault()}>
                <VideoPlayer url={lesson?.video_url}/>
                {/* watermark */}
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:10,pointerEvents:'none'}}>
                  <p style={{color:'rgba(255,255,255,.09)',fontSize:15,fontWeight:700,letterSpacing:'.05em',transform:'rotate(-25deg)',whiteSpace:'nowrap',userSelect:'none',pointerEvents:'none'}}>
                    {user?.name||user?.email}
                  </p>
                </div>
              </div>
            ):(
              <div style={{width:'100%',aspectRatio:'16/9',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,padding:'0 24px',textAlign:'center'}}>
                <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <div>
                  <p style={{color:'#fff',fontWeight:800,fontSize:16,marginBottom:6}}>{t('vpp.lesson_locked')}</p>
                  <p style={{color:C.muted,fontSize:14,maxWidth:320}}>{t('cdp.locked_msg')}</p>
                </div>
                <button onClick={()=>navigate(`/courses/${courseId}`)}
                  style={{padding:'11px 28px',borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.purple})`,color:'#fff',fontSize:14,fontWeight:700,border:'none',cursor:'pointer',boxShadow:'0 8px 24px rgba(124,108,246,.35)'}}>
                  {t('vpp.buy_course_arrow')}
                </button>
              </div>
            )}
          </div>

          {/* lesson info */}
          <div style={{maxWidth:860,margin:'0 auto',width:'100%',padding:'28px 24px 60px',animation:'vpUp .4s ease'}}>

            {/* header */}
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:20,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:0}}>
                <h1 style={{fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:'#fff',margin:'0 0 6px',lineHeight:1.25}}>{lesson?.title}</h1>
                {lesson?.description&&<p style={{color:C.muted,fontSize:14,margin:0,lineHeight:1.6}}>{lesson.description}</p>}
              </div>
              <button onClick={markComplete} disabled={marking||isDone}
                style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:11,background:isDone?'rgba(16,185,129,.12)':'linear-gradient(135deg,#7c6cf6,#a855f7)',color:isDone?C.emerald:'#fff',border:isDone?'1px solid rgba(16,185,129,.3)':'none',fontWeight:700,fontSize:13,cursor:isDone?'default':'pointer',flexShrink:0,opacity:marking?.7:1,transition:'all .2s',boxShadow:isDone?'none':'0 6px 20px rgba(124,108,246,.35)'}}>
                <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {isDone?t('vpp.completed'):marking?t('vpp.saving'):t('vpp.mark_complete')}
              </button>
            </div>

            {/* progress bar */}
            <div style={{marginBottom:22}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{color:C.muted,fontSize:12,fontWeight:600}}>{t('vpp.course_progress')}</span>
                <span style={{color:progress.pct===100?C.emerald:C.accent,fontSize:12,fontWeight:700}}>{Math.round(progress.pct)}% · {t('vpp.lessons_fraction', { done: progress.completed_ids.length, total: lessons.length })}</span>
              </div>
              <div style={{height:6,borderRadius:4,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${progress.pct}%`,background:progress.pct===100?`linear-gradient(90deg,${C.emerald},#059669)`:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:4,transition:'width .6s ease'}}/>
              </div>
            </div>

            {/* prev / next */}
            <div style={{display:'flex',gap:12,marginBottom:28}}>
              <button onClick={()=>prevL&&goTo(prevL)} disabled={!prevL}
                style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:10,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:prevL?C.text:C.dim,fontWeight:600,fontSize:13,cursor:prevL?'pointer':'not-allowed',transition:'all .2s',opacity:prevL?1:.4}}
                onMouseEnter={e=>prevL&&(e.currentTarget.style.background='rgba(255,255,255,.1)')}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                {t('vpp.previous')}
              </button>
              <button onClick={()=>nextL&&goTo(nextL)} disabled={!nextL}
                style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:10,background:nextL?`linear-gradient(135deg,${C.accent},${C.purple})`:'rgba(255,255,255,.06)',border:'none',color:nextL?'#fff':C.dim,fontWeight:700,fontSize:13,cursor:nextL?'pointer':'not-allowed',transition:'all .2s',marginLeft:'auto',opacity:nextL?1:.4,boxShadow:nextL?'0 4px 16px rgba(124,108,246,.3)':'none'}}>
                {t('vpp.next')}
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* certificate */}
            {progress.pct===100&&(
              cert?<CertificateCard cert={cert}/>:(
                <div style={{padding:'24px',borderRadius:18,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',textAlign:'center',animation:'vpFade .5s ease'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
                    <svg width={38} height={38} fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <p style={{color:'#fbbf24',fontWeight:800,fontSize:16,marginBottom:14}}>{t('vpp.all_lessons_done')}</p>
                  <button onClick={claimCert} disabled={certLoad}
                    style={{padding:'11px 28px',borderRadius:11,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:'pointer',opacity:certLoad?.6:1,boxShadow:'0 6px 20px rgba(245,158,11,.3)'}}>
                    {certLoad?t('vpp.generating'):t('vpp.get_certificate')}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── sidebar ── */}
        {sideOpen&&(
          <div style={{width:300,background:C.panel,borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0,maxHeight:'calc(100vh - 128px)',position:'sticky',top:128}}>
            {/* sidebar header */}
            <div style={{padding:'16px 18px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <p style={{color:'#fff',fontWeight:800,fontSize:14,margin:'0 0 3px'}}>{t('vpp.course_content')}</p>
              <p style={{color:C.muted,fontSize:12,margin:0}}>
                <span style={{color:C.accent,fontWeight:700}}>{progress.completed_ids.length}</span> {t('vpp.lessons_completed_of', { total: lessons.length })}
              </p>
            </div>
            {/* lesson list */}
            <div style={{flex:1,overflowY:'auto'}}>
              {lessons.map((l,i)=>{
                const done  = progress.completed_ids.includes(l.id);
                const act   = l.id===lesson?.id;
                const watch = canWatch(l);
                return(
                  <button key={l.id}
                    onClick={()=>watch?goTo(l):navigate(`/courses/${courseId}`)}
                    style={{width:'100%',textAlign:'left',padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:12,background:act?'rgba(124,108,246,.15)':'transparent',borderLeft:act?`3px solid ${C.accent}`:'3px solid transparent',borderRight:'none',borderTop:'none',borderBottom:`1px solid ${C.border}`,cursor:'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>{if(!act)e.currentTarget.style.background='rgba(255,255,255,.04)';}}
                    onMouseLeave={e=>{if(!act)e.currentTarget.style.background='transparent';}}>

                    {/* status dot */}
                    <div style={{marginTop:1,width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,background:!watch?'rgba(255,255,255,.06)':done?'rgba(16,185,129,.2)':act?'rgba(124,108,246,.25)':'rgba(255,255,255,.06)',border:`1px solid ${!watch?C.dim:done?C.emerald:act?C.accent:C.border}`,color:!watch?C.dim:done?C.emerald:act?C.accent:C.muted}}>
                      {!watch?(
                        <svg width={11} height={11} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      ):done?<svg width={10} height={10} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>:i+1}
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:600,lineHeight:1.4,margin:'0 0 4px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',color:!watch?C.dim:act?'#fff':done?C.muted:C.text}}>
                        {l.title}
                      </p>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        {l.duration_min>0&&<span style={{color:C.dim,fontSize:11}}>{t('vpp.min', { count: l.duration_min })}</span>}
                        {!watch&&<span style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.3}}>{t('cdp.paid')}</span>}
                        {l.is_free_preview&&<span style={{color:C.emerald,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.3}}>{t('cdp.free')}</span>}
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
