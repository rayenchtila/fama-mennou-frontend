import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import StarRating from '../components/ui/StarRating'

const CATEGORIES = ['All','Design','Development','Marketing','Business','Music','Photography','Finance','Health','Other']

const COURSE_COLORS = { Design:'#a855f7', Development:'#6c8cf6', Marketing:'#3ec2e8', Business:'#f59e0b', Music:'#10b981', Photography:'#f97316', Finance:'#06b6d4', Health:'#84cc16', Other:'#7c6cf6' }
const COURSE_ICONS  = { Design:'🎨', Development:'💻', Marketing:'📣', Business:'💼', Music:'🎵', Photography:'📷', Finance:'💰', Health:'🏥', Other:'✨' }

const COURSES = [
  { id:1,  title:'Advanced React Patterns & Architecture',    instructor:'Youssef Khalil',   cat:'Development', rating:4.8, students:320, lessons:24, price:0,   desc:'Hooks avancés, Context, Zustand, Performance Optimization.' },
  { id:2,  title:'Brand Identity Design from Scratch',        instructor:'Amira Bensalem',   cat:'Design',       rating:4.9, students:210, lessons:18, price:49,  desc:'Logo, typographie, palette, brand guide complet sur Figma.' },
  { id:3,  title:'SEO Mastery 2025',                         instructor:'Sofia Trabelsi',   cat:'Marketing',    rating:4.7, students:180, lessons:20, price:39,  desc:'Référencement technique, création de contenu, link building.' },
  { id:4,  title:'Freelance Business Kit',                    instructor:'Mehdi Toumi',      cat:'Business',     rating:4.6, students:145, lessons:14, price:29,  desc:'Trouver des clients, fixer ses tarifs, gérer sa comptabilité.' },
  { id:5,  title:'Motion Design avec After Effects',         instructor:'Karim Dridi',      cat:'Design',       rating:4.8, students:95,  lessons:22, price:59,  desc:'Animation 2D, Lottie, motion graphics pour le web et mobile.' },
  { id:6,  title:'Full-Stack Node.js & PostgreSQL',          instructor:'Youssef Khalil',   cat:'Development', rating:4.7, students:260, lessons:30, price:0,   desc:'API REST, auth JWT, ORM Prisma, déploiement Railway.' },
  { id:7,  title:'Photography pour Réseaux Sociaux',         instructor:'Rania Mansour',    cat:'Photography',  rating:4.5, students:88,  lessons:12, price:25,  desc:'Composition, lumière naturelle, retouche Lightroom mobile.' },
  { id:8,  title:'Gestion Financière Freelance',             instructor:'Sonia Gharbi',     cat:'Finance',      rating:4.6, students:112, lessons:10, price:35,  desc:'Budget, TVA, facturation, épargne pour indépendants.' },
]

function CourseCard({ c, onClick }) {
  const col   = COURSE_COLORS[c.cat] || '#7c6cf6'
  const icon  = COURSE_ICONS[c.cat]  || '📚'
  const isFree = c.price === 0
  return (
    <GlassCard className="overflow-hidden cursor-pointer flex flex-col" onClick={onClick}>
      {/* Cover */}
      <div className="aspect-video flex items-center justify-center text-4xl"
        style={{ background:`linear-gradient(135deg, ${col}22, rgba(10,8,23,.9))` }}>
        {icon}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md self-start"
          style={{ background:`${col}20`, border:`1px solid ${col}40`, color:col }}>
          {c.cat}
        </span>
        <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color:'#f4f3fb' }}>{c.title}</h3>
        <p className="text-[11px] line-clamp-2 flex-1" style={{ color:'#7e82a0' }}>{c.desc}</p>
        <p className="text-[10px]" style={{ color:'#7e82a0' }}>Par {c.instructor}</p>
        <div className="flex items-center gap-1.5">
          <StarRating value={c.rating} />
          <span className="text-[10px] font-bold" style={{ color:'#fbbf24' }}>{c.rating}</span>
          <span className="text-[10px]" style={{ color:'#62668a' }}>({c.students})</span>
        </div>
        <div className="flex items-center justify-between pt-1" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {isFree
            ? <span className="text-base font-extrabold" style={{ color:'#10b981' }}>Gratuit</span>
            : <span className="text-base font-extrabold" style={{ color:'#9b8cff' }}>{c.price} TND</span>
          }
          <span className="text-[10px]" style={{ color:'#62668a' }}>{c.lessons} leçons</span>
        </div>
      </div>
    </GlassCard>
  )
}

