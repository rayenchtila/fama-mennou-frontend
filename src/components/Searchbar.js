import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Added for smooth animations
import { useTranslation } from "react-i18next";

export default function Searchbar({
  value = "",
  onChange = () => {},
  onSearch = () => {},
  placeholder = "Search…",
  suggestions = [],
  compact = false,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const inputRef = useRef(null);

  // ✅ YOUR LOGIC: Keep filtered suggestions in sync
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [value, suggestions]);

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    onSearch?.(suggestion);
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        {/* Input Wrapper with Hover Animation */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={[
            "relative flex items-center rounded-xl transition-all duration-200",
            compact
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
          ].join(" ")}
        >
          <svg
            className={[
              "w-4 h-4 shrink-0 ml-3",
              value
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value && filteredSuggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className={[
              "flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500",
              compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-base",
            ].join(" ")}
          />

          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={() => { onChange(""); setIsOpen(false); }}
              className="mr-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label={t("search.clear")}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          )}
        </motion.div>
      </form>

      {/* ✅ Suggestions dropdown with AnimatePresence Logic */}
      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all group"
                >
                  <svg
                    className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="flex-1 text-slate-900 dark:text-white">{suggestion}</span>
                  <svg
                    className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}