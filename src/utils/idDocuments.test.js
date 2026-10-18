import { ID_DOCUMENTS, DEFAULT_ID_DOCUMENT, idDocument, sidesFor, isIdDocument } from './idDocuments';

test('exactly four documents are offered', () => {
  expect(ID_DOCUMENTS.map(d => d.value).sort()).toEqual(['birth_certificate', 'cin', 'driving_license', 'passport']);
});

test('how many sides each one needs', () => {
  expect(sidesFor('cin')).toEqual(['front', 'back']);
  expect(sidesFor('driving_license')).toEqual(['front', 'back']);
  expect(sidesFor('passport')).toEqual(['front']);
  expect(sidesFor('birth_certificate')).toEqual(['front']);
});

test('the national ID card is the default, and unknown values fall back to it', () => {
  expect(DEFAULT_ID_DOCUMENT).toBe('cin');
  expect(idDocument('nope').value).toBe('cin');
});

test('only the four real values are valid', () => {
  for (const v of ['cin', 'passport', 'driving_license', 'birth_certificate']) expect(isIdDocument(v)).toBe(true);
  for (const v of ['id_card', 'CIN', '', null, undefined, '__proto__', 'residence_permit']) expect(isIdDocument(v)).toBe(false);
});

test('every document has an icon', () => {
  for (const d of ID_DOCUMENTS) expect(typeof d.icon).toBe('string');
});
