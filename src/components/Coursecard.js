// components/CourseCard.jsx
import { useTranslation } from "react-i18next";
import Badge from "./Badge";
import Button from "./Button";
import { cldImg } from "../utils/cloudinary";
const LEVEL_COLOR = { Beginner: "emerald", Intermediate: "amber", Advanced: "rose" };
 
function Stars({ value }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={["w-3 h-3", i <= Math.round(value) ? "text-amber-400" : "text-slate-200 dark:text-slate-700"].join(" ")} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}
 
export default function CourseCard({ title, author, price, category, students, rating, level, img, duration, lessons, thumbnail, onEnroll, onPreview }) {
  const { t } = useTranslation();
  const course = { title, author, price, category, students, rating, level, img, duration, lessons, thumbnail };
  const isFree = price === 0;
 
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800/60 flex flex-col">
      {/* Thumbnail */}
      <div
        className="h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden cursor-pointer"
        onClick={() => onPreview?.(course)}
      >
        {thumbnail ? (
          <img src={cldImg(thumbnail)} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          </div>
        )}
 
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
 
        {/* Free badge */}
        {isFree && (
          <div className="absolute top-2 left-2">
            <Badge color="emerald" size="sm">{t("cc.free")}</Badge>
          </div>
        )}
      </div>
 
      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category + Level */}
        <div className="flex items-center gap-1.5 mb-2">
          <Badge color="indigo" size="xs">{category}</Badge>
          <Badge color={LEVEL_COLOR[level] ?? "slate"} size="xs">{level}</Badge>
        </div>
 
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2">
          {title}
        </h3>
 
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("cc.by", { author })}</p>
 
        {/* Stats row */}
        <div className="flex items-center gap-2 mb-3">
          <Stars value={rating} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
          <span className="text-xs text-slate-400">({t("cc.students_count", { count: students || 0 })})</span>
        </div>
 
        {/* Meta */}
        {(duration || lessons) && (
          <div className="flex items-center gap-3 mb-3 text-xs text-slate-400">
            {duration && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
                </svg>
                {duration}
              </span>
            )}
            {lessons && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                {t("cc.lessons_count", { count: lessons })}
              </span>
            )}
          </div>
        )}
 
        {/* Price + Enroll */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            {isFree ? (
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{t("cc.free")}</span>
            ) : (
              <span className="text-base font-extrabold text-slate-900 dark:text-white">${price}</span>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => onEnroll?.(course)}>
            {isFree ? t("cc.enroll_free") : t("cc.buy_now")}
          </Button>
        </div>
      </div>
    </div>
  );
}
 