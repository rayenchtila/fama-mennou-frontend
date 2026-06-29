import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_API_URL || "https://famamennou-server.onrender.com/api";

export default function TwoFASetup({ onDone }) {
  const { t } = useTranslation();
  const { user, authFetch } = useAuth();
  const [step, setStep] = useState("idle"); // idle | loading | scan | verify | done | disable
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isDark = document.documentElement.classList.contains("dark");
  const bg    = isDark ? "#1e1b2e" : "#f8f6ff";
  const card  = isDark ? "#2a2540" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text  = isDark ? "#f4f3fb" : "#1e1b2e";
  const sub   = isDark ? "#a7abc8" : "#6b7280";
  const inp   = isDark ? "#13102a" : "#f1f5f9";

  async function setup() {
    setBusy(true); setError(null);
    try {
      const res  = await authFetch(`${API}/2fa/setup`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.error) return setError(data.error === "already_enabled" ? t("twofa.already_enabled") : data.error);
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("scan");
    } catch { setError(t("twofa.network_error")); }
    finally { setBusy(false); }
  }

  async function enable() {
    if (code.length !== 6) return setError(t("twofa.enter_6_digits"));
    setBusy(true); setError(null);
    try {
      const res  = await authFetch(`${API}/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code, secret }),
      });
      const data = await res.json();
      if (data.error) return setError(t("twofa.invalid_code"));
      setStep("done");
      onDone?.("enabled");
    } catch { setError(t("twofa.network_error")); }
    finally { setBusy(false); }
  }

  async function disable() {
    if (!password) return setError(t("twofa.enter_password"));
    setBusy(true); setError(null);
    try {
      const res  = await authFetch(`${API}/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.error) return setError(data.error === "wrong_password" ? t("twofa.wrong_password") : data.error);
      setStep("idle");
      onDone?.("disabled");
    } catch { setError(t("twofa.network_error")); }
    finally { setBusy(false); }
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 15,
    background: inp, border: `1px solid ${border}`, color: text,
    outline: "none", boxSizing: "border-box",
    letterSpacing: step === "scan" ? 6 : 0,
    textAlign: step === "scan" ? "center" : "left",
  };
  const btnStyle = {
    width: "100%", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700,
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
    border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
  };

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🔐</span>
        <div>
          <div style={{ fontWeight: 700, color: text, fontSize: 16 }}>{t("twofa.title")}</div>
          <div style={{ fontSize: 13, color: sub }}>
            {step === "done" ? t("twofa.enabled_success") : t("twofa.protect_account")}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      {step === "idle" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btnStyle} onClick={setup} disabled={busy}>
            {busy ? t("twofa.loading") : t("twofa.enable")}
          </button>
          <button
            style={{ ...btnStyle, background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
            onClick={() => { setStep("disable"); setError(null); }}
          >
            {t("twofa.disable")}
          </button>
        </div>
      )}

      {step === "scan" && qrDataUrl && (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: sub, fontSize: 14, marginBottom: 12 }}>
            <Trans i18nKey="twofa.scan_steps" components={{ b: <strong />, br: <br /> }} />
          </p>
          <img src={qrDataUrl} alt="QR 2FA" style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 12 }} />
          <p style={{ color: sub, fontSize: 12, marginBottom: 16 }}>
            {t("twofa.manual_key")} <code style={{ fontFamily: "monospace", fontSize: 12 }}>{secret}</code>
          </p>
          <p style={{ color: sub, fontSize: 14, marginBottom: 8 }}>{t("twofa.enter_code_step")}</p>
          <input
            style={inputStyle}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button style={{ ...btnStyle, marginTop: 12 }} onClick={enable} disabled={busy || code.length !== 6}>
            {busy ? t("twofa.verifying") : t("twofa.confirm_enable")}
          </button>
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", color: "#10b981", fontWeight: 700, fontSize: 16, padding: "12px 0" }}>
          {t("twofa.done_msg")}
        </div>
      )}

      {step === "disable" && (
        <div>
          <p style={{ color: sub, fontSize: 14, marginBottom: 8 }}>{t("twofa.confirm_disable")}</p>
          <input
            style={inputStyle}
            type="password"
            placeholder={t("Password")}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button style={{ ...btnStyle, background: "linear-gradient(135deg,#ef4444,#dc2626)" }} onClick={disable} disabled={busy}>
              {busy ? "…" : t("twofa.disable")}
            </button>
            <button style={{ ...btnStyle, background: "#6b7280" }} onClick={() => { setStep("idle"); setError(null); }}>
              {t("twofa.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
