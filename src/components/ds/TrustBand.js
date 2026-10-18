import Icon from './Icon';

// Reassurance band at the foot of a page (icon cards: three on Freelancers and Clients, two on
// Courses). `items` = [{ icon, title, text }] — each line has
// to describe something FamaMennou really does. An optional `eyebrow` + `heading`
// introduce the cards (the Courses screen opens its band with a question and a title).
export default function TrustBand({ items, eyebrow, heading }) {
  return (
    <section className="mt-6 w-full bg-ds-low py-10 md:py-12" style={{ borderTop: '1px solid rgb(var(--ds-line) / var(--ds-line-soft-a))' }}>
      <div className="ds-wrap">
        {(eyebrow || heading) && (
          <div className="mx-auto mb-7 max-w-2xl text-center md:mb-9">
            {eyebrow && <p className="m-0 mb-2 text-[13px] font-semibold text-ds-accent">{eyebrow}</p>}
            {heading && <h2 className="m-0 text-h-md-m text-ds-ink md:text-h-md">{heading}</h2>}
          </div>
        )}
        {/* Two cards share the row (Courses); the usual three are laid out in thirds. */}
        <div className={`grid gap-3.5 md:gap-6 ${items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {items.map(item => (
            <div key={item.title} className="ds-tonal-up flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-ds-high text-ds-accent">
                <Icon name={item.icon} size={22} />
              </span>
              <div className="min-w-0">
                <h3 className="m-0 mb-1 text-[16px] font-bold text-ds-ink">{item.title}</h3>
                <p className="m-0 text-[13px] leading-[1.5] text-ds-mute">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