export default function CoursesPage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [price,    setPrice]    = useState('all')

  const filtered = COURSES.filter(c => {
    const q = search.toLowerCase()
    const matchQ    = !search || c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q)
    const matchCat  = category==='All' || c.cat === category
    const matchPrice= price==='all' || (price==='free' && c.price===0) || (price==='paid' && c.price>0)
    return matchQ && matchCat && matchPrice
  })

  const free = filtered.filter(c => c.price===0)
  const paid = filtered.filter(c => c.price>0)

  return (
    <div style={{ background:'#0a0817', minHeight:'100vh' }}>
      {/* Header */}
      <div className="pt-24 pb-12 px-4 sm:px-6"
        style={{ background:'radial-gradient(700px 360px at 14% -6%, rgba(124,108,246,.14), transparent 60%), radial-gradient(500px 300px at 90% -2%, rgba(62,194,232,.12), transparent 60%), #0a0817', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background:'rgba(124,108,246,.1)', border:'1px solid rgba(124,108,246,.25)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#7c6cf6' }} />
            <span className="text-xs font-semibold" style={{ color:'#9b8cff' }}>{COURSES.length} cours disponibles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight" style={{ color:'#f4f3fb' }}>
            Parcourez les cours{' '}
            <span className="gradient-text">professionnels</span>
          </h1>
          <p className="text-sm mb-8" style={{ color:'#7e82a0' }}>Enseignés par des freelancers experts. Apprenez à votre rythme.</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-lg mx-auto mb-7"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color:'#62668a' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher des cours…"
              className="flex-1 bg-transparent outline-none text-sm" style={{ color:'#f4f3fb' }} />
            {search && <button onClick={()=>setSearch('')} style={{ color:'#62668a' }}>✕</button>}
          </div>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[{ v: COURSES.length, l:'Cours' }, { v: CATEGORIES.length-1, l:'Catégories' }, { v: new Set(COURSES.map(c=>c.instructor)).size, l:'Instructeurs' }].map((s,i)=>(
              <div key={s.l} className="flex items-center gap-4">
                {i>0 && <span className="hidden sm:block w-px h-6 bg-white/10" />}
                <div className="text-center">
                  <div className="text-xl font-extrabold" style={{ color:'#9b8cff' }}>{s.v}</div>
                  <div className="text-[10px]" style={{ color:'#7e82a0' }}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-20 backdrop-blur-md"
        style={{ background:'rgba(10,8,23,0.92)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)} className={`chip ${category===cat?'active':''}`}>
                {COURSE_ICONS[cat] || '🌐'} {cat==='All'?'Tous':cat}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pb-3 gap-3">
            <span className="text-[11px]" style={{ color:'#62668a' }}>{filtered.length} cours</span>
            <div className="flex gap-1.5">
              {[['all','Tous'],['free','Gratuit'],['paid','Payant']].map(([v,l])=>(
                <button key={v} onClick={()=>setPrice(v)} className={`chip ${price===v?'active':''}`} style={{ fontSize:10 }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Free */}
        {free.length > 0 && price !== 'paid' && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <span>🎁</span>
              <h2 className="text-sm font-extrabold" style={{ color:'#f4f3fb' }}>Cours gratuits</h2>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', color:'#10b981' }}>{free.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {free.map(c => <CourseCard key={c.id} c={c} onClick={()=>{}} />)}
            </div>
          </section>
        )}
        {/* Paid */}
        {paid.length > 0 && price !== 'free' && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-sm font-extrabold" style={{ color:'#f4f3fb' }}>Cours payants</h2>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', color:'#fbbf24' }}>{paid.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paid.map(c => <CourseCard key={c.id} c={c} onClick={()=>{}} />)}
            </div>
          </section>
        )}
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold mb-1" style={{ color:'#a7abc8' }}>Aucun cours trouvé</p>
            <button onClick={()=>setSearch('')} className="text-xs mt-2" style={{ color:'#9b8cff' }}>Effacer la recherche</button>
          </div>
        )}
      </div>
    </div>
  )
}
