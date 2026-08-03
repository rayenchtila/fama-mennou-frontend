import { useTranslation } from 'react-i18next';

/* ──────────────────────────────────────────────────────────────────────
   Reusable, premium pagination control.

   Fully data-driven: page count comes from `totalPages` (computed by the
   caller from a real backend count — never hardcoded), so it grows or
   shrinks automatically as rows are added/removed. Renders nothing when
   there's only one page.

   Usage:
     <Pagination page={page} totalPages={totalPages} total={total}
       limit={limit} onPageChange={setPage} accent={C.accent} />
   ────────────────────────────────────────────────────────────────────── */

const IcChevL = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const IcChevR = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

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

export default function Pagination({
  page, totalPages, total, limit,
  onPageChange, accent = 'var(--fm-primary)', loading = false,
}) {
  const { t } = useTranslation();
  if (!totalPages || totalPages <= 1) return null;

  const go = p => {
    if (p < 1 || p > totalPages || p === page || loading) return;
    onPageChange(p);
  };

  const from = total ? (page - 1) * limit + 1 : 0;
  const to   = total ? Math.min(page * limit, total) : 0;

  // Accent is expected as a literal hex string (e.g. "#7c6cf6") so we can
  // append an alpha suffix for the glow shadow — var(--x) refs would produce
  // invalid CSS here, so fall back to a plain shadow color for those.
  const accentShadow = /^#[0-9a-fA-F]{6}$/.test(accent) ? `${accent}80` : accent;

  const btnBase = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:36, height:36, padding:'0 4px', borderRadius:10,
    border:'1px solid var(--fm-border)', background:'var(--fm-border-soft)',
    color:'var(--fm-text-4)', fontSize:13, fontWeight:700, cursor:'pointer',
    fontFamily:'inherit', transition:'border-color .15s, background .15s, color .15s, opacity .15s',
    userSelect:'none',
  };

  return (
    <nav aria-label={t('Pagination')} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginTop:36 }}>
      {total > 0 && (
        <p style={{ fontSize:12.5, color:'var(--fm-text-6)', margin:0 }}>
          {t('Showing {{from}}–{{to}} of {{total}}', { from, to, total })}
        </p>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'center', opacity: loading ? 0.55 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <button type="button" aria-label={t('Previous page')} onClick={() => go(page - 1)} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
          onMouseEnter={e => { if (page !== 1) { e.currentTarget.style.borderColor = 'var(--fm-border-strong)'; e.currentTarget.style.background = 'var(--fm-surface-hover)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--fm-border)'; e.currentTarget.style.background = 'var(--fm-border-soft)'; }}>
          <IcChevL />
        </button>

        {getPageWindow(page, totalPages).map((p, idx) => p === '…' ? (
          <span key={`dots-${idx}`} style={{ minWidth:24, textAlign:'center', color:'var(--fm-text-7)', fontSize:13, fontWeight:700 }}>…</span>
        ) : (
          <button key={p} type="button" aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}
            style={p === page ? {
              ...btnBase, border:'none', color:'#fff',
              background:`linear-gradient(135deg,${accent},${accent})`,
              boxShadow:`0 4px 14px -3px ${accentShadow}`,
              cursor:'default',
            } : btnBase}
            onMouseEnter={e => { if (p !== page) { e.currentTarget.style.borderColor = 'var(--fm-border-strong)'; e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-2)'; } }}
            onMouseLeave={e => { if (p !== page) { e.currentTarget.style.borderColor = 'var(--fm-border)'; e.currentTarget.style.background = 'var(--fm-border-soft)'; e.currentTarget.style.color = 'var(--fm-text-4)'; } }}>
            {p}
          </button>
        ))}

        <button type="button" aria-label={t('Next page')} onClick={() => go(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
          onMouseEnter={e => { if (page !== totalPages) { e.currentTarget.style.borderColor = 'var(--fm-border-strong)'; e.currentTarget.style.background = 'var(--fm-surface-hover)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--fm-border)'; e.currentTarget.style.background = 'var(--fm-border-soft)'; }}>
          <IcChevR />
        </button>
      </div>
    </nav>
  );
}
