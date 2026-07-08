// components/Input.jsx
import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";

const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      hintColor,
      leftIcon,
      rightIcon,
      type = "text",
      size = "md",
      className = "",
      containerClass = "",
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const sizeMap = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

    return (
      <div className={["flex flex-col gap-1.5", containerClass].join(" ")}>
        {label && (
          <label className="text-sm flex items-center gap-1" style={{ color: "var(--fm-text-3)", fontWeight: 700 }}>
            {label}
            {required && <span style={{ color: "var(--fm-danger)" }}>*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none" style={{ color: "var(--fm-text-7)" }}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={[
              "w-full rounded-xl border transition-all duration-200",
              "bg-[var(--fm-surface-2)] text-[var(--fm-text-2)] placeholder-[var(--fm-text-7)]",
              "focus:outline-none focus:ring-2",
              error
                ? "border-[color-mix(in_srgb,var(--fm-danger)_60%,transparent)] focus:ring-rose-500/20 focus:border-rose-400"
                : "border-[var(--fm-border-strong)] focus:ring-[var(--fm-primary-border)] focus:border-[var(--fm-primary)]",
              disabled ? "opacity-50 cursor-not-allowed" : "",
              leftIcon ? "pl-10" : "",
              rightIcon || isPassword ? "pr-10" : "",
              sizeMap[size] ?? sizeMap.md,
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
            onCopy={isPassword        ? e => e.preventDefault() : props.onCopy}
            onCut={isPassword         ? e => e.preventDefault() : props.onCut}
            onContextMenu={isPassword ? e => e.preventDefault() : props.onContextMenu}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("input.hide_password") : t("input.show_password")}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: showPassword ? 'var(--fm-primary-light)' : 'var(--fm-text-7)',
                transition: 'color 0.18s, background 0.18s',
                outline: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fm-primary-light)'; e.currentTarget.style.background = 'var(--fm-primary-soft)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = showPassword ? 'var(--fm-primary-light)' : 'var(--fm-text-7)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {showPassword ? (
                /* Eye-open: password is visible */
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                /* Eye-slash: password is hidden */
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          )}

          {rightIcon && !isPassword && (
            <div className="absolute right-3 flex items-center pointer-events-none" style={{ color: "var(--fm-text-7)" }}>
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--fm-danger)" }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs" style={{ color: hintColor || "var(--fm-primary-light)", opacity: 0.75, transition: 'color 0.25s ease' }}>{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
