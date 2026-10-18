import { profileSaveError, BIO_MAX } from './profileErrors';

// A stand-in for react-i18next's t(): returns "key" or "key|{options}" so the test can see what was asked for.
const t = (key, opts) => (opts ? `${key}|${JSON.stringify(opts)}` : key);

describe('profileSaveError', () => {
  test('name codes map to the same messages the sign-up form uses', () => {
    expect(profileSaveError({ error: 'nameNeedsTwoWords' }, t)).toBe('auth.err_name_two_words');
    expect(profileSaveError({ error: 'nameInvalid' }, t)).toBe('auth.err_name_invalid');
    expect(profileSaveError({ error: 'nameTooLong' }, t)).toBe('auth.err_name_long');
    expect(profileSaveError({ error: 'nameRequired' }, t)).toBe('Full name is required');
  });

  test('date-of-birth codes map to the age messages', () => {
    expect(profileSaveError({ error: 'dobTooYoung' }, t)).toBe('auth.err_dob_young');
    expect(profileSaveError({ error: 'dobTooOld' }, t)).toBe('auth.err_dob_old');
    expect(profileSaveError({ error: 'dobInvalid' }, t)).toBe('auth.err_dob_invalid');
    expect(profileSaveError({ error: 'dobFuture' }, t)).toBe('auth.err_dob_future');
  });

  test('a too-long bio says the limit', () => {
    expect(BIO_MAX).toBe(300);
    expect(profileSaveError({ error: 'bioTooLong', field: 'bio' }, t)).toBe('profile.err_bio_long|{"max":300}');
  });

  test('anything else — a network error, an HTTP status, nothing at all — is the generic message', () => {
    expect(profileSaveError({ error: 'HTTP 500' }, t)).toBe('profile.save_failed');
    expect(profileSaveError({ error: 'networkError' }, t)).toBe('profile.save_failed');
    expect(profileSaveError({}, t)).toBe('profile.save_failed');
    expect(profileSaveError(undefined, t)).toBe('profile.save_failed');
  });

  test('a code that happens to be an inherited object property is not mistaken for a known one', () => {
    expect(profileSaveError({ error: 'constructor' }, t)).toBe('profile.save_failed');
    expect(profileSaveError({ error: 'toString' }, t)).toBe('profile.save_failed');
  });
});
