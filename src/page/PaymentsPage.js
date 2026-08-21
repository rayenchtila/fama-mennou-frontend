import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const C = {
  bg:'#070b14', card:'rgba(255,255,255,0.028)', cardHov:'rgba(255,255,255,0.05)',
  border:'rgba(255,255,255,0.07)', borderAcc:'rgba(124,108,246,0.45)',
  accent:'#7c6cf6', accentMid:'#9b8cff', accentDim:'rgba(124,108,246,0.1)',
  emerald:'#10b981', emeraldDim:'rgba(16,185,129,0.1)', emeraldBord:'rgba(16,185,129,0.28)',
  sky:'#0ea5e9', skyDim:'rgba(14,165,233,0.1)', skyBord:'rgba(14,165,233,0.28)',
  amber:'#f59e0b', amberDim:'rgba(245,158,11,0.1)', amberBord:'rgba(245,158,11,0.28)',
  text:'#f4f3fb', sub:'#a7abc8', muted:'#62668a',
};

const COURSE_STATUS = {
  en_attente:{ labelKey:'ppg.status.pending',     color:C.amber,   bg:C.amberDim,   border:C.amberBord,   descKey:'ppg.course.pending_desc',     icon:'clock' },
  en_cours:  { labelKey:'ppg.status.in_progress', color:C.sky,     bg:C.skyDim,     border:C.skyBord,     descKey:'ppg.course.in_progress_desc', icon:'clock' },
  termine:   { labelKey:'ppg.status.done',        color:C.emerald, bg:C.emeraldDim, border:C.emeraldBord, descKey:'ppg.course.done_desc',        icon:'check' },
};
const PROJ_STATUS = {
  en_attente:{ labelKey:'ppg.status.pending', color:C.amber,   bg:C.amberDim,   border:C.amberBord,   descKey:'ppg.proj.pending_desc', icon:'clock' },
  recu:      { labelKey:'ppg.status.paid',    color:C.emerald, bg:C.emeraldDim, border:C.emeraldBord, descKey:'ppg.proj.paid_desc',    icon:'check' },
};

const IcDollar = ({s=18}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcClock  = ({s=12}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IcCheck  = ({s=18}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcCard    = ({s=32}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcReceipt = ({s=36}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>;

function StatusBadge({ statusKey, map }) {
  const { t } = useTranslation();
  const s = map[statusKey] || map.en_attente;
  const Icon = s.icon === 'check' ? IcCheck : IcClock;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:700, color:s.color, whiteSpace:'nowrap' }}>
      <Icon s={10}/>
      {t(s.labelKey)}
    </span>
  );
}

function PaymentRow({ label, subLabel, date, amount, statusKey, statusMap }) {
  const { t } = useTranslation();
  const s = statusMap[statusKey] || statusMap.en_attente;
  return (
    <div style={{ padding:'20px 24px', borderRadius:18, background:C.card, border:`1px solid ${C.border}`, transition:'all .22s' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.borderAcc; e.currentTarget.style.background=C.cardHov; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 28px -8px rgba(124,108,246,0.2)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.card; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:8 }}>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:15, fontWeight:800, color:C.text, margin:'0 0 4px', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</p>
          {subLabel && <p style={{ fontSize:12, color:C.muted, margin:'0 0 3px' }}>{subLabel}</p>}
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:C.muted }}><IcClock s={11}/>{date}</span>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontSize:20, fontWeight:900, color:C.text, margin:'0 0 7px', letterSpacing:'-0.025em' }}>{Number(amount||0).toFixed(2)} <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>TND</span></p>
          <StatusBadge statusKey={statusKey} map={statusMap}/>
        </div>
      </div>
      <p style={{ fontSize:11.5, color:C.muted, margin:0, lineHeight:1.5 }}>{t(s.descKey)}</p>
    </div>
  );
}

function SectionBlock({ title, count, children, loading }) {
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.09em', margin:0 }}>{title}</p>
        <span style={{ padding:'2px 9px', borderRadius:8, background:C.accentDim, border:`1px solid ${C.borderAcc}`, color:C.accentMid, fontSize:10, fontWeight:800 }}>{count}</span>
      </div>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...Array(2)].map((_,i) => <div key={i} style={{ height:88, borderRadius:18, background:C.card, animation:'ppPulse 1.5s ease infinite' }}/>)}
        </div>
      ) : children}
    </div>
  );
}

