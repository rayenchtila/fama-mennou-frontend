import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import { CATEGORIES, CATEGORY_ICON } from './categories';

// Horizontally scrollable category filter. On a phone it bleeds to the screen
// edges (the parent supplies the negative margin) and scrolls with momentum;
// on desktop everything fits on one line.
//   variant="pill"  — rounded pills with icons (Courses)
//   variant="tonal" — the supplied Freelancers screen's squarer chips, no icons;
//                     `allCount` appends the live total to the "All" chip. From
//                     tablet up the chips wrap onto a second line (as in the
//                     supplied screen) instead of scrolling.
export default function CategoryPills({ value, onChange, label, className = '', variant = 'pill', allCount }) {
  const { t } = useTranslation();
  const tonal = variant === 'tonal';
  return (
    <div className={`ds-scroll-x ${tonal ? 'md:flex-wrap' : ''} ${className}`} role="group" aria-label={label}>
      {CATEGORIES.map(cat => {
        const text = cat === 'All' && allCount != null ? `${t(cat)} (${allCount})` : t(cat);
        return tonal ? (
          <button key={cat} type="button" className="ds-seg" aria-pressed={value === cat} onClick={() => onChange(cat)}>
            {text}
          </button>
        ) : (
          <button key={cat} type="button" className="ds-pill" aria-pressed={value === cat} onClick={() => onChange(cat)}>
            {/* Icons help on a phone, where the row scrolls sideways; from tablet up the
                labels alone keep all seven pills on one line, as in the supplied design. */}
            <Icon name={CATEGORY_ICON[cat]} size={16} className="md:hidden" />
            {text}
          </button>
        );
      })}
    </div>
  );
}
