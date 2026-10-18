// "today / yesterday / 3 days ago / 2 weeks ago / 1 month ago" in the visitor's
// own language. The old helper returned hard-coded English ("3d ago"), which
// showed up inside French and Arabic sentences ("Publié 3d ago").
const DAY = 86400000;

export function timeAgo(date, lang = 'fr') {
  if (!date) return '';
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return '';
  const days = Math.max(0, Math.floor((Date.now() - ts) / DAY));
  let rtf;
  try { rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }); }
  catch { rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }); }
  if (days < 7)  return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}
