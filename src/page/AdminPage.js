// src/page/AdminPage.js
import { useState } from "react";
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
  const map = {
    pending:  { label: "En attente",  cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    approved: { label: "Approuvé",    cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    rejected: { label: "Rejeté",      cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── presets ──────────────────────────────────────────────────────────────────

const REJECT_PRESETS = [
  "La photo de la carte d'identité n'est pas suffisamment claire.",
  "Les informations du compte ne correspondent pas à celles de la CIN.",
  "La carte d'identité est expirée ou illisible.",
  "Veuillez fournir les deux faces de la CIN.",
];

const APPROVE_PRESETS = [
  "Votre identité a été vérifiée avec succès.",
  "Vos documents sont conformes. Bienvenue sur la plateforme !",
  "Votre CIN correspond bien à vos informations. Compte activé.",
  "Dossier complet et validé par l'équipe d'administration.",
];

// ─── CIN image viewer modal ───────────────────────────────────────────────────

function CINImageModal({ user, onClose }) {
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
          {[{ id: "front", label: "Face avant" }, { id: "back", label: "Face arrière" }].map(s => (
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
              <span>Image non disponible</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800">
          {[{ label: "Nom complet", value: user.name }, { label: "Date de naissance", value: user.dob }, { label: "Région", value: user.region }].map(({ label, value }) => (
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
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Rejeter la vérification</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raison rapide</p>
          <div className="space-y-1.5 mb-4">
            {REJECT_PRESETS.map(p => (
              <button key={p} onClick={() => setReason(p)} className={["w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150", reason === p ? "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 font-semibold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ou écrivez une raison personnalisée</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Expliquez la raison du rejet…" className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">Confirmer le rejet</button>
        </div>
      </div>
    </div>
  );
}

// ─── approve dialog ───────────────────────────────────────────────────────────

function ApproveDialog({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Approuver la vérification</p>
              <p className="text-xs text-slate-400">{user.name}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message rapide</p>
          <div className="space-y-1.5 mb-4">
            {APPROVE_PRESETS.map(p => (
              <button key={p} onClick={() => setReason(p)} className={["w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150", reason === p ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ou écrivez un message personnalisé</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Message pour le freelancer approuvé…" className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors" />
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">Confirmer l'approbation</button>
        </div>
      </div>
    </div>
  );
}

// ─── user detail notification card ───────────────────────────────────────────

function UserNotificationCard({ user, onApprove, onReject, onView, justActed }) {
  const status = user.cinStatus ?? (user.cinVerified ? "approved" : "pending");
  const acted  = justActed[user.email];

  return (
    <div className={["bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden", acted === "approved" ? "border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20" : acted === "rejected" ? "border-rose-300 dark:border-rose-700 shadow-lg shadow-rose-100 dark:shadow-rose-900/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"].join(" ")}>

      {/* notification header — amber pulse for pending */}
      {status === "pending" && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Nouvelle demande de vérification</p>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} />
          <div className="flex-1 min-w-0">

            {/* name + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
              <StatusBadge status={status} />
              {user.plan === "premium" && (
                <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">Premium ✦</span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{user.email}</p>

            {/* ALL user info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              {[
                { label: "Nom complet",       value: user.name,     icon: "👤" },
                { label: "Email",             value: user.email,    icon: "📧" },
                { label: "Date de naissance", value: user.dob,      icon: "🎂" },
                { label: "Région",            value: user.region,   icon: "📍" },
                { label: "Plan",              value: user.plan,     icon: "💳" },
                { label: "Rôle",              value: user.role,     icon: "🏷️" },
                { label: "Compétences",       value: user.skills,   icon: "🛠️" },
                { label: "Bio",               value: user.bio,      icon: "📝" },
                { label: "Inscrit le",        value: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString("fr-TN") : null, icon: "📅" },
              ].filter(f => f.value).map(({ label, value, icon }) => (
                <div key={label} className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{icon} {label}</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate capitalize">{value}</p>
                </div>
              ))}
            </div>

            {/* CIN thumbnails */}
            {(user.cinFront || user.cinBack) && (
              <div className="flex gap-3 mb-4">
                {[{ key: "cinFront", label: "Face avant" }, { key: "cinBack", label: "Face arrière" }].map(({ key, label }) => user[key] ? (
                  <div key={key} className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-24" onClick={() => onView(user)}>
                      <img src={`data:image/jpeg;base64,${user[key]}`} alt={label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Agrandir</span>
                      </div>
                    </div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* approval/rejection reason display */}
            {status === "approved" && user.cinApprovalReason && (
              <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-3">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-0.5">Message envoyé au freelancer</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{user.cinApprovalReason}</p>
                </div>
              </div>
            )}
            {status === "rejected" && user.cinRejectionReason && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl mb-3">
                <svg className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                <div>
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-0.5">Raison envoyée au freelancer</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400">{user.cinRejectionReason}</p>
                </div>
              </div>
            )}

            {/* action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => onView(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Voir la CIN
              </button>
              {status !== "approved" && (
                <button onClick={() => onApprove(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Approuver
                </button>
              )}
              {status !== "rejected" && (
                <button onClick={() => onReject(user)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Rejeter
                </button>
              )}
              {(status === "approved" || status === "rejected") && (
                <button onClick={() => onApprove({ ...user, _resetOnly: true })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Remettre en attente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* flash bar */}
      {acted && (
        <div className={`h-1 w-full transition-all duration-700 ${acted === "approved" ? "bg-emerald-500" : "bg-rose-500"}`} />
      )}
    </div>
  );
}

// ─── main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, users, updateUser, logout } = useAuth();

  const [filter,    setFilter]    = useState("pending");
  const [search,    setSearch]    = useState("");
  const [viewing,   setViewing]   = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [approving, setApproving] = useState(null);
  const [justActed, setJustActed] = useState({});

  const freelancers = (users ?? []).filter(u => u.role === "freelancer" && (u.cinFront || u.cinBack));

  const getStatus = u => u.cinStatus ?? (u.cinVerified ? "approved" : "pending");

  const counts = {
    all:      freelancers.length,
    pending:  freelancers.filter(u => getStatus(u) === "pending").length,
    approved: freelancers.filter(u => getStatus(u) === "approved").length,
    rejected: freelancers.filter(u => getStatus(u) === "rejected").length,
  };

  const filtered = freelancers.filter(u => {
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
    { id: "pending",  label: "En attente" },
    { id: "approved", label: "Approuvés"  },
    { id: "rejected", label: "Rejetés"    },
    { id: "all",      label: "Tous"       },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── top admin bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          {/* left: identity */}
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
                    {counts.pending} en attente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* right: search + logout */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="w-52 pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-colors" />
            </div>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* ── stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",       value: counts.all,      color: "text-slate-700 dark:text-slate-200",     bg: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800" },
            { label: "En attente",  value: counts.pending,  color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900" },
            { label: "Approuvés",   value: counts.approved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900" },
            { label: "Rejetés",     value: counts.rejected, color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 border`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── filter tabs ── */}
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5 w-fit">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={["px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5", filter === f.id ? "bg-indigo-600 text-white shadow" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"].join(" ")}>
              {f.label}
              {counts[f.id] > 0 && (
                <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none ${filter === f.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{counts[f.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── notification cards ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p className="text-sm font-semibold">Aucune notification</p>
            <p className="text-xs mt-1">Les nouvelles demandes apparaîtront ici.</p>
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
      </div>

      {/* ── modals ── */}
      {viewing   && <CINImageModal  user={viewing}   onClose={() => setViewing(null)} />}
      {rejecting && <RejectDialog   user={rejecting} onConfirm={r => handleReject(rejecting, r)}           onClose={() => setRejecting(null)} />}
      {approving && <ApproveDialog  user={approving} onConfirm={r => handleApproveConfirm(approving, r)}   onClose={() => setApproving(null)} />}
    </div>
  );
}