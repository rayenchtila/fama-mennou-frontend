import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../ds/Icon';
import { Spinner } from './AuthControls';

/* One photo of an identity document: a side of the national ID card or of the driving licence, or the
   single page of a passport or a birth certificate (see DocumentStep). Same behaviour as before — a small menu offers
   "Take a photo" (rear camera) or "Choose from gallery", both accepting HEIC/HEIF — drawn
   as the dashed drop area of the supplied sign-up design. Once a photo is picked it fills
   the box, with a persistent "Change" button (a hover-only label does not exist on touch
   screens). */
export default function CinDropzone({ label, hint, preview, onFile, required = true, invalid = false, busy = false }) {
  const { t } = useTranslation();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Close the menu on Escape or on a click outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    const onDown = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const pick = ref => { setOpen(false); ref.current?.click(); };
  // The input is deliberately left as it is after a pick (not reset): the file read that follows
  // (right away, see handleDocFile in AuthModal) has to keep working with exactly the handle the picker returned.
  const onChange = e => { const f = e.target.files?.[0]; if (f) onFile(f); };

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <p className="mb-1.5 flex items-center justify-between gap-2 text-[13px] font-semibold text-ds-ink-2">
        <span>{label}{required && <span aria-hidden="true" className="ms-0.5 text-ds-bad">*</span>}</span>
        {preview && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ds-ok"><Icon name="check_circle" size={14} fill />{t('auth.cin_added')}</span>}
      </p>

      <button type="button" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}
        aria-label={preview ? `${label} — ${t('Change')}` : `${label}${hint ? ` — ${hint}` : ''}`}
        data-invalid={invalid ? 'true' : undefined} aria-busy={busy || undefined}
        className={`group relative flex h-32 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-0 text-center transition-colors ${
          preview ? 'border-ds-ok/60 bg-ds-low' : invalid ? 'border-ds-bad/60 bg-ds-bad/5' : open ? 'border-ds-accent bg-ds-low' : 'border-ds-line-strong bg-ds-low hover:border-ds-accent hover:bg-ds-high'}`}>
        {preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-black/20" aria-hidden="true" />
            <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              <Icon name="edit" size={14} />{t('Change')}
            </span>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ds-line bg-ds-high text-ds-faint transition-colors group-hover:border-ds-accent-line group-hover:bg-ds-accent-soft group-hover:text-ds-accent">
              {busy ? <Spinner className="h-5 w-5" /> : <Icon name="photo_camera" size={20} />}
            </span>
            <span className="px-3 text-[12px] font-medium leading-snug text-ds-mute">{hint}</span>
          </>
        )}
      </button>

      {open && (
        <div role="menu" className="ds-pop absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden">
          <button type="button" role="menuitem" onClick={() => pick(cameraRef)} className="ds-menuitem !gap-3 !px-4 !py-3 text-[13px] font-semibold">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ds-accent-soft text-ds-accent"><Icon name="photo_camera" size={17} /></span>
            {t('Take a photo')}
          </button>
          <button type="button" role="menuitem" onClick={() => pick(galleryRef)} className="ds-menuitem !gap-3 !px-4 !py-3 text-[13px] font-semibold">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ds-info/15 text-ds-info"><Icon name="image" size={17} /></span>
            {t('Choose from Gallery')}
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*,.heic,.heif" capture="environment" className="hidden" tabIndex={-1} onChange={onChange} />
      <input ref={galleryRef} type="file" accept="image/*,.heic,.heif" className="hidden" tabIndex={-1} onChange={onChange} />
    </div>
  );
}
