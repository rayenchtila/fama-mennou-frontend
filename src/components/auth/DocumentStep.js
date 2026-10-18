import { useTranslation } from 'react-i18next';
import Icon from '../ds/Icon';
import CinDropzone from './CinDropzone';
import { AuthNotice, FieldError } from './AuthControls';
import { ID_DOCUMENTS, idDocument } from '../../utils/idDocuments';

/* Second step of a freelancer's sign-up: the identity document.

   Exactly four kinds are accepted — the national ID card, a passport, a driving
   licence, or the official birth certificate (extrait de naissance). The visitor
   picks one, and the screen then asks for the sides that document has: front and
   back for a card, one photo for a passport page or a birth certificate. The server
   enforces the same list and the same sides; this is only the way to meet them.

   It also says plainly that the document NUMBER may be covered before the photo is
   taken — what must stay readable is the name, the date of birth and the photo. */
export default function DocumentStep({ docType, onDocType, previews, onFile, invalid, error }) {
  const { t } = useTranslation();
  const doc = idDocument(docType);
  const two = doc.sides.length === 2;
  const ready = doc.sides.every(side => previews[side]);

  const slot = {
    front: two
      ? { label: t('Front side'), hint: t('Photo of the front') }
      : docType === 'passport'
        ? { label: t('auth.slot_passport'), hint: t('auth.hint_passport') }
        : { label: t('auth.slot_birth'), hint: t('auth.hint_birth') },
    back: { label: t('Back side'), hint: t('Flip and photograph') },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="auth-id-title" className="m-0 text-[15px] font-bold text-ds-ink">{t('auth.id_title')}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-ds-accent-line bg-ds-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-ds-accent">
          <Icon name="schedule" size={14} />{t('auth.cin_delay')}
        </span>
      </div>

      {/* Which document — exactly these four */}
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-semibold text-ds-ink-2">{t('auth.id_pick')}</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {ID_DOCUMENTS.map(d => {
            const checked = d.value === docType;
            return (
              <label key={d.value} className="relative block cursor-pointer">
                <input type="radio" name="id-document-type" value={d.value} checked={checked} onChange={() => onDocType(d.value)} className="peer sr-only" />
                <span className={`flex h-full flex-col gap-1.5 rounded-xl border-2 p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ds-accent/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ds-canvas ${
                  checked ? 'border-ds-accent bg-ds-accent-soft' : 'border-ds-line bg-ds-low hover:bg-ds-high'}`}>
                  <span className="flex items-center justify-between">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${checked ? 'bg-ds-accent/15 text-ds-accent' : 'bg-ds-high text-ds-mute'}`}>
                      <Icon name={d.icon} size={20} />
                    </span>
                    {checked && <Icon name="check_circle" size={20} fill className="text-ds-accent" />}
                  </span>
                  <span className="text-[13px] font-semibold leading-snug text-ds-ink">{t(`auth.doc.${d.value}`)}</span>
                  <span className={`text-[11.5px] leading-snug ${checked ? 'text-ds-mute' : 'text-ds-faint'}`}>{t(d.sides.length === 2 ? 'auth.doc_sides_two' : 'auth.doc_sides_one')}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mb-0 mt-2 text-[12px] leading-relaxed text-ds-faint">{t('auth.doc_only')}</p>
      </fieldset>

      <AuthNotice tone="info" icon="info">{t('Take a photo or choose from your gallery. Must be clear and clean.')}</AuthNotice>

      {/* The sides of the chosen document. Changing the document starts the photos again (remount by key),
          so a passport page can never be sent as the front of a licence. */}
      <div key={docType} className={two ? 'flex gap-3' : 'max-w-[20rem]'} data-invalid={invalid ? 'true' : undefined}>
        {doc.sides.map(side => (
          <CinDropzone key={side} label={slot[side].label} hint={slot[side].hint} preview={previews[side]}
            invalid={invalid && !previews[side]} onFile={f => onFile(side, f)} />
        ))}
      </div>

      {ready && <AuthNotice tone="ok" icon="check_circle">{t('auth.doc_ready')}</AuthNotice>}
      <FieldError>{error}</FieldError>

      {/* Masking: what may be hidden, and what may not */}
      <div className="flex items-start gap-3 rounded-xl border border-ds-line bg-ds-low p-3.5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-ds-accent-soft text-ds-accent"><Icon name="visibility_off" size={20} /></span>
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-ds-ink">{t('auth.mask_title')}</p>
          <p className="mb-0 mt-1 text-[12.5px] leading-relaxed text-ds-mute">{t('auth.mask_text')}</p>
        </div>
      </div>

      <p className="m-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-ds-faint">
        <Icon name="lock" size={15} className="mt-px flex-none" />{t('auth.cin_private')}
      </p>
    </div>
  );
}
