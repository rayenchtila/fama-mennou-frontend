import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessagesTab from '../components/MessagesTab';

export default function MessagesPage() {
  const { user, users } = useAuth();
  const [searchParams] = useSearchParams();
  const initialChat = searchParams.get('with') || null;

  if (!user) return null;

  return (
    <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">💬 Messages</h1>
        <MessagesTab user={user} allUsers={users} initialChat={initialChat} />
      </div>
    </div>
  );
}
