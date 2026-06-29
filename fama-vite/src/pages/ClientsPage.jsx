import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const CATEGORIES = ['Tous','Technology','Design','Marketing','Finance','E-commerce','Education','Santé']

const PROJECTS = [
  {
    client:'TechFlow Inc.',      industry:'Technology',
    title:'Développement d\'une app mobile React Native',
    desc:'Application e-commerce B2C avec paiement intégré, notifications push et dashboard admin.',
    budget:'2500', experience:'3-5 ans', period:'De 1 à 3 mois',
    tags:['React Native','Firebase','Stripe','TypeScript'],
    status:'open',
  },
  {
    client:'CreativeStudio',     industry:'Design',
    title:'Refonte complète d\'identité visuelle',
    desc:'Logo, charte graphique, site vitrine et supports print pour une agence créative en pleine croissance.',
    budget:'1800', experience:'1-2 ans', period:'De 2 à 4 semaines',
    tags:['Figma','Branding','Illustration','Print'],
    status:'open',
  },
  {
    client:'GrowthLab',          industry:'Marketing',
    title:'Stratégie SEO & content marketing Q3 2025',
    desc:'Audit SEO, production de 20 articles optimisés et mise en place d\'un reporting mensuel.',
    budget:'1200', experience:'1-2 ans', period:'De 1 à 3 mois',
    tags:['SEO','WordPress','Analytics','Content'],
    status:'open',
  },
  {
    client:'NovaSaaS',           industry:'Technology',
    title:'Développement back-end API REST Node.js',
    desc:'API scalable avec auth JWT, gestion des rôles, webhooks Stripe et docs Swagger.',
    budget:'3200', experience:'3-5 ans', period:'De 1 à 2 semaines',
    tags:['Node.js','PostgreSQL','Docker','AWS'],
    status:'open',
  },
  {
    client:'BrandVoice',         industry:'Marketing',
    title:'Rédaction de 15 études de cas clients',
    desc:'Interviews clients, structuration narrative et rédaction en français pour site B2B SaaS.',
    budget:'900', experience:'Débutant (0-1 an)', period:'De 1 à 3 mois',
    tags:['Copywriting','B2B','Français'],
    status:'open',
  },
  {
    client:'MedConnect',         industry:'Santé',
    title:'Intégration API santé & tableau de bord médical',
    desc:'Dashboard médical avec intégration API HL7 FHIR, visualisations Chart.js et export PDF.',
    budget:'4000', experience:'5-10 ans', period:'Plus de 3 mois',
    tags:['React','Python','HL7','Chart.js'],
    status:'open',
  },
]

const AVATARS = ['#7c6cf6','#a855f7','#3ec2e8','#6c8cf6','#f59e0b','#10b981']
const ac = s => AVATARS[(s?.charCodeAt(0)??0) % AVATARS.length]
const initials = n => n.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

function ProjectCard({ p }) {
  const color = ac(p.client)
  return (
    <GlassCard className="p-5 flex flex-col gap-3">
      {/* Client */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background:`linear-gradient(135deg, ${color}, rgba(10,8,23,.8))` }}>
          {initials(p.client)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color:'#f4f3fb' }}>{p.client}</span>
            <svg viewBox="0 0 24 24" fill="#3ec2e8" className="w-3.5 h-3.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-[10px]" style={{ color:'#62668a' }}>{p.industry}</p>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold leading-snug" style={{ color:'#f4f3fb' }}>{p.title}</h3>

      {/* Desc */}
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color:'#7e82a0' }}>{p.desc}</p>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-2">
        {[['Budget', p.budget+' TND','#9b8cff'], ['Expérience', p.experience,'#c2c5dd'], ['Durée', p.period,'#c2c5dd']].map(([l,v,c])=>(
          <div key={l}>
            <div className="text-[9px]" style={{ color:'#62668a' }}>{l}</div>
            <div className="text-[10px] font-semibold leading-tight" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {p.tags.map(t => (
          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md"
            style={{ background:'rgba(124,108,246,.1)', border:'1px solid rgba(124,108,246,.2)', color:'#9b8cff' }}>
            {t}
          </span>
        ))}
      </div>

      {/* CTA */}
      <Button size="sm" className="w-full mt-1">💬 Postuler</Button>
    </GlassCard>
  )
}

export default function ClientsPage() {
  const [search,   setSearch]   = useState('')
  const [industry, setIndustry] = useState('Tous')

  const filtered = PROJECTS.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !search || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.tags.some(t=>t.toLowerCase().includes(q))
    const matchI = industry==='Tous' || p.industry.toLowerCase().includes(industry.toLowerCase())
    return matchQ && matchI
  })

  return (
    <div style={{ background:'#0a0817', minHeight:'100vh' }}>
      {/* Header */}
      <div className="pt-24 pb-10 px-4 sm:px-6"
        style={{ background:'radial-gradient(700px 360px at 14% -6%, rgba(62,194,232,.12), transparent 60%), radial-gradient(500px 300px at 90% -2%, rgba(124,108,246,.12), transparent 60%), #0a0817', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:'#3ec2e8' }}>Marketplace · Projets</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color:'#f4f3fb' }}>Projets ouverts</h1>
          <p className="text-sm mb-7" style={{ color:'#7e82a0' }}>Des clients vérifiés cherchent des freelancers pour leurs projets.</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-xl mb-6"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color:'#62668a' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Client, technologie, secteur…"
              className="flex-1 bg-transparent outline-none text-sm" style={{ color:'#f4f3fb' }} />
            {search && <button onClick={()=>setSearch('')} style={{ color:'#62668a' }}>✕</button>}
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            {[{ v: PROJECTS.length, l:'Projets ouverts' }, { v:'2 500 TND', l:'Budget moyen' }].map((s,i)=>(
              <div key={s.l} className="flex items-center gap-4">
                {i>0 && <span className="w-px h-6 bg-white/10" />}
                <div>
                  <div className="text-lg font-extrabold" style={{ color:'#9b8cff' }}>{s.v}</div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={()=>setIndustry(cat)} className={`chip ${industry===cat?'active':''}`}>{cat}</button>
              ))}
            </div>
            <span className="text-[11px] shrink-0 hidden sm:block" style={{ color:'#62668a' }}>{filtered.length} projet{filtered.length!==1?'s':''}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <ProjectCard key={p.title} p={p} />)}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold mb-1" style={{ color:'#a7abc8' }}>Aucun projet trouvé</p>
            <button onClick={()=>setSearch('')} className="text-xs mt-2" style={{ color:'#9b8cff' }}>Effacer la recherche</button>
          </div>
        )}
      </div>
    </div>
  )
}
