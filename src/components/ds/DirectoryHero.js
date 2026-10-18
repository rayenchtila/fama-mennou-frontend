import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from './Icon';

// Top of the Find-Freelancers / Find-Clients pages, built from the supplied
// Freelancers screen: a ghosted illustration behind a large centred title, a
// "search matrix" panel (keyword · optional region · action button) and a row of
// four live figures. `region` = { value, onChange, options, allLabel, label }.
export default function DirectoryHero({ title, subtitle, search, onSearch, onSubmit, placeholder, region, filterLabel, stats }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const focusRing = 'focus-within:ring-2 focus-within:ring-ds-accent/40';

  return (
    <section className="relative overflow-hidden bg-ds-canvas py-10 lg:py-14">
      {/* Ghosted illustration with the same two fades as the supplied screen */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img src="/images/directory-hero.png" alt="" width="512" height="323"
          className="ds-hero-art absolute end-0 top-1/2 w-[650px] max-w-none -translate-y-1/2 select-none object-contain lg:w-[820px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ds-canvas via-ds-canvas/90 to-ds-canvas/60 rtl:bg-gradient-to-l" />
        <div className="absolute inset-0 bg-gradient-to-b from-ds-canvas via-transparent to-ds-canvas" />
      </div>
      {/* Spectral glow — DESIGN.md: "vibrant spectral gradients spanning electric
          violet, dynamic indigo, and hyper-cyan". One flat 5%-opacity indigo blob
          read as near-invisible; this is the same ambient-glow idea the Home hero
          already uses, brought to the directory pages. */}
      <div className="pointer-events-none absolute start-[18%] top-[-60px] h-[360px] w-[480px] rounded-full bg-ds-accent/20 blur-[110px] rtl:start-auto rtl:end-[18%]" aria-hidden="true" />
      <div className="pointer-events-none absolute end-[12%] top-[40px] h-[300px] w-[420px] rounded-full bg-[#8B5CF6]/14 blur-[110px] rtl:end-auto rtl:start-[12%]" aria-hidden="true" />
      <div className="pointer-events-none absolute start-1/2 top-[120px] h-[220px] w-[560px] -translate-x-1/2 rounded-full bg-[#06B6D4]/10 blur-[130px] rtl:translate-x-1/2" aria-hidden="true" />

      <div className="ds-wrap relative z-10">
        <div className="mx-auto mb-7 max-w-3xl text-center md:mb-9">
          <h1 className="mb-3 text-h-xl-m text-ds-ink md:text-h-lg lg:text-h-xl">{title}</h1>
          <p className="mx-auto max-w-2xl text-[15px] leading-[1.6] text-ds-mute md:text-b-lg">{subtitle}</p>
        </div>

        {/* Search matrix */}
        <form role="search" onSubmit={e => { e.preventDefault(); onSubmit?.(); }} className="mx-auto mb-8 max-w-4xl md:mb-10">
          <div className="ds-tonal !rounded-2xl p-2 shadow-xl">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
              <label className={`ds-cell flex items-center px-4 py-2.5 ${focusRing} ${region ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
                <Icon name="search" size={20} className="me-3 flex-none text-ds-faint" />
                <input ref={inputRef} type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
                  aria-label={placeholder} enterKeyHint="search" autoComplete="off"
                  className="w-full min-w-0 bg-transparent text-[15px] text-ds-ink placeholder:text-ds-faint focus:outline-none" />
                {search && (
                  <button type="button" className="ds-iconbtn !h-7 !w-7 flex-none" aria-label={t('Clear search')}
                    onClick={() => { onSearch(''); inputRef.current?.focus(); }}>
                    <Icon name="close" size={16} />
                  </button>
                )}
              </label>

              {region && (
                <label className={`ds-cell relative flex items-center px-3 py-2.5 lg:col-span-3 ${focusRing}`}>
                  <Icon name="location_on" size={18} className="me-2 flex-none text-ds-faint" />
                  <select value={region.value} onChange={e => region.onChange(e.target.value)} aria-label={region.label}
                    className="w-full min-w-0 cursor-pointer appearance-none bg-transparent pe-6 text-sm font-semibold text-ds-ink focus:outline-none">
                    <option value="">{region.allLabel}</option>
                    {region.options.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Icon name="expand_more" size={18} className="pointer-events-none absolute end-3 text-ds-faint" />
                </label>
              )}

              <div className="lg:col-span-3">
                <button type="submit" className="ds-btn ds-btn-accent h-full min-h-[46px] w-full !rounded-xl">
                  <Icon name="tune" size={18} />{filterLabel}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Live figures */}
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">{stats}</div>
      </div>
    </section>
  );
}
