// src/components/Navbar.js
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useRealtimeChannel } from "../lib/useRealtimeChannel";
import { cldImg } from "../utils/cloudinary";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL || "https://famamennou-server.onrender.com/api";

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_HEX = [
  'linear-gradient(135deg,#6366f1,#4f46e5)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f43f5e,#e11d48)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#0ea5e9,#0284c7)',
  'linear-gradient(135deg,#d946ef,#a21caf)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
];
function avatarGradient(email = '') {
  return AVATAR_HEX[(email.charCodeAt(0) || 0) % AVATAR_HEX.length];
}


// ── Notification link resolver ─────────────────────────────────────────────────
async function getNotifLink(n) {
  if (!n) return "/courses";
  const k = n.kind || "";
  if (k === "new_submission")          return "/admin/dashboard?tab=cin";
  if (k === "new_user")                return "/admin/dashboard?tab=allusers";
  if (k === "new_project")             return "/admin/dashboard?tab=allusers";
  if (k === "withdrawal")              return "/admin/dashboard?tab=allusers";
  if (k.startsWith("lesson_pending_")) return "/admin/dashboard?tab=lessons";
  const courseMatch = k.match(/^course_(?:created|approved|rejected)_(\d+)$/);
  if (courseMatch) return `/courses/${courseMatch[1]}`;
  const lessonWithCourse = k.match(/^lesson_(?:created|approved|rejected)_\d+_course_(\d+)$/);
  if (lessonWithCourse) return `/courses/${lessonWithCourse[1]}`;
  const lessonOnly = k.match(/^lesson_(?:created|approved|rejected)_(\d+)$/);
  if (lessonOnly) {
    try {
      const r = await fetch(`${API_URL}/lessons/${lessonOnly[1]}`);
      const l = await r.json();
      if (l?.course_id) return `/courses/${l.course_id}`;
    } catch {}
  }
  if (k === "course_pending")                   return "/dashboard?tab=courses";
  if (k === "password_changed")                  return "/settings";
  if (k.startsWith("profile_saved"))            return "/dashboard?tab=profile";
  if (k.startsWith("client_profile_saved"))     return "/account?tab=profile";
  if (k.startsWith("new_proposal:"))            return "/projects";
  if (k.startsWith("proposal_accepted:")) {
    const projectId = k.split(":")[1];
    if (projectId) {
      try {
        const r = await fetch(`${API_URL}/projects/by-id/${projectId}`);
        const p = await r.json();
        if (p?.client_email) return `/messages?with=${encodeURIComponent(p.client_email)}`;
      } catch {}
    }
    return "/messages";
  }
  if (k.startsWith("proposal_rejected:"))       return "/dashboard?tab=find-projects";
  const reviewNotif = k.match(/^course_review(?:_reply)?:(\d+):(\d+)$/);
  if (reviewNotif) return `/courses/${reviewNotif[1]}?tab=reviews#review-${reviewNotif[2]}`;
  return "/courses";
}

