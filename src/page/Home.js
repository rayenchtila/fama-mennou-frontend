import React, { useState, useCallback } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SEOHead, { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd, FAQJsonLd } from '../components/Seohead';

const FEATURED_FREELANCERS = [
  {
    id: 1, name: 'Yassine Khelifi', initials: 'YK',
    avBg: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', avFg: '#fff',
    role: 'Full-Stack Developer', rating: '4.9', responds: '1h', rate: '45',
    skills: ['React', 'Node.js', 'TypeScript'],
  },
  {
    id: 2, name: 'Imen Bouazizi', initials: 'IB',
    avBg: 'linear-gradient(135deg,#a855f7,#6c8cf6)', avFg: '#fff',
    role: 'Product & UI/UX Designer', rating: '5.0', responds: '2h', rate: '40',
    skills: ['Figma', 'Design System', 'Prototyping'],
  },
  {
    id: 3, name: 'Mehdi Trabelsi', initials: 'MT',
    avBg: 'linear-gradient(135deg,#3ec2e8,#5b5ce0)', avFg: '#fff',
    role: 'SEO & Growth Marketer', rating: '4.7', responds: '3h', rate: '35',
    skills: ['SEO', 'Google Ads', 'Analytics'],
  },
];

const TRENDING_PROJECTS = [
  {
    id: 1, client: 'NovaTech Solutions', initials: 'NT',
    avBg: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', avFg: '#fff',
    title: 'Full e-commerce platform rebuild',
    budget: '4 500 TND', duration: '6–8 weeks', proposals: 12,
    tags: ['React', 'Stripe', 'UX'],
  },
  {
    id: 2, client: 'Atelier Médina', initials: 'AM',
    avBg: 'linear-gradient(135deg,#a855f7,#6c8cf6)', avFg: '#fff',
    title: 'Brand identity & visual guidelines',
    budget: '1 800 TND', duration: '2–3 weeks', proposals: 8,
    tags: ['Branding', 'Logo', 'Print'],
  },
  {
    id: 3, client: 'Baraka Foods', initials: 'BF',
    avBg: 'linear-gradient(135deg,#3ec2e8,#5b5ce0)', avFg: '#fff',
    title: 'Social media management & campaigns',
    budget: '900 TND', duration: '3 months', proposals: 5,
    tags: ['Social Media', 'Ads', 'Content'],
  },
];

