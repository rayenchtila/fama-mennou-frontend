// src/page/ProjectDetailPage.js
// Standalone, public project preview — the actual destination of a project's
// "share" link (Facebook/WhatsApp/Instagram/copy-link, see ProjectsPage.js's
// MyProjectCard). Needs its own page because every other project-related
// view in the app is either the client's own private "My Projects" list
// (ProjectsPage.js, PrivateRoute) or buried inside the freelancer dashboard —
// neither is reachable by someone arriving fresh from an external link, and
// a "share" whose link just shows a blank login wall defeats the entire
// point of sharing outside the platform. No login required to view.
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/Seohead';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

function timeAgo(t, date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return t('prp.time.now');
  const m = Math.floor(s / 60);  if (m < 60) return t('prp.time.min', { count: m });
  const h = Math.floor(m / 60);  if (h < 24) return t('prp.time.hour', { count: h });
  const d = Math.floor(h / 24);  if (d < 30) return t('prp.time.day', { count: d });
  return new Date(date).toLocaleDateString();
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}
function tint(seed = '') {
  const hues = [252, 199, 271, 168, 24];
  const h = hues[(seed.charCodeAt(0) || 0) % hues.length];
  return { bg: `hsl(${h} 70% 92% / 1)`, fg: `hsl(${h} 55% 38% / 1)`, dark: `hsl(${h} 60% 60% / 1)` };
}

