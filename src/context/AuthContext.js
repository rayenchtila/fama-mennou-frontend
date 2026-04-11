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
 
export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(() => {
    try {
      const raw = localStorage.getItem("fm_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [accounts, setAccounts] = useState(loadAccounts);
 
  useEffect(() => {
    if (user) localStorage.setItem("fm_user", JSON.stringify(user));
    else localStorage.removeItem("fm_user");
  }, [user]);
 
  useEffect(() => { saveAccounts(accounts); }, [accounts]);
 
  // ── NEW: keep logged-in user in sync when admin updates their account ──
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
    const entry = {
      name:        userData.name,
      email:       userData.email,
      password:    userData.password,
      plan:        userData.plan,
      role:        userData.role,
      dob:         userData.dob,
      region:      userData.region,
      cin:         userData.cin,
      cinFront:    userData.cinFront,
      cinBack:     userData.cinBack,
      cinVerified: userData.cinVerified,
      cinStatus:   "pending",          // ← always starts as pending
      registeredAt: new Date().toISOString(),
    };
    setAccounts(prev => ({ ...prev, [userData.email.toLowerCase()]: entry }));
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
      cinVerified:        account.cinVerified,
      cinStatus:          account.cinStatus ?? "pending",
      cinRejectionReason: account.cinRejectionReason ?? null,
      cinApprovalReason:  account.cinApprovalReason  ?? null,
      isAdmin:            false,
    };
    setUser(loggedUser);
    return { success: true, user: loggedUser };
  }
 
  function logout() { setUser(null); }
 
  // converts accounts object → array for AdminCINReview
  const users = Object.values(accounts);
 
  function updateUser(email, patch) {
    setAccounts(prev => {
      const key = email.toLowerCase();
      if (!prev[key]) return prev;
      return { ...prev, [key]: { ...prev[key], ...patch } };
    });
  }
 
  return (
    <AuthContext.Provider value={{ user, accounts, users, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() { return useContext(AuthContext); }