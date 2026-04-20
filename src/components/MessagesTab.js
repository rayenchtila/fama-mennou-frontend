import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://famamennou-server.onrender.com/api';

const AVATAR_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];

function Avatar({ user, size = 'md', showOnline = false, online = false }) {
  const sz = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const color = AVATAR_COLORS[(user?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div className="relative shrink-0">
      {user?.photo
        ? <img src={user.photo} alt={user.name} className={`${sz} rounded-2xl object-cover`} />
        : <div className={`${sz} ${color} rounded-2xl flex items-center justify-center text-white font-bold`}>{user?.name?.slice(0,2).toUpperCase()}</div>
      }
      {showOnline && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      )}
    </div>
  );
}

// Returns { online, text } based on last_seen timestamp
function getOnlineStatus(lastSeen) {
  if (!lastSeen) return { online: false, text: 'Hors ligne' };
  const diffMs  = Date.now() - new Date(lastSeen).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 3)  return { online: true,  text: 'En ligne' };
  if (diffMin < 60) return { online: false,  text: `Actif il y a ${diffMin} min` };
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return { online: false,  text: `Actif il y a ${diffH}h` };
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return { online: false,  text: `Actif il y a ${diffD}j` };
  return { online: false, text: new Date(lastSeen).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' }) };
}

