import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function GoldBadge({ text }) {
  const words = text.split(' ');
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    let i = 0;
    const run = () => {
      setActiveIdx(i);
      i++;
      if (i < words.length) {
        setTimeout(run, 260);
      } else {
        setTimeout(() => {
          setActiveIdx(-1);
          setTimeout(() => { i = 0; run(); }, 1400);
        }, 400);
      }
    };
    const init = setTimeout(run, 800);
    return () => clearTimeout(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={[
        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 sm:mb-10 font-inter relative overflow-hidden',
        /* light */ 'border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50',
        /* dark  */ 'dark:border-amber-500/50 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-yellow-900/30 dark:to-amber-950/40',
      ].join(' ')}
      style={{
        boxShadow: '0 0 0 1px rgba(251,191,36,0.25), 0 2px 12px rgba(251,191,36,0.12)',
      }}
    >
      {/* dot */}
      <span
        className="relative w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: 'radial-gradient(circle, #fbbf24 40%, #f59e0b 100%)',
          boxShadow: '0 0 6px 2px rgba(251,191,36,0.6)',
          animation: 'dotPulse 1.6s ease-in-out infinite',
        }}
      />

      {/* words */}
      <span className="relative flex gap-[0.35em] flex-wrap justify-center">
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              transition: 'color 0.18s ease, text-shadow 0.18s ease',
              color: activeIdx === i
                ? 'var(--gold-flash)'
                : 'var(--gold-base)',
              textShadow: activeIdx === i
                ? '0 0 10px rgba(251,191,36,0.9), 0 0 20px rgba(251,191,36,0.5)'
                : 'none',
            }}
          >
            {w}
          </span>
        ))}
      </span>

      <style>{`
        :root {
          --gold-base: #92690a;
          --gold-flash: #f59e0b;
        }
        html.dark {
          --gold-base: #d4a017;
          --gold-flash: #fde68a;
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(251,191,36,0.5); }
          50%       { box-shadow: 0 0 10px 4px rgba(251,191,36,0.9); }
        }
      `}</style>
    </motion.div>
  );
}

const wordVariant = {
  hidden:  { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.45, delay: 0.35 + i * 0.13, ease: [0.22, 1, 0.36, 1] },
  }),
};

