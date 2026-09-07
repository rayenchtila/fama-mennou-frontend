// src/components/ShareMenu.js
// Shared "share this" button + popover — Copy link / WhatsApp / Facebook /
// Instagram. Used on every project card (ClientsPage.js's marketplace browse
// view, ProjectsPage.js's "My Projects" view) so the behavior and the
// Instagram-has-no-real-share-intent handling live in exactly one place.
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from './Toast';

// The classic "box + arrow out the top" share icon — what iOS, most Android
// apps, and Meta's own apps (Instagram, Facebook) actually use, rather than
// the Android-system-only "3 connected dots" variant.
const IcShare     = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const IcLink      = ({s=13}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcWhatsapp  = ({s=15}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36c1.36.74 2.94 1.16 4.62 1.16h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01c-1.48 0-2.94-.4-4.2-1.15l-.3-.18-3.12.78.83-3.04-.2-.31a8.06 8.06 0 0 1-1.24-4.31c0-4.46 3.63-8.09 8.1-8.09 2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.72c0 4.47-3.63 8.1-8.05 8.21Zm4.44-6.06c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.63-1.18-1.4-1.31-1.64-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z"/></svg>;
const IcFacebook  = ({s=15}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.51l.38-2.91h-2.89V8.63c0-.84.23-1.42 1.44-1.42h1.55V4.6c-.27-.04-1.2-.11-2.27-.11-2.24 0-3.78 1.37-3.78 3.88v2.16H8v2.91h2.44V21h3.06Z"/></svg>;
const IcInstagram = ({s=15}) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;

// Instagram has no public web share-intent for arbitrary links (unlike FB/
// WhatsApp) — the honest, standard way apps handle this is copy-link with a
// hint to paste it in a story/bio, not a fake "share" button that silently
// does nothing.
function ShareMenu({ url, title, onClose, anchorRef }) {
  const { t } = useTranslation();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current?.contains(e.target)) return;
      if (anchorRef.current?.contains(e.target)) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  function copyLink() {
    navigator.clipboard.writeText(url)
      .then(() => toast.success(t('prp.share.copied')))
      .catch(() => toast.error(t('prp.share.copy_failed')));
    onClose();
  }
  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, '_blank', 'noopener,noreferrer');
    onClose();
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=600,height=600');
    onClose();
  }
  function shareInstagram() {
    navigator.clipboard.writeText(url)
      .then(() => toast.info(t('prp.share.instagram_hint')))
      .catch(() => toast.error(t('prp.share.copy_failed')));
    onClose();
  }

  const itemStyle = { display:'flex', alignItems:'center', gap:11, width:'100%', padding:'9px 10px', borderRadius:11, background:'transparent', border:'none', color:'var(--fm-text-2)', fontSize:13, fontWeight:650, cursor:'pointer', textAlign:'left', transition:'background .15s' };
  const iconCircle = { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 };
  const hoverIn  = e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; };
  const hoverOut = e => { e.currentTarget.style.background = 'transparent'; };

  return (
    <motion.div ref={menuRef}
      initial={{ opacity:0, y:-6, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-6, scale:0.96 }}
      transition={{ duration:0.15, ease:'easeOut' }}
      onClick={e => e.stopPropagation()}
      style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:50, width:238, borderRadius:16, background:'var(--fm-surface-2)', border:'1px solid var(--fm-border-strong)', boxShadow:'0 20px 56px -14px rgba(0,0,0,0.45)', overflow:'hidden' }}>
      <div style={{ padding:'11px 14px 9px' }}>
        <p style={{ fontSize:10.5, fontWeight:800, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.07em', margin:0 }}>{t('prp.share.title')}</p>
      </div>
      <div style={{ padding:'2px 8px 8px', display:'flex', flexDirection:'column', gap:1 }}>
        <button onClick={copyLink} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <span style={{ ...iconCircle, background:'var(--fm-primary-soft-strong)', color:'var(--fm-primary-light)' }}><IcLink s={13}/></span>
          {t('prp.share.copy_link')}
        </button>
        <button onClick={shareWhatsapp} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <span style={{ ...iconCircle, background:'#25D366' }}><IcWhatsapp s={14}/></span>
          WhatsApp
        </button>
        <button onClick={shareFacebook} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <span style={{ ...iconCircle, background:'#1877F2' }}><IcFacebook s={14}/></span>
          Facebook
        </button>
        <button onClick={shareInstagram} style={itemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <span style={{ ...iconCircle, background:'linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)' }}><IcInstagram s={14}/></span>
          Instagram
        </button>
      </div>
    </motion.div>
  );
}

// Self-contained trigger button + popover. `accent`/`accentBg`/`accentBorder`/
// `accentHoverBg` let each page tint the trigger to match its own palette
// (ProjectsPage.js's purple, ClientsPage.js's cyan, etc.) without needing to
// duplicate the button or the popover logic itself.
export default function ShareButton({
  url, title,
  accent = 'var(--fm-primary-light)',
  accentBg = 'rgba(124,108,246,0.08)',
  accentBorder = 'rgba(124,108,246,0.2)',
  accentHoverBg = 'rgba(124,108,246,0.16)',
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  return (
    <div style={{ position:'relative' }}>
      <button ref={btnRef} onClick={() => setOpen(v => !v)} title={t('prp.share.title')}
        style={{ width:32, height:32, borderRadius:10, background:accentBg, border:`1px solid ${accentBorder}`, color:accent, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = accentHoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = accentBg; }}>
        <IcShare s={13}/>
      </button>
      <AnimatePresence>
        {open && <ShareMenu url={url} title={title} onClose={() => setOpen(false)} anchorRef={btnRef} />}
      </AnimatePresence>
    </div>
  );
}
