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
  //
  // Height uses dvh (dynamic viewport height), not vh: on mobile, vh is
  // measured against the LARGEST possible viewport (browser chrome
  // collapsed), so a fixed vh-tall column ends up taller than what's
  // actually visible whenever the address bar is showing — pushing the
  // message input off the bottom of the screen, exactly the bug reported.
  // dvh tracks the real, currently-visible viewport instead. The plain vh
  // rule stays first purely as a fallback for the handful of browsers that
  // don't understand dvh yet — updated by the dvh rule right after it.
  return (
    <div className="fm-fullchat-wrap" style={{ overflow:'hidden', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:'flex', flexDirection:'column', paddingTop:66 }}>
      <div style={{ flex:1, minHeight:0 }}>
        <MessengerChat currentUser={user} allUsers={users} initialChat={initialChat} fullScreen />
      </div>
      <style>{`
        .fm-fullchat-wrap {
          height: calc(100vh - var(--fm-announcement-h, 0px));
          height: calc(100dvh - var(--fm-announcement-h, 0px));
        }
      `}</style>
    </div>
  );
}
