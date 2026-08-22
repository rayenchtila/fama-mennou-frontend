import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessengerChat from '../components/MessengerChat';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function MessagesPage() {
  const { user, users } = useAuth();
  const [searchParams] = useSearchParams();
  const initialChat = searchParams.get('with') || null;

  // Immersive, header-free full-screen chat for everyone — client,
  // freelancer, and admin alike.
  //
  // Pinned with position:fixed (top/bottom anchored) instead of an
  // in-flow height:100dvh block: on mobile, focusing the message input
  // makes the browser auto-scroll the PAGE to bring the input above the
  // keyboard — for an in-flow block that drags the whole chat (header
  // included) up and off the top of the screen, leaving only the input
  // bar visible against a blank background, exactly the bug reported.
  // A fixed element is anchored to the viewport and isn't a target for
  // that page-level auto-scroll, so header + messages + input all stay
  // exactly where they are, in view, keyboard open or not. Body scroll
  // is also locked for the same reason, belt-and-suspenders.
  useBodyScrollLock(!!user);

  if (!user) return null;

  return (
    <div className="fm-fullchat-wrap" style={{ position:'fixed', left:0, right:0, bottom:0, overflow:'hidden', background:'var(--fm-bg)', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, minHeight:0 }}>
        <MessengerChat currentUser={user} allUsers={users} initialChat={initialChat} fullScreen />
      </div>
      <style>{`
        .fm-fullchat-wrap {
          top: calc(66px + var(--fm-announcement-h, 0px));
        }
      `}</style>
    </div>
  );
}
