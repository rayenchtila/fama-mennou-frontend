export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 cursor-pointer border-0 outline-none'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const variants = {
    primary: {
      style: {
        background: 'linear-gradient(135deg, #7c6cf6, #6c8cf6)',
        color: '#fff',
        boxShadow: '0 4px 14px -3px rgba(124,108,246,0.55)',
      },
    },
    ghost: {
      style: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#a7abc8',
      },
    },
    danger: {
      style: {
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#f87171',
      },
    },
    cyan: {
      style: {
        background: 'linear-gradient(135deg, #0ea5e9, #3ec2e8)',
        color: '#fff',
        boxShadow: '0 4px 14px -3px rgba(62,194,232,0.45)',
      },
    },
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]?.style}
      {...props}
    >
      {children}
    </button>
  )
}
