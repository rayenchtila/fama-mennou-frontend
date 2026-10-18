import CountUp from './CountUp';

// One live figure in a page hero. `value` is null until the first response, then
// animates to the real number (and keeps animating up or down whenever the
// server-side count changes). `loading` only decides whether an unknown value
// reads "…" (still fetching) or "—" (fetch finished but no data).
//   variant="card"  — outlined card (Courses)
//   variant="tonal" — the supplied Freelancers screen's borderless tile on the "low" tier
export default function StatCard({ value, label, loading = false, accent = false, compact = false, variant = 'card' }) {
  const tonal = variant === 'tonal';
  return (
    <div className={`text-center ${tonal ? 'ds-tonal !rounded-xl flex flex-col justify-center p-4' : `ds-card ${compact ? 'px-2 py-3 sm:px-5 sm:py-4' : 'px-3 py-3.5 sm:px-5 sm:py-4'}`}`}>
      <CountUp
        value={value}
        fallback={loading ? '…' : '—'}
        className={`block font-extrabold leading-none tracking-tight tabular-nums ${tonal ? 'mb-1 text-[26px] sm:text-[28px]' : 'text-[24px] sm:text-[30px]'} ${accent ? 'text-ds-accent' : 'text-ds-ink'}`}
      />
      <span className={`block font-semibold uppercase leading-[1.3] text-ds-mute ${tonal ? 'mt-1 text-[11px] tracking-wider' : `mt-2 tracking-[0.06em] ${compact ? 'text-[10px] sm:text-xs' : 'text-[11px] sm:text-xs'}`}`}>
        {label}
      </span>
    </div>
  );
}
