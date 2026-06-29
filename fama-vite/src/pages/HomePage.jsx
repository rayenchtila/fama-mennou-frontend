import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// ── Data ─────────────────────────────────────────────────────────────────────

const TINTS = [
  { avBg: 'rgba(124,108,246,.22)', avFg: '#c7baff' },
  { avBg: 'rgba(168,85,247,.22)',  avFg: '#e2bcff' },
  { avBg: 'rgba(79,110,247,.22)',  avFg: '#b7c6ff' },
]
const t = i => TINTS[i % TINTS.length]

const FREELANCERS = [
  { initials:'YK', name:'Yassine Khelifi', role:'Full-Stack Developer', rating:'4.9', responds:'1h', rate:'45', skills:['React','Node.js','TypeScript'], ...t(0) },
  { initials:'IB', name:'Imen Bouazizi',   role:'Product & UI/UX Designer', rating:'5.0', responds:'2h', rate:'40', skills:['Figma','Design System','Prototyping'], ...t(1) },
  { initials:'MT', name:'Mehdi Trabelsi',  role:'SEO & Growth Marketer',    rating:'4.7', responds:'3h', rate:'35', skills:['SEO','Google Ads','Analytics'], ...t(2) },
]

const PROJECTS = [
  { initials:'NT', client:'NovaTech Solutions', title:'Full e-commerce platform rebuild',       budget:'4,500 TND', tags:['React','Stripe','UX'],            proposals:12, ...t(0) },
  { initials:'AM', client:'Atelier Médina',     title:'Brand identity & visual guidelines',     budget:'1,800 TND', tags:['Branding','Logo','Print'],         proposals:8,  ...t(1) },
  { initials:'BF', client:'Baraka Foods',       title:'Social media management & campaigns',    budget:'900 TND/mo',tags:['Social Media','Ads','Content'],    proposals:5,  ...t(2) },
]

const COURSES = [
  { title:'React from Zero to Expert',       instructor:'Yassine Khelifi', rating:'4.9', students:'1,240', price:'89 TND',  cat:'Development', cover:'linear-gradient(135deg,#7c6cf6,#3ec2e8)' },
  { title:'UI/UX Design Masterclass',        instructor:'Imen Bouazizi',   rating:'5.0', students:'860',   price:'75 TND',  cat:'Design',       cover:'linear-gradient(135deg,#a855f7,#6c8cf6)' },
  { title:'SEO & Growth Marketing',          instructor:'Mehdi Trabelsi',  rating:'4.7', students:'540',   price:'60 TND',  cat:'Marketing',    cover:'linear-gradient(135deg,#5b5ce0,#3ec2e8)' },
  { title:'Motion Design with After Effects',instructor:'Salma Gharbi',    rating:'4.8', students:'410',   price:'70 TND',  cat:'Video',        cover:'linear-gradient(135deg,#7c6cf6,#a855f7)' },
]

const TESTIMONIALS = [
  { quote:'"Found a developer in two days and shipped on time. The whole process was effortless."', name:'Sarra Ben Amor', title:'Founder, NovaTech',     initials:'SB', ...t(0) },
  { quote:'"As a freelancer, Fama Mennou keeps my pipeline full with serious, verified clients."',  name:'Mehdi Trabelsi', title:'Full-Stack Developer',  initials:'MT', ...t(1) },
  { quote:'"The courses paid for themselves. I landed my first contract a month later."',            name:'Anis Mansour',   title:'Designer',              initials:'AM', ...t(2) },
]

