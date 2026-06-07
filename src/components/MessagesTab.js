import { useState, useEffect, useRef, useCallback } from 'react';

const API              = 'https://famamennou-server.onrender.com/api';
const FM_ADMIN_EMAIL   = 'admin@famamennou.com';
const FM_ADMIN_DISPLAY = { name: 'Fama Mennou TEAM', email: FM_ADMIN_EMAIL, role: 'admin', photo: null };

const AVATAR_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];

function Avatar({ user, size = 'md', showOnline = false, online = false }) {
  const sz = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const color = AVATAR_COLORS[(user?.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div className="relative shrink-0">
      {user?.photo
        ? <img src={user.photo} alt={user.name} className={`${sz} rounded-2xl object-cover`} />
        : <div className={`${sz} ${color} rounded-2xl flex items-center justify-center text-white font-bold`}>
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
      }
      {showOnline && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      )}
    </div>
  );
}

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

function ReadReceipt({ isRead, isReceiverOnline }) {
  if (isRead) return (
    <span className="inline-flex items-center" title="Lu">
      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 10" fill="none">
        <path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  if (isReceiverOnline) return (
    <span className="inline-flex items-center" title="Envoyé">
      <svg className="w-4 h-4 text-white/50" viewBox="0 0 20 10" fill="none">
        <path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
  return (
    <span className="inline-flex items-center" title="Envoyé">
      <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 14 10" fill="none">
        <path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}



export default function MessagesTab({ user, allUsers: allUsersProp, initialChat }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat,  setSelectedChat]  = useState(initialChat || null);
  const [messages,      setMessages]      = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [showPicker,    setShowPicker]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [editingId,     setEditingId]     = useState(null);
  const [editText,      setEditText]      = useState('');
  const [openMenuId,    setOpenMenuId]    = useState(null);
  const [menuPos,       setMenuPos]       = useState({ top: 0, right: 0 });
  const [usersMap,      setUsersMap]      = useState({});
  const [stagedImage,   setStagedImage]   = useState(null); // { file, previewUrl }
  const [uploading,     setUploading]     = useState(false);

  const messagesBoxRef  = useRef();
  const prevChatRef     = useRef(null);
  const pollRef         = useRef();
  const msgPollRef      = useRef();
  const usersPollRef    = useRef();
  const inputRef        = useRef();
  const fileInputRef    = useRef();

  // ── Users (for online status) ─────────────────────────────────────────────
  const refreshUsers = useCallback(async () => {
    try {
      const data = await fetch(`${API}/users`).then(r => r.json());
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

  // ── Conversations ─────────────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const data = await fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json());
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, [user.email]);

  useEffect(() => {
    fetchConvs();
    pollRef.current = setInterval(fetchConvs, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchConvs]);

  // ── Messages ──────────────────────────────────────────────────────────────
  const fetchMsgs = useCallback(async (otherEmail) => {
    try {
      const data = await fetch(`${API}/messages/${encodeURIComponent(user.email)}/${encodeURIComponent(otherEmail)}`).then(r => r.json());
      if (Array.isArray(data)) setMessages(data);
      fetch(`${API}/messages/read/${encodeURIComponent(otherEmail)}/${encodeURIComponent(user.email)}`, { method: 'PATCH' });
    } catch {}
  }, [user.email]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMsgs(selectedChat);
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => fetchMsgs(selectedChat), 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, fetchMsgs]);

  // ── Scroll (container only, never the page) ───────────────────────────────
  useEffect(() => {
    const box = messagesBoxRef.current;
    if (!box) return;
    prevChatRef.current = selectedChat;
    box.scrollTop = box.scrollHeight;
  }, [messages, selectedChat]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStagedImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = '';
  }

  async function sendMsg() {
    if ((!newMsg.trim() && !stagedImage) || !selectedChat) return;
    let attachmentUrl = null;
    if (stagedImage) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', stagedImage.file);
        const r = await fetch(`${API}/uploads/image`, { method: 'POST', body: fd });
        const d = await r.json();
        attachmentUrl = d.secure_url || null;
      } catch {}
      setUploading(false);
    }
    const content = newMsg.trim();
    setNewMsg('');
    setStagedImage(null);
    await fetch(`${API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email, receiverEmail: selectedChat, content, attachmentUrl }),
    });
    fetchMsgs(selectedChat);
    fetchConvs();
  }

  async function editMsg(id, content) {
    if (!content.trim()) return;
    await fetch(`${API}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email, content }),
    });
    setEditingId(null);
    setOpenMenuId(null);
    fetchMsgs(selectedChat);
  }

  async function deleteMsg(id) {
    setOpenMenuId(null);
    await fetch(`${API}/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: user.email }),
    });
    fetchMsgs(selectedChat);
    fetchConvs();
  }

  const getUser     = email => {
    if (email?.toLowerCase() === FM_ADMIN_EMAIL) return FM_ADMIN_DISPLAY;
    return usersMap[email?.toLowerCase()] || allUsersProp?.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
  };
  const otherUser   = selectedChat ? getUser(selectedChat) : null;
  const otherStatus = otherUser ? getOnlineStatus(otherUser.last_seen || otherUser.lastSeen) : null;
  const unreadCount = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;

  const filteredUsers = (allUsersProp || []).filter(u =>
    u.email !== user.email && u.cinStatus === 'approved' &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

      {/* ── LEFT: Conversation list ──────────────────────────────────────── */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-r border-slate-100 dark:border-slate-800 shrink-0`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Messages
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">{unreadCount}</span>
            )}
          </h3>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-indigo-700 transition-colors"
          >+</button>
        </div>

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
                      : <span className="text-[9px] text-slate-400 shrink-0 hidden sm:block">{status.text}</span>
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
          <div
            ref={messagesBoxRef}
            className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 dark:bg-slate-950"
            onClick={() => setOpenMenuId(null)}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm font-semibold">Démarrez la conversation</p>
                <p className="text-xs mt-1 opacity-60">Discutez, négociez, collaborez</p>
              </div>
            )}

            <div className="space-y-[2px]">
              {messages.map((m, idx) => {
                const isMine        = m.sender_email === user.email?.toLowerCase();
                const prevMsg       = messages[idx - 1];
                const nextMsg       = messages[idx + 1];
                const samePrev      = prevMsg && prevMsg.sender_email === m.sender_email && (new Date(m.created_at) - new Date(prevMsg.created_at)) < 120000;
                const sameNext      = nextMsg && nextMsg.sender_email === m.sender_email && (new Date(nextMsg.created_at) - new Date(m.created_at)) < 120000;
                const isFirst       = !samePrev;
                const isLast        = !sameNext;
                const isMenuOpen    = openMenuId === m.id;
                const isEditing     = editingId === m.id;

                const bubbleRadius  = isMine
                  ? `rounded-2xl ${isFirst ? 'rounded-tr-md' : ''} ${isLast ? 'rounded-br-md' : ''}`
                  : `rounded-2xl ${isFirst ? 'rounded-tl-md' : ''} ${isLast ? 'rounded-bl-md' : ''}`;

                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>

                    {/* Received avatar — show on last of group */}
                    {!isMine && (
                      <div className={`mr-2 self-end mb-1 ${!isLast ? 'opacity-0 pointer-events-none' : ''}`}>
                        <Avatar user={otherUser || { email: selectedChat }} size="sm" />
                      </div>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>

                      {/* Sender name — received, first of group */}
                      {!isMine && isFirst && (
                        <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                          {otherUser?.name?.split(' ')[0] || selectedChat}
                        </p>
                      )}

                      {/* Edit mode */}
                      {isEditing ? (
                        <div className="flex gap-2 items-center w-full min-w-[200px] max-w-xs">
                          <input
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') editMsg(m.id, editText);
                              if (e.key === 'Escape') { setEditingId(null); setOpenMenuId(null); }
                            }}
                            className="flex-1 text-sm rounded-xl border-2 border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button onClick={() => editMsg(m.id, editText)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </button>
                          <button onClick={() => { setEditingId(null); setOpenMenuId(null); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (!isMine) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                            setOpenMenuId(isMenuOpen ? null : m.id);
                            setEditingId(null);
                          }}
                          className={`text-sm shadow-sm text-left ${m.attachment_url && !m.content ? 'p-1' : 'px-3.5 py-2.5'} ${isMine ? 'cursor-pointer' : 'cursor-default'} ${bubbleRadius} ${
                            isMine ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700'
                          } ${isMenuOpen && isMine ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''}`}
                        >
                          {m.attachment_url && (
                            <img
                              src={m.attachment_url}
                              alt="Photo"
                              className={`max-w-[260px] w-full object-cover rounded-xl block ${m.content ? 'mb-2' : ''}`}
                              onClick={e => { e.stopPropagation(); window.open(m.attachment_url, '_blank'); }}
                            />
                          )}
                          {m.content && <span className="break-words leading-relaxed whitespace-pre-wrap">{m.content}</span>}
                        </button>
                      )}

                      {/* Time — always visible under every bubble */}
                      {!isEditing && (
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {m.edited_at && (
                            <span className="text-[10px] text-slate-400 italic">modifié ·</span>
                          )}
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {m.edited_at ? formatTime(m.edited_at) : formatTime(m.created_at)}
                          </span>
                          {isMine && isLast && <ReadReceipt isRead={m.is_read} isReceiverOnline={otherStatus?.online} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixed-position action menu — outside scroll container, never clipped */}
          {openMenuId && (() => {
            const activeMsg = messages.find(msg => msg.id === openMenuId);
            if (!activeMsg) return null;
            const canDelete = (Date.now() - new Date(activeMsg.created_at).getTime()) < 3600000;
            return (
              <div
                className="fixed z-50 flex flex-col gap-0.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden min-w-[160px]"
                style={{ top: menuPos.top, right: menuPos.right }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setEditingId(openMenuId); setEditText(activeMsg.content); setOpenMenuId(null); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors text-left"
                >
                  ✏️ Modifier
                </button>
                {canDelete && (
                  <button
                    onClick={() => { deleteMsg(openMenuId); setOpenMenuId(null); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left"
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            );
          })()}

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Staged image preview */}
            {stagedImage && (
              <div className="px-3 pt-2.5 flex items-start gap-2">
                <div className="relative">
                  <img src={stagedImage.previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => setStagedImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Ajouter une légende…</p>
              </div>
            )}
            <div className="flex gap-2 items-center p-3">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 transition-colors shrink-0 disabled:opacity-40"
                title="Envoyer une photo"
              >
                <svg className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                onClick={() => setOpenMenuId(null)}
                placeholder="Aa"
                className="flex-1 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                onClick={sendMsg}
                disabled={(!newMsg.trim() && !stagedImage) || uploading}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full transition-all shrink-0 shadow-sm shadow-indigo-500/30"
              >
                {uploading
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                }
              </button>
            </div>
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
