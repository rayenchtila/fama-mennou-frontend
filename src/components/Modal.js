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
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden animate-[modalUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: '#0a0817',
          backgroundImage: 'radial-gradient(ellipse 75% 65% at 100% 0%, rgba(104,76,226,0.5) 0%, rgba(60,130,240,0.18) 42%, transparent 68%)'
        }}>

        {/* Centered content wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
          <div className="auth-card w-full max-w-md rounded-2xl"
            style={{
              background: '#120f2b',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 25px 70px rgba(0,0,0,0.55), 0 0 60px rgba(104,76,226,0.07)'
            }}>
            <div className="p-7 sm:p-8">

              {/* Header row — key forces remount → CSS animation fires on every switch */}
              {(title || subtitle || closable) && (
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2
                          key={String(title)}
                          className="text-2xl sm:text-3xl font-bold leading-tight animate-[authTitleIn_0.35s_cubic-bezier(0.22,1,0.36,1)_both]"
                          style={{ color: '#fbfbff' }}
                        >
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p
                          key={subtitle}
                          className="mt-1.5 text-sm animate-[authSubIn_0.35s_cubic-bezier(0.22,1,0.36,1)_0.05s_both]"
                          style={{ color: '#a7abc8' }}
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                    {closable && (
                      <button
                        onClick={onClose}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all"
                        style={{ background: 'rgba(255,255,255,.08)', color: '#a7abc8' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.14)'; e.currentTarget.style.color = '#fbfbff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#a7abc8'; }}
                        aria-label="Close"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Body */}
              <div>{children}</div>

              {/* Footer */}
              {footer && (
                <div className="pt-4 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes modalUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          /* Title slides in from slight left + fades — fires on every tab/role switch */
          @keyframes authTitleIn {
            from { opacity: 0; transform: translateX(-14px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes authSubIn {
            from { opacity: 0; transform: translateX(-10px); }
            to   { opacity: 1; transform: translateX(0); }
          }

          /* All inputs, selects, textareas — silky smooth on appearance */
          .auth-card input,
          .auth-card select,
          .auth-card textarea {
            transition: border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.25s ease;
          }

          /* Buttons inside auth feel snappy */
          .auth-card button {
            transition: background-color 0.18s ease, color 0.18s ease,
                        box-shadow 0.18s ease, transform 0.12s ease;
          }
          .auth-card button:active {
            transform: scale(0.97);
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
