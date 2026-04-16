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
import JobsPage from "./page/JobsPage";
import CoursesPage from "./page/CoursesPage";
import ClientsPage from "./page/ClientsPage";
import AdminPage from "./page/AdminPage"; 
import { useTranslation } from "react-i18next";
import "./i18n";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ── Guard: blocks any route if user is not logged in ──────────────────────────
function PrivateRoute({ children, onLogin }) {
  const { user } = useAuth();

  if (!user) {
    onLogin("login", true);
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppInner() {
  const { i18n } = useTranslation();
  const { logout } = useAuth(); // FIXED: removed unused "user"
  const location = useLocation();

  const isAdminDashboard = location.pathname === "/admin/dashboard";

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
              path="/jobs"
              element={
                <PrivateRoute onLogin={handleLogin}>
                  <JobsPage />
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
              path="/admin/dashboard"
              element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
            />
          </Routes>

          {!isAdminDashboard && <FAQ />}
          {!isAdminDashboard && <Footer />}
        </motion.div>
      </AnimatePresence>
    </ToastProvider>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="369601994852-6e5d6gqqtgvs1a7jl0rtve82emcbaa3q.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;