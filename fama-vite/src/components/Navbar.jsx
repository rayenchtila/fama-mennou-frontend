import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logoSrc from '../assets/logo.png'

const NAV_LINKS = [
  { label: 'Hire Freelancers', to: '/freelancers' },
  { label: 'Find Clients',     to: '/clients' },
  { label: 'Courses',          to: '/courses' },
]

function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const DEMO_USER = { name: 'Test Locally', email: 'test@famamennou.tn', role: 'freelancer' }

// Chat icon
function IconChat() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

// Bell icon
function IconBell() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

export default function Navbar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [profOpen,    setProfOpen]    = useState(false)
  const [loggedIn,    setLoggedIn]    = useState(true)
  const profRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false); setProfOpen(false) }, [location.pathname])

  useEffect(() => {
    const fn = e => { if (profRef.current && !profRef.current.contains(e.target)) setProfOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const user = loggedIn ? DEMO_USER : null

  const MENU_ITEMS = [
    { label: 'Profile',   to: '/dashboard' },
    { label: 'Projects',  to: '/projects' },
    { label: 'Messages',  to: '/messages' },
    { label: 'Settings',  to: '/settings' },
  ]

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(10,8,23,0.95)' : 'rgba(10,8,23,0.82)',
          backdropFilter: 'blur(18px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src={logoSrc} alt="Fama Mennou" className="h-9 w-auto object-contain" style={{ borderRadius: 8 }} />
              <span className="font-extrabold text-[17px] tracking-tight" style={{ color: '#f4f3fb' }}>
                Fama <span style={{ color: '#9b8cff' }}>Mennou</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {NAV_LINKS.map(link => {
                const active = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ color: active ? '#f4f3fb' : '#a7abc8' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#f4f3fb' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#a7abc8' }}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'rgba(124,108,246,0.12)', zIndex: -1 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2 ml-auto">

              {user ? (
                <>
                  {/* Chat icon */}
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                    style={{ color: '#a7abc8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f4f3fb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#a7abc8'; e.currentTarget.style.background = '' }}
                  >
                    <IconChat />
                  </button>

                  {/* Bell icon */}
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                    style={{ color: '#a7abc8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f4f3fb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#a7abc8'; e.currentTarget.style.background = '' }}
                  >
                    <IconBell />
                  </button>

                  {/* Profile dropdown */}
                  <div className="relative ml-1" ref={profRef}>
                    <button
                      onClick={() => setProfOpen(v => !v)}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-2xl transition-all"
                      style={{ background: profOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c6cf6, #6c8cf6)' }}
                      >
                        {getInitials(user.name)}
                      </div>
                      {/* Name + role */}
                      <div className="hidden sm:block text-left">
                        <p className="text-[13px] font-bold uppercase tracking-wide leading-tight" style={{ color: '#f4f3fb' }}>
                          {user.name}
                        </p>
                        <p className="text-[11px] capitalize leading-tight" style={{ color: '#62668a' }}>{user.role}</p>
                      </div>
                      {/* Chevron */}
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${profOpen ? 'rotate-180' : ''}`}
                        style={{ color: '#62668a' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {profOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: .95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: .95, y: 8 }}
                          transition={{ duration: .14 }}
                          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl z-50"
                          style={{ background: '#16142e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,.7)' }}
                        >
                          <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-sm font-bold truncate uppercase tracking-wide" style={{ color: '#f4f3fb' }}>{user.name}</p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: '#62668a' }}>{user.email}</p>
                            <span
                              className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                              style={{ background: 'rgba(124,108,246,0.1)', border: '1px solid rgba(124,108,246,0.25)', color: '#9b8cff' }}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div className="py-2">
                            {MENU_ITEMS.map(item => (
                              <button
                                key={item.label}
                                onClick={() => { setProfOpen(false); navigate(item.to) }}
                                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                                style={{ color: '#a7abc8' }}
                                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#f4f3fb' }}
                                onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='#a7abc8' }}
                              >
                                {item.label}
                              </button>
                            ))}
                            <button
                              onClick={() => { setLoggedIn(false); setProfOpen(false) }}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors"
                              style={{ color: '#f87171' }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background=''}
                            >
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setLoggedIn(true)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: '#a7abc8' }}
                    onMouseEnter={e => { e.currentTarget.style.color='#f4f3fb' }}
                    onMouseLeave={e => { e.currentTarget.style.color='#a7abc8' }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setLoggedIn(true)}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #7c6cf6, #6c8cf6)', boxShadow: '0 4px 14px -3px rgba(124,108,246,.5)' }}
                  >
                    Signup
                  </button>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-colors ml-1"
                style={{ background: menuOpen ? 'rgba(124,108,246,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="space-y-1.5">
                  <span className={`block w-5 h-0.5 transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: '#a7abc8' }} />
                  <span className={`block w-5 h-0.5 transition-all ${menuOpen ? 'opacity-0' : ''}`} style={{ background: '#a7abc8' }} />
                  <span className={`block w-5 h-0.5 transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: '#a7abc8' }} />
                </div>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto lg:hidden"
            style={{ background: '#0c0a1e' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                <img src={logoSrc} alt="logo" className="h-7 w-auto" style={{ borderRadius: 6 }} />
                <span className="font-extrabold text-base" style={{ color: '#f4f3fb' }}>Fama <span style={{ color: '#9b8cff' }}>Mennou</span></span>
              </Link>
              <button onClick={() => setMenuOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: '#a7abc8' }}>✕</button>
            </div>

            <nav className="flex flex-col px-4 py-4 gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3.5 rounded-xl text-base font-semibold transition-colors"
                  style={{
                    color: location.pathname === link.to ? '#9b8cff' : '#a7abc8',
                    background: location.pathname === link.to ? 'rgba(124,108,246,0.1)' : '',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {user ? (
                <button
                  onClick={() => { setLoggedIn(false); setMenuOpen(false) }}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                >
                  Sign out
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setLoggedIn(true); setMenuOpen(false) }} className="w-full py-3 rounded-xl font-bold text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#a7abc8' }}>Login</button>
                  <button onClick={() => { setLoggedIn(true); setMenuOpen(false) }} className="w-full py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #7c6cf6, #6c8cf6)' }}>Signup</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