// Read receipt icon — shown on sent messages only
function ReadReceipt({ isRead }) {
  return (
    <span className="ml-1 inline-flex items-center">
      {isRead ? (
        // Double check blue = read
        <svg className="w-3.5 h-3.5 text-blue-300" viewBox="0 0 16 10" fill="none">
          <path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(2,0)"/>
        </svg>
      ) : (
        // Single check grey = sent, not read
        <svg className="w-3 h-3 text-indigo-300" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

export default function MessagesTab({ user, allUsers: allUsersProp, initialChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat]   = useState(initialChat || null);
  const [messages, setMessages]           = useState([]);
  const [newMsg, setNewMsg]               = useState('');
  const [showPicker, setShowPicker]       = useState(false);
  const [search, setSearch]               = useState('');
  // local users map refreshed every 30s for live online status
  const [usersMap, setUsersMap]           = useState({});

  const chatEndRef  = useRef();
  const pollRef     = useRef();
  const msgPollRef  = useRef();
  const usersPollRef = useRef();

  // ── Fetch / refresh users for online status ──────────────────────────────
  const refreshUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/users`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(u => { if (u.email) map[u.email.toLowerCase()] = u; });
        setUsersMap(map);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshUsers();
    usersPollRef.current = setInterval(refreshUsers, 30000);
    return () => clearInterval(usersPollRef.current);
  }, [refreshUsers]);

  // ── Conversations polling ─────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, [user.email]);

  useEffect(() => {
    fetchConvs();
    pollRef.current = setInterval(fetchConvs, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchConvs]);

  // ── Messages polling ──────────────────────────────────────────────────────
  const fetchMsgs = useCallback(async (otherEmail) => {
    try {
      const res  = await fetch(`${API}/messages/${encodeURIComponent(user.email)}/${encodeURIComponent(otherEmail)}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      // mark received messages as read
      await fetch(`${API}/messages/read/${encodeURIComponent(otherEmail)}/${encodeURIComponent(user.email)}`, { method: 'PATCH' });
    } catch {}
  }, [user.email]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMsgs(selectedChat);
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => fetchMsgs(selectedChat), 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, fetchMsgs]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMsg() {
    if (!newMsg.trim() || !selectedChat) return;
    const content = newMsg.trim();
    setNewMsg('');
    await fetch(`${API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email, receiverEmail: selectedChat, content }),
    });
    fetchMsgs(selectedChat);
    fetchConvs();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUser = (email) => {
    const e = email?.toLowerCase();
    return usersMap[e] || allUsersProp?.find(u => u.email?.toLowerCase() === e) || null;
  };

  const otherUser   = selectedChat ? getUser(selectedChat) : null;
  const otherStatus = otherUser ? getOnlineStatus(otherUser.last_seen || otherUser.lastSeen) : null;
  const unreadCount = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;

  const filteredUsers = (allUsersProp || []).filter(u =>
    u.email !== user.email && u.cinStatus === 'approved' &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

      {/* ── LEFT: Conversation list ──────────────────────────────────────── */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r border-slate-100 dark:border-slate-800 shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Messages
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">{unreadCount}</span>
            )}
          </h3>
          <button onClick={() => setShowPicker(!showPicker)} className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-indigo-700 transition-colors">+</button>
        </div>

        {/* New chat picker */}
        {showPicker && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <div className="max-h-44 overflow-y-auto space-y-1">
              {filteredUsers.map(u => {
                const uFull = getUser(u.email);
                const { online } = getOnlineStatus(uFull?.last_seen || uFull?.lastSeen);
                return (
                  <button key={u.email} onClick={() => { setSelectedChat(u.email.toLowerCase()); setShowPicker(false); setSearch(''); }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-left transition-colors">
                    <Avatar user={u} size="sm" showOnline online={online} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Aucun résultat</p>}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-xs font-semibold">Aucune conversation</p>
              <p className="text-[10px] mt-1 opacity-60">Cliquez + pour démarrer</p>
            </div>
          )}
          {conversations.map(c => {
            const other    = getUser(c.other_email);
            const status   = getOnlineStatus(other?.last_seen || other?.lastSeen);
            const isUnread = !c.is_read && c.sender_email !== user.email?.toLowerCase();
            return (
              <button
                key={c.other_email}
                onClick={() => setSelectedChat(c.other_email)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800/50 ${selectedChat === c.other_email ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500' : ''}`}
              >
                <Avatar user={other || { email: c.other_email, name: c.other_email }} size="sm" showOnline online={status.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
                      {other?.name || c.other_email}
                    </p>
                    {status.online
                      ? <span className="text-[9px] font-bold text-emerald-500 shrink-0">En ligne</span>
                      : <span className="text-[9px] text-slate-400 shrink-0 hidden sm:block">
                          {getOnlineStatus(other?.last_seen || other?.lastSeen).text}
                        </span>
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    {isUnread && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />}
                    <p className={`text-[10px] truncate ${isUnread ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                      {c.last_message}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Chat window ───────────────────────────────────────────── */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button className="md:hidden text-slate-400 hover:text-slate-600 mr-1 shrink-0" onClick={() => setSelectedChat(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <Avatar user={otherUser || { email: selectedChat }} size="sm" showOnline online={otherStatus?.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{otherUser?.name || selectedChat}</p>
              <p className={`text-[11px] font-semibold ${otherStatus?.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                {otherStatus?.text || 'Hors ligne'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm font-semibold">Démarrez la conversation</p>
                <p className="text-xs mt-1 opacity-60">Discutez, négociez, collaborez</p>
              </div>
            )}

            {messages.map((m, idx) => {
              const isMine = m.sender_email === user.email?.toLowerCase();
              const prevMsg = messages[idx - 1];
              const sameGroup = prevMsg && prevMsg.sender_email === m.sender_email &&
                (new Date(m.created_at) - new Date(prevMsg.created_at)) < 120000; // 2 min gap = new group

              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameGroup ? 'mt-0.5' : 'mt-3'}`}>
                  {/* Avatar for received — only show on last of group */}
                  {!isMine && (
                    <div className={`mr-2 mt-auto ${sameGroup ? 'opacity-0 pointer-events-none' : ''}`}>
                      <Avatar user={otherUser || { email: selectedChat }} size="sm" />
                    </div>
                  )}

                  <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-slate-700'
                    }`}>
                      <p className="leading-relaxed break-words">{m.content}</p>
                    </div>
                    {/* Timestamp + read receipt */}
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <p className="text-[10px] text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isMine && <ReadReceipt isRead={m.is_read} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-end">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Votre message..."
              className="flex-1 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMsg}
              disabled={!newMsg.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-semibold text-slate-600 dark:text-slate-300">Sélectionnez une conversation</p>
            <p className="text-xs mt-1">ou cliquez + pour en démarrer une</p>
          </div>
        </div>
      )}
    </div>
  );
}