const COURSES = [
  { id: 1, title: 'React from Zero to Expert', instructor: 'Yassine Khelifi', rating: '4.9', students: '1,240', price: '89 TND', cover: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', cat: 'Development' },
  { id: 2, title: 'UI/UX Design Masterclass', instructor: 'Imen Bouazizi', rating: '5.0', students: '860', price: '75 TND', cover: 'linear-gradient(135deg,#a855f7,#6c8cf6)', cat: 'Design' },
  { id: 3, title: 'SEO & Growth Marketing', instructor: 'Mehdi Trabelsi', rating: '4.7', students: '540', price: '60 TND', cover: 'linear-gradient(135deg,#5b5ce0,#3ec2e8)', cat: 'Marketing' },
  { id: 4, title: 'Motion Design with After Effects', instructor: 'Salma Gharbi', rating: '4.8', students: '410', price: '70 TND', cover: 'linear-gradient(135deg,#7c6cf6,#a855f7)', cat: 'Video' },
];

const TESTIMONIALS = [
  { quote: 'Found a developer in two days. The quality was outstanding and the whole process felt effortless. Highly recommended.', name: 'Sarra Ben Amor', title: 'Founder', initials: 'SB', avBg: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', avFg: '#fff' },
  { quote: 'As a freelancer, Fama Mennou keeps my pipeline full. I get 3–4 quality leads every month without any cold outreach.', name: 'Mehdi Trabelsi', title: 'Full-Stack Developer', initials: 'MT', avBg: 'linear-gradient(135deg,#a855f7,#6c8cf6)', avFg: '#fff' },
  { quote: 'The courses paid for themselves in a month. I went from junior to senior-level projects thanks to the instructors here.', name: 'Anis Mansour', title: 'Designer', initials: 'AM', avBg: 'linear-gradient(135deg,#3ec2e8,#5b5ce0)', avFg: '#fff' },
];

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
function StarIcon({ size = 14, color = '#9b8cff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.1 20.3l1.7-6.6L2.6 8.8l6.8-.5z"/>
    </svg>
  );
}

// ── Shield icon ──────────────────────────────────────────────────────────────
function ShieldIcon({ size = 15, color = '#9b8cff' }) {
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
function ClockIcon({ size = 13, color = '#7e82a0' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  );
}

const CARD_STYLE = { background: '#16142e', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px' };

// ── Section: Hero ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [typeIdx, setTypeIdx] = useState(0);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'linear-gradient(135deg,#9b8cff,#3ec2e8)', boxShadow: '0 0 10px #9b8cff', flexShrink:0, animation:'dotPulse 2s ease-in-out infinite' }} />
          <span className="premium-badge-text">{t('home.badge')}</span>
        </motion.span>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontWeight: 800, fontSize: 'clamp(34px,5.4vw,56px)', lineHeight: 1.06, letterSpacing: '-.03em', margin: '0 0 18px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.hero.title1')}<br />
          <span style={{ background: 'linear-gradient(110deg,#9b8cff,#6c8cf6 60%,#3ec2e8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {t('home.hero.title2')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 'clamp(16px,2vw,19px)', color: '#a7abc8', maxWidth: '520px', margin: '0 auto 34px', lineHeight: 1.55 }}>
          {t('home.hero.subtitle')}
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          {/* Type tabs */}
          <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '13px', padding: '5px', marginBottom: '12px', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
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
                style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, borderRadius: '9px', background: 'transparent', position: 'relative', zIndex: 1, transition: 'color 0.2s ease', color: typeIdx === i ? '#fff' : '#a7abc8' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Input */}
          <form onSubmit={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#15122c', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '7px 7px 7px 16px', boxShadow: '0 18px 44px -18px rgba(0,0,0,.7)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={activeColor.bg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transition: 'stroke .2s' }}>
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDERS[typeIdx]}
              style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: '#f4f3fb', fontFamily: 'inherit', fontSize: '15px' }}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: '#7c6cf6', color: '#fff', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '14.5px', boxShadow: '0 8px 22px -8px rgba(124,108,246,.7)', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('home.cta.hire_fl')}
          </Link>
          <Link to="/clients"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'rgba(255,255,255,.06)', color: '#e7e8f4', border: '1px solid rgba(255,255,255,.16)', fontFamily: 'inherit', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>
            {t('home.cta.find_cl')}
          </Link>
          <Link to="/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '11px', background: 'rgba(255,255,255,.06)', color: '#e7e8f4', border: '1px solid rgba(255,255,255,.16)', fontFamily: 'inherit', fontWeight: 600, fontSize: '14.5px', textDecoration: 'none' }}>
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
    { to: '/freelancers', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: t('home.ac.hire.title'), desc: t('home.ac.hire.desc'), cta: t('home.ac.hire.cta') },
    { to: '/clients',     icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>, title: t('home.ac.client.title'), desc: t('home.ac.client.desc'), cta: t('home.ac.client.cta') },
    { to: '/courses',     icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, title: t('home.ac.learn.title'), desc: t('home.ac.learn.desc'), cta: t('home.ac.learn.cta') },
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
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}>
              <span style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'rgba(124,108,246,.16)', border: '1px solid rgba(124,108,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9aeff' }}>
                {card.icon}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#fbfbff', marginBottom: '5px' }}>{card.title}</div>
                <div style={{ fontSize: '14px', color: '#a7abc8', lineHeight: 1.5 }}>{card.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: '#b9aeff', marginTop: 'auto' }}>
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
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(24px,3.4vw,32px)', letterSpacing: '-.025em', margin: '0 0 8px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.hiw.title')}
        </h2>
        <p style={{ fontSize: '16px', color: '#a7abc8', margin: 0 }}>{t('home.hiw.sub')}</p>
      </div>
      <style>{`@media(max-width:680px){.hiw-arrow{display:none!important}}`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <motion.div
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ flex: 1, minWidth: '200px', maxWidth: '260px', textAlign: 'center', padding: '8px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#7c6cf6', color: '#fff', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 18px -6px rgba(124,108,246,.7)' }}>
                {step.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: '17px', color: '#fbfbff', marginBottom: '6px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{step.title}</div>
              <div style={{ fontSize: '14px', color: '#a7abc8', lineHeight: 1.55, maxWidth: '280px', margin: '0 auto' }}>{step.desc}</div>
            </motion.div>
            {i < steps.length - 1 && <StepArrow />}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

// ── Section: Featured Freelancers ─────────────────────────────────────────────
function FeaturedFreelancersSection() {
  const { t } = useTranslation();
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.ff.title')}
          </h2>
          <p style={{ fontSize: '15px', color: '#a7abc8', margin: 0 }}>{t('home.ff.sub')}</p>
        </div>
        <Link to="/freelancers"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', color: '#c2c5dd', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.ff.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '18px' }}>
        {FEATURED_FREELANCERS.map((f, i) => (
          <motion.div key={f.id}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            style={{ ...CARD_STYLE, padding: '22px', transition: 'box-shadow .18s,border-color .18s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '16px' }}>
              <span style={{ width: '50px', height: '50px', borderRadius: '50%', background: f.avBg, color: f.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flex: 'none' }}>
                {f.initials}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15.5px', color: '#fbfbff' }}>{f.name.split(' ')[0]}</span>
                  <ShieldIcon size={15} color="#9b8cff" />
                </div>
                <div style={{ fontSize: '13px', color: '#a7abc8', marginTop: '2px' }}>{f.role}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', flex: 'none' }}>
                <StarIcon size={14} color="#9b8cff" />
                <span style={{ fontWeight: 700, color: '#fbfbff' }}>{f.rating}</span>
              </div>
            </div>
            {/* Skills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {f.skills.map(s => (
                <span key={s} style={{ fontSize: '12px', color: '#c2c5dd', background: 'rgba(255,255,255,.06)', borderRadius: '7px', padding: '3px 9px', fontWeight: 500 }}>{s}</span>
              ))}
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ fontSize: '13px', color: '#7e82a0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <ClockIcon /> {t('home.ff.responds', { time: f.responds })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Trending Projects ────────────────────────────────────────────────
function TrendingProjectsSection() {
  const { t } = useTranslation();
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.tp.title')}
          </h2>
          <p style={{ fontSize: '15px', color: '#a7abc8', margin: 0 }}>{t('home.tp.sub')}</p>
        </div>
        <Link to="/clients"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', color: '#c2c5dd', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.tp.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: '18px' }}>
        {TRENDING_PROJECTS.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            style={{ ...CARD_STYLE, padding: '22px', transition: 'box-shadow .18s,border-color .18s', display: 'flex', flexDirection: 'column', gap: '13px' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}>
            {/* Client */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '34px', height: '34px', borderRadius: '9px', background: p.avBg, color: p.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flex: 'none' }}>{p.initials}</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#c2c5dd' }}>{p.client.split(' ')[0]}</span>
              <ShieldIcon size={14} color="#9b8cff" />
            </div>
            {/* Title */}
            <div style={{ fontWeight: 700, fontSize: '17px', color: '#fbfbff', letterSpacing: '-.01em', lineHeight: 1.3 }}>{p.title}</div>
            {/* Budget + duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: '#fbfbff', fontWeight: 700 }}>{p.budget}</span>
              <span style={{ fontSize: '13px', color: '#7e82a0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <ClockIcon />{p.duration}
              </span>
            </div>
            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {p.tags.map(t => (
                <span key={t} style={{ fontSize: '12px', color: '#c2c5dd', background: 'rgba(255,255,255,.06)', borderRadius: '7px', padding: '3px 9px', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <span style={{ fontSize: '12.5px', color: '#7e82a0' }}>{t('home.tp.proposals', { count: p.proposals })}</span>
              <Link to="/clients"
                style={{ padding: '8px 18px', borderRadius: '9px', background: '#7c6cf6', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13.5px', textDecoration: 'none' }}>
                {t('home.tp.apply')}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Courses Preview ──────────────────────────────────────────────────
function CoursesPreviewSection() {
  const { t } = useTranslation();
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '26px' }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 6px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {t('home.cp.title')}
          </h2>
          <p style={{ fontSize: '15px', color: '#a7abc8', margin: 0 }}>{t('home.cp.sub')}</p>
        </div>
        <Link to="/courses"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', color: '#c2c5dd', borderRadius: '10px', padding: '9px 15px', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', flex: 'none' }}>
          {t('home.cp.view_all')} <ChevronRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '18px' }}>
        {COURSES.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            style={{ ...CARD_STYLE, overflow: 'hidden', transition: 'box-shadow .18s,border-color .18s', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 18px 40px -16px rgba(0,0,0,.6)'; e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}>
            {/* Cover */}
            <div style={{ height: '120px', background: c.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '11px', left: '11px', fontSize: '11px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,.28)', padding: '3px 9px', borderRadius: '6px' }}>{c.cat}</span>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .92 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 17px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#fbfbff', lineHeight: 1.35, marginBottom: '7px', minHeight: '40px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.title}</div>
              <div style={{ fontSize: '13px', color: '#a7abc8', marginBottom: '12px' }}>{c.instructor.split(' ')[0]}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#a7abc8' }}>
                  <StarIcon size={14} /><strong style={{ color: '#fbfbff' }}>{c.rating}</strong> · {c.students}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbfbff', whiteSpace: 'nowrap' }}>{c.price}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Section: Testimonials ─────────────────────────────────────────────────────
function TestimonialsSection() {
  const { t } = useTranslation();
  return (
    <section className="fm-section" style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', marginBottom: '34px' }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 8px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.test.title')}
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '18px' }}>
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={t.name}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            style={{ ...CARD_STYLE, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 5 stars */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {[0,1,2,3,4].map(j => <StarIcon key={j} size={15} color="#9b8cff" />)}
            </div>
            <p style={{ margin: 0, fontSize: '15px', color: '#dcdef0', lineHeight: 1.6 }}>{t.quote}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginTop: 'auto' }}>
              <span style={{ width: '38px', height: '38px', borderRadius: '50%', background: t.avBg, color: t.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flex: 'none' }}>{t.initials}</span>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fbfbff' }}>{t.name.split(' ')[0]}</div>
                <div style={{ fontSize: '12.5px', color: '#7e82a0' }}>{t.title}</div>
              </div>
            </div>
          </motion.div>
        ))}
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
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(22px,3.2vw,29px)', letterSpacing: '-.025em', margin: '0 0 8px', color: '#fbfbff', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {t('home.faq.title')}
        </h2>
        <p style={{ fontSize: '15px', color: '#a7abc8', margin: 0 }}>{t('home.faq.sub')}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqItems.map((q, i) => {
          const isOpen = openIdx === i;
          return (
            <motion.div key={q.question}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{ background: '#16142e', border: `1px solid ${isOpen ? 'rgba(124,108,246,.4)' : 'rgba(255,255,255,.08)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color .18s' }}>
              <button onClick={() => toggle(i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '18px 20px' }}>
                <span style={{ fontWeight: 700, fontSize: '15.5px', color: '#fbfbff' }}>{q.question}</span>
                <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(124,108,246,.16)', border: '1px solid rgba(124,108,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9aeff', flex: 'none' }}>
                  <ChevronDown size={14} rotated={isOpen} />
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 19px', fontSize: '14.5px', color: '#a7abc8', lineHeight: 1.6 }}>
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
  const { user } = useAuth();

  if (user?.isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div style={{ background: 'radial-gradient(960px 540px at 14% -6%,rgba(124,108,246,.22),transparent 60%),radial-gradient(860px 540px at 96% -2%,rgba(58,140,224,.16),transparent 60%),linear-gradient(180deg,#100d28 0%,#0a0817 58%)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',-apple-system,sans-serif", color: '#f4f3fb', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
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
      <ActionCardsSection />
      <HowItWorksSection />
      <FeaturedFreelancersSection />
      <TrendingProjectsSection />
      <CoursesPreviewSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
