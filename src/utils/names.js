// People's names.
//
// An account holds ONE field, the full name, exactly as its owner typed it. What
// the platform SHOWS about a person is only the first word of it — whether that
// word happens to be a given name or a family name — so no list, card, message
// or e-mail gives away more than that. Nothing here tries to work out which word
// is which.
//
// Where the whole name must stay whole, the screen reads the stored name directly
// and says so: the person's own profile form, the admin's identity review (it has
// to match the document) and a payment receipt.
//
// The rules below mirror the server's (utils/names.js in the API). The server
// decides; these give instant feedback and keep what is shown consistent.

const INVISIBLE = /[​-‍⁠﻿]/g;
const SPACES = /[\s ]+/g;

// Trimmed, single-spaced, NFC-normalised.
export const normalizeName = raw =>
  typeof raw === 'string' ? raw.normalize('NFC').replace(INVISIBLE, '').replace(SPACES, ' ').trim() : '';

// The first word of a stored name — the only part of it that is displayed.
export const firstWord = name => {
  const v = normalizeName(name);
  return v ? v.split(' ')[0] : '';
};

// How to refer to someone: the first word, or `fallback` for an account with no name.
export const displayName = (name, fallback = '') => firstWord(name) || fallback;

// Avatar placeholder: ONE letter, the first of the first word (a second initial
// would show part of the name that is not meant to be shown).
export const getInitials = name => {
  const w = firstWord(name);
  return w ? Array.from(w)[0].toUpperCase() : '?';
};

// A word is letters of any script (Latin, Arabic …), their combining marks and the
// apostrophe / hyphen / full stop that real names contain — no digits, symbols or markup.
const WORD = /^[\p{L}\p{M}'’.-]+$/u;
const HAS_LETTER = /\p{L}/u;

/**
 * validateFullName(' Ahmed   Ben Salah ')
 *   → { ok: true, value: 'Ahmed Ben Salah' }
 *   → { ok: false, code: 'nameRequired' | 'nameNeedsTwoWords' | 'nameTooLong' | 'nameInvalid' }
 */
export function validateFullName(raw) {
  const value = normalizeName(raw);
  if (!value) return { ok: false, code: 'nameRequired' };
  if (value.length > 120) return { ok: false, code: 'nameTooLong' };
  const words = value.split(' ');
  if (words.length < 2) return { ok: false, code: 'nameNeedsTwoWords' };
  for (const w of words) if (!WORD.test(w) || !HAS_LETTER.test(w)) return { ok: false, code: 'nameInvalid' };
  return { ok: true, value };
}

// Visitor-facing message key for each name error code.
export const NAME_ERROR_KEY = {
  nameRequired: 'Full name is required',
  nameNeedsTwoWords: 'auth.err_name_two_words',
  nameInvalid: 'auth.err_name_invalid',
  nameTooLong: 'auth.err_name_long',
};
