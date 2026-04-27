// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);
const API = "https://famamennou-server.onrender.com/api";

const ADMIN_CREDENTIALS = {
  email: "admin@famamennou.com",
  password: "rayen kast 001",
  name: "Admin",
  role: "admin",
  plan: "premium",
  isAdmin: true,
};

export function AuthProvider({ children }) {
  // ── Clean up old localStorage keys from pre-backend version ──
  localStorage.removeItem("fm_accounts");
  localStorage.removeItem("fm_notifications");
  localStorage.removeItem("fm_reviews");

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("fm_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [accounts, setAccounts] = useState(() => {
    try {
      const cached = localStorage.getItem("fm_accounts");
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [notifications, setNotifications] = useState([]);

  // ── Persist logged-in user in localStorage (session only) ──
  useEffect(() => {
    if (user) localStorage.setItem("fm_user", JSON.stringify(user));
    else localStorage.removeItem("fm_user");
  }, [user]);

  // ── Load users and notifications from backend on mount ──
  const fetchAccounts = useCallback(async () => {
    try {
      // Phase 1 — fast lite fetch (no base64 images) for instant count display
      const liteRes = await fetch(`${API}/users/lite`);
      const liteRows = await liteRes.json();
      if (Array.isArray(liteRows) && liteRows.length > 0) {
        const liteMap = {};
        liteRows.forEach(r => { if (r?.email) liteMap[r.email.toLowerCase()] = normalizeUser(r); });
        setAccounts(liteMap);
        localStorage.setItem("fm_accounts", JSON.stringify(liteMap));
      }
      // Phase 2 — full fetch with images in background (for CIN verification etc.)
      const res = await fetch(`${API}/users`);
      const rows = await res.json();
      const map = {};
      if (Array.isArray(rows)) {
        rows.forEach(r => { if (r?.email) map[r.email.toLowerCase()] = normalizeUser(r); });
      }
      setAccounts(map);
      localStorage.setItem("fm_accounts", JSON.stringify(map));
    } catch (e) { console.error("fetchAccounts error:", e); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notifications`);
      const rows = await res.json();
      setNotifications(rows.map(n => ({
        id: n.id,
        type: n.type,
        kind: n.kind,
        title: n.title,
        message: n.message,
        email: n.email,
        name: n.name,
        read: n.read,
        createdAt: n.created_at,
      })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchNotifications();
  }, [fetchAccounts, fetchNotifications]);

  // ── Ping last_seen every 60s so other users see online status ──
  useEffect(() => {
    if (!user || user.isAdmin) return;
    const ping = () => fetch(`${API}/users/${encodeURIComponent(user.email)}/ping`, { method: 'PATCH' }).catch(() => {});
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keep logged-in user in sync when admin updates their account ──
  useEffect(() => {
    if (!user || user.isAdmin) return;
    const account = accounts[user.email?.toLowerCase()];
    if (!account) return;
    if (
      account.cinStatus !== user.cinStatus ||
      account.cinRejectionReason !== user.cinRejectionReason ||
      account.cinApprovalReason !== user.cinApprovalReason ||
      account.photo !== user.photo ||
      account.skills !== user.skills ||
      account.bio !== user.bio ||
      account.portfolio !== user.portfolio ||
      account.statusSeen !== user.statusSeen
    ) {
      setUser({ ...account, isAdmin: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  function normalizeUser(r) {
    return {
      email:              r.email,
      password:           r.password,
      name:               r.name,
      plan:               r.plan,
      role:               r.role,
      dob:                r.dob,
      region:             r.region,
      gender:             r.gender     ?? null,
      photo:              r.photo      ?? null,
      skills:             typeof r.skills === 'string' && r.skills.startsWith('[') ? JSON.parse(r.skills) : (r.skills ?? null),
      bio:                r.bio        ?? null,
      portfolio:          typeof r.portfolio === 'string' && r.portfolio.startsWith('[') ? JSON.parse(r.portfolio) : (Array.isArray(r.portfolio) ? r.portfolio : []),
      cin:                r.cin,
      cinFront:           r.cin_front,
      cinBack:            r.cin_back,
      cinVerified:        r.cin_verified,
      cinStatus:          r.cin_status ?? "pending",
      cinRejectionReason: r.cin_rejection_reason ?? null,
      cinApprovalReason:  r.cin_approval_reason  ?? null,
      statusSeen:         r.status_seen ?? false,
      availability:       r.availability ?? 'available',
      company:            r.company      ?? null,
      registeredAt:       r.registered_at,
      lastSeen:           r.last_seen    ?? null,
      isAdmin:            false,
    };
  }

  async function register(userData) {
    try {
      await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    userData.email.toLowerCase(),
          password: userData.password,
          name:     userData.name,
          plan:     userData.plan,
          role:     userData.role,
          dob:      userData.dob,
          region:   userData.region,
          gender:   userData.gender ?? null,
          skills:   userData.skills ?? null,
          bio:      userData.bio    ?? null,
          cin:      userData.cin,
          cinFront: userData.cinFront,
          cinBack:  userData.cinBack,
        }),
      });

      if (userData.role === "freelancer" || userData.role === "client") {
        await addNotification({
          type:    "admin",
          kind:    "new_submission",
          title:   "Nouvelle demande de vérification",
          message: `${userData.name} a soumis une demande de vérification CIN.`,
          email:   userData.email,
          name:    userData.name,
        });
      }

      fetchAccounts(); // non-blocking — user already sees pending screen
    } catch (e) {
      console.error("register error", e);
    }
  }

  async function login(email, password) {
    if (
      email.toLowerCase() === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setUser(ADMIN_CREDENTIALS);
      return { success: true, user: ADMIN_CREDENTIALS };
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };

      const loggedUser = normalizeUser(data.user);
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch {
      return { error: "serverError" };
    }
  }

  function logout() { setUser(null); }

  const users = Object.values(accounts);

  async function updateUser(email, patch) {
    const key = email.toLowerCase();
    const account = accounts[key];
    if (!account) return;

    const extra = (patch.cinStatus === "approved" || patch.cinStatus === "rejected")
      ? { statusSeen: false }
      : {};

    // Optimistic update — UI reflects change immediately on first click
    const updated = { ...account, ...patch, ...extra };
    setAccounts(prev => ({ ...prev, [key]: updated }));

    const dbPatch = {};
    if (patch.cinStatus          !== undefined) dbPatch.cin_status           = patch.cinStatus;
    if (patch.cinRejectionReason !== undefined) dbPatch.cin_rejection_reason = patch.cinRejectionReason;
    if (patch.cinApprovalReason  !== undefined) dbPatch.cin_approval_reason  = patch.cinApprovalReason;
    if (patch.cinVerified        !== undefined) dbPatch.cin_verified         = patch.cinVerified;
    if (patch.statusSeen         !== undefined) dbPatch.status_seen          = patch.statusSeen;
    if (patch.photo              !== undefined) dbPatch.photo                = patch.photo;
    if (patch.skills             !== undefined) dbPatch.skills               = patch.skills;
    if (patch.bio                !== undefined) dbPatch.bio                  = patch.bio;
    if (patch.portfolio          !== undefined) dbPatch.portfolio            = patch.portfolio;
    if (patch.name               !== undefined) dbPatch.name                 = patch.name;
    if (patch.region             !== undefined) dbPatch.region               = patch.region;
    if (patch.gender             !== undefined) dbPatch.gender               = patch.gender;
    if (patch.dob                !== undefined) dbPatch.dob                  = patch.dob;
    if (patch.availability       !== undefined) dbPatch.availability         = patch.availability;
    if (patch.company            !== undefined) dbPatch.company              = patch.company;
    if (extra.statusSeen         !== undefined) dbPatch.status_seen          = extra.statusSeen;

    try {
      fetch(`${API}/users/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPatch),
      });

      if (patch.cinStatus === "approved") {
        addNotification({
          type:    "user",
          kind:    "approved",
          title:   "Compte approuvé ✅",
          message: patch.cinApprovalReason || "Votre vérification a été acceptée.",
          email:   key,
          name:    account.name,
        });
      } else if (patch.cinStatus === "rejected") {
        addNotification({
          type:    "user",
          kind:    "rejected",
          title:   "Compte refusé ❌",
          message: patch.cinRejectionReason || "Votre vérification n'a pas été acceptée.",
          email:   key,
          name:    account.name,
        });
      }
    } catch (e) {
      console.error("updateUser error", e);
    }
  }

  async function deleteUser(email) {
    const key = email.toLowerCase();
    try {
      await fetch(`${API}/users/${encodeURIComponent(key)}`, { method: "DELETE" });
      await fetchAccounts();
    } catch (e) {
      console.error("deleteUser error", e);
    }
  }

  // ── Notification helpers ──────────────────────────────────────────────────

  async function addNotification(notif) {
    try {
      await fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notif),
      });
      await fetchNotifications();
    } catch {}
  }

  function getAdminNotifications() {
    return notifications.filter(n => n.type === "admin");
  }

  function getUserNotifications(email) {
    return notifications.filter(n => n.type === "user" && n.email === email?.toLowerCase());
  }

  async function markNotificationRead(id) {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  }

  async function markAllNotificationsRead(targetType, email) {
    try {
      const targets = notifications.filter(n => {
        if (targetType === "admin") return n.type === "admin" && !n.read;
        return n.type === "user" && n.email === email?.toLowerCase() && !n.read;
      });
      await Promise.all(targets.map(n => fetch(`${API}/notifications/${n.id}/read`, { method: "PATCH" })));
      setNotifications(prev => prev.map(n => {
        if (targetType === "admin" && n.type === "admin") return { ...n, read: true };
        if (targetType === "user" && n.type === "user" && n.email === email?.toLowerCase()) return { ...n, read: true };
        return n;
      }));
    } catch {}
  }

  async function clearNotifications(targetType, email) {
    try {
      const url = targetType === "admin"
        ? `${API}/notifications?type=admin`
        : `${API}/notifications?type=user&email=${encodeURIComponent(email)}`;
      await fetch(url, { method: "DELETE" });
      await fetchNotifications();
    } catch {}
  }

  return (
    <AuthContext.Provider value={{
      user, accounts, users, register, login, logout, updateUser, deleteUser,
      notifications,
      getAdminNotifications,
      getUserNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      addNotification,
      fetchAccounts,
      fetchNotifications,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
