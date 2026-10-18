// What to tell a person whose profile save was refused.
//
// AuthContext.updateUser() answers { error, field } when the server says no. For the rules that live on the
// server (full name, date of birth, short bio) `error` is a stable code — "nameNeedsTwoWords", "dobTooOld",
// "bioTooLong" — so the form can say what is wrong in the visitor's language instead of "validation_error".
import { NAME_ERROR_KEY } from './names';
import { DOB_ERROR_KEY } from './age';

// The short bio's limit — the server's (BIO_MAX in routes/users.js), shown by the counter on every profile form.
export const BIO_MAX = 300;

// Own properties only: a code like "constructor" must not find Object.prototype's.
const own = (map, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null);

export function profileSaveError(result, t) {
  const code = result && result.error;
  const nameKey = own(NAME_ERROR_KEY, code);
  if (nameKey) return t(nameKey);
  const dobKey = own(DOB_ERROR_KEY, code);
  if (dobKey) return t(dobKey);
  if (code === 'bioTooLong') return t('profile.err_bio_long', { max: BIO_MAX });
  return t('profile.save_failed');
}
