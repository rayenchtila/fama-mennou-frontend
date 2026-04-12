// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function AppInner() {
  const { i18n }           = useTranslation();
  const { user, logout }   = useAuth();

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode,      setAuthMode]      = useState("login");
  const [language,      setLanguage]      = useState(() => localStorage.getItem("language") || "en");

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

  const handleLogin = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuth = (userData) => {
    setAuthModalOpen(false);
    toast.success(`Welcome, ${userData.name}! 🎉`);
  };

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
      />
      <PostJobModal />
      <PostCourseModal />
      <PostClientModal />
      <FAQ />
      <Navbar
        dark={dark}
        toggleDark={toggleDark}
        onLogin={handleLogin}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/freelancers" element={<FreelancersPage />} />
        <Route path="/clients"     element={<ClientsPage />} />
        <Route path="/jobs"        element={<JobsPage />} />
        <Route path="/courses"     element={<CoursesPage />} />
        <Route path="/admin"       element={<AdminPage />} />
      </Routes>
      <AdminPage />
      <Footer />
    </ToastProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        
        <AppInner />
      </AuthProvider>
    </Router>
  );
}

export default App;