// components/FilterBar.jsx
import { useState } from "react";
import { useTranslation } from 'react-i18next';
 
export default function FilterBar({
  categories = [],
  activeCategory,
  onCategoryChange,
  sortOptions = [],
  activeSort,
  onSortChange,
  resultCount,
  label = "Results",
}) {
  const [showSort, setShowSort] = useState(false);
 
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Category pills */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange?.(cat)}
            className={[
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95",
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>
 
      {/* Right: count + sort */}
      <div className="flex items-center gap-3 shrink-0">
        {resultCount !== undefined && (
          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {resultCount} {label}
          </span>
        )}
 
        {sortOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSort((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort: {activeSort || sortOptions[0]}
              <svg className={["w-3.5 h-3.5 transition-transform", showSort ? "rotate-180" : ""].join(" ")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
 
            {showSort && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/10 z-20 overflow-hidden animate-[fadeUp_0.15s_ease]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { onSortChange?.(opt); setShowSort(false); }}
                    className={[
                      "w-full text-left px-4 py-2.5 text-xs transition-colors",
                      activeSort === opt
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
 
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
 