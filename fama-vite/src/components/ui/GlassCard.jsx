import { useState } from 'react'

export default function GlassCard({ children, className = '', hover = true, style = {}, onClick }) {
  const [hovered, setHovered] = useState(false)

  const base = {
    background: hovered && hover ? 'rgba(124,108,246,0.04)' : 'rgba(255,255,255,0.025)',
    border: `1px solid ${hovered && hover ? 'rgba(124,108,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 16,
    transition: 'all .2s',
    ...style,
  }

  return (
    <div
      className={className}
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
