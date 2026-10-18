import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from './Icon';

// Brand strip above the header — every supplied screen opens with one. It sits in
// the normal page flow and scrolls away, while the header stays pinned: the strip
// publishes how much of itself is still on screen as --fm-topbar-offset, which the
// fixed header (and the announcement banner under it) add to their `top`. Measuring
// the strip's own rectangle keeps this right on a phone, where the text wraps to two
// lines, and while the menu locks the page scroll.
export default function TopBar() {
  const { t } = useTranslation();
  const ref = useRef(null);

  // Layout effect: the offset is in place before the first paint, so the header never
  // flashes over the strip when this page mounts.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    const update = () => {
      const visible = el ? Math.max(0, Math.round(el.getBoundingClientRect().bottom)) : 0;
      root.style.setProperty('--fm-topbar-offset', `${visible}px`);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro && el) ro.observe(el);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
      root.style.setProperty('--fm-topbar-offset', '0px');
    };
  }, []);

  return (
    // Same indigo strip on every page (the supplied screens share one), whatever accent the page below uses.
    <div ref={ref} className="ds relative z-30 px-4 py-2.5 text-center text-white"
      style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}>
      <p className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-[12.5px] font-medium leading-[1.4] tracking-[0.01em] text-white">
        <Icon name="verified_user" size={16} fill className="flex-none" />
        <span>{t('topbar.text')}</span>
      </p>
    </div>
  );
}
