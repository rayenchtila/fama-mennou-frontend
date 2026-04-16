import { useTranslation } from 'react-i18next';

const FREELANCER_STEPS = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    title: "Fill in your info",
    desc: "Name, email, password, date of birth, gender & region. Takes 30 seconds.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
    title: "Add your skills & bio",
    desc: "List what you do — React, Figma, SEO, writing… keep it short and punchy.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    title: "Upload your CIN",
    desc: "Clear photo of front & back of your National ID card. Required for verification.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: "Get approved & start!",
    desc: "Admin reviews your file within 24–48 h. Approved? Your profile goes live immediately.",
  },
];

const CLIENT_STEPS = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    title: "Choose 'Client' at signup",
    desc: "Select the Client role to unlock job posting and recruiting tools.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    title: "Sign up in seconds",
    desc: "Google, Facebook or email + password. No documents, no waiting.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: "You're in — start hiring!",
    desc: "Account active instantly. Post jobs, browse freelancers, launch your projects.",
  },
];

function Hero() {
  const { t } = useTranslation();

  return (
    <>
      <section className="w-full py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-6">

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {t('Find Freelancers')}
            </h1>
          </div>

          <div>
            <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-xl mx-auto">
              {t('Search jobs, freelancers, courses…')}
            </p>
          </div>

          <div className="w-full max-w-md flex justify-center">
            <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold">
              {t('Log in')}
            </button>
          </div>

        </div>
      </section>

      {/* ── How to create an account ── */}
      <section className="w-full py-14 md:py-20 px-4 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">


          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Freelancer card ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-6 pt-6 pb-5 border-b border-indigo-50 dark:border-indigo-900/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Freelancer</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Find clients & land jobs</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="px-6 py-5 space-y-5">
                {FREELANCER_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                        {i + 1}
                      </div>
                      {i < FREELANCER_STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-indigo-100 dark:bg-indigo-900/40" style={{ minHeight: '16px' }} />
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-indigo-500 dark:text-indigo-400">{step.icon}</span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning badge */}
              <div className="mx-6 mb-6 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    CIN verification required. Access is granted only after admin approval — keeps our community safe.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Client card ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-sky-900/50 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-6 pt-6 pb-5 border-b border-sky-50 dark:border-sky-900/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <rect x="2" y="7" width="20" height="14" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      <line x1="12" y1="12" x2="12" y2="17"/>
                      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Client</h3>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Post jobs & hire top talent</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="px-6 py-5 space-y-5">
                {CLIENT_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                        {i + 1}
                      </div>
                      {i < CLIENT_STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-sky-100 dark:bg-sky-900/40" style={{ minHeight: '16px' }} />
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sky-500 dark:text-sky-400">{step.icon}</span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success badge */}
              <div className="mx-6 mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                    No documents needed. Account active the second you sign up — start hiring right now.
                  </p>
                </div>
              </div>

              {/* Social login icons */}
              <div className="px-6 pb-6">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Sign up via</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <svg className="w-3.5 h-3.5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Email
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;