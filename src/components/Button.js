// components/Button.jsx
import { forwardRef } from "react";
const variants = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 focus:ring-indigo-500",
  secondary:
    "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-400",
  ghost:
    "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400",
  danger:
    "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md shadow-rose-500/30 focus:ring-rose-500",
  outline:
    "border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-indigo-500",
  success:
    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/30 focus:ring-emerald-500",
};
 
const sizes = {
  xs: "px-2.5 py-1 text-xs gap-1 rounded-lg",
  sm: "px-3.5 py-1.5 text-sm gap-1.5 rounded-xl",
  md: "px-5 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-7 py-3.5 text-base gap-2 rounded-2xl",
  xl: "px-9 py-4 text-lg gap-3 rounded-2xl",
};
 
const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      onClick,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-200 ease-out",
          "active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1",
          "dark:focus:ring-offset-slate-900 select-none",
          variants[variant] ?? variants.primary,
          sizes[size] ?? sizes.md,
          fullWidth ? "w-full" : "",
          disabled || loading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin w-4 h-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
 
Button.displayName = "Button";
export default Button;