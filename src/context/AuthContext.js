// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { tokenStore } from "../lib/tokenStore";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL || "https://famamennou-server.onrender.com/api";

export function AuthProvider({ children }) {
  // ── Clean up old localStorage keys from pre-backend version ──
  localStorage.removeItem("fm_accounts");
  localStorage.removeItem("fm_notifications");
  localStorage.removeItem("fm_reviews");

  // Access token in memory ref + module-level tokenStore (for the fetch interceptor)
  const accessTokenRef = useRef(null);

  function storeToken(t) {
    accessTokenRef.current = t;
    tokenStore.set(t);
  }
  function clearToken() {
    accessTokenRef.current = null;
    tokenStore.clear();
  }

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
  // True once fetchAccounts has resolved at least once this session, or if a
  // cached list already exists — lets admin UI distinguish "still loading"
  // from "genuinely zero users" instead of flashing 0/0/0 on first mount.
  const [accountsLoaded, setAccountsLoaded] = useState(() => {
    try { return !!localStorage.getItem("fm_accounts"); } catch { return false; }
  });
  const [notifications, setNotifications] = useState([]);

  // ── Persist logged-in user in localStorage (session only) ──
  useEffect(() => {
    if (user) localStorage.setItem("fm_user", JSON.stringify(user));
    else localStorage.removeItem("fm_user");
  }, [user]);

  // ── Auth fetch helper — adds Authorization header when token is present ──
  const authFetch = useCallback((url, options = {}) => {
    const token = accessTokenRef.current;
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers, credentials: 'include' });
  }, []);

  // ── Refresh access token using the httpOnly refresh cookie ──
  const refreshAccessToken = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.accessToken) {
        storeToken(data.accessToken);
        return data.accessToken;
      }
    } catch {}
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: restore token from httpOnly cookie if user is in localStorage
  // This handles page refresh — token is in-memory and lost on refresh,
  // but the 7-day httpOnly cookie survives and can re-issue a new access token.
  useEffect(() => {
    if (user) {
      refreshAccessToken().then(() => fetchAccounts());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 13 minutes (access token expires at 15 min)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(refreshAccessToken, 13 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.email, refreshAccessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load users ──
  // If a valid admin token exists → /users (full data incl. cin_status, registered_at…)
  // Otherwise → /users/public (safe public fields only)
  const fetchAccounts = useCallback(async () => {
    try {
      let rows = null;
      let trustCin = false;
      if (accessTokenRef.current) {
        const r = await authFetch(`${API}/users`);
        if (r.ok) { rows = await r.json(); trustCin = true; }
      }
      if (!rows) {
        const r = await fetch(`${API}/users/public`);
        rows = await r.json();
      }
      const map = {};
      if (Array.isArray(rows)) {
        rows.forEach(r => { if (r?.email) map[r.email.toLowerCase()] = normalizeUser(r, trustCin); });
      }
      setAccounts(map);
      localStorage.setItem("fm_accounts", JSON.stringify(map));
    } catch (e) { console.error("fetchAccounts error:", e); }
    finally { setAccountsLoaded(true); }
  }, [authFetch]);

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
    // Non-logged-in users get the public list immediately (no token needed).
    // Logged-in users get their data via refreshAccessToken().then(fetchAccounts)
    // which always runs with the correct token — calling fetchAccounts here too
    // would race and potentially overwrite correct admin data with /users/public data.
    if (!user) fetchAccounts();
    fetchNotifications();
  }, [fetchAccounts, fetchNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll notifications every 5 min as a background fallback (Socket.io is the primary path)
  useEffect(() => {
    const id = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

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
    // account.cinStatus is a guess derived from cin_verified when it came from the
    // public (unauthenticated) users list, which doesn't carry real verification data —
    // never let that clobber the trustworthy cinStatus we already have (from login or
    // an admin-sourced fetch).
    const patch = {};
    if (account._cinTrusted) {
      if (account.cinStatus !== user.cinStatus) patch.cinStatus = account.cinStatus;
      if (account.cinRejectionReason !== user.cinRejectionReason) patch.cinRejectionReason = account.cinRejectionReason;
      if (account.cinApprovalReason !== user.cinApprovalReason) patch.cinApprovalReason = account.cinApprovalReason;
    }
    if (account.photo !== user.photo) patch.photo = account.photo;
    if (account.skills !== user.skills) patch.skills = account.skills;
    if (account.bio !== user.bio) patch.bio = account.bio;
    if (account.portfolio !== user.portfolio) patch.portfolio = account.portfolio;
    if (account.statusSeen !== user.statusSeen) patch.statusSeen = account.statusSeen;
    if (account.title !== user.title) patch.title = account.title;
    if (account.portfolio_url !== user.portfolio_url) patch.portfolio_url = account.portfolio_url;
    if (account.hourly_rate !== user.hourly_rate) patch.hourly_rate = account.hourly_rate;
    if (account.availability !== user.availability) patch.availability = account.availability;
    if (Object.keys(patch).length > 0) setUser({ ...user, ...patch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  function safeParseJson(val, fallback) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.startsWith('[')) {
      try { return JSON.parse(val); } catch { return fallback; }
    }
    return val ?? fallback;
  }

  function normalizeUser(r, trustCin = true) {
    return {
      email:              r.email,
      password:           r.password,
      name:               r.name,
      role:               r.role,
      dob:                r.dob,
      region:             r.region,
      gender:             r.gender     ?? null,
      photo:              r.photo      ?? null,
      skills:             safeParseJson(r.skills, null),
      bio:                r.bio           ?? null,
      portfolio_url:      r.portfolio_url ?? null,
      hourly_rate:        r.hourly_rate   ?? null,
      title:              r.title         ?? null,
      portfolio:          safeParseJson(r.portfolio, []),
      cin:                r.cin,
      cinFront:           r.cin_front,
      cinBack:            r.cin_back,
      cinVerified:        r.cin_verified,
      cinStatus:          r.cin_status ?? (r.cin_verified ? "approved" : "pending"),
      cinRejectionReason: r.cin_rejection_reason ?? null,
      cinApprovalReason:  r.cin_approval_reason  ?? null,
      // Public (unauthenticated) listings never include cin_status/rejection/approval
      // reason — only an admin-sourced fetch or the login response itself can be
      // trusted for those specific fields.
      _cinTrusted:        trustCin || r.cin_status !== undefined,
      statusSeen:         r.status_seen ?? false,
      availability:       r.availability ?? 'available',
      company:            r.company      ?? null,
      registeredAt:       r.registered_at,
      lastSeen:           r.last_seen    ?? null,
      isAdmin:            r.role === 'admin',
      rating:             Number(r.rating) || 0,
      completedProjects:  Number(r.completed_projects) || 0,
    };
  }

  async function register(userData) {
    try {
      const regRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    userData.email.toLowerCase(),
          password: userData.password,
          name:     userData.name,
          role:     userData.role,
          dob:      userData.dob,
          region:   userData.region,
          gender:   userData.gender ?? null,
          skills:   userData.skills || null,
          bio:      userData.bio    ?? null,
          cin:      userData.cin,
          cinFront: userData.cinFront,
          cinBack:  userData.cinBack,
        }),
      });
      const regData = await regRes.json();

      // Registration actually failed (e.g. emailTaken, validation, serverError) —
      // surface this to the caller instead of silently treating it as success.
      if (!regRes.ok || regData.error) {
        return { error: regData.error || "serverError" };
      }

      // In dev mode the backend auto-approves — auto-login so the user never sees the pending screen
      if (regData.dev) {
        const result = await login(userData.email, userData.password);
        if (result?.success) {
          fetchAccounts();
          return { success: true, autoLogged: true };
        }
      }

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

      fetchAccounts();
      return { success: true };
    } catch (e) {
      console.error("register error", e);
      return { error: "networkError" };
    }
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem('fm_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('fm_device_id', id);
    }
    return id;
  }

  async function login(email, password, totpCode, captchaToken, role, selectionToken) {
    const deviceId = getOrCreateDeviceId();

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.toLowerCase(), password, deviceId, totpCode, captchaToken, role: role || undefined, selectionToken: selectionToken || undefined }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error, minutesLeft: data.minutesLeft };

      // Multiple accounts — user must pick a role
      if (data.requiresRoleSelect) {
        return { requiresRoleSelect: true, roles: data.roles, selectionToken: data.selectionToken };
      }

      // 2FA required — return pendingToken for TOTP step
      if (data.requiresTOTP) {
        return { requiresTOTP: true, pendingToken: data.pendingToken };
      }

      // New device — approval required
      if (data.status === 'pending_approval') {
        return {
          pending: true,
          attemptId: data.attemptId,
          device: data.device,
          message: data.message,
          riskScore: data.riskScore,
        };
      }

      if (data.accessToken) storeToken(data.accessToken);
      const loggedUser = normalizeUser(data.user);
      setUser(loggedUser);
      fetchAccounts();
      return { success: true, user: loggedUser };
    } catch {
      return { error: "serverError" };
    }
  }

  // Complete 2FA login with pendingToken + TOTP code
  async function verifyTOTP(pendingToken, totpCode) {
    try {
      const res = await fetch(`${API}/auth/verify-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingToken, totpCode }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      if (data.accessToken) storeToken(data.accessToken);
      const loggedUser = normalizeUser(data.user);
      setUser(loggedUser);
      fetchAccounts();
      return { success: true, user: loggedUser };
    } catch {
      return { error: "serverError" };
    }
  }

  function loginWithUserData(rawUser, accessToken) {
    if (accessToken) storeToken(accessToken);
    const loggedUser = normalizeUser(rawUser);
    setUser(loggedUser);
    fetchAccounts();
    return loggedUser;
  }

  function logout() {
    const email = user?.email || null;
    fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    }).catch(() => {});
    clearToken();
    setUser(null);
  }

  const users = Object.values(accounts);

  async function updateUser(email, patch) {
    const key = email.toLowerCase();
    const account = accounts[key];
    if (!account) return { error: "notFound" };

    const extra = (patch.cinStatus === "approved" || patch.cinStatus === "rejected")
      ? { statusSeen: false }
      : {};

    const dbPatch = {};
    if (patch.cinStatus          !== undefined) dbPatch.cin_status           = patch.cinStatus;
    if (patch.cinRejectionReason !== undefined) dbPatch.cin_rejection_reason = patch.cinRejectionReason;
    if (patch.cinApprovalReason  !== undefined) dbPatch.cin_approval_reason  = patch.cinApprovalReason;
    if (patch.cinVerified        !== undefined) dbPatch.cin_verified         = patch.cinVerified;
    if (patch.statusSeen         !== undefined) dbPatch.status_seen          = patch.statusSeen;
    if (patch.photo              !== undefined) dbPatch.photo                = patch.photo;
    if (patch.skills             !== undefined) dbPatch.skills               = patch.skills;
    if (patch.bio                !== undefined) dbPatch.bio                  = patch.bio;
    if (patch.portfolio_url      !== undefined) dbPatch.portfolio_url        = patch.portfolio_url;
    if (patch.hourly_rate        !== undefined) dbPatch.hourly_rate          = patch.hourly_rate;
    if (patch.title              !== undefined) dbPatch.title                = patch.title;
    if (patch.portfolio          !== undefined) dbPatch.portfolio            = patch.portfolio;
    if (patch.name               !== undefined) dbPatch.name                 = patch.name;
    if (patch.region             !== undefined) dbPatch.region               = patch.region;
    if (patch.gender             !== undefined) dbPatch.gender               = patch.gender;
    if (patch.dob                !== undefined) dbPatch.dob                  = patch.dob;
    if (patch.availability       !== undefined) dbPatch.availability         = patch.availability;
    if (patch.company            !== undefined) dbPatch.company              = patch.company;
    if (extra.statusSeen         !== undefined) dbPatch.status_seen          = extra.statusSeen;

    try {
      const res = await authFetch(`${API}/users/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPatch),
      });

      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          message = errBody.message || errBody.error || message;
        } catch {}
        console.error("updateUser failed:", message);
        return { error: message };
      }

      // Only reflect the change locally once the server has confirmed the save —
      // an optimistic update here would let a silently-failed save (expired token,
      // 500, etc.) look like it succeeded with no indication to the caller.
      const updated = { ...account, ...patch, ...extra };
      setAccounts(prev => ({ ...prev, [key]: updated }));

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
      return { success: true };
    } catch (e) {
      console.error("updateUser error", e);
      return { error: e.message || "networkError" };
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

  // Resolve any email to the user's full name — falls back to email if not found or name is empty.
  // Use this everywhere instead of displaying raw emails.
  const resolveEmail = (email) => {
    if (!email) return '—';
    const acc = accounts[email.toLowerCase()];
    return (acc?.name && acc.name.trim()) ? acc.name.trim() : '—';
  };

  return (
    <AuthContext.Provider value={{
      user, accounts, accountsLoaded, users, register, login, loginWithUserData, logout, updateUser, deleteUser,
      verifyTOTP,
      authFetch,
      refreshAccessToken,
      notifications,
      getAdminNotifications,
      getUserNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      addNotification,
      fetchAccounts,
      fetchNotifications,
      resolveEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
