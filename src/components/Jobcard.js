// components/JobCard.jsx
import Badge from "./Badge";
import Button from "./Button";
 
const TYPE_COLOR = {
  "Full-time": "emerald",
  "Contract":  "amber",
  "Part-time": "sky",
  "Freelance": "violet",
  "Internship": "rose",
};
 
const LOGO_COLORS = [
  "bg-indigo-600","bg-emerald-600","bg-rose-600",
  "bg-amber-600","bg-sky-600","bg-violet-600",
];
 
export default function JobCard({ title, company, location, salary, type, tags = [], logo, postedAt, remote, description, onApply, onSave, saved = false, index = 0 }) {
  const job = { title, company, location, salary, type, tags, logo, postedAt, remote, description };
 
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/60">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Company logo */}
        <div className={["w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm", LOGO_COLORS[index % LOGO_COLORS.length]].join(" ")}>
          {logo || company?.[0]}
        </div>
 
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{company}</p>
            </div>
            {/* Save button */}
            <button
              onClick={() => onSave?.(job)}
              className={["shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90", saved ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20" : "text-slate-300 dark:text-slate-600 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"].join(" ")}
              aria-label="Save job"
            >
              <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
 
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </span>
        {salary && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {salary}
          </span>
        )}
        {postedAt && <span>{postedAt}</span>}
      </div>
 
      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">{description}</p>
      )}
 
      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge color={TYPE_COLOR[type] ?? "slate"} size="xs">{type}</Badge>
        {remote && <Badge color="indigo" size="xs">Remote</Badge>}
        {tags.slice(0, 3).map((tag) => (
          <Badge key={tag} color="slate" size="xs">{tag}</Badge>
        ))}
      </div>
 
      {/* Apply button */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button variant="primary" size="sm" fullWidth onClick={() => onApply?.(job)}>
          Apply Now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}