// components/Toast.jsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
 
// ── Hook ──────────────────────────────────────────────────────
let _dispatch = null;
 
export function useToast() {
  return {
    toast: useCallback((message, options = {}) => _dispatch?.({ message, ...options }), []),
  };
}
 
// Convenience shorthand
export const toast = {
  success: (msg, opts) => _dispatch?.({ message: msg, type: "success", ...opts }),
  error:   (msg, opts) => _dispatch?.({ message: msg, type: "error",   ...opts }),
  info:    (msg, opts) => _dispatch?.({ message: msg, type: "info",    ...opts }),
  warning: (msg, opts) => _dispatch?.({ message: msg, type: "warning", ...opts }),
};
 
// ── Individual Toast item ─────────────────────────────────────
const ICONS = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};
 
const COLORS = {
  success: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
  error:   "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200",
  info:    "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200",
  warning: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
};
 
const ICON_COLORS = {
  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50",
  error:   "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50",
  info:    "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50",
};
 
function ToastItem({ id, message, type = "info", title, onRemove }) {
  const [visible, setVisible] = useState(false);
 
  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(() => onRemove(id), 300); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id, onRemove]);
 
  return (
    <div
      className={[
        "flex items-start gap-3 w-80 max-w-full px-4 py-3 rounded-2xl border shadow-lg shadow-black/5 dark:shadow-black/30",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        COLORS[type] ?? COLORS.info,
      ].join(" ")}
    >
      {/* Icon */}
      <div className={["w-7 h-7 rounded-xl flex items-center justify-center shrink-0", ICON_COLORS[type]].join(" ")}>
        {ICONS[type]}
      </div>
 
      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {title && <p className="text-xs font-bold mb-0.5">{title}</p>}
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
 
      {/* Dismiss */}
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
 
// ── Provider / Container ──────────────────────────────────────
let _counter = 0;
 
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _dispatch = (options) => {
      const id = ++_counter;
      setToasts((prev) => [...prev, { id, ...options }]);
    };
    return () => { _dispatch = null; };
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      {toasts.length > 0 && createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onRemove={remove} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
 