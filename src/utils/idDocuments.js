// The identity documents a freelancer may submit at sign-up — exactly four.
//
//   cin                the national identity card   (front + back)
//   passport           the photo page               (one photo)
//   driving_license    the driving licence          (front + back)
//   birth_certificate  the official extract (extrait de naissance) (one photo)
//
// The same list and the same number of sides as the API's utils/idDocuments.js,
// which is what really enforces them.

export const ID_DOCUMENTS = [
  { value: 'cin',               icon: 'badge',          sides: ['front', 'back'] },
  { value: 'passport',          icon: 'passport',       sides: ['front'] },
  { value: 'driving_license',   icon: 'directions_car', sides: ['front', 'back'] },
  { value: 'birth_certificate', icon: 'description',    sides: ['front'] },
];

export const DEFAULT_ID_DOCUMENT = 'cin';

export const idDocument = value => ID_DOCUMENTS.find(d => d.value === value) || ID_DOCUMENTS[0];
export const sidesFor = value => idDocument(value).sides;
export const isIdDocument = value => ID_DOCUMENTS.some(d => d.value === value);

// A photo larger than this is refused before the browser even tries to shrink it.
export const MAX_DOCUMENT_FILE_BYTES = 25 * 1024 * 1024;
