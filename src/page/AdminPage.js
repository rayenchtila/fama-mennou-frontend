// src/page/AdminPage.js
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

// ─── helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-sky-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
  ];
  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    pending:  { label: t("admin.status.pending"),  cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    approved: { label: t("admin.status.approved"), cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    rejected: { label: t("admin.status.rejected"), cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── CIN image viewer modal ───────────────────────────────────────────────────

function CINImageModal({ user, onClose }) {
  const { t } = useTranslation();
  const [side, setSide] = useState("front");
  const img = side === "front" ? user.cinFront : user.cinBack;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          {[{ id: "front", label: t("Face avant") }, { id: "back", label: t("Face arrière") }].map(s => (
            <button key={s.id} onClick={() => setSide(s.id)} className={["flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200", side === s.id ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"].join(" ")}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="p-4 bg-slate-900 min-h-64 flex items-center justify-center">
          {img ? (
            <img src={`data:image/jpeg;base64,${img}`} alt={`CIN ${side}`} className="max-h-96 w-full object-contain rounded-xl" />
          ) : (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
              <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
              <span>{t("admin.cin.unavailable")}</span>
            </div>
          )}
        </div>
        <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-800">
          {[{ label: t("admin.cin.full_name"), value: user.name }, { label: t("admin.cin.dob"), value: user.dob }, { label: t("admin.cin.region"), value: user.region }].map(({ label, value }) => (
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
  const REJECT_PRESETS = [
    t("admin.reject.preset1"),
    t("admin.reject.preset2"),
    t("admin.reject.preset3"),
    t("admin.reject.preset4"),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t("admin.reject.title")}</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.reject.quick_reason")}</p>
          <div className="space-y-1.5 mb-4">
            {REJECT_PRESETS.map(p => (
              <button key={p} onClick={() => setReason(p)} className={["w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150", reason === p ? "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 font-semibold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.reject.custom")}</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={t("admin.reject.placeholder")} className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t("admin.reject.cancel")}</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">{t("admin.reject.confirm")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── approve dialog ───────────────────────────────────────────────────────────

function ApproveDialog({ user, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const APPROVE_PRESETS = [
    t("admin.approve.preset1"),
    t("admin.approve.preset2"),
    t("admin.approve.preset3"),
    t("admin.approve.preset4"),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t("admin.approve.title")}</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.approve.quick_msg")}</p>
          <div className="space-y-1.5 mb-4">
            {APPROVE_PRESETS.map(p => (
              <button key={p} onClick={() => setReason(p)} className={["w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150", reason === p ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("admin.approve.custom")}</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={t("admin.approve.placeholder")} className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t("admin.approve.cancel")}</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">{t("admin.approve.confirm")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── user detail notification card ───────────────────────────────────────────

function UserNotificationCard({ user, onApprove, onReject, onView, justActed }) {
  const { t } = useTranslation();
  const status = user.cinStatus ?? (user.cinVerified ? "approved" : "pending");
  const acted  = justActed[user.email];

  return (
    <div className={["bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden", acted === "approved" ? "border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20" : acted === "rejected" ? "border-rose-300 dark:border-rose-700 shadow-lg shadow-rose-100 dark:shadow-rose-900/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"].join(" ")}>

      {status === "pending" && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t("admin.card.new_request")}</p>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{user.email}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              {[
                { label: t("admin.card.full_name"),     value: user.name,     icon: "👤" },
                { label: t("admin.card.email"),         value: user.email,    icon: "📧" },
                { label: t("admin.card.dob"),           value: user.dob,      icon: "🎂" },
                { label: t("admin.card.gender"),        value: user.gender === "male" ? t("admin.card.male") : user.gender === "female" ? t("admin.card.female") : null, icon: "⚥" },
                { label: t("admin.card.region"),        value: user.region,   icon: "📍" },
                { label: t("admin.card.role"),          value: user.role,     icon: "🏷️" },
                { label: t("admin.card.skills"),        value: user.skills,   icon: "🛠️" },
                { label: t("admin.card.bio"),           value: user.bio,      icon: "📝" },
                { label: t("admin.card.registered_at"), value: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString("fr-TN") : null, icon: "📅" },
              ].filter(f => f.value).map(({ label, value, icon }) => (
                <div key={label} className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{icon} {label}</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate capitalize">{value}</p>
                </div>
              ))}
            </div>

            {(user.cinFront || user.cinBack) && (
              <div className="flex gap-3 mb-4">
                {[{ key: "cinFront", label: t("Face avant") }, { key: "cinBack", label: t("Face arrière") }].map(({ key, label }) => user[key] ? (
                  <div key={key} className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-24" onClick={() => onView(user)}>
                      <img src={`data:image/jpeg;base64,${user[key]}`} alt={label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{t("admin.card.enlarge")}</span>
                      </div>
                    </div>
                  </div>
                ) : null)}
              </div>
            )}

            {status === "approved" && user.cinApprovalReason && (
              <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-3">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-0.5">{t("admin.card.msg_sent")}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{user.cinApprovalReason}</p>
                </div>
              </div>
            )}
            {status === "rejected" && user.cinRejectionReason && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl mb-3">
                <svg className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                <div>
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-0.5">{t("admin.card.reason_sent")}</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400">{user.cinRejectionReason}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => onView(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {t("admin.card.view_cin")}
              </button>

              {/* ── ONE TIME ONLY: buttons only shown when status is pending, hidden forever after decision ── */}
              {status === "pending" && (
                <>
                  <button onClick={() => onApprove(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {t("admin.card.approve")}
                  </button>
                  <button onClick={() => onReject(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    {t("admin.card.reject")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {acted && (
        <div className={`h-1 w-full transition-all duration-700 ${acted === "approved" ? "bg-emerald-500" : "bg-rose-500"}`} />
      )}
    </div>
  );
}

// ─── ALL USERS TABLE ──────────────────────────────────────────────────────────

function AllUsersTable({ allUsers, search }) {
  const { t } = useTranslation();
  const getStatus = u => u.cinStatus ?? (u.cinVerified ? "approved" : "pending");

  const filtered = (allUsers ?? []).filter(u => {
    if (!search.trim()) return true;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p className="text-sm font-semibold">{t("admin.no_users")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(u => {
        const status = getStatus(u);
        return (
          <div key={u.email} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-start gap-4">
              <Avatar name={u.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</p>
                  {(u.role === "freelancer" || u.role === "client") && <StatusBadge status={status} />}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.role === "client" ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"}`}>
                    {u.role === "client" ? "💼 Client" : "🚀 Freelancer"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{u.email}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  {[
                    { label: t("admin.table.name"),          value: u.name,    icon: "👤" },
                    { label: t("admin.card.email"),          value: u.email,   icon: "📧" },
                    { label: t("admin.card.role"),           value: u.role,    icon: "🏷️" },
                    { label: t("admin.table.dob"),           value: u.dob,     icon: "🎂" },
                    { label: t("admin.card.gender"),         value: u.gender === "male" ? t("admin.card.male") : u.gender === "female" ? t("admin.card.female") : null, icon: "⚥" },
                    { label: t("admin.card.region"),         value: u.region,  icon: "📍" },
                    { label: t("admin.table.skills"),        value: u.skills,  icon: "🛠️" },
                    { label: t("admin.card.bio"),            value: u.bio,     icon: "📝" },
                    { label: t("admin.table.registered"),    value: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("fr-TN") : null, icon: "📅" },
                    { label: t("admin.table.cin_status"),    value: (u.role === "freelancer" || u.role === "client") ? status : null, icon: "🪪" },
                    { label: t("admin.table.reject_reason"), value: u.cinRejectionReason ?? null, icon: "❌" },
                    { label: t("admin.table.approve_msg"),   value: u.cinApprovalReason ?? null, icon: "✅" },
                  ].filter(f => f.value).map(({ label, value, icon }) => (
                    <div key={label} className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{icon} {label}</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── age helper ───────────────────────────────────────────────────────────────

function getAge(dob) {
  if (!dob) return null;
  let date;
  if (/^\d{4}-\d{2}-\d{2}/.test(dob))         date = new Date(dob);
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) { const [d,m,y] = dob.split("/"); date = new Date(`${y}-${m}-${d}`); }
  else                                          date = new Date(dob);
  if (isNaN(date)) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const mo = today.getMonth() - date.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

const AGE_BRACKETS = [
  { range: "18 – 25", min: 18, max: 25 },
  { range: "26 – 35", min: 26, max: 35 },
  { range: "36 – 45", min: 36, max: 45 },
  { range: "46 – 60", min: 46, max: 60 },
];

// ─── FULL STATISTICS PANEL ────────────────────────────────────────────────────

function StatisticsPanel({ allUsers }) {
  const { t } = useTranslation();
  const all         = allUsers ?? [];
  const totalUsers  = all.length;
  const clients     = all.filter(u => u.role === "client");
  const freelancers = all.filter(u => u.role === "freelancer");

  const clientPct     = totalUsers ? Math.round((clients.length     / totalUsers) * 100) : 0;
  const freelancerPct = totalUsers ? Math.round((freelancers.length / totalUsers) * 100) : 0;

  const getStatus  = u => u.cinStatus ?? (u.cinVerified ? "approved" : "pending");
  const flApproved = freelancers.filter(u => getStatus(u) === "approved").length;
  const flPending  = freelancers.filter(u => getStatus(u) === "pending").length;
  const flRejected = freelancers.filter(u => getStatus(u) === "rejected").length;

  const clApproved = clients.filter(u => getStatus(u) === "approved").length;
  const clPending  = clients.filter(u => getStatus(u) === "pending").length;
  const clRejected = clients.filter(u => getStatus(u) === "rejected").length;

  const males     = freelancers.filter(u => u.gender === "male").length;
  const females   = freelancers.filter(u => u.gender === "female").length;
  const unknown   = freelancers.length - males - females;
  const malePct   = freelancers.length ? Math.round((males   / freelancers.length) * 100) : 0;
  const femalePct = freelancers.length ? Math.round((females / freelancers.length) * 100) : 0;

  const ageCounts = AGE_BRACKETS.map(b => ({
    ...b,
    count: freelancers.filter(u => { const age = getAge(u.dob); return age !== null && age >= b.min && age <= b.max; }).length,
  }));
  const maxAge = Math.max(...ageCounts.map(b => b.count), 1);

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          {t("admin.overview")} — {totalUsers} {t("admin.users_registered")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-base shrink-0">🚀</div>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t("Freelancers")}</p>
            </div>
            <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-0.5">{freelancers.length}</p>
            <p className="text-xs text-indigo-500 font-semibold mb-3">{freelancerPct}% {t("admin.pct_of_users")}</p>
            <div className="flex gap-1.5">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{flApproved}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.approved")}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{flPending}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.pending")}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{flRejected}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.rejected")}</p>
              </div>
            </div>
          </div>
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center text-base shrink-0">💼</div>
              <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">{t("Clients")}</p>
            </div>
            <p className="text-3xl font-extrabold text-sky-700 dark:text-sky-300 mb-0.5">{clients.length}</p>
            <p className="text-xs text-sky-500 font-semibold mb-3">{clientPct}% {t("admin.pct_of_users")}</p>
            <div className="flex gap-1.5">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{clApproved}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.approved")}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-amber-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{clPending}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.pending")}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-900 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{clRejected}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{t("admin.rejected")}</p>
              </div>
            </div>
          </div>
        </div>
        {totalUsers > 0 && (
          <>
            <div className="h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
              {clientPct     > 0 && <div className="bg-sky-500   transition-all duration-700" style={{ width: `${clientPct}%`     }} />}
              {freelancerPct > 0 && <div className="bg-indigo-500 transition-all duration-700" style={{ width: `${freelancerPct}%` }} />}
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />{t("Clients")} {clientPct}%</span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />{t("Freelancers")} {freelancerPct}%</span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          {t("admin.freelancer_demography")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t("admin.gender")}</p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-900 px-3 py-2.5 flex items-center gap-2">
                <span className="text-lg">👨</span>
                <div>
                  <p className="text-lg font-extrabold text-sky-700 dark:text-sky-400">{males}</p>
                  <p className="text-[10px] text-sky-500 font-semibold">{t("admin.men")} · {malePct}%</p>
                </div>
              </div>
              <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 rounded-2xl border border-pink-100 dark:border-pink-900 px-3 py-2.5 flex items-center gap-2">
                <span className="text-lg">👩</span>
                <div>
                  <p className="text-lg font-extrabold text-pink-600 dark:text-pink-400">{females}</p>
                  <p className="text-[10px] text-pink-500 font-semibold">{t("admin.women")} · {femalePct}%</p>
                </div>
              </div>
            </div>
            {freelancers.length > 0 && (
              <div className="h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                {malePct   > 0 && <div className="bg-sky-500  transition-all duration-700" style={{ width: `${malePct}%`   }} />}
                {femalePct > 0 && <div className="bg-pink-500 transition-all duration-700" style={{ width: `${femalePct}%` }} />}
                {unknown   > 0 && <div className="bg-slate-300 dark:bg-slate-600 flex-1" />}
              </div>
            )}
            {unknown > 0 && <p className="text-[10px] text-slate-400 mt-1">{unknown} {t("admin.unspecified")}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t("admin.age_distribution")}</p>
            <div className="space-y-2">
              {ageCounts.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-24 shrink-0">{b.range} {t("admin.years")}</span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${Math.round((b.count / maxAge) * 100)}%` }} />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 w-5 text-right shrink-0">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, users, updateUser, logout, getAdminNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications, fetchAccounts, fetchNotifications } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchAccounts();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchAccounts();
      fetchNotifications();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── main tab: "cin" | "allusers" | "courses" ──
  const [mainTab,   setMainTab]   = useState("cin");
  const [filter,    setFilter]    = useState("pending");
  const [search,    setSearch]    = useState("");
  const [viewing,   setViewing]   = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [approving, setApproving] = useState(null);
  const [justActed, setJustActed] = useState({});
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // ── courses tab state ──
  const [allCourses,      setAllCourses]      = useState([]);
  const [coursesLoading,  setCoursesLoading]  = useState(false);
  const [courseFilter,    setCourseFilter]    = useState("pending");
  const [courseActing,    setCourseActing]    = useState({});
  const [courseRejectId,  setCourseRejectId]  = useState(null);
  const [courseApproveId, setCourseApproveId] = useState(null);
  const [courseNote,      setCourseNote]      = useState("");
  const [expandedCourse,  setExpandedCourse]  = useState(null);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [lessonsLoading,  setLessonsLoading]  = useState(false);

  const API = 'https://famamennou-server.onrender.com/api';

  const fetchCourses = async () => {
    setCoursesLoading(true);
    const delays = [0, 3000, 6000, 10000];
    for (const delay of delays) {
      try {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        const res = await fetch(`${API}/courses/pending`);
        const d   = await res.json();
        if (Array.isArray(d) && d.length >= 0) {
          setAllCourses(d);
          setCoursesLoading(false);
          return;
        }
      } catch {}
    }
    setCoursesLoading(false);
  };

  async function toggleLessons(courseId) {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    if (lessonsByCourse[courseId]) return;
    setLessonsLoading(true);
    try {
      const r = await fetch(`${API}/lessons/course/${courseId}`);
      const d = await r.json();
      if (Array.isArray(d)) setLessonsByCourse(p => ({ ...p, [courseId]: d }));
    } catch {}
    setLessonsLoading(false);
  }

  function CourseVideoPlayer({ url, label }) {
    if (!url) return <p className="text-xs text-slate-400 text-center py-3">Aucune vidéo disponible</p>;
    const isYT  = /youtube\.com|youtu\.be/.test(url);
    const isURL = /^https?:\/\//i.test(url);
    const isB64 = url.startsWith('data:video');
    if (isYT) {
      const vid = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      return (
        <div>
          {label && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">{label}</p>}
          <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${vid}?rel=0`} allowFullScreen title="video" />
        </div>
      );
    }
    if (isURL || isB64) {
      return (
        <div>
          {label && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">{label}</p>}
          <video className="w-full aspect-video rounded-xl bg-black" src={url} controls />
        </div>
      );
    }
    // Filename only — not streamable
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.263a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
        </svg>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">📎 {url}</p>
      </div>
    );
  }

  // Fetch courses on mount AND on tab switch — badge always ready
  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { if (mainTab === 'courses') fetchCourses(); }, [mainTab]);

  const coursesByFilter = allCourses.filter(c =>
    courseFilter === 'all' ? true : c.status === courseFilter
  );
  const courseCounts = {
    pending:  allCourses.filter(c => c.status === 'pending').length,
    approved: allCourses.filter(c => c.status === 'approved').length,
    rejected: allCourses.filter(c => c.status === 'rejected').length,
    all:      allCourses.length,
  };

  async function approveCourse(id, note) {
    setCourseActing(p => ({ ...p, [id]: 'approved' }));
    await fetch(`${API}/courses/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note }),
    });
    setCourseApproveId(null);
    setCourseNote('');
    fetchCourses();
    setTimeout(() => setCourseActing(p => { const n = { ...p }; delete n[id]; return n; }), 1800);
  }

  async function rejectCourse(id, note) {
    setCourseActing(p => ({ ...p, [id]: 'rejected' }));
    await fetch(`${API}/courses/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note }),
    });
    setCourseRejectId(null);
    setCourseNote('');
    fetchCourses();
    setTimeout(() => setCourseActing(p => { const n = { ...p }; delete n[id]; return n; }), 1800);
  }

  const adminNotifications = getAdminNotifications();
  const unreadCount = adminNotifications.filter(n => !n.read).length;

  const cinUsers  = (users ?? []).filter(u => u.role === "freelancer" || u.role === "client");
  const getStatus = u => u.cinStatus ?? (u.cinVerified ? "approved" : "pending");

  const counts = {
    all:      cinUsers.length,
    pending:  cinUsers.filter(u => getStatus(u) === "pending").length,
    approved: cinUsers.filter(u => getStatus(u) === "approved").length,
    rejected: cinUsers.filter(u => getStatus(u) === "rejected").length,
  };

  const filtered = cinUsers.filter(u => {
    const matchFilter = filter === "all" || getStatus(u) === filter;
    const matchSearch = !search.trim() ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function flash(email, action) {
    setJustActed(p => ({ ...p, [email]: action }));
    setTimeout(() => setJustActed(p => { const n = { ...p }; delete n[email]; return n; }), 1800);
  }

  function handleApprove(user) {
    if (user._resetOnly) {
      updateUser(user.email, { cinStatus: "pending", cinRejectionReason: null, cinApprovalReason: null });
      return;
    }
    setApproving(user);
  }

  function handleApproveConfirm(user, reason) {
    updateUser(user.email, { cinStatus: "approved", cinRejectionReason: null, cinApprovalReason: reason });
    setApproving(null);
    flash(user.email, "approved");
  }

  function handleReject(user, reason) {
    updateUser(user.email, { cinStatus: "rejected", cinRejectionReason: reason, cinApprovalReason: null });
    setRejecting(null);
    flash(user.email, "rejected");
  }

  const FILTERS = [
    { id: "pending",  label: t("admin.pending")  },
    { id: "approved", label: t("admin.approved") },
    { id: "rejected", label: t("admin.rejected") },
    { id: "all",      label: t("admin.filter.all") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── top bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">Admin Dashboard</p>
                {counts.pending > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span></span>
                    {counts.pending} {t("admin.pending_badge")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder={t("admin.search_placeholder")} value={search} onChange={e => setSearch(e.target.value)} className="w-52 pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors" />
            </div>

            <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <button onClick={() => setLogoutConfirm(true)} className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>

        {/* ── MAIN TABS ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex flex-wrap gap-1">
          {[
            { id: "cin",      label: t("admin.tab.cin") },
            { id: "allusers", label: `${t("admin.tab.all_users")} (${(users ?? []).length > 0 ? (users ?? []).length : '…'})` },
            { id: "courses",  label: `📚 Cours${courseCounts.pending > 0 ? ` (${courseCounts.pending})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={[
                "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200",
                mainTab === tab.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* ══ CIN TAB ══ */}
        {mainTab === "cin" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: t("admin.total_cin"),  value: counts.all,      color: "text-slate-700 dark:text-slate-200",     bg: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800" },
                { label: t("admin.pending"),    value: counts.pending,  color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900" },
                { label: t("admin.approved"),   value: counts.approved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900" },
                { label: t("admin.rejected"),   value: counts.rejected, color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <StatisticsPanel allUsers={users} />

            <div className="flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={["px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5", filter === f.id ? "bg-indigo-600 text-white shadow" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"].join(" ")}>
                  {f.label}
                  {counts[f.id] > 0 && (
                    <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none ${filter === f.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{counts[f.id]}</span>
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <p className="text-sm font-semibold">{t("admin.no_notifs")}</p>
                <p className="text-xs mt-1">{t("admin.notifs_appear_here")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(u => (
                  <UserNotificationCard
                    key={u.email}
                    user={u}
                    onApprove={handleApprove}
                    onReject={usr => setRejecting(usr)}
                    onView={setViewing}
                    justActed={justActed}
                  />
                ))}

              </div>
            )}
          </>
        )}

        {/* ══ ALL USERS TAB ══ */}
        {mainTab === "allusers" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: t("admin.total"),       value: (users ?? []).length,                                    color: "text-slate-700 dark:text-slate-200",     bg: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800" },
                { label: t("admin.clients"),     value: (users ?? []).filter(u => u.role === "client").length,   color: "text-sky-600 dark:text-sky-400",          bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-900" },
                { label: t("admin.freelancers"), value: (users ?? []).filter(u => u.role === "freelancer").length, color: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <AllUsersTable allUsers={users} search={search} />
          </>
        )}

        {/* ══ COURSES TAB ══ */}
        {mainTab === "courses" && (
          <>
            {/* Stats + refresh */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {coursesLoading ? 'Chargement…' : `${courseCounts.all} cours au total`}
              </p>
              <button onClick={fetchCourses} disabled={coursesLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors disabled:opacity-40">
                <svg className={`w-3.5 h-3.5 ${coursesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Actualiser
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total',    value: courseCounts.all,      color: 'text-slate-700 dark:text-slate-200',     bg: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' },
                { label: 'En attente', value: courseCounts.pending, color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900' },
                { label: 'Approuvés', value: courseCounts.approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900' },
                { label: 'Refusés',  value: courseCounts.rejected, color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
              {[['pending','En attente'],['approved','Approuvés'],['rejected','Refusés'],['all','Tous']].map(([id, label]) => (
                <button key={id} onClick={() => setCourseFilter(id)}
                  className={['px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5',
                    courseFilter === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'].join(' ')}>
                  {label}
                  {courseCounts[id] > 0 && (
                    <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none ${courseFilter === id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{courseCounts[id]}</span>
                  )}
                </button>
              ))}
            </div>

            {coursesLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}</div>
            ) : coursesByFilter.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                <span className="text-5xl mb-3">📚</span>
                <p className="text-sm font-semibold">Aucun cours dans cette catégorie</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coursesByFilter.map(course => {
                  const acted = courseActing[course.id];
                  const isPending = course.status === 'pending';
                  return (
                    <div key={course.id} className={['bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden',
                      acted === 'approved' ? 'border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20' :
                      acted === 'rejected' ? 'border-rose-300 dark:border-rose-700 shadow-lg shadow-rose-100 dark:shadow-rose-900/20' :
                      'border-slate-200 dark:border-slate-800'].join(' ')}>

                      {isPending && (
                        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                          </span>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Nouveau cours à valider</p>
                        </div>
                      )}

                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 shrink-0 flex items-center justify-center text-2xl">
                            {course.thumbnail_url
                              ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              : '📚'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{course.title}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                course.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                                course.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              }`}>
                                {course.status === 'approved' ? '✅ Approuvé' : course.status === 'rejected' ? '❌ Refusé' : '⏳ En attente'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Par <span className="font-semibold text-slate-700 dark:text-slate-300">{course.instructor_name || course.creator_email}</span></p>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">📂 {course.category}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">💰 {Number(course.full_price) === 0 ? 'Gratuit' : `${Number(course.full_price).toFixed(2)} TND`}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">📅 {new Date(course.created_at).toLocaleDateString('fr-TN')}</span>
                            </div>

                            {course.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{course.description}</p>
                            )}

                            {course.admin_note && !isPending && (
                              <div className={`flex items-start gap-2 p-2.5 rounded-xl mb-3 ${course.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'}`}>
                                <p className={`text-xs font-semibold ${course.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                  💬 {course.admin_note}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap items-center">
                              {isPending && (<>
                                <button onClick={() => { setCourseApproveId(course.id); setCourseNote(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  Approuver
                                </button>
                                <button onClick={() => { setCourseRejectId(course.id); setCourseNote(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors active:scale-95">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                  Refuser
                                </button>
                              </>)}
                              <button onClick={() => toggleLessons(course.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:scale-95 ${
                                  expandedCourse === course.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'
                                }`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                {expandedCourse === course.id ? 'Masquer leçons' : 'Voir leçons & vidéos'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Lessons panel ── */}
                      {expandedCourse === course.id && (
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-4">
                          {lessonsLoading && !lessonsByCourse[course.id] ? (
                            <div className="space-y-3">
                              {[1,2].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
                            </div>
                          ) : !lessonsByCourse[course.id] || lessonsByCourse[course.id].length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                              <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.263a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                              </svg>
                              <p className="text-xs font-semibold">Aucune leçon ajoutée pour ce cours</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Course-level video */}
                              {(course.video_url || course.photo_url) && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-3 space-y-2">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">📽 Vidéo du cours</p>
                                  <CourseVideoPlayer url={course.video_url} />
                                  {course.photo_url && (
                                    <img src={course.photo_url} alt="cover" className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mt-1" />
                                  )}
                                </div>
                              )}
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {lessonsByCourse[course.id].length} leçon{lessonsByCourse[course.id].length > 1 ? 's' : ''}
                              </p>
                              {lessonsByCourse[course.id].map((lesson, idx) => (
                                <div key={lesson.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{lesson.title}</p>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        {lesson.duration_min > 0 && <span className="text-[10px] text-slate-400">⏱ {lesson.duration_min} min</span>}
                                        {lesson.is_free_preview && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Free Preview</span>}
                                        {Number(lesson.price) > 0 && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">${Number(lesson.price).toFixed(2)}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {lesson.description && (
                                    <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{lesson.description}</p>
                                  )}
                                  <div className="p-3">
                                    <CourseVideoPlayer url={lesson.video_url} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {acted && <div className={`h-1 w-full transition-all duration-700 ${acted === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Course approve modal ── */}
      {courseApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">Approuver ce cours</p>
              </div>
              <button onClick={() => setCourseApproveId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 pb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message pour l'instructeur (optionnel)</p>
              {[['Excellent contenu, bien structuré !','Cours approuvé, bonne continuation !','Contenu de qualité, félicitations !']].flat().map(p => (
                <button key={p} onClick={() => setCourseNote(p)} className={['w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all', courseNote === p ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'].join(' ')}>{p}</button>
              ))}
              <textarea value={courseNote} onChange={e => setCourseNote(e.target.value)} rows={2} placeholder="Message personnalisé…" className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setCourseApproveId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
              <button onClick={() => approveCourse(courseApproveId, courseNote)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">✅ Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Course reject modal ── */}
      {courseRejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">Refuser ce cours</p>
              </div>
              <button onClick={() => setCourseRejectId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 pb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raison du refus</p>
              {['Contenu insuffisant ou incomplet.','Titre ou description peu clairs.','Catégorie incorrecte.','Vidéo manquante ou illisible.'].map(p => (
                <button key={p} onClick={() => setCourseNote(p)} className={['w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all', courseNote === p ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'].join(' ')}>{p}</button>
              ))}
              <textarea value={courseNote} onChange={e => setCourseNote(e.target.value)} rows={2} placeholder="Raison personnalisée…" className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setCourseRejectId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
              <button disabled={!courseNote.trim()} onClick={() => rejectCourse(courseRejectId, courseNote)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-colors">❌ Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── modals ── */}
      {viewing   && <CINImageModal  user={viewing}   onClose={() => setViewing(null)} />}
      {rejecting && <RejectDialog   user={rejecting} onConfirm={r => handleReject(rejecting, r)}         onClose={() => setRejecting(null)} />}
      {approving && <ApproveDialog  user={approving} onConfirm={r => handleApproveConfirm(approving, r)} onClose={() => setApproving(null)} />}

      {/* ── Notifications Panel ── */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16" onClick={() => setNotifOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{t("admin.notif_panel")}</p>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={() => markAllNotificationsRead("admin")} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{t("admin.mark_all_read")}</button>
                )}
                {adminNotifications.length > 0 && (
                  <button onClick={() => clearNotifications("admin")} className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors">{t("admin.clear_notifs")}</button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {adminNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  <p className="text-xs font-semibold">{t("admin.no_notifs")}</p>
                </div>
              ) : (
                adminNotifications.map(n => (
                  <div key={n.id} onClick={() => markNotificationRead(n.id)} className={["flex items-start gap-3 px-5 py-3.5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors", n.read ? "bg-white dark:bg-slate-900" : "bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"].join(" ")}>
                    <div className={["w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm", n.kind === "approved" ? "bg-emerald-100 dark:bg-emerald-900/30" : n.kind === "rejected" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-amber-100 dark:bg-amber-900/30"].join(" ")}>
                      {n.kind === "approved" ? "✅" : n.kind === "rejected" ? "❌" : "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold mb-0.5 ${n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
              <button onClick={() => setLogoutConfirm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Log out</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Are you sure you want to log out?</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setLogoutConfirm(false)} className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => { logout(); setLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors shadow-sm shadow-rose-500/30">
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
