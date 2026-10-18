// Date-of-birth rule: the person must be between 18 and 56 years old, both
// included, on the day they sign up or edit their profile.
//
// Age is counted in whole years from the real calendar date — never from the
// birth YEAR alone — using plain year/month/day numbers, so a time zone cannot
// shift the day. "Today" is the date in Tunis, the platform's home time zone, which
// is what the server uses too, so the browser and the API always agree. The server
// (utils/age.js in the API) is the one that decides; this gives instant feedback and
// the min / max for the date picker.

export const MIN_AGE = 18;
export const MAX_AGE = 56;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// 'YYYY-MM-DD' → { y, mo, d }, or null when it is not a real calendar date.
export function parseIsoDate(value) {
  if (typeof value !== 'string') return null;
  const m = ISO_DATE.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, mo, d };
}

const formatIsoDate = ({ y, mo, d }) => `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Today's calendar date in Tunis (falls back to the device's own date if the
// browser cannot resolve that time zone).
export function todayInTunis(now = new Date()) {
  try {
    const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const parsed = parseIsoDate(s);
    if (parsed) return parsed;
  } catch { /* fall through */ }
  return { y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate() };
}

export function ageOn(dob, today) {
  let age = today.y - dob.y;
  if (today.mo < dob.mo || (today.mo === dob.mo && today.d < dob.d)) age -= 1;
  return age;
}

const addDays = ({ y, mo, d }, n) => {
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() };
};
const minusYears = ({ y, mo, d }, years) => ({ y: y - years, mo, d: Math.min(d, daysInMonth(y - years, mo)) });

// Earliest and latest acceptable birth dates today — the date picker's min / max.
export function dobBounds(now = new Date()) {
  const today = todayInTunis(now);
  const max = minusYears(today, MIN_AGE);
  let min = minusYears(today, MAX_AGE + 1);
  if (ageOn(min, today) > MAX_AGE) min = addDays(min, 1);
  return { min: formatIsoDate(min), max: formatIsoDate(max) };
}

/**
 * validateDob('2000-05-17')
 *   → { ok: true, age: 26, value: '2000-05-17' }
 *   → { ok: false, code: 'invalidDate' | 'future' | 'tooYoung' | 'tooOld' }
 */
export function validateDob(value, now = new Date()) {
  const dob = parseIsoDate(value);
  if (!dob) return { ok: false, code: 'invalidDate' };
  const age = ageOn(dob, todayInTunis(now));
  if (age < 0) return { ok: false, code: 'future' };
  if (age < MIN_AGE) return { ok: false, code: 'tooYoung', age };
  if (age > MAX_AGE) return { ok: false, code: 'tooOld', age };
  return { ok: true, age, value: formatIsoDate(dob) };
}

// Visitor-facing message key for each reason a date of birth is refused. The first
// four are the front end's own codes, the last four the server's (they say the same things).
export const DOB_ERROR_KEY = {
  invalidDate: 'auth.err_dob_invalid', future: 'auth.err_dob_future', tooYoung: 'auth.err_dob_young', tooOld: 'auth.err_dob_old',
  dobInvalid: 'auth.err_dob_invalid', dobFuture: 'auth.err_dob_future', dobTooYoung: 'auth.err_dob_young', dobTooOld: 'auth.err_dob_old',
  dobRequired: 'Date of birth is required',
};
