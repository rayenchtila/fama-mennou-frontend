import { useTranslation } from 'react-i18next';
import CategoryPills from './CategoryPills';
import SortSelect from './SortSelect';
import CountUp from './CountUp';

// The boxed filter toolbar of the supplied Freelancers screen: category chips on
// one side; "Sort by", a select and the live result count on the other. On a phone
// the two halves stack (chips scroll sideways); from 1280px it is one row and
// stays pinned under the header while the list scrolls.
export default function DirectoryToolbar({ category, onCategory, allCount, sortValue, onSort, sortOptions, count, countLabel }) {
  const { t } = useTranslation();
  return (
    <div className="ds-tonal mb-6 flex flex-col items-start justify-between gap-3.5 p-3.5 xl:sticky xl:top-[calc(66px+var(--fm-announcement-h,0px)+12px)] xl:z-20 xl:mb-8 xl:flex-row xl:items-center xl:gap-4 xl:p-4">
      <CategoryPills variant="tonal" value={category} onChange={onCategory} allCount={allCount} label={t('Category')} className="w-full min-w-0 xl:w-auto" />
      <div className="flex w-full flex-none items-center justify-between gap-4 xl:w-auto xl:justify-end">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap text-[11px] font-semibold text-ds-mute">{t('ds.sort_by')}</span>
          <SortSelect variant="tonal" value={sortValue} onChange={onSort} options={sortOptions} label={t('ds.sort_by')} />
        </label>
        <span className="hidden h-4 w-px bg-ds-highest sm:block" aria-hidden="true" />
        <span className="whitespace-nowrap text-[11px] font-semibold text-ds-mute">
          <CountUp value={count} className="text-[13px] font-bold tabular-nums text-ds-ink" fallback="…" /> {countLabel}
        </span>
      </div>
    </div>
  );
}
