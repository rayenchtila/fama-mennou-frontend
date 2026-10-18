// Material Symbols Outlined glyph (font loaded in public/index.html). Decorative
// by default — pass `label` when the icon is the only thing naming a control.
// `flip` mirrors directional icons (arrows, chevrons) in right-to-left layouts.
export default function Icon({ name, size = 18, fill = false, flip = false, label, className = '', style }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${flip ? 'rtl:-scale-x-100' : ''} ${className}`}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      role={label ? 'img' : undefined}
      style={{ fontSize: size, lineHeight: 1, fontVariationSettings: fill ? "'FILL' 1" : undefined, ...style }}
    >
      {name}
    </span>
  );
}
