import { useTranslation, Trans } from 'react-i18next';
import Icon from './ds/Icon';

/* ──────────────────────────────────────────────────────────────────────
   Reusable pagination control (design-system styling).

   Fully data-driven: page count comes from `totalPages` (computed by the
   caller from a real backend count — never hardcoded), so it grows or
   shrinks automatically as rows are added/removed. Renders nothing when
   there's only one page.

   Layout: on desktop the "Showing 1–10 of 56" caption sits at the start and
   the page buttons at the end of one row; on a phone the buttons come first,
   centred, with the caption underneath.

   Usage:
     <Pagination page={page} totalPages={totalPages} total={total}
       limit={limit} onPageChange={setPage} loading={loading} itemLabel="freelancers" />
   ────────────────────────────────────────────────────────────────────── */

// Classic windowed pagination: first, last, current ± 1, "…" for gaps.
function getPageWindow(page, totalPages) {
  const delta = 1;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) pages.push(i);
  }
  const withDots = [];
  let last = 0;
  for (const p of pages) {
    if (last) {
      if (p - last === 2) withDots.push(last + 1);
      else if (p - last > 2) withDots.push('…');
    }
    withDots.push(p);
    last = p;
  }
  return withDots;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, loading = false, itemLabel = '', showCaption = true }) {
  const { t } = useTranslation();
  if (!totalPages || totalPages <= 1) return null;

  const go = p => {
    if (p < 1 || p > totalPages || p === page || loading) return;
    onPageChange(p);
  };

  const from = total ? (page - 1) * limit + 1 : 0;
  const to   = total ? Math.min(page * limit, total) : 0;

  return (
    <nav aria-label={t('Pagination')} className="ds mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:flex-row sm:justify-between">
      {showCaption && total > 0 && (
        <p className="order-2 m-0 text-[13px] text-ds-mute sm:order-1">
          <Trans i18nKey="ds.showing" values={{ from, to, total }} components={{ b: <strong className="font-bold text-ds-ink" /> }} />{itemLabel ? ` ${itemLabel}` : ''}
        </p>
      )}

      <div className={`order-1 flex flex-wrap items-center justify-center gap-1.5 sm:order-2 ${showCaption ? '' : 'sm:mx-auto'} ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        <button type="button" className="ds-pagebtn" aria-label={t('Previous page')} onClick={() => go(page - 1)} disabled={page === 1}>
          <Icon name="chevron_left" size={20} flip />
        </button>

        {getPageWindow(page, totalPages).map((p, idx) => p === '…' ? (
          <span key={`dots-${idx}`} className="min-w-6 text-center text-sm font-bold text-ds-faint" aria-hidden="true">…</span>
        ) : (
          <button key={p} type="button" className="ds-pagebtn" aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}>
            {p}
          </button>
        ))}

        <button type="button" className="ds-pagebtn" aria-label={t('Next page')} onClick={() => go(page + 1)} disabled={page === totalPages}>
          <Icon name="chevron_right" size={20} flip />
        </button>
      </div>
    </nav>
  );
}
