// src/pages/AdminCINReview.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

// ─── tiny helpers ────────────────────────────────────────────────────────────

function Badge({ status }) {
  const { t } = useTranslation();
  const map = {
    pending:  { label: t("admin.status.pending"),  cls: "bg-amber-100 text-amber-700 border-amber-200"   },
    approved: { label: t("admin.status.approved"),    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    rejected: { label: t("admin.status.rejected"),      cls: "bg-rose-100 text-rose-700 border-rose-200"      },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}
 
function Avatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-sky-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
  ];
  const color = colors[name?.charCodeAt(0) % colors.length] ?? colors[0];
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow`}>
      {initials}
    </div>
  );
}
 
// ─── rejection reason presets ─────────────────────────────────────────────────
 
const REJECT_PRESET_KEYS = [
  "admin.reject.preset1",
  "admin.reject.preset2",
  "admin.reject.preset3",
  "admin.reject.preset4",
];

// ─── approval reason presets ──────────────────────────────────────────────────

const APPROVE_PRESET_KEYS = [
  "admin.approve.preset1",
  "admin.approve.preset2",
  "admin.approve.preset3",
  "admin.approve.preset4",
];
 
// ─── CIN image viewer modal ───────────────────────────────────────────────────
 
function CINImageModal({ user, onClose }) {
  const { t } = useTranslation();
  const [side, setSide] = useState("front");
  const img = side === "front" ? user.cinFront : user.cinBack;
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
 
        {/* Side toggle */}
        <div className="flex gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          {[{ id: "front", label: t("Face avant") }, { id: "back", label: t("Face arrière") }].map(s => (
            <button
              key={s.id}
              onClick={() => setSide(s.id)}
              className={[
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200",
                side === s.id
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              ].join(" ")}
            >
              {s.label}
            </button>
          ))}
        </div>
 
        {/* Image */}
        <div className="p-4 bg-slate-900 min-h-64 flex items-center justify-center">
          {img ? (
            <img
              src={`data:image/jpeg;base64,${img}`}
              alt={`CIN ${side}`}
              className="max-h-96 w-full object-contain rounded-xl"
            />
          ) : (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
              <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
              <span>{t("admin.cin.unavailable")}</span>
            </div>
          )}
        </div>
 
        {/* Registered info summary */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800">
          {[
            { label: t("admin.cin.full_name"),        value: user.name },
            { label: t("admin.cin.dob"),  value: user.dob  },
            { label: t("admin.cin.region"),             value: user.region },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
// ─── reject dialog ────────────────────────────────────────────────────────────
 
function RejectDialog({ user, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t("admin.reject.title")}</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>

          {/* Presets */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.reject.quick_reason")}</p>
          <div className="space-y-1.5 mb-4">
            {REJECT_PRESET_KEYS.map(k => t(k)).map(p => (
              <button
                key={p}
                onClick={() => setReason(p)}
                className={[
                  "w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150",
                  reason === p
                    ? "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 font-semibold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
          </div>
 
          {/* Custom reason */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.reject.custom")}</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder={t("admin.reject.placeholder")}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors"
          />
        </div>
 
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {t("admin.reject.cancel")}
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => reason.trim() && onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {t("admin.reject.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── approve dialog ──────────────────────────────────────────────────────────
 
function ApproveDialog({ user, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t("admin.approve.title")}</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>

          {/* Presets */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.approve.quick_msg")}</p>
          <div className="space-y-1.5 mb-4">
            {APPROVE_PRESET_KEYS.map(k => t(k)).map(p => (
              <button
                key={p}
                onClick={() => setReason(p)}
                className={[
                  "w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150",
                  reason === p
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
          </div>
 
          {/* Custom reason */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.approve.custom")}</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder={t("admin.approve.placeholder")}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors"
          />
        </div>
 
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {t("admin.approve.cancel")}
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => reason.trim() && onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {t("admin.approve.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── main admin page ──────────────────────────────────────────────────────────
 
export default function AdminCINReview() {
  const { t } = useTranslation();
  const { users, updateUser } = useAuth();
  // ✅ Removed deleteUser — rejected users are NEVER deleted
 
  const [filter,      setFilter]      = useState("pending");
  const [search,      setSearch]      = useState("");
  const [viewing,     setViewing]     = useState(null);
  const [rejecting,   setRejecting]   = useState(null);
  const [approving,   setApproving]   = useState(null);
  const [justActed,   setJustActed]   = useState({});
 
  const freelancers = (users ?? []).filter(u => u.role === "freelancer" && (u.cinFront || u.cinBack));
 
  const filtered = freelancers.filter(u => {
    const status = u.cinStatus ?? (u.cinVerified ? "approved" : "pending");
    const matchFilter = filter === "all" || status === filter;
    const matchSearch = !search.trim() ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
 
  const counts = {
    all:      freelancers.length,
    pending:  freelancers.filter(u => (u.cinStatus ?? (u.cinVerified ? "approved" : "pending")) === "pending").length,
    approved: freelancers.filter(u => (u.cinStatus ?? (u.cinVerified ? "approved" : "pending")) === "approved").length,
    rejected: freelancers.filter(u => (u.cinStatus ?? (u.cinVerified ? "approved" : "pending")) === "rejected").length,
  };
 
  function flash(userId, action) {
    setJustActed(p => ({ ...p, [userId]: action }));
    setTimeout(() => setJustActed(p => { const n = { ...p }; delete n[userId]; return n; }), 1800);
  }
 
  function handleApprove(user) {
    setApproving(user);
  }
 
  async function handleApproveConfirm(user, reason) {
    setApproving(null);
    const result = await updateUser(user.email, { cinStatus: "approved", cinRejectionReason: null, cinApprovalReason: reason });
    if (result?.error) {
      alert(`Échec de l'approbation de ${user.name} : ${result.error}. Réessayez.`);
      return;
    }
    flash(user.email, "approved");
  }

  // ── FIX: reject = update status only, NEVER delete the user ──
  async function handleReject(user, reason) {
    setRejecting(null);
    const result = await updateUser(user.email, { cinStatus: "rejected", cinRejectionReason: reason, cinApprovalReason: null });
    if (result?.error) {
      alert(`Échec du refus de ${user.name} : ${result.error}. Réessayez.`);
      return;
    }
    flash(user.email, "rejected");
    // ✅ NO deleteUser call — rejected users stay stored forever
  }
 
  const FILTERS = [
    { id: "pending",  label: t("admin.pending") },
    { id: "approved", label: t("admin.approved")  },
    { id: "rejected", label: t("admin.rejected")    },
    { id: "all",      label: t("admin.filter.all")       },
  ];
 
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
 
      {/* ── Top bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{t("acvr.cin_verification")}</p>
              <p className="text-[11px] text-slate-400">{t("acvr.admin_panel")}</p>
            </div>
          </div>
 
          {/* Search */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder={t("acvr.search_freelancer")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>
      </div>
 
      <div className="max-w-5xl mx-auto px-6 py-6">
 
        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("admin.total"),        value: counts.all,      color: "text-slate-700 dark:text-slate-200",    bg: "bg-white dark:bg-slate-900" },
            { label: t("admin.pending"),   value: counts.pending,  color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: t("admin.approved"),    value: counts.approved, color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: t("admin.rejected"),      value: counts.rejected, color: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-900/20" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
 
        {/* ── Filter tabs ── */}
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 w-fit">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                "px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5",
                filter === f.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
              ].join(" ")}
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none ${filter === f.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                  {counts[f.id]}
                </span>
              )}
            </button>
          ))}
        </div>
 
        {/* ── Cards list ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm font-semibold">{t("acvr.no_files")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => {
              const status = user.cinStatus ?? (user.cinVerified ? "approved" : "pending");
              const acted  = justActed[user.email];
              return (
                <div
                  key={user.email}
                  className={[
                    "bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden",
                    acted === "approved" ? "border-emerald-300 dark:border-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20 shadow-lg" :
                    acted === "rejected" ? "border-rose-300 dark:border-rose-700 shadow-rose-100 dark:shadow-rose-900/20 shadow-lg" :
                    "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
                  ].join(" ")}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
 
                      {/* Avatar */}
                      <Avatar name={user.name} />
 
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                          <Badge status={status} />
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{user.email}</p>
 
                        {/* Registered details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs mb-3">
                          {[
                            { label: t("acvr.born_on"),  value: user.dob    },
                            { label: t("admin.card.gender"),     value: user.gender === "male" ? t("admin.card.male") : user.gender === "female" ? t("admin.card.female") : null },
                            { label: t("admin.cin.region"),    value: user.region },
                            { label: t("admin.table.skills"),    value: user.skills },
                            { label: t("acvr.cin_name"), value: user.cin    },
                          ].map(({ label, value }) => value ? (
                            <div key={label}>
                              <span className="text-slate-400 font-medium">{label}: </span>
                              <span className="text-slate-700 dark:text-slate-300 font-semibold">{value}</span>
                            </div>
                          ) : null)}
                        </div>
 
                        {/* Approval reason if any */}
                        {status === "approved" && user.cinApprovalReason && (
                          <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-3">
                            <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">{user.cinApprovalReason}</p>
                          </div>
                        )}
 
                        {/* Rejection reason if any */}
                        {status === "rejected" && user.cinRejectionReason && (
                          <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl mb-3">
                            <svg className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            <p className="text-xs text-rose-700 dark:text-rose-400">{user.cinRejectionReason}</p>
                          </div>
                        )}
 
                        {/* Action row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* View CIN photos */}
                          <button
                            onClick={() => setViewing(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            {t("admin.card.view_cin")}
                          </button>
 
                          {status !== "approved" && (
                            <button
                              onClick={() => handleApprove(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              {t("admin.card.approve")}
                            </button>
                          )}
 
                          {status !== "rejected" && (
                            <button
                              onClick={() => setRejecting(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                              {t("admin.card.reject")}
                            </button>
                          )}
 
                          {/* Re-open for already decided */}
                          {(status === "approved" || status === "rejected") && (
                            <button
                              onClick={() => updateUser(user.email, { cinStatus: "pending", cinRejectionReason: null, cinApprovalReason: null })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                              </svg>
                              {t("acvr.reopen_pending")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
 
                  {/* Flash bar */}
                  {acted && (
                    <div className={`h-1 w-full transition-all duration-700 ${acted === "approved" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* ── Modals ── */}
      {viewing   && <CINImageModal  user={viewing}   onClose={() => setViewing(null)} />}
      {rejecting && <RejectDialog   user={rejecting} onConfirm={r => handleReject(rejecting, r)}              onClose={() => setRejecting(null)} />}
      {approving && <ApproveDialog  user={approving} onConfirm={r => handleApproveConfirm(approving, r)}      onClose={() => setApproving(null)} />}
    </div>
  );
}