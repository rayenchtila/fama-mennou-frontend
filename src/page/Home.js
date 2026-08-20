import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SEOHead, { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd, FAQJsonLd } from '../components/Seohead';
import HomeAdVideo from '../components/HomeAdVideo';
import DemoVideoSection from '../components/DemoVideoSection';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7c6cf6,#3ec2e8)',
  'linear-gradient(135deg,#a855f7,#6c8cf6)',
  'linear-gradient(135deg,#3ec2e8,#5b5ce0)',
];
function pickGradient(seed) {
  const code = (seed || '').charCodeAt(0) || 0;
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}
function getInitials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';
}

const COURSE_GRADIENTS = {
  Technology: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)',
  Design: 'linear-gradient(135deg,#a855f7,#6c8cf6)',
  Marketing: 'linear-gradient(135deg,#5b5ce0,#3ec2e8)',
  Writing: 'linear-gradient(135deg,#7c6cf6,#a855f7)',
  'E-commerce': 'linear-gradient(135deg,#3ec2e8,#5b5ce0)',
  Finance: 'linear-gradient(135deg,#a855f7,#3ec2e8)',
};
const DEFAULT_COURSE_GRADIENT = 'linear-gradient(135deg,#7c6cf6,#3ec2e8)';

const SEARCH_TYPES = ['freelancers', 'clients', 'courses'];
const SEARCH_LABELS = ['Freelancers', 'Clients', 'Courses'];
const SEARCH_PLACEHOLDERS = ['Name, skill, region…', 'Project type, sector…', 'React, SEO, Motion Design…'];

const ACTION_CARDS = [
  {
    to: '/freelancers',
    icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Hire Freelancers',
    desc: 'Browse verified talent by skill and region.',
    cta: 'Browse talent',
  },
  {
    to: '/clients',
    icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>,
    title: 'Get Clients',
    desc: 'Find open projects and win contracts.',
    cta: 'View projects',
  },
  {
    to: '/courses',
    icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    title: 'Learn Skills',
    desc: 'Take courses from expert freelancers.',
    cta: 'Explore courses',
  },
];

const HOW_IT_WORKS = [
  { num: '1', title: 'Create your account', desc: 'Sign up in minutes with quick ID verification.' },
  { num: '2', title: 'Choose your role', desc: 'Join as a freelancer, a client, or a learner.' },
  { num: '3', title: 'Start', desc: 'Hire talent, win projects, or learn new skills.' },
];

const FAQ_ITEMS = [
  { question: 'What is Fama Mennou?', answer: "Fama Mennou is Tunisia's all-in-one freelance ecosystem. Hire verified talent, win contracts as a freelancer, or grow your skills through expert-led courses — all in one place." },
  { question: 'How are freelancers verified?', answer: 'Every freelancer goes through an identity check using their national ID card. Our team reviews each profile to ensure quality, authenticity, and trustworthiness before they appear on the platform.' },
  { question: 'Is it free to create an account?', answer: 'Yes, signing up is completely free for freelancers, clients, and learners. A small commission applies only when a project is successfully completed.' },
  { question: 'How do I hire a freelancer?', answer: 'Browse the marketplace, filter by skill or region, and click "Hire" or send a message directly to any verified freelancer. You can also post a project and let freelancers apply to you.' },
  { question: 'What if I\'m not satisfied with the work?', answer: 'We have a structured dispute resolution process. Our support team mediates between both parties to reach a fair outcome. Client satisfaction is our top priority.' },
];

// ── Star icon ────────────────────────────────────────────────────────────────
function StarIcon({ size = 14, color = 'var(--fm-primary-light)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.1 20.3l1.7-6.6L2.6 8.8l6.8-.5z"/>
    </svg>
  );
}

// ── Shield icon ──────────────────────────────────────────────────────────────
function ShieldIcon({ size = 15, color = 'var(--fm-primary-light)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/>
    </svg>
  );
}