const FAQS = [
  { q:'How does Fama Mennou work?',                   a:'Create a free account, choose whether you want to hire, freelance, or learn, then start browsing. Clients post projects and hire verified freelancers; freelancers apply to projects and offer services; everyone can take courses.' },
  { q:'Is it free to join?',                          a:'Yes. Creating an account, browsing freelancers, and posting a project are all free. We only charge a small service fee on completed paid contracts.' },
  { q:'How are payments protected?',                  a:'All contract payments are held securely in escrow and only released to the freelancer once you approve the delivered work, so your money is protected from start to finish.' },
  { q:'How do you verify freelancers?',               a:'Every freelancer goes through ID verification and a skills review before earning the verified badge, so you can hire with confidence.' },
  { q:'Can I both hire and freelance from one account?',a:'Absolutely. You can switch between client mode and freelancer mode anytime from your account settings.' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconBriefcase = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>
  </svg>
)
const IconBook = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)
const IconSearch = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7e82a0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{flex:'none'}}>
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#9b8cff" stroke="none">
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/>
  </svg>
)
const IconStar = ({ size = 14, color = '#9b8cff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.1 20.3l1.7-6.6L2.6 8.8l6.8-.5z"/>
  </svg>
)
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7e82a0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const IconUserSingle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
)

// ── Section components ────────────────────────────────────────────────────────

