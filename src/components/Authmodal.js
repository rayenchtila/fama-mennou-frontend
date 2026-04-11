// src/components/AuthModal.jsx
import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const TUNISIAN_REGIONS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse",
  "Tataouine","Tozeur","Tunis","Zaghouan",
];

/*function updateUser(email, patch) {
  setUsers(prev => prev.map(u => u.email === email ? { ...u, ...patch } : u));
}
// وتزيدها في الـ value: { ..., users, updateUser }*/

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadBox({ label, hint, preview, onFile, side }) {
  const inputRef = useRef();
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      <div
        onClick={() => inputRef.current.click()}
        className={[
          "relative w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden flex flex-col items-center justify-center gap-1",
          preview
            ? "border-emerald-400 dark:border-emerald-600"
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600",
        ].join(" ")}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="text-[11px] text-slate-400 text-center px-2">{hint}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

// ── "En cours de vérification" screen shown after signup ─────────────────────
function PendingVerificationScreen({ userName, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </span>
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Compte créé avec succès !</h2>
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4">En cours de vérification…</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
        Bonjour <span className="font-bold text-slate-700 dark:text-slate-200">{userName}</span>, votre dossier a été soumis.
        Notre équipe va examiner vos informations et votre CIN sous peu.
      </p>
      <div className="w-full max-w-xs space-y-2 mb-7">
        {[
          { icon: "✅", label: "Compte créé",           done: true  },
          { icon: "🔍", label: "Vérification en cours", done: false, active: true },
          { icon: "📬", label: "Décision de l'admin",   done: false },
        ].map((step, i) => (
          <div key={i} className={[
            "flex items-center gap-3 p-3 rounded-xl border text-sm",
            step.done   ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" :
            step.active ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" :
                          "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400",
          ].join(" ")}>
            <span className="text-base">{step.icon}</span>
            <span className="font-semibold">{step.label}</span>
            {step.active && (
              <svg className="w-3.5 h-3.5 animate-spin ml-auto shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
        Vous serez notifié dès que votre compte sera approuvé ou refusé.
      </p>
      <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
        Fermer
      </button>
    </div>
  );
}

// ── Status screen shown when user logs in and their account is decided ────────
function CINStatusScreen({ user, onClose, onLogout }) {
  const isApproved = user.cinStatus === "approved";

  if (isApproved) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Compte approuvé ! 🎉</h2>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4">Votre vérification a été acceptée</p>
        {user.cinApprovalReason && (
          <div className="w-full max-w-xs p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-5 text-left">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Message de l'admin</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{user.cinApprovalReason}</p>
          </div>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-7 leading-relaxed">
          Bienvenue sur la plateforme, <span className="font-bold text-slate-700 dark:text-slate-200">{user.name}</span> ! Votre compte est maintenant pleinement actif.
        </p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
          Accéder à mon compte →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </span>
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Compte refusé</h2>
      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">Votre vérification n'a pas été acceptée</p>
      {user.cinRejectionReason && (
        <div className="w-full max-w-xs p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl mb-5 text-left">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-1">Raison du refus</p>
          <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">{user.cinRejectionReason}</p>
        </div>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-7 leading-relaxed">
        Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter ou créer un nouveau compte avec des informations correctes.
      </p>
      <button onClick={onLogout} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors">
        Fermer
      </button>
    </div>
  );
}

export default function AuthModal({ open, onClose, onAuth, defaultMode = "login" }) {
  const [mode,    setMode]    = useState(defaultMode);
  const [plan,    setPlan]    = useState("free");
  const [role,    setRole]    = useState("freelancer");
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form,    setForm]    = useState({
    name: "", email: "", password: "", confirmPassword: "",
    skills: "", bio: "", dob: "", region: "",
  });

  // screen: "form" | "pending" | "status"
  const [screen,      setScreen]      = useState("form");
  const [pendingName, setPendingName] = useState("");
  const [statusUser,  setStatusUser]  = useState(null);

  // CIN state — upload only, no AI verification
  const [cinFrontFile,    setCinFrontFile]    = useState(null);
  const [cinBackFile,     setCinBackFile]     = useState(null);
  const [cinFrontPreview, setCinFrontPreview] = useState(null);
  const [cinBackPreview,  setCinBackPreview]  = useState(null);

  const { t }               = useTranslation();
  const { register, login, logout } = useAuth();

  const PLANS = [
    {
      id: "free", label: t("Free"), price: t("$0/mo"),
      features: [t("3 proposals per month"), t("Browse all jobs & freelancers"), t("1 course upload"), t("Basic profile")],
    },
    {
      id: "premium", label: t("Premium"), price: t("$29/mo"), badge: t("✦ Most Popular"),
      features: [t("Unlimited proposals"), t("Priority listing"), t("Unlimited course uploads"), t("Advanced analytics"), t("Direct messaging"), t("Verified badge")],
    },
  ];

  const ROLES = [
    {
      id: "client", label: t("Client"), activeColor: "text-sky-700 dark:text-sky-400",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="17"/>
          <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
        </svg>
      ),
    },
    {
      id: "freelancer", label: t("Freelancer"), activeColor: "text-indigo-600 dark:text-indigo-400",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    setMode(defaultMode);
    setForm({ name: "", email: "", password: "", confirmPassword: "", skills: "", bio: "", dob: "", region: "" });
    setErrors({});
    setRole("freelancer");
    setPlan("free");
    resetCIN();
    setScreen("form");
    setPendingName("");
    setStatusUser(null);
  }, [defaultMode, open]);

  function resetCIN() {
    setCinFrontFile(null);
    setCinBackFile(null);
    setCinFrontPreview(null);
    setCinBackPreview(null);
  }

  function set(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(err => ({ ...err, [field]: "" }));
    };
  }

  function handleCINFile(side, file) {
    const url = URL.createObjectURL(file);
    if (side === "front") { setCinFrontFile(file); setCinFrontPreview(url); }
    else                  { setCinBackFile(file);  setCinBackPreview(url);  }
    setErrors(err => ({ ...err, cin: "" }));
  }

  function validate() {
    const errs = {};
    if (mode === "signup" && !form.name.trim())
      errs.name = t("Name is required");
    if (!form.email.trim())
      errs.email = t("Email is required");
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = t("Enter a valid email");
    if (!form.password)
      errs.password = t("Password is required");
    else if (form.password.length < 6)
      errs.password = t("At least 6 characters");
    if (mode === "signup" && form.password !== form.confirmPassword)
      errs.confirmPassword = t("Passwords do not match");
    if (mode === "signup" && role === "freelancer") {
      if (!form.skills.trim()) errs.skills = t("Please enter at least one skill");
      if (!form.dob)           errs.dob    = t("Date of birth is required");
      if (!form.region)        errs.region = t("Please select your region");
      if (!cinFrontFile || !cinBackFile)
        errs.cin = t("Please upload both sides of your CIN");
    }
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    setTimeout(async () => {
      setLoading(false);

      if (mode === "signup") {
        let cinFrontB64 = null, cinBackB64 = null;
        if (cinFrontFile) cinFrontB64 = await fileToBase64(cinFrontFile);
        if (cinBackFile)  cinBackB64  = await fileToBase64(cinBackFile);

        register({
          name:        form.name,
          email:       form.email,
          password:    form.password,
          plan,
          role,
          dob:         form.dob,
          region:      form.region,
          cin:         "",
          cinFront:    cinFrontB64,
          cinBack:     cinBackB64,
          cinVerified: false,
        });

        setPendingName(form.name);
        setScreen("pending");
        return;
      }

      // LOGIN
      const result = login(form.email, form.password);
      if (result.error === "noAccount") {
        setErrors({ email: t("No account found with this email") });
        return;
      }
      if (result.error === "wrongPassword") {
        setErrors({ password: t("Incorrect password") });
        return;
      }

      // If freelancer with a decided status, show status screen
      if (
        result.user.role === "freelancer" &&
        (result.user.cinStatus === "approved" || result.user.cinStatus === "rejected")
      ) {
        setStatusUser(result.user);
        setScreen("status");
        return;
      }

      onAuth?.(result.user);
      onClose?.();
    }, 1000);
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const isClient     = role === "client";
  const isFreelancer = role === "freelancer" && mode === "signup";

  const modalTitle =
    screen === "pending" ? t("Inscription soumise 📋") :
    screen === "status"  ? (statusUser?.cinStatus === "approved" ? t("Compte approuvé ✅") : t("Compte refusé ❌")) :
    mode === "login"     ? t("Welcome back 👋") :
    isClient             ? t("Join As A Client 💼") : t("Join As A Freelancer 🚀");

  const modalSubtitle =
    screen === "pending" ? t("Votre dossier est en cours d'examen") :
    screen === "status"  ? "" :
    mode === "login"     ? t("Log in to access your dashboard") :
    t("Join thousands of professionals today");

  return (
    <Modal open={open} onClose={onClose} size="md" title={modalTitle} subtitle={modalSubtitle}>

      {/* ── PENDING SCREEN ── */}
      {screen === "pending" && (
        <PendingVerificationScreen
          userName={pendingName}
          onClose={() => { setScreen("form"); onClose?.(); }}
        />
      )}

      {/* ── STATUS SCREEN ── */}
      {screen === "status" && statusUser && (
        <CINStatusScreen
          user={statusUser}
          onClose={() => {
            if (statusUser.cinStatus === "approved") {
              onAuth?.(statusUser);
              onClose?.();
            } else {
              setScreen("form");
            }
          }}
          onLogout={() => {
            logout();
            setScreen("form");
            setStatusUser(null);
          }}
        />
      )}

      {/* ── NORMAL FORM ── */}
      {screen === "form" && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
            {[{ id: "login", label: t("Log in") }, { id: "signup", label: t("Sign up") }].map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setErrors({}); }}
                className={[
                  "flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200",
                  mode === m.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                ].join(" ")}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Role toggle */}
          {mode === "signup" && (
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
                {t("I am joining as")}
              </p>
              <div
                className="flex items-center mx-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-1"
                style={{ width: "280px" }}
              >
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={[
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                      role === r.id
                        ? `bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm ${r.activeColor}`
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
                    ].join(" ")}
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
              <p className={[
                "text-center mt-2.5 text-xs font-medium transition-colors duration-200",
                isClient ? "text-sky-600 dark:text-sky-400" : "text-indigo-600 dark:text-indigo-400",
              ].join(" ")}>
                {isClient ? t("Looking to hire talent") : t("Looking for work & clients")}
              </p>
            </div>
          )}

          {/* Social login */}
          <div className="flex gap-2 mb-4">
            {[
              {
                name: "Google",
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                ),
              },
              {
                name: "GitHub",
                icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                ),
              },
            ].map(s => (
              <button
                key={s.name}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 active:scale-95"
              >
                {s.icon}
                {s.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">{t("or continue with email")}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Form fields */}
          <div className="space-y-3" onKeyDown={handleKey}>
            {mode === "signup" && (
              <Input
                label={t("Full name")} placeholder={t("Your full name")}
                value={form.name} onChange={set("name")} error={errors.name} required
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                }
              />
            )}
            <Input
              label={t("Email address")} type="email" placeholder={t("you@example.com")}
              value={form.email} onChange={set("email")} error={errors.email} required
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              }
            />
            <Input
              label={t("Password")} type="password" placeholder={t("Min 6 characters")}
              value={form.password} onChange={set("password")} error={errors.password} required
            />
            {mode === "signup" && (
              <Input
                label={t("Confirm password")} type="password" placeholder={t("Repeat your password")}
                value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} required
              />
            )}

            {/* ── FREELANCER EXTRA FIELDS ── */}
            {isFreelancer && (
              <>
                <Input
                  label={t("Date de naissance")}
                  type="date"
                  value={form.dob}
                  onChange={set("dob")}
                  error={errors.dob}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    {t("Région")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.region}
                      onChange={e => { setForm(f => ({ ...f, region: e.target.value })); setErrors(err => ({ ...err, region: "" })); }}
                      className={[
                        "w-full appearance-none rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-200 pr-9",
                        errors.region
                          ? "border-rose-400 dark:border-rose-500 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-400/20",
                      ].join(" ")}
                    >
                      <option value="">{t("Sélectionnez votre gouvernorat")}</option>
                      {TUNISIAN_REGIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                  {errors.region && <p className="mt-1 text-xs text-rose-500">{errors.region}</p>}
                </div>

                {/* CIN Section — upload only, no AI verify button */}
                <div className="mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      Carte d'Identité Nationale
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                    Prenez une photo claire de chaque face de votre CIN. La photo doit être nette et bien éclairée.
                  </p>

                  <div className="flex gap-3 mb-3">
                    <ImageUploadBox
                      label="Face avant"
                      hint="Photo de la face avant"
                      preview={cinFrontPreview}
                      onFile={f => handleCINFile("front", f)}
                      side="front"
                    />
                    <ImageUploadBox
                      label="Face arrière"
                      hint="Retournez la carte et photographiez"
                      preview={cinBackPreview}
                      onFile={f => handleCINFile("back", f)}
                      side="back"
                    />
                  </div>

                  {/* Confirmation when both uploaded */}
                  {cinFrontFile && cinBackFile && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        Les deux photos sont prêtes. L'admin vérifiera votre CIN après soumission.
                      </p>
                    </div>
                  )}

                  {errors.cin && (
                    <p className="mt-1.5 text-xs text-rose-500">{errors.cin}</p>
                  )}
                </div>

                <Input
                  label={t("Your Skills")} placeholder={t("e.g. React, Figma, SEO")}
                  value={form.skills} onChange={set("skills")} error={errors.skills} required
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  }
                />
                <Input
                  label={t("Short Bio")} placeholder={t("Tell clients about yourself...")}
                  value={form.bio} onChange={set("bio")} error={errors.bio}
                />
              </>
            )}
          </div>

          {mode === "login" && (
            <div className="text-right mt-2">
              <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                {t("Forgot password?")}
              </button>
            </div>
          )}

          {/* Plan selector */}
          {mode === "signup" && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                {t("Choose your plan")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={[
                      "relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200",
                      plan === p.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700",
                    ].join(" ")}
                  >
                    {p.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                        {p.badge}
                      </span>
                    )}
                    <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{p.label}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm mb-2">{p.price}</p>
                    <ul className="space-y-1">
                      {p.features.slice(0, 3).map(f => (
                        <li key={f} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                          <svg className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth className="mt-5" loading={loading} onClick={handleSubmit}>
            {loading ? t("Processing…") : mode === "login" ? t("Log in") : t("Create account")}
          </Button>

          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("By continuing you agree to our")}{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">{t("Terms")}</a>
            {" "}{t("and")}{" "}
            <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">{t("Privacy Policy")}</a>
          </p>
        </>
      )}
    </Modal>
  );
}