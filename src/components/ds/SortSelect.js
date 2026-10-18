import Icon from './Icon';

// Native <select> (so the OS picker is used on phones) wearing the design-system
// control style, with its own chevron. It sizes to its content but may shrink
// (min-w-0), so on a narrow phone row it truncates instead of overflowing.
//   variant="field" — outlined input style (default)
//   variant="tonal" — borderless chip on the "high" tier, as in the supplied toolbar
export default function SortSelect({ value, onChange, options, label, className = '', variant = 'field' }) {
  const tonal = variant === 'tonal';
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}
        className={tonal
          ? 'w-full cursor-pointer appearance-none rounded-lg bg-ds-high py-2 ps-3 pe-8 text-xs font-semibold text-ds-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/50'
          : 'ds-input !min-h-10 !w-full !py-1.5 !ps-3.5 !pe-9 text-[13px] font-medium'}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="expand_more" size={tonal ? 16 : 18} className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ds-faint ${tonal ? 'end-2' : 'end-2.5'}`} />
    </div>
  );
}
