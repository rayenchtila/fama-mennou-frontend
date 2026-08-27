// src/page/AdminPage.js
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MessengerChat from "../components/MessengerChat";
import AdvertisementsAdmin from "../components/AdvertisementsAdmin";
import { useRealtimeChannel } from "../lib/useRealtimeChannel";
import { cldImg, cldVideo } from "../utils/cloudinary";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

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

// The bulk admin user list (GET /users) deliberately strips cin_front/
// cin_back — they're multi-KB-per-row and only ever needed one user at a
// time, for CIN review specifically (see routes/users.js's ADMIN_FIELDS
// comment). Any component that wants to actually show a CIN image must
// fetch it itself via GET /users/:email/cin, which now also resolves
// whichever storage shape that account's row happens to be in (raw base64,
// a full Cloudinary URL, or a bare Cloudinary public_id) into something
// directly usable as an <img src> — the frontend no longer needs to guess.
// A single shared hook means every CIN viewer in the dashboard pulls from
// the same correct source, so this can't silently drift out of sync again.
function useCinImages(email) {
  const { authFetch } = useAuth();
  const [data, setData] = useState({ cin_front: null, cin_back: null });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

  React.useEffect(() => {
    if (!email) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    authFetch(`${API_URL}/users/${encodeURIComponent(email)}/cin`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, loading };
}

// ─── CIN image viewer modal ───────────────────────────────────────────────────

function CINImageModal({ user, onClose }) {
  const { t } = useTranslation();
  useBodyScrollLock(true); // this component only exists while the modal is open
  const [side, setSide] = useState("front");
  const { cin_front, cin_back, loading: cinLoading } = useCinImages(user.email);

  const img = side === "front" ? cin_front : cin_back;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in" onClick={onClose}>
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
          {cinLoading ? (
            <svg className="w-8 h-8 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : img ? (
            <img src={img} alt={`CIN ${side}`} className="max-h-96 w-full object-contain rounded-xl" />
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
  useBodyScrollLock(true); // this component only exists while the modal is open
  const [reason, setReason] = useState("");
  const REJECT_PRESETS = [
    t("admin.reject.preset1"),
    t("admin.reject.preset2"),
    t("admin.reject.preset3"),
    t("admin.reject.preset4"),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in" onClick={onClose}>
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
  useBodyScrollLock(true); // this component only exists while the modal is open
  const [reason, setReason] = useState("");
  const APPROVE_PRESETS = [
    t("admin.approve.preset1"),
    t("admin.approve.preset2"),
    t("admin.approve.preset3"),
    t("admin.approve.preset4"),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in" onClick={onClose}>
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
  // user.cinFront/cinBack are never present here — the bulk list they come
  // from deliberately strips them (see the useCinImages comment above) —
  // this thumbnail preview needs its own per-user fetch, same as the modal.
  const { cin_front, cin_back } = useCinImages(user.email);
  const thumbs = [
    { key: "cinFront", label: t("Face avant"),  src: cin_front },
    { key: "cinBack",  label: t("Face arrière"), src: cin_back },
  ];

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
                { label: t("admin.card.full_name"),     value: user.name,     icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: t("admin.card.email"),         value: user.email,    icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                { label: t("admin.card.dob"),           value: user.dob,      icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label: t("admin.card.gender"),        value: user.gender === "male" ? t("admin.card.male") : user.gender === "female" ? t("admin.card.female") : null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> },
                { label: t("admin.card.region"),        value: user.region,   icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                { label: t("admin.card.role"),          value: user.role,     icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
                { label: t("admin.card.skills"),        value: user.skills,   icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
                { label: t("admin.card.bio"),           value: user.bio,      icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
                { label: t("admin.card.registered_at"), value: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString("fr-TN") : null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              ].filter(f => f.value).map(({ label, value, icon }) => (
                <div key={label} className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{icon} {label}</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate capitalize">{value}</p>
                </div>
              ))}
            </div>

            {(cin_front || cin_back) && (
              <div className="flex gap-3 mb-4">
                {thumbs.map(({ key, label, src }) => src ? (
                  <div key={key} className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-24" onClick={() => onView(user)}>
                      <img src={src} alt={label} className="w-full h-full object-cover" />
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
              {/* Clients don't submit a CIN document, so there's nothing to view. */}
              {user.role === 'freelancer' && (
                <button onClick={() => onView(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {t("admin.card.view_cin")}
                </button>
              )}

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

function AllUsersTable({ allUsers, search, loading }) {
  const { t } = useTranslation();
  const getStatus = u => u.cinStatus ?? (u.cinVerified ? "approved" : "pending");

  const filtered = (allUsers ?? []).filter(u => {
    if (!search.trim()) return true;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (filtered.length === 0 && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
        <svg className="w-8 h-8 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-sm font-semibold">{t("admin.loading") || "Chargement…"}</p>
      </div>
    );
  }

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
                  <Link to={`/profile/${encodeURIComponent(u.email)}`} className="font-bold text-sm no-underline hover:underline" style={{ color: u.role === 'client' ? 'var(--fm-info)' : 'var(--fm-primary-light)' }}>{u.name}</Link>
                  {(u.role === "freelancer" || u.role === "client") && <StatusBadge status={status} />}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.role === "client" ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"}`}>
                    {u.role === "client"
                      ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>Client</span>
                      : <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Freelancer</span>}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{u.email}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  {[
                    { label: t("admin.table.name"),          value: u.name,    icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: t("admin.card.email"),          value: u.email,   icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    { label: t("admin.card.role"),           value: u.role,    icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
                    { label: t("admin.table.dob"),           value: u.dob,     icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                    { label: t("admin.card.gender"),         value: u.gender === "male" ? t("admin.card.male") : u.gender === "female" ? t("admin.card.female") : null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg> },
                    { label: t("admin.card.region"),         value: u.region,  icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                    { label: t("admin.table.skills"),        value: u.skills,  icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
                    { label: t("admin.card.bio"),            value: u.bio,     icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
                    { label: t("admin.table.registered"),    value: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("fr-TN") : null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                    { label: t("admin.table.cin_status"),    value: (u.role === "freelancer" || u.role === "client") ? status : null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
                    { label: t("admin.table.reject_reason"), value: u.cinRejectionReason ?? null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
                    { label: t("admin.table.approve_msg"),   value: u.cinApprovalReason ?? null, icon: <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
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
  const clients     = all.filter(u => u.role === "client");
  const freelancers = all.filter(u => u.role === "freelancer");
  const totalUsers  = clients.length + freelancers.length;

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
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shrink-0"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
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
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center shrink-0"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0284c7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg></div>
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
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <div>
                  <p className="text-lg font-extrabold text-sky-700 dark:text-sky-400">{males}</p>
                  <p className="text-[10px] text-sky-500 font-semibold">{t("admin.men")} · {malePct}%</p>
                </div>
              </div>
              <div className="flex-1 bg-pink-50 dark:bg-pink-900/20 rounded-2xl border border-pink-100 dark:border-pink-900 px-3 py-2.5 flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#ec4899,#f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
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
                <div key={b.range} className="flex items-center gap-3">
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

// ─── Course/Lesson video player (must be at module scope — never inside a component) ──

function CourseVideoPlayer({ url }) {
  const { t } = useTranslation();
  const ref = React.useRef(null);
  const isMux  = (url || '').startsWith('mux:');
  const isYT   = /youtube\.com|youtu\.be/.test(url || '');
  const isURL  = /^https?:\/\//i.test(url || '');
  const isBlob = (url || '').startsWith('blob:');
  const isB64  = (url || '').startsWith('data:video');

  React.useEffect(() => {
    if (!isMux || !ref.current) return;
    const video = ref.current;
    const playbackId = url.replace('mux:', '');
    const src = `https://stream.mux.com/${playbackId}.m3u8`;
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; return; }
    const init = () => {
      if (!window.Hls?.isSupported()) return;
      const h = new window.Hls({ enableWorker: true, startLevel: -1, maxBufferLength: 60, maxMaxBufferLength: 120, maxBufferSize: 60 * 1000 * 1000, lowLatencyMode: false, backBufferLength: 30, abrEwmaDefaultEstimate: 1000000 });
      h.loadSource(src); h.attachMedia(video);
      h.on(window.Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === window.Hls.ErrorTypes.NETWORK_ERROR) h.startLoad();
          else if (d.type === window.Hls.ErrorTypes.MEDIA_ERROR) h.recoverMediaError();
        }
      });
    };
    if (window.Hls) { init(); return; }
    const existing = document.getElementById('hls-script');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.id = 'hls-script';
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.onload = init;
    document.head.appendChild(s);
    return () => { if (video) video.src = ''; };
  }, [isMux, url]);

  if (!url) return <p className="text-xs text-slate-400 text-center py-3">{t('vp.no_video')}</p>;
  if (isMux)  return <video ref={ref} className="w-full aspect-video rounded-xl bg-black" controls playsInline />;
  if (isYT) {
    const vid = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    return <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${vid}?rel=0`} allowFullScreen title="video" />;
  }
  if (isURL || isB64 || isBlob) return <video className="w-full aspect-video rounded-xl bg-black" src={cldVideo(url)} controls playsInline />;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('adm.link_unreadable')}</p>
    </div>
  );
}

// ─── Admin Chat Panel ─────────────────────────────────────────────────────────

const ADMIN_EMAIL       = 'admin@famamennou.com';
const ADMIN_TEAM_NAME   = 'Fama Mennou TEAM';
const AVATAR_CLR        = ['bg-indigo-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-sky-500','bg-fuchsia-500'];
const chatAvatarColor   = email => AVATAR_CLR[(email?.charCodeAt(0) ?? 0) % AVATAR_CLR.length];

function chatOnlineStatus(lastSeen) {
  if (!lastSeen) return { online: false, text: 'Hors ligne' };
  const diffMin = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (diffMin < 3)  return { online: true,  text: 'En ligne' };
  if (diffMin < 60) return { online: false, text: `Il y a ${diffMin} min` };
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return { online: false, text: `Il y a ${diffH}h` };
  return { online: false, text: `Il y a ${Math.floor(diffH / 24)}j` };
}

function ChatAvatar({ name, email, photo, size = 'md', online }) {
  const sz  = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const dot = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <div className="relative shrink-0">
      {photo
        ? <img src={cldImg(photo)} alt={name} className={`${sz} rounded-xl object-cover`} />
        : <div className={`${sz} ${chatAvatarColor(email)} rounded-xl flex items-center justify-center text-white font-bold`}>
            {(name || email)?.slice(0,2).toUpperCase()}
          </div>
      }
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-white dark:border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
      )}
    </div>
  );
}

function AdminChatPanel({ allUsers }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = React.useState([]);
  const [selectedEmail, setSelectedEmail] = React.useState(null);
  const [messages,      setMessages]      = React.useState([]);
  const [newMsg,        setNewMsg]        = React.useState('');
  const [search,        setSearch]        = React.useState('');
  const [convsLoading,  setConvsLoading]  = React.useState(true);
  const [sending,       setSending]       = React.useState(false);
  const [showPicker,    setShowPicker]    = React.useState(false);
  const [pickerSearch,  setPickerSearch]  = React.useState('');
  const [stagedImage,     setStagedImage]     = React.useState(null);
  const [uploading,       setUploading]       = React.useState(false);
  const [openMenuId,      setOpenMenuId]      = React.useState(null);
  const [menuPos,         setMenuPos]         = React.useState({ top: 0, right: 0 });
  const [editingId,       setEditingId]       = React.useState(null);
  const [editText,        setEditText]        = React.useState('');
  const [editStagedImage, setEditStagedImage] = React.useState(null);

  const [userCourseReq, setUserCourseReq] = React.useState(null);
  const [reqAmount,     setReqAmount]     = React.useState('');
  const [statusSaving,  setStatusSaving]  = React.useState(false);
  const [userProject,   setUserProject]   = React.useState(null);
  const [projAmount,    setProjAmount]    = React.useState('');
  const [projSaving,    setProjSaving]    = React.useState(false);
  const [clientProject, setClientProject] = React.useState(null);
  const [clientAmount,  setClientAmount]  = React.useState('');
  const [clientSaving,  setClientSaving]  = React.useState(false);

  const messagesBoxRef  = React.useRef();
  const convsPollRef    = React.useRef();
  const msgsPollRef     = React.useRef();
  const inputRef        = React.useRef();
  const fileInputRef    = React.useRef();
  const editFileInputRef = React.useRef();

  const API_CHAT = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

  const fetchConvs = React.useCallback(async () => {
    try {
      const data = await fetch(`${API_CHAT}/messages/admin/conversations`).then(r => r.json());
      if (Array.isArray(data)) { setConversations(data); setConvsLoading(false); }
    } catch { setConvsLoading(false); }
  }, []);

  React.useEffect(() => {
    fetchConvs();
    convsPollRef.current = setInterval(fetchConvs, 60000);
    return () => clearInterval(convsPollRef.current);
  }, [fetchConvs]);

  const fetchMsgs = React.useCallback(async (email) => {
    if (!email) return;
    try {
      const data = await fetch(`${API_CHAT}/messages/${encodeURIComponent(ADMIN_EMAIL)}/${encodeURIComponent(email)}`).then(r => r.json());
      if (Array.isArray(data)) setMessages(data);
      fetch(`${API_CHAT}/messages/read/${encodeURIComponent(email)}/${encodeURIComponent(ADMIN_EMAIL)}`, { method: 'PATCH' });
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!selectedEmail) return;
    fetchMsgs(selectedEmail);
    clearInterval(msgsPollRef.current);
    msgsPollRef.current = setInterval(() => fetchMsgs(selectedEmail), 60000);
    return () => clearInterval(msgsPollRef.current);
  }, [selectedEmail, fetchMsgs]);

  // Realtime: instant updates for new messages / conversation list
  useRealtimeChannel(ADMIN_EMAIL, {
    new_message: React.useCallback(() => {
      fetchConvs();
      if (selectedEmail) fetchMsgs(selectedEmail);
    }, [fetchConvs, fetchMsgs, selectedEmail]),
  });

  // ── Latest pending/active course purchase request for this conversation ──────
  const fetchUserCourseReq = React.useCallback(async (email) => {
    if (!email) { setUserCourseReq(null); return; }
    try {
      const data = await fetch(`${API_CHAT}/course-requests`).then(r => r.json());
      if (Array.isArray(data)) {
        const mine = data
          .filter(r => r.user_email === email.toLowerCase() && r.status !== 'rejected')
          .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
        const req = mine[0] || null;
        setUserCourseReq(req);
        setReqAmount(req ? Number(req.amount || 0).toFixed(2) : '');
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchUserCourseReq(selectedEmail);
  }, [selectedEmail, fetchUserCourseReq]);

  async function setPaymentStatus(status) {
    if (!userCourseReq) return;
    setStatusSaving(true);
    try {
      await fetch(`${API_CHAT}/course-requests/${userCourseReq.id}/payment-status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, montant: reqAmount === '' ? null : Number(reqAmount) }),
      });
      await fetchUserCourseReq(selectedEmail);
      await fetchMsgs(selectedEmail);
    } catch {}
    finally { setStatusSaving(false); }
  }

  // ── Latest assigned project (freelancer gains) for this conversation ─────────
  const fetchUserProject = React.useCallback(async (email) => {
    if (!email) { setUserProject(null); return; }
    try {
      const data = await fetch(`${API_CHAT}/projects/assigned/${encodeURIComponent(email)}`).then(r => r.json());
      if (Array.isArray(data)) {
        const mine = data
          .filter(p => p.freelancer_email === email.toLowerCase())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const proj = mine[0] || null;
        setUserProject(proj);
        setProjAmount(proj ? Number(proj.amount || 0).toFixed(2) : '');
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchUserProject(selectedEmail);
  }, [selectedEmail, fetchUserProject]);

  // Freelancer chat actions: Projet terminé / Paiement en attente / Paiement reçu
  async function notifyFreelancerProject(action) {
    if (!userProject) return;
    setProjSaving(true);
    try {
      await fetch(`${API_CHAT}/projects/${userProject.id}/notify`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'freelancer', action, montant: projAmount === '' ? null : Number(projAmount) }),
      });
      await fetchUserProject(selectedEmail);
      await fetchMsgs(selectedEmail);
    } catch {}
    finally { setProjSaving(false); }
  }

  // ── Latest accepted project (client side) for this conversation ──────────────
  const fetchClientProject = React.useCallback(async (email) => {
    if (!email) { setClientProject(null); return; }
    try {
      const data = await fetch(`${API_CHAT}/projects/${encodeURIComponent(email)}`).then(r => r.json());
      if (Array.isArray(data)) {
        const mine = data
          .filter(p => p.status !== 'open')
          .sort((a, b) => new Date(b.accepted_at || b.created_at) - new Date(a.accepted_at || a.created_at));
        const proj = mine[0] || null;
        setClientProject(proj);
        setClientAmount(proj ? Number(proj.amount || 0).toFixed(2) : '');
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchClientProject(selectedEmail);
  }, [selectedEmail, fetchClientProject]);

  // Client chat actions: Projet en cours / Projet terminé / Paiement en attente / Paiement reçu
  async function notifyClientProject(action) {
    if (!clientProject) return;
    setClientSaving(true);
    try {
      await fetch(`${API_CHAT}/projects/${clientProject.id}/notify`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'client', action, montant: clientAmount === '' ? null : Number(clientAmount) }),
      });
      await fetchClientProject(selectedEmail);
      await fetchMsgs(selectedEmail);
    } catch {}
    finally { setClientSaving(false); }
  }

  React.useEffect(() => {
    const box = messagesBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, selectedEmail]);

  React.useEffect(() => {
    const handler = e => {
      if (!e.target.closest('[data-picker]')) setShowPicker(false);
      if (!e.target.closest('[data-menu]'))   setOpenMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStagedImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = '';
  }

  function handleEditImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditStagedImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = '';
  }

  async function editMsg(id, content) {
    if (!content.trim() && !editStagedImage) return;
    let attachmentUrl;
    if (editStagedImage) {
      try {
        const fd = new FormData();
        fd.append('file', editStagedImage.file);
        const r = await fetch(`${API_CHAT}/uploads/image`, { method: 'POST', body: fd });
        const d = await r.json();
        attachmentUrl = d.secure_url;
      } catch { return; }
    }
    const body = { senderEmail: ADMIN_EMAIL, content };
    if (attachmentUrl) body.attachmentUrl = attachmentUrl;
    await fetch(`${API_CHAT}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditingId(null);
    setEditStagedImage(null);
    setOpenMenuId(null);
    fetchMsgs(selectedEmail);
  }

  async function deleteMsg(id) {
    setOpenMenuId(null);
    await fetch(`${API_CHAT}/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail: ADMIN_EMAIL }),
    });
    fetchMsgs(selectedEmail);
    fetchConvs();
  }

  async function sendMsg() {
    if ((!newMsg.trim() && !stagedImage) || !selectedEmail || sending) return;
    setSending(true);
    let attachmentUrl = null;
    if (stagedImage) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', stagedImage.file);
        const r = await fetch(`${API_CHAT}/uploads/image`, { method: 'POST', body: fd });
        const d = await r.json();
        attachmentUrl = d.secure_url || null;
      } catch {}
      setUploading(false);
    }
    const content = newMsg.trim();
    setNewMsg('');
    setStagedImage(null);
    try {
      await fetch(`${API_CHAT}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail: ADMIN_EMAIL, receiverEmail: selectedEmail, content, attachmentUrl }),
      });
      fetchMsgs(selectedEmail);
      fetchConvs();
    } finally { setSending(false); }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(ts) {
    const d = new Date(ts), now = new Date();
    const h = (now - d) / 3600000;
    if (h < 24) return formatTime(ts);
    if (h < 168) return d.toLocaleDateString('fr-TN', { weekday: 'short' });
    return d.toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' });
  }

  const totalUnread   = conversations.reduce((s, c) => s + (Number(c.unread_count) || 0), 0);
  const filteredConvs = conversations.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.user_name?.toLowerCase().includes(q) || c.other_email?.toLowerCase().includes(q) || c.last_message?.toLowerCase().includes(q);
  });
  const selectedConv   = conversations.find(c => c.other_email === selectedEmail);
  const selectedStatus = selectedConv ? chatOnlineStatus(selectedConv.user_last_seen) : null;

  const pickerUsers = (allUsers || []).filter(u =>
    u.email !== ADMIN_EMAIL && (
      !pickerSearch.trim() ||
      u.name?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(pickerSearch.toLowerCase())
    )
  );

  return (
    <div className="flex h-[calc(100vh-210px)] min-h-[520px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

      {/* ── Left: Conversations ──────────────────────────────────────────────── */}
      <div className={`${selectedEmail ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-slate-100 dark:border-slate-800 shrink-0`}>

        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{t('msg.page_title')}</p>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">{ADMIN_TEAM_NAME}</p>
            </div>
            <div className="flex items-center gap-2">
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                  {totalUnread}
                </span>
              )}
              <div data-picker className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setShowPicker(p => !p); setPickerSearch(''); }}
                  className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center text-base font-bold transition-colors"
                  title={t('adm.new_conversation')}
                >+</button>
                {showPicker && (
                  <div className="absolute right-0 top-9 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                      <input
                        autoFocus
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        placeholder={t('msg.search_user')}
                        className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {pickerUsers.slice(0, 20).map(u => (
                        <button key={u.email} onClick={() => { setSelectedEmail(u.email.toLowerCase()); setShowPicker(false); setPickerSearch(''); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors">
                          <ChatAvatar name={u.name} email={u.email} photo={u.photo} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                          </div>
                        </button>
                      ))}
                      {pickerUsers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{t('msg.no_results')}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('adm.chat_search_ph')}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="space-y-px p-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
              <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <p className="text-sm font-semibold">{search ? t('msg.no_results') : t('msg.no_convs')}</p>
              <p className="text-xs mt-1 opacity-60">{search ? t('adm.try_another_term') : t('adm.users_contact_here')}</p>
            </div>
          ) : filteredConvs.map(c => {
            const unread    = Number(c.unread_count) || 0;
            const status    = chatOnlineStatus(c.user_last_seen);
            const isSelected = selectedEmail === c.other_email;
            return (
              <button
                key={c.other_email}
                onClick={() => setSelectedEmail(c.other_email)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150',
                  'border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800',
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-[3px] border-l-indigo-500' : 'border-l-[3px] border-l-transparent',
                ].join(' ')}
              >
                <ChatAvatar name={c.user_name} email={c.other_email} photo={c.user_photo} online={status.online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
                        {c.user_name || c.other_email}
                      </p>
                      {c.user_role && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${c.user_role === 'client' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                          {c.user_role === 'client' ? t('Client') : t('Freelancer')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[11px] truncate ${unread > 0 ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                      {c.sender_email === ADMIN_EMAIL ? t('adm.you_prefix', { msg: c.last_message }) : c.last_message}
                    </p>
                    {unread > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full shrink-0 ml-1">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Chat window ───────────────────────────────────────────────── */}
      {selectedEmail ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button className="md:hidden text-slate-400 hover:text-slate-700 mr-1 shrink-0" onClick={() => setSelectedEmail(null)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <ChatAvatar name={selectedConv?.user_name} email={selectedEmail} photo={selectedConv?.user_photo} online={selectedStatus?.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedConv?.user_name || selectedEmail}</p>
                {selectedConv?.user_role && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedConv.user_role === 'client' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'}`}>
                    {selectedConv.user_role === 'client'
                      ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>Client</span>
                      : <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Freelancer</span>}
                  </span>
                )}
              </div>
              <p className={`text-[11px] font-semibold ${selectedStatus?.online ? 'text-emerald-500' : 'text-slate-400'}`}>{selectedStatus?.text || 'Hors ligne'}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{ADMIN_TEAM_NAME}</p>
                <p className="text-[10px] text-slate-400">{t('adm.admin_account')}</p>
              </div>
            </div>
          </div>

          {/* Course payment status (3 buttons) */}
          {userCourseReq && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                <svg width="11" height="11" className="inline mr-1" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>{userCourseReq.course_title}
              </span>
              <input
                type="number" min="0" step="0.01"
                value={reqAmount}
                onChange={e => setReqAmount(e.target.value)}
                placeholder={t('adm.amount_tnd')}
                className="w-24 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              {[
                { id: 'en_attente', label: <span className="flex items-center gap-1"><svg width="8" height="8" viewBox="0 0 8 8" fill="var(--fm-warning)"><circle cx="4" cy="4" r="4"/></svg>{t('admin.pending')}</span>, active: 'bg-amber-500 border-amber-500 text-white',     idle: 'hover:border-amber-400' },
                { id: 'en_cours',   label: <span className="flex items-center gap-1"><svg width="8" height="8" viewBox="0 0 8 8" fill="var(--fm-info)"><circle cx="4" cy="4" r="4"/></svg>{t('fd.status.in_progress')}</span>,   active: 'bg-sky-500 border-sky-500 text-white',         idle: 'hover:border-sky-400' },
                { id: 'termine',    label: <span className="flex items-center gap-1"><svg width="8" height="8" viewBox="0 0 8 8" fill="var(--fm-success)"><circle cx="4" cy="4" r="4"/></svg>{t('fd.status.completed')}</span>,    active: 'bg-emerald-500 border-emerald-500 text-white', idle: 'hover:border-emerald-400' },
              ].map(s => {
                const active = userCourseReq.payment_status === s.id;
                return (
                  <button key={s.id} disabled={statusSaving} onClick={() => setPaymentStatus(s.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                      active
                        ? s.active
                        : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${s.idle}`
                    }`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Freelancer gains status (3 buttons) */}
          {userProject && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                <svg width="11" height="11" className="inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>{userProject.title}
              </span>
              <input
                type="number" min="0" step="0.01"
                value={projAmount}
                onChange={e => setProjAmount(e.target.value)}
                placeholder={t('adm.amount_tnd')}
                className="w-24 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              {[
                { id: 'completed',        action: 'completed',        label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('adm.project_completed')}</span>,    active: 'bg-emerald-500 border-emerald-500 text-white', idle: 'hover:border-emerald-400', isActive: () => userProject.status === 'completed' },
                { id: 'payment_pending',  action: 'payment_pending',  label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t('adm.payment_pending')}</span>, active: 'bg-amber-500 border-amber-500 text-white',     idle: 'hover:border-amber-400',  isActive: () => userProject.payment_status === 'en_attente' },
                { id: 'payment_received', action: 'payment_received', label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('adm.payment_received')}</span>,      active: 'bg-emerald-500 border-emerald-500 text-white', idle: 'hover:border-emerald-400', isActive: () => userProject.payment_status === 'recu' },
              ].map(s => {
                const active = s.isActive();
                return (
                  <button key={s.id} disabled={projSaving} onClick={() => notifyFreelancerProject(s.action)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                      active
                        ? s.active
                        : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${s.idle}`
                    }`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Client project status (4 buttons) */}
          {clientProject && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                <svg width="11" height="11" className="inline mr-1" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>{clientProject.title}
              </span>
              <input
                type="number" min="0" step="0.01"
                value={clientAmount}
                onChange={e => setClientAmount(e.target.value)}
                placeholder={t('adm.amount_tnd')}
                className="w-24 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              {[
                { id: 'in_progress',      action: 'in_progress',      label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t('adm.project_in_progress')}</span>,    active: 'bg-sky-500 border-sky-500 text-white',         idle: 'hover:border-sky-400',    isActive: () => clientProject.status === 'in_progress' },
                { id: 'completed',        action: 'completed',        label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('adm.project_completed')}</span>,     active: 'bg-emerald-500 border-emerald-500 text-white', idle: 'hover:border-emerald-400', isActive: () => clientProject.status === 'completed' },
                { id: 'payment_pending',  action: 'payment_pending',  label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t('adm.payment_pending')}</span>, active: 'bg-amber-500 border-amber-500 text-white',     idle: 'hover:border-amber-400',  isActive: () => clientProject.payment_status === 'en_attente' },
                { id: 'payment_received', action: 'payment_received', label: <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('adm.payment_received')}</span>,      active: 'bg-emerald-500 border-emerald-500 text-white', idle: 'hover:border-emerald-400', isActive: () => clientProject.payment_status === 'recu' },
              ].map(s => {
                const active = s.isActive();
                return (
                  <button key={s.id} disabled={clientSaving} onClick={() => notifyClientProject(s.action)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                      active
                        ? s.active
                        : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${s.idle}`
                    }`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div ref={messagesBoxRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <p className="text-sm font-semibold">{t('msg.start_chat')}</p>
                <p className="text-xs mt-1 opacity-60">{t('adm.reply_as', { team: ADMIN_TEAM_NAME })}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {messages.map((m, idx) => {
                  const isMine  = m.sender_email === ADMIN_EMAIL;
                  const prev    = messages[idx - 1];
                  const next    = messages[idx + 1];
                  const samePrev = prev?.sender_email === m.sender_email && (new Date(m.created_at) - new Date(prev.created_at)) < 120000;
                  const sameNext = next?.sender_email === m.sender_email && (new Date(next.created_at) - new Date(m.created_at)) < 120000;
                  const isFirst = !samePrev;
                  const isLast  = !sameNext;
                  const bubbleR = isMine
                    ? `rounded-2xl ${isFirst ? 'rounded-tr-md' : ''} ${isLast ? 'rounded-br-md' : ''}`
                    : `rounded-2xl ${isFirst ? 'rounded-tl-md' : ''} ${isLast ? 'rounded-bl-md' : ''}`;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>
                      {!isMine && (
                        <div className={`mr-2 self-end mb-1 ${!isLast ? 'opacity-0 pointer-events-none' : ''}`}>
                          <ChatAvatar name={selectedConv?.user_name} email={selectedEmail} photo={selectedConv?.user_photo} size="sm" />
                        </div>
                      )}
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[72%]`}>
                        {isFirst && (
                          <p className="text-[10px] font-bold mb-0.5 px-1 text-slate-400">
                            {isMine ? ADMIN_TEAM_NAME : (selectedConv?.user_name || selectedEmail)}
                          </p>
                        )}

                        {editingId === m.id ? (
                          <div className="w-full max-w-xs space-y-2">
                            {(m.attachment_url || editStagedImage) && (
                              <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                <img src={editStagedImage?.previewUrl || m.attachment_url} alt="photo" className={`h-14 w-14 rounded-lg object-cover shrink-0 ${editStagedImage ? 'ring-2 ring-indigo-400' : 'opacity-60'}`} />
                                <div className="min-w-0">
                                  <button onClick={() => editFileInputRef.current?.click()} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block">{t('adm.replace')}</button>
                                  {editStagedImage && <button onClick={() => setEditStagedImage(null)} className="text-xs text-slate-400 hover:text-rose-500 mt-0.5 block">{t('adm.cancel_x')}</button>}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-1.5 items-center">
                              <input
                                autoFocus={!m.attachment_url}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') editMsg(m.id, editText);
                                  if (e.key === 'Escape') { setEditingId(null); setEditStagedImage(null); setOpenMenuId(null); }
                                }}
                                placeholder={m.attachment_url ? t('adm.caption') : undefined}
                                className="flex-1 text-sm rounded-xl border-2 border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none min-w-0"
                              />
                              <button onClick={() => editMsg(m.id, editText)} className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              </button>
                              <button onClick={() => { setEditingId(null); setEditStagedImage(null); setOpenMenuId(null); }} className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={isMine ? (e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                              setOpenMenuId(openMenuId === m.id ? null : m.id);
                              setEditingId(null);
                            }) : undefined}
                            className={`text-sm shadow-sm ${m.attachment_url && !m.content ? 'p-1' : 'px-3.5 py-2.5'} ${bubbleR} ${
                              isMine ? 'bg-indigo-600 text-white cursor-pointer' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700'
                            } ${openMenuId === m.id ? 'ring-2 ring-indigo-300 dark:ring-indigo-700' : ''}`}
                          >
                            {m.attachment_url && (
                              <img
                                src={m.attachment_url}
                                alt="Photo"
                                className={`max-w-[260px] w-full object-cover rounded-xl block cursor-pointer ${m.content ? 'mb-2' : ''}`}
                                onClick={e => { e.stopPropagation(); window.open(m.attachment_url, '_blank'); }}
                              />
                            )}
                            {m.content && <span className="break-words leading-relaxed whitespace-pre-wrap">{m.content}</span>}
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          {m.edited_at && <span className="text-[10px] text-slate-400 italic">{t('adm.edited')}</span>}
                          <span className="text-[10px] text-slate-400 tabular-nums">{formatTime(m.edited_at || m.created_at)}</span>
                          {isMine && isLast && (
                            m.is_read
                              ? <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 10" fill="none"><path d="M1 5l3.5 3.5L12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5l3.5 3.5L18 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 14 10" fill="none"><path d="M1 5l3.5 3.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed context menu — outside scroll container so it's never clipped */}
          {openMenuId && (() => {
            const activeMsg = messages.find(msg => msg.id === openMenuId);
            if (!activeMsg) return null;
            const canDelete = (Date.now() - new Date(activeMsg.created_at).getTime()) < 3600000;
            return (
              <div
                data-menu
                className="fixed z-50 flex flex-col gap-0.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden min-w-[160px]"
                style={{ top: menuPos.top, right: menuPos.right }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setEditingId(openMenuId); setEditText(activeMsg.content || ''); setOpenMenuId(null); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors text-left"
                >
                  {t('adm.edit_msg')}
                </button>
                {canDelete && (
                  <button
                    onClick={() => { deleteMsg(openMenuId); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left"
                  >
                    {t('adm.delete_msg')}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {stagedImage && (
              <div className="px-4 pt-2.5 flex items-start gap-2">
                <div className="relative">
                  <img src={stagedImage.previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => setStagedImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t('adm.add_caption')}</p>
              </div>
            )}
            <div className="flex gap-2 items-center px-4 py-3">
              <input ref={fileInputRef}     type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 transition-colors shrink-0 disabled:opacity-40"
                title={t('adm.send_photo')}
              >
                <svg style={{width:'18px',height:'18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder={t('adm.reply_as_ph', { team: ADMIN_TEAM_NAME })}
                className="flex-1 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                onClick={sendMsg}
                disabled={(!newMsg.trim() && !stagedImage) || sending || uploading}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-all shrink-0 shadow-sm shadow-indigo-500/30 active:scale-95"
              >
                {uploading
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{ADMIN_TEAM_NAME}</p>
            <p className="text-sm">{t('msg.select_conv')}</p>
            <p className="text-xs mt-1 opacity-60">{t('msg.select_conv_sub')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Gains Tab ──────────────────────────────────────────────────────────

function AdminGainsTab({ API }) {
  const { t } = useTranslation();
  const [commissions, setCommissions] = React.useState([]);
  const [platform,    setPlatform]    = React.useState(null);
  const [loading,     setLoading]     = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [comm, plat] = await Promise.all([
        fetch(`${API}/wallets/commissions`).then(r => r.json()),
        fetch(`${API}/wallets/platform`).then(r => r.json()),
      ]);
      if (Array.isArray(comm)) setCommissions(comm);
      if (plat) setPlatform(plat);
    } catch {}
    setLoading(false);
  }, [API]);

  React.useEffect(() => { load(); }, [load]);

  const totalCommission = commissions.reduce((s, c) => s + Number(c.commission_amount || 0), 0);

  const TYPE_INFO = {
    freelancer: { label: t('adm.type_freelance_project'), icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    course:     { label: t('adm.type_course_sale'),   icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-50 dark:bg-sky-900/20' },
    combined:   { label: t('adm.type_combined') || 'Cours + Freelance', icon: <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{t('adm.platform_gains')}</h2>
        <button onClick={load} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors">{t('adm.refresh')}</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 flex items-center gap-3">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><line x1="12" y1="8" x2="12" y2="12"/><path d="M15 9.5A3.5 3.5 0 008.5 12c0 3 3.5 5 3.5 5s3.5-2 3.5-5A3.5 3.5 0 0015 9.5z"/></svg>
          <div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{Number(platform?.total_collected || 0).toFixed(2)} TND</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('adm.total_collected')}</p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 flex items-center gap-3">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <div>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{commissions.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('fd.transactions')}</p>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('adm.commissions_history')}</p>
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-400">{t('fd.loading')}</div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-8">
            <svg width="36" height="36" className="mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <p className="text-sm text-slate-400">{t('adm.no_commission')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commissions.map(c => {
              const info = TYPE_INFO[c.payment_type] || TYPE_INFO.freelancer;
              const dateStr = new Date(c.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });
              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${info.bg} flex items-center justify-center text-lg shrink-0`}>{info.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.description || info.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(c.payment_type === 'freelancer' || c.payment_type === 'combined')
                            ? <>{t('adm.client_label')} <span className="font-semibold text-slate-600 dark:text-slate-300">{c.payer_name || '—'}</span>{c.payer_email && <span className="text-slate-400"> ({c.payer_email})</span>} → {t('adm.freelance_label')} <span className="font-semibold text-slate-600 dark:text-slate-300">{c.freelancer_name || '—'}</span>{c.freelancer_email && <span className="text-slate-400"> ({c.freelancer_email})</span>}</>
                            : <>{t('adm.buyer_label')} <span className="font-semibold text-slate-600 dark:text-slate-300">{c.payer_name || '—'}</span>{c.payer_email && <span className="text-slate-400"> ({c.payer_email})</span>}</>
                          }
                        </p>
                        <p className="text-xs text-slate-400">{dateStr}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">{t('adm.total_amount')}</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{Number(c.gross_amount).toFixed(2)} TND</p>
                      <p className="text-xs text-slate-400 mt-1">{t('adm.our_commission')}</p>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">+{Number(c.commission_amount).toFixed(2)} TND</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex justify-between items-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('adm.total_earned_tx', { count: commissions.length })}</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">+{totalCommission.toFixed(2)} TND</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, users, accountsLoaded, updateUser, logout, getAdminNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications, fetchAccounts, fetchNotifications } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchNotifications();
    // fetchAccounts() is intentionally NOT called here: it's already called by
    // AuthContext after refreshAccessToken() completes, guaranteeing the admin
    // token is ready before hitting /users. Calling it here (without token) would
    // race and potentially overwrite correct data with the public /users/public list.
    //
    // This used to poll every 60s unconditionally, which meant a single admin
    // tab left open drove ~1,440 full reads of the users table per day — and
    // because the server-side cache TTL is also 60s, nearly every poll missed
    // the cache and hit Neon. It kept the database awake around the clock.
    // Now: 5-minute interval, skipped entirely while the tab is hidden, and
    // refreshed immediately when the admin comes back so nothing looks stale.
    const POLL_MS = 5 * 60 * 1000;
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      fetchAccounts();
      fetchNotifications();
    };
    const pollId = setInterval(poll, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // ── main tab: "cin" | "allusers" | "courses" ──
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatWith = searchParams.get("with") || null;
  const [mainTab,      setMainTab]      = useState(searchParams.get("tab") || "cin");
  const [chatFullscreen, setChatFullscreen] = useState(false);
  useBodyScrollLock(chatFullscreen);
  const [tabDismissed, setTabDismissed] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_tab_dismissed');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [filter,       setFilter]       = useState("pending");
  const [search,       setSearch]       = useState("");
  // "Tous les utilisateurs" drill-down: initial -> pick a role -> filtered list.
  const [allUsersStep, setAllUsersStep] = useState("initial"); // "initial" | "choice" | "list"
  const [allUsersRole, setAllUsersRole] = useState(null);      // "client" | "freelancer"
  const [viewing,      setViewing]      = useState(null);
  const [rejecting,    setRejecting]    = useState(null);
  const [approving,    setApproving]    = useState(null);
  const [justActed,    setJustActed]    = useState({});
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [logoutConfirm,setLogoutConfirm]= useState(false);

  // ── courses tab state — init from localStorage so counts show on first render ──
  const [allCourses, setAllCourses] = useState(() => {
    try {
      const raw = localStorage.getItem('admin_courses_cache');
      if (raw) { const { data } = JSON.parse(raw); if (Array.isArray(data) && data.length > 0) return data; }
    } catch {}
    return [];
  });
  const [coursesLoading,  setCoursesLoading]  = useState(false);

  // ── paid course access tab state ──
  const [paidCourses,         setPaidCourses]         = useState([]);
  const [paidCoursesLoading,  setPaidCoursesLoading]  = useState(false);
  const [accessModal,         setAccessModal]         = useState(null);   // { course, lessons, students }

  // ── announcements tab state ──
  const [announcements,        setAnnouncements]        = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [annTargetPage,        setAnnTargetPage]        = useState('home');
  const [annMessage,           setAnnMessage]           = useState('');
  const [annEditingId,         setAnnEditingId]         = useState(null);
  const [annSaving,            setAnnSaving]            = useState(false);
  const [annDeleteConfirm,     setAnnDeleteConfirm]     = useState(null); // id pending delete confirmation

  // ── admin "Projects" tab state ──
  const [adminProjects,        setAdminProjects]        = useState([]);
  const [adminProjectsLoading, setAdminProjectsLoading] = useState(false);
  const [accessModalLoading,  setAccessModalLoading]  = useState(false);
  const [watchLesson,         setWatchLesson]         = useState(null);   // lesson object with video_url
  const [grantEmail,          setGrantEmail]          = useState('');
  const [grantLoading,        setGrantLoading]        = useState(false);
  const [grantMsg,            setGrantMsg]            = useState(null);
  const [grantIsError,        setGrantIsError]        = useState(false);
  const [revokeLoading,       setRevokeLoading]       = useState({});
  const [revokeConfirm,       setRevokeConfirm]       = useState(null);
  const [searchEmail,         setSearchEmail]         = useState('');
  const [searchDropdown,      setSearchDropdown]      = useState([]);
  const [searchSelected,      setSearchSelected]      = useState(false);
  const [searchSelectedUser,  setSearchSelectedUser]  = useState(null);
  const [pendingCourseId,     setPendingCourseId]     = useState(null);

  // ── course access requests tab state ──
  const [accessRequests,      setAccessRequests]      = useState([]);
  const [requestsLoading,     setRequestsLoading]     = useState(false);
  const [requestsFilter,      setRequestsFilter]      = useState('pending');
  const [requestActing,       setRequestActing]       = useState({});
  const [rejectModal,         setRejectModal]         = useState(null);
  const [rejectNote,          setRejectNote]          = useState('');

  // ── chat tab state ──
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // ── lessons tab state ──
  const [allLessons,      setAllLessons]      = useState([]);
  const [lessonsTabLoad,  setLessonsTabLoad]  = useState(false);
  const [lessonActing,    setLessonActing]    = useState({});
  const [lessonRejectId,  setLessonRejectId]  = useState(null);
  const [lessonApproveId, setLessonApproveId] = useState(null);
  const [lessonNote,      setLessonNote]      = useState('');
  const [lessonApproveNote, setLessonApproveNote] = useState('');
  const [courseFilter,    setCourseFilter]    = useState("pending");
  const [courseActing,    setCourseActing]    = useState({});
  const [courseRejectId,  setCourseRejectId]  = useState(null);
  const [courseApproveId, setCourseApproveId] = useState(null);
  const [courseNote,      setCourseNote]      = useState("");
  const [expandedCourse,  setExpandedCourse]  = useState(null);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [lessonsLoading,  setLessonsLoading]  = useState(false);

  useBodyScrollLock(!!(
    logoutConfirm || accessModal || revokeConfirm ||
    lessonRejectId || lessonApproveId || courseRejectId || courseApproveId
  ));

  const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

  // Sync tab from URL when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setMainTab(tab);
  }, [searchParams]);

  // Auto-open specific course modal when paidCourses loads after notification click
  useEffect(() => {
    if (pendingCourseId && paidCourses.length > 0) {
      const course = paidCourses.find(c => String(c.id) === String(pendingCourseId));
      if (course) { openAccessModal(course); setPendingCourseId(null); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidCourses, pendingCourseId]);

  // Comprehensive admin notification navigation — handles all notification kinds
  function handleAdminNotifClick(n) {
    markNotificationRead(n.id);
    setNotifOpen(false);
    const kind = n.kind || '';

    // course_access_granted:courseId → open exact course modal
    if (kind.startsWith('course_access_granted')) {
      const courseId = kind.includes(':') ? kind.split(':')[1] : null;
      setMainTab('paidaccess');
      navigate('/admin/dashboard?tab=paidaccess');
      if (courseId) {
        const found = paidCourses.find(c => String(c.id) === String(courseId));
        if (found) openAccessModal(found);
        else { fetchPaidCourses(); setPendingCourseId(courseId); }
      }
      return;
    }

    // lesson_pending_${lessonId} → lessons tab
    if (kind.startsWith('lesson_pending')) {
      setMainTab('lessons'); navigate('/admin/dashboard?tab=lessons'); return;
    }

    // course_request:courseId → requests tab
    if (kind.startsWith('course_request')) {
      setMainTab('requests'); navigate('/admin/dashboard?tab=requests');
      fetchAccessRequests();
      return;
    }

    // course_pending → courses tab
    if (kind.startsWith('course_pending') || kind.startsWith('course_upload')) {
      setMainTab('courses'); navigate('/admin/dashboard?tab=courses'); return;
    }

    // new_submission / CIN-related → cin tab
    if (kind.startsWith('new_submission') || kind.startsWith('new_user')) {
      setMainTab('cin'); navigate('/admin/dashboard?tab=cin'); return;
    }

    // Default → cin tab
    setMainTab('cin'); navigate('/admin/dashboard?tab=cin');
  }

  const fetchCourses = async () => {
    const CACHE_KEY = 'admin_courses_cache';
    let hasCachedData = false;

    // 1. Show cached data INSTANTLY — zero wait for returning visitors
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data } = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          setAllCourses(data);
          setCoursesLoading(false);
          hasCachedData = true;
        }
      }
    } catch {}

    // No cache to show instantly — surface a real loading state instead of
    // silently rendering "0 courses" for up to 35s on a fresh device/browser.
    if (!hasCachedData) setCoursesLoading(true);

    // 2. Fetch fresh data — 35s timeout covers Render's 27s cold-start wake-up
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 35000);
      const res   = await fetch(`${API}/courses/pending`, { signal: ctrl.signal });
      clearTimeout(timer);
      const d = await res.json();
      if (Array.isArray(d)) {
        setAllCourses(d);
        setCoursesLoading(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() }));
      }
    } catch {
      setCoursesLoading(false);
    }
  };

  const fetchAccessRequests = async () => {
    setRequestsLoading(true);
    try {
      const r = await fetch(`${API}/course-requests`);
      const d = await r.json();
      if (Array.isArray(d)) setAccessRequests(d);
    } catch {}
    setRequestsLoading(false);
  };

  const approveRequest = async (req) => {
    setRequestActing(p => ({ ...p, [req.id]: 'approving' }));
    try {
      await fetch(`${API}/course-requests/${req.id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_note: '' }) });
      fetchAccessRequests();
      fetchNotifications();
    } catch {}
    setRequestActing(p => { const n = { ...p }; delete n[req.id]; return n; });
  };

  const rejectRequest = async (id, note) => {
    setRequestActing(p => ({ ...p, [id]: 'rejecting' }));
    try {
      await fetch(`${API}/course-requests/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_note: note }) });
      fetchAccessRequests();
      fetchNotifications();
    } catch {}
    setRequestActing(p => { const n = { ...p }; delete n[id]; return n; });
    setRejectModal(null); setRejectNote('');
  };

  // ── Announcements ──
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const r = await fetch(`${API}/announcements/admin`);
      const d = await r.json();
      if (Array.isArray(d)) setAnnouncements(d);
    } catch {}
    setAnnouncementsLoading(false);
  };

  const resetAnnForm = () => {
    setAnnEditingId(null);
    setAnnTargetPage('home');
    setAnnMessage('');
  };

  const startEditAnnouncement = (a) => {
    setAnnEditingId(a.id);
    setAnnTargetPage(a.target_page);
    setAnnMessage(a.message);
  };

  const publishAnnouncement = async () => {
    if (!annMessage.trim()) return;
    setAnnSaving(true);
    try {
      const url = annEditingId ? `${API}/announcements/${annEditingId}` : `${API}/announcements/`;
      const method = annEditingId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_page: annTargetPage, message: annMessage.trim() }),
      });
      if (r.ok) {
        resetAnnForm();
        await fetchAnnouncements();
      }
    } catch {}
    setAnnSaving(false);
  };

  const deleteAnnouncement = async (id) => {
    try {
      const r = await fetch(`${API}/announcements/${id}`, { method: 'DELETE' });
      if (r.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        if (annEditingId === id) resetAnnForm();
      }
    } catch {}
    setAnnDeleteConfirm(null);
  };

  const fetchPaidCourses = async () => {
    setPaidCoursesLoading(true);
    try {
      const r = await fetch(`${API}/admin-course-access/paid-courses?admin_email=${encodeURIComponent(user?.email || '')}`);
      const d = await r.json();
      if (Array.isArray(d)) setPaidCourses(d);
    } catch {}
    setPaidCoursesLoading(false);
  };

  const openAccessModal = async (course) => {
    setAccessModal({ course, lessons: [], students: [] });
    setAccessModalLoading(true);
    setWatchLesson(null);
    setGrantMsg(null);
    setGrantIsError(false);
    setSearchEmail('');
    setSearchDropdown([]);
    setSearchSelected(false);
    setSearchSelectedUser(null);
    try {
      const [detailRes, studRes] = await Promise.all([
        fetch(`${API}/admin-course-access/paid-courses/${course.id}?admin_email=${encodeURIComponent(user?.email || '')}`),
        fetch(`${API}/admin-course-access/paid-courses/${course.id}/students?admin_email=${encodeURIComponent(user?.email || '')}`),
      ]);
      const detail  = await detailRes.json();
      const students = await studRes.json();
      setAccessModal({ course: detail.course || course, lessons: detail.lessons || [], students: Array.isArray(students) ? students : [] });
    } catch {}
    setAccessModalLoading(false);
  };

  const grantAccess = async () => {
    if (!searchEmail.trim() || !accessModal) return;
    setGrantLoading(true);
    setGrantMsg(null);
    setGrantIsError(false);
    try {
      const r = await fetch(`${API}/admin-course-access/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: user?.email, buyer_email: searchEmail.trim(), course_id: accessModal.course.id }),
      });
      const d = await r.json();
      if (d.success) {
        if (d.already_granted) {
          setGrantMsg('Accès déjà accordé.');
          setGrantIsError(false);
        } else {
          setSearchEmail('');
          setSearchSelected(false);
          setSearchDropdown([]);
          setSearchSelectedUser(null);
          setGrantMsg('Paid course access granted successfully.');
          setGrantIsError(false);
          fetchNotifications();
          openAccessModal(accessModal.course);
        }
      } else {
        setGrantMsg(d.error || 'Erreur');
        setGrantIsError(true);
      }
    } catch {
      setGrantMsg('Erreur réseau');
      setGrantIsError(true);
    }
    setGrantLoading(false);
  };

  const revokeAccess = async (purchase) => {
    const pid = purchase.id;
    setRevokeLoading(p => ({ ...p, [pid]: true }));
    try {
      await fetch(`${API}/admin-course-access/revoke`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: user?.email, buyer_email: purchase.buyer_email, course_id: accessModal.course.id, lesson_id: purchase.lesson_id || undefined }),
      });
      setRevokeLoading(p => { const n = { ...p }; delete n[pid]; return n; });
      openAccessModal(accessModal.course);
    } catch {
      setRevokeLoading(p => { const n = { ...p }; delete n[pid]; return n; });
    }
  };

  const fetchLessonsTab = async () => {
    setLessonsTabLoad(true);
    try {
      const r = await fetch(`${API}/lessons/pending`);
      const d = await r.json();
      if (Array.isArray(d)) setAllLessons(d);
    } catch {}
    setLessonsTabLoad(false);
  };

  async function approveLesson(id, note) {
    setLessonActing(p => ({ ...p, [id]: 'approved' }));
    await fetch(`${API}/lessons/${id}/approve`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note || '' }),
    });
    setLessonApproveId(null); setLessonApproveNote('');
    fetchLessonsTab();
    setTimeout(() => setLessonActing(p => { const n = { ...p }; delete n[id]; return n; }), 1800);
  }

  async function rejectLesson(id, note) {
    setLessonActing(p => ({ ...p, [id]: 'rejected' }));
    await fetch(`${API}/lessons/${id}/reject`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note }),
    });
    setLessonRejectId(null); setLessonNote('');
    fetchLessonsTab();
    setTimeout(() => setLessonActing(p => { const n = { ...p }; delete n[id]; return n; }), 1800);
  }

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

  // Fetch courses on mount AND on tab switch — badge always ready
  useEffect(() => { fetchCourses(); fetchLessonsTab(); }, []);
  useEffect(() => { if (mainTab === 'courses') fetchCourses(); }, [mainTab]);
  useEffect(() => { if (mainTab === 'lessons') fetchLessonsTab(); }, [mainTab]);
  useEffect(() => { if (mainTab === 'paidaccess') fetchPaidCourses(); }, [mainTab]);
  useEffect(() => { if (mainTab === 'announcements') fetchAnnouncements(); }, [mainTab]);
  useEffect(() => { if (mainTab !== 'chat') setChatFullscreen(false); }, [mainTab]);

  // ── Admin "Projects" tab — accepted/assigned client↔freelancer projects ──────
  const fetchAdminProjects = React.useCallback(async () => {
    setAdminProjectsLoading(true);
    try {
      const r = await fetch(`${API}/projects/admin/all`);
      const d = await r.json();
      if (Array.isArray(d)) setAdminProjects(d);
    } catch {}
    setAdminProjectsLoading(false);
  }, [API]);
  useEffect(() => { if (mainTab === 'projects') fetchAdminProjects(); }, [mainTab, fetchAdminProjects]);

  // Chat unread badge — visible even when not on the chat tab. Previously
  // polled every 10s unconditionally (the single most aggressive query in
  // the app, ~8,600 requests/day if the dashboard stays open). Now
  // event-driven: refetches immediately on a real-time 'new_message', with
  // a slow 2-minute poll only as a self-healing fallback in case a socket
  // event is ever missed (e.g. brief disconnect).
  const fetchChatUnread = React.useCallback(async () => {
    try {
      const data = await fetch(`${API}/messages/admin/conversations`).then(r => r.json());
      if (Array.isArray(data)) setChatUnreadCount(data.reduce((s, c) => s + (Number(c.unread_count) || 0), 0));
    } catch {}
  }, [API]);

  useEffect(() => {
    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchChatUnread]);

  useRealtimeChannel(ADMIN_EMAIL, {
    new_message: fetchChatUnread,
  });

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

  // Clients don't submit a CIN document, but admin still approves/rejects
  // their account here same as freelancers — the review UI just won't have
  // a document image to show for them.
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

  async function handleApprove(user) {
    if (user._resetOnly) {
      const result = await updateUser(user.email, { cinStatus: "pending", cinRejectionReason: null, cinApprovalReason: null });
      if (result?.error) alert(`Échec de la réinitialisation de ${user.name} : ${result.error}. Réessayez.`);
      return;
    }
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

  async function handleReject(user, reason) {
    setRejecting(null);
    const result = await updateUser(user.email, { cinStatus: "rejected", cinRejectionReason: reason, cinApprovalReason: null });
    if (result?.error) {
      alert(`Échec du refus de ${user.name} : ${result.error}. Réessayez.`);
      return;
    }
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
                <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{t('adm.dashboard_title')}</p>
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
              <span className="hidden sm:inline">{t('Log out')}</span>
            </button>
          </div>
        </div>

        {/* ── MAIN TABS GRID — always 2 per row ── */}
        {(() => {
          const TABS = [
            { id: "cin",        color: "#f59e0b", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: t("admin.tab.cin"),        count: counts.pending },
            { id: "allusers",   color: "#3b82f6", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, label: t("admin.tab.all_users"), count: (users ?? []).length },
            { id: "courses",    color: "#8b5cf6", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, label: t('Courses'),            count: courseCounts.all },
            { id: "lessons",    color: "#06b6d4", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, label: t('fd.lessons'),           count: allLessons.filter(l => l.status === 'pending').length },
            { id: "paidaccess", color: "#10b981", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: t('adm.tab_paid_access'),  count: paidCourses.length },
            { id: "chat",       color: "#ec4899", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, label: t('adm.tab_chat'),             count: chatUnreadCount },
            { id: "projects",   color: "#f97316", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, label: t('adm.tab_projects'),       count: adminProjects.length },
            { id: "gains",      color: "#22c55e", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>, label: t('nav.gains'),            count: 0 },
            { id: "announcements", color: "#eab308", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>, label: "Annonces", count: 0 },
            { id: "publicite",  color: "#d946ef", icon: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, label: "Publicité", count: 0 },
          ];
          return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {TABS.map(tab => {
                  const active  = mainTab === tab.id;
                  // Badge shows only DELTA: new items added since admin last visited that tab
                  const seenCnt = tabDismissed[tab.id] ?? 0;
                  const delta = tab.count - seenCnt;
                  const showBadge = delta > 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMainTab(tab.id);
                        setTabDismissed(p => {
                          const next = { ...p, [tab.id]: tab.count };
                          try { localStorage.setItem('admin_tab_dismissed', JSON.stringify(next)); } catch {}
                          return next;
                        });
                      }}
                      className={[
                        "relative flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 rounded-xl border transition-all duration-200 text-left w-full",
                        active
                          ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700",
                      ].join(" ")}
                    >
                      <span className={`flex items-center gap-1.5 text-xs font-bold truncate ${active ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                        <span style={{ color: active ? '#fff' : tab.color, display:'flex', flexShrink:0 }}>{tab.icon}</span>
                        {tab.label}
                      </span>
                      {showBadge && (
                        <span className={`shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-extrabold leading-none ${
                          active ? "bg-white/30 text-white" : "bg-rose-500 text-white"
                        }`}>
                          {delta > 99 ? "99+" : delta}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
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
                  <p className={`text-2xl font-extrabold ${s.color}`}>{!accountsLoaded && s.value === 0 ? '…' : s.value}</p>
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
                    <span style={{ fontSize:10, fontWeight:800, borderRadius:99, padding:'2px 7px', lineHeight:1, background:'#ef4444', color:'#fff', boxShadow:'0 0 6px rgba(239,68,68,0.5)' }}>{counts[f.id]}</span>
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

        {/* ══ ALL USERS TAB — Voir liste -> pick Client/Freelancer -> filtered list ══ */}
        {mainTab === "allusers" && (
          <>
            {allUsersStep === "initial" && (
              <div className="flex items-center justify-center py-16">
                <button
                  onClick={() => setAllUsersStep("choice")}
                  className="px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow"
                >
                  {t("admin.view_list")}
                </button>
              </div>
            )}

            {allUsersStep === "choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <button
                  onClick={() => { setAllUsersRole("client"); setAllUsersStep("list"); }}
                  className="text-left rounded-2xl border p-6 transition-all hover:-translate-y-0.5 bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                    </span>
                    <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                      {!accountsLoaded ? '…' : (users ?? []).filter(u => u.role === "client").length}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{t("admin.clients")}</p>
                </button>

                <button
                  onClick={() => { setAllUsersRole("freelancer"); setAllUsersStep("list"); }}
                  className="text-left rounded-2xl border p-6 transition-all hover:-translate-y-0.5 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </span>
                    <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {!accountsLoaded ? '…' : (users ?? []).filter(u => u.role === "freelancer").length}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{t("admin.freelancers")}</p>
                </button>
              </div>
            )}

            {allUsersStep === "list" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { setAllUsersStep("choice"); setSearch(""); }}
                    aria-label={t("Back")}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                  </button>
                  <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    {allUsersRole === "client" ? t("admin.clients") : t("admin.freelancers")}
                  </p>
                  <button
                    onClick={() => { setAllUsersStep("initial"); setAllUsersRole(null); setSearch(""); }}
                    aria-label={t("Close")}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    type="text"
                    placeholder={t("admin.search_placeholder")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <AllUsersTable allUsers={(users ?? []).filter(u => u.role === allUsersRole)} search={search} loading={!accountsLoaded} />
              </>
            )}
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
                { label: t('admin.total'),    value: courseCounts.all,      color: 'text-slate-700 dark:text-slate-200',     bg: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' },
                { label: t('admin.pending'), value: courseCounts.pending, color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900' },
                { label: t('admin.approved'), value: courseCounts.approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900' },
                { label: t('admin.rejected'),  value: courseCounts.rejected, color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
              {[['pending',t('admin.pending')],['approved',t('admin.approved')],['rejected',t('admin.rejected')],['all',t('admin.filter.all')]].map(([id, label]) => (
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
                <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, opacity: 0.5 }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                </div>
                <p className="text-sm font-semibold">{t('adm.no_courses_category')}</p>
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
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('adm.new_course_validate')}</p>
                        </div>
                      )}

                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 shrink-0 flex items-center justify-center text-2xl">
                            {course.thumbnail_url
                              ? <img src={cldImg(course.thumbnail_url)} alt="" className="w-full h-full object-cover" />
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
                                {course.status === 'approved'
                                  ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('admin.status.approved')}</span>
                                  : course.status === 'rejected'
                                  ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{t('admin.status.rejected')}</span>
                                  : <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t('admin.status.pending')}</span>}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('cc.by_label')} <span className="font-semibold text-slate-700 dark:text-slate-300">{course.instructor_name || '—'}</span>{course.creator_email && <span className="text-slate-400"> · {course.creator_email}</span>}</p>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>{course.category}</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>{Number(course.full_price) === 0 ? t('cdp.free') : `${Number(course.full_price).toFixed(2)} TND`}</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{new Date(course.created_at).toLocaleDateString('fr-TN')}</span>
                            </div>

                            {course.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{course.description}</p>
                            )}

                            {course.admin_note && !isPending && (
                              <div className={`flex items-start gap-2 p-2.5 rounded-xl mb-3 ${course.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'}`}>
                                <p className={`text-xs font-semibold ${course.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                  {course.admin_note}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap items-center">
                              {isPending && (<>
                                <button onClick={() => { setCourseApproveId(course.id); setCourseNote(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  {t('admin.card.approve')}
                                </button>
                                <button onClick={() => { setCourseRejectId(course.id); setCourseNote(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors active:scale-95">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                  {t('admin.card.reject')}
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
                                {expandedCourse === course.id ? t('adm.hide_lessons') : t('adm.view_lessons_videos')}
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
                              <p className="text-xs font-semibold">{t('adm.no_lessons_course')}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Course-level video */}
                              {(course.video_url || course.thumbnail_url) && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-3 space-y-2">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">{t('adm.course_video')}</p>
                                  <CourseVideoPlayer url={course.video_url} />
                                  {course.thumbnail_url && (
                                    <img src={cldImg(course.thumbnail_url)} alt="cover" className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mt-1" />
                                  )}
                                </div>
                              )}
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('adm.lessons_count', { count: lessonsByCourse[course.id].length })}
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
                                        {lesson.duration_min > 0 && <span className="flex items-center gap-1 text-[10px] text-slate-400"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--fm-warning)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{lesson.duration_min} min</span>}
                                        {lesson.is_free_preview && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t('fd.free_preview')}</span>}
                                        {Number(lesson.price) > 0 && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{Number(lesson.price).toFixed(2)} TND</span>}
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

      {/* ── Lessons tab ── */}
      {mainTab === 'lessons' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lessonsTabLoad ? t('fd.loading') : t('adm.lessons_pending', { count: allLessons.filter(l=>l.status==='pending').length })}
            </p>
            <button onClick={fetchLessonsTab} disabled={lessonsTabLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 transition-colors disabled:opacity-40">
              <svg className={`w-3.5 h-3.5 ${lessonsTabLoad?'animate-spin':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              {t('adm.refresh_short')}
            </button>
          </div>

          {allLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, opacity: 0.45 }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
              </div>
              <p className="text-sm font-semibold">{t('adm.no_lessons_submitted')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allLessons.map(lesson => {
                const acted = lessonActing[lesson.id];
                return (
                  <div key={lesson.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            lesson.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                            : lesson.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                          }`}>
                            {lesson.status === 'approved'
                              ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('admin.status.approved')}</span>
                              : lesson.status === 'rejected'
                              ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{t('admin.status.rejected')}</span>
                              : <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t('admin.status.pending')}</span>}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg><span className="font-semibold">{lesson.course_title}</span></span> · {t('adm.by_lower')} <span className="font-semibold">{lesson.instructor_name}</span>
                        </p>
                        {lesson.admin_note && (
                          <p className={`text-[11px] mt-1 ${lesson.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <span className="flex items-center gap-1"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>{lesson.admin_note}</span>
                          </p>
                        )}
                        {lesson.video_url && (
                          <div className="mt-3">
                            <CourseVideoPlayer url={lesson.video_url} />
                          </div>
                        )}
                      </div>
                      {lesson.status === 'pending' && !acted && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setLessonApproveId(lesson.id); setLessonApproveNote(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all">
                            ✓ {t('admin.card.approve')}
                          </button>
                          <button onClick={() => { setLessonRejectId(lesson.id); setLessonNote(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white active:scale-95 transition-all">
                            ✕ {t('admin.card.reject')}
                          </button>
                        </div>
                      )}
                      {acted && (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${acted==='approved'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-600'}`}>
                          {acted==='approved'
                            ? <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('admin.status.approved')}</span>
                            : <span className="flex items-center gap-1"><svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>{t('admin.status.rejected')}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Approve modal */}
          {lessonApproveId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{t('adm.approve_lesson')}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('adm.quick_msg_optional')}</p>
                {[t('adm.lesson_approve_preset1'), t('adm.lesson_approve_preset2'), t('adm.lesson_approve_preset3')].map(p => (
                  <button key={p} onClick={() => setLessonApproveNote(p)} className={`w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all ${lessonApproveNote===p?'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 font-semibold':'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'}`}>{p}</button>
                ))}
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-3">{t('adm.custom_message')}</p>
                <textarea value={lessonApproveNote} onChange={e => setLessonApproveNote(e.target.value)} rows={2} placeholder={t('adm.message_for_instructor')} className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 mt-1" />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setLessonApproveId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('adm.cancel')}</button>
                  <button onClick={() => approveLesson(lessonApproveId, lessonApproveNote)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">{t('adm.confirm_approval')}</button>
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {lessonRejectId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">{t('admin.reject.title')}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('admin.reject.quick_reason')}</p>
                {[t('adm.lesson_reject_preset1'),t('adm.lesson_reject_preset2'),t('adm.lesson_reject_preset3')].map(p => (
                  <button key={p} onClick={() => setLessonNote(p)} className={`w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all ${lessonNote===p?'bg-rose-50 dark:bg-rose-900/20 border-rose-300 text-rose-700 font-semibold':'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'}`}>{p}</button>
                ))}
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-3">{t('adm.custom_message')}</p>
                <textarea value={lessonNote} onChange={e=>setLessonNote(e.target.value)} rows={2} placeholder={t('adm.custom_message_ph')} className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 mt-1" />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setLessonRejectId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('adm.cancel')}</button>
                  <button onClick={() => rejectLesson(lessonRejectId, lessonNote)} disabled={!lessonNote.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">{t('adm.confirm_rejection')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PAID COURSE ACCESS TAB ══ */}
      {mainTab === 'paidaccess' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {paidCoursesLoading ? t('fd.loading') : t('adm.n_courses', { count: paidCourses.length })}
            </p>
            <button onClick={fetchPaidCourses} disabled={paidCoursesLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors disabled:opacity-40">
              <svg className={`w-3.5 h-3.5 ${paidCoursesLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {t('adm.refresh_short')}
            </button>
          </div>

          {paidCoursesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}</div>
          ) : paidCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <svg className="w-12 h-12 mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <p className="text-sm font-semibold">{t('adm.no_paid_courses')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paidCourses.map(course => (
                <div key={course.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 shrink-0 flex items-center justify-center text-2xl">
                        {course.thumbnail_url ? <img src={cldImg(course.thumbnail_url)} alt="" className="w-full h-full object-cover" /> : <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{course.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            course.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            course.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}>
                            {course.status === 'approved' ? t('admin.status.approved') : course.status === 'rejected' ? t('admin.status.rejected') : t('admin.status.pending')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('cc.by_label')} <span className="font-semibold text-slate-700 dark:text-slate-300">{course.instructor_name || '—'}</span>{course.creator_email && <span className="text-slate-400"> · {course.creator_email}</span>}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>{t('adm.buyers_count', { count: course.total_buyers ?? 0 })}</span>
                            {course.buyer_names ? <span className="font-semibold text-slate-600 dark:text-slate-300"> : {course.buyer_names}</span> : ''}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('adm.lessons_count', { count: course.approved_lessons ?? 0 })}</span>
                        </div>
                        <button
                          onClick={() => openAccessModal(course)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors active:scale-95 shadow-sm shadow-indigo-500/30">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.263a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                          </svg>
                          {t('adm.watch_paid_course')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Paid Course Access Modal ── */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/70 fm-backdrop-blur-in" onClick={() => { setAccessModal(null); setWatchLesson(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {accessModal.course?.thumbnail_url ? <img src={cldImg(accessModal.course.thumbnail_url)} alt="" className="w-full h-full object-cover rounded-xl" /> : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{accessModal.course?.title}</p>
                  <p className="text-xs text-slate-400">{t('cc.by_label')} {accessModal.course?.instructor_name || accessModal.course?.creator_email}</p>
                </div>
              </div>
              <button onClick={() => { setAccessModal(null); setWatchLesson(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2 pb-0 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="overflow-y-auto flex-1">
              {accessModalLoading ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                </div>
              ) : (
                <div className="p-3 sm:p-5 space-y-4 sm:space-y-6">

                  {/* Video player — shows when a lesson is selected */}
                  {watchLesson && (
                    <div className="bg-slate-950 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5"><svg width="12" height="12" fill="#a78bfa" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{watchLesson.lesson_title || watchLesson.title}</p>
                        <button onClick={() => setWatchLesson(null)} className="text-slate-400 hover:text-white text-xs font-semibold ml-3 shrink-0">{t('adm.close')}</button>
                      </div>
                      <div className="p-3">
                        <CourseVideoPlayer url={watchLesson.video_url} />
                      </div>
                    </div>
                  )}

                  {/* Lessons list */}
                  {accessModal.lessons?.length > 0 && (
                    <div>
                      <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        <span className="flex items-center gap-1.5"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>{t('adm.lessons_count', { count: accessModal.lessons.length })}</span>
                      </p>
                      <div className="space-y-2">
                        {accessModal.lessons.map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {lesson.is_free_preview && <span className="text-[10px] font-bold text-emerald-500">{t('fd.free_preview')}</span>}
                                <span className={`text-[10px] font-bold ${lesson.status === 'approved' ? 'text-emerald-500' : lesson.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>{lesson.status}</span>
                              </div>
                            </div>
                            {lesson.video_url && (
                              <button
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`${API}/admin-course-access/watch/${lesson.id}?admin_email=${encodeURIComponent(user?.email || '')}`);
                                    const d = await r.json();
                                    if (d.ok) setWatchLesson(d);
                                  } catch {}
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors active:scale-95 shrink-0">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                                {t('adm.watch')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search + Grant — unified */}
                  <div className="relative">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      <input
                        type="text"
                        placeholder={t('adm.search_user_email')}
                        value={searchEmail}
                        onChange={e => {
                          const val = e.target.value;
                          setSearchEmail(val);
                          setSearchSelected(false);
                          setGrantMsg(null);
                          setGrantIsError(false);
                          if (val.trim().length > 0) {
                            const filtered = (users || [])
                              .filter(u => u.email && u.email.toLowerCase().includes(val.toLowerCase()))
                              .slice(0, 8);
                            setSearchDropdown(filtered);
                          } else {
                            setSearchDropdown([]);
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors text-sm"
                      />
                    </div>

                    {/* Dropdown suggestions */}
                    {searchDropdown.length > 0 && !searchSelected && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                        {searchDropdown.map(u => (
                          <div
                            key={u.email}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setSearchEmail(u.email);
                              setSearchDropdown([]);
                              setSearchSelected(true);
                              setSearchSelectedUser(u);
                              setGrantMsg(null);
                              setGrantIsError(false);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors">
                            <Avatar name={u.name} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name || u.email}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              u.role === 'freelancer' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                                                       'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                            }`}>{u.role}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected user info card + Confirm Access button */}
                    {searchSelected && searchSelectedUser && (
                      <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="w-10 h-10 shrink-0">
                            {searchSelectedUser.photo
                              ? <img src={cldImg(searchSelectedUser.photo)} alt="" className="w-10 h-10 rounded-xl object-cover" />
                              : <Avatar name={searchSelectedUser.name} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{searchSelectedUser.name || '—'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{searchSelectedUser.email}</p>
                            {searchSelectedUser.region && <p className="text-xs text-slate-400 truncate">{searchSelectedUser.region}</p>}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            searchSelectedUser.role === 'freelancer' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                                                                       'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                          }`}>{searchSelectedUser.role}</span>
                        </div>
                        <div className="px-4 pb-4">
                          <button
                            onClick={grantAccess}
                            disabled={grantLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 shadow-sm shadow-emerald-500/30">
                            {grantLoading
                              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                            {grantLoading ? t('adm.in_progress') : t('adm.confirm_access')}
                          </button>
                        </div>
                      </div>
                    )}

                    {grantMsg && (
                      <div className={`flex items-center gap-2 mt-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${grantIsError ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'}`}>
                        {grantIsError
                          ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                        {grantMsg}
                      </div>
                    )}
                  </div>

                  {/* Students with access */}
                  <div>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1.5"><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>{t('adm.users_with_access', { count: accessModal.students?.length ?? 0 })}</span>
                    </p>
                    {(!accessModal.students || accessModal.students.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600">
                        <svg className="w-8 h-8 mb-2 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <p className="text-xs font-semibold">{t('adm.no_buyers_yet')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {accessModal.students.map(s => (
                          <div key={s.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 sm:px-4 py-3 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <Avatar name={s.buyer_name || s.buyer_email} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.buyer_name || s.buyer_email}</p>
                                <p className="text-[10px] text-slate-400 truncate">{s.buyer_email}</p>
                              </div>
                              <button
                                onClick={() => setRevokeConfirm(s)}
                                disabled={!!revokeLoading[s.id]}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-40 transition-colors active:scale-95 shrink-0">
                                {revokeLoading[s.id] ? '…' : t('adm.revoke')}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 ml-[52px] flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.access_type === 'full_course' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'}`}>
                                {s.access_type === 'full_course' ? t('adm.full_course') : t('adm.lesson_label', { name: s.lesson_title || s.lesson_id })}
                              </span>
                              {Number(s.amount_paid) > 0 && <span className="text-[10px] text-slate-400">{Number(s.amount_paid).toFixed(2)} TND</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DEMANDES D'ACCÈS AUX COURS TAB ══ */}
      {/* ── Revoke Access Confirmation Modal ── */}
      {revokeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 fm-backdrop-blur-in" style={{ backgroundColor: 'var(--fm-overlay)' }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">

            {/* X close button */}
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setRevokeConfirm(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Icon + title */}
            <div className="flex flex-col items-center px-6 pt-2 pb-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                </svg>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">{t('adm.revoke_access_title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('adm.revoke_access_confirm')}</p>

              {/* User info */}
              <div className="mt-3 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{revokeConfirm.buyer_name || revokeConfirm.buyer_email}</p>
                <p className="text-xs text-slate-400 truncate">{revokeConfirm.buyer_email}</p>
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${revokeConfirm.access_type === 'full_course' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'}`}>
                  {revokeConfirm.access_type === 'full_course' ? t('adm.full_course_access') : t('adm.single_lesson_access')}
                </span>
              </div>

              <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-3">{t('adm.action_irreversible')}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setRevokeConfirm(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {t('adm.cancel')}
              </button>
              <button
                onClick={() => { revokeAccess(revokeConfirm); setRevokeConfirm(null); }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-sm font-bold text-white transition-colors shadow-sm shadow-rose-500/30 active:scale-95">
                {t('adm.yes_revoke')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Course approve modal ── */}
      {courseApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{t('adm.approve_course')}</p>
              </div>
              <button onClick={() => setCourseApproveId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 pb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('adm.msg_instructor_optional')}</p>
              {[[t('adm.course_approve_preset1'),t('adm.course_approve_preset2'),t('adm.course_approve_preset3')]].flat().map(p => (
                <button key={p} onClick={() => setCourseNote(p)} className={['w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all', courseNote === p ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'].join(' ')}>{p}</button>
              ))}
              <textarea value={courseNote} onChange={e => setCourseNote(e.target.value)} rows={2} placeholder={t('adm.custom_message_ph')} className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setCourseApproveId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('adm.cancel')}</button>
              <button onClick={() => approveCourse(courseApproveId, courseNote)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">{t('adm.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Course reject modal ── */}
      {courseRejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 fm-backdrop-blur-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{t('adm.reject_course')}</p>
              </div>
              <button onClick={() => setCourseRejectId(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 pb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('admin.reject.title')}</p>
              {[t('adm.course_reject_preset1'),t('adm.course_reject_preset2'),t('adm.course_reject_preset3'),t('adm.course_reject_preset4')].map(p => (
                <button key={p} onClick={() => setCourseNote(p)} className={['w-full text-left text-xs px-3 py-2 rounded-xl border mb-1.5 transition-all', courseNote === p ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'].join(' ')}>{p}</button>
              ))}
              <textarea value={courseNote} onChange={e => setCourseNote(e.target.value)} rows={2} placeholder={t('adm.custom_reason_ph')} className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setCourseRejectId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('adm.cancel')}</button>
              <button disabled={!courseNote.trim()} onClick={() => rejectCourse(courseRejectId, courseNote)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-colors">{t('adm.confirm_x')}</button>
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
                  <div key={n.id} onClick={() => handleAdminNotifClick(n)} className={["flex items-start gap-3 px-5 py-3.5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors group", n.read ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50" : "bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"].join(" ")}>
                    <div className={["w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm",
                      n.kind.startsWith("course_access_granted") ? "bg-emerald-100 dark:bg-emerald-900/30" :
                      n.kind.startsWith("lesson_pending")         ? "bg-indigo-100 dark:bg-indigo-900/30" :
                      n.kind.startsWith("course_pending")         ? "bg-violet-100 dark:bg-violet-900/30" :
                      n.kind.includes("approved")                  ? "bg-emerald-100 dark:bg-emerald-900/30" :
                      n.kind.includes("rejected")                  ? "bg-rose-100 dark:bg-rose-900/30" :
                      "bg-amber-100 dark:bg-amber-900/30"].join(" ")}>
                      {n.kind.startsWith("course_access_granted") ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg> :
                       n.kind.startsWith("lesson_pending")         ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> :
                       n.kind.startsWith("course_pending")         ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> :
                       n.kind.includes("approved")                 ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> :
                       n.kind.includes("rejected")                 ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> :
                       <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold mb-0.5 ${n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CHAT TAB ══ */}
      {mainTab === 'chat' && (
        <div
          className="max-w-5xl mx-auto px-0 md:px-4 lg:px-6 py-0 md:py-4 relative"
          style={{ height: 'calc(100dvh - 280px)', minHeight: 360 }}
        >
          <button
            onClick={() => setChatFullscreen(true)}
            title={t('adm.chat_fullscreen')}
            aria-label={t('adm.chat_fullscreen')}
            className="absolute top-2 right-2 md:top-4 md:right-4 z-10 w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--fm-surface)', border: '1px solid var(--fm-border)', color: 'var(--fm-text-4)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--fm-surface)'; e.currentTarget.style.color = 'var(--fm-text-4)'; }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
          <MessengerChat currentUser={user} allUsers={users} initialChat={chatWith} />
        </div>
      )}

      {/* ══ CHAT TAB — full-screen overlay ══
          Same MessengerChat instance's data, just given the whole viewport:
          the embedded tab above is cramped (height comes out of the tile
          grid + header), especially on phones — this lets the admin expand
          it to read/type comfortably, then collapse back into the dashboard. */}
      {mainTab === 'chat' && chatFullscreen && (
        <div className="fm-backdrop-blur-in" style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--fm-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px', flexShrink: 0 }}>
            <button
              onClick={() => setChatFullscreen(false)}
              title={t('adm.chat_exit_fullscreen')}
              aria-label={t('adm.chat_exit_fullscreen')}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'var(--fm-surface)', border: '1px solid var(--fm-border)', color: 'var(--fm-text-4)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--fm-surface-hover)'; e.currentTarget.style.color = 'var(--fm-text-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--fm-surface)'; e.currentTarget.style.color = 'var(--fm-text-4)'; }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" />
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '0 12px 12px' }}>
            <MessengerChat currentUser={user} allUsers={users} initialChat={chatWith} fullScreen />
          </div>
        </div>
      )}

      {/* ══ PROJECTS TAB ══ */}
      {mainTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{t('adm.projects_title')}</h2>
            <button onClick={fetchAdminProjects} className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors">
              {t('adm.refresh')}
            </button>
          </div>

          {adminProjectsLoading ? (
            <p className="text-sm text-slate-400">{t('fd.loading')}</p>
          ) : adminProjects.length === 0 ? (
            <p className="text-sm text-slate-400">{t('adm.no_accepted_projects')}</p>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
              <table style={{ minWidth: 620 }} className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_project')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('Client')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_freelance')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_amount')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_date')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_status')}</th>
                    <th className="px-3 py-3 font-bold whitespace-nowrap">{t('adm.th_payment')}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminProjects.map(p => {
                    const STATUS_BADGE   = { in_progress: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400', completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' };
                    const STATUS_LABEL   = { in_progress: t('fd.status.in_progress'), completed: t('fd.status.completed') };
                    const PAY_BADGE      = { en_attente: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', recu: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' };
                    const PAY_LABEL_FULL = { en_attente: t('adm.payment_pending'), recu: t('adm.payment_received') };
                    const acceptedDate   = p.accepted_at ? new Date(p.accepted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                    return (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                        <td className="px-3 py-3 font-semibold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.title}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button onClick={() => navigate(`/admin/dashboard?tab=chat&with=${encodeURIComponent(p.client_email)}`)} className="text-left">
                            <p className="text-indigo-500 font-semibold text-sm">{p.client_name || '—'}</p>
                            <p className="text-slate-400 text-xs">{p.client_email}</p>
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {p.freelancer_email ? (
                            <button onClick={() => navigate(`/admin/dashboard?tab=chat&with=${encodeURIComponent(p.freelancer_email)}`)} className="text-left">
                              <p className="text-indigo-500 font-semibold text-sm">{p.freelancer_name || '—'}</p>
                              <p className="text-slate-400 text-xs">{p.freelancer_email}</p>
                            </button>
                          ) : <span className="text-slate-400 text-sm">-</span>}
                        </td>
                        <td className="px-3 py-3 font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{Number(p.amount || 0).toFixed(0)} TND</td>
                        <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{acceptedDate}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABEL[p.status] || p.status}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${PAY_BADGE[p.payment_status] || 'bg-slate-100 text-slate-500'}`}>
                            {PAY_LABEL_FULL[p.payment_status] || p.payment_status || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ GAINS TAB ══ */}
      {mainTab === 'gains' && <AdminGainsTab API={API} />}

      {/* ══ ANNOUNCEMENTS TAB ══ */}
      {mainTab === 'publicite' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          <AdvertisementsAdmin />
        </div>
      )}

      {mainTab === 'announcements' && (() => {
        const PAGE_OPTIONS = [
          { value: 'home',        label: 'Accueil' },
          { value: 'freelancers', label: 'Freelancers' },
          { value: 'clients',     label: 'Clients' },
          { value: 'courses',     label: 'Cours' },
          { value: 'projects',    label: 'Projets' },
          { value: 'messages',    label: 'Messages' },
          { value: 'payments',    label: 'Paiements' },
          { value: 'dashboard',   label: 'Tableau de bord' },
          { value: 'profile',     label: 'Profil' },
          { value: 'settings',    label: 'Paramètres' },
          { value: 'about',       label: 'À propos' },
          { value: 'blog',        label: 'Blog' },
          { value: 'careers',     label: 'Carrières' },
          { value: 'help',        label: 'Aide' },
        ];
        const pageLabel = (v) => PAGE_OPTIONS.find(p => p.value === v)?.label || v;
        const formatTime = (iso) => {
          try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h'); }
          catch { return ''; }
        };
        const formatDate = (iso) => {
          try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); }
          catch { return ''; }
        };

        return (
          <div>
            {/* Create / edit form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4">
                {annEditingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="ann-target-page">Page cible</label>
                  <select
                    id="ann-target-page"
                    aria-label="Page cible"
                    value={annTargetPage}
                    onChange={e => setAnnTargetPage(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  >
                    {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5" htmlFor="ann-message">Message</label>
                  <textarea
                    id="ann-message"
                    aria-label="Message"
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Ex: Maintenance prévue ce soir de 22h à 23h."
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {annEditingId && (
                  <button
                    onClick={resetAnnForm}
                    disabled={annSaving}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
                <button
                  onClick={publishAnnouncement}
                  disabled={annSaving || !annMessage.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                  {annSaving ? '...' : (annEditingId ? 'Enregistrer' : 'Publier')}
                </button>
              </div>
            </div>

            {/* List */}
            {announcementsLoading ? (
              <div className="flex justify-center py-16">
                <svg className="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                <p className="text-sm font-semibold">Aucune annonce pour le moment</p>
              </div>
            ) : (
              <div className="space-y-2">
                {announcements.map(a => (
                  <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                          {pageLabel(a.target_page)}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {formatDate(a.updated_at || a.created_at)} · {formatTime(a.updated_at || a.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{a.message}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEditAnnouncement(a)}
                        aria-label="Modifier"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      {annDeleteConfirm === a.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteAnnouncement(a.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors">Confirmer</button>
                          <button onClick={() => setAnnDeleteConfirm(null)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-colors">Annuler</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAnnDeleteConfirm(a.id)}
                          aria-label="Supprimer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 dark:text-rose-400 transition-colors"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Logout Confirmation Modal ── */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 fm-backdrop-blur-in"
          style={{ backgroundColor: 'var(--fm-overlay)' }}
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
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">{t('Log out')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('adm.logout_confirm')}</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setLogoutConfirm(false)} className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {t('adm.cancel')}
              </button>
              <button onClick={() => { logout(); setLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors shadow-sm shadow-rose-500/30">
                {t('Log out')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