function EmptyHistory({ text }) {
  return (
    <div style={{ textAlign:'center', padding:'36px 20px', background:C.card, border:`1px solid ${C.border}`, borderRadius:18 }}>
      <div style={{ color:C.muted, display:'flex', justifyContent:'center', margin:'0 0 8px' }}><IcReceipt s={36}/></div>
      <p style={{ fontSize:13, fontWeight:600, color:C.muted, margin:0 }}>{text}</p>
    </div>
  );
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { user, accounts } = useAuth();
  const [courses,  setCourses]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const endpoint = user.role === 'freelancer'
      ? `${API}/projects/assigned/${encodeURIComponent(user.email)}`
      : `${API}/projects/${encodeURIComponent(user.email)}`;

    Promise.all([
      fetch(`${API}/course-requests/mine?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch(endpoint).then(r=>r.json()).then(rows=>(Array.isArray(rows)?rows:[]).filter(p=>p.status==='in_progress'||p.status==='completed')).catch(()=>[]),
    ]).then(([c,p]) => {
      if (Array.isArray(c)) setCourses(c);
      setProjects(p);
      setLoading(false);
    });
  }, [user?.email, user?.role]);

  if (!user) return null;

  const allItems    = [...courses, ...projects];
  const totalAmt    = allItems.reduce((s,x)=>s+Number(x.amount||0),0);
  const pendingCnt  = allItems.filter(x=>x.payment_status==='en_attente').length;
  const confirmedCnt= allItems.filter(x=>x.payment_status==='termine'||x.payment_status==='recu').length;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", paddingBottom:80 }}>

      {/* Blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,108,246,0.12),transparent 68%)', top:'-200px', left:'-150px', animation:'ppBlob1 20s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 68%)', top:'30%', right:'-160px', animation:'ppBlob2 25s ease-in-out infinite' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', margin:'0 auto', padding:'clamp(88px,10vw,100px) clamp(16px,3vw,24px) 0' }}>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:32 }}>
          {[
            { label:t('ppg.total_spent'),  value:loading?'—':`${totalAmt.toFixed(0)} TND`,    color:C.accentMid, bg:C.accentDim, border:'rgba(124,108,246,0.25)', icon:<IcDollar s={20}/> },
            { label:t('ppg.pending'),     value:loading?'—':t('ppg.n_payments',{count:pendingCnt}),           color:C.amber,     bg:C.amberDim,  border:C.amberBord,             icon:<IcClock s={20}/>  },
            { label:t('ppg.confirmed'),      value:loading?'—':t('ppg.n_payments',{count:confirmedCnt}),         color:C.emerald,   bg:C.emeraldDim,border:C.emeraldBord,           icon:<IcCheck s={20}/>  },
          ].map(c => (
            <div key={c.label} style={{ padding:'24px 22px', borderRadius:20, background:c.bg, border:`1px solid ${c.border}`, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${c.color}18,transparent 70%)`, transform:'translate(20px,-20px)', pointerEvents:'none' }}/>
              <div style={{ width:46, height:46, borderRadius:14, background:`${c.color}20`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, color:c.color, border:`1px solid ${c.border}` }}>{c.icon}</div>
              <p style={{ fontSize:24, fontWeight:900, color:c.color, margin:'0 0 4px', letterSpacing:'-0.03em' }}>{c.value}</p>
              <p style={{ fontSize:10.5, fontWeight:700, color:c.color, opacity:0.75, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ padding:'22px 26px', borderRadius:20, background:C.card, border:`1px solid ${C.border}`, marginBottom:32 }}>
          <p style={{ fontSize:14, fontWeight:800, color:C.text, margin:'0 0 16px', letterSpacing:'-0.01em' }}>{t('ppg.how_it_works')}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              t('ppg.step1'),
              t('ppg.step2'),
              t('ppg.step3'),
            ].map((step,i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <span style={{ width:24, height:24, borderRadius:8, background:C.accentDim, border:`1px solid ${C.borderAcc}`, color:C.accentMid, fontSize:11, fontWeight:900, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                <p style={{ fontSize:13.5, color:C.sub, margin:0, lineHeight:1.55 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Courses */}
        <SectionBlock title={t('ppg.history_courses')} count={courses.length} loading={loading}>
          {courses.length === 0 ? <EmptyHistory text={t('ppg.no_course_payments')}/> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {courses.map(item => (
                <PaymentRow key={item.id} label={item.course_title} amount={item.amount} statusKey={item.payment_status} statusMap={COURSE_STATUS}
                  date={new Date(item.requested_at).toLocaleDateString('fr-TN',{day:'2-digit',month:'long',year:'numeric'})}/>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Projects */}
        <SectionBlock title={t('ppg.history_projects')} count={projects.length} loading={loading}>
          {projects.length === 0 ? <EmptyHistory text={t('ppg.no_project_payments')}/> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {projects.map(item => {
                const otherEmail = user.role==='freelancer' ? item.client_email : item.freelancer_email;
                const otherAcc   = accounts?.[otherEmail?.toLowerCase()];
                const otherName  = otherAcc?.name || item.client_name || item.freelancer_name || otherEmail || '—';
                const label      = user.role==='freelancer' ? t('ppg.client_label',{name:otherName}) : t('ppg.freelancer_label',{name:otherName});
                return (
                  <PaymentRow key={item.id} label={item.title} amount={item.amount} statusKey={item.payment_status} statusMap={PROJ_STATUS}
                    subLabel={label}
                    date={new Date(item.accepted_at||item.created_at).toLocaleDateString('fr-TN',{day:'2-digit',month:'long',year:'numeric'})}/>
                );
              })}
            </div>
          )}
        </SectionBlock>
      </div>

      <style>{`
        @keyframes ppBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(50px,-40px)scale(1.08)} }
        @keyframes ppBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-40px,30px)scale(1.06)} }
        @keyframes ppPulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
