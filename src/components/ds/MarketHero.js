import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from './Icon';

// Top section of the Courses page (from the supplied Courses screen): headline,
// one-line subtitle, a search "console" and a row of live figures.
//   • The console is one bar: keywords · optional select (the screen's level picker —
//     here the course category, since courses have no level) · submit button. On a
//     phone the three parts stack.
//   • `select` = { value, onChange, options: [{ value, label }], label }.
//   • `submitLabel` names the button (the screen says "Search courses").
//   • `stats` entries render through <StatCard>; `children` slots extra actions under
//     the console (e.g. "Offer a course").
export default function MarketHero({ title, subtitle, search, onSearch, onSubmit, placeholder, select, submitLabel, stats, children }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const wide = stats && stats.length === 4;
  const label = submitLabel || t('home.search.btn');

  return (
    <section className="relative overflow-hidden border-b border-ds-line">
      <div className="ds-ambient" aria-hidden="true" />
      <div className="ds-wrap relative pb-8 pt-9 text-center md:pb-12 md:pt-14">
        <h1 className="mx-auto max-w-4xl text-h-xl-m text-ds-ink md:text-h-lg xl:text-h-xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-[1.6] text-ds-mute md:mt-4 md:text-b-lg">{subtitle}</p>

        <form role="search" onSubmit={e => { e.preventDefault(); onSubmit?.(); }} className="mx-auto mt-7 max-w-4xl md:mt-9">
          <div className="ds-search !flex-col !items-stretch !gap-1 !p-2 md:!flex-row md:!items-center md:!gap-2 md:!p-1.5">
            <label className="flex min-w-0 flex-1 items-center gap-2 ps-2 md:ps-3">
              <Icon name="search" size={20} className="flex-none text-ds-faint" />
              <input ref={inputRef} type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
                aria-label={placeholder} enterKeyHint="search" autoComplete="off" />
              {search && (
                <button type="button" className="ds-iconbtn flex-none" aria-label={t('Clear search')}
                  onClick={() => { onSearch(''); inputRef.current?.focus(); }}>
                  <Icon name="close" size={18} />
                </button>
              )}
            </label>

            {select && (
              <label className="relative flex items-center border-t border-ds-line md:w-60 md:flex-none md:border-s md:border-t-0">
                <select value={select.value} onChange={e => select.onChange(e.target.value)} aria-label={select.label}
                  className="min-h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pe-9 ps-3 text-start text-[14px] font-semibold text-ds-ink focus:outline-none">
                  {select.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Icon name="expand_more" size={18} className="pointer-events-none absolute end-3 text-ds-faint" />
              </label>
            )}

            <button type="submit" className="ds-btn ds-btn-primary !min-h-11 flex-none !px-5">
              {label}<Icon name="arrow_forward" size={18} flip />
            </button>
          </div>
        </form>

        {children}

        {stats && stats.length > 0 && (
          <div className={`mx-auto mt-6 grid max-w-4xl gap-2.5 md:mt-9 md:gap-4 ${wide ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
            {stats}
          </div>
        )}
      </div>
    </section>
  );
}
