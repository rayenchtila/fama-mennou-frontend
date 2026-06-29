import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const EXPERIENCE_OPTIONS = ['Débutant (0-1 an)','1-2 ans','3-5 ans','5-10 ans','10+ ans']
const PERIOD_OPTIONS     = ['De 1 à 3 jours','De 4 à 7 jours','De 1 à 2 semaines','De 2 à 4 semaines','De 1 à 3 mois','Plus de 3 mois']

const DEMO_PROJECTS = [
  { id:1, title:'Développement site vitrine Next.js',        desc:'Landing page moderne avec animations Framer Motion et formulaire de contact.', budget:'800',  experience:'1-2 ans',   period:'De 1 à 2 semaines',  keywords:'#nextjs #react #tailwind', status:'open'        },
  { id:2, title:'Intégration maquettes Figma → React',       desc:'Pixel-perfect conversion de 8 écrans Figma en composants React responsive.', budget:'600',  experience:'Débutant (0-1 an)', period:'De 4 à 7 jours',       keywords:'#figma #react #css',      status:'in_progress' },
  { id:3, title:'Audit & optimisation SEO site e-commerce',  desc:'Audit complet, correction erreurs techniques et optimisation on-page.',        budget:'500',  experience:'1-2 ans',   period:'De 2 à 4 semaines',  keywords:'#seo #wordpress',         status:'completed'   },
]

const STATUS_META = {
  open:        { label:'Ouvert',    color:'#10b981', bg:'rgba(16,185,129,.1)',   border:'rgba(16,185,129,.25)' },
  in_progress: { label:'En cours', color:'#3ec2e8', bg:'rgba(62,194,232,.1)',   border:'rgba(62,194,232,.25)' },
  completed:   { label:'Terminé',  color:'#a7abc8', bg:'rgba(167,171,200,.08)', border:'rgba(167,171,200,.2)' },
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#f4f3fb',
  padding: '8px 12px',
  width: '100%',
  fontSize: 13,
  outline: 'none',
}

const EMPTY = { title:'', description:'', budget:'100', experience:'', period:'', keywords:['','','','',''] }

