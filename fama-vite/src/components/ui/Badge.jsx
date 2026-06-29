const PRESETS = {
  purple:  { bg: 'rgba(124,108,246,0.12)', border: 'rgba(124,108,246,0.3)',  color: '#9b8cff' },
  cyan:    { bg: 'rgba(62,194,232,0.12)',  border: 'rgba(62,194,232,0.3)',   color: '#3ec2e8' },
  green:   { bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)', color: '#10b981' },
  amber:   { bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
  red:     { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',  color: '#f87171' },
  muted:   { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#a7abc8' },
}

export default function Badge({ children, color = 'purple', className = '' }) {
  const s = PRESETS[color] || PRESETS.purple
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {children}
    </span>
  )
}
