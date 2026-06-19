// App.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FAQ from "./components/FAQ";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Authmodal from "./components/Authmodal";
import ToastProvider, { toast } from "./components/Toast";
import { PostJobModal, PostCourseModal, PostClientModal } from "./components/Postforms";
import Home from "./page/Home";
import FreelancersPage from "./page/FreelancersPage";
import CoursesPage from "./page/CoursesPage";
import CourseDetailPage from "./page/CourseDetailPage";
import VideoPlayerPage from "./page/VideoPlayerPage";
import ClientsPage from "./page/ClientsPage";
import AdminPage from "./page/AdminPage";
import ProfilePage from "./page/ProfilePage";
import ProjectsPage from "./page/ProjectsPage";
import MessagesPage from "./page/MessagesPage";
import SettingsPage from "./page/SettingsPage";
import PaymentsPage from "./page/PaymentsPage";
import ClientDashboard from "./page/ClientDashboard";
import FreelancerDashboard from "./page/FreelancerDashboard";
import { useTranslation } from "react-i18next";
import "./i18n";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

// ── Guard: blocks any route if user is not logged in or not yet approved ──────
function PrivateRoute({ children, onLogin }) {
  const { user, logout } = useAuth();
  const location         = useLocation();

  if (!user) {
    onLogin("login", false);
    return <Navigate to="/" replace />;
  }

  // Allow /messages for everyone — pending users must still be able to chat with admin
  if (!user.isAdmin && user.cinStatus === "pending" && location.pathname !== '/messages') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Compte en attente</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Votre compte est en cours de vérification par l'administrateur.<br />
            Vous serez notifié dès que votre compte sera approuvé.
          </p>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin && user.cinStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800/50 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Compte refusé</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Votre demande de vérification a été refusée par l'administrateur.
          </p>
          {user.cinRejectionReason && (
            <p className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl px-4 py-3 mb-6">
              Raison : {user.cinRejectionReason}
            </p>
          )}
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function AppInner() {
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdminDashboard = location.pathname === "/admin/dashboard";
  const isUserDashboard  = location.pathname === "/dashboard" || location.pathname === "/messages";

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForced, setAuthForced] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const toggleDark = () => setDark(prev => !prev);

  // Global Enter-key handler — makes every focused interactive element respond to Enter
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
      const el = document.activeElement;
      if (!el) return;
      const tag = el.tagName.toLowerCase();
      // textarea: Enter = newline, never intercept
      if (tag === 'textarea') return;
      // Native button/a: browser already handles Enter → skip
      if (tag === 'button' || tag === 'a') return;
      // input: if inside a real <form> the browser submits it; otherwise find
      // the nearest enabled button sibling and click it
      if (tag === 'input') {
        const form = el.closest('form');
        if (form) return; // browser handles it
        const container = el.closest('[class]') || el.parentElement;
        const btn = container?.querySelector('button:not([disabled])');
        if (btn) { e.preventDefault(); btn.click(); }
        return;
      }
      // div / span / li / label / etc. acting as buttons (has tabIndex)
      if (el.tabIndex >= 0) {
        e.preventDefault();
        el.click();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const handleLogin = (mode, forced = false) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setAuthForced(forced);
  };

  const handleAuth = (userData) => {
    setAuthModalOpen(false);
    setAuthForced(false);
    toast.success(`Welcome, ${userData.name}! 🎉`);
  };

  // FIXED: eslint unused var issue (kept logic unchanged)
  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <ToastProvider>
      <ScrollToTop />
      <Authmodal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
        defaultMode={authMode}
        closable={!authForced}
      />

      <PostJobModal />
      <PostCourseModal />
      <PostClientModal />

      <Navbar
        dark={dark}
        toggleDark={toggleDark}
        onLogin={handleLogin}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />

            <Route
              path="/freelancers"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <FreelancersPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <ClientsPage />
                </PrivateRoute>
              }
            />


            <Route
              path="/courses"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <CoursesPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/courses/:id"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <CourseDetailPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/courses/:courseId/lesson/:lessonId"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <VideoPlayerPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={<PrivateRoute onLogin={handleLogin}><ProfilePage /></PrivateRoute>}
            />
            <Route
              path="/dashboard"
              element={
                user?.isAdmin
                  ? <Navigate to="/admin/dashboard" replace />
                  : <PrivateRoute onLogin={handleLogin}>
                      {user?.role === "freelancer" ? <FreelancerDashboard /> : <ClientDashboard />}
                    </PrivateRoute>
              }
            />
            <Route
              path="/projects"
              element={<PrivateRoute onLogin={handleLogin}><ProjectsPage /></PrivateRoute>}
            />
            <Route
              path="/messages"
              element={<PrivateRoute onLogin={handleLogin}><MessagesPage /></PrivateRoute>}
            />
            <Route
              path="/payments"
              element={<PrivateRoute onLogin={handleLogin}><PaymentsPage /></PrivateRoute>}
            />
            <Route
              path="/settings"
              element={<PrivateRoute onLogin={handleLogin}><SettingsPage /></PrivateRoute>}
            />
            <Route
              path="/admin/dashboard"
              element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
            />
          </Routes>

          {!isAdminDashboard && !isUserDashboard && <FAQ />}
          {!isAdminDashboard && !isUserDashboard && <Footer />}
        </motion.div>
      </AnimatePresence>
    </ToastProvider>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="315427253338-10dlpebi8btbc6b0is4vncq2n72796cq.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;