function HeroSection({ tab, setTab, query, setQuery, onSearch, navigate }) {
  const TYPES = ['Freelancers','Services','Courses']
  const placeholders = { Freelancers:'Search freelancers, skills…', Services:'Search services…', Courses:'Search courses…' }

  return (
    <section style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ position:'relative', maxWidth:880, margin:'0 auto', padding:'80px 28px 64px', textAlign:'center' }}>

        {/* Badge */}
        <motion.span
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 13px', borderRadius:999, background:'rgba(124,108,246,.12)', border:'1px solid rgba(124,108,246,.3)', fontSize:12.5, fontWeight:600, color:'#b9aeff', marginBottom:24 }}
        >
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#9b8cff', boxShadow:'0 0 8px #9b8cff' }} />
          All-in-one freelance ecosystem in Tunisia
        </motion.span>

        {/* Heading */}
        <motion.h1
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 }}
          style={{ fontWeight:800, fontSize:'clamp(34px,5.4vw,56px)', lineHeight:1.06, letterSpacing:'-.03em', margin:'0 0 18px', color:'#fbfbff' }}
        >
          Hire Talent. Find Clients.<br />
          <span style={{ background:'linear-gradient(110deg,#9b8cff,#6c8cf6 60%,#3ec2e8)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>
            Learn Skills.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
          style={{ fontSize:'clamp(16px,2vw,19px)', color:'#a7abc8', maxWidth:520, margin:'0 auto 34px', lineHeight:1.55 }}
        >
          One platform to hire verified freelancers, win projects, and grow your skills.
        </motion.p>

        {/* Search area */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
          style={{ maxWidth:640, margin:'0 auto' }}
        >
          {/* Type pills */}
          <div style={{ display:'flex', gap:5, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:13, padding:5, marginBottom:12, maxWidth:340, marginLeft:'auto', marginRight:'auto' }}>
            {TYPES.map(type => (
              <button key={type} onClick={() => setTab(type)}
                style={{ flex:1, padding:'8px 14px', borderRadius:9, fontSize:13.5, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', transition:'background .15s,color .15s',
                  background: tab===type ? '#7c6cf6' : 'transparent',
                  color: tab===type ? '#fff' : '#a7abc8',
                }}
              >{type}</button>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={e => { e.preventDefault(); onSearch(tab, query) }}
            style={{ display:'flex', alignItems:'center', gap:10, background:'#15122c', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'7px 7px 7px 16px', boxShadow:'0 18px 44px -18px rgba(0,0,0,.7)' }}
          >
            <IconSearch />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={placeholders[tab]}
              style={{ flex:1, minWidth:0, background:'none', border:'none', outline:'none', color:'#f4f3fb', fontFamily:'inherit', fontSize:15 }}
            />
            <button type="submit"
              style={{ padding:'11px 22px', borderRadius:10, background:'#7c6cf6', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14.5, flex:'none', boxShadow:'0 6px 16px -5px rgba(124,108,246,.7)' }}
              onMouseEnter={e => e.currentTarget.style.background='#6a5cf0'}
              onMouseLeave={e => e.currentTarget.style.background='#7c6cf6'}
            >Search</button>
          </form>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
          style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:26 }}
        >
          <button onClick={() => navigate('/freelancers')}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:11, background:'#7c6cf6', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14.5, boxShadow:'0 8px 22px -8px rgba(124,108,246,.7)' }}
            onMouseEnter={e => e.currentTarget.style.background='#6a5cf0'}
            onMouseLeave={e => e.currentTarget.style.background='#7c6cf6'}
          >
            <IconUserSingle />Hire Freelancers
          </button>
          <button onClick={() => navigate('/clients')}
            style={{ padding:'12px 22px', borderRadius:11, background:'rgba(255,255,255,.06)', color:'#e7e8f4', border:'1px solid rgba(255,255,255,.16)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:14.5 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#7c6cf6'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.16)'; e.currentTarget.style.color='#e7e8f4' }}
          >Find Clients</button>
          <button onClick={() => navigate('/courses')}
            style={{ padding:'12px 22px', borderRadius:11, background:'rgba(255,255,255,.06)', color:'#e7e8f4', border:'1px solid rgba(255,255,255,.16)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:14.5 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#7c6cf6'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.16)'; e.currentTarget.style.color='#e7e8f4' }}
          >Learn Skills</button>
        </motion.div>
      </div>
    </section>
  )
}

function ActionCardsSection({ navigate }) {
  const CARDS = [
    { icon:<IconUsers />, title:'Hire Freelancers', desc:'Browse verified talent by skill and region.', link:'Browse talent', to:'/freelancers' },
    { icon:<IconBriefcase />, title:'Get Clients', desc:'Find open projects and win contracts.',       link:'View projects',  to:'/clients' },
    { icon:<IconBook />,  title:'Learn Skills',     desc:'Take courses from expert freelancers.',      link:'Explore courses',to:'/courses' },
  ]
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'16px 28px 0' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
        {CARDS.map((c, i) => (
          <ActionCard key={i} card={c} navigate={navigate} />
        ))}
      </div>
    </section>
  )
}

function ActionCard({ card, navigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => navigate(card.to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ textAlign:'left', background:'#16142e', border:`1px solid ${hov?'rgba(124,108,246,.5)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:26, cursor:'pointer', fontFamily:'inherit', transition:'box-shadow .18s,transform .18s,border-color .18s', display:'flex', flexDirection:'column', gap:14, boxShadow: hov?'0 18px 40px -16px rgba(0,0,0,.6)':'none', transform: hov?'translateY(-3px)':'none' }}
    >
      <span style={{ width:48, height:48, borderRadius:13, background:'rgba(124,108,246,.16)', border:'1px solid rgba(124,108,246,.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#b9aeff' }}>
        {card.icon}
      </span>
      <div>
        <div style={{ fontWeight:700, fontSize:18, color:'#fbfbff', marginBottom:5 }}>{card.title}</div>
        <div style={{ fontSize:14, color:'#a7abc8', lineHeight:1.5 }}>{card.desc}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13.5, fontWeight:600, color:'#b9aeff', marginTop:'auto' }}>
        {card.link} <IconChevronRight />
      </div>
    </button>
  )
}

function HowItWorksSection() {
  const STEPS = [
    { n:'1', title:'Create your account', desc:'Sign up in minutes with quick ID verification.' },
    { n:'2', title:'Choose your role',    desc:'Join as a freelancer, a client, or a learner.' },
    { n:'3', title:'Start',              desc:'Hire talent, win projects, or learn new skills.' },
  ]
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 0' }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <h2 style={{ fontWeight:800, fontSize:'clamp(24px,3.4vw,32px)', letterSpacing:'-.025em', margin:'0 0 8px', color:'#fbfbff' }}>How it works ?</h2>
        <p style={{ fontSize:16, color:'#a7abc8', margin:0 }}>Three steps to get started.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:22 }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ textAlign:'center', padding:8 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:'#7c6cf6', color:'#fff', fontWeight:700, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 18px -6px rgba(124,108,246,.7)' }}>{s.n}</div>
            <div style={{ fontWeight:700, fontSize:17, color:'#fbfbff', marginBottom:6 }}>{s.title}</div>
            <div style={{ fontSize:14, color:'#a7abc8', lineHeight:1.55, maxWidth:280, margin:'0 auto' }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FreelancerCard({ f }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'#16142e', border:`1px solid ${hov?'rgba(124,108,246,.5)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:22, transition:'box-shadow .18s,border-color .18s', boxShadow: hov?'0 18px 40px -16px rgba(0,0,0,.6)':'none' }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:16 }}>
        <span style={{ width:50, height:50, borderRadius:'50%', background:f.avBg, color:f.avFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, flex:'none' }}>{f.initials}</span>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontWeight:700, fontSize:15.5, color:'#fbfbff' }}>{f.name}</span>
            <IconShield />
          </div>
          <div style={{ fontSize:13, color:'#a7abc8', marginTop:2 }}>{f.role}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13.5, flex:'none' }}>
          <IconStar /><span style={{ fontWeight:700, color:'#fbfbff' }}>{f.rating}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
        {f.skills.map(s => (
          <span key={s} style={{ fontSize:12, color:'#c2c5dd', background:'rgba(255,255,255,.06)', borderRadius:7, padding:'3px 9px', fontWeight:500 }}>{s}</span>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:15, borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div style={{ fontSize:13, color:'#7e82a0', display:'inline-flex', alignItems:'center', gap:5 }}>
          <IconClock />Responds in {f.responds}
        </div>
        <div style={{ fontSize:14, color:'#fbfbff' }}>
          <strong style={{ fontWeight:700 }}>{f.rate} TND</strong><span style={{ color:'#7e82a0', fontWeight:500 }}>/h</span>
        </div>
      </div>
    </div>
  )
}

function FeaturedFreelancersSection({ navigate }) {
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 0' }}>
      <SectionHeader title="Featured freelancers" sub="Top-rated talent, ready to start." btnLabel="View all" onClick={() => navigate('/freelancers')} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:18 }}>
        {FREELANCERS.map(f => <FreelancerCard key={f.name} f={f} />)}
      </div>
    </section>
  )
}

