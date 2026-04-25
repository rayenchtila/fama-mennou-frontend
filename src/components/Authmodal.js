// src/components/AuthModal.jsx
import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";


const RECAPTCHA_SITE_KEY = "6Lf-_bMsAAAAAC3k8lKXSuBA1yFrbA4RMV2F4VJi";

const TUNISIAN_REGIONS = [
  "Ariana","Béja","Ben Arous","Bizerte","Gabès","Gafsa","Jendouba",
  "Kairouan","Kasserine","Kébili","Kef","Mahdia","Manouba","Médenine",
  "Monastir","Nabeul","Sfax","Sidi Bouzid","Siliana","Sousse",
  "Tataouine","Tozeur","Tunis","Zaghouan",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageUploadBox({ label, hint, preview, onFile, side }) {
  const { t } = useTranslation();
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
              <span className="text-white text-xs font-semibold">{t("Change")}</span>
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

// ── Email Verification Screen ─────────────────────────────────────────────────
const API = "https://famamennou-server.onrender.com/api";

function VerifyEmailScreen({ email, onVerify, onBack, loading }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col py-4 px-2">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-6 w-fit transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {t("Back")}
      </button>
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white text-center mb-1">{t("Check your email")}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
        {t("We sent a 6-digit code to")}{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
      </p>
      <Input
        label={t("Verification code")}
        placeholder="000000"
        value={code}
        onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
        error={error}
        required
      />
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
        </div>
      )}
      <Button variant="primary" size="lg" fullWidth className="mt-4" loading={loading} onClick={() => onVerify(code, setError)}>
        {loading ? t("Verifying…") : t("Verify & Create Account")}
      </Button>
    </div>
  );
}

// ── Forgot Password Screen ────────────────────────────────────────────────────

function ForgotPasswordScreen({ onBack, onSent }) {
  const { t } = useTranslation();
  const [email,           setEmail]           = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  async function handleSend() {
    if (!email.trim())                        { setError(t("Email is required"));        return; }
    if (!/\S+@\S+\.\S+/.test(email))         { setError(t("Enter a valid email"));      return; }
    if (!newPassword)                         { setError(t("Password is required"));     return; }
    if (newPassword.length < 6)              { setError(t("At least 6 characters"));    return; }
    if (newPassword !== confirmPassword)      { setError(t("Passwords do not match"));   return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), newPassword }),
      });
      const data = await res.json();
      if (data.error === "noAccount") { setError(t("No account found with this email")); return; }
      onSent(email);
    } catch {
      setError(t("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col py-4 px-2">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-6 w-fit transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {t("Back to login")}
      </button>
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white text-center mb-1">{t("Forgot your password?")}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">{t("reset.subtitle")}</p>
      <div className="space-y-3">
        <Input
          label={t("Email address")} type="email" placeholder={t("you@example.com")}
          value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required
          leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
        />
        <Input
          label={t("reset.new_password")} type="password" placeholder={t("Min 6 characters")}
          value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(""); }} required
        />
        <Input
          label={t("Confirm password")} type="password" placeholder={t("Repeat your password")}
          value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} required
        />
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
        </div>
      )}
      <Button variant="primary" size="lg" fullWidth className="mt-4" loading={loading} onClick={handleSend}>
        {loading ? t("Processing…") : t("reset.btn")}
      </Button>
    </div>
  );
}

// ── Password Reset Success Screen ────────────────────────────────────────────
function PasswordFoundScreen({ email, onBack }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center py-6 px-2 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t("reset.success_title")}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t("Account:")} <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span></p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-6 max-w-xs leading-relaxed">{t("reset.success_msg")}</p>
      <button onClick={onBack} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
        {t("Back to login")}
      </button>
    </div>
  );
}

// ── "En cours de vérification" screen shown after signup ─────────────────────
function PendingVerificationScreen({ userName, onClose }) {
  const { t } = useTranslation();
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
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t("Account created successfully!")}</h2>
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4">{t("Under review…")}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
        {t("Hello")} <span className="font-bold text-slate-700 dark:text-slate-200">{userName}</span>{t(", your file has been submitted. Our team will review your information and CIN shortly.")}
      </p>
      <div className="w-full max-w-xs space-y-2 mb-7">
        {[
          { icon: "✅", label: t("Account created"),          done: true  },
          { icon: "🔍", label: t("Verification in progress"), done: false, active: true },
          { icon: "📬", label: t("Admin decision"),           done: false },
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
        {t("You will be notified once your account is approved or rejected.")}
      </p>
      <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
        {t("Close")}
      </button>
    </div>
  );
}

