import { useState } from 'react'
import { Link } from 'react-router-dom'
import logoSrc from '../assets/logo.png'

const COLS = [
  { title:'PLATFORM', links:[
    { label:'Hire Freelancers', to:'/freelancers' },
    { label:'Find Clients',     to:'/clients' },
    { label:'Courses',          to:'/courses' },
  ]},
  { title:'COMPANY', links:[
    { label:'About',   to:'#' },
    { label:'Blog',    to:'#' },
    { label:'Careers', to:'#' },
  ]},
  { title:'SUPPORT', links:[
    { label:'Help Center', to:'#' },
    { label:'Privacy',     to:'#' },
    { label:'Terms',       to:'#' },
  ]},
]

function FooterLink({ label, to }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ fontSize:13.5, color: hov ? '#9b8cff' : '#a7abc8', textDecoration:'none', transition:'color .15s' }}
    >{label}</Link>
  )
}

export default function Footer() {
  return (
    <footer style={{ borderTop:'1px solid rgba(255,255,255,.08)', background:'rgba(8,6,18,.5)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'52px 28px 28px', display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1fr', gap:36 }}>

        {/* Brand */}
        <div style={{ minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:13 }}>
            <img src={logoSrc} alt="Fama Mennou" style={{ height:30, width:'auto', objectFit:'contain', borderRadius:6 }} />
            <span style={{ fontWeight:700, fontSize:16, color:'#fbfbff' }}>Fama<span style={{ color:'#9b8cff' }}>&nbsp;Mennou</span></span>
          </div>
          <p style={{ fontSize:13.5, color:'#7e82a0', lineHeight:1.6, maxWidth:250, margin:0 }}>
            The all-in-one platform connecting freelancers, clients and learners in Tunisia.
          </p>
        </div>

        {/* Link columns */}
        {COLS.map(col => (
          <div key={col.title}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.08em', color:'#62668a', marginBottom:13 }}>{col.title}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {col.links.map(link => <FooterLink key={link.label} {...link} />)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'18px 28px 38px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:13, color:'#62668a' }}>
        © 2026 Fama Mennou. All rights reserved.
      </div>
    </footer>
  )
}
