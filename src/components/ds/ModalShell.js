import { useEffect } from 'react';

// Dialog shell shared by the directory pages: a centred card on desktop, a
// bottom sheet on phones. Escape and a click on the backdrop close it.
export default function ModalShell({ onClose, maxWidth = 480, labelledBy, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ds fm-backdrop-blur-in fixed inset-0 z-[1000] flex items-end justify-center overflow-y-auto sm:items-center sm:p-5"
      style={{ background: 'var(--fm-overlay)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className="ds-pop max-h-[92vh] w-full overflow-y-auto !rounded-b-none p-5 pb-7 sm:my-auto sm:!rounded-2xl sm:p-7"
        style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

// Small uppercase caption above a form control; `extra` sits at the far end.
export function FieldLabel({ children, required, extra }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ds-mute">
        {children}{required && <span className="ms-1 text-ds-bad">*</span>}
      </span>
      {extra}
    </div>
  );
}