export default function ProjectsPage() {
  const [projects,   setProjects]   = useState(DEMO_PROJECTS)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const e = {}
    if (!form.title.trim())       e.title       = 'Titre requis'
    if (!form.description.trim()) e.description = 'Description requise'
    if (!form.experience)         e.experience  = 'Requis'
    if (!form.period)             e.period      = 'Requis'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    setTimeout(() => {
      const kw = form.keywords.filter(k=>k.trim()).map(k=>`#${k.trim()}`).join(' ')
      setProjects(p => [{ id: Date.now(), ...form, keywords: kw, status: 'open' }, ...p])
      setForm(EMPTY); setErrors({}); setShowForm(false); setSubmitting(false)
    }, 600)
  }

  function deleteProject(id) {
    if (!confirm('Supprimer ce projet ?')) return
    setProjects(p => p.filter(x => x.id !== id))
  }

  return (
    <div style={{ background:'#0a0817', minHeight:'100vh' }}>
      {/* Header */}
      <div className="pt-24 pb-10 px-4 sm:px-6"
        style={{ background:'radial-gradient(700px 360px at 14% -6%, rgba(124,108,246,.12), transparent 60%), radial-gradient(400px 280px at 90% -2%, rgba(62,194,232,.1), transparent 60%), #0a0817', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color:'#7c6cf6' }}>Tableau de bord</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color:'#f4f3fb' }}>🗂️ Mes Projets</h1>
              <p className="text-sm mt-1" style={{ color:'#7e82a0' }}>{projects.length} projet{projects.length!==1?'s':''}</p>
            </div>
            <button onClick={() => { setShowForm(s=>!s); setErrors({}) }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#7c6cf6,#6c8cf6)', border: showForm ? '1px solid rgba(255,255,255,.1)' : 'none', color: showForm ? '#a7abc8' : '#fff' }}>
              {showForm ? '✕ Annuler' : '+ Nouveau projet'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
            style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(124,108,246,.3)' }}>
            <p className="text-sm font-bold" style={{ color:'#f4f3fb' }}>Nouveau projet</p>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Titre <span style={{ color:'#f87171' }}>*</span></label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={INPUT_STYLE} placeholder="Ex : Développement app mobile" />
              {errors.title && <p className="text-[11px] mt-1" style={{ color:'#f87171' }}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Description <span style={{ color:'#f87171' }}>*</span></label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
                style={{ ...INPUT_STYLE, resize:'none' }} placeholder="Décrivez votre projet…" />
              {errors.description && <p className="text-[11px] mt-1" style={{ color:'#f87171' }}>{errors.description}</p>}
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Mots clés</label>
              <div className="flex flex-wrap gap-2">
                {form.keywords.map((kw,i)=>(
                  <div key={i} className="flex items-center rounded-xl overflow-hidden"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <span className="pl-2.5 text-sm font-bold" style={{ color:'#7e82a0' }}>#</span>
                    <input maxLength={20} value={kw}
                      onChange={e=>{ const v=e.target.value.replace(/[#\s]/g,'').slice(0,20); setForm(f=>({...f,keywords:f.keywords.map((k,idx)=>idx===i?v:k)}))}}
                      placeholder={`tag ${i+1}`}
                      className="bg-transparent px-1 py-2 text-xs font-semibold focus:outline-none"
                      style={{ color:'#f4f3fb', width: `${Math.max(6,kw.length+2)}ch` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Experience + Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Expérience <span style={{ color:'#f87171' }}>*</span></label>
                <select value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} style={{ ...INPUT_STYLE, cursor:'pointer' }}>
                  <option value="">Sélectionner…</option>
                  {EXPERIENCE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                {errors.experience && <p className="text-[11px] mt-1" style={{ color:'#f87171' }}>{errors.experience}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Période <span style={{ color:'#f87171' }}>*</span></label>
                <select value={form.period} onChange={e=>setForm(f=>({...f,period:e.target.value}))} style={{ ...INPUT_STYLE, cursor:'pointer' }}>
                  <option value="">Sélectionner…</option>
                  {PERIOD_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                {errors.period && <p className="text-[11px] mt-1" style={{ color:'#f87171' }}>{errors.period}</p>}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'#a7abc8' }}>Budget (TND)</label>
              <div className="flex items-stretch rounded-xl overflow-hidden"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={()=>setForm(f=>({...f,budget:String(Math.max(10,(Number(f.budget)||10)-10))}))
                  } className="px-4 text-lg font-bold hover:bg-white/5 transition-colors" style={{ color:'#7e82a0' }}>−</button>
                <input type="number" min="10" step="10" value={form.budget}
                  onChange={e=>setForm(f=>({...f,budget:e.target.value.replace(/[^0-9]/g,'')}))}
                  onBlur={e=>setForm(f=>({...f,budget:String(Math.max(10,Number(e.target.value)||10))}))}
                  className="flex-1 py-2 text-sm text-center bg-transparent focus:outline-none [appearance:textfield]" style={{ color:'#f4f3fb' }} />
                <button type="button" onClick={()=>setForm(f=>({...f,budget:String((Number(f.budget)||10)+10)}))}
                  className="px-4 text-lg font-bold hover:bg-white/5 transition-colors" style={{ color:'#7e82a0' }}>+</button>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background:'linear-gradient(135deg,#7c6cf6,#6c8cf6)', boxShadow:'0 4px 14px -3px rgba(124,108,246,.5)' }}>
              {submitting ? 'Publication…' : 'Publier le projet →'}
            </button>
          </form>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="py-24 text-center rounded-2xl"
            style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-2xl block mb-3">🗂️</span>
            <p className="text-sm font-semibold" style={{ color:'#a7abc8' }}>Aucun projet pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(p => {
              const st = STATUS_META[p.status] || STATUS_META.open
              const kws = p.keywords ? p.keywords.split(/\s+/).filter(Boolean) : []
              return (
                <GlassCard key={p.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color:'#f4f3fb' }}>{p.title}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color:'#9b8cff' }}>{p.budget} TND</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>{st.label}</span>
                      <button onClick={()=>deleteProject(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors hover:bg-red-500/10" style={{ color:'#62668a' }}>🗑️</button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]" style={{ color:'#62668a' }}>
                    {p.experience && <span>👔 {p.experience}</span>}
                    {p.period     && <span>⏱️ {p.period}</span>}
                  </div>

                  {p.description && <p className="text-xs leading-relaxed" style={{ color:'#7e82a0' }}>{p.description}</p>}

                  {kws.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {kws.map(kw => (
                        <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          style={{ background:'rgba(124,108,246,.1)', border:'1px solid rgba(124,108,246,.2)', color:'#9b8cff' }}>{kw}</span>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
