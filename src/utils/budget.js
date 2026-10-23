// A project's budget is free text in the database — "500", "0", "500 DT", "500€–2000€", "à discuter" — because
// the posting forms have let the client type whatever they wanted. This is the one reading of it, used by every
// card and page, so a project shows the same price wherever it appears and nothing the client entered is hidden
// (a plain 0 included: it is the client's own figure).
//
//   budgetLabel("500")        → "500 TND"          budgetLabel("1500")       → "1 500 TND"
//   budgetLabel("0")          → "0 TND"            budgetLabel("500 DT")     → "500 DT"
//   budgetLabel("500-2000")   → "500-2000 TND"     budgetLabel("500€–2000€") → "500€–2000€"
//   budgetLabel("à discuter") → "à discuter"       budgetLabel("" / null)    → null (nothing was entered)

const nf = new Intl.NumberFormat('fr-TN');

const PLAIN_NUMBER = /^\d[\d\s.,  ]*$/;
const HAS_CURRENCY = /tnd|\bdt\b|dinar|د\.?\s?ت|دينار|€|\$|£|\beur\b|\busd\b/i;
const MAX_LENGTH   = 40;   // a cell on a card, not a paragraph

// fr-TN writes a decimal with a comma, not a period ("500,50" = five hundred
// dinars fifty) — a lone comma followed by 1-2 trailing digits is that, and
// has to become a '.' before the digit-only strip below, or it is silently
// read as "50050". A comma followed by 3 digits (or more than one comma) is
// a thousands grouping instead and is left for the strip to drop as usual.
function normalizeDecimalComma(text) {
  const commaCount = (text.match(/,/g) || []).length;
  return commaCount === 1 && /,\d{1,2}$/.test(text) ? text.replace(',', '.') : text;
}

export function budgetLabel(raw) {
  const text = raw == null ? '' : String(raw).replace(/\s+/g, ' ').trim();
  if (!text) return null;

  // One amount: read it the way the payment check does (digits and the decimal point only), so the price on a
  // card is the amount a payment for that project has to reach.
  if (PLAIN_NUMBER.test(text)) {
    const n = parseFloat(normalizeDecimalComma(text).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? `${nf.format(n)} TND` : null;
  }

  // Anything else is the client's own wording — shown as written, with the currency added only to a bare range.
  const shown = text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…` : text;
  return HAS_CURRENCY.test(text) || !/\d/.test(text) ? shown : `${shown} TND`;
}
