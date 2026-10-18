import { Link } from 'react-router-dom';
import Icon from './Icon';

// Slim notice strip under the header (the supplied Freelancers screen opens with
// one). Copy is supplied by the page and must state something the platform really
// does. `to`/`cta` add the optional "learn more" link.
export default function NoticeBar({ title, children, to, cta }) {
  return (
    <section className="w-full bg-ds-lowest">
      <div className="ds-wrap py-3">
        <div className="ds-tonal flex items-center justify-between gap-3 !rounded-lg px-3.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon name="verified_user" size={18} fill className="flex-none text-ds-accent" />
            <p className="m-0 line-clamp-3 text-[13px] leading-[1.4] text-ds-mute md:truncate">
              <strong className="font-semibold text-ds-ink">{title}</strong> {children}
            </p>
          </div>
          {to && (
            <Link to={to} className="hidden flex-none items-center gap-1 text-[11px] font-semibold text-ds-accent transition-colors hover:text-ds-ink md:inline-flex">
              {cta} <Icon name="arrow_forward" size={14} flip />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
