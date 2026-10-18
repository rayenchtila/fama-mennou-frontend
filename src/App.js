// App.jsx
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FAQ from "./components/FAQ";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Authmodal from "./components/Authmodal";
import ToastProvider, { toast } from "./components/Toast";
import CookieConsent from "./components/CookieConsent";
import AnnouncementBanner from "./components/AnnouncementBanner";
import TopBar from "./components/ds/TopBar";
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
import ProjectDetailPage from "./page/ProjectDetailPage";
import MessagesPage from "./page/MessagesPage";
import SettingsPage from "./page/SettingsPage";
import AboutPage from "./page/AboutPage";
import BlogPage from "./page/BlogPage";
import CareersPage from "./page/CareersPage";
import HelpPage from "./page/HelpPage";
import PrivacyPage from "./page/PrivacyPage";
import TermsPage from "./page/TermsPage";
import PaymentsPage from "./page/PaymentsPage";
import ClientDashboard from "./page/ClientDashboard";
import FreelancerDashboard from "./page/FreelancerDashboard";
import PublicProfilePage from "./page/PublicProfilePage";
import "./i18n";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, usePageTheme, usePageAccent } from "./context/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import { displayName } from "./utils/names";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// ── /signup and /login: links that open the dialog straight on the right tab ──
// Visiting one opens the dialog exactly once, then swaps the address for "/" — so no
// "/signup" entry is left in the history to bounce back through, and a reload or the
// back button never opens it a second time.
function AuthRoute({ mode, onLogin }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handled  = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!user) onLogin(mode);
    navigate("/", { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Guard: blocks any route if user is not logged in or not yet approved ──────
function PrivateRoute({ children, onLogin }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const asked            = useRef(false);

  // Asking for the log-in dialog is a side effect, so it belongs in an effect, once —
  // not in the render, which React may run twice (and which updated App while rendering).
  useEffect(() => {
    if (user || asked.current) return;
    asked.current = true;
    onLogin("login", false, location.pathname + location.search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Allow /messages for everyone — pending users must still be able to chat with admin.
  // Pending CLIENTS are exempt from this block entirely (not just /messages) —
  // they can log in and browse read-only; every actionable request is refused
  // separately (requireApprovedClient on the backend, and per-action UI gates
  // on the frontend). Freelancer/admin behavior here is unchanged.
  if (!user.isAdmin && user.role !== 'client' && user.cinStatus === "pending" && location.pathname !== '/messages') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--fm-bg)' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: 'var(--fm-surface)', border: '1px solid var(--fm-border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--fm-warning-bg)' }}>
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--fm-warning)' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--fm-text-1)' }}>Compte en attente</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--fm-text-5)' }}>
            Votre compte est en cours de vérification par l'administrateur.<br />
            Vous serez notifié dès que votre compte sera approuvé.
          </p>
          <button
            onClick={logout}
            className="text-xs transition-colors"
            style={{ color: 'var(--fm-text-7)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fm-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fm-text-7)'}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin && user.cinStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--fm-bg)' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: 'var(--fm-surface)', border: '1px solid rgba(248,113,113,.25)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--fm-danger-bg)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--fm-danger)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--fm-text-1)' }}>Compte refusé</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--fm-text-5)' }}>
            Votre demande de vérification a été refusée par l'administrateur.
          </p>
          {user.cinRejectionReason && (
            <p className="text-xs rounded-xl px-4 py-3 mb-6" style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', color: '#fca5a5' }}>
              Raison : {user.cinRejectionReason}
            </p>
          )}
          <button
            onClick={logout}
            className="text-xs transition-colors"
            style={{ color: 'var(--fm-text-7)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fm-danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fm-text-7)'}
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
  const { user, logout, refreshAccessToken, fetchAccounts } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // The courses area carries its own look in the supplied design: emerald
  // accent, and light as its natural theme. The theme default only applies
  // until the visitor makes their own choice with the toggle.
  const inCourses = location.pathname.startsWith('/courses');
  usePageTheme(inCourses ? 'light' : null);
  usePageAccent(inCourses ? 'emerald' : null);

  const isAdminDashboard = location.pathname === "/admin/dashboard";
  const isUserDashboard  = location.pathname === "/dashboard" || location.pathname === "/messages";
  // Public marketing + marketplace browse pages — the three listing pages
  // (freelancers/clients/courses) are just as public as the homepage, and a
  // visitor paging through them previously hit Pagination and then nothing:
  // no way to reach Help/Privacy/Terms/social without navigating back to "/".
  // Authenticated dashboard pages (isUserDashboard above) stay excluded —
  // different layout assumptions (e.g. fm-chat-container's 100vh sizing)
  // and not what this finding was about.
  const showFooter        = ['/', '/about', '/blog', '/careers', '/help', '/privacy', '/terms', '/freelancers', '/clients', '/courses'].includes(location.pathname);
  // The brand strip the supplied screens open with: the four main pages only.
  const showTopBar        = ['/', '/freelancers', '/clients', '/courses'].includes(location.pathname);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForced, setAuthForced] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
  // Counts how many times the dialog has been opened. It is the dialog's React key, so every opening
  // starts from a fresh component already in the requested mode — never a first frame in whatever
  // mode it was last left in, corrected a moment later (which looked like "log in" flashing up and
  // then redirecting to "sign up").
  const [authSession, setAuthSession] = useState(0);
  const authOpenRef = useRef(false);

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

  // The one way to open the log-in / sign-up dialog (Navbar buttons, /signup, /login, a private page).
  // Opening it while it is already open only changes the tab — it never opens a second one.
  const handleLogin = useCallback((mode, forced = false, redirectTo = null) => {
    const alreadyOpen = authOpenRef.current;
    setAuthMode(mode);
    setAuthForced(forced);
    setRedirectAfterLogin(redirectTo);
    if (!alreadyOpen) {
      authOpenRef.current = true;
      setAuthSession(n => n + 1);
      setAuthModalOpen(true);
    }
  }, []);

  const closeAuth = useCallback(() => {
    authOpenRef.current = false;
    setAuthModalOpen(false);
  }, []);

  // Handle email verification redirect (?verified=true/false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    if (!verified) return;
    const autologin = params.get('autologin') === '1';
    // Remove the query params from URL without reload
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
    if (verified === 'true') {
      if (autologin) {
        // Backend already set the refresh cookie for this account (see
        // GET /verify-email) — turn it into a real session instead of
        // making the user log in again right after verifying.
        refreshAccessToken().then((token) => {
          if (token) {
            toast.success('✅ Email vérifié — vous êtes connecté !');
            fetchAccounts();
          } else {
            // Cookie missing/expired for some reason — fall back to manual login.
            toast.success('✅ Email verified! You can now log in.');
            handleLogin('login');
          }
        });
      } else {
        toast.success('✅ Email verified! You can now log in.');
        handleLogin('login');
      }
    } else {
      const reason = params.get('reason');
      const msg = reason === 'expired'
        ? '❌ Verification link expired. Please log in to receive a new one.'
        : '❌ Verification failed. Please try again.';
      toast.error(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = (userData) => {
    closeAuth();
    setAuthForced(false);
    toast.success(`Welcome, ${displayName(userData.name)}! 🎉`);
    if (userData.isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    } else if (redirectAfterLogin) {
      navigate(redirectAfterLogin, { replace: true });
    }
    setRedirectAfterLogin(null);
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
      <CookieConsent />
      <Authmodal
        key={authSession}
        open={authModalOpen}
        onClose={closeAuth}
        onAuth={handleAuth}
        defaultMode={authMode}
        closable={!authForced}
      />

      <PostJobModal />
      <PostCourseModal />
      <PostClientModal />

      <Navbar
        onLogin={handleLogin}
      />
      <AnnouncementBanner />
      {showTopBar && <TopBar />}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          style={{
            paddingTop: 'var(--fm-announcement-h, 0px)',
            transition: 'padding-top 0.2s ease',
            // Confirmed via real device emulation: body's own computed
            // background can resolve light even with the dark theme class
            // applied. Without this, the padding-top gap above exposes that
            // wrong-colored background instead of the site's dark theme —
            // this was the actual cause of the "blank/white page" reports.
            background: 'rgb(var(--ds-canvas, 9 13 22))',
            minHeight: '100vh',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />

            {/* Links straight to the registration / log-in dialog (emails, ads, other sites). */}
            <Route path="/signup" element={<AuthRoute mode="signup" onLogin={handleLogin} />} />
            <Route path="/login"  element={<AuthRoute mode="login"  onLogin={handleLogin} />} />

            {/* Public — anyone can see the freelancer directory, logged in or
                not, before or after signup, any account status. Actions
                inside the page (message, review, apply) still individually
                require login where they always did. */}
            <Route path="/freelancers" element={<FreelancersPage />} />
            {/* Public — same treatment as /freelancers above: anyone can browse
                the client/project directory logged in or out, any account
                status. Apply/message/review buttons only render for a logged-in
                freelancer (see isFreelancer in ClientsPage.js), so anonymous
                visitors just can't trigger those actions. */}
            <Route path="/clients" element={<ClientsPage onLogin={handleLogin} />} />
            <Route
              path="/courses"
              element={<PrivateRoute onLogin={handleLogin}><CoursesPage /></PrivateRoute>}
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
              path="/profile/:email"
              element={<PrivateRoute onLogin={handleLogin}><PublicProfilePage /></PrivateRoute>}
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
            {/* Public — no login required. This is the actual destination of a
                project's "share" link (see ProjectsPage.js's share button):
                anyone arriving from Facebook/WhatsApp/Instagram needs to see
                something real before we ask them to sign up. */}
            <Route path="/project/:id" element={<ProjectDetailPage onLogin={handleLogin} />} />
            <Route path="/about"    element={<AboutPage />} />
            <Route path="/blog"     element={<BlogPage />} />
            <Route path="/careers"  element={<CareersPage />} />
            <Route path="/help"     element={<HelpPage />} />
            <Route path="/privacy"  element={<PrivacyPage />} />
            <Route path="/terms"    element={<TermsPage />} />
            <Route
              path="/admin/dashboard"
              element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
            />
          </Routes>

          {showFooter && <Footer />}
        </motion.div>
      </AnimatePresence>
    </ToastProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <GoogleOAuthProvider clientId="369601994852-6e5d6gqqtgvs1a7jl0rtve82emcbaa3q.apps.googleusercontent.com">
          <Router>
            <AuthProvider>
              <AppInner />
            </AuthProvider>
          </Router>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;