// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
 
const AuthContext = createContext(null);
 
const ADMIN_CREDENTIALS = {
  email: "admin@famamennou.com",
  password: "rayen kast 001",
  name: "Admin",
  role: "admin",
  plan: "premium",
  isAdmin: true,
};
 
function loadAccounts() {
  try {
    const raw = localStorage.getItem("fm_accounts");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
 
function saveAccounts(accounts) {
  try { localStorage.setItem("fm_accounts", JSON.stringify(accounts)); } catch {}
}

// ── Notifications helpers ────────────────────────────────────────────────────

function loadNotifications() {
  try {
    const raw = localStorage.getItem("fm_notifications");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifications(notifs) {
  try { localStorage.setItem("fm_notifications", JSON.stringify(notifs)); } catch {}
}
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("fm_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [accounts, setAccounts] = useState(() => {
  const stored = loadAccounts();
  return stored;
});
  const [notifications, setNotifications] = useState(loadNotifications);
 
  useEffect(() => {
    if (user) localStorage.setItem("fm_user", JSON.stringify(user));
    else localStorage.removeItem("fm_user");
  }, [user]);
 
  useEffect(() => {
  if (Object.keys(accounts).length > 0) saveAccounts(accounts);
}, [accounts]);

  useEffect(() => { saveNotifications(notifications); }, [notifications]);
 
  // keep logged-in user in sync when admin updates their account
  useEffect(() => {
    if (!user || user.isAdmin) return;
    const account = accounts[user.email?.toLowerCase()];
    if (!account) return;
    if (
      account.cinStatus !== user.cinStatus ||
      account.cinRejectionReason !== user.cinRejectionReason ||
      account.cinApprovalReason !== user.cinApprovalReason
    ) {
      setUser({
        name:               account.name,
        email:              account.email,
        plan:               account.plan,
        role:               account.role,
        dob:                account.dob,
        region:             account.region,
        gender:             account.gender ?? null,
        cinVerified:        account.cinVerified,
        cinStatus:          account.cinStatus,
        cinRejectionReason: account.cinRejectionReason ?? null,
        cinApprovalReason:  account.cinApprovalReason  ?? null,
        isAdmin:            false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);
 
  function register(userData) {
    const key = userData.email.toLowerCase();
    const existing = accounts[key];

    const entry = {
      // ── keep original password & registeredAt if account already exists ──
      password:     existing ? existing.password    : userData.password,
      registeredAt: existing ? existing.registeredAt : new Date().toISOString(),
      // ── always update everything else ──
      name:        userData.name,
      email:       userData.email,
      plan:        userData.plan,
      role:        userData.role,
      dob:         userData.dob,
      region:      userData.region,
      gender:      userData.gender ?? null,
      cin:         userData.cin,
      cinFront:    userData.cinFront,
      cinBack:     userData.cinBack,
      cinVerified: false,
      // ── FIX: always reset to pending so it shows as new demande ──
      cinStatus:          "pending",
      cinRejectionReason: null,
      cinApprovalReason:  null,
    };
    setAccounts(prev => ({ ...prev, [key]: entry }));

    // Notify admin of new freelancer registration
    if (userData.role === "freelancer") {
      addNotification({
        type: "admin",
        kind: "new_submission",
        title: "Nouvelle demande de vérification",
        message: `${userData.name} a soumis une demande de vérification CIN.`,
        email: userData.email,
        name: userData.name,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }
 
  function login(email, password) {
    if (
      email.toLowerCase() === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setUser(ADMIN_CREDENTIALS);
      return { success: true, user: ADMIN_CREDENTIALS };
    }
    const account = accounts[email.toLowerCase()];
    if (!account)                      return { error: "noAccount" };
    if (account.password !== password) return { error: "wrongPassword" };
    const loggedUser = {
      name:               account.name,
      email:              email.toLowerCase(),
      plan:               account.plan,
      role:               account.role,
      dob:                account.dob,
      region:             account.region,
      gender:             account.gender ?? null,
      cinVerified:        account.cinVerified,
      cinStatus:          account.cinStatus ?? "pending",
      cinRejectionReason: account.cinRejectionReason ?? null,
      cinApprovalReason:  account.cinApprovalReason  ?? null,
      isAdmin:            false,
    };
    setUser(loggedUser);
    return { success: true, user: loggedUser };
  }

  // ── Google login ──
  function loginWithGoogle(profile) {
    const googleUser = {
      name:      profile.name,
      email:     profile.email,
      picture:   profile.picture,
      plan:      "free",
      role:      "client",
      isAdmin:   false,
      cinStatus: "approved",
      provider:  "google",
    };
    setUser(googleUser);
    return { success: true, user: googleUser };
  }

  // ── Facebook login ──
  function loginWithFacebook(profile) {
  const fbUser = {
    name:      profile?.name    || "Facebook User",
    email:     profile?.email   || "facebook_user@facebook.com",
    picture:   profile?.picture?.data?.url || null,
    plan:      "free",
    role:      "client",
    isAdmin:   false,
    cinStatus: "approved",
    provider:  "facebook",
  };
  setUser(fbUser);
  return { success: true, user: fbUser };
}
 
  function logout() { setUser(null); }
 
  const users = Object.values(accounts);
 
  function updateUser(email, patch) {
    const key = email.toLowerCase();
    const account = accounts[key];
    if (!account) return;

    setAccounts(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));

    // ── Send notification to the freelancer when admin approves or rejects ──
    if (patch.cinStatus === "approved") {
      addNotification({
        type: "user",
        kind: "approved",
        title: "Compte approuvé ✅",
        message: patch.cinApprovalReason || "Votre vérification a été acceptée.",
        email: key,
        name: account.name,
        createdAt: new Date().toISOString(),
        read: false,
      });
    } else if (patch.cinStatus === "rejected") {
      addNotification({
        type: "user",
        kind: "rejected",
        title: "Compte refusé ❌",
        message: patch.cinRejectionReason || "Votre vérification n'a pas été acceptée.",
        email: key,
        name: account.name,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  }

  // ── deleteUser: only used when explicitly needed (NOT on rejection) ──
  function deleteUser(email) {
    setAccounts(prev => {
      const key = email.toLowerCase();
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // ── Notification helpers ──────────────────────────────────────────────────

  function addNotification(notif) {
    const newNotif = { ...notif, id: Date.now() + Math.random() };
    setNotifications(prev => [newNotif, ...prev]);
  }

  // Get notifications for admin (all admin-type)
  function getAdminNotifications() {
    return notifications.filter(n => n.type === "admin");
  }

  // Get notifications for a specific user email
  function getUserNotifications(email) {
    return notifications.filter(n => n.type === "user" && n.email === email?.toLowerCase());
  }

  function markNotificationRead(id) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  function markAllNotificationsRead(targetType, email) {
    setNotifications(prev =>
      prev.map(n => {
        if (targetType === "admin" && n.type === "admin") return { ...n, read: true };
        if (targetType === "user" && n.type === "user" && n.email === email?.toLowerCase()) return { ...n, read: true };
        return n;
      })
    );
  }

  function clearNotifications(targetType, email) {
    setNotifications(prev =>
      prev.filter(n => {
        if (targetType === "admin") return n.type !== "admin";
        if (targetType === "user") return !(n.type === "user" && n.email === email?.toLowerCase());
        return true;
      })
    );
  }
 
  return (
    <AuthContext.Provider value={{
      user, accounts, users, register, login, logout, updateUser, deleteUser,
      loginWithGoogle, loginWithFacebook,
      notifications,
      getAdminNotifications,
      getUserNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      addNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() { return useContext(AuthContext); }