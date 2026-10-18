// src/components/Navbar.js
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useRealtimeChannel } from "../lib/useRealtimeChannel";
import { cldImg } from "../utils/cloudinary";
import { useTranslation } from "react-i18next";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import Icon from "./ds/Icon";
import { displayName, getInitials } from "../utils/names";

const API_URL = process.env.REACT_APP_API_URL || "https://famamennou-server.onrender.com/api";

// What the account menu calls the signed-in person: the first word of their name, like every other page.
// (The team's own account keeps its full name.)
const shownName = u => (u?.isAdmin ? u.name : displayName(u?.name));

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

// Token colours as CSS values (rgb(var(--ds-x))) so inline styles follow the
// theme toggle and the page accent.
const tok = (name, alpha) => `rgb(var(--ds-${name})${alpha != null ? ` / ${alpha}` : ''})`;
const INFO = tok('info'), OK = tok('ok'), WARN = tok('warn'), BAD = tok('bad'), ACCENT = tok('accent'), MUTE = tok('mute');


// ── Notification link resolver ─────────────────────────────────────────────────
// ── Notifications panel ────────────────────────────────────────────────────────
function NotifPanel({ notifications, onClose }) {
  const { t } = useTranslation();
  const unread    = notifications.filter(n => !n.read).length;

  return (
    <div className="ds fixed inset-0 z-50 flex items-start justify-end p-1 pt-[calc(72px+var(--fm-topbar-offset,0px))] sm:p-4 sm:pt-[calc(76px+var(--fm-topbar-offset,0px))]" onClick={onClose}>
      <div className="ds-pop w-full overflow-hidden" style={{ maxWidth: 'min(380px, calc(100vw - 8px))' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ds-line px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ds-ink">{t("Notifications")}</p>
            {unread > 0 && <span className="rounded-full bg-ds-fill px-2 py-0.5 text-[10px] font-extrabold text-white">{unread}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label={t("Cancel")} className="ds-iconbtn !h-7 !w-7"><Icon name="close" size={18} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "min(380px,60vh)" }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-ds-faint">
              <Icon name="notifications" size={32} className="opacity-50" />
              <p className="text-xs font-semibold">{t("No notifications")}</p>
            </div>
          ) : notifications.map(n => {
            const kind = n.kind || "";
            const tint = kind.startsWith("proposal_accepted") ? OK : kind.startsWith("proposal_rejected") ? BAD : ACCENT;
            const glyph = kind.startsWith("proposal_accepted") ? "check" : kind.startsWith("proposal_rejected") ? "close" : kind.startsWith("new_proposal") ? "mail" : "notifications";
            return (
              <div key={n.id}
                className="flex items-start gap-3 border-b border-ds-line px-5 py-3.5 text-start"
                style={{ background: n.read ? "transparent" : tok('accent', 0.07) }}>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}>
                  <Icon name={glyph} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`mb-0.5 truncate text-xs font-bold ${n.read ? 'text-ds-mute' : 'text-ds-ink'}`}>{n.title}</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-ds-faint">{n.message}</p>
                  <p className="mt-1 text-[10px] text-ds-faint">
                    {new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-ds-accent" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Messages panel ────────────────────────────────────────────────────────────
const MSG_COLORS = ["#6366f1","#a855f7","#3ec2e8","#6c8cf6","#f59e0b","#10b981"];
const msgColor = email => MSG_COLORS[(email?.charCodeAt(0) ?? 0) % MSG_COLORS.length];

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts), h = (Date.now() - d) / 3600000;
  if (h < 1)   return `${Math.max(1, Math.floor(h * 60))}m`;
  if (h < 24)  return `${Math.floor(h)}h`;
  if (h < 168) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessagesPanel({ conversations, senderEmail, onClose, onChatOpen }) {
  const totalUnread = conversations.reduce((s, c) => s + Number(c.unread_count || 0), 0);
  const display = conversations.filter(c => Number(c.unread_count) > 0).length > 0
    ? conversations.filter(c => Number(c.unread_count) > 0)
    : conversations.slice(0, 8);

  return (
    <div className="ds fixed inset-0 z-50 flex items-start justify-end p-1 pt-[calc(72px+var(--fm-topbar-offset,0px))] sm:p-4 sm:pt-[calc(76px+var(--fm-topbar-offset,0px))]" onClick={onClose}>
      <motion.div initial={{ opacity:0,scale:.95,y:-8 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:.95,y:-8 }} transition={{ duration:.14 }}
        className="ds-pop w-full overflow-hidden"
        style={{ maxWidth: 'min(380px, calc(100vw - 8px))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ds-line px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ds-ink">Messages</p>
            {totalUnread > 0 && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: BAD }}>{totalUnread > 99 ? "99+" : totalUnread}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ds-iconbtn !h-7 !w-7"><Icon name="close" size={18} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight:"min(420px,62vh)" }}>
          {display.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-ds-faint">
              <Icon name="chat_bubble" size={36} className="opacity-40" />
              <p className="text-xs font-semibold">Aucun message</p>
            </div>
          ) : display.map(conv => {
            const unread = Number(conv.unread_count || 0);
            const email  = conv.other_email || "";
            const isAdminConv = email.toLowerCase() === "admin@famamennou.com";
            const name   = isAdminConv ? "Fama Mennou TEAM" : (displayName(conv.user_name) || email.split("@")[0]);
            const photo  = isAdminConv ? null : conv.user_photo;
            return (
              <div key={email} role="button" tabIndex={0}
                onClick={() => onChatOpen(email)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChatOpen(email); } }}
                aria-label={name}
                className="flex cursor-pointer items-start gap-3 border-b border-ds-line px-5 py-3.5 text-start transition-colors"
                style={{ background: unread > 0 ? tok('bad', 0.06) : "transparent" }}>
                <div className="relative flex-none">
                  {photo ? <img src={cldImg(photo)} alt={name} className="h-10 w-10 rounded-full object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: msgColor(email) }}>{name.slice(0,2).toUpperCase()}</div>
                  }
                  {unread > 0 && <span className="absolute -top-1 -end-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">{unread > 9 ? "9+" : unread}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={`truncate text-sm font-semibold ${unread > 0 ? 'text-ds-ink' : 'text-ds-mute'}`}>{name}</p>
                    <span className="flex-none text-[10px] tabular-nums text-ds-faint">{fmtTime(conv.created_at)}</span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${unread > 0 ? 'text-ds-mute' : 'text-ds-faint'}`}>
                    {conv.sender_email === senderEmail ? "Vous: " : ""}{conv.last_message || "Photo"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ds-line">
          <button type="button" onClick={() => onChatOpen(null)} className="flex w-full items-center justify-center gap-1.5 py-3.5 text-sm font-semibold text-ds-accent transition-colors hover:bg-ds-accent-soft">
            Voir tous les messages <Icon name="arrow_forward" size={16} flip />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LogoMark({ style, className }) {
  return <img src="/logo.png" alt="" className={className} style={{ mixBlendMode: "var(--fm-logo-blend)", ...style }} />;
}

function Avatar({ user, size = 32 }) {
  return (
    <span className="flex flex-none items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
      style={{ width: size, height: size, background: user.photo ? 'transparent' : avatarGradient(user.email) }}>
      {user.photo ? <img src={cldImg(user.photo)} alt={shownName(user)} className="h-full w-full object-cover" /> : getInitials(user.name)}
    </span>
  );
}

const LANGS = [
  { code:'fr', label:'Français',  short:'FR' },
  { code:'en', label:'English',   short:'EN' },
  { code:'ar', label:'العربية',   short:'AR' },
];

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar({ onLogin }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  // The home page's primary action is publishing a project; everywhere else it
  // is plain sign-up (both open the sign-up modal for a visitor).
  const isHome = location.pathname === '/';
  const NAV_LINKS = [
    { label: t('home.ac.hire.title'), to: "/freelancers" },
    { label: t('home.ac.client.title'), to: "/clients" },
    { label: t('Courses'), to: "/courses" },
  ];
  const { user, logout, getUserNotifications, getAdminNotifications,
          markAllNotificationsRead,
          fetchNotifications } = useAuth();

  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profOpen,    setProfOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  useBodyScrollLock(logoutModal);
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

  // Navbar is mounted on every page for every logged-in user, so this poll ran
  // once a minute per open tab forever, with no visibility check — the single
  // biggest reason Neon's compute could never reach idle suspend (the messages
  // table showed 322k sequential scans against 2.8k index scans).
  //
  // The realtime channel below already delivers `new_message`, so the unread
  // badge stays live without polling at all. What remains is a low-frequency
  // safety net for the cases a socket can miss — a dropped connection, a
  // message sent while the socket was reconnecting — and it only runs while
  // the tab is actually visible. A hidden or backgrounded tab now performs
  // zero database work.
  useEffect(() => {
    if (!senderEmail) return;
    fetchMsgs();

    const FALLBACK_MS = 5 * 60 * 1000;
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return;
      fetchMsgs();
    };
    const id = setInterval(refreshIfVisible, FALLBACK_MS);
    // Re-sync immediately when the user comes back to the tab, so the badge is
    // never stale on return even though nothing ran while it was hidden.
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [senderEmail, fetchMsgs]);

  useRealtimeChannel(senderEmail, { new_message: fetchMsgs });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setMenuOpen(false); setProfOpen(false);
    setNotifOpen(false); setMsgOpen(false);
  }, [location.pathname]);

  // Escape dismisses whichever panel/modal is open — previously only a
  // backdrop click could close these, so keyboard-only users had no way
  // out short of tabbing all the way through the panel's contents.
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false); setProfOpen(false);
      setNotifOpen(false); setMsgOpen(false);
      setLogoutModal(false); setLangOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (top) window.scrollTo(0, -parseInt(top));
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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

  // Header action per page, as on the supplied screens: "Publier un besoin" on Home
  // and Freelancers, "Publier un projet" on Clients, "Proposer un cours" on Courses.
  // A visitor's click opens the sign-up dialog; a signed-in client or freelancer gets
  // the same button (from 1440px up, where the header has room) straight to the form.
  const path = location.pathname;
  const ctaLabel = path === '/clients' ? t('nav.cta_project')
    : path === '/courses' ? t('nav.cta_course')
    : (isHome || path === '/freelancers') ? t('nav.cta_need')
    : t('Sign up');
  // The full labels are long for a 360px header next to the logo and the menu button, so
  // phones narrower than 400px get a one-word version of the same action.
  const ctaShort = path === '/courses' ? t('nav.cta_short_course')
    : (path === '/clients' || isHome || path === '/freelancers') ? t('nav.cta_short_post')
    : ctaLabel;
  const memberCta = user?.role === 'client' && (isHome || path === '/freelancers' || path === '/clients')
    ? { label: path === '/clients' ? t('nav.cta_project') : t('nav.cta_need'), go: () => navigate('/projects?post=1') }
    : user?.role === 'freelancer' && path === '/courses'
      ? { label: t('nav.cta_course'), go: () => navigate('/courses?create=1') }
      : null;
  // The supplied Clients screen draws this button outlined, with a plus icon; the others fill it.
  const ctaOutlined = path === '/clients';
  const ctaSkin = ctaOutlined
    ? 'ds-btn border-ds-accent-line bg-ds-accent-soft text-ds-accent hover:bg-ds-accent/20'
    : 'ds-btn ds-btn-primary';
  const activeLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  const handleDropdownNavigate = (to) => {
    const [pathname, qs] = to.split("?");
    navigate({ pathname, search: qs ? `?${qs}` : "" });
  };

  const userNotifs  = user && !user.isAdmin ? getUserNotifications(user.email) : [];
  const adminNotifs = user?.isAdmin ? getAdminNotifications() : [];
  const notifs      = user?.isAdmin ? adminNotifs : userNotifs;
  const unreadCount = notifs.filter(n => !n.read).length;

  // Small tinted icon tile used in the profile menu. Colours arrive as CSS
  // values, so the tint is derived with color-mix rather than by appending an
  // alpha suffix to a hex string.
  const MenuIcon = ({ name, color }) => (
    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
      <Icon name={name} size={16} />
    </span>
  );

  const MENU_ITEMS = user?.isAdmin
    ? [
        { icon: <MenuIcon color={ACCENT} name="shield" />, label: t("Dashboard"), to: "/admin/dashboard" },
        { icon: <MenuIcon color={ACCENT} name="group" />, label: t('home.ac.hire.title'), to: "/freelancers" },
        { icon: <MenuIcon color={INFO} name="work" />, label: t('home.ac.client.title'), to: "/clients" },
        { icon: <MenuIcon color={OK} name="school" />, label: t('Courses'), to: "/courses" },
        { icon: <MenuIcon color={BAD} name="logout" />, label: t("Sign out"), logout: true },
      ]
    : user?.role === "freelancer"
      ? [
          { icon: <MenuIcon color={ACCENT} name="person" />, label: t("My Profile"),  to: "/dashboard?tab=profile" },
          { icon: <MenuIcon color={OK} name="trending_up" />, label: t("nav.gains"),   to: "/dashboard?tab=gains" },
          { icon: <MenuIcon color={INFO} name="chat" />, label: t("msg.page_title"), to: "/messages" },
          { icon: <MenuIcon color={MUTE} name="settings" />, label: t("Settings"), to: "/dashboard?tab=settings" },
          { icon: <MenuIcon color={BAD} name="logout" />, label: t("Sign out"),  logout: true },
        ]
      : [
          { icon: <MenuIcon color={ACCENT} name="person" />, label: t("My Profile"),   to: "/dashboard"  },
          { icon: <MenuIcon color={WARN} name="work" />,         label: t("My Projects"),  to: "/projects"   },
          { icon: <MenuIcon color={OK} name="credit_card" />,    label: t("nav.payments"), to: "/payments"   },
          { icon: <MenuIcon color={INFO} name="chat" />,         label: t("msg.page_title"), to: "/messages" },
          { icon: <MenuIcon color={MUTE} name="settings" />,     label: t("Settings"),     to: "/settings"   },
          { icon: <MenuIcon color={BAD} name="logout" />,        label: t("Sign out"),     logout: true      },
        ];

  const roleLabel = u => (u.isAdmin ? t('dash.role.admin') : u.role === 'freelancer' ? t('dash.role.freelancer') : u.role === 'client' ? t('dash.role.client') : (u.role ?? "membre"));

  const themeButton = (extra = "") => (
    <button type="button" onClick={toggleTheme} className={`ds-iconbtn ${extra}`}
      title={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}>
      <Icon name={darkMode ? 'light_mode' : 'dark_mode'} size={19} />
    </button>
  );

  const langMenu = (
    <div className="relative hidden sm:block" ref={langRef}>
      <button type="button"
        onClick={() => { setLangOpen(v => !v); setProfOpen(false); setNotifOpen(false); setMsgOpen(false); }}
        aria-expanded={langOpen} aria-haspopup="menu" aria-label={t('nav.languages')}
        className="ds-iconbtn ds-iconbtn-boxed !w-auto gap-1 !px-2.5 text-[12px] font-bold tracking-wide">
        <Icon name="language" size={16} />
        {activeLang.short}
        <Icon name="expand_more" size={16} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {langOpen && (
          <motion.div role="menu"
            initial={{ opacity:0, scale:.96, y:6 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.96, y:6 }} transition={{ duration:.13 }}
            className="ds-pop absolute end-0 z-[60] mt-2 w-44 overflow-hidden">
            {LANGS.map(l => (
              <button key={l.code} type="button" role="menuitem"
                onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                aria-current={i18n.language === l.code ? 'true' : undefined}
                className="ds-menuitem !px-3.5 !py-2.5">
                <span className="w-6 flex-none text-center text-[11px] font-extrabold tracking-wide text-ds-faint">{l.short}</span>
                <span className="flex-1 font-semibold">{l.label}</span>
                {i18n.language === l.code && <Icon name="check" size={16} className="text-ds-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes glowFloat {
          0%,100% { filter:drop-shadow(0 0 8px rgba(99,102,241,.45)); transform:translateY(0); }
          50%      { filter:drop-shadow(0 0 14px rgba(129,140,248,.6)); transform:translateY(-2px); }
        }
        @media (prefers-reduced-motion: reduce) { .fm-logo-glow { animation: none !important; } }
      `}</style>

      {/* ── Fixed header ── */}
      {/* top: the brand strip above the header (TopBar) pushes it down until it has scrolled away. */}
      <header className={`ds ds-header fixed inset-x-0 top-0 z-40 ${scrolled ? 'is-scrolled' : ''}`}
        style={{ top: 'var(--fm-topbar-offset, 0px)' }}>
        <div className="ds-wrap flex h-[66px] items-center gap-3 xl:gap-6">

          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-none items-center gap-2.5" aria-label="Fama Mennou">
            <LogoMark className="fm-logo-glow block h-[34px] w-auto flex-none sm:h-[38px]" style={{ animation: "glowFloat 4s ease-in-out infinite" }} />
            <span className="flex flex-col leading-[1.15]">
              <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-ds-ink max-[339px]:hidden min-[400px]:text-[17px]">
                Fama<span className="ds-brand-accent">&nbsp;Mennou</span>
              </span>
              <span className="hidden whitespace-nowrap text-[11px] font-medium text-ds-faint sm:block">{t('nav.tagline')}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} className="ds-navlink" aria-current={active ? 'page' : undefined}>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-ds-accent" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="min-w-3 flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {themeButton("hidden sm:inline-flex")}
            {langMenu}

            {user ? (
              <>
                {memberCta && (
                  <button type="button" onClick={memberCta.go} className={`${ctaSkin} !hidden !min-h-10 !px-[18px] min-[1440px]:!inline-flex`}>
                    {ctaOutlined && <Icon name="add_circle" size={18} />}{memberCta.label}
                  </button>
                )}

                {/* Messages — hidden on phones (also reachable from the menu) */}
                <button type="button"
                  onClick={() => { setNotifOpen(false); setProfOpen(false); setMsgOpen(v => !v); }}
                  className="ds-iconbtn hidden sm:inline-flex" title="Messages" aria-label="Messages">
                  <Icon name="chat_bubble" size={20} />
                  {msgUnread > 0 && <span className="ds-count-badge" style={{ background: BAD }}>{msgUnread > 9 ? "9+" : msgUnread}</span>}
                </button>

                {/* Bell — notifications */}
                <button type="button"
                  onClick={() => {
                    setNotifOpen(v => {
                      if (!v) { user.isAdmin ? markAllNotificationsRead("admin") : markAllNotificationsRead("user", user.email); }
                      return !v;
                    });
                    setMsgOpen(false); setProfOpen(false);
                  }}
                  className="ds-iconbtn" title="Notifications" aria-label="Notifications">
                  <Icon name="notifications" size={20} />
                  {unreadCount > 0 && <span className="ds-count-badge bg-ds-fill">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>

                <span className="mx-1 hidden h-5 w-px bg-ds-line sm:block" aria-hidden="true" />

                {/* Profile */}
                <div className="relative flex-none" ref={profRef}>
                  <button type="button"
                    onClick={() => { setProfOpen(v => !v); setNotifOpen(false); setMsgOpen(false); }}
                    aria-expanded={profOpen} aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-2xl border border-transparent py-1 ps-1 pe-1 transition-colors hover:bg-ds-line/10 sm:pe-2.5"
                    style={{ background: profOpen ? 'rgb(var(--ds-line) / .08)' : undefined, borderColor: profOpen ? 'rgb(var(--ds-line) / var(--ds-line-a))' : undefined }}>
                    <Avatar user={user} size={32} />
                    <span className="hidden text-start sm:block">
                      <span className="block text-xs font-bold leading-tight text-ds-ink">{shownName(user)}</span>
                      <span className="block text-[10px] capitalize leading-tight text-ds-faint">{roleLabel(user)}</span>
                    </span>
                    <Icon name="expand_more" size={16} className={`hidden text-ds-faint transition-transform sm:block ${profOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {profOpen && (
                      <motion.div role="menu"
                        initial={{ opacity:0, scale:.96, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.96, y:8 }} transition={{ duration:.14 }}
                        className="ds-pop absolute end-0 z-50 mt-2 w-64 overflow-hidden">
                        <div className="border-b border-ds-line px-4 py-3.5">
                          <div className="mb-2 flex items-center gap-2.5">
                            <Avatar user={user} size={36} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-ds-ink">{shownName(user)}</p>
                              <p className="truncate text-[11px] text-ds-faint">{user.email}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold capitalize ${user.isAdmin ? 'rounded-full border px-2 py-0.5' : 'text-ds-accent'}`}
                            style={user.isAdmin ? { background: tok('bad', 0.14), borderColor: tok('bad', 0.3), color: BAD } : undefined}>
                            {roleLabel(user)}
                          </span>
                        </div>
                        <div className="py-1.5">
                          {MENU_ITEMS.map(item => (
                            <button key={item.label} type="button" role="menuitem"
                              onClick={() => { setProfOpen(false); item.logout ? setLogoutModal(true) : handleDropdownNavigate(item.to); }}
                              className={`ds-menuitem !px-4 !py-2 ${item.logout ? 'mt-1 border-t border-ds-line' : ''}`}
                              style={item.logout ? { color: BAD } : undefined}>
                              {item.icon}
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={() => onLogin?.("login")} className="ds-btn ds-btn-ghost hidden sm:inline-flex">
                  {t("Log in")}
                </button>
                <button type="button" onClick={() => onLogin?.("signup")} className={`${ctaSkin} !min-h-9 !px-3 !text-[13px] sm:!min-h-10 sm:!px-[18px] sm:!text-sm`}>
                  {ctaOutlined && <Icon name="add_circle" size={18} className="hidden sm:block" />}
                  <span className="max-[399px]:hidden">{ctaLabel}</span>
                  <span className="hidden max-[399px]:inline">{ctaShort}</span>
                </button>
              </>
            )}

            {/* Hamburger — below xl (the supplied design shows the inline nav from 1280px) */}
            <button type="button"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? t('Close menu') : t('Open menu')}
              aria-expanded={menuOpen}
              className="ds-iconbtn ds-iconbtn-boxed xl:!hidden">
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
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
              className="fixed inset-0 z-[99] xl:hidden"
              style={{ background: "rgba(2,6,15,0.6)", backdropFilter: "blur(3px)" }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: isRTL ? "-100%" : "100%" }} animate={{ x: 0 }} exit={{ x: isRTL ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="ds fixed bottom-0 top-0 z-[100] flex flex-col overflow-y-auto border-ds-line bg-ds-canvas xl:hidden"
              style={{
                [isRTL ? 'left' : 'right']: 0,
                width: "min(320px, calc(100vw - 48px))",
                [isRTL ? 'borderRight' : 'borderLeft']: '1px solid rgb(var(--ds-line) / var(--ds-line-a))',
                boxShadow: isRTL ? "20px 0 60px rgba(0,0,0,0.4)" : "-20px 0 60px rgba(0,0,0,0.4)",
              }}
              aria-label={t('Menu')}
            >
              {/* Header */}
              <div className="flex flex-none items-center justify-between border-b border-ds-line px-4 py-3.5">
                <Link to="/" onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2">
                  <LogoMark className="block h-[30px] w-auto flex-none" />
                  <span className="text-[15px] font-bold text-ds-ink">Fama<span className="ds-brand-accent">&nbsp;Mennou</span></span>
                </Link>
                <div className="flex flex-none items-center gap-1.5">
                  {themeButton("ds-iconbtn-boxed")}
                  <button type="button" onClick={() => setMenuOpen(false)} aria-label={t('Close menu')} className="ds-iconbtn ds-iconbtn-boxed">
                    <Icon name="close" size={20} />
                  </button>
                </div>
              </div>

              {/* User info strip */}
              {user && (
                <div className="flex flex-none items-center gap-3 border-b border-ds-line px-4 py-3">
                  <Avatar user={user} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-tight text-ds-ink">{shownName(user)}</p>
                    <p className="truncate text-[10px] text-ds-faint">{user.email}</p>
                  </div>
                  <span className={`flex-none text-[10px] font-bold capitalize ${user.isAdmin ? 'rounded-full border px-2 py-0.5' : 'text-ds-accent'}`}
                    style={user.isAdmin ? { background: tok('bad', 0.14), borderColor: tok('bad', 0.3), color: BAD } : undefined}>
                    {user.isAdmin ? "Admin" : user.role}
                  </span>
                </div>
              )}

              {/* Language switcher — mobile has no other way to reach this */}
              <div className="flex flex-none items-center gap-2 border-b border-ds-line px-4 py-3">
                {LANGS.map(l => (
                  <button key={l.code} type="button"
                    onClick={() => i18n.changeLanguage(l.code)}
                    aria-pressed={i18n.language === l.code}
                    className="ds-pill flex-1 justify-center">
                    {l.short}
                  </button>
                ))}
              </div>

              {/* Nav links */}
              <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
                <p className="px-3 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-ds-faint">{t('nav.discover')}</p>
                {[
                  { label: t('home.ac.hire.title'),   to: "/freelancers", icon: "group",  color: ACCENT },
                  { label: t('home.ac.client.title'), to: "/clients",     icon: "work",   color: INFO },
                  { label: t('Courses'),              to: "/courses",     icon: "school", color: OK },
                ].map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-ds-accent-soft text-ds-accent' : 'text-ds-ink-2 hover:bg-ds-line/10'}`}>
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                        style={{ background: `color-mix(in srgb, ${item.color} ${active ? 22 : 12}%, transparent)`, color: item.color }}>
                        <Icon name={item.icon} size={18} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}

                {/* ── Account (logged-in non-admin, non-freelancer, non-client) ── */}
                {user && !user.isAdmin && user.role !== 'freelancer' && user.role !== 'client' && (
                  <>
                    <p className="px-3 pb-1.5 pt-3 text-[10px] font-extrabold uppercase tracking-widest text-ds-faint">{t('nav.account')}</p>
                    {[
                      { label: t("Dashboard"),        to: "/dashboard",  icon: "dashboard",    color: ACCENT },
                      { label: t("My Projects"),      to: "/projects",   icon: "work",         color: WARN },
                      { label: t("msg.page_title"),   to: "/messages",   icon: "chat",         color: INFO, badge: msgUnread },
                      { label: t("nav.payments"),     to: "/payments",   icon: "credit_card",  color: OK },
                      { label: t("Settings"),         to: "/settings",   icon: "settings",     color: MUTE },
                    ].map(item => {
                      const active = location.pathname === item.to;
                      return (
                        <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-ds-accent-soft text-ds-accent' : 'text-ds-ink-2 hover:bg-ds-line/10'}`}>
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                            style={{ background: `color-mix(in srgb, ${item.color} ${active ? 22 : 12}%, transparent)`, color: item.color }}>
                            <Icon name={item.icon} size={18} />
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {item.badge > 0 && (
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white" style={{ background: BAD }}>
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
              <div className="flex-none border-t border-ds-line px-4 pb-8 pt-3">
                {user ? (
                  <button type="button" onClick={() => { setMenuOpen(false); setLogoutModal(true); }}
                    className="ds-btn w-full"
                    style={{ background: tok('bad', 0.1), borderColor: tok('bad', 0.28), color: BAD }}>
                    {t("Sign out")}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => { onLogin?.("login"); setMenuOpen(false); }} className="ds-btn ds-btn-glass w-full">
                      {t("Log in")}
                    </button>
                    <button type="button" onClick={() => { onLogin?.("signup"); setMenuOpen(false); }} className="ds-btn ds-btn-primary w-full">
                      {ctaLabel}
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Notifications ── */}
      <AnimatePresence>
        {notifOpen && user && (
          <NotifPanel
            notifications={notifs}
            onClose={() => setNotifOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <AnimatePresence>
        {msgOpen && user && (
          <MessagesPanel
            conversations={msgConvs}
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
            className="ds fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(2,6,15,0.55)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity:0, scale:.94, y:12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.94, y:12 }} transition={{ duration:.18 }}
              className="ds-pop w-full max-w-sm overflow-hidden"
              role="dialog" aria-modal="true" aria-labelledby="logout-title"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pb-0 pt-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ background: tok('bad', 0.12), borderColor: tok('bad', 0.28), color: BAD }}>
                  <Icon name="logout" size={24} />
                </span>
                <button type="button" onClick={() => setLogoutModal(false)} aria-label={t('Cancel')} className="ds-iconbtn ds-iconbtn-boxed !rounded-full">
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="px-6 py-4">
                <h3 id="logout-title" className="mb-1 text-base font-extrabold text-ds-ink">{t('fd.logout_confirm')}</h3>
                <p className="text-sm text-ds-mute">{t('fd.logout_redirect')}</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setLogoutModal(false)} className="ds-btn ds-btn-glass flex-1">
                  {t('Cancel')}
                </button>
                <button type="button" onClick={() => { logout(); setLogoutModal(false); }}
                  className="ds-btn flex-1 text-white hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 8px 20px -8px rgba(239,68,68,.6)" }}>
                  {t('fd.yes_logout')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
