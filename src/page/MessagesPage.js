import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import MessengerChat from '../components/MessengerChat';

export default function MessagesPage() {
  const { user, users } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialChat = searchParams.get('with') || null;

  if (!user) return null;

  // Clients and admin get an immersive, header-free full-screen chat.
  // Freelancers keep the header block + card layout, unchanged.
  const fullScreen = user.isAdmin || user.role === 'client';

  if (fullScreen) {
    return (
      <div style={{ height:'calc(100vh - var(--fm-announcement-h, 0px))', overflow:'hidden', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:'flex', flexDirection:'column', paddingTop:66 }}>
        <div style={{ flex:1, minHeight:0 }}>
          <MessengerChat currentUser={user} allUsers={users} initialChat={initialChat} fullScreen />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:'flex', flexDirection:'column', paddingBottom:40 }}>

      {/* Blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,var(--fm-primary-soft),transparent 68%)', top:'-200px', left:'-150px', animation:'msgBlob1 22s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(62,194,232,0.07),transparent 68%)', bottom:'10%', right:'-100px', animation:'msgBlob2 28s ease-in-out infinite' }}/>
      </div>

      {/* Page header */}
      <div className="fm-messages-header" style={{ position:'relative', zIndex:1, maxWidth:1100, width:'100%', margin:'0 auto', padding:'100px 20px 20px' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'var(--fm-text-7)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>
          {t('msg.page_account')}
        </p>
        <h1 style={{ fontSize:'clamp(26px,6vw,38px)', fontWeight:900, color:'var(--fm-text-2)', margin:'0 0 6px', letterSpacing:'-0.03em', lineHeight:1.1 }}>
          <span style={{ background:'linear-gradient(120deg,#c4baff 0%,#9b8cff 42%,#7c6cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            {t('msg.page_title')}
          </span>
        </h1>
        <p style={{ fontSize:14, color:'var(--fm-text-7)', margin:0 }}>{t('msg.page_subtitle')}</p>
      </div>

      {/* Chat container */}
      <div style={{ position:'relative', zIndex:1, flex:1, maxWidth:1100, width:'100%', margin:'0 auto', padding:'0 16px' }}>
        <div className="fm-chat-container" style={{ borderRadius:24, overflow:'hidden', border:'1px solid var(--fm-border)', boxShadow:'0 24px 80px -16px var(--fm-shadow)' }}>
          <MessengerChat currentUser={user} allUsers={users} initialChat={initialChat} />
        </div>
      </div>

      <style>{`
        @keyframes msgBlob1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(50px,-40px)scale(1.08)} }
        @keyframes msgBlob2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-40px,30px)scale(1.06)} }
      `}</style>
    </div>
  );
}
