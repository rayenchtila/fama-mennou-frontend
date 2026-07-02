import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRealtimeChannel } from '../lib/useRealtimeChannel';
import { cldImg } from '../utils/cloudinary';

const API          = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
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
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Tunis' });
}

function fmtDateSeparator(ts) {
  const d = new Date(ts);
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit', timeZone: 'Africa/Tunis' });
  const month = d.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'Africa/Tunis' });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  const time = fmtTime(ts);
  return `Le ${day} ${monthCap}, ${time}`;
}

function fmtConvTime(ts) {
  const d = new Date(ts), h = (Date.now() - d) / 3600000;
  if (h < 24)  return fmtTime(ts);
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
        ? <img src={cldImg(user.photo)} alt={user?.name || ''} className={`${sz} rounded-full object-cover`} />
        : <div className={`${sz} ${avatarColor(user?.email)} rounded-full flex items-center justify-center text-white font-bold`}>
            {(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}
          </div>
      }
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full`}
          style={{ background: online ? '#10b981' : '#3f3f5e', border: '2px solid #15132e' }} />
      )}
    </div>
  );
}

// ── TypingDots ─────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm w-fit" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)' }}>
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-2 h-2 rounded-full block" style={{ background: '#9b8cff' }}
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
  const { t } = useTranslation();
  const senderEmail = currentUser?.isAdmin ? ADMIN_EMAIL : (currentUser?.email || '');

  // mobile: 'list' | 'chat' — single-panel toggle on small screens
  const [mobileSide, setMobileSide] = useState(initialChat ? 'chat' : 'list');

  const [conversations, setConversations] = useState([]);
  const [selectedChat,  setSelectedChat]  = useState(initialChat || null);
  const [messages,      setMessages]      = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [replyTo,       setReplyTo]       = useState(null);
  const [lockError,     setLockError]     = useState('');
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
  const [showPicker,    setShowPicker]    = useState(false);  // kept for legacy click-outside handler
  const [pickerSearch,  setPickerSearch]  = useState('');    // unused — merged into convSearch
  const [convSearch,    setConvSearch]    = useState('');
  const [forwardMsg,    setForwardMsg]    = useState(null);
  const [fwdSearch,     setFwdSearch]     = useState('');
  const [showAttachMenu,setShowAttachMenu]= useState(false);

  // Admin-only: payment status panels for the selected conversation
  const [userCourseReq, setUserCourseReq] = useState(null);
  const [reqAmount,     setReqAmount]     = useState('');
  const [statusSaving,  setStatusSaving]  = useState(false);
  const [userProjects,  setUserProjects]  = useState([]);   // ALL projects for this freelancer
  const [projSavingId,  setProjSavingId]  = useState(null); // id of project currently saving
  // legacy aliases kept for compatibility
  const userProject = userProjects[0] || null;
  const projAmount  = userProject ? Number(userProject.amount || 0).toFixed(2) : '';

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
    convPollRef.current = setInterval(loadConvs, 60000);
    return () => clearInterval(convPollRef.current);
  }, [loadConvs]);

  // React to initialChat prop changes (e.g. navigating to ?with=email while component is mounted)
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    if (initialChat) {
      setSelectedChat(initialChat.toLowerCase());
      setMobileSide('chat');
    } else {
      setSelectedChat(null);
      setMobileSide('list');
      setMessages([]);
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
    msgPollRef.current = setInterval(() => loadMsgs(selectedChat), 60000);
    return () => clearInterval(msgPollRef.current);
  }, [selectedChat, loadMsgs]);

  // Realtime: instant updates for new messages, conversation list, and typing
  useRealtimeChannel(senderEmail, {
    new_message: useCallback(() => {
      loadConvs();
      if (selectedChat) loadMsgs(selectedChat);
    }, [loadConvs, loadMsgs, selectedChat]),
    typing: useCallback((payload) => {
      if (payload?.from === selectedChat) setOtherTyping(true);
    }, [selectedChat]),
    'stop-typing': useCallback((payload) => {
      if (payload?.from === selectedChat) setOtherTyping(false);
    }, [selectedChat]),
  });

  // Scroll: always jump instantly to last message — no visible scroll animation ever
  const isInitialLoad = useRef(true);
  useEffect(() => {
    const newCount = messages.length;
    const isNewMessage = newCount > prevMsgCount.current;
    prevMsgCount.current = newCount;
    if (!userScrolledUp.current || isNewMessage) {
      const snap = () => {
        const el = msgsContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      };
      // Double rAF for layout flush, then a 120ms timeout as fallback
      // (images in messages can delay the container's final scrollHeight)
      requestAnimationFrame(() => { requestAnimationFrame(snap); });
      setTimeout(snap, 120);
    }
    if (isInitialLoad.current && newCount > 0) isInitialLoad.current = false;
  }, [messages]);

  useEffect(() => {
    if (otherTyping && !userScrolledUp.current) {
      const el = msgsContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [otherTyping]);

  // Reset scroll tracking when switching conversations
  useEffect(() => {
    userScrolledUp.current = false;
    prevMsgCount.current = 0;
    isInitialLoad.current = true;
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
        body: JSON.stringify({ from: senderEmail, to: selectedChat }),
      });
    } catch {}
  }, [senderEmail, selectedChat]);

  // Typing state is driven entirely by Socket.io events (useRealtimeChannel above).
  // Reset when switching conversations so a stale "typing" badge doesn't persist.
  useEffect(() => {
    if (!selectedChat) setOtherTyping(false);
  }, [selectedChat]);

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
      if (!e.target.closest('[data-attach]'))     setShowAttachMenu(false);
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
      const res = await fetch(`${API}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, receiverEmail: selectedChat, content, attachmentUrl, replyToId }),
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setLockError(data.message || 'Le chat privé est disponible une fois qu\'un projet vous a été attribué.');
        setNewMsg(content);
        return;
      }
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
    setNewMsg(''); setReplyTo(null); setStagedFile(null); setLockError('');
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
    let prevTs = null;
    for (const m of msgs) {
      const gap  = cur ? (new Date(m.created_at) - new Date(cur.messages[cur.messages.length - 1].created_at)) : Infinity;
      const same = cur && cur.sender === m.sender_email && gap < 120000;
      const dayGap = prevTs ? (new Date(m.created_at) - prevTs) : Infinity;
      const showSeparator = dayGap >= 86400000;
      if (same && !showSeparator) cur.messages.push(m);
      else { cur = { sender: m.sender_email, messages: [m], showSeparator }; groups.push(cur); }
      prevTs = new Date(m.created_at);
    }
    return groups;
  }

  // ── Admin: course purchase & freelancer gains payment-status panels ──────────

  const fetchUserCourseReq = useCallback(async (email) => {
    if (!email) { setUserCourseReq(null); return; }
    try {
      const data = await fetch(`${API}/course-requests`).then(r => r.json());
      if (Array.isArray(data)) {
        const mine = data
          .filter(r => r.user_email === email.toLowerCase() && r.status !== 'rejected')
          .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
        const req = mine[0] || null;
        setUserCourseReq(req);
        setReqAmount(req ? Number(req.amount || 0).toFixed(2) : '');
      }
    } catch {}
  }, []);

  const fetchUserProject = useCallback(async (email) => {
    if (!email) { setUserProjects([]); return; }
    try {
      const data = await fetch(`${API}/projects/assigned/${encodeURIComponent(email)}`).then(r => r.json());
      if (Array.isArray(data)) {
        const mine = data
          .filter(p => p.freelancer_email === email.toLowerCase())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setUserProjects(mine);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser?.isAdmin || !selectedChat) { setUserCourseReq(null); setUserProjects([]); return; }
    fetchUserCourseReq(selectedChat);
    fetchUserProject(selectedChat);
  }, [currentUser?.isAdmin, selectedChat, fetchUserCourseReq, fetchUserProject]);

  async function setPaymentStatus(status) {
    if (!userCourseReq) return;
    setStatusSaving(true);
    try {
      await fetch(`${API}/course-requests/${userCourseReq.id}/payment-status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, montant: reqAmount === '' ? null : Number(reqAmount) }),
      });
      await fetchUserCourseReq(selectedChat);
      loadMsgs(selectedChat);
    } catch {}
    finally { setStatusSaving(false); }
  }

  async function setProjectPaymentStatus(status, projectId) {
    const proj = userProjects.find(p => p.id === projectId);
    if (!proj) return;
    setProjSavingId(projectId);
    try {
      await fetch(`${API}/projects/${projectId}/payment-status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, montant: Number(proj.amount || 0) }),
      });
      await fetchUserProject(selectedChat);
      loadMsgs(selectedChat);
    } catch {}
    finally { setProjSavingId(null); }
  }

  // ── Derived data ──────────────────────────────────────────────────────────────

  const convLc        = convSearch.toLowerCase();
  const filteredConvs = conversations.filter(c => {
    const u    = resolveUser(c.other_email);
    const name = (u?.name || c.user_name || '').toLowerCase();
    const mail = (c.other_email || '').toLowerCase();
    return !convLc || name.includes(convLc) || mail.includes(convLc);
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
      className="flex h-full overflow-hidden rounded-none md:rounded-2xl"
      style={{ background: '#16142e', border: '1px solid rgba(255,255,255,.09)', boxShadow: '0 32px 80px -8px rgba(0,0,0,.7), 0 0 0 1px rgba(124,108,246,.08)' }}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
    >

      {/* ══ LEFT PANEL: Conversations ══════════════════════════════════════════ */}
      <div
        className={`flex-col w-full md:w-72 md:shrink-0 ${mobileSide === 'chat' ? 'hidden md:flex' : 'flex'}`}
        style={{ borderRight: '1px solid rgba(255,255,255,.08)', background: '#15132e' }}
      >

        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7c6cf6,#3ec2e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -2px rgba(124,108,246,.4)' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color: '#fbfbff' }}>{t('msg.page_title')}</h2>
            </div>
            {conversations.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,108,246,0.15)', border: '1px solid rgba(124,108,246,0.25)', color: '#9b8cff' }}>
                {conversations.length}
              </span>
            )}
          </div>
          {/* Search — also discovers new users to chat with */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#62668a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input value={convSearch} onChange={e => setConvSearch(e.target.value)}
              placeholder={t('mgc.search_conversations')}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,.08)', color: '#f4f3fb' }}
              onFocus={e => { e.target.style.borderColor='rgba(124,108,246,0.4)'; e.target.style.background='rgba(124,108,246,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,.08)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4 space-y-0.5">
          {/* Existing conversations */}
          {filteredConvs.length === 0 && !convSearch && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10" style={{ color: 'rgba(255,255,255,.15)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="text-sm" style={{ color: '#7e82a0' }}>{t('msg.no_convs')}</p>
            </div>
          )}
          {filteredConvs.map(conv => {
            const u      = resolveUser(conv.other_email);
            const status = onlineStatus(conv.user_last_seen || u?.last_seen || u?.lastSeen);
            const unread = Number(conv.unread_count || 0);
            const active = selectedChat === conv.other_email;
            return (
              <button key={conv.other_email} onClick={() => selectChat(conv.other_email)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors"
                style={{
                  background: active ? 'rgba(124,108,246,.18)' : 'transparent',
                  border: active ? '1px solid rgba(124,108,246,.3)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <UserAvatar user={u} size="md" online={status.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="text-sm truncate font-semibold" style={{ color: unread > 0 ? '#fbfbff' : '#c2c5dd', fontWeight: unread > 0 ? 700 : 600 }}>
                      {u?.name || conv.other_email}
                    </p>
                    <span className="text-[11px] shrink-0 tabular-nums" style={{ color: '#62668a' }}>{fmtConvTime(conv.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-xs truncate flex-1" style={{ color: unread > 0 ? '#a7abc8' : '#7e82a0', fontWeight: unread > 0 ? 500 : 400 }}>
                      {conv.sender_email === senderEmail ? t('mgc.you_prefix') : ''}{conv.last_message || <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>{t('mgc.photo')}</span>}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: '#7c6cf6' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* New users — only visible while searching, show users not yet in conversations */}
          {convSearch.trim() && (() => {
            const existingEmails = new Set(conversations.map(c => c.other_email?.toLowerCase()));
            const q = convSearch.trim().toLowerCase();
            const newUsers = pickerItems.filter(u => {
              if (existingEmails.has(u.email?.toLowerCase())) return false;
              return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
            }).slice(0, 20);
            if (newUsers.length === 0) return null;
            return (
              <>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#62668a' }}>{t('mgc.start_new_chat')}</p>
                {newUsers.map(u => (
                  <button key={u.email} onClick={() => { selectChat(u.email); setConvSearch(''); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors"
                    style={{ background: selectedChat === u.email ? 'rgba(124,108,246,.18)' : 'transparent' }}
                    onMouseEnter={e => { if (selectedChat !== u.email) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                    onMouseLeave={e => { if (selectedChat !== u.email) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <UserAvatar user={u} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#fbfbff' }}>{u.name || u.email}</p>
                      <p className="text-xs truncate capitalize" style={{ color: '#7e82a0' }}>{u.role || 'user'}</p>
                    </div>
                    <svg className="w-4 h-4 ml-auto shrink-0" style={{ color: '#9b8cff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </button>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* ══ RIGHT PANEL ════════════════════════════════════════════════════════ */}

      {/* Empty state — only visible when no chat on desktop, or on mobile list side */}
      {!selectedChat && (
        <div className="flex-1 flex-col items-center justify-center gap-5 hidden md:flex" style={{ background: '#16142e' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,rgba(124,108,246,.25),rgba(62,194,232,.18))', border: '1px solid rgba(124,108,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px -8px rgba(124,108,246,.3)' }}>
              <svg width="36" height="36" style={{ color: '#9b8cff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 8, background: '#10b981', border: '2px solid #16142e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div className="text-center" style={{ maxWidth: 240 }}>
            <p className="font-bold text-base" style={{ color: '#fbfbff', letterSpacing: '-0.01em' }}>{t('mgc.your_messages')}</p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#7e82a0' }}>{t('mgc.select_conversation_hint')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              <path key="a" strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 3H8l-2 4h12l-2-4z"/>,
              <><path key="b1" strokeLinecap="round" strokeLinejoin="round" d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
              <path key="c" strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
            ].map((icon, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,108,246,0.08)', border: '1px solid rgba(124,108,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8}>{icon}</svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedChat && (
        <div
          className={`flex-1 flex-col min-w-0 relative ${mobileSide === 'list' ? 'hidden md:flex' : 'flex'}`}
          style={{ background: '#16142e' }}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(124,108,246,.06)', backdropFilter: 'blur(2px)', border: '2px dashed rgba(124,108,246,.5)' }}>
              <div className="rounded-2xl px-10 py-8 shadow-2xl text-center" style={{ background: 'rgba(21,19,46,.95)', border: '1px solid rgba(124,108,246,.3)', boxShadow: '0 24px 64px -8px rgba(124,108,246,.3)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,108,246,0.2)', border: '1px solid rgba(124,108,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p className="font-bold text-sm" style={{ color: '#9b8cff' }}>{t('mgc.drop_to_send')}</p>
                <p className="text-xs mt-1" style={{ color: '#62668a' }}>{t('mgc.release_to_upload')}</p>
              </div>
            </div>
          )}

          {/* Chat header */}
          <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: '#15132e' }}>
            {/* Back button — mobile only */}
            <button
              onClick={() => setMobileSide('list')}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
              style={{ color: '#7e82a0' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <UserAvatar user={otherUser} size="md" online={otherStatus.online} />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-sm" style={{ color: '#fbfbff', letterSpacing: '-0.01em' }}>
                {otherUser?.name || selectedChat}
              </p>
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: otherStatus.online ? '#34d399' : '#62668a' }}>
                {otherTyping
                  ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9b8cff', display: 'inline-block' }} className="animate-pulse" /><span style={{ color: '#9b8cff' }}>{t('mgc.typing')}</span></>
                  : <>{otherStatus.online && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', flexShrink: 0 }} />}{otherStatus.label}</>
                }
              </p>
            </div>
          </div>

          {/* Admin: course payment status (3 buttons) */}
          {currentUser?.isAdmin && userCourseReq && (
            <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)' }}>
              <span className="text-[11px] font-bold truncate max-w-[160px]" style={{ color: '#a7abc8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                {userCourseReq.course_title}
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#c2c5dd' }}>
                {Number(reqAmount || 0).toFixed(2)} TND
              </span>
              {[
                { id: 'en_attente', dot: '#f59e0b', label: 'En attente' },
                { id: 'termine',    dot: '#10b981', label: 'Terminé' },
                { id: 'refuse',     dot: '#ef4444', label: 'Refusé' },
              ].map(s => {
                const isActive = userCourseReq.payment_status === s.id;
                return (
                  <button key={s.id} disabled={statusSaving} onClick={() => setPaymentStatus(s.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${isActive ? s.dot : 'rgba(255,255,255,0.1)'}`, background: isActive ? s.dot + '20' : 'rgba(255,255,255,0.04)', color: isActive ? s.dot : '#7e82a0', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Admin: show the ONE project referenced in the chat's automatic messages */}
          {currentUser?.isAdmin && (() => {
            const lastProjId = [...messages].reverse().find(m => m.project_id)?.project_id;
            const proj = lastProjId
              ? (userProjects.find(p => p.id === lastProjId) || userProjects[0])
              : userProjects[0];
            if (!proj) return null;
            return (
              <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#a7abc8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                  {proj.title}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#c2c5dd' }}>
                  {proj.amount ? `${Number(proj.amount).toFixed(2)} TND` : '— TND'}
                </span>
                {[
                  { id: 'en_attente',     dot: '#f59e0b', label: 'En attente' },
                  { id: 'en_cours',       dot: '#3ec2e8', label: 'En cours' },
                  { id: 'projet_termine', dot: '#7c6cf6', label: 'Terminée' },
                  { id: 'termine',        dot: '#10b981', label: 'Confirmée' },
                ].map(s => {
                  const isActive = proj.payment_status === s.id;
                  return (
                    <button key={s.id} disabled={projSavingId === proj.id} onClick={() => setProjectPaymentStatus(s.id, proj.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${isActive ? s.dot : 'rgba(255,255,255,0.1)'}`, background: isActive ? s.dot + '20' : 'rgba(255,255,255,0.04)', color: isActive ? s.dot : '#7e82a0', cursor: 'pointer', opacity: projSavingId === proj.id ? 0.5 : 1, transition: 'all 0.15s' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Messages */}
          <div
            ref={msgsContainerRef}
            onScroll={() => {
              const el = msgsContainerRef.current;
              if (!el) return;
              userScrolledUp.current = (el.scrollHeight - el.scrollTop - el.clientHeight) > 80;
            }}
            className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 pt-12 pb-4 space-y-1"
            style={{ background: 'rgba(10,8,23,.6)' }}
          >
            {groups.map((group, gi) => {
              const isMine    = group.sender === senderEmail;
              const groupUser = isMine
                ? (currentUser?.isAdmin ? { name: ADMIN_NAME, email: ADMIN_EMAIL, photo: null } : currentUser)
                : resolveUser(group.sender);

              return (
                <div key={gi} className="flex flex-col">
                  {group.showSeparator && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                      <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#62668a', fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>
                        {fmtDateSeparator(group.messages[0].created_at)}
                      </span>
                    </div>
                  )}
                <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'} mb-1`}>
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
                            // Toggle action bar on tap — only for text messages
                            if (m.attachment_url) return;
                            setShowPicker(false);
                            setOpenMenuId(null);
                            setShowEmojiFor(null);
                            setHoveredMsg(hoveredMsg === m.id ? null : m.id);
                            e.stopPropagation();
                          }}
                        >
                          {/* Hover / tap action bar — text messages only (photos use overlay ⋯) */}
                          <AnimatePresence>
                            {hoveredMsg === m.id && !isEditing && !m.attachment_url && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                                className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-9 flex items-center gap-0.5 rounded-full shadow-lg px-1.5 py-1 z-30`}
                                style={{ background: '#15132e', border: '1px solid rgba(255,255,255,.12)' }}
                                onClick={e => e.stopPropagation()}
                              >
                                {/* Emoji react */}
                                <button data-emoji-pick
                                  onClick={e => { e.stopPropagation(); setShowEmojiFor(showEmojiFor === m.id ? null : m.id); }}
                                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#62668a', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#f59e0b'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#62668a'; }}>
                                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                                  </svg>
                                </button>
                                {/* Edit — own messages only */}
                                {isMine && (
                                  <button onClick={e => { e.stopPropagation(); setEditingId(m.id); setEditText(m.content || ''); setEditStagedFile(null); setHoveredMsg(null); }}
                                    className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                  </button>
                                )}
                                {/* Delete — own messages within 1h only */}
                                {isMine && (Date.now() - new Date(m.created_at).getTime()) < 3600000 && (
                                  <button onClick={e => { e.stopPropagation(); deleteMsg(m.id); }}
                                    className="w-8 h-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
                                className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-16 flex items-center gap-0.5 rounded-full shadow-2xl px-2 py-1.5 z-40`}
                                style={{ background: '#15132e', border: '1px solid rgba(255,255,255,.12)' }}
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
                                  <img src={editStagedFile?.previewUrl || cldImg(m.attachment_url)} alt="" className="w-28 h-28 object-cover rounded-xl" />
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
                                <button onClick={saveEdit} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{t('mgc.save')}</button>
                                <button onClick={() => { setEditingId(null); setEditText(''); setEditStagedFile(null); }} className="text-slate-400 hover:underline">{t('mgc.cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Bubble */}
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className={`${bubbleRound} ${m.attachment_url && !m.content ? 'p-1' : 'px-3 sm:px-3.5 py-2 sm:py-2.5'} shadow-sm text-sm`}
                                style={isMine
                                  ? { background: 'linear-gradient(135deg,#7c6cf6 0%,#6c8cf6 100%)', color: '#fff', boxShadow: '0 2px 12px -4px rgba(124,108,246,.5)' }
                                  : { background: 'rgba(255,255,255,.07)', color: '#f4f3fb', border: '1px solid rgba(255,255,255,.08)' }
                                }
                              >
                                {/* Reply preview */}
                                {m.reply_to_id && (
                                  <div className={`mb-2 pl-2.5 border-l-[3px] rounded-lg pr-2 py-1 ${isMine ? 'border-white/40 bg-white/10' : 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'}`}>
                                    <p className={`text-[11px] font-bold mb-0.5 ${isMine ? 'text-white/80' : 'text-indigo-500'}`}>
                                      {resolveUser(m.reply_sender)?.name || m.reply_sender || 'Reply'}
                                    </p>
                                    <p className={`text-xs truncate ${isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {m.reply_attachment_url ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>{t('mgc.photo')}</span> : (m.reply_content || '')}
                                    </p>
                                  </div>
                                )}
                                {/* Image */}
                                {m.attachment_url && (
                                  <div className="relative w-fit">
                                    <img src={cldImg(m.attachment_url)} alt="Photo"
                                      className={`max-w-[220px] sm:max-w-[260px] w-full object-cover rounded-xl block cursor-zoom-in ${m.content ? 'mb-2' : ''}`}
                                      onClick={e => { e.stopPropagation(); setViewerSrc(m.attachment_url); }}
                                    />
                                    {/* ⋯ overlay — own images only → Reply + Delete */}
                                    {isMine && (
                                      <button data-menu
                                        onClick={e => { e.stopPropagation(); openContextMenu(e, m.id); }}
                                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 active:bg-black/90 flex items-center justify-center text-white shadow-lg transition-colors z-10">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                )}
                                {/* Text */}
                                {m.content && (
                                  m.flagged ? (
                                    <span className="block">
                                      <span className="break-words leading-relaxed whitespace-pre-wrap blur-sm select-none">{m.content}</span>
                                      <span className="block mt-1 text-[11px] font-bold" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                        Pour votre sécurité, la communication hors plateforme est interdite.
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="break-words leading-relaxed whitespace-pre-wrap">{m.content}</span>
                                  )
                                )}
                              </motion.div>

                              {/* Time + receipt */}
                              <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {m.edited_at && <span className="text-[10px] italic" style={{ color: '#62668a' }}>{t('mgc.edited')}</span>}
                                <span className="text-[10px] tabular-nums" style={{ color: '#62668a' }}>{fmtTime(m.created_at)}</span>
                                {isMine && isLast && (
                                  m.is_read
                                    ? <svg className="w-4 h-4 shrink-0" style={{ color: '#9b8cff' }} viewBox="0 0 20 10" fill="none"><path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#62668a' }} viewBox="0 0 14 10" fill="none"><path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </div>

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
            const msg       = messages.find(x => x.id === openMenuId);
            if (!msg) return null;
            const isImg     = !!msg.attachment_url;
            const isMineMsg = msg.sender_email === senderEmail;
            const canDelete = isMineMsg && (Date.now() - new Date(msg.created_at).getTime()) < 3600000;
            return (
              <div data-menu
                className="fixed z-[60] rounded-2xl shadow-2xl overflow-hidden min-w-[180px] py-1"
                style={{ background: '#15132e', border: '1px solid rgba(255,255,255,.12)' }}
                style={{ top: menuPos.top, ...(menuPos.left !== undefined ? { left: menuPos.left } : { right: menuPos.right }) }}
                onClick={e => e.stopPropagation()}
              >
                {isImg ? (
                  /* ── Image message menu: Reply + Delete only ── */
                  <>
                    <button onClick={() => { setReplyTo(msg); setOpenMenuId(null); setHoveredMsg(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left" style={{ color: '#c2c5dd' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                      </svg>
                      Reply
                    </button>
                    {canDelete && (
                      <button onClick={() => deleteMsg(openMenuId)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left" style={{ color: '#f87171' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete
                      </button>
                    )}
                  </>
                ) : (
                  /* ── Text message menu: Copy · Forward · Delete ── */
                  <>
                    {msg.content && (
                      <button onClick={() => copyMsg(msg.content)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left" style={{ color: '#c2c5dd' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Copy text
                      </button>
                    )}
                    <button onClick={() => { setForwardMsg(msg); setFwdSearch(''); setOpenMenuId(null); setHoveredMsg(null); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left" style={{ color: '#c2c5dd' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Forward
                    </button>
                    {canDelete && (
                      <button onClick={() => deleteMsg(openMenuId)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left" style={{ color: '#f87171' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* ── Forward dialog ────────────────────────────────────────────── */}
          {forwardMsg && (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => { setForwardMsg(null); setFwdSearch(''); }}>
              <div className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                style={{ background: '#15132e', border: '1px solid rgba(255,255,255,.1)' }}
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <span className="font-semibold text-sm" style={{ color: '#fbfbff' }}>{t('mgc.forward_message')}</span>
                  <button onClick={() => { setForwardMsg(null); setFwdSearch(''); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: '#7e82a0' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                {/* Preview of what's being forwarded */}
                <div className="px-4 py-2.5 shrink-0" style={{ background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  {forwardMsg.attachment_url && (
                    <img src={cldImg(forwardMsg.attachment_url)} alt="" className="w-12 h-12 object-cover rounded-lg mb-1"/>
                  )}
                  {forwardMsg.content && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{forwardMsg.content}</p>
                  )}
                </div>
                {/* Search */}
                <div className="px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <input autoFocus value={fwdSearch} onChange={e => setFwdSearch(e.target.value)}
                    placeholder={t('mgc.search_by_name')}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: '#15122c', border: '1px solid rgba(255,255,255,.1)', color: '#f4f3fb' }}/>
                </div>
                {/* Recipients list */}
                <div className="overflow-y-auto flex-1">
                  {(() => {
                    const q = fwdSearch.trim().toLowerCase();
                    // Build unified list: conversations first, then allUsers not already in convs
                    const convEmails = new Set(conversations.map(c => c.other_email));
                    const convItems = conversations.map(c => ({
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
                      <p className="text-center text-sm text-slate-400 py-8">{t('msg.no_results')}</p>
                    );
                    return all.map(u => (
                      <button key={u.email} onClick={() => forwardTo(u.email)}
                        className="flex items-center gap-3 w-full px-4 py-3 transition-colors text-left"
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        {u.photo
                          ? <img src={cldImg(u.photo)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0"/>
                          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ background: `hsl(${[...u.email].reduce((a,c)=>a+c.charCodeAt(0),0)%360},55%,50%)` }}>
                              {u.name[0]?.toUpperCase()}
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#fbfbff' }}>{u.name}</p>
                          <p className="text-xs truncate" style={{ color: '#7e82a0' }}>{u.email}</p>
                        </div>
                        <svg className="w-4 h-4 ml-auto shrink-0" style={{ color: '#9b8cff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.07)', background: 'linear-gradient(180deg, #14122a 0%, #15132e 100%)' }}>

            {/* Chat-lock banner */}
            {lockError && (
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-2.5 pb-0">
                <p className="flex-1 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {lockError}
                </p>
                <button onClick={() => setLockError('')}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Reply banner */}
            {replyTo && (
              <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 pb-0">
                <div style={{ flex: 1, paddingLeft: 10, borderLeft: '3px solid #9b8cff', background: 'rgba(124,108,246,0.08)', paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9b8cff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {resolveUser(replyTo.sender_email)?.name || replyTo.sender_email}
                  </p>
                  <p style={{ fontSize: 11, color: '#7e82a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replyTo.attachment_url && !replyTo.content ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>{t('mgc.photo')}</span> : replyTo.content}
                  </p>
                </div>
                <button onClick={() => setReplyTo(null)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#62668a', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
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
              {/* Single attach button */}
              <div data-attach style={{ position:'relative' }}>
                <button onClick={() => setShowAttachMenu(v => !v)}
                  className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all mb-0.5"
                  style={{ color: showAttachMenu ? '#9b8cff' : '#62668a', background: showAttachMenu ? 'rgba(124,108,246,0.10)' : 'rgba(255,255,255,0.04)', border: showAttachMenu ? '1px solid rgba(124,108,246,0.35)' : '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => { if (!showAttachMenu) { e.currentTarget.style.color='#9b8cff'; e.currentTarget.style.borderColor='rgba(124,108,246,0.3)'; e.currentTarget.style.background='rgba(124,108,246,0.08)'; }}}
                  onMouseLeave={e => { if (!showAttachMenu) { e.currentTarget.style.color='#62668a'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                {showAttachMenu && (
                  <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:0, background:'#1a1b2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'6px', display:'flex', flexDirection:'column', gap:4, minWidth:190, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:50 }}>
                    <button
                      onClick={() => { setShowAttachMenu(false); fileRef.current?.click(); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'none', border:'none', color:'#c2c5dd', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background .15s', textAlign:'left', width:'100%' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                      onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ color:'#9b8cff', flexShrink:0 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      Choisir depuis la galerie
                    </button>
                    <button
                      onClick={() => { setShowAttachMenu(false); const c = document.createElement('input'); c.type='file'; c.accept='image/*'; c.capture='environment'; c.onchange=handleFileSelect; c.click(); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'none', border:'none', color:'#c2c5dd', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background .15s', textAlign:'left', width:'100%' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                      onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ color:'#3ec2e8', flexShrink:0 }}>
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      Prendre une photo
                    </button>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={e => { setShowAttachMenu(false); handleFileSelect(e); }} />

              {/* Textarea */}
              <textarea ref={inputRef} value={newMsg} onChange={handleInputChange} rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={t('mgc.write_message')}
                className="flex-1 rounded-2xl px-3.5 sm:px-4 py-2.5 text-sm outline-none resize-none overflow-y-auto leading-relaxed transition-all"
                style={{ minHeight: 40, maxHeight: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f3fb' }}
                onFocus={e => { e.target.style.borderColor='rgba(124,108,246,0.4)'; e.target.style.background='rgba(124,108,246,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(124,108,246,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,.09)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
              />

              {/* Send */}
              <button onClick={sendMsg} disabled={uploading || (!newMsg.trim() && !stagedFile)}
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center mb-0.5 transition-all"
                style={newMsg.trim() || stagedFile
                  ? { background: 'linear-gradient(135deg,#7c6cf6,#6c8cf6)', color: '#fff', boxShadow: '0 4px 16px -4px rgba(124,108,246,.7)', transform: 'scale(1)' }
                  : { background: 'rgba(255,255,255,.05)', color: '#3a3f62', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.07)' }
                }
                onMouseEnter={e => { if (newMsg.trim() || stagedFile) { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 20px -4px rgba(124,108,246,.8)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=newMsg.trim()||stagedFile?'0 4px 16px -4px rgba(124,108,246,.7)':'none'; }}
              >
                {uploading
                  ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
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
