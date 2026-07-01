// src/components/AuthModal.jsx
import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";


const RECAPTCHA_SITE_KEY = "6LcBezwtAAAAAPrUKtdxbyCPkPMfHDbzY3HDv3Yc";
const IS_DEV = process.env.REACT_APP_DEV_MODE === 'true';

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

function ImageUploadBox({ label, hint, preview, onFile }) {
  const { t } = useTranslation();
  const inputRef = useRef();
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold mb-1.5" style={{ color: '#a7abc8' }}>{label}</p>
      <div
        onClick={() => inputRef.current.click()}
        className="relative w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden flex flex-col items-center justify-center gap-1"
        style={preview
          ? { borderColor: 'rgba(52,211,153,.6)' }
          : { borderColor: 'rgba(255,255,255,.1)' }
        }
        onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = 'rgba(124,108,246,.5)'; }}
        onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; }}
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
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'rgba(255,255,255,.2)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="text-[11px] text-center px-2" style={{ color: '#62668a' }}>{hint}</span>
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
const API = process.env.REACT_APP_API_URL || "https://famamennou-server.onrender.com/api";

function VerifyEmailScreen({ email, onVerify, onBack, loading }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col py-4 px-2">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs mb-6 w-fit transition-colors"
        style={{ color: '#a7abc8' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fbfbff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#a7abc8')}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {t("Back")}
      </button>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(124,108,246,.12)' }}>
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: '#7c6cf6' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold text-center mb-1" style={{ color: '#fbfbff' }}>{t("Check your email")}</h2>
      <p className="text-xs text-center mb-6" style={{ color: '#a7abc8' }}>
        {t("We sent a 6-digit code to")}{" "}
        <span className="font-semibold" style={{ color: '#fbfbff' }}>{email}</span>
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
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)' }}>
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#fbbf24' }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
          <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>{error}</p>
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
  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState("");
  const [code,            setCode]            = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [resetDone,       setResetDone]       = useState(false);
  const [resetDualRole,   setResetDualRole]   = useState(false);
  const [resendDone,      setResendDone]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [captchaToken,    setCaptchaToken]    = useState(null);
  const forgotRecaptchaRef = useRef();

  async function safeFetch(url, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      try { return await res.json(); }
      catch { return { error: "serverError" }; }
    } catch {
      clearTimeout(t);
      return { error: "serverError" };
    }
  }

  async function handleSendCode() {
    if (!email.trim())                { setError(t("Email is required"));   return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t("Enter a valid email")); return; }
    if (!IS_DEV && !captchaToken)     { setError(t("Please complete the CAPTCHA")); return; }
    setLoading(true);
    try {
      let data = await safeFetch(`${API}/auth/send-reset-code`, { email: email.toLowerCase(), captchaToken });
      if (data.error === "serverError") {
        await new Promise(r => setTimeout(r, 3000));
        data = await safeFetch(`${API}/auth/send-reset-code`, { email: email.toLowerCase() });
      }
      if (data.error === "noAccount")   { setError(t("No account found with this email")); return; }
      if (data.error === "emailFailed") { setError(t("Failed to send email. Try again.")); return; }
      if (data.error === "serverError") { setError(t("Server error. Please try again in a moment.")); return; }
      setStep(2); setError("");
    } catch { setError(t("Network error. Please try again.")); }
    finally  { setLoading(false); }
  }

  async function handleReset() {
    if (!code || code.length !== 6)      { setError(t("Enter the 6-digit code"));  return; }
    if (!newPassword)                    { setError(t("Password is required"));    return; }
    if (newPassword.length < 6)         { setError(t("At least 6 characters"));   return; }
    if (newPassword !== confirmPassword) { setError(t("Passwords do not match")); return; }
    setLoading(true);
    setError("");
    const delays = [0, 2000, 4000];
    for (const delay of delays) {
      try {
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
        const data = await safeFetch(`${API}/auth/reset-password`, { email: email.toLowerCase(), code, newPassword });
        if (data && data.success)                { setResetDualRole(!!data.dualRole); setResetDone(true); setLoading(false); return; }
        if (data && data.error === "noAccount")  { goBackToStep1(); setError(t("No account found with this email")); setLoading(false); return; }
        if (data && data.error === "wrongCode")  { setError(t("Invalid code. Please check and try again.")); setLoading(false); return; }
        if (data && data.error === "expired")    { setError(t("Code expired. Please request a new one.")); setLoading(false); return; }
      } catch { /* keep retrying */ }
    }
    setLoading(false);
    setError(t("Server error. Please try again."));
  }

  async function handleResend() {
    setError("");
    setLoading(true);
    try {
      const data = await safeFetch(`${API}/auth/send-reset-code`, { email: email.toLowerCase() });
      if (data.error) { setError(t("Failed to resend. Please try again.")); return; }
      setCode("");
      setResendDone(true);
    } catch {
      setError(t("Failed to resend. Please try again."));
    } finally { setLoading(false); }
  }

  function goBackToStep1() {
    setStep(1);
    setCode("");
    setError("");
  }

  const handleSend = step === 1 ? handleSendCode : handleReset;

  if (resendDone) return (
    <div className="flex flex-col items-center py-10 px-2 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(124,108,246,.12)' }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#7c6cf6' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("auth.code_resent_title")}</h2>
      <p className="text-sm mb-1" style={{ color: '#a7abc8' }}>{t("auth.code_resent_msg")}</p>
      <p className="text-sm font-bold mb-6" style={{ color: '#fbfbff' }}>{email}</p>
      <p className="text-xs mb-6" style={{ color: '#62668a' }}>{t("auth.code_resent_hint")}</p>
      <button onClick={() => setResendDone(false)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#7c6cf6' }}>
        {t("auth.enter_code")}
      </button>
    </div>
  );

  if (resetDone) return (
    <div className="flex flex-col items-center py-10 px-2 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(52,211,153,.12)' }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#34d399' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("auth.pw_reset_title")}</h2>
      <p className="text-sm mb-1" style={{ color: '#a7abc8' }}>{resetDualRole ? t("auth.pw_reset_msg_dual") : t("auth.pw_reset_msg")}</p>
      <p className="text-xs mb-6" style={{ color: '#62668a' }}>{resetDualRole ? t("auth.pw_reset_hint_dual") : t("auth.pw_reset_hint")}</p>
      <button onClick={() => onSent(email, resetDualRole)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#7c6cf6' }}>
        {t("auth.sign_in_arrow")}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col py-4 px-2">
      <button onClick={step === 2 ? goBackToStep1 : onBack}
        className="flex items-center gap-1.5 text-xs mb-6 w-fit transition-colors"
        style={{ color: '#a7abc8' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fbfbff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#a7abc8')}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {step === 2 ? t("Back") : t("Back to login")}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5 mx-auto">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={step >= s
                ? { background: '#7c6cf6', color: '#fff' }
                : { background: 'rgba(255,255,255,.08)', color: '#62668a' }
              }>{s}</div>
            {s < 2 && <div className="w-10 h-0.5 rounded transition-all duration-500"
              style={{ background: step >= 2 ? '#7c6cf6' : 'rgba(255,255,255,.08)' }} />}
          </div>
        ))}
      </div>

      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(124,108,246,.12)' }}>
        {step === 1
          ? <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: '#7c6cf6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          : <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: '#7c6cf6' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
        }
      </div>

      <h2 className="text-lg font-extrabold text-center mb-1" style={{ color: '#fbfbff' }}>
        {step === 1 ? t("Forgot your password?") : t("Verify your identity 🔐")}
      </h2>
      <p className="text-xs text-center mb-6" style={{ color: '#a7abc8' }}>
        {step === 1
          ? t("reset.subtitle")
          : <>{t("We sent a 6-digit code to")} <span className="font-semibold" style={{ color: '#fbfbff' }}>{email}</span></>
        }
      </p>

      <div className="space-y-3">
        {step === 1 && (
          <Input
            label={t("Email address")} type="email" placeholder={t("you@example.com")}
            value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required
            leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
          />
        )}

        {step === 2 && (<>
          <Input
            label={t("Verification code")} placeholder="123456" maxLength={6}
            autoComplete="off" inputMode="numeric"
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
            required
          />
          <Input
            label={t("reset.new_password")} type="password" placeholder={t("auth.new_password_ph")}
            autoComplete="new-password" data-lpignore="true" data-form-type="other"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setError(""); }}
            required
          />
          <Input
            label={t("Confirm password")} type="password" placeholder={t("auth.repeat_new_password_ph")}
            autoComplete="new-password" data-lpignore="true" data-form-type="other"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
            required
          />
        </>)}
      </div>

      {step === 1 && !IS_DEV && (
        <div className="mt-4 overflow-x-hidden">
          <div className="origin-top-left scale-[0.78] w-[128%] sm:scale-100 sm:w-full">
            <ReCAPTCHA
              ref={forgotRecaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={token => { setCaptchaToken(token); setError(""); }}
              onExpired={() => setCaptchaToken(null)}
              theme="dark"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)' }}>
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#fbbf24' }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
          <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>{error}</p>
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth className="mt-4" loading={loading} onClick={handleSend}>
        {loading
          ? t("Processing…")
          : step === 1 ? t("Envoyer le code") : t("Réinitialiser le mot de passe")
        }
      </Button>

      {step === 2 && (
        <div className="mt-3 text-center">
          <button onClick={handleResend} disabled={loading}
            className="text-xs transition-colors disabled:opacity-40"
            style={{ color: '#9b8cff' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#b9aeff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9b8cff')}
          >
            {t("Renvoyer le code")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Password Reset Success Screen ────────────────────────────────────────────
function PasswordFoundScreen({ email, dualRole, onBack }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center py-6 px-2 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(52,211,153,.12)' }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: '#34d399' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 className="text-lg font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("reset.success_title")}</h2>
      <p className="text-xs mb-1" style={{ color: '#a7abc8' }}>
        <span className="font-bold" style={{ color: '#fbfbff' }}>{email}</span>
      </p>
      <p className="text-sm mt-3 mb-6 max-w-xs leading-relaxed" style={{ color: '#a7abc8' }}>
        {dualRole ? t("reset.success_msg_dual") : t("reset.success_msg")}
      </p>
      <button onClick={onBack} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#7c6cf6' }}>
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
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,.12)' }}>
          <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#f59e0b' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#f59e0b' }}>
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        </span>
      </div>
      <h2 className="text-xl font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("Account created successfully!")}</h2>
      <p className="text-sm font-semibold mb-4" style={{ color: '#f59e0b' }}>{t("Under review…")}</p>
      <p className="text-sm max-w-xs mb-6 leading-relaxed" style={{ color: '#a7abc8' }}>
        {t("Hello")} <span className="font-bold" style={{ color: '#fbfbff' }}>{userName}</span>{t(", your file has been submitted. Our team will review your information and CIN shortly.")}
      </p>
      <div className="w-full max-w-xs space-y-2 mb-7">
        {[
          { icon: "✅", label: t("Account created"),          done: true  },
          { icon: "🔍", label: t("Verification in progress"), done: false, active: true },
          { icon: "📬", label: t("Admin decision"),           done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={step.done
              ? { background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', color: '#34d399' }
              : step.active
              ? { background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#fbbf24' }
              : { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', color: '#62668a' }
            }
          >
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
      <p className="text-xs mb-5" style={{ color: '#62668a' }}>
        {t("You will be notified once your account is approved or rejected.")}
      </p>
      <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#7c6cf6' }}>
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
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,.12)' }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#34d399' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#34d399' }}>
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </span>
        </div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("Account approved! 🎉")}</h2>
        <p className="text-sm font-semibold mb-4" style={{ color: '#34d399' }}>{t("Your verification has been accepted")}</p>
        {user.cinApprovalReason && (
          <div className="w-full max-w-xs p-3.5 rounded-xl mb-5 text-left" style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>{t("Admin message")}</p>
            <p className="text-sm font-medium" style={{ color: '#6ee7b7' }}>{user.cinApprovalReason}</p>
          </div>
        )}
        <p className="text-sm max-w-xs mb-7 leading-relaxed" style={{ color: '#a7abc8' }}>
          {t("Welcome to the platform,")} <span className="font-bold" style={{ color: '#fbfbff' }}>{user.name}</span>{t("! Your account is now fully active.")}
        </p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#34d399' }}>
          {t("Access my account →")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(248,113,113,.12)' }}>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#f87171' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#f87171' }}>
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </span>
      </div>
      <h2 className="text-xl font-extrabold mb-2" style={{ color: '#fbfbff' }}>{t("Account rejected")}</h2>
      <p className="text-sm font-semibold mb-4" style={{ color: '#f87171' }}>{t("Your verification was not accepted")}</p>
      {user.cinRejectionReason && (
        <div className="w-full max-w-xs p-3.5 rounded-xl mb-5 text-left" style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>{t("Rejection reason")}</p>
          <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>{user.cinRejectionReason}</p>
        </div>
      )}
      <p className="text-sm max-w-xs mb-7 leading-relaxed" style={{ color: '#a7abc8' }}>
        {t("If you believe this is an error, please contact us or create a new account with correct information.")}
      </p>
      <button onClick={onLogout} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: '#f87171' }}>
        {t("Close")}
      </button>
    </div>
  );
}

// ── Device Approval Waiting Screen ────────────────────────────────────────────
function DeviceApprovalScreen({ attemptId, device, onApproved, onBack }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'approved' | 'rejected' | 'expired' | 'error'
  const [dots,   setDots]   = useState('');

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(id);
  }, []);

  // Poll every 3 seconds
  useEffect(() => {
    if (status !== 'waiting') return;
    const poll = async () => {
      try {
        const res  = await fetch(`${API}/auth/check-approval/${attemptId}`);
        const data = await res.json();
        if (data.status === 'approved')  { onApproved(data.user, data.accessToken); setStatus('approved'); }
        else if (data.status === 'rejected') setStatus('rejected');
        else if (data.status === 'expired')  setStatus('expired');
      } catch {}
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [attemptId, status, onApproved]);

  const iconBg   = status === 'rejected' || status === 'expired' ? 'rgba(248,113,113,.12)' : 'rgba(124,108,246,.12)';
  const iconColor = status === 'rejected' || status === 'expired' ? '#f87171' : '#7c6cf6';

  return (
    <div className="flex flex-col py-4 px-2">
      {status === 'waiting' && (
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs mb-6 w-fit transition-colors"
          style={{ color: '#a7abc8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fbfbff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#a7abc8')}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {t("Back")}
        </button>
      )}

      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ background: iconBg }}>
        {status === 'waiting' && (
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: iconColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        )}
        {(status === 'rejected' || status === 'expired' || status === 'error') && (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: iconColor }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        )}
      </div>

      {status === 'waiting' && (<>
        <h2 className="text-lg font-extrabold text-center mb-1" style={{ color: '#fbfbff' }}>{t("device.check_email")}</h2>
        <p className="text-xs text-center mb-5" style={{ color: '#a7abc8' }}>
          <Trans i18nKey="device.security_sent" components={{ b: <strong style={{ color: '#fbfbff' }} /> }} />
        </p>

        {/* Device info card */}
        {device && (
          <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            {[
              [`🌐 ${t("device.browser")}`, `${device.browser} · ${device.deviceType}`],
              ['💻 OS', device.os],
              [`📡 ${t("device.ip")}`, device.ip || t("device.unknown")],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#62668a' }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: '#f4f3fb' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Spinner */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#7c6cf6' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: '#a7abc8' }}>
            {t("device.waiting_approval")}{dots}
          </span>
        </div>

        <p className="text-xs text-center" style={{ color: '#4a4e6e' }}>
          <Trans i18nKey="device.link_expires" components={{ b: <strong /> }} />
        </p>
      </>)}

      {status === 'rejected' && (<>
        <h2 className="text-lg font-extrabold text-center mb-2" style={{ color: '#fbfbff' }}>{t("device.login_refused")}</h2>
        <p className="text-sm text-center mb-6" style={{ color: '#f87171' }}>
          {t("device.attempt_rejected")}
        </p>
        <p className="text-xs text-center mb-6" style={{ color: '#62668a' }}>
          {t("device.retry_approve")}
        </p>
        <button onClick={onBack}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#7c6cf6' }}>
          {t("Back to login")}
        </button>
      </>)}

      {(status === 'expired' || status === 'error') && (<>
        <h2 className="text-lg font-extrabold text-center mb-2" style={{ color: '#fbfbff' }}>{t("device.link_expired")}</h2>
        <p className="text-sm text-center mb-6" style={{ color: '#a7abc8' }}>
          {t("device.link_expired_msg")}
        </p>
        <button onClick={onBack}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#7c6cf6' }}>
          {t("device.retry")}
        </button>
      </>)}
    </div>
  );
}

// ── TOTP 2FA entry screen ─────────────────────────────────────────────────────
function TOTPScreen({ pendingToken, onSuccess, onBack, verifyTOTP, loginWithUserData }) {
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);
  const { t } = useTranslation();

  async function handleVerify() {
    if (code.length !== 6) { setError(t("Enter the 6-digit code")); return; }
    setBusy(true); setError("");
    const result = await verifyTOTP(pendingToken, code);
    setBusy(false);
    if (result.error === "invalidTOTP") { setError(t("Invalid code. Try again.")); return; }
    if (result.error) { setError(t("Verification failed. Please try again.")); return; }
    const loggedUser = loginWithUserData(result.user);
    onSuccess?.(loggedUser);
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
      <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
        {t("Two-Factor Authentication")}
      </h3>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>
        {t("Enter the 6-digit code from your authenticator app.")}
      </p>
      <input
        style={{
          width: "100%", padding: "14px", borderRadius: 12, fontSize: 24,
          letterSpacing: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)", color: "inherit", outline: "none",
          boxSizing: "border-box",
        }}
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="------"
        value={code}
        onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
        onKeyDown={e => e.key === "Enter" && handleVerify()}
        autoFocus
      />
      {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>}
      <button
        onClick={handleVerify}
        disabled={busy || code.length !== 6}
        style={{
          width: "100%", marginTop: 16, padding: "14px", borderRadius: 12,
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
          fontWeight: 700, fontSize: 15, border: "none",
          cursor: busy || code.length !== 6 ? "not-allowed" : "pointer",
          opacity: busy || code.length !== 6 ? 0.7 : 1,
        }}
      >
        {busy ? `${t("Verifying")}…` : t("Verify")}
      </button>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: "#94a3b8", marginTop: 12, cursor: "pointer", fontSize: 13 }}
      >
        ← {t("Back")}
      </button>
    </div>
  );
}

export default function AuthModal({ open, onClose, onAuth, defaultMode = "login", closable = true }) {
  const [mode,           setMode]           = useState(defaultMode);
  const [role,           setRole]           = useState("freelancer");
  const [freelancerType, setFreelancerType] = useState("freelancer");
  const [loading,        setLoading]        = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form,    setForm]    = useState({
    lastName: "", firstName: "", email: "", password: "", confirmPassword: "",
    skills: "", bio: "", dob: "", region: "", gender: "",
  });

  // screen: "form" | "verify" | "pending" | "status" | "forgot" | "passwordFound" | "deviceApproval" | "totp" | "roleSelect"
  const [screen,            setScreen]            = useState("form");
  const [pendingName,       setPendingName]       = useState("");
  const [pendingFormData,   setPendingFormData]   = useState(null);
  const [statusUser,        setStatusUser]        = useState(null);
  const [foundEmail,        setFoundEmail]        = useState("");
  const [foundDualRole,     setFoundDualRole]     = useState(false);
  const [pendingApproval,   setPendingApproval]   = useState(null); // { attemptId, device }
  const [pendingTOTPToken,  setPendingTOTPToken]  = useState(null); // { pendingToken }
  const [roleSelectData,    setRoleSelectData]    = useState(null); // { roles, selectionToken, email, password }

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef();

  // CIN state
  const [cinFrontFile,    setCinFrontFile]    = useState(null);
  const [cinBackFile,     setCinBackFile]     = useState(null);
  const [cinFrontPreview, setCinFrontPreview] = useState(null);
  const [cinBackPreview,  setCinBackPreview]  = useState(null);

  const { t }                        = useTranslation();
  const { register, login, verifyTOTP, loginWithUserData, logout, updateUser } = useAuth();

  const ROLES = [
    {
      id: "client", label: t("Client"),
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
      id: "freelancer", label: t("Freelancer"),
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
    setFreelancerType("freelancer");
    resetCIN();
    setScreen("form");
    setPendingName("");
    setPendingFormData(null);
    setStatusUser(null);
    setPendingApproval(null);
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
    else if (mode === "signup" && form.password.length < 8)
      errs.password = t("Password must be at least 8 characters");
    else if (mode === "signup" && !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password))
      errs.password = t("Password must contain at least one number or special character");
    else if (mode === "login" && form.password.length < 6)
      errs.password = t("At least 6 characters");
    if (mode === "signup" && form.password !== form.confirmPassword)
      errs.confirmPassword = t("Passwords do not match");
    if (mode === "signup") {
      if (!form.dob)    errs.dob    = t("Date of birth is required");
      if (!form.gender) errs.gender = t("Please select your gender");
      if (!IS_DEV && (!cinFrontFile || !cinBackFile))
        errs.cin = t("Please upload both sides of your CIN");
    }
    if (mode === "signup" && role === "freelancer") {
      if (!form.skills.trim()) errs.skills = t("Please enter at least one skill");
      if (!form.region)        errs.region = t("Please select your region");
    }
    if (!IS_DEV && !captchaToken)
      errs.captcha = t("Please complete the CAPTCHA");
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (IS_DEV) {
          // In dev mode: skip email verification, register and auto-login
          await register({
            name:        form.firstName + " " + (form.lastName || ''),
            email:       form.email,
            password:    form.password,
            role,
            dob:         form.dob,
            region:      form.region,
            gender:      form.gender,
            skills:      form.skills,
            bio:         form.bio,
            cin:         "",
            cinFront:    null,
            cinBack:     null,
            cinVerified: false,
          });
          const loginResult = await login(form.email, form.password);
          if (loginResult.success) {
            onAuth?.(loginResult.user);
            onClose?.();
          } else {
            onClose?.();
          }
          return;
        }
        const res = await fetch(`${API}/auth/send-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, captchaToken, role }),
        });
        const data = await res.json();
        if (data.error === 'emailTaken') {
          setErrors({ email: t("An account with this email already exists.") });
          recaptchaRef.current?.reset();
          setCaptchaToken(null);
          return;
        }
        if (data.error) {
          setErrors({ email: t("Failed to send verification email. Try again.") });
          return;
        }
        setPendingFormData({ ...form, role, freelancerType });
        setScreen("verify");
        return;
      }

      // LOGIN
      const result = await login(form.email, form.password, undefined, captchaToken);
      if (result.error === "noAccount") {
        setErrors({ email: t("No account found with this email") });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      if (result.error === "accountLocked") {
        setErrors({ email: t("Account locked due to too many failed attempts. Try again in {{m}} minutes.", { m: result.minutesLeft ?? 30 }) });
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
      if (result.error === "invalidCaptcha") {
        setErrors({ captcha: t("CAPTCHA expired or invalid. Please complete it again.") });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      // Multiple accounts — show role picker
      if (result.requiresRoleSelect) {
        setRoleSelectData({ roles: result.roles, selectionToken: result.selectionToken, email: form.email, password: form.password });
        setScreen("roleSelect");
        return;
      }

      // 2FA required — show TOTP entry screen
      if (result.requiresTOTP) {
        setPendingTOTPToken(result.pendingToken);
        setScreen("totp");
        return;
      }

      // New device — show approval waiting screen
      if (result.pending) {
        setPendingApproval({ attemptId: result.attemptId, device: result.device });
        setScreen("deviceApproval");
        return;
      }

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

  async function handleRoleSelect(selectedRole) {
    if (!roleSelectData) return;
    setLoading(true);
    try {
      const result = await login(roleSelectData.email, roleSelectData.password, undefined, null, selectedRole, roleSelectData.selectionToken);
      if (result.error) {
        setErrors({ email: t("Login failed. Please try again.") });
        setScreen("form");
        return;
      }
      if (result.requiresTOTP) {
        setPendingTOTPToken(result.pendingToken);
        setScreen("totp");
        return;
      }
      if (result.pending) {
        setPendingApproval({ attemptId: result.attemptId, device: result.device });
        setScreen("deviceApproval");
        return;
      }
      if (!result.user) { setErrors({ email: t("Login failed. Please try again.") }); setScreen("form"); return; }
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

      const regResult = await register({
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

      // Registration actually failed — show the real reason instead of a fake success screen
      if (regResult?.error) {
        const messages = {
          emailTaken:        t("An account with this email already exists."),
          passwordTooShort:  t("Password must be at least 8 characters."),
          missing:           t("Please fill in all required fields."),
          networkError:      t("Network error. Please check your connection and try again."),
          serverError:       t("Something went wrong. Please try again."),
          too_many_requests: t("Too many attempts. Please wait a few minutes and try again."),
          validation_error:  t("Some information you entered isn't valid. Please check the form and try again."),
        };
        setCodeError(messages[regResult.error] || t("Registration failed ({{error}}). Please try again.", { error: regResult.error }));
        return;
      }

      if (process.env.REACT_APP_DEV_MODE === 'true') {
        setScreen("form");
        if (onClose) onClose();
        return;
      }
      setPendingName(pendingFormData.firstName + " " + pendingFormData.lastName);
      setScreen("pending");
    } finally {
      setLoading(false);
    }
  }

  const isClient     = role === "client";
  const isFreelancer = role === "freelancer" && mode === "signup";

  const loginTitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {t("Welcome back")}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7c6cf6', flexShrink: 0 }}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    </span>
  );

  const modalTitle =
    screen === "verify"          ? t("Verify your email 📧") :
    screen === "pending"         ? t("Inscription soumise 📋") :
    screen === "status"          ? (statusUser?.cinStatus === "approved" ? t("Compte approuvé ✅") : t("Compte refusé ❌")) :
    screen === "forgot"          ? t("Reset Password 🔑") :
    screen === "passwordFound"   ? t("Password Found ✅") :
    screen === "deviceApproval"  ? t("device.modal_title") :
    screen === "roleSelect"      ? t("Choose account") :
    mode === "login"           ? loginTitle :
    isClient ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        {t("Join as a client")}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7c6cf6', flexShrink: 0 }}>
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        {t("Join as a freelancer")}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7c6cf6', flexShrink: 0 }}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </svg>
      </span>
    );

  const modalSubtitle =
    screen === "verify"         ? "" :
    screen === "pending"        ? t("Votre dossier est en cours d'examen") :
    screen === "status"         ? "" :
    screen === "forgot"         ? "" :
    screen === "passwordFound"  ? "" :
    screen === "deviceApproval" ? "" :
    mode === "login"           ? t("Log in to access your dashboard.") :
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

      {/* ── ROLE SELECT SCREEN ── */}
      {screen === "roleSelect" && roleSelectData && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
          <p style={{ color: '#a7abc8', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
            {t("This email has multiple accounts. Choose which one to log into:")}
          </p>
          {roleSelectData.roles.map(r => (
            <button
              key={r}
              disabled={loading}
              onClick={() => handleRoleSelect(r)}
              style={{
                width: '100%', maxWidth: '320px', padding: '16px 24px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontWeight: '700', fontSize: '15px',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                textTransform: 'capitalize', opacity: loading ? 0.6 : 1,
              }}
            >
              {r === 'freelancer' ? t("Freelancer") : t("Client")}
            </button>
          ))}
          <button
            onClick={() => setScreen("form")}
            style={{ background: 'none', border: 'none', color: '#7c6cf6', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}
          >
            {t("Back")}
          </button>
        </div>
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
          onSent={(email, dualRole) => {
            setFoundEmail(email);
            setFoundDualRole(!!dualRole);
            setScreen("passwordFound");
          }}
        />
      )}

      {/* ── PASSWORD FOUND SCREEN ── */}
      {screen === "passwordFound" && (
        <PasswordFoundScreen
          email={foundEmail}
          dualRole={foundDualRole}
          onBack={() => setScreen("form")}
        />
      )}

      {/* ── 2FA TOTP SCREEN ── */}
      {screen === "totp" && (
        <TOTPScreen
          pendingToken={pendingTOTPToken}
          onSuccess={(rawUser) => {
            onAuth?.(rawUser);
            onClose?.();
          }}
          onBack={() => { setPendingTOTPToken(null); setScreen("form"); }}
          verifyTOTP={verifyTOTP}
          loginWithUserData={loginWithUserData}
        />
      )}

      {/* ── DEVICE APPROVAL SCREEN ── */}
      {screen === "deviceApproval" && pendingApproval && (
        <DeviceApprovalScreen
          attemptId={pendingApproval.attemptId}
          device={pendingApproval.device}
          onApproved={(rawUser, accessToken) => {
            const loggedUser = loginWithUserData(rawUser, accessToken);
            onAuth?.(loggedUser);
            onClose?.();
          }}
          onBack={() => { setPendingApproval(null); setScreen("form"); }}
        />
      )}

      {/* ── NORMAL FORM ── */}
      {screen === "form" && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
            {[{ id: "login", label: t("Log in") }, { id: "signup", label: t("Sign up") }].map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setErrors({}); setCaptchaToken(null); recaptchaRef.current?.reset(); }}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200"
                style={mode === m.id
                  ? { background: '#7c6cf6', color: '#fff' }
                  : { background: 'transparent', color: '#a7abc8' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Role toggle */}
          {mode === "signup" && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{ color: '#62668a' }}>
                {t("auth.joining_as")}
              </p>
              <div
                className="flex items-center w-full rounded-xl p-1 gap-1"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
              >
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setErrors({}); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={role === r.id
                      ? { background: '#7c6cf6', color: '#fff' }
                      : { background: 'transparent', color: '#a7abc8' }
                    }
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-center mt-2 text-xs font-medium" style={{ color: '#9b8cff' }}>
                {isClient ? t("Looking to hire talent") : t("Looking for work & clients")}
              </p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3" onKeyDown={handleKey}>

            {/* Last name + First name */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("Last name")} placeholder={t("Your last name")}
                  value={form.lastName} onChange={set("lastName")} error={errors.lastName} required
                />
                <Input
                  label={t("First name")} placeholder={t("Your first name")}
                  value={form.firstName} onChange={set("firstName")} error={errors.firstName} required
                />
              </div>
            )}

            {/* Email */}
            <Input
              label={t("Email address")} type="email" placeholder="you@example.com"
              value={form.email} onChange={set("email")} error={errors.email} required
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              }
            />

            {/* Password — login: single with lock icon; signup: 2-col grid */}
            {mode === "login" ? (
              <Input
                label={t("Password")} type="password" placeholder={t("Enter your password")}
                value={form.password} onChange={set("password")} error={errors.password} required
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("Password")} type="password" placeholder={t("Password")}
                  value={form.password} onChange={set("password")} error={errors.password} required
                />
                <Input
                  label={t("Confirm password")} type="password" placeholder={t("Repeat your password")}
                  value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} required
                />
              </div>
            )}

            {/* Date of birth + Gender — signup only, 2-col grid */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("Date of birth")} type="date"
                  value={form.dob} onChange={set("dob")} error={errors.dob} required
                />
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#dcdef0', fontWeight: 700 }}>
                    {t("Gender")} <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Male — blue when selected */}
                    <button
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, gender: 'male' })); setErrors(err => ({ ...err, gender: "" })); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={form.gender === 'male'
                        ? { background: 'rgba(14,165,233,0.18)', color: '#38bdf8', border: '2px solid rgba(14,165,233,0.55)', boxShadow: '0 0 12px rgba(14,165,233,0.2)' }
                        : { background: 'transparent', border: '2px solid rgba(255,255,255,.1)', color: '#a7abc8' }
                      }
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="10" cy="14" r="5"/><line x1="19" y1="5" x2="14.65" y2="9.35"/><polyline points="15 5 19 5 19 9"/>
                      </svg>
                      {t("Male")}
                    </button>
                    {/* Female — pink/rose when selected */}
                    <button
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, gender: 'female' })); setErrors(err => ({ ...err, gender: "" })); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={form.gender === 'female'
                        ? { background: 'rgba(244,114,182,0.18)', color: '#f472b6', border: '2px solid rgba(244,114,182,0.55)', boxShadow: '0 0 12px rgba(244,114,182,0.2)' }
                        : { background: 'transparent', border: '2px solid rgba(255,255,255,.1)', color: '#a7abc8' }
                      }
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
                      </svg>
                      {t("Female")}
                    </button>
                  </div>
                  {errors.gender && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.gender}</p>}
                </div>
              </div>
            )}

            {/* Type toggle — freelancer signup only */}
            {isFreelancer && (
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#dcdef0', fontWeight: 700 }}>
                  {t("Type")} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "freelancer", label: t("Freelancer") },
                    { id: "instructor", label: t("Instructor") },
                  ].map(ft => (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => setFreelancerType(ft.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={freelancerType === ft.id
                        ? { background: '#7c6cf6', color: '#fff', border: '2px solid #7c6cf6' }
                        : { background: 'transparent', border: '2px solid rgba(255,255,255,.1)', color: '#a7abc8' }
                      }
                    >
                      {freelancerType === ft.id && (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Region — freelancer signup only */}
            {isFreelancer && (
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#dcdef0', fontWeight: 700 }}>
                  {t("Region")} <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.region}
                    onChange={e => { setForm(f => ({ ...f, region: e.target.value })); setErrors(err => ({ ...err, region: "" })); }}
                    className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-[rgba(124,108,246,0.25)] transition-colors duration-200"
                    style={{
                      background: '#15122c',
                      border: errors.region ? '1px solid rgba(248,113,113,.6)' : '1px solid rgba(255,255,255,.12)',
                      color: form.region ? '#f4f3fb' : '#62668a',
                    }}
                  >
                    <option value="" style={{ background: '#15122c' }}>{t("Select your governorate")}</option>
                    {TUNISIAN_REGIONS.map(r => (
                      <option key={r} value={r} style={{ background: '#15122c' }}>{r}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#62668a' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                {errors.region && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.region}</p>}
              </div>
            )}

            {/* CIN section — all signup roles */}
            {mode === "signup" && (
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.08)' }} />
                  <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: '#62668a' }}>
                    {t("auth.cin_section")}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.08)' }} />
                </div>
                <p className="text-xs mb-3 text-center" style={{ color: '#a7abc8' }}>
                  {t("Take a clear photo of each side of your CIN. Must be sharp and well lit.")}
                </p>
                <div className="flex gap-3 mb-3">
                  <ImageUploadBox
                    label={t("Front side")}
                    hint={t("Photo of the front")}
                    preview={cinFrontPreview}
                    onFile={f => handleCINFile("front", f)}
                  />
                  <ImageUploadBox
                    label={t("Back side")}
                    hint={t("Flip and photograph")}
                    preview={cinBackPreview}
                    onFile={f => handleCINFile("back", f)}
                  />
                </div>
                {cinFrontFile && cinBackFile && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)' }}>
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#34d399' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold" style={{ color: '#34d399' }}>
                      {t("Both photos are ready. Admin will verify your CIN after submission.")}
                    </p>
                  </div>
                )}
                {errors.cin && (
                  <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.cin}</p>
                )}
              </div>
            )}

            {/* Skills + Bio — freelancer signup only */}
            {isFreelancer && (
              <>
                <Input
                  label={t("Your skills")} placeholder="e.g. React, Figma, SEO"
                  value={form.skills} onChange={set("skills")} error={errors.skills} required
                />
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: '#dcdef0', fontWeight: 700 }}>
                    {t("Short bio")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("Tell clients about yourself...")}
                    value={form.bio}
                    onChange={set("bio")}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(124,108,246,0.25)] focus:border-[#7c6cf6] transition-all duration-200 placeholder-[#4a4e6a]"
                    style={{
                      background: '#15122c',
                      border: '1px solid rgba(255,255,255,.12)',
                      color: '#f4f3fb',
                    }}
                  />
                </div>
              </>
            )}

          </div>

          {/* Forgot password */}
          {mode === "login" && (
            <div className="text-right mt-2">
              <button
                onClick={() => setScreen("forgot")}
                className="text-xs transition-colors"
                style={{ color: '#9b8cff' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#b9aeff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9b8cff')}
              >
                {t("Forgot password?")}
              </button>
            </div>
          )}

          {/* reCAPTCHA — login + signup */}
          {!IS_DEV && (
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
              {errors.captcha && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{errors.captcha}</p>}
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth className="mt-5" loading={loading} onClick={handleSubmit}>
            {loading ? t("Processing…") : mode === "login" ? t("Log in") : t("Create account")}
          </Button>

          <p className="mt-3 text-center text-xs" style={{ color: '#62668a' }}>
            {t("By continuing you agree to our")}{" "}
            <span className="cursor-pointer" style={{ color: '#9b8cff' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              {t("Terms")}
            </span>
            {" "}{t("and")}{" "}
            <span className="cursor-pointer" style={{ color: '#9b8cff' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              {t("Privacy Policy")}
            </span>
          </p>
        </>
      )}
    </Modal>
  );
}
