// components/Badge.jsx
import { useTranslation } from 'react-i18next';
 
const colorMap = {
  slate:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-slate-200 dark:ring-slate-700",
  indigo:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-800",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 ring-violet-200 dark:ring-violet-800",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-200 dark:ring-amber-800",
  rose:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ring-rose-200 dark:ring-rose-800",
  sky:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 ring-sky-200 dark:ring-sky-800",
  green:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-green-200 dark:ring-green-800",
  red:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-red-200 dark:ring-red-800",
};
 
const sizes = {
  xs: "px-1.5 py-0.5 text-[10px] rounded-md",
  sm: "px-2 py-0.5 text-xs rounded-lg",
  md: "px-2.5 py-1 text-xs rounded-lg",
  lg: "px-3 py-1 text-sm rounded-xl",
};
 
export default function Badge({
  children,
  color = "slate",
  size = "sm",
  dot = false,
  ring = false,
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 font-medium whitespace-nowrap",
        colorMap[color] ?? colorMap.slate,
        sizes[size] ?? sizes.sm,
        ring ? "ring-1" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={[
            "w-1.5 h-1.5 rounded-full",
            color === "emerald" ? "bg-emerald-500" : "",
            color === "amber" ? "bg-amber-500" : "",
            color === "rose" ? "bg-rose-500" : "",
            color === "indigo" ? "bg-indigo-500" : "",
            color === "slate" ? "bg-slate-500" : "",
            color === "sky" ? "bg-sky-500" : "",
            color === "red" ? "bg-red-500" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}
      {children}
    </span>
  );
}