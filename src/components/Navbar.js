// src/components/Navbar.js
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import Searchbar from "./Searchbar";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";


const MotionLink = motion(Link);

const LANGUAGES = [
  { code: "en", label: "English",  flag: "https://flagcdn.com/w40/us.png" },
  { code: "fr", label: "Français", flag: "https://flagcdn.com/w40/fr.png" },
  { code: "ar", label: "العربية",  flag: "https://flagcdn.com/w40/tn.png" },
];

// ─── Global search data ───────────────────────────────────────────────────────
const SEARCH_GROUPS = [
  {
    key: "freelancers", label: "Freelancers", icon: "👤", path: "/freelancers",
    data: [
      { name: "Amira Bensalem", sub: "Brand Designer",  tags: ["Branding","Figma","Illustration"] },
      { name: "Youssef Khalil", sub: "Full-Stack Dev",   tags: ["React","Node","MongoDB"] },
      { name: "Sofia Martins",  sub: "SEO Specialist",   tags: ["SEO","Content","Analytics"] },
      { name: "Karim Dridi",    sub: "Motion Designer",  tags: ["After Effects","Lottie","Cinema4D"] },
      { name: "Elena Russo",    sub: "Copywriter",       tags: ["B2B Copy","Email","Landing Pages"] },
      { name: "Mehdi Toumi",    sub: "Mobile Dev",       tags: ["React Native","Flutter","iOS"] },
    ],
  },
  {
    key: "courses", label: "Courses", icon: "📚", path: "/courses",
    data: [
      { name: "Advanced React Patterns",    sub: "Youssef Khalil", tags: ["React","Architecture","Performance"] },
      { name: "Brand Identity from Zero",   sub: "Amira Bensalem", tags: ["Figma","Design","Branding"] },
      { name: "SEO Mastery 2024",           sub: "Sofia Martins",  tags: ["SEO","Google","Content"] },
      { name: "Motion Design Fundamentals", sub: "Karim Dridi",    tags: ["After Effects","Animation","Lottie"] },
      { name: "High-Converting Copy",       sub: "Elena Russo",    tags: ["Copywriting","Marketing","Email"] },
      { name: "Mobile App Architecture",    sub: "Mehdi Toumi",    tags: ["Mobile","Flutter","React Native"] },
    ],
  },
  {
    key: "clients", label: "Clients", icon: "🏢", path: "/clients",
    data: [
      { name: "TechFlow Inc.",  sub: "Technology", tags: ["React","TypeScript","SaaS"] },
      { name: "CreativeStudio", sub: "Design",     tags: ["Branding","UI/UX","Motion"] },
      { name: "GrowthLab",      sub: "Marketing",  tags: ["SEO","Paid Ads","Analytics"] },
      { name: "NovaSaaS",       sub: "Technology", tags: ["Next.js","PostgreSQL","AWS"] },
      { name: "BrandVoice",     sub: "Writing",    tags: ["Copywriting","Strategy","Content"] },
      { name: "CloudNine",      sub: "Technology", tags: ["Kubernetes","Terraform","CI/CD"] },
    ],
  },
];

function filterGroup(data, q) {
  const lower = q.toLowerCase();
  return data.filter(item =>
    item.name.toLowerCase().includes(lower) ||
    item.sub.toLowerCase().includes(lower) ||
    item.tags.some(t => t.toLowerCase().includes(lower))
  );
}

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function getRoleColor(role) {
  return role === "client"
    ? { bg: "bg-sky-100 dark:bg-sky-900/30",     text: "text-sky-700 dark:text-sky-400",       label: "Client" }
    : { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "Freelancer" };
}

// ─── User Notifications Panel ─────────────────────────────────────────────────