// ── Chevron right ─────────────────────────────────────────────────────────────
function ChevronRight({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

// ── Clock icon ───────────────────────────────────────────────────────────────
function ClockIcon({ size = 13, color = 'var(--fm-text-6)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  );
}

const CARD_STYLE = { background: 'var(--fm-surface)', border: '1px solid var(--fm-border)', borderRadius: '16px' };

// ── Section: Hero ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [typeIdx, setTypeIdx] = useState(0);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const SEARCH_LABELS = [t('home.search.tab1'), t('home.search.tab2'), t('home.search.tab3')];
  const SEARCH_PLACEHOLDERS = [t('home.search.ph1'), t('home.search.ph2'), t('home.search.ph3')];
  const TAB_COLORS = [
    { bg: '#7c6cf6', glow: 'rgba(124,108,246,.7)', shadow: 'rgba(124,108,246,.45)' },
    { bg: '#0ea5e9', glow: 'rgba(14,165,233,.7)',  shadow: 'rgba(14,165,233,.45)'  },
    { bg: '#14b8a6', glow: 'rgba(20,184,166,.7)',  shadow: 'rgba(20,184,166,.45)'  },
  ];
  const activeColor = TAB_COLORS[typeIdx];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    const paths = ['/freelancers', '/clients', '/courses'];
    navigate(q ? `${paths[typeIdx]}?q=${encodeURIComponent(q)}` : paths[typeIdx]);
  };

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="fm-hero-content" style={{ position: 'relative', maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>

        {/* Badge */}
        <style>{`
          @keyframes badgeShimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes badgePulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(124,108,246,0.0), 0 0 18px 2px rgba(124,108,246,0.18); }
            50%      { box-shadow: 0 0 0 4px rgba(124,108,246,0.10), 0 0 28px 6px rgba(62,194,232,0.22); }
          }
          @keyframes dotPulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:.6; transform:scale(1.5); }
          }
          .premium-badge-text {
            background: linear-gradient(90deg, #b9aeff 0%, #7c6cf6 20%, #3ec2e8 40%, #a78bfa 60%, #7c6cf6 80%, #b9aeff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: badgeShimmer 6s linear infinite;
          }
        `}</style>
        <motion.span
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '999px',
            background: 'linear-gradient(135deg, rgba(124,108,246,0.13) 0%, rgba(62,194,232,0.08) 100%)',
            border: '1px solid transparent',
            backgroundClip: 'padding-box',
            boxShadow: '0 0 0 1px rgba(124,108,246,0.35), 0 0 22px 2px rgba(124,108,246,0.15)',
            fontSize: '12.5px', fontWeight: 700, marginBottom: '24px',
            animation: 'badgePulse 3s ease-in-out infinite',
            backdropFilter: 'blur(8px)',
          }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--fm-primary-light),var(--fm-cyan))', boxShadow: '0 0 10px var(--fm-primary-light)', flexShrink:0, animation:'dotPulse 2s ease-in-out infinite' }} />
          <span className="premium-badge-text">{t('home.badge')}</span>
        </motion.span>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontWeight: 800, fontSize: 'clamp(34px,5.4vw,56px)', lineHeight: 1.06, letterSpacing: '-.03em', margin: '0 0 18px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.hero.title1')}<br />
          <span style={{ background: 'linear-gradient(110deg,var(--fm-primary-light),var(--fm-blue) 60%,var(--fm-cyan))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {t('home.hero.title2')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--fm-text-5)', maxWidth: '520px', margin: '0 auto 34px', lineHeight: 1.55 }}>
          {t('home.hero.subtitle')}
        </motion.p>

        {/* Post-a-project shortcut — every client account, new or old,
            approved or still pending (the /projects page itself already
            disables the actual Publier button and explains why for a
            pending client, so no extra gating is needed here). Never
            shown to freelancers, admins, or logged-out visitors. */}
        {user?.role === 'client' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}
            style={{ marginBottom: '28px' }}>
            <style>{`
              .fm-publish-cta {
                position: relative; overflow: hidden; isolation: isolate;
                transition: transform .25s cubic-bezier(0.34,1.36,0.64,1), box-shadow .3s ease, border-color .3s ease;
              }
              .fm-publish-cta::before {
                content: ''; position: absolute; inset: 0; z-index: -1;
                background: linear-gradient(115deg, transparent 30%, rgba(124,108,246,.16) 48%, rgba(62,194,232,.16) 52%, transparent 70%);
                transform: translateX(-140%);
                transition: transform .7s cubic-bezier(0.22,1,0.36,1);
              }
              .fm-publish-cta:hover::before, .fm-publish-cta:focus-visible::before { transform: translateX(140%); }
              .fm-publish-cta:hover, .fm-publish-cta:focus-visible {
                transform: translateY(-3px);
                box-shadow: 0 20px 44px -12px rgba(124,108,246,.55), 0 0 0 1px rgba(124,108,246,.3);
              }
              .fm-publish-icon { transition: transform .3s cubic-bezier(0.34,1.36,0.64,1); }
              .fm-publish-cta:hover .fm-publish-icon { transform: rotate(90deg) scale(1.08); }
            `}</style>
            <Link to="/projects?post=1" className="fm-publish-cta"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '9px 22px 9px 9px',
                borderRadius: '999px', background: '#fff', border: '1px solid rgba(124,108,246,.22)',
                fontFamily: 'inherit', textDecoration: 'none',
                boxShadow: '0 14px 32px -10px rgba(124,108,246,.4), 0 0 0 1px rgba(124,108,246,.12)',
              }}>
              <span className="fm-publish-icon" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', boxShadow: '0 4px 12px -3px rgba(124,108,246,.6)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </span>
              <span style={{ fontWeight: 800, fontSize: '14.5px', letterSpacing: '-.01em', background: 'linear-gradient(110deg,#3d3568,#5b4fb0 60%,#3d3568)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {t('home.publish_cta')}
              </span>
            </Link>
          </motion.div>
        )}

        {/* Active promotional video(s) — renders nothing when none are live */}
        <HomeAdVideo />

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          {/* Type tabs */}
          <div style={{ position: 'relative', display: 'flex', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border)', borderRadius: '13px', padding: '5px', marginBottom: '12px', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
            {/* Sliding pill */}
            <div style={{
              position: 'absolute',
              top: '5px', bottom: '5px',
              left: '5px',
              width: 'calc((100% - 10px) / 3)',
              borderRadius: '9px',
              background: TAB_COLORS[typeIdx].bg,
              boxShadow: `0 4px 14px -4px ${TAB_COLORS[typeIdx].glow}`,
              transform: `translateX(calc(${typeIdx} * 100%))`,
              transition: 'transform 0.35s cubic-bezier(0.34,1.36,0.64,1), background 0.25s ease, box-shadow 0.25s ease',
              pointerEvents: 'none',
            }} />
            {SEARCH_LABELS.map((label, i) => (
              <button key={label} onClick={() => setTypeIdx(i)}
                style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, borderRadius: '9px', background: 'transparent', position: 'relative', zIndex: 1, transition: 'color 0.2s ease', color: typeIdx === i ? '#fff' : 'var(--fm-text-5)' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Input */}
          <form onSubmit={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--fm-surface-2)', border: '1px solid var(--fm-border)', borderRadius: '14px', padding: '7px 7px 7px 16px', boxShadow: '0 18px 44px -18px rgba(0,0,0,.7)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={activeColor.bg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transition: 'stroke .2s' }}>
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDERS[typeIdx]}
              style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: 'var(--fm-text-2)', fontFamily: 'inherit', fontSize: '15px' }}
            />
            <button type="submit"
              style={{ padding: '11px 22px', borderRadius: '10px', background: activeColor.bg, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '14.5px', flex: 'none', boxShadow: `0 6px 16px -5px ${activeColor.glow}`, transition: 'background .2s, box-shadow .2s' }}>
              {t('home.search.btn')}
            </button>
          </form>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '26px' }}>
          <Link to="/freelancers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'var(--fm-primary)', color: '#fff', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '14.5px', boxShadow: '0 8px 22px -8px rgba(124,108,246,.7)', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('home.cta.hire_fl')}
          </Link>
          <Link to="/clients"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'var(--fm-surface-hover)', color: 'var(--fm-text-3)', border: '1px solid var(--fm-border-strong)', fontFamily: 'inherit', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>
            {t('home.cta.find_cl')}
          </Link>
          <Link to="/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'var(--fm-surface-hover)', color: 'var(--fm-text-3)', border: '1px solid var(--fm-border-strong)', fontFamily: 'inherit', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            {t('home.cta.learn')}
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

