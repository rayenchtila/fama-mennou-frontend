import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessagesTab from '../components/MessagesTab';

export default function MessagesPage() {
  const { user, users } = useAuth();
  const [searchParams]  = useSearchParams();
  const initialChat     = searchParams.get('with') || null;

  if (!user) return null;

  return (
    // Fixed full-screen on mobile (below navbar), normal scroll on desktop
    <div
      className="bg-slate-50 dark:bg-slate-950 fixed inset-0 md:relative md:min-h-screen md:pt-20 md:pb-6 md:px-4 lg:px-8"
      style={{ top: 64 }}
    >
      <div className="h-full max-w-5xl mx-auto md:h-auto">
        {/* Title hidden on mobile to maximise chat space */}
        <h1 className="hidden md:block text-xl font-bold text-slate-900 dark:text-white mb-4">💬 Messages</h1>
        <div className="h-full md:h-[calc(100vh-160px)] md:min-h-[520px]">
          <MessagesTab user={user} allUsers={users} initialChat={initialChat} />
        </div>
      </div>
    </div>
  );
}
