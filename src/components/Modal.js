// components/Modal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full mx-4",
  fullscreen: "max-w-full",
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  closable = true,
  className = "",
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape" && closable) onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, closable, onClose]);

  if (!open) return null;

  const isFullscreen = size === 'fullscreen';

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto overflow-x-hidden animate-[modalUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">

        {/* Close button — top right, always visible */}
        {closable && (
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Centered content wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:py-16">
          <div className="w-full max-w-md">

            {/* Header */}
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                )}
              </div>
            )}

            {/* Body */}
            <div>{children}</div>

            {/* Footer */}
            {footer && (
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                {footer}
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes modalUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 380px) {
            .rc-anchor-normal {
              transform: scale(0.82);
              transform-origin: left center;
            }
          }
          @media (max-width: 420px) and (min-width: 381px) {
            .rc-anchor-normal {
              transform: scale(0.9);
              transform-origin: left center;
            }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && closable) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" />

      {/* Panel */}
      <div
        className={[
          "relative w-full bg-white dark:bg-slate-900",
          "rounded-2xl shadow-2xl shadow-black/30",
          "animate-[modalUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]",
          "flex flex-col max-h-[90vh]",
          sizes[size] ?? sizes.md,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ "--tw-shadow": "0 25px 60px -12px rgb(0 0 0 / 0.4)" }}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-0 shrink-0">
            <div>
              {title && (
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="ml-4 mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-800 mt-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
