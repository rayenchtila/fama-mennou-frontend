// components/FreelancerCard.jsx
import Badge from "./Badge";
import Button from "./Button";
 
const AVATAR_COLORS = [
  "bg-indigo-500","bg-emerald-500","bg-rose-500",
  "bg-amber-500","bg-sky-500","bg-fuchsia-500","bg-violet-500",
];
 
function Stars({ value }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg
          key={i}
          className={["w-3.5 h-3.5", i <= Math.round(value) ? "text-amber-400" : "text-slate-200 dark:text-slate-700"].join(" ")}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}
 
export default function FreelancerCard({ name, skill, rate, rating, reviews, avatar, tags = [], available, bio, completedJobs, onHire, onView, index = 0 }) {
  const freelancer = { name, skill, rate, rating, reviews, avatar, tags, available, bio, completedJobs };
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
 
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/60 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className={["w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md", avatarBg].join(" ")}>
              {avatar || name?.slice(0,2).toUpperCase()}
            </div>
            {/* Online indicator */}
            <div className={["absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900", available ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"].join(" ")} />
          </div>
 
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skill}</p>
          </div>
        </div>
 
        <div className="text-right">
          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{rate}</p>
          <Badge color={available ? "emerald" : "slate"} size="xs" dot>
            {available ? "Available" : "Busy"}
          </Badge>
        </div>
      </div>
 
      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <Stars value={rating} />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
        <span className="text-xs text-slate-400">({reviews} reviews)</span>
        {completedJobs && (
          <span className="ml-auto text-xs text-slate-400">{completedJobs} jobs</span>
        )}
      </div>
 
      {/* Bio */}
      {bio && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">{bio}</p>
      )}
 
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
        {tags.slice(0, 4).map((tag) => (
          <Badge key={tag} color="slate" size="xs">{tag}</Badge>
        ))}
      </div>
 
      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onHire?.(freelancer)}
          disabled={!available}
        >
          {available ? "Hire" : "Unavailable"}
        </Button>
      </div>
    </div>
  );
}
 