const NAV_BUTTONS = [
  {
    to: '/freelancers',
    labelKey: 'Find Freelancers',
    icon: (
      <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    gradient: 'from-indigo-600 to-violet-600',
    glow: 'shadow-indigo-500/40',
    border: 'border-indigo-400/30',
    ring: 'hover:ring-indigo-400/50',
  },
  {
    to: '/clients',
    labelKey: 'Find Clients',
    icon: (
      <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    gradient: 'from-violet-600 to-purple-600',
    glow: 'shadow-violet-500/40',
    border: 'border-violet-400/30',
    ring: 'hover:ring-violet-400/50',
  },
  {
    to: '/courses',
    labelKey: 'Courses',
    icon: (
      <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    ),
    gradient: 'from-purple-600 to-fuchsia-600',
    glow: 'shadow-purple-500/40',
    border: 'border-purple-400/30',
    ring: 'hover:ring-purple-400/50',
  },
];

const Home = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';
  const [howOpen, setHowOpen] = useState(true);

  if (user?.isAdmin) {
    return <div className="relative overflow-x-hidden min-h-screen bg-white dark:bg-slate-900" />;
  }

  // Split highlighted words so each animates independently
  const words1 = t('hero.title.highlight1').split(/,\s*/); // ["Freelancers", "Clients"]
  const words2 = t('hero.title.highlight2').split(/\s*&\s*/); // ["Jobs", "Courses"]

  return (
    <div className="relative overflow-x-hidden">

      {/* Hero background — always light */}
      <div className="absolute inset-0 bg-white dark:bg-slate-900 z-0" />

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-indigo-100 dark:bg-indigo-900/20 blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-violet-100 dark:bg-violet-900/20 blur-3xl opacity-50" />
      </div>

      <section className="relative z-10 w-full px-4 sm:px-6 pt-28 pb-16 sm:py-32 md:py-36 lg:py-44">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <GoldBadge text={t('hero.badge')} />

          {/* Headline — word by word */}
          <h1 className="font-poppins font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-7
                         text-[2rem] sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4rem]">

            {/* "Find" */}
            <motion.span
              className="inline-block mr-[0.22em]"
              custom={0} variants={wordVariant} initial="hidden" animate="visible"
            >
              {t('hero.title.find')}
            </motion.span>

            {/* "Freelancers," */}
            <motion.span
              className="inline-block mr-[0.22em] relative text-indigo-600 dark:text-indigo-400"
              custom={1} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words1[0]}{!isAr && ','}
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>

            {/* "Clients" */}
            <motion.span
              className="inline-block mr-[0.22em] relative text-indigo-600 dark:text-indigo-400"
              custom={2} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words1[1]}{!isAr && ','}
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>

            {/* "&" — hidden in Arabic */}
            {!isAr && (
            <motion.span
              className="inline-block mx-[0.18em] text-slate-400 dark:text-slate-500"
              custom={3} variants={wordVariant} initial="hidden" animate="visible"
            >
              &amp;
            </motion.span>
            )}

            {/* "Courses" */}
            <motion.span
              className="inline-block relative text-indigo-600 dark:text-indigo-400"
              custom={4} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words2[1] || words2[0]}
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-inter text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-lg mx-auto mb-12
                       text-base sm:text-lg md:text-xl"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Navigation buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2"
          >
            {NAV_BUTTONS.map((btn, i) => (
              <motion.div
                key={btn.to}
                initial={{ opacity: 0, scale: 0.88, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.42, delay: 1.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={btn.to}
                  className={`
                    inline-flex items-center gap-2 px-5 py-[10px] rounded-full
                    bg-gradient-to-r ${btn.gradient}
                    text-white font-inter font-medium text-[13px] tracking-wide
                    shadow-xl ${btn.glow}
                    border ${btn.border}
                    ring-2 ring-transparent ${btn.ring}
                    transition-all duration-200
                  `}
                >
                  {btn.icon}
                  {t(btn.labelKey)}
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── How it works — always dark section ── */}
      <motion.section
        className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 md:pb-32 bg-slate-100 dark:bg-slate-950"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-3xl mx-auto">

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-10" />

          {/* Toggle header */}
          <motion.button
            onClick={() => setHowOpen(o => !o)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex items-center justify-between gap-4 group text-slate-900 dark:text-white"
            aria-expanded={howOpen}
          >
            <div className="text-left">
              <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-xl sm:text-2xl">
                {t('How to create your account?')}
              </h2>
            </div>
            <motion.span
              animate={{ rotate: howOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </motion.span>
          </motion.button>

          {/* Collapsible cards */}
          <AnimatePresence initial={false}>
            {howOpen && (
              <motion.div
                key="steps"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mt-6 sm:mt-8">

                  {/* ── Freelancer card ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="group relative rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-white via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/60 shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20 hover:shadow-2xl hover:shadow-indigo-200/60 dark:hover:shadow-indigo-500/25 transition-shadow duration-500"
                  >
                    {/* top glow bar */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    {/* ambient glow */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700" />

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-poppins font-bold text-slate-900 dark:text-white text-[15px] leading-none">{t('Freelancer')}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/30 px-2.5 py-1 rounded-full tracking-wide uppercase">
                          {t('6 steps')}
                        </span>
                      </div>

                      {/* Steps */}
                      <ol className="relative space-y-0">
                        {[
                          { title: t("Choose 'Freelancer' at signup"), sub: t('steps.client.sub1') },
                          { title: t('Fill in your info'),             sub: t('steps.freelancer.sub1') },
                          { title: t('Upload your CIN'),               sub: t('steps.freelancer.sub3') },
                          { title: t('Add your skills & bio'),         sub: t('steps.freelancer.sub2') },
                          { title: t('Get Approved or Rejected !'),    sub: t('steps.freelancer.sub4') },
                          { title: t("You're in — start working!"),    sub: t('steps.freelancer.sub5') },
                        ].map((s, i, arr) => (
                          <li key={i} className="relative flex items-start gap-3.5 pb-4 last:pb-0">
                            {i < arr.length - 1 && (
                              <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gradient-to-b from-indigo-300 dark:from-indigo-500/40 to-transparent" />
                            )}
                            <span className="mt-0.5 w-[26px] h-[26px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/20">
                              {i + 1}
                            </span>
                            <div className="pt-[3px]">
                              <p className="font-inter font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-snug">{s.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-[3px] leading-relaxed">{s.sub}</p>
                            </div>
                          </li>
                        ))}
                      </ol>

                      {/* Footer */}
                      <div className="mt-5 pt-4 border-t border-indigo-200 dark:border-indigo-500/15 flex items-center gap-2 text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-inter">
                        <svg className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {t('steps.cin_note')}
                      </div>
                    </div>
                  </motion.div>

                  {/* ── Client card ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="group relative rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-white via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/60 shadow-xl shadow-violet-100/50 dark:shadow-violet-900/20 hover:shadow-2xl hover:shadow-violet-200/60 dark:hover:shadow-violet-500/25 transition-shadow duration-500"
                  >
                    {/* top glow bar */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                    {/* ambient glow */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none group-hover:bg-violet-500/20 transition-colors duration-700" />

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-poppins font-bold text-slate-900 dark:text-white text-[15px] leading-none">{t('Client')}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/15 border border-violet-300 dark:border-violet-500/30 px-2.5 py-1 rounded-full tracking-wide uppercase">
                          {t('5 steps')}
                        </span>
                      </div>

                      {/* Steps */}
                      <ol className="relative space-y-0">
                        {[
                          { title: t("Choose 'Client' at signup"),  sub: t('steps.client.sub1') },
                          { title: t('Fill in your info'),          sub: t('steps.client.sub2') },
                          { title: t('Upload your CIN'),            sub: t('steps.freelancer.sub3') },
                          { title: t('Get Approved or Rejected !'), sub: t('steps.client.sub4') },
                          { title: t("You're in — start hiring!"),  sub: t('steps.client.sub3') },
                        ].map((s, i, arr) => (
                          <li key={i} className="relative flex items-start gap-3.5 pb-4 last:pb-0">
                            {i < arr.length - 1 && (
                              <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gradient-to-b from-violet-300 dark:from-violet-500/40 to-transparent" />
                            )}
                            <span className="mt-0.5 w-[26px] h-[26px] rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/40 ring-2 ring-violet-500/20">
                              {i + 1}
                            </span>
                            <div className="pt-[3px]">
                              <p className="font-inter font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-snug">{s.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-[3px] leading-relaxed">{s.sub}</p>
                            </div>
                          </li>
                        ))}
                      </ol>

                      {/* Footer */}
                      <div className="mt-5 pt-4 border-t border-violet-200 dark:border-violet-500/15 flex items-center gap-2 text-[11px] text-violet-600/80 dark:text-violet-400/80 font-inter">
                        <svg className="w-3.5 h-3.5 shrink-0 text-violet-600 dark:text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {t('steps.cin_note')}
                      </div>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.section>

    </div>
  );
};

export default Home;