// ── Status screen shown when user logs in and their account is decided ────────
function CINStatusScreen({ user, onClose, onLogout }) {
  const { t } = useTranslation();
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
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t("Account approved! 🎉")}</h2>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4">{t("Your verification has been accepted")}</p>
        {user.cinApprovalReason && (
          <div className="w-full max-w-xs p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-5 text-left">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">{t("Admin message")}</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{user.cinApprovalReason}</p>
          </div>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-7 leading-relaxed">
          {t("Welcome to the platform,")} <span className="font-bold text-slate-700 dark:text-slate-200">{user.name}</span>{t("! Your account is now fully active.")}
        </p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
          {t("Access my account →")}
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
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t("Account rejected")}</h2>
      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">{t("Your verification was not accepted")}</p>
      {user.cinRejectionReason && (
        <div className="w-full max-w-xs p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl mb-5 text-left">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-1">{t("Rejection reason")}</p>
          <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">{user.cinRejectionReason}</p>
        </div>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-7 leading-relaxed">
        {t("If you believe this is an error, please contact us or create a new account with correct information.")}
      </p>
      <button onClick={onLogout} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors">
        {t("Close")}
      </button>
    </div>
  );
}

export default function AuthModal({ open, onClose, onAuth, defaultMode = "login", closable = true }) {
  const [mode,    setMode]    = useState(defaultMode);
  const [role,    setRole]    = useState("freelancer");
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form,    setForm]    = useState({
    lastName: "", firstName: "", email: "", password: "", confirmPassword: "",
    skills: "", bio: "", dob: "", region: "", gender: "",
  });

  // screen: "form" | "verify" | "pending" | "status" | "forgot" | "passwordFound"
  const [screen,          setScreen]          = useState("form");
  const [pendingName,     setPendingName]     = useState("");
  const [pendingFormData, setPendingFormData] = useState(null);
  const [statusUser,      setStatusUser]      = useState(null);
  const [foundEmail,      setFoundEmail]      = useState("");
  const [foundPassword,   setFoundPassword]   = useState("");

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef();

  // CIN state
  const [cinFrontFile,    setCinFrontFile]    = useState(null);
  const [cinBackFile,     setCinBackFile]     = useState(null);
  const [cinFrontPreview, setCinFrontPreview] = useState(null);
  const [cinBackPreview,  setCinBackPreview]  = useState(null);

  const { t }                        = useTranslation();
  const { register, login, logout, accounts, updateUser } = useAuth();

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
    setForm({ lastName: "", firstName: "", email: "", password: "", confirmPassword: "", skills: "", bio: "", dob: "", region: "", gender: "" });
    setErrors({});
    setRole("freelancer");
    resetCIN();
    setScreen("form");
    setPendingName("");
    setPendingFormData(null);
    setStatusUser(null);
    setCaptchaToken(null);
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
    if (mode === "signup" && !form.lastName.trim())
      errs.lastName = t("Last name is required");
    if (mode === "signup" && !form.firstName.trim())
      errs.firstName = t("First name is required");
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
      if (!form.gender)        errs.gender = t("Veuillez sélectionner votre genre");
      if (!form.skills.trim()) errs.skills = t("Please enter at least one skill");
      if (!form.dob)           errs.dob    = t("Date of birth is required");
      if (!form.region)        errs.region = t("Please select your region");
      if (!cinFrontFile || !cinBackFile)
        errs.cin = t("Please upload both sides of your CIN");
    }
    if (mode === "signup" && role === "client") {
      if (!form.dob)    errs.dob    = t("Date of birth is required");
      if (!form.gender) errs.gender = t("Veuillez sélectionner votre genre");
      if (!cinFrontFile || !cinBackFile)
        errs.cin = t("Please upload both sides of your CIN");
    }
    if (mode === "login" && !captchaToken)
      errs.captcha = t("Please complete the CAPTCHA");
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch(`${API}/auth/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (data.error) {
          setErrors({ email: t("Failed to send verification email. Try again.") });
          return;
        }
        setPendingFormData({ ...form, role });
        setScreen("verify");
        return;
      }

      // LOGIN
      const result = await login(form.email, form.password);
      if (result.error === "noAccount") {
        setErrors({ email: t("No account found with this email") });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      if (result.error === "wrongPassword") {
        setErrors({ password: t("Incorrect password") });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      // ── handle login by cinStatus for both freelancers and clients ──
      if (!result.user) { setErrors({ email: t("Login failed. Please try again.") }); return; }
      if (result.user.role === "freelancer" || result.user.role === "client") {
        if ((result.user.cinStatus === "approved" || result.user.cinStatus === "rejected") && !result.user.statusSeen) {
          setStatusUser(result.user);
          setScreen("status");
          return;
        }
        if (result.user.cinStatus === "pending") {
          setPendingName(result.user.name);
          setScreen("pending");
          logout();
          return;
        }
      }

      onAuth?.(result.user);
      onClose?.();
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  async function handleVerifyCode(code, setCodeError) {
    if (!code || code.length < 6) { setCodeError(t("Enter the 6-digit code")); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingFormData.email, code }),
      });
      const data = await res.json();
      if (data.error === "wrongCode") { setCodeError(t("Incorrect code. Please try again.")); return; }
      if (data.error === "expired")   { setCodeError(t("Code expired. Go back and request a new one.")); return; }
      if (data.error === "noCode")    { setCodeError(t("No code found. Go back and try again.")); return; }
      if (!data.success) { setCodeError(t("Verification failed.")); return; }

      let cinFrontB64 = null, cinBackB64 = null;
      if (cinFrontFile) cinFrontB64 = await fileToBase64(cinFrontFile);
      if (cinBackFile)  cinBackB64  = await fileToBase64(cinBackFile);

      await register({
        name:        pendingFormData.firstName + " " + pendingFormData.lastName,
        email:       pendingFormData.email,
        password:    pendingFormData.password,
        role:        pendingFormData.role,
        dob:         pendingFormData.dob,
        region:      pendingFormData.region,
        gender:      pendingFormData.gender,
        skills:      pendingFormData.skills,
        bio:         pendingFormData.bio,
        cin:         "",
        cinFront:    cinFrontB64,
        cinBack:     cinBackB64,
        cinVerified: false,
      });

      setPendingName(pendingFormData.firstName + " " + pendingFormData.lastName);
      setScreen("pending");
    } finally {
      setLoading(false);
    }
  }

  const isClient     = role === "client";
  const isFreelancer = role === "freelancer" && mode === "signup";

  const modalTitle =
    screen === "verify"        ? t("Verify your email 📧") :
    screen === "pending"       ? t("Inscription soumise 📋") :
    screen === "status"        ? (statusUser?.cinStatus === "approved" ? t("Compte approuvé ✅") : t("Compte refusé ❌")) :
    screen === "forgot"        ? t("Reset Password 🔑") :
    screen === "passwordFound" ? t("Password Found ✅") :
    mode === "login"           ? t("Welcome back 👋") :
    isClient                   ? t("Join As A Client 💼") : t("Join As A Freelancer 🚀");

  const modalSubtitle =
    screen === "verify"        ? "" :
    screen === "pending"       ? t("Votre dossier est en cours d'examen") :
    screen === "status"        ? "" :
    screen === "forgot"        ? "" :
    screen === "passwordFound" ? "" :
    mode === "login"           ? t("Log in to access your dashboard") :
    t("Join thousands of professionals today");

  return (
    <Modal open={open} onClose={onClose} size="fullscreen" title={modalTitle} subtitle={modalSubtitle} closable={closable}>

      {/* ── VERIFY EMAIL SCREEN ── */}
      {screen === "verify" && pendingFormData && (
        <VerifyEmailScreen
          email={pendingFormData.email}
          onVerify={handleVerifyCode}
          onBack={() => setScreen("form")}
          loading={loading}
        />
      )}

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
            updateUser(statusUser.email, { statusSeen: true });
            if (statusUser.cinStatus === "approved") {
              onAuth?.(statusUser);
              onClose?.();
            } else {
              setScreen("form");
            }
          }}
          onLogout={() => {
            updateUser(statusUser.email, { statusSeen: true });
            logout();
            setScreen("form");
            setStatusUser(null);
          }}
        />
      )}

      {/* ── FORGOT PASSWORD SCREEN ── */}
      {screen === "forgot" && (
        <ForgotPasswordScreen
          onBack={() => setScreen("form")}
          onSent={(email) => {
            setFoundEmail(email);
            setScreen("passwordFound");
          }}
        />
      )}

      {/* ── PASSWORD FOUND SCREEN ── */}
      {screen === "passwordFound" && (
        <PasswordFoundScreen
          email={foundEmail}
          onBack={() => setScreen("form")}
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
                onClick={() => { setMode(m.id); setErrors({}); setCaptchaToken(null); recaptchaRef.current?.reset(); }}
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

          {/* Form fields */}
          <div className="space-y-3" onKeyDown={handleKey}>
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("Last Name")} placeholder={t("Your last name")}
                  value={form.lastName} onChange={set("lastName")} error={errors.lastName} required
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  }
                />
                <Input
                  label={t("First Name")} placeholder={t("Your first name")}
                  value={form.firstName} onChange={set("firstName")} error={errors.firstName} required
                />
              </div>
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

                {/* ── GENDER SELECTOR ── */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    {t("Genre")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[
                      {
                        id: "male",
                        label: t("Homme"),
                        emoji: "👨",
                        activeClass: "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400",
                      },
                      {
                        id: "female",
                        label: t("Femme"),
                        emoji: "👩",
                        activeClass: "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400",
                      },
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, gender: g.id })); setErrors(err => ({ ...err, gender: "" })); }}
                        className={[
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200",
                          form.gender === g.id
                            ? g.activeClass
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                        ].join(" ")}
                      >
                        <span className="text-base">{g.emoji}</span>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {errors.gender && <p className="mt-1 text-xs text-rose-500">{errors.gender}</p>}
                </div>

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

                {/* CIN Section */}
                <div className="mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {t("Carte d'Identité Nationale")}
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                    {t("Prenez une photo claire de chaque face de votre CIN. La photo doit être nette et bien éclairée.")}
                  </p>

                  <div className="flex gap-3 mb-3">
                    <ImageUploadBox
                      label={t("Face avant")}
                      hint={t("Photo de la face avant")}
                      preview={cinFrontPreview}
                      onFile={f => handleCINFile("front", f)}
                      side="front"
                    />
                    <ImageUploadBox
                      label={t("Face arrière")}
                      hint={t("Retournez la carte et photographiez")}
                      preview={cinBackPreview}
                      onFile={f => handleCINFile("back", f)}
                      side="back"
                    />
                  </div>

                  {cinFrontFile && cinBackFile && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        {t("Les deux photos sont prêtes. L'admin vérifiera votre CIN après soumission.")}
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

            {/* Date of Birth for Client signup */}
            {mode === "signup" && isClient && (
              <Input
                label={t("Date de naissance")}
                type="date"
                value={form.dob}
                onChange={set("dob")}
                error={errors.dob}
                required
              />
            )}

            {/* Gender for Client signup */}
            {mode === "signup" && isClient && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  {t("Genre")} <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "male",   label: t("Homme"), emoji: "👨", activeClass: "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400" },
                    { id: "female", label: t("Femme"), emoji: "👩", activeClass: "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" },
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, gender: g.id })); setErrors(err => ({ ...err, gender: "" })); }}
                      className={[
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200",
                        form.gender === g.id
                          ? g.activeClass
                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                      ].join(" ")}
                    >
                      <span className="text-base">{g.emoji}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="mt-1 text-xs text-rose-500">{errors.gender}</p>}
              </div>
            )}

            {/* CIN for Client signup */}
            {mode === "signup" && isClient && (
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {t("Carte d'Identité Nationale")}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                  {t("Prenez une photo claire de chaque face de votre CIN. La photo doit être nette et bien éclairée.")}
                </p>

                <div className="flex gap-3 mb-3">
                  <ImageUploadBox
                    label={t("Face avant")}
                    hint={t("Photo de la face avant")}
                    preview={cinFrontPreview}
                    onFile={f => handleCINFile("front", f)}
                    side="front"
                  />
                  <ImageUploadBox
                    label={t("Face arrière")}
                    hint={t("Retournez la carte et photographiez")}
                    preview={cinBackPreview}
                    onFile={f => handleCINFile("back", f)}
                    side="back"
                  />
                </div>

                {cinFrontFile && cinBackFile && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      {t("Les deux photos sont prêtes. L'admin vérifiera votre CIN après soumission.")}
                    </p>
                  </div>
                )}

                {errors.cin && (
                  <p className="mt-1.5 text-xs text-rose-500">{errors.cin}</p>
                )}
              </div>
            )}
          </div>

          {/* Forgot password */}
          {mode === "login" && (
            <div className="text-right mt-2">
              <button
                onClick={() => setScreen("forgot")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t("Forgot password?")}
              </button>
            </div>
          )}

          {/* reCAPTCHA — login only */}
          {mode === "login" && (
            <div className="mt-4 overflow-x-hidden">
              <div className="origin-top-left scale-[0.78] w-[128%] sm:scale-100 sm:w-full">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={token => { setCaptchaToken(token); setErrors(err => ({ ...err, captcha: "" })); }}
                  onExpired={() => setCaptchaToken(null)}
                  theme="dark"
                />
              </div>
              {errors.captcha && <p className="mt-1.5 text-xs text-rose-500">{errors.captcha}</p>}
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth className="mt-5" loading={loading} onClick={handleSubmit}>
            {loading ? t("Processing…") : mode === "login" ? t("Log in") : t("Create account")}
          </Button>

          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("By continuing you agree to our")}{" "}
            <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">{t("Terms")}</span>
            {" "}{t("and")}{" "}
            <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">{t("Privacy Policy")}</span>
          </p>
        </>
      )}
    </Modal>
  );
}