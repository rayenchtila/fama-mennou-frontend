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

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function getPlanColor(plan) {
  return plan === "premium"
    ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Premium ✦" }
    : { bg: "bg-slate-100 dark:bg-slate-700",    text: "text-slate-500 dark:text-slate-400",  label: "Free" };
}

function getRoleColor(role) {
  return role === "client"
    ? { bg: "bg-sky-100 dark:bg-sky-900/30",     text: "text-sky-700 dark:text-sky-400",       label: "Client" }
    : { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", label: "Freelancer" };
}

export default function Navbar({ dark, toggleDark, onLogin, language = "en", onLanguageChange }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [langOpen,  setLangOpen]  = useState(false);
  const [profOpen,  setProfOpen]  = useState(false);
  const [search,    setSearch]    = useState("");

  const { t }          = useTranslation();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const profileRef     = useRef(null);

  const NAV_LINKS = [
    { label: t("Find Freelancers"), to: "/freelancers" },
    { label: t("Find Clients"),     to: "/clients"     },
    { label: t("Courses"),          to: "/courses"      },
    { label: t("Jobs"),             to: "/jobs"         },
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
  }, [location.pathname]);

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

  const planStyle = user ? getPlanColor(user.plan) : null;
  const roleStyle = user ? getRoleColor(user.role) : null;

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
            <Link to="/" className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white">
              Fama<span className="text-indigo-600">Mennou</span>
            </Link>

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

            <div className="flex-1 hidden md:block max-w-sm mx-auto">
              <Searchbar value={search} onChange={setSearch} placeholder={t("Search…")} compact />
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
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {dark ? "🌙" : "☀️"}
              </button>

              {/* ── LOGGED IN: Profile Avatar + Dropdown ── */}
              {user ? (
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
                                {user.role && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                                    {roleStyle.label}
                                  </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${planStyle.bg} ${planStyle.text}`}>
                                  {planStyle.label}
                                </span>
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
                                  to: "/admin",
                                  icon: (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                    </svg>
                                  ),
                                },
                              ]
                            : [
                                {
                                  label: t("My Profile"),
                                  to: null,
                                  icon: (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                  ),
                                },
                                {
                                  label: t("Dashboard"),
                                  to: null,
                                  icon: (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                  ),
                                },
                                {
                                  label: t("Settings"),
                                  to: null,
                                  icon: (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                  ),
                                },
                              ]
                          ).map(item => (
                            <button
                              key={item.label}
                              onClick={() => { setProfOpen(false); if (item.to) navigate(item.to); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <span className="text-slate-400">{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                          <button
                            onClick={() => { logout(); setProfOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            {t("Log out")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
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
            className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 lg:hidden flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-xl">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">✕</button>
            </div>
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-2xl font-bold ${location.pathname === link.to ? "text-indigo-600" : "text-slate-400"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {user && (
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-semibold text-sm"
                >
                  {t("Log out")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}