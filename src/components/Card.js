// components/Card.jsx
import { useTranslation } from 'react-i18next';
 
export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  onClick,
  as: Tag = "div",
}) {
  const padMap = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
    xl: "p-8",
  };
 
  return (
    <Tag
      onClick={onClick}
      className={[
        "bg-white dark:bg-slate-900",
        "rounded-2xl border border-slate-200 dark:border-slate-800",
        hover
          ? "transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-0.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          : "",
        padMap[padding] ?? padMap.md,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
 