async function getNotifLink(n) {
  if (!n) return '/courses';
  const k = n.kind || '';
  const API_URL = 'https://famamennou-server.onrender.com/api';

  // ── Admin notification kinds ──
  if (k === 'new_submission')          return '/admin/dashboard?tab=cin';
  if (k === 'new_user')                return '/admin/dashboard?tab=allusers';
  if (k === 'new_project')             return '/admin/dashboard?tab=allusers';
  if (k === 'withdrawal')              return '/admin/dashboard?tab=allusers';
  if (k.startsWith('lesson_pending_')) return '/admin/dashboard?tab=lessons';
  // course_created_25 / course_approved_25 / course_rejected_25
  const courseMatch = k.match(/^course_(?:created|approved|rejected)_(\d+)$/);
  if (courseMatch) return `/courses/${courseMatch[1]}`;
  // lesson_created_10_course_3 (new format)
  const lessonWithCourse = k.match(/^lesson_(?:created|approved|rejected)_\d+_course_(\d+)$/);
  if (lessonWithCourse) return `/courses/${lessonWithCourse[1]}`;
  // lesson_created_10 (old format) — fetch lesson to get course_id
  const lessonOnly = k.match(/^lesson_(?:created|approved|rejected)_(\d+)$/);
  if (lessonOnly) {
    try {
      const r = await fetch(`${API_URL}/lessons/${lessonOnly[1]}`);
      const l = await r.json();
      if (l?.course_id) return `/courses/${l.course_id}`;
    } catch {}
  }
  if (k === 'course_pending') return '/dashboard?tab=courses';
  if (k.startsWith('profile_saved')) return '/dashboard?tab=profile';
  if (k.startsWith('client_profile_saved')) return '/account?tab=profile';

  // ── Proposals workflow ──
  if (k.startsWith('new_proposal:'))       return '/projects';
  if (k.startsWith('proposal_accepted:'))  return '/messages';
  if (k.startsWith('proposal_rejected:'))  return '/dashboard?tab=find-projects';

  return '/courses';
}