// ── Section: Action Cards ─────────────────────────────────────────────────────
function ActionCardsSection() {
  const { t } = useTranslation();
  const cards = [
    { to: '/freelancers', color: '#7c6cf6', colorDim: 'rgba(124,108,246,.16)', colorBd: 'rgba(124,108,246,.3)',  colorLight: '#b9aeff', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: t('home.ac.hire.title'), desc: t('home.ac.hire.desc'), cta: t('home.ac.hire.cta') },
    { to: '/clients',     color: '#0ea5e9', colorDim: 'rgba(14,165,233,.16)',  colorBd: 'rgba(14,165,233,.3)',   colorLight: '#38bdf8', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>, title: t('home.ac.client.title'), desc: t('home.ac.client.desc'), cta: t('home.ac.client.cta') },
    { to: '/courses',     color: '#14b8a6', colorDim: 'rgba(20,184,166,.16)',  colorBd: 'rgba(20,184,166,.3)',   colorLight: '#5eead4', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, title: t('home.ac.learn.title'), desc: t('home.ac.learn.desc'), cta: t('home.ac.learn.cta') },
  ];
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>
        {cards.map((card, i) => (
          <motion.div key={card.to}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Link to={card.to}
              style={{ ...CARD_STYLE, padding: '26px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: '14px', textDecoration: 'none', transition: 'box-shadow .18s,transform .18s,border-color .18s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = card.colorBd; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}>
              <span style={{ width: '48px', height: '48px', borderRadius: '13px', background: card.colorDim, border: `1px solid ${card.colorBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.colorLight }}>
                {card.icon}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--fm-text-1)', marginBottom: '5px' }}>{card.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--fm-text-5)', lineHeight: 1.5 }}>{card.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: card.colorLight, marginTop: 'auto' }}>
                {card.cta} <ChevronRight />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Step arrow SVG ────────────────────────────────────────────────────────────
function StepArrow() {
  return (
    <div className="hiw-arrow" style={{ flex: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '46px' }} aria-hidden="true">
      <svg width="72" height="30" viewBox="0 0 72 30" preserveAspectRatio="xMidYMid meet" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(124,108,246,.7))', overflow: 'visible' }}>
        <path d="M4 15h50" stroke="rgba(124,108,246,.6)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8"/>
        <path d="M52 5l13 10-13 10" stroke="rgba(124,108,246,.6)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  );
}

// ── Section: How It Works ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    { num: '1', title: t('home.hiw.s1t'), desc: t('home.hiw.s1d') },
    { num: '2', title: t('home.hiw.s2t'), desc: t('home.hiw.s2d') },
    { num: '3', title: t('home.hiw.s3t'), desc: t('home.hiw.s3d') },
  ];
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', letterSpacing: '-.025em', margin: '0 0 8px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.hiw.title')}
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.hiw.sub')}</p>
      </div>
      <style>{`@media(max-width:680px){.hiw-arrow{display:none!important}}`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <motion.div
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ flex: 1, minWidth: '200px', maxWidth: '260px', textAlign: 'center', padding: '8px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--fm-primary)', color: '#fff', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 18px -6px rgba(124,108,246,.7)' }}>
                {step.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: '17px', color: 'var(--fm-text-1)', marginBottom: '6px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{step.title}</div>
              <div style={{ fontSize: '14px', color: 'var(--fm-text-5)', lineHeight: 1.55, maxWidth: '280px', margin: '0 auto' }}>{step.desc}</div>
            </motion.div>
            {i < steps.length - 1 && <StepArrow />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

// ── Shared: loading skeleton / empty / error card ─────────────────────────────
function SkeletonCard({ height = 190 }) {
  return (
    <div style={{ ...CARD_STYLE, height, animation: 'fmPulse 1.6s ease-in-out infinite' }} />
  );
}
function StateMessage({ text }) {
  return (
    <div style={{ ...CARD_STYLE, gridColumn: '1/-1', padding: '40px 24px', textAlign: 'center', color: 'var(--fm-text-5)', fontSize: '14.5px' }}>
      {text}
    </div>
  );
}

// ── Data: top freelancers (highest rating, then most completed projects) ─────
// `rating` and `completedProjects` come pre-aggregated on the user record itself
// (see AuthContext.normalizeUser) — no per-freelancer fetch needed, and unlike
// /projects/assigned/:email (auth-only), this works for anonymous visitors too.
function useTopFreelancers(users, accountsLoaded) {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const items = useMemo(() => {
    const hasProfile = u => u?.photo && u?.bio && u?.portfolio_url && u?.skills && (Array.isArray(u.skills) ? u.skills.length > 0 : String(u.skills).trim().length > 0);
    const approved = (users || []).filter(u => u?.role === 'freelancer' && (isLocal || u?.cinStatus === 'approved') && hasProfile(u));
    return [...approved].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.completedProjects || 0) - (a.completedProjects || 0);
    }).slice(0, 3);
  }, [users, isLocal]);

  return { items, loading: !accountsLoaded, error: false };
}

// ── Section: Featured Freelancers ─────────────────────────────────────────────
function FeaturedFreelancersSection({ items, loading, error }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const empty = !loading && !error && items.length === 0;
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.ff.title')}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.ff.sub')}</p>
        </div>
        <Link to="/freelancers"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border-strong)', color: 'var(--fm-text-4)', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.ff.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '18px' }}>
        {loading && [0, 1, 2].map(i => <SkeletonCard key={i} />)}
        {!loading && error && <StateMessage text={t('home.ff.error')} />}
        {empty && <StateMessage text={t('home.ff.empty')} />}
        {!loading && !error && items.map((f, i) => {
          const skillsArr = (Array.isArray(f.skills) ? f.skills : String(f.skills || '').split(',')).map(s => String(s).trim()).filter(Boolean).slice(0, 3);
          const roleLabel = f.title || skillsArr[0] || '';
          const availDot   = f.availability === 'unavailable' ? 'var(--fm-danger)' : f.availability === 'busy' ? 'var(--fm-warning)' : 'var(--fm-success)';
          const availLabel = f.availability === 'unavailable' ? t('Unavailable') : f.availability === 'busy' ? t('Busy') : t('Available');
          return (
            <motion.div key={f.email}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{ ...CARD_STYLE, padding: '22px', transition: 'box-shadow .18s,border-color .18s', cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${encodeURIComponent(f.email)}`)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '16px' }}>
                {/* Real profile photo when the freelancer has one, falling back
                    to the gradient initials circle otherwise (most accounts
                    still have no photo). onError swaps back to initials if the
                    image 404s, so a dead Cloudinary URL can never leave a blank
                    hole in the card. */}
                {f.photo ? (
                  <img
                    src={cldImg(f.photo)}
                    alt={f.name || ''}
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', flex: 'none', background: 'var(--fm-surface-hover)' }}
                  />
                ) : null}
                <span style={{ width: '50px', height: '50px', borderRadius: '50%', background: pickGradient(f.email || f.name), color: '#fff', display: f.photo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flex: 'none' }}>
                  {getInitials(f.name)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15.5px', color: 'var(--fm-text-1)' }}>{f.name?.split(' ')[0]}</span>
                    <ShieldIcon size={15} color="var(--fm-primary-light)" />
                  </div>
                  {roleLabel && <div style={{ fontSize: '13px', color: 'var(--fm-text-5)', marginTop: '2px' }}>{roleLabel}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', flex: 'none' }}>
                  {f.rating > 0 ? (
                    <>
                      <StarIcon size={14} color="var(--fm-primary-light)" />
                      <span style={{ fontWeight: 700, color: 'var(--fm-text-1)' }}>{f.rating.toFixed(1)}</span>
                    </>
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--fm-text-6)' }}>{t('home.ff.new')}</span>
                  )}
                </div>
              </div>
              {/* Skills */}
              {skillsArr.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {skillsArr.map(s => (
                    <span key={s} style={{ fontSize: '12px', color: 'var(--fm-text-4)', background: 'var(--fm-surface-hover)', borderRadius: '7px', padding: '3px 9px', fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              )}
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid var(--fm-border)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: availDot }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: availDot, boxShadow: `0 0 6px ${availDot}`, flexShrink: 0 }} />
                  {availLabel}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Data: top open projects (most proposals, then lowest budget, then oldest) ─
function useTopProjects() {
  const [projects, setProjects]             = useState([]);
  const [proposalCounts, setProposalCounts] = useState({});
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // A 429/500 (e.g. right as Neon wakes from an idle suspend) returns a
    // non-array error body — previously that silently rendered as "no open
    // projects" instead of retrying, permanently hiding real data for the
    // rest of the session. Retry once before accepting an empty result.
    const fetchOpen = () => fetch(`${API}/projects/browse/open`).then(r => r.json());
    fetchOpen().then(rows => Array.isArray(rows) ? rows
      : new Promise(res => setTimeout(res, 2000)).then(fetchOpen)
    ).then(rows => {
      const open = Array.isArray(rows) ? rows : [];
      if (cancelled) return;
      setProjects(open);
      // Proposal counts come from the public aggregate endpoint. This used to
      // call /proposals/project/:id once per project — a route that returns
      // full proposal rows and is therefore restricted to the project owner,
      // so every other visitor got 401/403, the catch turned it into [], and
      // every card showed "0 propositions" regardless of reality.
      //
      // One batched request instead of one per project, and the value is a
      // live COUNT(*) so it rises on its own as real proposals arrive.
      if (!open.length) return;
      const ids = open.map(p => p.id).join(',');
      return fetch(`${API}/proposals/counts?ids=${ids}`)
        .then(r => r.json())
        .then(counts => {
          if (cancelled) return;
          setProposalCounts(counts && typeof counts === 'object' ? counts : {});
        })
        .catch(() => { /* leave counts empty rather than render a wrong number */ });
    }).catch(() => { if (!cancelled) { setError(true); setProjects([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => {
    return [...projects].sort((a, b) => {
      const propDiff = (proposalCounts[b.id] || 0) - (proposalCounts[a.id] || 0);
      if (propDiff !== 0) return propDiff;
      const budgetDiff = Number(a.budget || 0) - Number(b.budget || 0);
      if (budgetDiff !== 0) return budgetDiff;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }).slice(0, 3).map(p => ({ ...p, _proposalCount: proposalCounts[p.id] || 0 }));
  }, [projects, proposalCounts]);

  return { items, loading, error };
}

// ── Section: Trending Projects ────────────────────────────────────────────────
function TrendingProjectsSection({ items, loading, error, users }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const empty = !loading && !error && items.length === 0;
  const getClient = email => (users || []).find(u => u.email?.toLowerCase() === email?.toLowerCase());
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.tp.title')}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.tp.sub')}</p>
        </div>
        <Link to="/clients"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border-strong)', color: 'var(--fm-text-4)', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.tp.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: '18px' }}>
        {loading && [0, 1, 2].map(i => <SkeletonCard key={i} height={230} />)}
        {!loading && error && <StateMessage text={t('home.tp.error')} />}
        {empty && <StateMessage text={t('home.tp.empty')} />}
        {!loading && !error && items.map((p, i) => {
          const client      = getClient(p.client_email);
          const displayName = client?.company || client?.name || p.client_email?.split('@')[0] || '?';
          const isVerified  = client?.cinStatus === 'approved' || !client;
          const tags        = (p.keywords ? p.keywords.split(/\s+/).filter(Boolean) : []).slice(0, 3);
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{ ...CARD_STYLE, padding: '22px', transition: 'box-shadow .18s,border-color .18s', display: 'flex', flexDirection: 'column', gap: '13px', cursor: 'pointer' }}
              onClick={() => navigate('/clients')}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}>
              {/* Client */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: pickGradient(p.client_email || displayName), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flex: 'none' }}>{getInitials(displayName)}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--fm-text-4)' }}>{displayName.split(' ')[0]}</span>
                {isVerified && <ShieldIcon size={14} color="var(--fm-primary-light)" />}
              </div>
              {/* Title */}
              <div style={{ fontWeight: 700, fontSize: '17px', color: 'var(--fm-text-1)', letterSpacing: '-.01em', lineHeight: 1.3 }}>{p.title}</div>
              {/* Budget + duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {p.budget != null && <span style={{ fontSize: '14px', color: 'var(--fm-text-1)', fontWeight: 700 }}>{Number(p.budget).toLocaleString('fr-TN')} TND</span>}
                {p.period && (
                  <span style={{ fontSize: '13px', color: 'var(--fm-text-6)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ClockIcon />{p.period}
                  </span>
                )}
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ fontSize: '12px', color: 'var(--fm-text-4)', background: 'var(--fm-surface-hover)', borderRadius: '7px', padding: '3px 9px', fontWeight: 500 }}>{tag}</span>
                  ))}
                </div>
              )}
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--fm-border)' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--fm-text-6)' }}>{t('home.tp.proposals', { count: p._proposalCount })}</span>
                <Link to="/clients"
                  onClick={e => e.stopPropagation()}
                  style={{ padding: '8px 18px', borderRadius: '9px', background: 'var(--fm-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13.5px', textDecoration: 'none' }}>
                  {t('home.tp.apply')}
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Data: top courses (most enrolled, then cheapest, then oldest) ────────────
function useTopCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // Same retry-once-on-non-array-response fix as useTopProjects — a
    // transient 429/500 previously rendered as "no courses" permanently.
    const fetchCourses = () => fetch(`${API}/courses`).then(r => r.json());
    fetchCourses().then(rows => Array.isArray(rows) ? rows
      : new Promise(res => setTimeout(res, 2000)).then(fetchCourses)
    ).then(rows => {
      if (!cancelled) setCourses(Array.isArray(rows) ? rows : []);
    }).catch(() => { if (!cancelled) { setError(true); setCourses([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => {
    const priceOf = c => {
      const full = Number(c.full_price || 0);
      const pct  = Number(c.discount_pct || 0);
      return pct > 0 ? full * (1 - pct / 100) : full;
    };
    return [...courses].sort((a, b) => {
      const studentsDiff = Number(b.total_students || 0) - Number(a.total_students || 0);
      if (studentsDiff !== 0) return studentsDiff;
      const priceDiff = priceOf(a) - priceOf(b);
      if (priceDiff !== 0) return priceDiff;
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }).slice(0, 3);
  }, [courses]);

  return { items, loading, error };
}

// ── Section: Courses Preview ──────────────────────────────────────────────────
function CoursesPreviewSection({ items, loading, error }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const empty = !loading && !error && items.length === 0;
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.cp.title')}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.cp.sub')}</p>
        </div>
        <Link to="/courses"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border-strong)', color: 'var(--fm-text-4)', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.cp.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '18px' }}>
        {loading && [0, 1, 2].map(i => <SkeletonCard key={i} height={230} />)}
        {!loading && error && <StateMessage text={t('home.cp.error')} />}
        {empty && <StateMessage text={t('home.cp.empty')} />}
        {!loading && !error && items.map((c, i) => {
          const instructor = c.instructor_name || c.creator_email?.split('@')[0] || '';
          const rating      = Number(c.avg_rating || 0);
          const students    = Number(c.total_students || 0);
          const full        = Number(c.full_price || 0);
          const pct         = Number(c.discount_pct || 0);
          const final       = pct > 0 ? full * (1 - pct / 100) : full;
          const isFree      = full === 0;
          const cover       = COURSE_GRADIENTS[c.category] || DEFAULT_COURSE_GRADIENT;
          return (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              style={{ ...CARD_STYLE, overflow: 'hidden', transition: 'box-shadow .18s,border-color .18s', cursor: 'pointer' }}
              onClick={() => navigate(`/courses/${c.id}`)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--fm-border)'; }}>
              {/* Cover */}
              <div style={{ height: '120px', background: cover, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {c.thumbnail_url && (
                  <img src={cldImg(c.thumbnail_url)} alt={c.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {c.category && <span style={{ position: 'absolute', top: '11px', left: '11px', fontSize: '11px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,.28)', padding: '3px 9px', borderRadius: '6px' }}>{c.category}</span>}
                {!c.thumbnail_url && (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .92 }}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                )}
              </div>
              {/* Body */}
              <div style={{ padding: '16px 17px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--fm-text-1)', lineHeight: 1.35, marginBottom: '7px', minHeight: '40px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.title}</div>
                {instructor && <div style={{ fontSize: '13px', color: 'var(--fm-text-5)', marginBottom: '12px' }}>{instructor.split(' ')[0]}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--fm-text-5)' }}>
                    {rating > 0 ? (
                      <><StarIcon size={14} /><strong style={{ color: 'var(--fm-text-1)' }}>{rating.toFixed(1)}</strong></>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{t('home.ff.new')}</span>
                    )}
                    {students > 0 && <> · {students.toLocaleString()}</>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fm-text-1)', whiteSpace: 'nowrap' }}>{isFree ? t('cc.free') : `${final.toFixed(0)} TND`}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Chevron down ──────────────────────────────────────────────────────────────
function ChevronDown({ size = 14, rotated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform .2s', transform: rotated ? 'rotate(180deg)' : 'none' }}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

// ── Section: FAQ ──────────────────────────────────────────────────────────────
function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = useCallback((i) => setOpenIdx(prev => prev === i ? null : i), []);
  const { t } = useTranslation();
  const faqItems = [
    { question: t('home.faq.q1'), answer: t('home.faq.a1') },
    { question: t('home.faq.q2'), answer: t('home.faq.a2') },
    { question: t('home.faq.q3'), answer: t('home.faq.a3') },
    { question: t('home.faq.q4'), answer: t('home.faq.a4') },
    { question: t('home.faq.q5'), answer: t('home.faq.a5') },
  ];

  return (
    <section className="fm-section" style={{ maxWidth: '760px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', marginBottom: '34px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 8px', color: 'var(--fm-text-1)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.faq.title')}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--fm-text-5)', margin: 0 }}>{t('home.faq.sub')}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqItems.map((q, i) => {
          const isOpen = openIdx === i;
          return (
            <motion.div key={q.question}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{ background: 'var(--fm-surface)', border: `1px solid ${isOpen ? 'rgba(124,108,246,.4)' : 'var(--fm-border)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color .18s' }}>
              <button onClick={() => toggle(i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '18px 20px' }}>
                <span style={{ fontWeight: 700, fontSize: '15.5px', color: 'var(--fm-text-1)' }}>{q.question}</span>
                <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(124,108,246,.16)', border: '1px solid rgba(124,108,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9aeff', flex: 'none' }}>
                  <ChevronDown size={14} rotated={isOpen} />
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 19px', fontSize: '14.5px', color: 'var(--fm-text-5)', lineHeight: 1.6 }}>
                  {q.answer}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Section: Final CTA ────────────────────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px', paddingBottom: '80px' }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', background: 'linear-gradient(135deg,#6c5cf6 0%,#7d5cf0 45%,#3a8ce0 100%)', padding: 'clamp(28px,5vw,60px) clamp(20px,5vw,60px)', textAlign: 'center', boxShadow: '0 28px 64px -26px rgba(108,92,246,.8)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(440px 240px at 12% 0%,rgba(255,255,255,.2),transparent 70%),radial-gradient(420px 240px at 90% 100%,rgba(255,255,255,.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(26px,4vw,38px)', letterSpacing: '-.025em', margin: '0 0 12px', color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.final.title')}
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,.88)', maxWidth: '460px', margin: '0 auto 30px' }}>
            {t('home.final.sub')}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/freelancers"
              style={{ padding: '13px 26px', borderRadius: '12px', background: '#fff', color: '#6a5cf0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '15px', boxShadow: '0 8px 20px -8px rgba(0,0,0,.4)', textDecoration: 'none' }}>
              {t('home.final.join_fl')}
            </Link>
            <Link to="/clients"
              style={{ padding: '13px 26px', borderRadius: '12px', background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
              {t('home.final.hire')}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Main Home page ────────────────────────────────────────────────────────────
export default function Home() {
  const { user, users, accountsLoaded } = useAuth();
  const freelancers = useTopFreelancers(users, accountsLoaded);
  const projects    = useTopProjects();
  const courses     = useTopCourses();

  if (user?.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div style={{ background: 'radial-gradient(960px 540px at 14% -6%,rgba(124,108,246,.22),transparent 60%),radial-gradient(860px 540px at 96% -2%,rgba(58,140,224,.16),transparent 60%),linear-gradient(180deg,var(--fm-bg-3) 0%,var(--fm-bg) 58%)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',-apple-system,sans-serif", color: 'var(--fm-text-2)', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`@keyframes fmPulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }`}</style>
      <SEOHead
        url="/"
        description="FamaMennou — La plateforme tunisienne de freelance. Trouvez des freelancers, publiez vos projets et suivez des formations en ligne."
        keywords="freelance tunisie, trouver freelancer, cours en ligne tunisie, projets freelance, développeur tunisie, designer tunisie, formation en ligne"
      />
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <LocalBusinessJsonLd />
      <FAQJsonLd faqs={[
        { question: "Qu'est-ce que FamaMennou ?", answer: "FamaMennou est l'écosystème freelance tout-en-un de Tunisie. Embauchez des talents vérifiés, remportez des contrats ou développez vos compétences — tout en un seul endroit." },
        { question: "Comment les freelancers sont-ils vérifiés ?", answer: "Chaque freelancer passe par une vérification d'identité via sa carte d'identité nationale. Notre équipe examine chaque profil pour garantir qualité et fiabilité." },
        { question: "L'inscription est-elle gratuite ?", answer: "Oui, l'inscription est entièrement gratuite. Une petite commission s'applique uniquement lorsqu'un projet est complété avec succès." },
        { question: "Comment embaucher un freelancer ?", answer: "Parcourez la marketplace, filtrez par compétence ou région, et cliquez sur Embaucher ou envoyez un message directement à un freelancer vérifié." },
        { question: "Que faire si je ne suis pas satisfait du travail ?", answer: "Nous avons un processus structuré de résolution des litiges. Notre équipe de support sert de médiateur pour parvenir à un résultat équitable pour les deux parties." },
      ]} />
      <HeroSection />
      {/* Directly under the hero's three CTA buttons, which are the last thing
          HeroSection renders. */}
      <DemoVideoSection />
      <ActionCardsSection />
      <HowItWorksSection />
      <FeaturedFreelancersSection {...freelancers} />
      <TrendingProjectsSection {...projects} users={users} />
      <CoursesPreviewSection {...courses} />
      <FAQSection />
      <CTASection />
    </div>
  );
}
