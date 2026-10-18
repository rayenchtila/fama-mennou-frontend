import { validateDob, dobBounds, parseIsoDate, todayInTunis } from './age';

// 16 October 2026, midday UTC (13:00 in Tunis — same calendar day).
const NOW = new Date('2026-10-16T12:00:00Z');
const check = (dob, now = NOW) => validateDob(dob, now);

test('turning 18 today is accepted, turning 18 tomorrow is not', () => {
  expect(check('2008-10-16')).toEqual({ ok: true, age: 18, value: '2008-10-16' });
  expect(check('2008-10-17').code).toBe('tooYoung');
});

test('age is counted from the real date, not from the birth year', () => {
  expect(check('2008-01-01').ok).toBe(true);
  expect(check('2008-12-31').code).toBe('tooYoung');
  expect(check('2009-01-01').code).toBe('tooYoung');
});

test('56 is accepted, 57 is not — to the day', () => {
  expect(check('1970-01-01').age).toBe(56);
  expect(check('1969-10-17')).toEqual({ ok: true, age: 56, value: '1969-10-17' });
  expect(check('1969-10-16').code).toBe('tooOld');
  expect(check('1900-01-01').code).toBe('tooOld');
});

test('the future is refused', () => {
  expect(check('2026-10-17').code).toBe('future');
});

test('things that are not real dates are refused, never rolled over', () => {
  for (const bad of ['2000-02-30', '2001-02-29', '2000-13-01', '2000-00-10', '2000-1-1', '2000/01/01', 'abc', '', null, undefined, 20000101]) {
    expect(check(bad).code).toBe('invalidDate');
  }
  expect(parseIsoDate('2000-02-29')).toEqual({ y: 2000, mo: 2, d: 29 });
});

test('29 February: the birthday arrives on 1 March in a common year', () => {
  expect(check('2008-02-29', new Date('2026-02-28T12:00:00Z')).code).toBe('tooYoung');
  expect(check('2008-02-29', new Date('2026-03-01T12:00:00Z')).ok).toBe(true);
});

test('"today" is the date in Tunis, not in UTC', () => {
  const lateUtc = new Date('2026-10-16T23:30:00Z');
  expect(todayInTunis(lateUtc)).toEqual({ y: 2026, mo: 10, d: 17 });
  expect(check('2008-10-17', lateUtc).ok).toBe(true);
});

test('the date picker bounds agree with validateDob around both edges', () => {
  const DAY = 86_400_000;
  const at = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  for (const now of ['2026-10-16T12:00:00Z', '2028-02-29T12:00:00Z', '2027-03-01T12:00:00Z'].map(s => new Date(s))) {
    const { min, max } = dobBounds(now);
    for (const bound of [min, max]) {
      for (let k = -40; k <= 40; k++) {
        const iso = new Date(at(bound) + k * DAY).toISOString().slice(0, 10);
        expect(validateDob(iso, now).ok).toBe(iso >= min && iso <= max);
      }
    }
  }
  expect(dobBounds(NOW)).toEqual({ min: '1969-10-17', max: '2008-10-16' });
});
