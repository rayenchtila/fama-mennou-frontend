import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRealtimeChannel } from '../lib/useRealtimeChannel';
import { supabase } from '../lib/supabaseClient';
import { cldImg } from '../utils/cloudinary';

const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

const AVATAR_COLORS = [
  'bg-indigo-500','bg-emerald-500','bg-rose-500',
  'bg-amber-500','bg-sky-500','bg-fuchsia-500','bg-violet-500',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(email = '') {
  return AVATAR_COLORS[(email.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function getOnlineStatus(lastSeen) {
  if (!lastSeen) return { online: false, text: 'Hors ligne' };
  const diff = Date.now() - new Date(lastSeen).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 3)  return { online: true,  text: 'En ligne' };
  if (min < 60) return { online: false,  text: `Actif il y a ${min} min` };
  const h = Math.floor(min / 60);
  if (h < 24)   return { online: false,  text: `Actif il y a ${h}h` };
  const d = Math.floor(h / 24);
  return { online: false, text: `Actif il y a ${d}j` };
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avi({ user, size = 'md', online }) {
  const sz  = size === 'lg' ? 'w-11 h-11 text-sm' : size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs';
  const col = avatarColor(user?.email || '');
  return (
    <div className="relative shrink-0">
      {user?.photo
        ? <img src={cldImg(user.photo)} alt={user?.name} className={`${sz} rounded-xl object-cover`} />
        : <div className={`${sz} ${col} rounded-xl flex items-center justify-center text-white font-bold`}>
            {(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}
          </div>
      }
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${online ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
      )}
    </div>
  );
}

function ReadTick({ read, online }) {
  if (read) return (
    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 20 10" fill="none">
      <path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (online) return (
    <svg className="w-3.5 h-3.5 text-white/50 shrink-0" viewBox="0 0 20 10" fill="none">
      <path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg className="w-3 h-3 text-white/50 shrink-0" viewBox="0 0 14 10" fill="none">
      <path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Main ChatDrawer ────────────────────────────────────────────────────────────

export default function ChatDrawer({ user, initialEmail, onClose }) {
  const { t } = useTranslation();
  const [usersMap,       setUsersMap]       = useState({});
  const [conversations,  setConversations]  = useState([]);
  const [selectedChat,   setSelectedChat]   = useState(initialEmail || null);
  const [messages,       setMessages]       = useState([]);
  const [newMsg,         setNewMsg]         = useState('');
  const [editingId,      setEditingId]      = useState(null);
  const [editText,       setEditText]       = useState('');
  const [openMenuId,     setOpenMenuId]     = useState(null);
  const [menuPos,        setMenuPos]        = useState({ top: 0, right: 0 });
  const [showList,       setShowList]       = useState(false);
  const [sending,        setSending]        = useState(false);
  const [visible,        setVisible]        = useState(false);

  const msgBoxRef    = useRef();
  const inputRef     = useRef();
  const convPollRef  = useRef();
  const msgPollRef   = useRef();

  // Animate in
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // ── Users map ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const data = await fetch(`${API}/users/public`).then(r => r.json());
      if (Array.isArray(data)) {
        const m = {};
        data.forEach(u => { if (u.email) m[u.email.toLowerCase()] = u; });
        setUsersMap(m);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel('chatdrawer-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  // ── Conversations ──────────────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const data = await fetch(`${API}/messages/conversations/${encodeURIComponent(user.email)}`).then(r => r.json());
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, [user.email]);

  useEffect(() => {
    fetchConvs();
    convPollRef.current = setInterval(fetchConvs, 60000);
    return () => clearInterval(convPollRef.current);
  }, [fetchConvs]);

  // ── Messages ───────────────────────────────────────────────────────────────
  const fetchMsgs = useCallback(async (email) => {
    try {
      const data = await fetch(`${API}/messages/${encodeURIComponent(user.email)}/${encodeURIComponent(email)}`).then(r => r.json());
      if (Array.isArray(data)) setMessages(data);
      fetch(`${API}/messages/read/${encodeURIComponent(email)}/${encodeURIComponent(user.email)}`, { method: 'PATCH' });
    } catch {}
  }, [user.email]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMsgs(selectedChat);
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => fetchMsgs(selectedChat), 60000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, fetchMsgs]);

  // Realtime: instant updates for new messages / conversation list
  useRealtimeChannel(user?.email, {
    new_message: useCallback(() => {
      fetchConvs();
      if (selectedChat) fetchMsgs(selectedChat);
    }, [fetchConvs, fetchMsgs, selectedChat]),
  });

  // Scroll to bottom
  useEffect(() => {
    const box = msgBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  // Focus input when chat selected
  useEffect(() => {
    if (selectedChat) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selectedChat]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function sendMsg() {
    const content = newMsg.trim();
    if (!content || !selectedChat || sending) return;
    setSending(true);
    setNewMsg('');
    try {
      await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail: user.email, receiverEmail: selectedChat, content }),
      });
      await Promise.all([fetchMsgs(selectedChat), fetchConvs()]);
    } catch {}
    setSending(false);
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

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const getU       = email => usersMap[email?.toLowerCase()] || null;
  const otherUser  = selectedChat ? getU(selectedChat) : null;
  const otherStat  = otherUser ? getOnlineStatus(otherUser.last_seen) : { online: false, text: 'Hors ligne' };
  const unread     = conversations.filter(c => !c.is_read && c.sender_email !== user.email?.toLowerCase()).length;

  const hasConvWith = conversations.some(c => c.other_email === selectedChat?.toLowerCase());

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[300] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 z-[301] flex flex-col w-full max-w-[420px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {selectedChat ? (
            <>
              <button onClick={() => setSelectedChat(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <Avi user={otherUser || { email: selectedChat }} size="md" online={otherStat.online} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {otherUser?.name || selectedChat}
                </p>
                <p className={`text-[11px] font-semibold ${otherStat.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {otherStat.text}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('msg.page_title')}
                  {unread > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">{unread}</span>
                  )}
                </h2>
              </div>
            </>
          )}
          <button onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        {selectedChat ? (

          /* ── Chat view ── */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* First message hint — shown when no history yet */}
            {!hasConvWith && messages.length === 0 && (
              <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl px-4 py-3 text-center">
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {t('chd.conv_start_with')} <span className="font-bold">{otherUser?.name || selectedChat}</span>
                  </p>
                  <p className="text-[10px] text-indigo-400 mt-0.5">{t('chd.private_secure')}</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={msgBoxRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-[2px] bg-slate-50 dark:bg-slate-950"
              onClick={() => setOpenMenuId(null)}>

              {messages.length === 0 && hasConvWith && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="flex justify-center mb-2">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p className="text-xs font-semibold">{t('msg.start_chat')}</p>
                </div>
              )}

              {messages.map((m, idx) => {
                const isMine   = m.sender_email === user.email?.toLowerCase();
                const prev     = messages[idx - 1];
                const next     = messages[idx + 1];
                const samePrev = prev && prev.sender_email === m.sender_email && (new Date(m.created_at) - new Date(prev.created_at)) < 120000;
                const sameNext = next && next.sender_email === m.sender_email && (new Date(next.created_at) - new Date(m.created_at)) < 120000;
                const isFirst  = !samePrev;
                const isLast   = !sameNext;
                const isEditing = editingId === m.id;
                const isMenuOpen = openMenuId === m.id;

                const br = isMine
                  ? `rounded-2xl ${isFirst ? 'rounded-tr-md' : ''} ${isLast ? 'rounded-br-md' : ''}`
                  : `rounded-2xl ${isFirst ? 'rounded-tl-md' : ''} ${isLast ? 'rounded-bl-md' : ''}`;

                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-[2px]'}`}>

                    {!isMine && (
                      <div className={`mr-1.5 self-end mb-1 ${!isLast ? 'opacity-0 pointer-events-none' : ''}`}>
                        <Avi user={otherUser || { email: selectedChat }} size="sm" />
                      </div>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[78%]`}>

                      {!isMine && isFirst && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 ml-1">
                          {otherUser?.name?.split(' ')[0] || selectedChat}
                        </p>
                      )}

                      {isEditing ? (
                        <div className="flex gap-1.5 items-center w-full min-w-[200px]">
                          <input autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') editMsg(m.id, editText);
                              if (e.key === 'Escape') { setEditingId(null); setOpenMenuId(null); }
                            }}
                            className="flex-1 text-sm rounded-xl border-2 border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 focus:outline-none" />
                          <button onClick={() => editMsg(m.id, editText)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </button>
                          <button onClick={() => { setEditingId(null); setOpenMenuId(null); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ) : (
                        <button onClick={e => {
                            if (!isMine) return;
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            setOpenMenuId(isMenuOpen ? null : m.id);
                            setEditingId(null);
                          }}
                          className={`text-sm px-3.5 py-2 shadow-sm text-left break-words leading-relaxed ${isMine ? 'cursor-pointer' : 'cursor-default'} ${br} ${
                            isMine
                              ? `bg-indigo-600 text-white ${isMenuOpen ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''}`
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700'
                          }`}>
                          {m.content}
                        </button>
                      )}

                      {!isEditing && (
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          {m.edited_at && <span className="text-[9px] text-slate-400 italic">{t('adm.edited')}</span>}
                          <span className="text-[9px] text-slate-400 tabular-nums">
                            {formatTime(m.edited_at || m.created_at)}
                          </span>
                          {isMine && isLast && <ReadTick read={m.is_read} online={otherStat.online} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Context menu */}
            {openMenuId && (() => {
              const msg = messages.find(m => m.id === openMenuId);
              if (!msg) return null;
              const canDelete = Date.now() - new Date(msg.created_at).getTime() < 3600000;
              return (
                <div className="fixed z-[400] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden min-w-[150px]"
                  style={{ top: menuPos.top, right: menuPos.right }}
                  onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(openMenuId); setEditText(msg.content); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors text-left">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('chd.edit')}
                  </button>
                  {canDelete && (
                    <button onClick={() => deleteMsg(openMenuId)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      {t('chd.delete')}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-end shrink-0">
              <input ref={inputRef}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                onClick={() => setOpenMenuId(null)}
                placeholder={t('chd.message_to', { name: otherUser?.name?.split(' ')[0] || '…' })}
                className="flex-1 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button onClick={sendMsg} disabled={!newMsg.trim() || sending}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full transition-all shrink-0 shadow-sm shadow-indigo-500/30">
                <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>

        ) : (

          /* ── Conversations list ── */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* New conversation hint */}
            {initialEmail && !conversations.some(c => c.other_email === initialEmail.toLowerCase()) && (() => {
              const freelancer = usersMap[initialEmail.toLowerCase()];
              const st = freelancer ? getOnlineStatus(freelancer.last_seen) : null;
              return (
                <button onClick={() => setSelectedChat(initialEmail.toLowerCase())}
                  className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left">
                  <Avi user={freelancer || { email: initialEmail }} size="md" online={st?.online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">
                      {freelancer?.name || initialEmail}
                    </p>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400">{t('chd.start_conversation')}</p>
                  </div>
                </button>
              );
            })()}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4 py-12 text-center">
                  <div className="flex justify-center mb-3">
                    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">{t('msg.no_convs')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('chd.click_above')}</p>
                </div>
              )}

              {conversations.map(conv => {
                const other   = getU(conv.other_email);
                const st      = getOnlineStatus(other?.last_seen);
                const isUnread = !conv.is_read && conv.sender_email !== user.email?.toLowerCase();
                const isActive = selectedChat === conv.other_email;

                return (
                  <button key={conv.other_email}
                    onClick={() => setSelectedChat(conv.other_email)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800/50 ${
                      isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500' : ''
                    }`}>
                    <Avi user={other || { email: conv.other_email }} size="md" online={st.online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
                          {other?.name || conv.other_email}
                        </p>
                        <span className={`text-[9px] shrink-0 ${st.online ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                          {st.online ? t('msg.online') : st.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isUnread && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />}
                        <p className={`text-[10px] truncate ${isUnread ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                          {conv.last_message}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
