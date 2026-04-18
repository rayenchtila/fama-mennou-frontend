// components/Input.jsx
import { forwardRef, useState } from "react";
 
const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}
 
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
 
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={[
              "w-full rounded-xl border transition-all duration-200",
              "bg-white dark:bg-slate-900",
              "text-slate-900 dark:text-slate-100",
              "placeholder-slate-400 dark:placeholder-slate-600",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
              error
                ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
              disabled ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : "",
              leftIcon ? "pl-10" : "",
              rightIcon || isPassword ? "pr-10" : "",
              sizeMap[size] ?? sizeMap.md,
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
 
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
 
          {rightIcon && !isPassword && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
 
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
 
        {hint && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);
 
Input.displayName = "Input";
export default Input;