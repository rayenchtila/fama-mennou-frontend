import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  // Moving LINKS inside or mapping them with t() ensures they update on re-render
  const LINKS = {
    [t("Platform")]: ["Find Freelancers", "Find Clients", "Browse Courses", "Job Board"],
    [t("Company")]:  ["About Us", "Blog", "Careers", "Press"],
    [t("Support")]:  ["Help Center", "Privacy Policy", "Terms of Service", "Cookie Policy"],
    [t("Connect")]:  ["Twitter/X", "LinkedIn", "Instagram", "Discord"],
  };

  return (
    <footer className="bg-slate-950 dark:bg-slate-950 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand col */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Fama<span className="text-indigo-400">Mennou</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {t("The all-in-one platform connecting professionals, clients, and learners worldwide.")}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                { label: "GitHub", path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{group}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-150 hover:translate-x-0.5 inline-block"
                    >
                      {t(link)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FamaMennou. {t("All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
}