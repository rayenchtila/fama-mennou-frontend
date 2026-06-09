import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API          = 'https://famamennou-server.onrender.com/api';
const ADMIN_EMAIL  = 'admin@famamennou.com';
const ADMIN_NAME   = 'Fama Mennou TEAM';
const REACTIONS    = ['👍','❤️','😂','😮','😢','😡'];
const COLORS       = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500','bg-violet-500','bg-teal-500'];

function avatarColor(e) { return COLORS[(e?.charCodeAt(0) ?? 0) % COLORS.length]; }

function onlineStatus(lastSeen) {
  if (!lastSeen) return { online: false, label: 'Offline' };
  const m = Math.floor((Date.now() - new Date(lastSeen)) / 60000);
  if (m < 3)  return { online: true,  label: 'Active now' };
  if (m < 60) return { online: false, label: `Active ${m}m ago` };
  const h = Math.floor(m / 60);
  if (h < 24) return { online: false, label: `Active ${h}h ago` };
  return { online: false, label: `Active ${Math.floor(h / 24)}d ago` };
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtConvTime(ts) {
  const d = new Date(ts), h = (Date.now() - d) / 3600000;
  if (h < 24)  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (h < 168) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── UserAvatar ─────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'md', online }) {
  const sz  = { xl: 'w-14 h-14 text-lg', lg: 'w-11 h-11', md: 'w-10 h-10 text-sm', sm: 'w-8 h-8 text-xs' }[size] || 'w-10 h-10 text-sm';
  const dot = size === 'sm' ? 'w-2.5 h-2.5 border-[1.5px]' : 'w-3 h-3 border-2';
  return (
    <div className="relative shrink-0">
      {user?.photo
        ? <img src={user.photo} alt={user?.name || ''} className={`${sz} rounded-full object-cover`} />
        : <div className={`${sz} ${avatarColor(user?.email)} rounded-full flex items-center justify-center text-white font-bold`}>
            {(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}
          </div>
      }
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-white dark:border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
      )}
    </div>
  );
}

// ── TypingDots ─────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-sm w-fit">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── ImageViewer ────────────────────────────────────────────────────────────────

