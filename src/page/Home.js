import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    to: '/jobs',
    labelKey: 'Jobs',
    icon: (
      <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    ),
    gradient: 'from-blue-600 to-indigo-600',
    glow: 'shadow-blue-500/40',
    border: 'border-blue-400/30',
    ring: 'hover:ring-blue-400/50',
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
  const { t } = useTranslation();

  // Split highlighted words so each animates independently
  const words1 = t('hero.title.highlight1').split(/,\s*/); // ["Freelancers", "Clients"]
  const words2 = t('hero.title.highlight2').split(/\s*&\s*/); // ["Jobs", "Courses"]

  return (
    <div className="relative bg-white dark:bg-slate-950 overflow-x-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-indigo-100 dark:bg-indigo-900/20 blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-violet-100 dark:bg-violet-900/20 blur-3xl opacity-50" />
      </div>

      <section className="relative z-10 w-full px-4 py-24 md:py-36 lg:py-44">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-10 font-inter"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            {t('hero.badge')}
          </motion.div>

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
              {words1[0]},
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>

            {/* "Clients," */}
            <motion.span
              className="inline-block mr-[0.22em] relative text-indigo-600 dark:text-indigo-400"
              custom={2} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words1[1]},
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>

            {/* "Jobs" */}
            <motion.span
              className="inline-block mr-[0.12em] relative text-indigo-600 dark:text-indigo-400"
              custom={3} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words2[0]}
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-indigo-400/50"
              />
            </motion.span>

            {/* "&" */}
            <motion.span
              className="inline-block mx-[0.18em] text-slate-400 dark:text-slate-500"
              custom={4} variants={wordVariant} initial="hidden" animate="visible"
            >
              &amp;
            </motion.span>

            {/* "Courses" */}
            <motion.span
              className="inline-block relative text-indigo-600 dark:text-indigo-400"
              custom={5} variants={wordVariant} initial="hidden" animate="visible"
            >
              {words2[1]}
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
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
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

      {/* ── How it works ── */}
      <section className="relative z-10 w-full px-4 pb-28 md:pb-36">

        {/* Decorative divider */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto">

          {/* Section label + heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4 font-inter">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              {t('Get started')}
            </span>
            <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-2xl sm:text-[1.85rem] mt-1">
              {t('How to create your account?')}
            </h2>
          </motion.div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* ── Freelancer card ── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/30 transition-all duration-500 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-600 to-violet-600" />
              {/* Hover glow layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/[0.03] group-hover:to-violet-500/[0.03] transition-all duration-500 rounded-2xl pointer-events-none" />

              {/* Card header */}
              <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <span className="font-poppins font-bold text-slate-900 dark:text-white text-[15px]">Freelancer</span>
                </div>
                <span className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 px-2.5 py-1 rounded-full">
                  {t('4 steps')}
                </span>
              </div>

              {/* Steps with connector line */}
              <ol className="relative space-y-0">
                {[
                  { title: t('Fill in your info'),     sub: t('steps.freelancer.sub1') },
                  { title: t('Add your skills & bio'), sub: t('steps.freelancer.sub2') },
                  { title: t('Upload your CIN'),       sub: t('steps.freelancer.sub3') },
                  { title: t('Get approved & start!'), sub: t('steps.freelancer.sub4') },
                ].map((s, i, arr) => (
                  <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {i < arr.length - 1 && (
                      <span className="absolute left-[10px] top-6 bottom-0 w-px bg-gradient-to-b from-indigo-200 dark:from-indigo-800/70 to-transparent" />
                    )}
                    <span className="relative mt-[2px] w-[22px] h-[22px] rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-md shadow-indigo-400/30 dark:shadow-indigo-900/60 group-hover:scale-110 transition-transform duration-300">
                      {i + 1}
                    </span>
                    <div className="pt-[2px]">
                      <p className="font-inter font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-snug">{s.title}</p>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-[3px] leading-snug">{s.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Footer note */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-inter">
                <svg className="w-3.5 h-3.5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {t('steps.cin_note')}
              </div>
            </motion.div>

            {/* ── Client card ── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-900/30 transition-all duration-500 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-purple-600" />
              {/* Hover glow layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/[0.03] group-hover:to-purple-500/[0.03] transition-all duration-500 rounded-2xl pointer-events-none" />

              {/* Card header */}
              <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <span className="font-poppins font-bold text-slate-900 dark:text-white text-[15px]">Client</span>
                </div>
                <span className="text-[10.5px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-800 px-2.5 py-1 rounded-full">
                  {t('3 steps')}
                </span>
              </div>

              {/* Steps with connector line */}
              <ol className="relative space-y-0">
                {[
                  { title: t("Choose 'Client' at signup"), sub: t('steps.client.sub1') },
                  { title: t('Sign up in seconds'),        sub: t('steps.client.sub2') },
                  { title: t("You're in — start hiring!"), sub: t('steps.client.sub3') },
                ].map((s, i, arr) => (
                  <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {i < arr.length - 1 && (
                      <span className="absolute left-[10px] top-6 bottom-0 w-px bg-gradient-to-b from-violet-200 dark:from-violet-800/70 to-transparent" />
                    )}
                    <span className="relative mt-[2px] w-[22px] h-[22px] rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-md shadow-violet-400/30 dark:shadow-violet-900/60 group-hover:scale-110 transition-transform duration-300">
                      {i + 1}
                    </span>
                    <div className="pt-[2px]">
                      <p className="font-inter font-semibold text-[13px] text-slate-800 dark:text-slate-100 leading-snug">{s.title}</p>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-[3px] leading-snug">{s.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Footer note */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-inter">
                <svg className="w-3.5 h-3.5 shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {t('steps.instant_note')}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