// ── Notifications panel ────────────────────────────────────────────────────────
function NotifPanel({ notifications, onMarkRead, onMarkAll, onClose, dark }) {
  const navigate  = useNavigate();
  const unread    = notifications.filter(n => !n.read).length;
  const panel     = dark ? "#16142e" : "#ffffff";
  const panelBd   = dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
  const divider   = dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
  const rowHov    = dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
  const text1     = dark ? "#f4f3fb" : "#0f172a";
  const text3     = dark ? "#62668a" : "#94a3b8";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-1 pt-14 sm:p-4 sm:pt-16" onClick={onClose}>
      <div className="w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxWidth: 'min(380px, calc(100vw - 8px))', background: panel, border: `1px solid ${panelBd}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: text1 }}>Notifications</p>
            {unread > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white" style={{ background: "#7c6cf6" }}>{unread}</span>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors" style={{ color: text3 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "min(380px,60vh)" }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: text3 }}>
              <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p className="text-xs font-semibold">Aucune notification</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} role="button" tabIndex={0}
              onClick={async () => { onMarkRead(n.id); const link = await getNotifLink(n); onClose(); navigate(link); }}
              className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors"
              style={{ borderBottom: `1px solid ${divider}`, background: n.read ? "transparent" : "rgba(124,108,246,0.06)" }}
              onMouseEnter={e => e.currentTarget.style.background = rowHov}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(124,108,246,0.06)"}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: n.kind?.startsWith("proposal_accepted") ? "rgba(16,185,129,0.15)" : n.kind?.startsWith("proposal_rejected") ? "rgba(239,68,68,0.15)" : "rgba(124,108,246,0.15)" }}>
                {n.kind?.startsWith("proposal_accepted")
                  ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                  : n.kind?.startsWith("proposal_rejected")
                  ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  : n.kind?.startsWith("new_proposal")
                  ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold mb-0.5 truncate" style={{ color: n.read ? (dark ? "#a7abc8" : "#6b7280") : text1 }}>{n.title}</p>
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: text3 }}>{n.message}</p>
                <p className="text-[10px] mt-1" style={{ color: text3 }}>
                  {new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#7c6cf6" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Messages panel ────────────────────────────────────────────────────────────
const MSG_COLORS = ["#7c6cf6","#a855f7","#3ec2e8","#6c8cf6","#f59e0b","#10b981"];
const msgColor = email => MSG_COLORS[(email?.charCodeAt(0) ?? 0) % MSG_COLORS.length];

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts), h = (Date.now() - d) / 3600000;
  if (h < 1)   return `${Math.max(1, Math.floor(h * 60))}m`;
  if (h < 24)  return `${Math.floor(h)}h`;
  if (h < 168) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessagesPanel({ conversations, senderEmail, onClose, onChatOpen, dark }) {
  const totalUnread = conversations.reduce((s, c) => s + Number(c.unread_count || 0), 0);
  const display = conversations.filter(c => Number(c.unread_count) > 0).length > 0
    ? conversations.filter(c => Number(c.unread_count) > 0)
    : conversations.slice(0, 8);

  const panel   = dark ? "#16142e" : "#ffffff";
  const panelBd = dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
  const divider = dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";
  const rowHov  = dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
  const text1   = dark ? "#f4f3fb" : "#0f172a";
  const text2   = dark ? "#a7abc8" : "#6b7280";
  const text3   = dark ? "#62668a" : "#94a3b8";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-1 pt-14 sm:p-4 sm:pt-16" onClick={onClose}>
      <motion.div initial={{ opacity:0,scale:.95,y:-8 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:.95,y:-8 }} transition={{ duration:.14 }}
        className="w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxWidth: 'min(380px, calc(100vw - 8px))', background: panel, border: `1px solid ${panelBd}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: text1 }}>Messages</p>
            {totalUnread > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white" style={{ background:"#ef4444" }}>{totalUnread > 99 ? "99+" : totalUnread}</span>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: text3 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight:"min(420px,62vh)" }}>
          {display.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2" style={{ color: text3 }}>
              <svg className="w-9 h-9 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <p className="text-xs font-semibold">Aucun message</p>
            </div>
          ) : display.map(conv => {
            const unread = Number(conv.unread_count || 0);
            const email  = conv.other_email || "";
            const isAdminConv = email.toLowerCase() === "admin@famamennou.com";
            const name   = isAdminConv ? "Fama Mennou TEAM" : (conv.user_name || email.split("@")[0]);
            const photo  = isAdminConv ? null : conv.user_photo;
            return (
              <div key={email} onClick={() => onChatOpen(email)}
                className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                style={{ borderBottom: `1px solid ${divider}`, background: unread > 0 ? "rgba(239,68,68,0.05)" : "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = rowHov}
                onMouseLeave={e => e.currentTarget.style.background = unread > 0 ? "rgba(239,68,68,0.05)" : "transparent"}>
                <div className="relative shrink-0">
                  {photo ? <img src={cldImg(photo)} alt={name} className="w-10 h-10 rounded-full object-cover" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: msgColor(email) }}>{name.slice(0,2).toUpperCase()}</div>
                  }
                  {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1">{unread > 9 ? "9+" : unread}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="text-sm font-semibold truncate" style={{ color: unread > 0 ? text1 : text2 }}>{name}</p>
                    <span className="text-[10px] shrink-0 tabular-nums" style={{ color: text3 }}>{fmtTime(conv.created_at)}</span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: unread > 0 ? (dark ? "#7e82a0" : "#6b7280") : text3 }}>
                    {conv.sender_email === senderEmail ? "Vous: " : ""}{conv.last_message || "Photo"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: `1px solid ${divider}` }}>
          <button onClick={() => onChatOpen(null)} className="w-full py-3.5 text-sm font-semibold transition-colors" style={{ color:"#9b8cff" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(124,108,246,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background=""}>
            Voir tous les messages →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LogoMark({ style }) {
  return <img src="/logo.png" alt="Fama Mennou" style={{ mixBlendMode: "screen", ...style }} />;
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar({ onLogin }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const NAV_LINKS = [
    { label: t('home.ac.hire.title'), to: "/freelancers" },
    { label: t('home.ac.client.title'), to: "/clients" },
    { label: t('Courses'), to: "/courses" },
  ];
  const { user, logout, getUserNotifications, getAdminNotifications,
          markNotificationRead, markAllNotificationsRead, clearNotifications,
          fetchNotifications } = useAuth();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profOpen,    setProfOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [msgOpen,     setMsgOpen]     = useState(false);
  const [msgConvs,    setMsgConvs]    = useState([]);
  const [msgUnread,   setMsgUnread]   = useState(0);
  const [langOpen,    setLangOpen]    = useState(false);
  const { isDark: darkMode, toggle: toggleTheme } = useTheme();
  const profRef = useRef(null);
  const langRef = useRef(null);

  const senderEmail = user ? (user.isAdmin ? "admin@famamennou.com" : user.email) : null;

  useEffect(() => { if (user) fetchNotifications(); }, [user, fetchNotifications]);

  const fetchMsgs = useCallback(async () => {
    if (!senderEmail) return;
    try {
      const url = user?.isAdmin
        ? `${API_URL}/messages/admin/conversations`
        : `${API_URL}/messages/conversations/${encodeURIComponent(senderEmail)}`;
      const data = await fetch(url).then(r => r.json());
      if (Array.isArray(data)) {
        setMsgConvs(data);
        setMsgUnread(data.reduce((s,c) => s + (Number(c.unread_count)||0), 0));
      }
    } catch {}
  }, [senderEmail, user]);

  useEffect(() => {
    if (!senderEmail) return;
    fetchMsgs();
    const id = setInterval(fetchMsgs, 60000);
    return () => clearInterval(id);
  }, [senderEmail, fetchMsgs]);

  useRealtimeChannel(senderEmail, { new_message: fetchMsgs });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setMenuOpen(false); setProfOpen(false);
    setNotifOpen(false); setMsgOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fn = e => { if (profRef.current && !profRef.current.contains(e.target)) setProfOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = e => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);



  // ── Color scheme (updates on every darkMode + scrolled change) ──
  const bg = {
    header:   darkMode
      ? (scrolled ? "rgba(10,8,26,.97)" : "rgba(10,8,26,.80)")
      : (scrolled ? "rgba(255,255,255,.97)" : "rgba(255,255,255,.82)"),
    headerBd: darkMode ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.09)",
    panel:    darkMode ? "#16142e" : "#ffffff",
    panelBd:  darkMode ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
    divider:  darkMode ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)",
    rowHov:   darkMode ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)",
    btnHovBg: darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)",
    iconClr:  darkMode ? "#7e82a0" : "#64748b",
    iconHov:  darkMode ? "#f4f3fb" : "#0f172a",
    text1:    darkMode ? "#f4f3fb" : "#0f172a",
    text2:    darkMode ? "#a7abc8" : "#6b7280",
    text3:    darkMode ? "#62668a" : "#94a3b8",
    navClr:   darkMode ? "#c2c5dd" : "#374151",
    mobileMenu: darkMode ? "#0c0a1e" : "#f8fafc",
    mobileBd:   darkMode ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)",
  };

  const LANGS = [
    { code:'fr', label:'Français',  short:'FR' },
    { code:'en', label:'English',   short:'EN' },
    { code:'ar', label:'العربية',   short:'AR' },
  ];
  const activeLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  const handleDropdownNavigate = (to) => {
    const [pathname, qs] = to.split("?");
    navigate({ pathname, search: qs ? `?${qs}` : "" });
  };

  const userNotifs  = user && !user.isAdmin ? getUserNotifications(user.email) : [];
  const adminNotifs = user?.isAdmin ? getAdminNotifications() : [];
  const notifs      = user?.isAdmin ? adminNotifs : userNotifs;
  const unreadCount = notifs.filter(n => !n.read).length;

  const MenuIcon = ({ d, d2, color }) => (
    <span style={{ width: 28, height: 28, borderRadius: 7, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d={d}/>{d2 && <path d={d2}/>}
      </svg>
    </span>
  );

  const MENU_ITEMS = user?.isAdmin
    ? [
        { icon: <MenuIcon color="#7c6cf6" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, label: t("Dashboard"), to: "/admin/dashboard" },
        { icon: <MenuIcon color="#f87171" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>, label: t("Sign out"), logout: true },
      ]
    : user?.role === "freelancer"
      ? [
          { icon: <MenuIcon color="#7c6cf6" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" d2="M12 11a4 4 0 100-8 4 4 0 000 8z"/>, label: t("My Profile"),  to: "/dashboard?tab=profile" },
          { icon: <MenuIcon color="#10b981" d="M23 6l-9.5 9.5-5-5L1 18" d2="M17 6h6v6"/>,                                        label: t("nav.gains"),   to: "/dashboard?tab=gains" },
          { icon: <MenuIcon color="#3ec2e8" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,                      label: t("msg.page_title"), to: "/messages" },
          { icon: <MenuIcon color="#94a3b8" d="M12 15a3 3 0 100-6 3 3 0 000 6z" d2="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>, label: t("Settings"), to: "/dashboard?tab=settings" },
          { icon: <MenuIcon color="#f87171" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>,                    label: t("Sign out"),  logout: true },
        ]
      : [
          { icon: <MenuIcon color="#7c6cf6" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" d2="M12 11a4 4 0 100-8 4 4 0 000 8z"/>, label: t("My Profile"),   to: "/dashboard"  },
          { icon: <MenuIcon color="#f59e0b" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>,         label: t("My Projects"),  to: "/projects"   },
          { icon: <MenuIcon color="#10b981" d="M1 4h22v16H1z" d2="M1 10h22"/>,                                                     label: t("nav.payments"), to: "/payments"   },
          { icon: <MenuIcon color="#3ec2e8" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,                      label: t("msg.page_title"), to: "/messages" },
          { icon: <MenuIcon color="#94a3b8" d="M12 15a3 3 0 100-6 3 3 0 000 6z" d2="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>, label: t("Settings"),     to: "/settings"   },
          { icon: <MenuIcon color="#f87171" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>,                    label: t("Sign out"),     logout: true      },
        ];

  return (
    <>
      <style>{`
        @keyframes glowFloat {
          0%,100% { filter:drop-shadow(0 0 8px rgba(124,108,246,.45)); transform:translateY(0); }
          50%      { filter:drop-shadow(0 0 14px rgba(108,140,246,.6)); transform:translateY(-2px); }
        }
      `}</style>

      {/* ── Fixed header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: bg.header,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${bg.headerBd}`,
          transition: "background 0.25s, border-color 0.25s",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 66, display: "flex", alignItems: "center", gap: 28 }}>

          {/* Logo */}
          <Link
            to="/"
            style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0, flex: "none", textDecoration: "none" }}
          >
            <LogoMark style={{ height: 38, width: "auto", display: "block", flexShrink: 0, animation: "glowFloat 4s ease-in-out infinite" }} />
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", whiteSpace: "nowrap", color: bg.text1 }}>
              Fama<span style={{ color: "#9b8cff" }}>&nbsp;Mennou</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex" style={{ alignItems: "center", gap: 0 }}>
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                    fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap",
                    color: active ? "#9b8cff" : bg.navClr,
                    padding: "8px 13px", borderRadius: 8, textDecoration: "none",
                    display: "block", transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = bg.iconHov; e.currentTarget.style.background = bg.btnHovBg; }}
                  onMouseLeave={e => { e.currentTarget.style.color = active ? "#9b8cff" : bg.navClr; e.currentTarget.style.background = "none"; }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1, minWidth: 14 }} />

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {user ? (
              <>
                {/* Dark / Light toggle (1st) */}
                <button
                  onClick={toggleTheme}
                  className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl transition-all"
                  style={{ color: bg.iconClr, background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = bg.btnHovBg; e.currentTarget.style.color = bg.iconHov; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = bg.iconClr; }}
                  title={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
                >
                  {darkMode ? (
                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </button>

                {/* Language selector (2nd) */}
                <div className="relative hidden sm:block" ref={langRef}>
                  <button
                    onClick={() => { setLangOpen(v => !v); setProfOpen(false); setNotifOpen(false); setMsgOpen(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                    style={{
                      color: langOpen ? bg.iconHov : bg.iconClr,
                      background: langOpen ? bg.btnHovBg : "transparent",
                      border: `1px solid ${langOpen ? bg.headerBd : "transparent"}`,
                      fontSize: 11, fontWeight: 700, letterSpacing: '.03em', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!langOpen) { e.currentTarget.style.background = bg.btnHovBg; e.currentTarget.style.color = bg.iconHov; }}}
                    onMouseLeave={e => { if (!langOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = bg.iconClr; }}}
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    {activeLang.short}
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ transform: langOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        initial={{ opacity:0, scale:.95, y:6 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:6 }} transition={{ duration:.13 }}
                        style={{ position:'absolute', right:0, marginTop:8, width:148, borderRadius:14, background: bg.panel, border: `1px solid ${bg.panelBd}`, boxShadow:'0 16px 48px rgba(0,0,0,.25)', overflow:'hidden', zIndex:60 }}>
                        {LANGS.map(l => (
                          <button key={l.code}
                            onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                            style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background: i18n.language === l.code ? 'rgba(124,108,246,0.12)' : 'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', transition:'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = bg.rowHov}
                            onMouseLeave={e => e.currentTarget.style.background = i18n.language === l.code ? 'rgba(124,108,246,0.12)' : 'transparent'}>
                            <span style={{ fontSize:13, fontWeight:600, color: i18n.language === l.code ? '#9b8cff' : bg.text2 }}>{l.label}</span>
                            {i18n.language === l.code && (
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9b8cff" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Messages — chat (3rd) */}
                <button
                  onClick={() => { setNotifOpen(false); setProfOpen(false); setMsgOpen(v => !v); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ color: bg.iconClr, background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = bg.btnHovBg; e.currentTarget.style.color = bg.iconHov; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = bg.iconClr; }}
                  title="Messages"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  {msgUnread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white" style={{ background: "#ef4444" }}>
                      {msgUnread > 9 ? "9+" : msgUnread}
                    </span>
                  )}
                </button>

                {/* Bell — notifications (4th) */}
                <button
                  onClick={() => {
                    setNotifOpen(v => {
                      if (!v) { user.isAdmin ? markAllNotificationsRead("admin") : markAllNotificationsRead("user", user.email); }
                      return !v;
                    });
                    setMsgOpen(false); setProfOpen(false);
                  }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ color: bg.iconClr, background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = bg.btnHovBg; e.currentTarget.style.color = bg.iconHov; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = bg.iconClr; }}
                  title="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white" style={{ background: "#7c6cf6" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Separator */}
                <div style={{ width: 1, height: 22, background: bg.headerBd, flexShrink: 0 }} className="hidden sm:block" />

                {/* Profile */}
                <div className="relative" ref={profRef}>
                  <button
                    onClick={() => { setProfOpen(v => !v); setNotifOpen(false); setMsgOpen(false); }}
                    className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl transition-all"
                    style={{ background: profOpen ? bg.btnHovBg : "transparent", border: `1px solid ${profOpen ? bg.headerBd : "transparent"}` }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0"
                      style={{ background: user.photo ? 'transparent' : avatarGradient(user.email) }}>
                      {user.photo ? <img src={cldImg(user.photo)} alt={user.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getInitials(user.name)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold leading-tight" style={{ color: bg.text1 }}>{user.name}</p>
                      <p className="text-[10px] leading-tight capitalize" style={{ color: bg.text3 }}>{user.role ?? "membre"}</p>
                    </div>
                    <svg className={`w-3 h-3 transition-transform ${profOpen ? "rotate-180" : ""}`} style={{ color: bg.text3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <AnimatePresence>
                    {profOpen && (
                      <motion.div
                        initial={{ opacity:0, scale:.95, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:8 }} transition={{ duration:.14 }}
                        className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl z-50"
                        style={{ background: bg.panel, border: `1px solid ${bg.panelBd}`, boxShadow:"0 24px 64px rgba(0,0,0,.2)" }}
                      >
                        <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${bg.divider}` }}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                              style={{ background: user.photo ? 'transparent' : avatarGradient(user.email) }}>
                              {user.photo ? <img src={cldImg(user.photo)} alt={user.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : getInitials(user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: bg.text1 }}>{user.name}</p>
                              <p className="text-[11px] truncate" style={{ color: bg.text3 }}>{user.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                            style={user.isAdmin
                              ? { background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171" }
                              : { background:"rgba(124,108,246,0.12)", border:"1px solid rgba(124,108,246,0.25)", color:"#9b8cff" }}>
                            {user.isAdmin ? "Admin" : user.role}
                          </span>
                        </div>
                        <div className="py-1.5">
                          {MENU_ITEMS.map((item) => (
                            <button key={item.label}
                              onClick={() => { setProfOpen(false); item.logout ? setLogoutModal(true) : handleDropdownNavigate(item.to); }}
                              className="w-full text-left transition-all"
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "9px 16px",
                                fontSize: 13.5, fontWeight: 500, letterSpacing: "0.01em",
                                color: item.logout ? "#f87171" : bg.text2,
                                background: "transparent",
                                border: "none", cursor: "pointer", fontFamily: "inherit",
                                borderTop: item.logout ? `1px solid ${bg.divider}` : "none",
                                marginTop: item.logout ? 4 : 0,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = item.logout ? "rgba(239,68,68,0.08)" : bg.rowHov; e.currentTarget.style.color = item.logout ? "#f87171" : bg.text1; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item.logout ? "#f87171" : bg.text2; }}>
                              <span style={{ display:"flex", alignItems:"center", flexShrink:0 }}>{item.icon}</span>
                              <span style={{ fontWeight: 500 }}>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center" style={{ gap: 10 }}>
                <button
                  onClick={() => onLogin?.("login")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", color: bg.navClr, padding: "8px 8px" }}
                  onMouseEnter={e => e.currentTarget.style.color = bg.iconHov}
                  onMouseLeave={e => e.currentTarget.style.color = bg.navClr}
                >
                  {t("Log in")}
                </button>
                <button
                  onClick={() => onLogin?.("signup")}
                  style={{ background: "#7c6cf6", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", color: "#fff", padding: "9px 18px", borderRadius: 10, boxShadow: "0 6px 16px -5px rgba(124,108,246,.7)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#6a5cf0"}
                  onMouseLeave={e => e.currentTarget.style.background = "#7c6cf6"}
                >
                  {t("Sign up")}
                </button>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: bg.btnHovBg, border: `1px solid ${bg.headerBd}`, color: bg.iconClr }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display: "block", width: 18, height: 2, borderRadius: 2,
                    background: bg.iconClr,
                    transform: menuOpen && i===0 ? "rotate(45deg) translateY(7px)" : menuOpen && i===2 ? "rotate(-45deg) translateY(-7px)" : "",
                    opacity: menuOpen && i===1 ? 0 : 1,
                    transition: "transform .2s, opacity .2s",
                  }} />
                ))}
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* ── Mobile sidebar ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop — click to close */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[99] lg:hidden"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 z-[100] flex flex-col lg:hidden"
              style={{
                width: "min(300px, calc(100vw - 48px))",
                background: bg.mobileMenu,
                borderLeft: `1px solid ${bg.mobileBd}`,
                boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: `1px solid ${bg.mobileBd}` }}>
                <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
                  <LogoMark style={{ height: 30, width: "auto", display: "block", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: bg.text1 }}>
                    Fama<span style={{ color: "#9b8cff" }}>&nbsp;Mennou</span>
                  </span>
                </Link>
                <button onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: bg.btnHovBg, color: bg.iconClr }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* User info strip */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${bg.mobileBd}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                    style={{ background: user.photo ? "transparent" : avatarGradient(user.email) }}>
                    {user.photo ? <img src={cldImg(user.photo)} alt={user.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate leading-tight" style={{ color: bg.text1 }}>{user.name}</p>
                    <p className="text-[10px] truncate" style={{ color: bg.text3 }}>{user.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0"
                    style={user.isAdmin
                      ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                      : { background: "rgba(124,108,246,0.12)", border: "1px solid rgba(124,108,246,0.25)", color: "#9b8cff" }}>
                    {user.isAdmin ? "Admin" : user.role}
                  </span>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex flex-col px-3 py-3 gap-0.5 flex-1">

                {/* ── Discover ── */}
                <p className="px-3 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: bg.text3 }}>{t('nav.discover')}</p>
                {[
                  { label: t('home.ac.hire.title'),   to: "/freelancers", icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>, icon2: <circle cx="9" cy="7" r="4"/>, color: "#9b8cff" },
                  { label: t('home.ac.client.title'), to: "/clients",    icon: <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>, color: "#0ea5e9" },
                  { label: t('Courses'),              to: "/courses",    icon: <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>, icon2: <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>, color: "#10b981" },
                ].map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors"
                      style={{ color: active ? "#9b8cff" : bg.navClr, background: active ? "rgba(124,108,246,0.1)" : "transparent" }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = bg.btnHovBg; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; } }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: active ? `${item.color}22` : bg.btnHovBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={active ? item.color : bg.iconClr} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                          {item.icon}{item.icon2}
                        </svg>
                      </span>
                      {item.label}
                    </Link>
                  );
                })}

                {/* ── Account (logged-in non-admin) ── */}
                {user && !user.isAdmin && (
                  <>
                    <p className="px-3 pb-1.5 pt-3 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: bg.text3 }}>{t('nav.account')}</p>
                    {[
                      { label: t("Dashboard"),        to: "/dashboard",  icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>, color: "#7c6cf6" },
                      { label: t("My Projects"),      to: "/projects",   icon: <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>, color: "#f59e0b" },
                      { label: t("msg.page_title"),   to: "/messages",   icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>, color: "#3ec2e8", badge: msgUnread },
                      { label: t("nav.payments"),     to: "/payments",   icon: <><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></>, color: "#10b981" },
                      { label: t("Settings"),         to: "/settings",   icon: <><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>, color: "#94a3b8" },
                    ].map(item => {
                      const active = location.pathname === item.to;
                      return (
                        <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors"
                          style={{ color: active ? "#9b8cff" : bg.navClr, background: active ? "rgba(124,108,246,0.1)" : "transparent" }}
                          onMouseEnter={e => { if (!active) { e.currentTarget.style.background = bg.btnHovBg; } }}
                          onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; } }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: active ? `${item.color}22` : bg.btnHovBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={active ? item.color : bg.iconClr} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                              {item.icon}
                            </svg>
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {item.badge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white" style={{ background: "#ef4444" }}>
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </>
                )}

                {/* ── Admin section ── */}
                {user?.isAdmin && (
                  <>
                    <p className="px-3 pb-1.5 pt-3 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: bg.text3 }}>Admin</p>
                    {[
                      { label: t("Dashboard"),      to: "/admin/dashboard", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, color: "#7c6cf6" },
                      { label: t("msg.page_title"), to: "/messages",        icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>, color: "#3ec2e8", badge: msgUnread },
                    ].map(item => {
                      const active = location.pathname === item.to;
                      return (
                        <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors"
                          style={{ color: active ? "#9b8cff" : bg.navClr, background: active ? "rgba(124,108,246,0.1)" : "transparent" }}
                          onMouseEnter={e => { if (!active) { e.currentTarget.style.background = bg.btnHovBg; } }}
                          onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; } }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: active ? `${item.color}22` : bg.btnHovBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={active ? item.color : bg.iconClr} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                              {item.icon}
                            </svg>
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {item.badge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white" style={{ background: "#ef4444" }}>
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>

              {/* Bottom actions */}
              <div className="px-4 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${bg.mobileBd}` }}>
                {user ? (
                  <button onClick={() => { setMenuOpen(false); setLogoutModal(true); }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}>
                    {t("Sign out")}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { onLogin?.("login"); setMenuOpen(false); }}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ border: `1px solid ${bg.headerBd}`, color: bg.text2 }}
                      onMouseEnter={e => e.currentTarget.style.background = bg.btnHovBg}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      {t("Log in")}
                    </button>
                    <button onClick={() => { onLogin?.("signup"); setMenuOpen(false); }}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: "#7c6cf6", boxShadow: "0 4px 14px -3px rgba(124,108,246,.5)" }}>
                      {t("Sign up")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Notifications ── */}
      <AnimatePresence>
        {notifOpen && user && (
          <NotifPanel
            notifications={notifs}
            dark={darkMode}
            onMarkRead={id => markNotificationRead(id)}
            onMarkAll={() => user.isAdmin ? markAllNotificationsRead("admin") : markAllNotificationsRead("user", user.email)}
            onClear={() => user.isAdmin ? clearNotifications("admin") : clearNotifications("user", user.email)}
            onClose={() => setNotifOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <AnimatePresence>
        {msgOpen && user && (
          <MessagesPanel
            conversations={msgConvs}
            dark={darkMode}
            senderEmail={user.isAdmin ? "admin@famamennou.com" : user.email}
            onClose={() => setMsgOpen(false)}
            onChatOpen={email => {
              setMsgOpen(false);
              const isAdmin = !!user.isAdmin;
              navigate(email
                ? (isAdmin ? `/admin/dashboard?tab=chat&with=${encodeURIComponent(email)}` : `/messages?with=${encodeURIComponent(email)}`)
                : (isAdmin ? "/admin/dashboard?tab=chat" : "/messages")
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Logout modal ── */}
      <AnimatePresence>
        {logoutModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity:0, scale:.92, y:12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.92, y:12 }} transition={{ duration:.18 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl"
              style={{ background: bg.panel, border: `1px solid ${bg.panelBd}`, boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-0">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </div>
                <button onClick={() => setLogoutModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: bg.btnHovBg, color: bg.text3 }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="px-6 py-4">
                <h3 className="text-base font-extrabold mb-1" style={{ color: bg.text1 }}>Log out?</h3>
                <p className="text-sm" style={{ color: bg.text2 }}>You will be redirected to the home page.</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setLogoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ border: `1px solid ${bg.headerBd}`, color: bg.text2 }}
                  onMouseEnter={e => e.currentTarget.style.background = bg.rowHov}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  Cancel
                </button>
                <button onClick={() => { logout(); setLogoutModal(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 12px -3px rgba(239,68,68,.4)" }}>
                  Yes, log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