const Ic = {
  back:   (s=15) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  dollar: (s=12) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  clock:  (s=12) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  level:  (s=12) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 12-4-4v3H3v2h15v3z"/></svg>,
  pin:    (s=12) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  logo:   (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a5 5 0 1 0 5 5"/><path d="M15 12a5 5 0 1 0-5-5"/></svg>,
};

export default function ProjectDetailPage({ onLogin }) {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false);
    fetch(`${API}/projects/by-id/${encodeURIComponent(id)}`)
      .then(r => { if (r.status === 404) throw new Error('not_found'); return r.json(); })
      .then(async (p) => {
        if (cancelled) return;
        setProject(p);
        // Resolve the client's display name/region client-side, from the
        // public directory — never render client_email itself on a page
        // anyone on the internet can open.
        try {
          const users = await fetch(`${API}/users/public`).then(r => r.json());
          const match = Array.isArray(users)
            ? users.find(u => u.email?.toLowerCase() === p.client_email?.toLowerCase())
            : null;
          if (!cancelled) setClient(match || null);
        } catch { if (!cancelled) setClient(null); }
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (project?.title) document.title = `${project.title} | FamaMennou`;
  }, [project]);

  function handleApply() {
    const target = `/clients?applyProjectId=${project.id}`;
    if (!user) { onLogin?.('login', false, target); return; }
    navigate(target);
  }

  const keywords = project?.keywords ? project.keywords.split(/\s+/).filter(Boolean) : [];
  const clientTint = tint(project?.client_email || '');
  const isOwnProject = user?.email && project?.client_email && user.email.toLowerCase() === project.client_email.toLowerCase();

  return (
    <div style={{ minHeight:'100vh', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>
      {project && (
        <SEOHead
          title={project.title}
          url={`/project/${project.id}`}
          description={(project.description || '').slice(0, 155) || t('prp.detail.seo_fallback')}
          keywords={keywords.join(', ')}
        />
      )}

      {/* Minimal top bar — no full Navbar, this page stands alone for outside visitors */}
      <div style={{ borderBottom:'1px solid var(--fm-border)', padding:'16px clamp(16px,4vw,32px)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'var(--fm-primary-light)', textDecoration:'none', fontWeight:900, fontSize:16 }}>
          {Ic.logo(22)} FamaMennou
        </Link>
        <button onClick={() => navigate(-1)}
          style={{ display:'inline-flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid var(--fm-border)', borderRadius:10, padding:'7px 14px', color:'var(--fm-text-5)', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
          {Ic.back(13)} {t('prp.detail.back')}
        </button>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'clamp(24px,5vw,48px) clamp(16px,4vw,24px) 80px' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ height:32, width:'70%', borderRadius:8, background:'var(--fm-surface-hover-soft)', animation:'pdPulse 1.4s ease infinite' }}/>
            <div style={{ height:100, borderRadius:16, background:'var(--fm-surface-hover-soft)', animation:'pdPulse 1.4s ease infinite' }}/>
            <div style={{ height:200, borderRadius:16, background:'var(--fm-surface-hover-soft)', animation:'pdPulse 1.4s ease infinite' }}/>
          </div>
        ) : notFound ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontSize:20, fontWeight:900, color:'var(--fm-text-1)', margin:'0 0 8px' }}>{t('prp.detail.not_found_title')}</p>
            <p style={{ fontSize:14, color:'var(--fm-text-6)', margin:'0 0 20px' }}>{t('prp.detail.not_found_sub')}</p>
            <Link to="/" style={{ display:'inline-flex', padding:'10px 20px', borderRadius:12, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
              {t('prp.detail.go_home')}
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, ease:'easeOut' }}>
            {/* Header card */}
            <div style={{ borderRadius:24, background:'linear-gradient(140deg,var(--fm-primary-soft) 0%,var(--fm-surface) 55%,var(--fm-bg) 100%)', border:'1px solid var(--fm-primary-soft-strong)', boxShadow:'0 30px 80px -20px rgba(0,0,0,0.5)', padding:'clamp(22px,4vw,34px)', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:800, color:'var(--fm-primary-light)', background:'rgba(124,108,246,0.12)', border:'1px solid rgba(124,108,246,0.25)', padding:'4px 12px', borderRadius:20 }}>
                  {t('prp.detail.badge')}
                </span>
                <span style={{ fontSize:12, color:'var(--fm-text-7)' }}>{timeAgo(t, project.created_at)}</span>
              </div>
              <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:900, color:'var(--fm-text-1)', margin:'0 0 16px', letterSpacing:'-0.02em', lineHeight:1.2 }}>
                {project.title}
              </h1>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {project.budget && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:800, color:'var(--fm-primary-light)', background:'rgba(124,108,246,0.1)', border:'1px solid rgba(124,108,246,0.22)', borderRadius:10, padding:'6px 13px' }}>
                    {Ic.dollar(12)} {Number(project.budget).toLocaleString('fr-TN')} TND
                  </span>
                )}
                {project.period && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--fm-text-6)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:10, padding:'6px 13px' }}>
                    {Ic.clock(12)} {project.period}
                  </span>
                )}
                {project.experience && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--fm-text-6)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:10, padding:'6px 13px' }}>
                    {Ic.level(12)} {project.experience}
                  </span>
                )}
                {project.region && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--fm-text-6)', background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', borderRadius:10, padding:'6px 13px' }}>
                    {Ic.pin(12)} {project.region}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div style={{ borderRadius:20, background:'var(--fm-surface-hover-soft)', border:'1px solid var(--fm-border)', padding:'22px 24px', marginBottom:20 }}>
                <p style={{ fontSize:11, fontWeight:800, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 10px' }}>{t('prp.detail.description')}</p>
                <p style={{ fontSize:14.5, color:'var(--fm-text-3)', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{project.description}</p>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:20 }}>
                {keywords.map((kw, i) => (
                  <span key={i} style={{ fontSize:12, fontWeight:700, color:'var(--fm-primary)', background:'rgba(124,108,246,0.08)', border:'1px solid rgba(124,108,246,0.16)', borderRadius:20, padding:'4px 12px' }}>{kw}</span>
                ))}
              </div>
            )}

            {/* Client card */}
            <div style={{ display:'flex', alignItems:'center', gap:14, borderRadius:18, background:'var(--fm-surface-hover-soft)', border:'1px solid var(--fm-border)', padding:'16px 20px', marginBottom:28 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:clientTint.bg, color:clientTint.fg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, flexShrink:0 }}>
                {initials(client?.name)}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:800, color:'var(--fm-text-1)', margin:'0 0 2px' }}>{client?.name || t('prp.detail.client_fallback')}</p>
                <p style={{ fontSize:12, color:'var(--fm-text-7)', margin:0 }}>{client?.region ? client.region : t('prp.detail.member')}</p>
              </div>
            </div>

            {/* CTA */}
            {isOwnProject ? (
              <Link to="/projects"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', padding:'15px', borderRadius:16, background:'var(--fm-border-soft)', border:'1px solid var(--fm-border)', color:'var(--fm-text-3)', fontWeight:800, fontSize:14.5, textDecoration:'none' }}>
                {t('prp.detail.view_in_my_projects')}
              </Link>
            ) : user?.role === 'client' || user?.isAdmin ? null : (
              <button onClick={handleApply}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', padding:'15px', borderRadius:16, background:'linear-gradient(135deg,#7c6cf6,#6254d4)', border:'none', color:'#fff', fontWeight:800, fontSize:14.5, cursor:'pointer', boxShadow:'0 10px 32px -8px rgba(124,108,246,0.55)' }}>
                {t('prp.detail.apply_cta')}
              </button>
            )}
          </motion.div>
        )}
      </div>
      <style>{`@keyframes pdPulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
    </div>
  );
}
