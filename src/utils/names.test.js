import { firstWord, displayName, getInitials, normalizeName, validateFullName } from './names';

describe('firstWord — the only part of a name the platform displays', () => {
  test('is the first word, whether it is a given name or a family name', () => {
    expect(firstWord('Ahmed Ben Salah')).toBe('Ahmed');
    expect(firstWord('Ben Salah Ahmed')).toBe('Ben');
    expect(firstWord('  Rayen   ben chtila ')).toBe('Rayen');
    expect(firstWord('محمد بن علي')).toBe('محمد');
    expect(firstWord('Madonna')).toBe('Madonna');
  });

  test('copes with anything', () => {
    for (const v of ['', '   ', null, undefined, 7, {}, []]) expect(firstWord(v)).toBe('');
  });

  test('a decomposed accent is composed, and zero-width characters do not hide a space', () => {
    expect(firstWord('Renée Dupont')).toBe('Renée');
    expect(firstWord('​Ahmed Ben')).toBe('Ahmed');
  });
});

describe('displayName', () => {
  test('falls back only when there is no name', () => {
    expect(displayName('Ahmed Ben Salah', 'a@x.com')).toBe('Ahmed');
    expect(displayName('', 'a@x.com')).toBe('a@x.com');
    expect(displayName(null)).toBe('');
  });
});

describe('getInitials — one letter, from the first word only', () => {
  test('does not leak a second word', () => {
    expect(getInitials('ahmed Ben Salah')).toBe('A');
    expect(getInitials('Ben Salah Ahmed')).toBe('B');
    expect(getInitials('محمد بن علي')).toBe('م');
    expect(getInitials('')).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
  test('handles characters outside the basic plane', () => {
    expect(getInitials('𝔄hmed X')).toBe('𝔄');
  });
});

describe('validateFullName — same rules as the server', () => {
  test('accepts and tidies a normal full name', () => {
    expect(validateFullName('  Ahmed    Ben \t Salah ')).toEqual({ ok: true, value: 'Ahmed Ben Salah' });
    expect(normalizeName('Ahmed   Ben')).toBe('Ahmed Ben');
  });

  test('accepts names from other scripts and with real punctuation', () => {
    for (const n of ["Jean-Pierre O'Brien", 'Anne-Marie Dupont', 'José Álvarez', 'محمد بن علي', 'Léa N’Diaye', 'J. R. Tolkien']) {
      expect(validateFullName(n).ok).toBe(true);
    }
  });

  test('needs two words', () => {
    expect(validateFullName('Ahmed').code).toBe('nameNeedsTwoWords');
  });

  test('refuses empty, digits, symbols, markup and emoji', () => {
    expect(validateFullName('').code).toBe('nameRequired');
    expect(validateFullName(null).code).toBe('nameRequired');
    for (const n of ['Ahmed2 Ben', 'Ahmed <b>Ben</b>', 'Ahmed 🙂 Ben', 'Ahmed Ben_Salah', '- -', '. .']) {
      expect(validateFullName(n).code).toBe('nameInvalid');
    }
  });

  test('refuses an over-long name but allows exactly 120 characters', () => {
    expect(validateFullName(`${'a'.repeat(70)} ${'b'.repeat(70)}`).code).toBe('nameTooLong');
    expect(validateFullName(`${'a'.repeat(59)} ${'b'.repeat(60)}`).ok).toBe(true);
  });
});