function ImageViewer({ src, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/96 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={e => e.stopPropagation()}>
        <a href={src} download target="_blank" rel="noreferrer"
          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </a>
        <button onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <motion.img
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        src={src} alt="Full size"
        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MessengerChat({ currentUser, allUsers = [], initialChat = null }) {
  const senderEmail = currentUser?.isAdmin ? ADMIN_EMAIL : (currentUser?.email || '');

  // mobile: 'list' | 'chat' — single-panel toggle on small screens
  const [mobileSide, setMobileSide] = useState(initialChat ? 'chat' : 'list');

  const [conversations, setConversations] = useState([]);
  const [selectedChat,  setSelectedChat]  = useState(initialChat || null);
  const [messages,      setMessages]      = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [replyTo,       setReplyTo]       = useState(null);
  const [stagedFile,    setStagedFile]    = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [otherTyping,   setOtherTyping]   = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);
  const [viewerSrc,     setViewerSrc]     = useState(null);
  const [hoveredMsg,    setHoveredMsg]    = useState(null);
  const [showEmojiFor,  setShowEmojiFor]  = useState(null);
  const [openMenuId,    setOpenMenuId]    = useState(null);
  const [menuPos,       setMenuPos]       = useState({ top: 0, left: 0 });
  const [editingId,     setEditingId]     = useState(null);
  const [editText,      setEditText]      = useState('');
  const [editStagedFile,setEditStagedFile]= useState(null);
  const [showPicker,    setShowPicker]    = useState(false);
  const [pickerSearch,  setPickerSearch]  = useState('');
  const [convSearch,    setConvSearch]    = useState('');
  const [forwardMsg,    setForwardMsg]    = useState(null);
  const [fwdSearch,     setFwdSearch]     = useState('');

  const endRef           = useRef();
  const msgsContainerRef = useRef();   // scroll container
  const userScrolledUp   = useRef(false);  // true when user has scrolled away from bottom
  const prevMsgCount     = useRef(0);      // to detect genuinely new messages
  const inputRef      = useRef();
  const fileRef       = useRef();
  const editFileRef   = useRef();
  const msgPollRef    = useRef();
  const convPollRef   = useRef();
  const typingPollRef = useRef();
  const typingTimer   = useRef();
  const dragCounter   = useRef(0);

  // user lookup
  const usersMap = {};
  (allUsers || []).forEach(u => { if (u?.email) usersMap[u.email.toLowerCase()] = u; });

  function resolveUser(email) {
    if (!email) return null;
    const e = email.toLowerCase();
    if (e === ADMIN_EMAIL) return { name: ADMIN_NAME, email: ADMIN_EMAIL, photo: null, role: 'admin' };
    return usersMap[e] || { name: e.split('@')[0], email: e, photo: null, role: 'user' };
  }

  // ── Conversations ────────────────────────────────────────────────────────────

  const loadConvs = useCallback(async () => {
    try {
      const url = currentUser?.isAdmin
        ? `${API}/messages/admin/conversations`
        : `${API}/messages/conversations/${encodeURIComponent(senderEmail)}`;
      const data = await fetch(url).then(r => r.json());
      if (Array.isArray(data)) setConversations(data);
    } catch {}
  }, [currentUser?.isAdmin, senderEmail]);

  useEffect(() => {
    loadConvs();
    convPollRef.current = setInterval(loadConvs, 4000);
    return () => clearInterval(convPollRef.current);
  }, [loadConvs]);

  // React to initialChat prop changes (e.g. navigating to ?with=email while component is mounted)
  useEffect(() => {
    if (initialChat) {
      setSelectedChat(initialChat.toLowerCase());
      setMobileSide('chat');
    }
  }, [initialChat]);

  // ── Messages ─────────────────────────────────────────────────────────────────

  const loadMsgs = useCallback(async (other) => {
    if (!other) return;
    try {
      const data = await fetch(
        `${API}/messages/${encodeURIComponent(senderEmail)}/${encodeURIComponent(other)}`
      ).then(r => r.json());
      if (Array.isArray(data)) {
        setMessages(data);
        fetch(`${API}/messages/read/${encodeURIComponent(other)}/${encodeURIComponent(senderEmail)}`, { method: 'PATCH' }).catch(() => {});
      }
    } catch {}
  }, [senderEmail]);

  useEffect(() => {
    if (!selectedChat) { setMessages([]); return; }
    loadMsgs(selectedChat);
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => loadMsgs(selectedChat), 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, loadMsgs]);

  // Smart scroll: only auto-scroll when user is already near the bottom
  // OR when a genuinely new message arrives (count increases)
  useEffect(() => {
    const newCount = messages.length;
    const isNewMessage = newCount > prevMsgCount.current;
    prevMsgCount.current = newCount;
    if (!userScrolledUp.current || isNewMessage) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (otherTyping && !userScrolledUp.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [otherTyping]);

  // Reset scroll tracking when switching conversations
  useEffect(() => {
    userScrolledUp.current = false;
    prevMsgCount.current = 0;
  }, [selectedChat]);

  // ── Typing ───────────────────────────────────────────────────────────────────

  const sendTypingSignal = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await fetch(`${API}/messages/typing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: senderEmail, to: selectedChat }),
      });
    } catch {}
  }, [selectedChat, senderEmail]);

  const stopTypingSignal = useCallback(async () => {
    try {
      await fetch(`${API}/messages/stop-typing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: senderEmail }),
      });
    } catch {}
  }, [senderEmail]);

  useEffect(() => {
    if (!selectedChat) { setOtherTyping(false); return; }
    const poll = async () => {
      try {
        const d = await fetch(
          `${API}/messages/is-typing?from=${encodeURIComponent(selectedChat)}&to=${encodeURIComponent(senderEmail)}`
        ).then(r => r.json());
        setOtherTyping(!!d.typing);
      } catch {}
    };
    poll();
    typingPollRef.current = setInterval(poll, 2000);
    return () => clearInterval(typingPollRef.current);
  }, [selectedChat, senderEmail]);

  function handleInputChange(e) {
    setNewMsg(e.target.value);
    sendTypingSignal();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTypingSignal, 3000);
  }

  // ── Outside clicks ───────────────────────────────────────────────────────────

  useEffect(() => {
    const h = e => {
      if (!e.target.closest('[data-picker]'))    setShowPicker(false);
      if (!e.target.closest('[data-menu]'))       setOpenMenuId(null);
      if (!e.target.closest('[data-emoji-pick]')) setShowEmojiFor(null);
      if (!e.target.closest('[data-msg-wrap]'))   setHoveredMsg(null);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  function onDragEnter(e) {
    e.preventDefault(); dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    if (--dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
  }
  function onDragOver(e)  { e.preventDefault(); }
  function onDrop(e) {
    e.preventDefault(); dragCounter.current = 0; setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) setStagedFile({ file: f, previewUrl: URL.createObjectURL(f) });
  }

  // ── File inputs ──────────────────────────────────────────────────────────────

  function handleFileSelect(e) {
    const f = e.target.files?.[0];
    if (f) setStagedFile({ file: f, previewUrl: URL.createObjectURL(f) });
    e.target.value = '';
  }

  function handleEditFileSelect(e) {
    const f = e.target.files?.[0];
    if (f) setEditStagedFile({ file: f, previewUrl: URL.createObjectURL(f) });
    e.target.value = '';
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  async function sendMsg() {
    if (!selectedChat || (!newMsg.trim() && !stagedFile)) return;
    const content = newMsg.trim(), replyToId = replyTo?.id || null;
    setNewMsg(''); setReplyTo(null);
    clearTimeout(typingTimer.current); stopTypingSignal();
    userScrolledUp.current = false; // snap to bottom after own send

    let attachmentUrl = null;
    if (stagedFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', stagedFile.file);
        const d = await fetch(`${API}/uploads/image`, { method: 'POST', body: fd }).then(r => r.json());
        attachmentUrl = d.secure_url || null;
      } catch {}
      setStagedFile(null); setUploading(false);
    }

    try {
      await fetch(`${API}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, receiverEmail: selectedChat, content, attachmentUrl, replyToId }),
      });
      loadMsgs(selectedChat); loadConvs();
    } catch {}
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  async function saveEdit() {
    if (!editingId || (!editText.trim() && !editStagedFile)) return;
    let attachmentUrl;
    if (editStagedFile) {
      try {
        const fd = new FormData();
        fd.append('file', editStagedFile.file);
        const d = await fetch(`${API}/uploads/image`, { method: 'POST', body: fd }).then(r => r.json());
        attachmentUrl = d.secure_url || undefined;
      } catch {}
      setEditStagedFile(null);
    }
    try {
      await fetch(`${API}/messages/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, content: editText, ...(attachmentUrl !== undefined ? { attachmentUrl } : {}) }),
      });
      setEditingId(null); setEditText('');
      loadMsgs(selectedChat);
    } catch {}
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function deleteMsg(id) {
    setOpenMenuId(null); setHoveredMsg(null);
    try {
      await fetch(`${API}/messages/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail }),
      });
      loadMsgs(selectedChat); loadConvs();
    } catch {}
  }

  // ── Forward ──────────────────────────────────────────────────────────────────

  async function forwardTo(targetEmail) {
    if (!forwardMsg || !targetEmail) return;
    try {
      await fetch(`${API}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail,
          receiverEmail: targetEmail,
          content: forwardMsg.content || '',
          attachmentUrl: forwardMsg.attachment_url || null,
        }),
      });
      loadConvs();
    } catch {}
    setForwardMsg(null); setFwdSearch(''); setOpenMenuId(null); setHoveredMsg(null);
  }

  // ── React ────────────────────────────────────────────────────────────────────

  async function reactMsg(id, emoji) {
    setShowEmojiFor(null); setHoveredMsg(null);
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m;
      const existing = m.reactions || {};
      const alreadyOnThis = (existing[emoji] || []).includes(senderEmail);
      // Build new reactions: remove user from all emojis first
      const r = {};
      for (const [k, arr] of Object.entries(existing)) {
        const filtered = (arr || []).filter(e => e !== senderEmail);
        if (filtered.length > 0) r[k] = filtered;
      }
      // Toggle-on only if they weren't already on this emoji
      if (!alreadyOnThis) {
        r[emoji] = [...(r[emoji] || []), senderEmail];
      }
      return { ...m, reactions: r };
    }));
    try {
      await fetch(`${API}/messages/${id}/react`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: senderEmail, emoji }),
      });
    } catch {}
  }

  function copyMsg(content) {
    navigator.clipboard.writeText(content || '').catch(() => {});
    setOpenMenuId(null);
  }

  // ── Select conversation ───────────────────────────────────────────────────────

  function selectChat(email) {
    if (!email || email === selectedChat) return;
    setSelectedChat(email);
    setMobileSide('chat');
    setMessages([]);
    setNewMsg(''); setReplyTo(null); setStagedFile(null);
    setEditingId(null); setEditText('');
    setOtherTyping(false); setHoveredMsg(null);
    setOpenMenuId(null); setShowEmojiFor(null);
  }

  // ── Context menu position (clamped to viewport) ───────────────────────────────

  function openContextMenu(e, msgId) {
    e.stopPropagation();
    const rect  = e.currentTarget.getBoundingClientRect();
    const top   = Math.min(rect.bottom + 4, window.innerHeight - 180);
    // On mobile, anchor to left so menu doesn't clip off right edge
    const left  = window.innerWidth < 640
      ? Math.max(8, Math.min(rect.left, window.innerWidth - 180))
      : undefined;
    const right = window.innerWidth >= 640
      ? Math.max(8, window.innerWidth - rect.right)
      : undefined;
    setMenuPos({ top, left, right });
    setOpenMenuId(openMenuId === msgId ? null : msgId);
  }

  // ── Message group builder ─────────────────────────────────────────────────────

  function buildGroups(msgs) {
    const groups = [];
    let cur = null;
    for (const m of msgs) {
      const gap  = cur ? (new Date(m.created_at) - new Date(cur.messages[cur.messages.length - 1].created_at)) : Infinity;
      const same = cur && cur.sender === m.sender_email && gap < 120000;
      if (same) cur.messages.push(m);
      else { cur = { sender: m.sender_email, messages: [m] }; groups.push(cur); }
    }
    return groups;
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const convLc        = convSearch.toLowerCase();
  const filteredConvs = conversations.filter(c => {
    const u = resolveUser(c.other_email);
    const n = (u?.name || c.other_email || '').toLowerCase();
    return n.includes(convLc) || (c.other_email || '').toLowerCase().includes(convLc);
  });

  const basePickerUsers = (allUsers || []).filter(u => u?.email && u.email.toLowerCase() !== senderEmail.toLowerCase());
  const pickerItems = currentUser?.isAdmin
    ? basePickerUsers
    : [{ name: ADMIN_NAME, email: ADMIN_EMAIL, photo: null, role: 'admin' }, ...basePickerUsers.filter(u => u.email.toLowerCase() !== ADMIN_EMAIL)];
  const filteredPicker = pickerItems.filter(u => {
    if (!pickerSearch) return true;
    const q = pickerSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  }).slice(0, 40);

  const otherUser   = selectedChat ? resolveUser(selectedChat) : null;
  const otherStatus = onlineStatus(otherUser?.last_seen || otherUser?.lastSeen);
  const groups      = buildGroups(messages);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-full bg-white dark:bg-slate-900 overflow-hidden rounded-none md:rounded-2xl md:shadow-2xl md:border border-0 border-slate-200 dark:border-slate-800"
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >

      {/* ══ LEFT PANEL: Conversations ══════════════════════════════════════════ */}
      <div className={`
        flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900
        w-full md:w-72 md:shrink-0
        ${mobileSide === 'chat' ? 'hidden md:flex' : 'flex'}
      `}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Messages</h2>
            <button data-picker
              onClick={() => { setShowPicker(p => !p); setPickerSearch(''); }}
              className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              title="New conversation"
            >
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </div>

          {/* New conversation picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div data-picker
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="absolute left-4 right-4 top-[72px] z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                    placeholder="Search users…" autoFocus
                    className="w-full text-sm bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto overscroll-contain">
                  {filteredPicker.map(u => (
                    <button key={u.email}
                      onClick={() => { selectChat(u.email); setShowPicker(false); setPickerSearch(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <UserAvatar user={u} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name || u.email}</p>
                        <p className="text-xs text-slate-400 truncate capitalize">{u.role || 'user'}</p>
                      </div>
                    </button>
                  ))}
                  {filteredPicker.length === 0 && (
                    <p className="px-4 py-6 text-sm text-slate-400 text-center">No users found</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input value={convSearch} onChange={e => setConvSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4 space-y-0.5">
          {filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          )}
          {filteredConvs.map(conv => {
            const u      = resolveUser(conv.other_email);
            const status = onlineStatus(conv.user_last_seen || u?.last_seen || u?.lastSeen);
            const unread = Number(conv.unread_count || 0);
            const active = selectedChat === conv.other_email;
            return (
              <button key={conv.other_email} onClick={() => selectChat(conv.other_email)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors active:bg-indigo-100 dark:active:bg-indigo-900/30 ${
                  active ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <UserAvatar user={u} size="md" online={status.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                      {u?.name || conv.other_email}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{fmtConvTime(conv.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className={`text-xs truncate flex-1 ${unread > 0 ? 'font-medium text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                      {conv.sender_email === senderEmail ? 'You: ' : ''}{conv.last_message || '📷 Photo'}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] bg-indigo-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ RIGHT PANEL ════════════════════════════════════════════════════════ */}

      {/* Empty state — only visible when no chat on desktop, or on mobile list side */}
      {!selectedChat && (
        <div className={`flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/40 gap-4 hidden md:flex`}>
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">Your messages</p>
            <p className="text-sm text-slate-400 mt-1">Select a conversation or start a new one</p>
          </div>
        </div>
      )}

      {selectedChat && (
        <div className={`
          flex-1 flex-col min-w-0 relative
          ${mobileSide === 'list' ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-indigo-500/10 border-2 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-slate-800 rounded-2xl px-8 py-6 shadow-xl text-center">
                <p className="text-3xl mb-2">📸</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">Drop to send image</p>
              </div>
            </div>
          )}

          {/* Chat header */}
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            {/* Back button — mobile only */}
            <button
              onClick={() => setMobileSide('list')}
              className="md:hidden w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <UserAvatar user={otherUser} size="md" online={otherStatus.online} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                {otherUser?.name || selectedChat}
              </p>
              <p className={`text-xs font-medium ${otherStatus.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                {otherTyping ? <span className="text-indigo-500 animate-pulse">typing…</span> : otherStatus.label}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={msgsContainerRef}
            onScroll={() => {
              const el = msgsContainerRef.current;
              if (!el) return;
              userScrolledUp.current = (el.scrollHeight - el.scrollTop - el.clientHeight) > 80;
            }}
            className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 space-y-1 bg-slate-50/80 dark:bg-slate-950/40"
          >
            {groups.map((group, gi) => {
              const isMine    = group.sender === senderEmail;
              const groupUser = isMine
                ? (currentUser?.isAdmin ? { name: ADMIN_NAME, email: ADMIN_EMAIL, photo: null } : currentUser)
                : resolveUser(group.sender);

              return (
                <div key={gi} className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'} mb-1`}>
                  {group.messages.map((m, mi) => {
                    const isFirst   = mi === 0;
                    const isLast    = mi === group.messages.length - 1;
                    const isEditing = editingId === m.id;
                    const reactions = m.reactions || {};
                    const hasReact  = Object.keys(reactions).some(k => (reactions[k] || []).length > 0);

                    const bubbleRound = isMine
                      ? `rounded-2xl ${isFirst ? 'rounded-tr-sm' : ''} ${isLast ? 'rounded-br-sm' : ''}`
                      : `rounded-2xl ${isFirst ? 'rounded-tl-sm' : ''} ${isLast ? 'rounded-bl-sm' : ''}`;

                    return (
                      <div key={m.id}
                        className={`flex items-end gap-1 sm:gap-2 w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar slot for received messages */}
                        {!isMine && (
                          <div className="w-7 sm:w-8 shrink-0 self-end mb-0.5">
                            {isLast && <UserAvatar user={groupUser} size="sm" />}
                          </div>
                        )}

                        {/* Message wrapper */}
                        <div
                          data-msg-wrap
                          className={`relative group max-w-[75%] sm:max-w-[68%]`}
                          onMouseEnter={() => setHoveredMsg(m.id)}
                          onMouseLeave={() => {
                            if (showEmojiFor === m.id || openMenuId === m.id) return;
                            setHoveredMsg(null);
                          }}
                          onClick={e => {
                            // Toggle action bar on tap (mobile) — close other UI first
                            setShowPicker(false);
                            setOpenMenuId(null);
                            setShowEmojiFor(null);
                            setHoveredMsg(hoveredMsg === m.id ? null : m.id);
                            e.stopPropagation();
                          }}
                        >
                          {/* Hover / tap action bar */}
                          <AnimatePresence>
                            {hoveredMsg === m.id && !isEditing && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                                className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-9 flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 px-1.5 py-1 z-30`}
                                onClick={e => e.stopPropagation()}
                              >
                                {/* React */}
                                <button data-emoji-pick
                                  onClick={e => { e.stopPropagation(); setShowEmojiFor(showEmojiFor === m.id ? null : m.id); }}
                                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-base transition-colors">
                                  😊
                                </button>
                                {/* Reply */}
                                <button onClick={e => { e.stopPropagation(); setReplyTo(m); setHoveredMsg(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                                  </svg>
                                </button>
                                {/* More — own messages */}
                                {isMine && (
                                  <button data-menu
                                    onClick={e => openContextMenu(e, m.id)}
                                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01"/>
                                    </svg>
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Emoji reaction picker */}
                          <AnimatePresence>
                            {showEmojiFor === m.id && (
                              <motion.div data-emoji-pick
                                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-16 flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 px-2 py-1.5 z-40`}
                                style={{ minWidth: 'max-content' }}
                                onClick={e => e.stopPropagation()}
                              >
                                {REACTIONS.map(emoji => (
                                  <button key={emoji} onClick={() => reactMsg(m.id, emoji)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-all hover:scale-125 active:scale-110 ${(reactions[emoji] || []).includes(senderEmail) ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''}`}>
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Editing mode */}
                          {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[200px]" onClick={e => e.stopPropagation()}>
                              {m.attachment_url && (
                                <div className="relative w-fit">
                                  <img src={editStagedFile?.previewUrl || m.attachment_url} alt="" className="w-28 h-28 object-cover rounded-xl" />
                                  <button onClick={() => editFileRef.current?.click()}
                                    className="absolute bottom-1 right-1 bg-black/65 hover:bg-black/80 text-white text-xs rounded-lg px-2 py-0.5 transition-colors">
                                    Replace
                                  </button>
                                  <input type="file" accept="image/*" ref={editFileRef} className="hidden" onChange={handleEditFileSelect} />
                                </div>
                              )}
                              <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                                  if (e.key === 'Escape') { setEditingId(null); setEditText(''); setEditStagedFile(null); }
                                }}
                                className="text-sm px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none ring-2 ring-indigo-300 dark:ring-indigo-800 w-full"
                              />
                              <div className="flex items-center gap-3 text-xs px-1">
                                <button onClick={saveEdit} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Save</button>
                                <button onClick={() => { setEditingId(null); setEditText(''); setEditStagedFile(null); }} className="text-slate-400 hover:underline">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Bubble */}
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className={`
                                  ${bubbleRound}
                                  ${m.attachment_url && !m.content ? 'p-1' : 'px-3 sm:px-3.5 py-2 sm:py-2.5'}
                                  shadow-sm text-sm
                                  ${isMine
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700'
                                  }
                                `}
                              >
                                {/* Reply preview */}
                                {m.reply_to_id && (
                                  <div className={`mb-2 pl-2.5 border-l-[3px] rounded-lg pr-2 py-1 ${isMine ? 'border-white/40 bg-white/10' : 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'}`}>
                                    <p className={`text-[11px] font-bold mb-0.5 ${isMine ? 'text-white/80' : 'text-indigo-500'}`}>
                                      {resolveUser(m.reply_sender)?.name || m.reply_sender || 'Reply'}
                                    </p>
                                    <p className={`text-xs truncate ${isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {m.reply_attachment_url ? '📷 Photo' : (m.reply_content || '')}
                                    </p>
                                  </div>
                                )}
                                {/* Image */}
                                {m.attachment_url && (
                                  <img src={m.attachment_url} alt="Photo"
                                    className={`max-w-[220px] sm:max-w-[260px] w-full object-cover rounded-xl block cursor-zoom-in ${m.content ? 'mb-2' : ''}`}
                                    onClick={e => { e.stopPropagation(); setViewerSrc(m.attachment_url); }}
                                  />
                                )}
                                {/* Text */}
                                {m.content && <span className="break-words leading-relaxed whitespace-pre-wrap">{m.content}</span>}
                              </motion.div>

                              {/* Time + receipt */}
                              {isLast && (
                                <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {m.edited_at && <span className="text-[10px] text-slate-400 italic">edited ·</span>}
                                  <span className="text-[10px] text-slate-400 tabular-nums">{fmtTime(m.created_at)}</span>
                                  {isMine && (
                                    m.is_read
                                      ? <svg className="w-4 h-4 text-indigo-400 shrink-0" viewBox="0 0 20 10" fill="none"><path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      : <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 14 10" fill="none"><path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  )}
                                </div>
                              )}

                              {/* Reaction pills */}
                              {hasReact && (
                                <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {Object.entries(reactions).filter(([, a]) => (a || []).length > 0).map(([emoji, arr]) => {
                                    const mine = arr.includes(senderEmail);
                                    return (
                                      <button key={emoji}
                                        onClick={e => { e.stopPropagation(); reactMsg(m.id, emoji); }}
                                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm transition-colors ${
                                          mine
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}>
                                        {emoji} <span>{arr.length}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {isMine && <div className="w-7 sm:w-8 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherTyping && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2">
                <div className="w-7 sm:w-8 shrink-0 self-end mb-0.5">
                  <UserAvatar user={otherUser} size="sm" />
                </div>
                <TypingDots />
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Context menu — fixed, clamped to viewport */}
          {openMenuId && (() => {
            const msg     = messages.find(x => x.id === openMenuId);
            if (!msg) return null;
            const canEdit   = msg.sender_email === senderEmail;
            const canDelete = canEdit && (Date.now() - new Date(msg.created_at).getTime()) < 3600000;
            return (
              <div data-menu
                className="fixed z-[60] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden min-w-[170px] py-1"
                style={{ top: menuPos.top, ...(menuPos.left !== undefined ? { left: menuPos.left } : { right: menuPos.right }) }}
                onClick={e => e.stopPropagation()}
              >
                {/* Copy text (only if has text) */}
                {msg.content && (
                  <button onClick={() => copyMsg(msg.content)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy text
                  </button>
                )}
                {/* Forward — works for both text and images */}
                <button onClick={() => { setForwardMsg(msg); setFwdSearch(''); setOpenMenuId(null); setHoveredMsg(null); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Forward
                </button>
                {/* Edit — same for text and image */}
                {canEdit && (
                  <button onClick={() => { setEditingId(openMenuId); setEditText(msg.content || ''); setEditStagedFile(null); setOpenMenuId(null); setHoveredMsg(null); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                  </button>
                )}
                {/* Delete — same for text and image */}
                {canDelete && (
                  <button onClick={() => deleteMsg(openMenuId)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── Forward dialog ────────────────────────────────────────────── */}
          {forwardMsg && (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => { setForwardMsg(null); setFwdSearch(''); }}>
              <div className="w-full sm:w-96 bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">Forward message</span>
                  <button onClick={() => { setForwardMsg(null); setFwdSearch(''); }}
                    className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                {/* Preview of what's being forwarded */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  {forwardMsg.attachment_url && (
                    <img src={forwardMsg.attachment_url} alt="" className="w-12 h-12 object-cover rounded-lg mb-1"/>
                  )}
                  {forwardMsg.content && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{forwardMsg.content}</p>
                  )}
                </div>
                {/* Search */}
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <input autoFocus value={fwdSearch} onChange={e => setFwdSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"/>
                </div>
                {/* Recipients list */}
                <div className="overflow-y-auto flex-1">
                  {(() => {
                    const q = fwdSearch.trim().toLowerCase();
                    // Build unified list: conversations first, then allUsers not already in convs
                    const convEmails = new Set(convs.map(c => c.other_email));
                    const convItems = convs.map(c => ({
                      email: c.other_email,
                      name: c.user_name || c.other_email,
                      photo: c.user_photo,
                    }));
                    const extraUsers = (allUsers || []).filter(u => !convEmails.has(u.email) && u.email !== senderEmail).map(u => ({
                      email: u.email,
                      name: u.name || u.email,
                      photo: u.photo,
                    }));
                    const all = [...convItems, ...extraUsers].filter(u =>
                      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                    );
                    if (all.length === 0) return (
                      <p className="text-center text-sm text-slate-400 py-8">No results</p>
                    );
                    return all.map(u => (
                      <button key={u.email} onClick={() => forwardTo(u.email)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                        {u.photo
                          ? <img src={u.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0"/>
                          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ background: `hsl(${[...u.email].reduce((a,c)=>a+c.charCodeAt(0),0)%360},55%,50%)` }}>
                              {u.name[0]?.toUpperCase()}
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                        <svg className="w-4 h-4 text-indigo-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">

            {/* Reply banner */}
            {replyTo && (
              <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 pb-0">
                <div className="flex-1 pl-3 border-l-[3px] border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 pr-3 py-1.5 rounded-lg min-w-0">
                  <p className="text-xs font-bold text-indigo-500 truncate">
                    {resolveUser(replyTo.sender_email)?.name || replyTo.sender_email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {replyTo.attachment_url && !replyTo.content ? '📷 Photo' : replyTo.content}
                  </p>
                </div>
                <button onClick={() => setReplyTo(null)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Staged image preview */}
            {stagedFile && (
              <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 pb-0">
                <div className="relative">
                  <img src={stagedFile.previewUrl} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl ring-2 ring-indigo-300" />
                  <button onClick={() => setStagedFile(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold transition-colors shadow">
                    ×
                  </button>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Uploading…
                  </div>
                )}
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5">
              {/* Image button */}
              <button onClick={() => fileRef.current?.click()}
                className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors mb-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFileSelect} />

              {/* Textarea */}
              <textarea ref={inputRef} value={newMsg} onChange={handleInputChange} rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Message…"
                className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 sm:px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none overflow-y-auto leading-relaxed"
                style={{ minHeight: 40, maxHeight: 100 }}
              />

              {/* Send */}
              <button onClick={sendMsg} disabled={uploading || (!newMsg.trim() && !stagedFile)}
                className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center mb-0.5 transition-all ${
                  newMsg.trim() || stagedFile
                    ? 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}>
                {uploading
                  ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen image viewer */}
      <AnimatePresence>
        {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
      </AnimatePresence>
    </div>
  );
}
