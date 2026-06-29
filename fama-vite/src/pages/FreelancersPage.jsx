import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import StarRating from '../components/ui/StarRating'
import Button from '../components/ui/Button'

const CATEGORIES = ['Tous','Design','Développement','Marketing','Rédaction','Vidéo','Finance','Autre']

const FREELANCERS = [
  { name:'Amira Bensalem',   role:'Brand Designer',        bio:'Spécialisée en identité visuelle et Figma. Passion pour les marques qui racontent des histoires.',    region:'Tunis',  rating:4.9, reviews:47, rate:'85', tags:['Branding','Figma','Illustration','UI/UX'], available:true  },
  { name:'Youssef Khalil',   role:'Full-Stack Developer',  bio:'Expert React & Node.js, 6 ans d\'expérience. Développement de SaaS, dashboards et APIs REST.',        region:'Sfax',   rating:4.8, reviews:62, rate:'95', tags:['React','Node.js','MongoDB','TypeScript'],  available:true  },
  { name:'Sofia Trabelsi',   role:'SEO & Content',         bio:'Référencement naturel et stratégie de contenu pour e-commerce et startups tunisiennes.',              region:'Sousse', rating:4.7, reviews:38, rate:'70', tags:['SEO','WordPress','Copywriting','Analytics'],available:false },
  { name:'Karim Dridi',      role:'Motion Designer',       bio:'Animation 2D/3D, montage vidéo, After Effects. Livraison rapide et révisions illimitées.',           region:'Tunis',  rating:4.8, reviews:29, rate:'80', tags:['After Effects','Lottie','Premiere','C4D'],  available:true  },
  { name:'Mehdi Toumi',      role:'Mobile Developer',      bio:'Développement React Native & Flutter. Applications publiées sur App Store et Google Play.',          region:'Bizerte',rating:4.6, reviews:21, rate:'90', tags:['React Native','Flutter','Firebase','iOS'],  available:true  },
  { name:'Rania Mansour',    role:'Graphic Designer',      bio:'Design print et digital, logo, packaging, supports marketing. 5 ans d\'expérience agency.',           region:'Nabeul', rating:4.5, reviews:33, rate:'60', tags:['Illustrator','Photoshop','Packaging','Logo'],available:true  },
]

const AVATARS = ['#7c6cf6','#a855f7','#3ec2e8','#6c8cf6','#f59e0b','#10b981']
const ac = s => AVATARS[(s?.charCodeAt(0)??0) % AVATARS.length]
const initials = n => n.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()

function FreelancerCard({ f }) {
  const color = ac(f.name)
  return (
    <GlassCard className="p-5">
      <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
          style={{ background:`linear-gradient(135deg, ${color}, rgba(10,8,23,.7))`, fontSize:15 }}>
          {initials(f.name)}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-extrabold" style={{ color:'#f4f3fb' }}>{f.name}</span>
            <Badge color="cyan">✓ Vérifié</Badge>
            {!f.available && <Badge color="amber">Indisponible</Badge>}
          </div>
          <p className="text-xs mb-1" style={{ color:'#9b8cff' }}>{f.role}</p>
          <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color:'#7e82a0' }}>{f.bio}</p>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {f.tags.slice(0,4).map(t => (
              <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                style={{ background:'rgba(124,108,246,.1)', border:'1px solid rgba(124,108,246,.2)', color:'#9b8cff' }}>
                {t}
              </span>
            ))}
          </div>
          {f.region && <p className="text-[10px]" style={{ color:'#62668a' }}>📍 {f.region}</p>}
        </div>

        {/* Right panel */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <StarRating value={f.rating} />
              <span className="text-xs font-bold" style={{ color:'#f4f3fb' }}>{f.rating}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color:'#62668a' }}>{f.reviews} avis</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold" style={{ color:'#9b8cff' }}>{f.rate} TND</div>
            <p className="text-[10px]" style={{ color:'#62668a' }}>/heure</p>
          </div>
          <Button size="sm" disabled={!f.available}>
            {f.available ? 'Contacter' : 'Indisponible'}
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}

export default function FreelancersPage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('Tous')
  const [sort,     setSort]     = useState('rating')

  const filtered = FREELANCERS
    .filter(f => {
      const q = search.toLowerCase()
      const matchQ = !search || f.name.toLowerCase().includes(q) || f.role.toLowerCase().includes(q) || f.tags.some(t=>t.toLowerCase().includes(q))
      const matchCat = category==='Tous' || f.tags.some(t=>t.toLowerCase().includes(category.toLowerCase())) || f.role.toLowerCase().includes(category.toLowerCase())
      return matchQ && matchCat
    })
    .sort((a,b) => sort==='rating' ? b.rating - a.rating : a.name.localeCompare(b.name))

  return (
    <div style={{ background:'#0a0817', minHeight:'100vh' }}>
      {/* Header */}
      <div className="pt-24 pb-10 px-4 sm:px-6"
        style={{ background:'radial-gradient(700px 360px at 14% -6%, rgba(62,194,232,.12), transparent 60%), radial-gradient(500px 300px at 90% -2%, rgba(124,108,246,.12), transparent 60%), #0a0817', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:'#3ec2e8' }}>Marketplace</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color:'#f4f3fb' }}>Freelancers vérifiés</h1>
          <p className="text-sm mb-7" style={{ color:'#7e82a0' }}>Des talents tunisiens experts, disponibles pour vos projets.</p>
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-xl mb-6"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color:'#62668a' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, compétence, spécialité…"
              className="flex-1 bg-transparent outline-none text-sm" style={{ color:'#f4f3fb' }} />
            {search && <button onClick={()=>setSearch('')} style={{ color:'#62668a' }}>✕</button>}
          </div>
          {/* Stats */}
          <div className="flex items-center gap-8 flex-wrap">
            {[{ v: FREELANCERS.length, l:'Freelancers' }, { v: FREELANCERS.filter(f=>f.available).length, l:'Disponibles' }].map((s,i)=>(
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
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`chip ${category===cat ? 'active' : ''}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] hidden sm:block" style={{ color:'#62668a' }}>{filtered.length} résultat{filtered.length!==1?'s':''}</span>
              <select value={sort} onChange={e=>setSort(e.target.value)}
                className="text-[11px] bg-transparent border-0 focus:outline-none cursor-pointer" style={{ color:'#a7abc8' }}>
                <option value="rating">Mieux notés</option>
                <option value="name">Par nom</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-4">
        {filtered.length > 0 ? filtered.map(f => <FreelancerCard key={f.name} f={f} />) : (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold mb-1" style={{ color:'#a7abc8' }}>Aucun freelancer trouvé</p>
            <button onClick={()=>setSearch('')} className="text-xs mt-2" style={{ color:'#9b8cff' }}>Effacer la recherche</button>
          </div>
        )}
      </div>
    </div>
  )
}