function ProjectCard({ p }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'#16142e', border:`1px solid ${hov?'rgba(124,108,246,.5)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:22, transition:'box-shadow .18s,border-color .18s', display:'flex', flexDirection:'column', gap:13, boxShadow: hov?'0 18px 40px -16px rgba(0,0,0,.6)':'none' }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ width:34, height:34, borderRadius:9, background:p.avBg, color:p.avFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flex:'none' }}>{p.initials}</span>
        <span style={{ fontSize:13.5, fontWeight:600, color:'#c2c5dd' }}>{p.client}</span>
        <IconShield />
      </div>
      <div style={{ fontWeight:700, fontSize:17, color:'#fbfbff', letterSpacing:'-.01em', lineHeight:1.3 }}>{p.title}</div>
      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:15, fontWeight:700, color:'#fbfbff' }}>{p.budget}</span>
        <span style={{ fontSize:13, color:'#7e82a0' }}>{p.proposals} proposals</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {p.tags.map(tag => (
          <span key={tag} style={{ fontSize:12, color:'#c2c5dd', background:'rgba(255,255,255,.06)', borderRadius:7, padding:'3px 9px', fontWeight:500 }}>{tag}</span>
        ))}
      </div>
      <button
        style={{ marginTop:'auto', padding:'9px 0', borderRadius:10, background:'rgba(124,108,246,.12)', border:'1px solid rgba(124,108,246,.3)', color:'#b9aeff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13.5, width:'100%' }}
        onMouseEnter={e => { e.currentTarget.style.background='#7c6cf6'; e.currentTarget.style.color='#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(124,108,246,.12)'; e.currentTarget.style.color='#b9aeff' }}
      >Apply</button>
    </div>
  )
}

function TrendingProjectsSection({ navigate }) {
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 0' }}>
      <SectionHeader title="Trending projects" sub="Fresh opportunities from verified clients." btnLabel="View all" onClick={() => navigate('/clients')} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(330px,1fr))', gap:18 }}>
        {PROJECTS.map(p => <ProjectCard key={p.title} p={p} />)}
      </div>
    </section>
  )
}

function CourseCard({ c }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'#16142e', border:`1px solid ${hov?'rgba(124,108,246,.5)':'rgba(255,255,255,.08)'}`, borderRadius:16, overflow:'hidden', transition:'box-shadow .18s,border-color .18s', cursor:'pointer', boxShadow: hov?'0 18px 40px -16px rgba(0,0,0,.6)':'none' }}
    >
      <div style={{ height:120, background:c.cover, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <span style={{ position:'absolute', top:11, left:11, fontSize:11, fontWeight:600, color:'#fff', background:'rgba(0,0,0,.28)', padding:'3px 9px', borderRadius:6 }}>{c.cat}</span>
        <IconBook />
      </div>
      <div style={{ padding:'16px 17px 18px' }}>
        <div style={{ fontWeight:700, fontSize:15, color:'#fbfbff', lineHeight:1.35, marginBottom:7, minHeight:40 }}>{c.title}</div>
        <div style={{ fontSize:13, color:'#a7abc8', marginBottom:12 }}>{c.instructor}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#a7abc8' }}>
            <IconStar /><strong style={{ color:'#fbfbff' }}>{c.rating}</strong> · {c.students}
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fbfbff', whiteSpace:'nowrap' }}>{c.price}</div>
        </div>
      </div>
    </div>
  )
}

function CoursesSection({ navigate }) {
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 0' }}>
      <SectionHeader title="Learn from experts" sub="Courses taught by top freelancers." btnLabel="View all" onClick={() => navigate('/courses')} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:18 }}>
        {COURSES.map(c => <CourseCard key={c.title} c={c} />)}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 0' }}>
      <div style={{ textAlign:'center', marginBottom:34 }}>
        <h2 style={{ fontWeight:800, fontSize:'clamp(22px,3.2vw,29px)', letterSpacing:'-.025em', margin:'0 0 8px', color:'#fbfbff' }}>Loved by the community</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
        {TESTIMONIALS.map(t => (
          <div key={t.name} style={{ background:'#16142e', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:24, display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', gap:2 }}>
              {[0,1,2,3,4].map(i => <IconStar key={i} size={15} />)}
            </div>
            <p style={{ margin:0, fontSize:15, color:'#dcdef0', lineHeight:1.6 }}>{t.quote}</p>
            <div style={{ display:'flex', alignItems:'center', gap:11, marginTop:'auto' }}>
              <span style={{ width:38, height:38, borderRadius:'50%', background:t.avBg, color:t.avFg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flex:'none' }}>{t.initials}</span>
              <div>
                <div style={{ fontSize:13.5, fontWeight:700, color:'#fbfbff' }}>{t.name}</div>
                <div style={{ fontSize:12.5, color:'#7e82a0' }}>{t.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(0)
  return (
    <section style={{ maxWidth:760, margin:'0 auto', padding:'72px 28px 0' }}>
      <div style={{ textAlign:'center', marginBottom:34 }}>
        <h2 style={{ fontWeight:800, fontSize:'clamp(22px,3.2vw,29px)', letterSpacing:'-.025em', margin:'0 0 8px', color:'#fbfbff' }}>Frequently asked questions</h2>
        <p style={{ fontSize:15, color:'#a7abc8', margin:0 }}>Everything you need to know to get started.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background:'#16142e', border:`1px solid ${open===i?'rgba(124,108,246,.4)':'rgba(255,255,255,.08)'}`, borderRadius:14, overflow:'hidden', transition:'border-color .18s' }}>
            <button onClick={() => setOpen(open===i ? -1 : i)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, textAlign:'left', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:'18px 20px' }}
            >
              <span style={{ fontWeight:700, fontSize:15.5, color:'#fbfbff' }}>{faq.q}</span>
              <span style={{ width:26, height:26, borderRadius:8, background:'rgba(124,108,246,.16)', border:'1px solid rgba(124,108,246,.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#b9aeff', flex:'none', transform: open===i?'rotate(180deg)':'none', transition:'transform .2s' }}>
                <IconChevronDown />
              </span>
            </button>
            {open===i && (
              <div style={{ padding:'0 20px 19px', fontSize:14.5, color:'#a7abc8', lineHeight:1.6 }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function CTASection({ navigate }) {
  return (
    <section style={{ maxWidth:1140, margin:'0 auto', padding:'72px 28px 80px' }}>
      <div style={{ position:'relative', overflow:'hidden', borderRadius:24, background:'linear-gradient(135deg,#6c5cf6 0%,#7d5cf0 45%,#3a8ce0 100%)', padding:'clamp(36px,5vw,60px)', textAlign:'center', boxShadow:'0 28px 64px -26px rgba(108,92,246,.8)' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(440px 240px at 12% 0%,rgba(255,255,255,.2),transparent 70%),radial-gradient(420px 240px at 90% 100%,rgba(255,255,255,.12),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative' }}>
          <h2 style={{ fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.025em', margin:'0 0 12px', color:'#fff' }}>Ready to get started?</h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,.88)', maxWidth:460, margin:'0 auto 30px' }}>Join thousands of freelancers and clients across Tunisia.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/freelancers')}
              style={{ padding:'13px 26px', borderRadius:12, background:'#fff', color:'#6a5cf0', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:15, boxShadow:'0 8px 20px -8px rgba(0,0,0,.4)' }}
              onMouseEnter={e => e.currentTarget.style.background='#f1eeff'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}
            >Join as Freelancer</button>
            <button onClick={() => navigate('/clients')}
              style={{ padding:'13px 26px', borderRadius:12, background:'rgba(255,255,255,.16)', color:'#fff', border:'1px solid rgba(255,255,255,.45)', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:15 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.26)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.16)'}
            >Hire Talent</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Shared section header
function SectionHeader({ title, sub, btnLabel, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, marginBottom:26 }}>
      <div>
        <h2 style={{ fontWeight:800, fontSize:'clamp(22px,3.2vw,29px)', letterSpacing:'-.025em', margin:'0 0 6px', color:'#fbfbff' }}>{title}</h2>
        <p style={{ fontSize:15, color:'#a7abc8', margin:0 }}>{sub}</p>
      </div>
      <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.05)', border:`1px solid ${hov?'#7c6cf6':'rgba(255,255,255,.14)'}`, color: hov?'#fff':'#c2c5dd', borderRadius:10, padding:'9px 15px', fontFamily:'inherit', fontSize:13.5, fontWeight:600, cursor:'pointer', flex:'none', transition:'border-color .15s,color .15s' }}
      >
        {btnLabel} <IconChevronRight />
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [tab,   setTab]   = useState('Freelancers')
  const [query, setQuery] = useState('')

  function handleSearch(tab, q) {
    const routes = { Freelancers:'/freelancers', Services:'/freelancers', Courses:'/courses' }
    navigate(`${routes[tab]}${q.trim()?`?q=${encodeURIComponent(q)}`:''}`)
  }

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(960px 540px at 14% -6%,rgba(124,108,246,.22),transparent 60%),radial-gradient(860px 540px at 96% -2%,rgba(58,140,224,.16),transparent 60%),linear-gradient(180deg,#100d28 0%,#0a0817 58%)', color:'#f4f3fb', fontFamily:"'Plus Jakarta Sans',-apple-system,sans-serif", overflowX:'hidden' }}>
      <HeroSection tab={tab} setTab={setTab} query={query} setQuery={setQuery} onSearch={handleSearch} navigate={navigate} />
      <ActionCardsSection navigate={navigate} />
      <HowItWorksSection />
      <FeaturedFreelancersSection navigate={navigate} />
      <TrendingProjectsSection navigate={navigate} />
      <CoursesSection navigate={navigate} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection navigate={navigate} />
    </div>
  )
}