function UserNotificationsPanel({ notifications, onMarkRead, onMarkAll, onClear, onClose }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-2 pt-14 sm:p-4 sm:pt-16" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{t("Notifications")}</p>
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">{unread}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'min(384px, 60vh)' }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p className="text-xs font-semibold">{t("No notifications")}</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={async () => { onMarkRead(n.id); const link = await getNotifLink(n); onClose(); navigate(link); }}
                className={[
                  "flex items-start gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors",
                  n.read
                    ? "bg-white dark:bg-slate-900"
                    : "bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
                ].join(" ")}
              >
                <div className={[
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm",
                  n.kind === "approved" || n.kind?.startsWith("proposal_accepted") ? "bg-emerald-100 dark:bg-emerald-900/30" :
                  n.kind === "rejected" || n.kind?.startsWith("proposal_rejected") ? "bg-rose-100 dark:bg-rose-900/30" :
                  n.kind?.startsWith("new_proposal") ? "bg-indigo-100 dark:bg-indigo-900/30" :
                  "bg-amber-100 dark:bg-amber-900/30",
                ].join(" ")}>
                  {n.kind === "approved" || n.kind?.startsWith("proposal_accepted") ? "✅" :
                   n.kind === "rejected" || n.kind?.startsWith("proposal_rejected") ? "❌" :
                   n.kind?.startsWith("new_proposal") ? "📩" : "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold mb-0.5 ${n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Messages Dropdown Panel ──────────────────────────────────────────────────

const MSG_COLORS = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500','bg-violet-500','bg-teal-500'];
const msgAvatarColor = email => MSG_COLORS[(email?.charCodeAt(0) ?? 0) % MSG_COLORS.length];

function fmtMsgPanelTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), h = (Date.now() - d) / 3600000;
  if (h < 1)   return `${Math.max(1, Math.floor(h * 60))}m ago`;
  if (h < 24)  return `${Math.floor(h)}h ago`;
  if (h < 168) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessagesPanel({ conversations, senderEmail, isAdmin, onClose, onChatOpen }) {
  const ADMIN_DISPLAY_NAME = 'Fama Mennou TEAM';
  const ADMIN_EMAIL_CONST  = 'admin@famamennou.com';

  const unreadConvs  = conversations.filter(c => Number(c.unread_count) > 0);
  const displayList  = unreadConvs.length > 0 ? unreadConvs : conversations.slice(0, 8);
  const totalUnread  = conversations.reduce((s, c) => s + Number(c.unread_count || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-2 pt-14 sm:p-4 sm:pt-16"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm">Messages</p>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold leading-none">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'min(420px, 62vh)' }}>
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <svg className="w-9 h-9 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="text-xs font-semibold">No messages yet</p>
            </div>
          ) : (
            displayList.map(conv => {
              const unread = Number(conv.unread_count || 0);
              const email  = conv.other_email || '';
              const isAdminConv = email.toLowerCase() === ADMIN_EMAIL_CONST;
              const name   = isAdminConv
                ? ADMIN_DISPLAY_NAME
                : (conv.user_name || email.split('@')[0] || email);
              const photo  = isAdminConv ? null : (conv.user_photo || null);

              return (
                <div
                  key={email}
                  onClick={() => onChatOpen(email)}
                  className={[
                    "flex items-start gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors",
                    unread > 0
                      ? "bg-rose-50/40 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800",
                  ].join(' ')}
                >
                  {/* Avatar with unread badge */}
                  <div className="relative shrink-0">
                    {photo
                      ? <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover" />
                      : <div className={`w-10 h-10 ${msgAvatarColor(email)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {(name || '?').slice(0, 2).toUpperCase()}
                        </div>
                    }
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none shadow">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                        {name}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                        {fmtMsgPanelTime(conv.created_at)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                      {conv.sender_email === senderEmail ? 'You: ' : ''}
                      {conv.last_message || '📷 Photo'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onChatOpen(null)}
            className="w-full py-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            View all messages →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar({ dark, toggleDark, onLogin, language = "en", onLanguageChange }) {
  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [langOpen,      setLangOpen]      = useState(false);
  const [profOpen,      setProfOpen]      = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [search,        setSearch]        = useState("");
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [msgUnread,       setMsgUnread]       = useState(0);
  const [msgConversations,setMsgConversations] = useState([]);
  const [msgPanelOpen,    setMsgPanelOpen]    = useState(false);
  const searchRef = useRef(null);

  const { t }          = useTranslation();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { user, logout, getUserNotifications, getAdminNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications, fetchNotifications } = useAuth();
  const profileRef     = useRef(null);

  // Poll notifications every 8 seconds so new ones appear automatically
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => { fetchNotifications(); }, 8000);
    return () => clearInterval(id);
  }, [user, fetchNotifications]);

  // Poll message conversations (unread count + full list for panel) every 5 seconds
  useEffect(() => {
    if (!user) return;
    const senderEmail = user.isAdmin ? 'admin@famamennou.com' : user.email;
    const fetchMsgs = async () => {
      try {
        const url = user.isAdmin
          ? 'https://famamennou-server.onrender.com/api/messages/admin/conversations'
          : `https://famamennou-server.onrender.com/api/messages/conversations/${encodeURIComponent(senderEmail)}`;
        const data = await fetch(url).then(r => r.json());
        if (Array.isArray(data)) {
          setMsgConversations(data);
          setMsgUnread(data.reduce((s, c) => s + (Number(c.unread_count) || 0), 0));
        }
      } catch {}
    };
    fetchMsgs();
    const id = setInterval(fetchMsgs, 5000);
    return () => clearInterval(id);
  }, [user]);

  // Get user notifications (only for logged-in non-admin users)
  const userNotifications = (user && !user.isAdmin) ? getUserNotifications(user.email) : [];
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Admin notifications
  const adminNotifications = user?.isAdmin ? getAdminNotifications() : [];
  const adminUnreadCount = adminNotifications.filter(n => !n.read).length;

  const NAV_LINKS = [
    { label: t("Find Freelancers"), to: "/freelancers" },
    { label: t("Find Clients"),     to: "/clients"     },
    { label: t("Courses"),          to: "/courses"      },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setLangOpen(false);
    setProfOpen(false);
    setNotifOpen(false);
    setSearch("");
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setSearchOpen(false); setSearch(""); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleStyle = user ? getRoleColor(user.role) : null;

  const searchGroups = search.trim()
    ? SEARCH_GROUPS.map(g => ({ ...g, results: filterGroup(g.data, search).slice(0, 3) })).filter(g => g.results.length > 0)
    : [];

  const handleSearchNavigate = (path, q) => {
    navigate(`${path}?q=${encodeURIComponent(q)}`);
    setSearch("");
    setSearchOpen(false);
  };

  // ── FIXED: properly passes pathname + search so ?tab= is always picked up ──
  const handleDropdownNavigate = (to) => {
    const [pathname, search] = to.split("?");
    navigate({ pathname, search: search ? `?${search}` : "" });
  };

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 shadow-sm"
            : "bg-white dark:bg-slate-950",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <a href="/" className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white">
              Fama<span className="text-indigo-600">Mennou</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {NAV_LINKS.map(link => {
                const isActive = location.pathname === link.to;
                return (
                  <MotionLink
                    key={link.to}
                    to={link.to}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-indigo-900/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"
                      />
                    )}
                  </MotionLink>
                );
              })}
            </nav>

            <div className="flex-1 hidden md:block max-w-sm mx-auto relative" ref={searchRef}>
              <Searchbar
                value={search}
                onChange={(v) => { setSearch(v); setSearchOpen(!!v.trim()); }}
                onSearch={(v) => { if (v.trim()) handleSearchNavigate(searchGroups[0]?.path || "/freelancers", v); }}
                placeholder={t("Search…")}
                compact
              />
              <AnimatePresence>
                {searchOpen && search.trim() && (
                  <motion.div
                    key="search-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto"
                  >
                    {searchGroups.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-slate-400">No results for "{search}"</div>
                    ) : (
                      searchGroups.map(group => (
                        <div key={group.key} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.icon} {group.label}</span>
                            <button onClick={() => handleSearchNavigate(group.path, search)} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">See all →</button>
                          </div>
                          {group.results.map((item, i) => (
                            <button key={i} onClick={() => handleSearchNavigate(group.path, item.name)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group/item">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">{item.name}</p>
                                <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                              </div>
                              <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-auto">

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img src={LANGUAGES.find(l => l.code === language)?.flag} className="w-6 shadow-sm rounded-sm" alt="flag" />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { onLanguageChange(lang.code); setLangOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                            language === lang.code
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <img src={lang.flag} className="w-5 h-3.5 object-cover rounded-[1px]" alt="" />
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleDark}
                className="relative w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {/* Sun — visible in light, rotates out in dark */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/><path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/><path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                </svg>
                {/* Moon — hidden in light, rotates in for dark */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true">
                  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
                </svg>
              </button>

              {/* ── LOGGED IN: Notification Bell + Profile Avatar + Dropdown ── */}
              {user ? (
                <>
                  {/* ── Messages Icon ── */}
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      setProfOpen(false);
                      setMenuOpen(false);
                      setLangOpen(false);
                      setMsgPanelOpen(v => !v);
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                    title="Messages"
                  >
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {msgUnread > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">
                        {msgUnread > 9 ? '9+' : msgUnread}
                      </span>
                    )}
                  </button>

                  {/* ── Notification Bell ── */}
                  <button
                    onClick={() => {
                      setNotifOpen(v => {
                        if (!v) {
                          if (user.isAdmin) markAllNotificationsRead("admin");
                          else markAllNotificationsRead("user", user?.email);
                        }
                        return !v;
                      });
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    {(user.isAdmin ? adminUnreadCount : unreadCount) > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">
                        {(user.isAdmin ? adminUnreadCount : unreadCount) > 9 ? "9+" : (user.isAdmin ? adminUnreadCount : unreadCount)}
                      </span>
                    )}
                  </button>

                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfOpen(!profOpen)}
                      className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
                    >
                      {/* Avatar circle */}
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
                        {getInitials(user.name)}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                        <p className="text-[10px] text-slate-400 leading-tight capitalize">{user.role ?? "member"}</p>
                      </div>
                      {/* Chevron */}
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {profOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          {/* Header */}
                          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base font-bold shadow-md flex-shrink-0">
                                {getInitials(user.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  {user.isAdmin ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                                      Admin
                                    </span>
                                  ) : user.role && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                                      {roleStyle.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-1.5">

                            {(user.isAdmin
                              ? [
                                  {
                                    label: "Admin Dashboard",
                                    to: "/admin/dashboard",
                                    icon: (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                      </svg>
                                    ),
                                  },
                                  {
                                    label: t("Log out"),
                                    logout: true,
                                    emoji: "🚪",
                                  },
                                ]
                              : user.role === "freelancer"
                                ? [
                                    { label: t("Profil"),       to: "/dashboard?tab=profile",       emoji: "👤" },
                                    { label: "Trouver projet",  to: "/dashboard?tab=find-projects", emoji: "🔎" },
                                    { label: "Gains",           to: "/dashboard?tab=gains",         emoji: "💰" },
                                    { label: t("Chat"),         to: "/messages",                    emoji: "💬" },
                                    { label: t("Paramètres"),   to: "/dashboard?tab=settings",      emoji: "⚙️" },
                                  ]
                                : [
                                    { label: t("Profil"),       to: "/profile",    emoji: "👤" },
                                    { label: t("Projets"),      to: "/projects",   emoji: "🗂️" },
                                    { label: t("Paiements"),    to: "/payments",   emoji: "💳" },
                                    { label: t("Chat"),         to: "/messages",   emoji: "💬" },
                                    { label: t("Paramètres"),   to: "/settings",   emoji: "⚙️" },
                                  ]
                            ).map(item => (
                              <button
                                key={item.label}
                                onClick={() => {
                                  setProfOpen(false);
                                  if (item.logout) setLogoutConfirm(true);
                                  else if (item.to) handleDropdownNavigate(item.to);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                  item.logout
                                    ? "font-bold bg-rose-600 hover:bg-rose-700 text-white"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <span className="text-base w-5 text-center">{item.emoji || item.icon}</span>
                                {item.label}
                              </button>
                            ))}

                            {!user.isAdmin && (
                              <button
                                onClick={() => { setProfOpen(false); setLogoutConfirm(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors rounded-none"
                              >
                                <span className="text-base w-5 text-center">🚪</span>
                                {t("Log out")}
                              </button>
                            )}
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost"   onClick={() => onLogin("login")}>{t("Log in")}</Button>
                  <Button variant="primary" onClick={() => onLogin("signup")}>{t("Sign up")}</Button>
                </div>
              )}

              {/* Mobile Burger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <div className="space-y-1">
                  <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                  <span className={`block w-5 h-0.5 bg-slate-600 ${menuOpen ? "opacity-0" : ""}`} />
                  <span className={`block w-5 h-0.5 bg-slate-600 transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 lg:hidden flex flex-col overflow-y-auto"
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <a href="/" className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white">
                Fama<span className="text-indigo-600">Mennou</span>
              </a>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-lg font-bold">✕</button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <Searchbar
                value={search}
                onChange={(v) => { setSearch(v); setSearchOpen(!!v.trim()); }}
                onSearch={(v) => { if (v.trim()) { handleSearchNavigate(searchGroups[0]?.path || "/freelancers", v); setMenuOpen(false); }}}
                placeholder={t("Search…")}
                compact
              />
              {searchOpen && search.trim() && (
                <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {searchGroups.length === 0 ? (
                    <div className="px-5 py-4 text-center text-sm text-slate-400">No results for "{search}"</div>
                  ) : (
                    searchGroups.map(group => (
                      <div key={group.key} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.icon} {group.label}</span>
                          <button onClick={() => { handleSearchNavigate(group.path, search); setMenuOpen(false); }} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">See all →</button>
                        </div>
                        {group.results.map((item, i) => (
                          <button key={i} onClick={() => { handleSearchNavigate(group.path, item.name); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                              <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                            </div>
                            <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-3 py-2 gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-colors ${
                    location.pathname === link.to
                      ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Bottom section */}
            <div className="mt-auto px-5 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              {user ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); setLogoutConfirm(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    {t("Log out")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { onLogin("login"); setMenuOpen(false); }}
                    className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-indigo-400 transition-colors"
                  >
                    {t("Log in")}
                  </button>
                  <button
                    onClick={() => { onLogin("signup"); setMenuOpen(false); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30"
                  >
                    {t("Sign up")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notifications Panel ── */}
      {notifOpen && user && !user.isAdmin && (
        <UserNotificationsPanel
          notifications={userNotifications}
          onMarkRead={id => markNotificationRead(id)}
          onMarkAll={() => markAllNotificationsRead("user", user.email)}
          onClear={() => clearNotifications("user", user.email)}
          onClose={() => setNotifOpen(false)}
        />
      )}
      {notifOpen && user?.isAdmin && (
        <UserNotificationsPanel
          notifications={adminNotifications}
          onMarkRead={id => markNotificationRead(id)}
          onMarkAll={() => markAllNotificationsRead("admin")}
          onClear={() => clearNotifications("admin")}
          onClose={() => setNotifOpen(false)}
        />
      )}

      {/* ── Messages Panel ── */}
      <AnimatePresence>
        {msgPanelOpen && user && (
          <MessagesPanel
            conversations={msgConversations}
            senderEmail={user.isAdmin ? 'admin@famamennou.com' : user.email}
            isAdmin={!!user.isAdmin}
            onClose={() => setMsgPanelOpen(false)}
            onChatOpen={(email) => {
              setMsgPanelOpen(false);
              if (!user) return;
              const isAdmin = !!user.isAdmin;
              const dest = email
                ? (isAdmin
                    ? `/admin/dashboard?tab=chat&with=${encodeURIComponent(email)}`
                    : `/messages?with=${encodeURIComponent(email)}`)
                : (isAdmin ? '/admin/dashboard?tab=chat' : '/messages');
              navigate(dest);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Logout Confirmation Modal ── */}
      <AnimatePresence>
        {logoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-0">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-2xl">
                  🚪
                </div>
                <button
                  onClick={() => setLogoutConfirm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                  {t("Se déconnecter ?")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("Vous serez redirigé vers la page d'accueil.")}
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t("Annuler")}
                </button>
                <button
                  onClick={() => { logout(); setLogoutConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-bold text-white transition-colors shadow-sm shadow-rose-500/30"
                >
                  {t("Oui, déconnecter")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}