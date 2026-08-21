import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessengerChat from '../components/MessengerChat';

export default function MessagesPage() {
  const { user, users } = useAuth();
  const [searchParams] = useSearchParams();
  const initialChat = searchParams.get('with') || null;

  if (!user) return null;

  // Immersive, header-free full-screen chat for everyone — client,
  // freelancer, and admin alike.
  return (
    <div style={{ height:'calc(100vh - var(--fm-announcement-h, 0px))', overflow:'hidden', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:'flex', flexDirection:'column', paddingTop:66 }}>
      <div style={{ flex:1, minHeight:0 }}>
        <MessengerChat currentUser={user} allUsers={users} initialChat={initialChat} fullScreen />
      </div>
    </div>
  );
}
