// src/components/AuthModal.jsx
//
// Log in / sign up, redesigned after the supplied Stitch screens (split view: brand panel + form).
// The presentation lives in ./auth/*:
//   AuthShell      the dialog: header, brand panel, form column
//   AuthControls   fields, select, checkbox, segmented control, buttons, the 6-cell code field
//   AuthScreens    the e-mail code, forgot-password, status, 2-step and device screens
//   DocumentStep   a freelancer's identity document: one of four kinds, one or two photos
//   Turnstile      the invisible Cloudflare security check (replaced reCAPTCHA)
//
// The sign-up flow: form → (freelancer: identity document) → the e-mailed code, which verifies
// itself when the sixth digit is in → the account is created → the LOG-IN page, with the e-mail
// filled in. Signing up never signs anyone in, whether by password or with Google.
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import Icon from "./ds/Icon";
import { TUNISIAN_REGIONS } from "../utils/regions";
import { firstWord, validateFullName, NAME_ERROR_KEY } from "../utils/names";
import { validateDob, dobBounds, DOB_ERROR_KEY } from "../utils/age";
import { DEFAULT_ID_DOCUMENT, sidesFor, MAX_DOCUMENT_FILE_BYTES } from "../utils/idDocuments";
import AuthShell from "./auth/AuthShell";
import DocumentStep from "./auth/DocumentStep";
import Turnstile from "./auth/Turnstile";
import { API, IS_DEV } from "./auth/config";
import { AuthField, AuthSelect, AuthCheck, AuthButton, AuthNotice, Segmented, Divider, FieldError, GoogleMark, Spinner, LegalLink } from "./auth/AuthControls";
import {
  VerifyEmailScreen, ForgotPasswordScreen, PasswordFoundScreen, PendingVerificationScreen,
  CINStatusScreen, DeviceApprovalScreen, TOTPScreen, RoleSelectScreen, fmtWait,
} from "./auth/AuthScreens";

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Passing the raw event straight to reject() left Sentry unable to
    // extract any message/stack from it (surfaced as "Event ProgressEvent
    // captured as promise rejection") and gave calling code nothing useful
    // to show the user — wrap it in a real Error instead.
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // A WebKit quirk on some iOS versions fires onload for an undecodable
    // HEIC source with a 0x0 image instead of onerror — treat that the same
    // as a real decode failure so it falls through to the HEIC conversion
    // path below instead of silently producing a blank upload.
    img.onload = () => (img.width && img.height) ? resolve(img) : reject(new Error('decoded to 0x0'));
    img.onerror = () => reject(new Error('native decode failed'));
    img.src = src;
  });
}

// Decodes a user-picked file into something <canvas> can draw, trying
// progressively slower but broader-compatibility paths. This exists because
// "choose from gallery" was silently broken for a large share of real
// devices: HEIC/HEIF — the default photo format on iPhone, and increasingly
// on some Android cameras — cannot be decoded by a plain <img> in most
// browsers. iOS Safari transcodes HEIC to JPEG before handing it to the page
// in many cases, but that is not guaranteed across every browser/webview a
// real user is actually on (Chrome for iOS, in-app browsers, older iOS
// versions, some Android gallery apps) — which is exactly why this "worked
// on some devices, failed on others" instead of failing (or working)
// consistently for everyone.
async function decodeToImage(file) {
  // Fast path: URL.createObjectURL, not FileReader — it doesn't need to read
  // the whole file into memory and re-encode it as base64 just to get a
  // usable <img src>, which makes it meaningfully more reliable for large
  // photos or a flaky file handle. This matters in practice: a real user hit
  // "Could not read the selected file" here because FileReader.readAsDataURL
  // itself failed (some Android gallery pickers hand back content:// URIs
  // FileReader can intermittently fail to read at all) — and since that used
  // to be the *only* read attempted, with no fallback, every layer built
  // below for HEIC/broader-codec support never even got a chance to run.
  // Covers JPEG/PNG/WebP/GIF, plus any HEIC the browser already transcoded.
  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadImageElement(objectUrl);
  } catch {
    // fall through to the slower paths below
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const looksHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
  if (looksHeic) {
    try {
      // Loaded on demand — most users never hit this path, so it shouldn't
      // cost every visitor a WASM download just to sign up.
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
      const jpegUrl = URL.createObjectURL(jpegBlob);
      try {
        return await loadImageElement(jpegUrl);
      } finally {
        URL.revokeObjectURL(jpegUrl);
      }
    } catch {
      // fall through to the last resort below
    }
  }

  // Next: createImageBitmap decodes a broader set of codecs than <img> in
  // some browsers (notably Chromium) and works straight off the Blob.
  try {
    return await createImageBitmap(file);
  } catch {
    // fall through to the absolute last resort below
  }

  // Absolute last resort: FileReader. Slower and the least reliable of the
  // four paths tried here, but still worth one attempt before giving up —
  // some old/quirky browsers decode successfully from a data: URI even after
  // failing every direct-from-Blob path above.
  try {
    const dataUrl = await readAsDataUrl(file);
    return await loadImageElement(dataUrl);
  } catch {
    throw new Error("This file isn't a valid image.");
  }
}

function fileToBase64(file) {
  return decodeToImage(file).then((img) => {
    const MAX = 800;
    const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width  = img.width  * ratio;
    canvas.height = img.height * ratio;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  });
}

// The sign-up fields that live on a freelancer's first step (the second step is the identity document).
const STEP1_KEYS = ["name", "email", "password", "confirmPassword", "dob", "gender", "region", "skills"];

// Which step of the form each server-side complaint belongs to, so a refusal that comes back
// after the e-mail was verified lands the visitor on the field to fix, not on a dead end.
const SERVER_FIELD_ERRORS = {
  name: { step: 1, field: "name" }, dob: { step: 1, field: "dob" },
  invalidDocumentType: { step: 2, field: "doc" }, documentRequired: { step: 2, field: "doc" }, invalidDocumentImage: { step: 2, field: "doc" },
};

const BLANK_FORM = { name: "", email: "", password: "", confirmPassword: "", skills: "", dob: "", region: "", gender: "" };

export default function AuthModal({ open, onClose, onAuth, onSignupComplete, defaultMode = "login", closable = true }) {
  const [mode,           setMode]           = useState(defaultMode);
  const [role,           setRole]           = useState("freelancer");
  const [freelancerType, setFreelancerType] = useState("freelancer");
  const [step,           setStep]           = useState(1);   // freelancer sign-up: 1 = profile, 2 = identity document
  const formRef = useRef(null);
  // The preview URLs of the document photos, so they can be released instead of living until the tab is closed.
  const docUrls = useRef({ front: null, back: null });
  const [loading,        setLoading]        = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form,    setForm]    = useState(BLANK_FORM);

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

  // The invisible Cloudflare Turnstile check on the final step of log-in / sign-up. A request asks it for a
  // token at the moment it needs one (takeCaptcha) and re-arms it afterwards (spendCaptcha).
  const captchaRef = useRef(null);

  // Set when sign-up has just finished, to say so on the log-in page it lands on.
  const [notice, setNotice] = useState(null);                      // { text }
  const focusPassword = useRef(false);                             // land on the password field, the e-mail is already there
  // The e-mailed code, as sent: its lifetime, the resend delay, and (local development only) the code itself.
  const [verifyInfo, setVerifyInfo] = useState({});
  // "This visitor owns this address", handed over once the code is accepted. Kept so a refusal that
  // sends the visitor back to the form (a date of birth, a photo) does not cost them a second code.
  const emailProof = useRef(null);                                 // { email, proof }
  // When the e-mailed code is accepted the six cells light up; the redirect to the log-in page waits until this moment
  // so the confirmation is seen even when the account is created in a blink.
  const glowUntil = useRef(0);

  // Google Sign Up/Login — CLIENT ONLY (button is only ever rendered when
  // role === "client"; freelancer/admin never touch this state or endpoint).
  // googleProfile is set once Google auth succeeds in signup mode: it just
  // holds the access token to send to the backend on final submit.
  const [googleProfile, setGoogleProfile] = useState(null); // { accessToken }
  const [googleLoading, setGoogleLoading] = useState(false);

  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // The identity document: which kind, and the photo of each side it has.
  const [docType,     setDocType]     = useState(DEFAULT_ID_DOCUMENT);
  const [docFiles,    setDocFiles]    = useState({ front: null, back: null });
  const [docPreviews, setDocPreviews] = useState({ front: null, back: null });

  const { t }                        = useTranslation();
  const { register, login, verifyTOTP, loginWithUserData, logout, updateUser } = useAuth();

  const ROLES = [
    { value: "freelancer", label: t("Freelancer"), icon: "work" },
    { value: "client",     label: t("Client"),     icon: "business_center" },
  ];

  useEffect(() => {
    setMode(defaultMode);
    setForm(BLANK_FORM);
    setErrors({});
    setRole("freelancer");
    setFreelancerType("freelancer");
    setStep(1);
    resetDocs();
    setDocType(DEFAULT_ID_DOCUMENT);
    setScreen("form");
    setPendingName("");
    setPendingFormData(null);
    setStatusUser(null);
    setPendingApproval(null);
    setRoleSelectData(null);
    setPendingTOTPToken(null);
    setTermsAccepted(false);
    setGoogleProfile(null);
    setNotice(null);
    setVerifyInfo({});
    emailProof.current = null;
  }, [defaultMode, open]);

  // Focus the first field when a form appears — on a mouse/trackpad device only: on a phone it would pop the
  // keyboard up before the person has even read the screen. A step with no text field (the ID card) puts the
  // focus on the title instead, so a keyboard or screen-reader user is not left on a button that is gone.
  useEffect(() => {
    if (!open || screen !== "form") return undefined;
    const fine = !!window.matchMedia?.("(pointer: fine)").matches;
    const id = requestAnimationFrame(() => {
      // Right after sign-up the log-in form already has the e-mail in it: go to the password.
      const wantPassword = focusPassword.current;
      focusPassword.current = false;
      const selector = wantPassword ? "input[type=password]" : "input:not([type=hidden]):not([type=file]), select";
      const field = (fine || wantPassword) && step !== 2 ? formRef.current?.querySelector(selector) : null;
      (field || (step === 2 ? document.getElementById("auth-title") : null))?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open, screen, mode, role, step, googleProfile]);

  // Moving to the ID-card step: bring the top of the form back into view.
  useEffect(() => {
    if (step === 2) document.getElementById("auth-title")?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const urls = docUrls.current;
    return () => { for (const side of ["front", "back"]) if (urls[side]) URL.revokeObjectURL(urls[side]); };
  }, []);

  function resetDocs() {
    for (const side of ["front", "back"]) {
      if (docUrls.current[side]) URL.revokeObjectURL(docUrls.current[side]);
      docUrls.current[side] = null;
    }
    setDocFiles({ front: null, back: null });
    setDocPreviews({ front: null, back: null });
  }

  function set(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(err => ({ ...err, [field]: "" }));
    };
  }

  function handleDocFile(side, file) {
    // A file that is not an image, or is absurdly large, is refused here with a clear message instead of
    // failing later, once the e-mail code has already been spent.
    const looksLikeImage = /^image\//i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
    if (!looksLikeImage || file.size > MAX_DOCUMENT_FILE_BYTES) {
      setErrors(err => ({ ...err, doc: t("auth.err_doc_file") }));
      return;
    }
    const url = URL.createObjectURL(file);
    if (docUrls.current[side]) URL.revokeObjectURL(docUrls.current[side]);
    docUrls.current[side] = url;
    setDocFiles(f => ({ ...f, [side]: file }));
    setDocPreviews(p => ({ ...p, [side]: url }));
    setErrors(err => ({ ...err, doc: "" }));
  }

  // Changing the kind of document starts the photos again — a passport page must never go out as the front of a licence.
  function chooseDocType(next) {
    if (next === docType) return;
    resetDocs();
    setDocType(next);
    setErrors(err => ({ ...err, doc: "" }));
  }

  // Cloudflare Turnstile: each request that needs the check takes a fresh single-use token,
  // then re-arms the widget. (Nothing is shown unless Cloudflare decides it has to ask the person.)
  async function takeCaptcha() {
    if (IS_DEV) return { token: undefined };
    try { return { token: await captchaRef.current.getToken() }; }
    catch { return { failed: true }; }
  }
  function spendCaptcha() { if (!IS_DEV) captchaRef.current?.reset(); }

  function validate() {
    const errs = {};
    if (mode === "signup") {
      // One field, the full name: at least two real words, letters only (the server checks the same rules).
      const n = validateFullName(form.name);
      if (!n.ok) errs.name = t(NAME_ERROR_KEY[n.code]);
    }
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
    // Date of birth + gender are only collected (and shown) for freelancer
    // signup — see the matching role check around the form fields below.
    // Clients never see these inputs, so never require them either.
    if (mode === "signup" && role === "freelancer") {
      if (!form.dob) errs.dob = t("Date of birth is required");
      else {
        // 18 to 56 years old, counted from the real date (not the birth year alone).
        const d = validateDob(form.dob);
        if (!d.ok) errs.dob = t(DOB_ERROR_KEY[d.code]);
      }
      if (!form.gender) errs.gender = t("Please select your gender");
      // Whichever document was chosen, every side it has needs its photo.
      if (!IS_DEV && !sidesFor(docType).every(side => docFiles[side]))
        errs.doc = t("auth.err_doc_required");
    }
    if (mode === "signup") {
      if (!form.region) errs.region = t("Please select your region");
    }
    if (mode === "signup" && role === "freelancer") {
      if (!form.skills.trim()) errs.skills = t("Please enter at least one skill");
    }
    // (The security check is not validated here: it is invisible, and asked for when the request is sent.)
    if (mode === "signup" && !termsAccepted)
      errs.terms = t("You must accept the Terms of Service");
    return errs;
  }

  async function handleSubmit() {
    // Google sign-up: the name and e-mail came from the verified Google profile, so only the
    // region, the terms and the security check are needed — not the whole password-sign-up field set.
    if (mode === "signup" && role === "client" && googleProfile) {
      const gErrs = {};
      if (!form.region) gErrs.region = t("Please select your region");
      if (!termsAccepted) gErrs.terms = t("You must accept the Terms of Service");
      if (Object.keys(gErrs).length) { setErrors(gErrs); return; }
      setLoading(true);
      try {
        const captcha = await takeCaptcha();
        if (captcha.failed) { setErrors({ captcha: t("auth.captcha_failed") }); return; }
        try {
          await submitGoogleAuth(googleProfile.accessToken, { region: form.region, captchaToken: captcha.token });
        } finally {
          spendCaptcha();
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (mode === "signup" && role === "freelancer" && Object.keys(errs).some(k => STEP1_KEYS.includes(k))) setStep(1);
      focusFirstError();
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await startSignup();
        return;
      }

      // LOGIN
      const captcha = await takeCaptcha();
      if (captcha.failed) { setErrors({ captcha: t("auth.captcha_failed") }); return; }
      let result;
      try {
        result = await login(form.email, form.password, undefined, captcha.token);
      } finally {
        spendCaptcha(); // a token is good for one request, success or not
      }
      if (result.error === "noAccount") {
        setErrors({ email: t("No account found with this email") });
        return;
      }
      if (result.error === "accountLocked") {
        setErrors({ email: t("Account locked due to too many failed attempts. Try again in {{m}} minutes.", { m: result.minutesLeft ?? 30 }) });
        return;
      }
      if (result.error === "wrongPassword") {
        setErrors({ password: t("Incorrect password") });
        return;
      }
      if (result.error === "useGoogleLogin") {
        setErrors({ password: t("This account uses Google Sign-In. Use the Google button instead.") });
        return;
      }
      if (result.error === "invalidCaptcha") {
        setErrors({ captcha: t("auth.captcha_failed") });
        return;
      }
      if (result.error === "captchaUnavailable") {
        setErrors({ captcha: t("auth.captcha_unavailable") });
        return;
      }
      // login() in AuthContext.js returns this specifically when the request
      // itself failed (a network blip, a timeout — common on mobile data),
      // as opposed to the backend actually answering with a real rejection.
      // Without this, a plain connectivity hiccup showed the exact same
      // "Login failed. Please try again." as a wrong password or a genuine
      // server error, giving no hint that retrying (rather than re-checking
      // credentials) was the right next step.
      if (result.error === "serverError") {
        setErrors({ email: t("Network error. Please check your connection and try again.") });
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
        // A pending CLIENT is let in read-only (browse only, no actionable
        // requests — enforced by PrivateRoute + per-action gating, backed by
        // requireApprovedClient on the backend). Freelancers are unchanged:
        // still logged back out and shown the blocking "under review" screen.
        if (result.user.cinStatus === "pending" && result.user.role !== "client") {
          setPendingName(firstWord(result.user.name));
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

  // ── Google Sign Up / Login — CLIENT ONLY ──────────────────────────────────
  // The response from POST /auth/google always carries a client account (the
  // backend hardcodes role='client' server-side), so unlike finishAuthResult
  // above there's no freelancer/admin branch to consider here at all.
  function finishGoogleAuth(loggedUser) {
    if ((loggedUser.cinStatus === "approved" || loggedUser.cinStatus === "rejected") && !loggedUser.statusSeen) {
      setStatusUser(loggedUser);
      setScreen("status");
      return;
    }
    // Pending: let them in read-only, same as the password-login path.
    onAuth?.(loggedUser);
    onClose?.();
  }

  // Shared by both the signup submit button and the login-mode Google button
  // below — routed through our own backend (POST /auth/google/prefill)
  // rather than calling googleapis.com directly from the browser: production's
  // CSP connect-src only allows this API's own origin, so a direct client-side
  // call to Google's userinfo endpoint is silently blocked. Display-only
  // either way — the backend independently re-derives everything itself when
  // the form is actually submitted, so nothing shown here is a trust boundary.
  async function prefillFromGoogle(accessToken) {
    try {
      const res = await fetch(`${API}/auth/google/prefill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!data?.email) return false;
      setForm(f => ({
        ...f,
        name:  [data.givenName, data.familyName].filter(Boolean).join(' ') || f.name,
        email: data.email || f.email,
      }));
      setGoogleProfile({ accessToken });
      return true;
    } catch {
      return false;
    }
  }

  // `onNoAccountYet` lets the login-mode Google button (which never collects
  // region/captcha up front) fall into the signup-with-prefill flow instead
  // of just erroring when the backend reports there's no account for this
  // Gmail yet — same outcome as if the person had clicked "Sign up with
  // Google" in the first place.
  async function submitGoogleAuth(accessToken, extra = {}, { onNoAccountYet } = {}) {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, ...extra }),
      });
      const result = await res.json();
      if (result.error === "missingRegion") {
        if (onNoAccountYet) { await onNoAccountYet(); return; }
        setErrors({ region: t("Please select your region") });
        return;
      }
      if (result.error === "invalidCaptcha") {
        setErrors({ captcha: t("auth.captcha_failed") });
        return;
      }
      if (result.error === "captchaUnavailable") {
        setErrors({ captcha: t("auth.captcha_unavailable") });
        return;
      }
      if (result.error === "ageNotAllowed") {
        setErrors({ email: t("auth.err_age_google") });
        return;
      }
      // A new account was created — and, by design, NO session was started. On to the log-in page,
      // where "Continue with Google" signs this account in.
      if (result.registered) {
        finishSignup(form.email, "google");
        return;
      }
      if (result.error === "googleAccountMismatch") {
        setErrors({ email: t("This email is already linked to a different Google account.") });
        return;
      }
      if (result.requiresTOTP) {
        setPendingTOTPToken(result.pendingToken);
        setScreen("totp");
        return;
      }
      if (result.error === "invalidTOTP") { setErrors({ email: t("Invalid code. Try again.") }); return; }
      if (result.error || !result.user) {
        setErrors({ email: t("Google sign-in failed. Please try again.") });
        return;
      }
      const loggedUser = loginWithUserData(result.user, result.accessToken);
      finishGoogleAuth(loggedUser);
    } catch {
      setErrors({ email: t("Google sign-in failed. Please try again.") });
    }
  }

  // useGoogleLogin (not the ID-token <GoogleLogin> widget) — only this,
  // access-token flow, kept even without the birthday scope for consistency
  // with the backend. In login mode it submits immediately; in signup mode
  // it only prefills the visible form (display only — the backend
  // independently re-derives name/email/dob from the token itself when the
  // form is actually submitted, so nothing shown here is a trust boundary).
  //
  // Deliberately NOT requesting user.birthday.read: it's a Google "sensitive"
  // scope, and while unverified, Google caps the app at 100 users EVER
  // (lifetime, not resettable) for any client requesting an unapproved
  // sensitive/restricted scope — even after publishing to Production. Since
  // the spec always treated dob as best-effort/optional, dropping the scope
  // removes that cap entirely (openid/email/profile are not sensitive).
  // fetchGoogleBirthday on the backend still runs and still returns null
  // gracefully now that the scope is never granted — no backend change
  // needed, dob just always ends up unset via this path.
  const googleAuth = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setErrors({});
      try {
        if (mode === "login") {
          await submitGoogleAuth(tokenResponse.access_token, {}, {
            onNoAccountYet: async () => {
              // No client account for this Gmail yet — switch into the
              // signup flow with the same prefill "Sign up with Google"
              // gives, instead of silently 400ing with nothing shown.
              setMode("signup");
              setRole("client");
              const ok = await prefillFromGoogle(tokenResponse.access_token);
              if (!ok) setErrors({ email: t("Google sign-in failed. Please try again.") });
            },
          });
          return;
        }
        const ok = await prefillFromGoogle(tokenResponse.access_token);
        if (!ok) setErrors({ email: t("Google sign-in failed. Please try again.") });
      } catch {
        setErrors({ email: t("Google sign-in failed. Please try again.") });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setErrors({ email: t("Google sign-in failed. Please try again.") }),
  });

  async function handleRoleSelect(selectedRole) {
    if (!roleSelectData) return;
    setLoading(true);
    try {
      const result = await login(roleSelectData.email, roleSelectData.password, undefined, null, selectedRole, roleSelectData.selectionToken);
      if (result.error) {
        setErrors({ email: result.error === "serverError"
          ? t("Network error. Please check your connection and try again.")
          : t("Login failed. Please try again.") });
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
        if (result.user.cinStatus === "pending" && result.user.role !== "client") {
          setPendingName(firstWord(result.user.name));
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

  // ── Sign-up ────────────────────────────────────────────────────────────────
  // form → [identity document] → the e-mailed code → the account → the LOG-IN page.

  // The validated form, in the shape the rest of the flow carries around.
  function signupData() {
    return {
      ...form,
      name:  validateFullName(form.name).value,           // tidied: single-spaced, NFC
      email: form.email.trim().toLowerCase(),
      role, freelancerType,
    };
  }

  // Step "send the code" — or, in the local no-e-mail mode, create the account straight away.
  async function startSignup() {
    const data = signupData();

    // Every failure below is reported on the email field — but for a freelancer
    // on step 2 (document upload) that field is on a screen that no longer
    // exists (step === 1 only). Without switching back, setErrors() lands on an
    // unrendered field: the button's loading spinner stops and nothing visible
    // happens at all, as if the click did nothing. Jumping to step 1 is exactly
    // what the client-side validate() failures already do (see STEP1_KEYS
    // above) — this mirrors that for the errors the server reports instead.
    const setEmailError = (message) => {
      setErrors({ email: message });
      if (isFreelancer && step === 2) setStep(1);
    };

    if (IS_DEV) {
      // Local/e2e mode: the e-mail step is skipped (the API skips it outside production too).
      const r = await completeRegistration(data, null);
      if (r.error) setEmailError(r.message);
      return undefined;
    }

    // The visitor proved this address a moment ago and only came back to the form to fix a field.
    if (emailProof.current?.email === data.email) {
      const r = await completeRegistration(data, emailProof.current.proof);
      if (!r.error) return undefined;                     // done — or sent back to the form to fix another field
      if (!r.expiredProof) { setEmailError(r.message); return undefined; }
      emailProof.current = null;                          // the proof ran out: a fresh code it is
    }

    const captcha = await takeCaptcha();
    if (captcha.failed) { setErrors({ captcha: t("auth.captcha_failed") }); return undefined; }
    let body;
    try {
      const res = await fetch(`${API}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, captchaToken: captcha.token, role }),
      });
      body = await res.json().catch(() => ({}));
    } catch {
      setEmailError(t("Network error. Please check your connection and try again."));
      return undefined;
    } finally {
      spendCaptcha();                                     // a token is good for one request
    }

    if (body.error === "emailTaken")          { setEmailError(t("An account with this email already exists.")); return undefined; }
    if (body.error === "invalidCaptcha")      { setErrors({ captcha: t("auth.captcha_failed") }); return undefined; }
    if (body.error === "captchaUnavailable")  { setErrors({ captcha: t("auth.captcha_unavailable") }); return undefined; }
    if (body.error === "tooManySends")        { setEmailError(t("auth.code_too_many_sends", { time: fmtWait(body.retryAfter ?? 3600, t) })); return undefined; }
    // "tooSoon": a code for this address was sent moments ago (the visitor went back and forward).
    // It is still valid, so carry on to the code screen rather than refuse.
    const alreadySent = body.error === "tooSoon";
    if (body.error && !alreadySent)           { setEmailError(t("Failed to send verification email. Try again.")); return undefined; }

    setVerifyInfo({
      expiresIn: body.expiresIn,
      resendIn: alreadySent ? body.retryAfter : body.resendIn,
      devCode: body.devCode,                              // only ever present on a local development API
      notice: alreadySent ? t("auth.code_already_sent") : "",
    });
    setPendingFormData(data);
    setScreen("verify");
    return undefined;
  }

  // What the API wants for /register: the details, the proof, and (freelancers) the document photos,
  // each already shrunk by the browser.
  async function registrationPayload(data, proof) {
    const payload = {
      name: data.name, email: data.email, password: data.password, role: data.role,
      dob: data.dob || undefined, region: data.region, gender: data.gender, skills: data.skills,
      emailProof: proof || undefined,
    };
    if (data.role === "freelancer") {
      payload.idDocType = docType;
      const sides = sidesFor(docType);
      if (docFiles.front && sides.includes("front")) payload.idFront = await fileToBase64(docFiles.front);
      if (docFiles.back  && sides.includes("back"))  payload.idBack  = await fileToBase64(docFiles.back);
    }
    return payload;
  }

  // Creates the account. On success the visitor is on the log-in page; otherwise it says what
  // went wrong — on the form, next to the field, when that is where the fix is.
  async function completeRegistration(data, proof) {
    let payload;
    try {
      payload = await registrationPayload(data, proof);
    } catch (e) {
      // e.g. a photo the browser cannot read — said plainly, instead of a spinner that just stops.
      return { error: "register", message: e?.message || t("Something went wrong. Please try again.") };
    }
    const reg = await register(payload);
    if (!reg?.error) {
      const wait = glowUntil.current - Date.now();
      glowUntil.current = 0;
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      finishSignup(data.email, "password", data.role);
      return { ok: true };
    }

    const code = reg.error === "validation_error" ? reg.details?.[0]?.message : reg.error;
    if (code === "emailNotVerified") {
      emailProof.current = null;
      return { error: "register", message: t("auth.err_email_not_verified"), expiredProof: true };
    }

    // Something the visitor fixes on the form: back to it, with the field marked.
    const group = /^name/.test(code || "") ? "name" : /^dob/.test(code || "") ? "dob" : code;
    const target = SERVER_FIELD_ERRORS[group];
    if (target) {
      const message =
        target.field === "name" ? t(NAME_ERROR_KEY[code] || NAME_ERROR_KEY.nameInvalid)
        : target.field === "dob" ? t(DOB_ERROR_KEY[code] || DOB_ERROR_KEY.dobInvalid)
        : code === "invalidDocumentImage" ? t("auth.err_doc_image")
        : code === "invalidDocumentType" ? t("auth.err_doc_type")
        : t("auth.err_doc_required");
      setErrors({ [target.field]: message });
      setStep(target.step);
      setScreen("form");
      focusFirstError();
      return { ok: true };                                // the e-mail step is done; the form takes over
    }

    const messages = {
      emailTaken:           t("An account with this email already exists."),
      passwordTooShort:     t("Password must be at least 8 characters."),
      missing:              t("Please fill in all required fields."),
      networkError:         t("Network error. Please check your connection and try again."),
      serverError:          t("Something went wrong. Please try again."),
      too_many_requests:    t("Too many attempts. Please wait a few minutes and try again."),
      documentUploadFailed: t("auth.err_doc_upload"),
      validation_error:     t("Some information you entered isn't valid. Please check the form and try again."),
    };
    return { error: "register", message: messages[code] || t("Registration failed ({{error}}). Please try again.", { error: code }) };
  }

  // Called by the code screen (the sixth digit, or "Verify"). A null code means "the e-mail is
  // already verified — create the account again", after a failure that was not the code's fault.
  async function handleVerifyCode(code, onAccepted) {
    const data = pendingFormData;
    if (!data) return { error: "register", message: t("Something went wrong. Please try again.") };

    let proof = emailProof.current?.email === data.email ? emailProof.current.proof : null;
    // "Create the account again" needs a proof to create it with; without one only a fresh code helps.
    if (code === null && !proof) return { error: "proofExpired" };
    if (code !== null) {
      let body;
      try {
        const res = await fetch(`${API}/auth/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, code }),
        });
        body = await res.json().catch(() => ({}));
      } catch {
        return { error: "network" };
      }
      if (!body.success) return { error: body.error || "serverError", attemptsLeft: body.attemptsLeft };
      proof = body.emailProof;
      emailProof.current = { email: data.email, proof };
      glowUntil.current = Date.now() + 800;
      onAccepted?.();                                      // the code is right: the cells glow while the account is made
    }
    const done = await completeRegistration(data, proof);
    // The API no longer accepts the proof it handed out a moment ago (its key changed, or the clock ran past it):
    // trying again cannot work, a new code can.
    return done.expiredProof ? { error: "proofExpired" } : done;
  }

  // "Resend code" on the code screen: that screen has its own invisible security check and passes the token.
  async function handleResendCode(captchaToken) {
    const data = pendingFormData;
    if (!data) return { error: "serverError" };
    try {
      const res = await fetch(`${API}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, captchaToken, role: data.role }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) return { ok: true, expiresIn: body.expiresIn, resendIn: body.resendIn, devCode: body.devCode };
      return { error: body.error || "serverError", retryAfter: body.retryAfter };
    } catch {
      return { error: "network" };
    }
  }

  // Sign-up is done — by password or with Google. Nobody is signed in by it: the visitor goes to
  // the LOG-IN page, e-mail already filled in, with a line saying their account now exists.
  function finishSignup(email, via, signedUpAs = "client") {
    onSignupComplete?.();
    // Meta Pixel "Complete registration" (the pixel itself is loaded in public/index.html). It fires here,
    // and only here, because this is the one place that runs once the account really exists. Clients only.
    if (signedUpAs === "client") {
      window.fbq?.("track", "CompleteRegistration", { content_name: "Inscription Client", status: "completed" });
    }
    emailProof.current = null;
    resetDocs();
    setDocType(DEFAULT_ID_DOCUMENT);
    setForm({ ...BLANK_FORM, email });
    setErrors({});
    setMode("login");
    setRole("freelancer");
    setStep(1);
    setGoogleProfile(null);
    setTermsAccepted(false);
    setPendingFormData(null);
    setVerifyInfo({});
    setNotice({ text: t(via === "google" ? "auth.account_created_google" : signedUpAs === "freelancer" ? "auth.account_created_fl" : "auth.account_created") });
    focusPassword.current = via !== "google";
    setScreen("form");
  }

  // ── presentation ───────────────────────────────────────────────────────────
  const isClient       = role === "client";
  const isFreelancer   = role === "freelancer" && mode === "signup";
  const isLogin        = mode === "login";
  const isGoogleSignup = mode === "signup" && isClient && !!googleProfile;
  const dobLimits      = dobBounds();   // the date picker only offers dates that make the person 18 to 56
  const docsReady      = sidesFor(docType).every(side => docFiles[side]);   // every photo the chosen document needs is in
  // The last step of a flow carries the captcha, the terms and the submit button: the log-in form, a
  // client's single-step sign-up, and a freelancer's second step.
  const isFinalStep    = isLogin || isClient || step === 2;
  // Which brand-panel copy goes with the current form.
  const panelVariant   = mode === "signup" ? (isClient ? "cl" : "fl") : "login";

  const title    = isLogin ? t("auth.login_title") : isClient ? t("auth.signup_cl_title") : t("auth.signup_fl_title");
  const subtitle = isLogin ? t("auth.login_sub")   : isClient ? t("auth.signup_cl_sub")   : t("auth.signup_fl_sub");

  const pwLenOk  = form.password.length >= 8;
  const pwCharOk = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password);
  const pwMatch  = !!form.confirmPassword && form.password === form.confirmPassword;

  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    setStep(1);
    setErrors({});
    setNotice(null);
    setGoogleProfile(null);
    // Login and Signup share one form state, so without this, whatever was typed in one
    // (email, password...) stayed visible after switching to the other — same bug in
    // reverse too. Blank slate every time the tab is clicked.
    setForm(BLANK_FORM);
  }

  function switchRole(next) {
    if (next === role) return;
    setRole(next);
    setStep(1);
    setErrors({});
    setGoogleProfile(null);
  }

  // Moves the eyes (and the keyboard) to the first thing that needs fixing.
  function focusFirstError() {
    setTimeout(() => requestAnimationFrame(() => {
      const el = formRef.current?.querySelector('[aria-invalid="true"], [data-invalid="true"]');
      if (!el) return;
      el.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      el.focus?.({ preventScroll: true });
    }), 40);
  }

  // Freelancer sign-up, step 1 → 2: only the step-1 fields have to be valid to move on.
  function goNextStep() {
    const errs = validate();
    const step1 = Object.fromEntries(Object.entries(errs).filter(([k]) => STEP1_KEYS.includes(k)));
    if (Object.keys(step1).length) { setErrors(step1); focusFirstError(); return; }
    setErrors({});
    setStep(2);
  }

  // Enter and the main button do the same thing: "Continue" on a freelancer's first step, otherwise submit.
  function handlePrimary() {
    if (isFreelancer && step === 1) goNextStep();
    else handleSubmit();
  }

  return (
    <AuthShell open={open} onClose={onClose} closable={closable} variant={panelVariant} labelledBy="auth-title">

      {/* ── VERIFY EMAIL SCREEN ── */}
      {screen === "verify" && pendingFormData && (
        <VerifyEmailScreen
          email={pendingFormData.email}
          initial={verifyInfo}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
          onBack={() => setScreen("form")}
          loading={loading}
        />
      )}

      {/* ── ROLE SELECT SCREEN ── */}
      {screen === "roleSelect" && roleSelectData && (
        <RoleSelectScreen
          roles={roleSelectData.roles}
          loading={loading}
          onSelect={handleRoleSelect}
          onBack={() => setScreen("form")}
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
        <div className="ds-auth-form">

          {/* Title — remounted with the mode/role so it fades in again */}
          <div key={`${mode}-${role}`} className="ds-auth-in mb-6">
            <h1 id="auth-title" tabIndex={-1} className="m-0 scroll-mt-24 text-balance [word-spacing:.06em] text-[28px] font-extrabold leading-[1.15] tracking-tight text-ds-ink outline-none sm:text-[32px]">{title}</h1>
            <p className="mb-0 mt-2 text-pretty text-[14.5px] leading-relaxed text-ds-mute">{subtitle}</p>
          </div>

          {/* Just signed up: say so, on the log-in page the visitor has been taken to */}
          {isLogin && notice && (
            <AuthNotice tone="ok" icon="check_circle" role="status" className="mb-6">
              <p className="m-0 font-semibold" data-testid="signup-notice">{notice.text}</p>
            </AuthNotice>
          )}

          {/* Log in / Sign up */}
          <Segmented className="mb-6" label={t("auth.tabs_label")} value={mode} onChange={switchMode}
            options={[{ value: "login", label: t("auth.tab_login") }, { value: "signup", label: t("auth.tab_signup") }]} />

          {/* Role picker — sign-up only */}
          {mode === "signup" && (
            <div className="mb-6">
              <p className="mb-2.5 mt-0 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-ds-faint">{t("auth.joining_as")}</p>
              <Segmented value={role} onChange={switchRole} options={ROLES} label={t("auth.joining_as")} />
              <p className="mb-0 mt-2.5 text-center text-[12.5px] font-medium text-ds-accent">
                {isClient ? t("Looking to hire talent") : t("Looking for work & clients")}
              </p>
            </div>
          )}

          {/* Google Sign Up / Login — CLIENT ONLY. In signup mode this only
              shows once "Client" is selected above; freelancer signup is
              completely untouched. In login mode there's no role toggle to
              gate on (role isn't known until the account is looked up), so
              the button is always shown, clearly labeled — the backend only
              ever matches/creates a client account through this endpoint,
              so it can never log anyone into a freelancer account. */}
          {(isLogin || (mode === "signup" && isClient)) && !googleProfile && (
            <div className="mb-6 space-y-5">
              <button type="button" onClick={() => googleAuth()} disabled={googleLoading}
                className="ds-btn ds-btn-glass !h-auto !min-h-12 w-full !whitespace-normal !py-2 text-center leading-snug">
                {googleLoading ? <Spinner /> : <GoogleMark />}
                {t(isLogin ? "Continue with Google" : "Sign up with Google")}
              </button>
              <Divider>{t("auth.or_email")}</Divider>
            </div>
          )}

          {/* Signed in with Google — signup-only confirmation strip, replaces
              the button above once Google auth has prefilled the form. */}
          {isGoogleSignup && (
            <div className="mb-6 space-y-3">
              <AuthNotice tone="ok" icon="verified_user">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-semibold">{t("Signed in with Google")} — <bdi dir="ltr">{form.email}</bdi></span>
                  <button type="button" onClick={() => { setGoogleProfile(null); setForm(f => ({ ...f, dob: "" })); }}
                    className="-my-2 py-2 text-xs font-semibold underline">
                    {t("Change")}
                  </button>
                </div>
              </AuthNotice>
              {errors.email && <AuthNotice tone="bad" icon="error" role="alert">{errors.email}</AuthNotice>}
            </div>
          )}

          {/* Freelancer sign-up runs in two steps; the stepper shows where you are and a finished step
              carries the same verification glow as every other "checked" signal on the site. */}
          {isFreelancer && (
            <ol className="m-0 mb-6 grid list-none grid-cols-2 gap-3 p-0">
              {[
                { n: 1, title: t("auth.step1_title"), caption: t("auth.step1_cap"), done: step === 2 },
                { n: 2, title: t("auth.step2_title"), caption: t("auth.step2_cap"), done: docsReady },
              ].map(s => {
                const current = step === s.n;
                return (
                  <li key={s.n}>
                    <button type="button" aria-current={current ? "step" : undefined}
                      onClick={() => (s.n === 1 ? setStep(1) : (step === 1 ? goNextStep() : null))}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-start transition-colors sm:gap-3 sm:px-3 ${current ? "border-ds-accent-line bg-ds-accent-soft" : "border-ds-line bg-ds-low hover:bg-ds-high"}`}>
                      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[13px] font-bold ${s.done ? "ds-verified bg-ds-ok text-white" : current ? "bg-ds-fill text-white" : "bg-ds-highest text-ds-mute"}`}>
                        {s.done ? <Icon name="check" size={18} /> : s.n}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold leading-tight text-ds-ink sm:text-[13px]">{s.title}</span>
                        <span className={`hidden truncate text-[11.5px] sm:block ${current ? "text-ds-mute" : "text-ds-faint"}`}>{s.caption}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Form fields — Enter submits (or, on a freelancer's first step, continues) */}
          <form key={`${mode}-${role}-${step}`} ref={formRef} noValidate className="ds-auth-in space-y-4"
            onSubmit={e => { e.preventDefault(); handlePrimary(); }}>

            {/* Full name — one field for both roles. Hidden for Google signup:
                already captured from the verified Google profile (shown in
                the confirmation strip above), and the backend never reads
                this field from this endpoint anyway. */}
            {mode === "signup" && !googleProfile && step === 1 && (
              <AuthField label={t("Full name")} name="name" autoComplete="name" placeholder={t("Your full name")} icon="person" required
                hint={t("auth.name_hint")}
                value={form.name} onChange={set("name")} error={errors.name} />
            )}

            {/* Email — same reasoning as above */}
            {!googleProfile && step === 1 && (
              <AuthField label={t("Email address")} type="email" name="email" autoComplete="email" placeholder="you@example.com" icon="mail" required
                value={form.email} onChange={set("email")} error={errors.email} />
            )}

            {/* Password — login: one field with the "Forgot password?" link; signup: two columns with
                the rules shown live. Not shown for Google signup — that account has no password. */}
            {!googleProfile && step === 1 && (isLogin ? (
              <AuthField label={t("Password")} type="password" name="password" autoComplete="current-password"
                placeholder={t("Enter your password")} icon="lock" required
                value={form.password} onChange={set("password")} error={errors.password}
                aside={
                  <button type="button" onClick={() => setScreen("forgot")} className="-my-2.5 py-2.5 text-[12.5px] font-semibold text-ds-accent transition-colors hover:underline">
                    {t("Forgot password?")}
                  </button>
                } />
            ) : (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField label={t("Password")} type="password" name="new-password" autoComplete="new-password"
                    placeholder="••••••••" icon="lock" required
                    value={form.password} onChange={set("password")} error={errors.password} />
                  <AuthField label={t("Confirm password")} type="password" name="confirm-password" autoComplete="new-password"
                    placeholder="••••••••" icon="lock" required
                    value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword}
                    hint={pwMatch ? <span className="inline-flex items-center gap-1 font-medium text-ds-ok"><Icon name="check_circle" size={14} fill />{t("auth.pw_match")}</span> : undefined} />
                </div>
                <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs">
                  {[[pwLenOk, t("auth.pw_rule_len")], [pwCharOk, t("auth.pw_rule_char")]].map(([ok, label]) => (
                    <li key={label} className={`flex items-center gap-1.5 font-medium transition-colors ${ok ? "text-ds-ok" : "text-ds-faint"}`}>
                      <Icon name={ok ? "check_circle" : "radio_button_unchecked"} size={14} fill={ok} />{label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Date of birth + Gender — freelancer signup only. Clients aren't asked for either (see the
                matching scope on the validation above). Also skipped entirely for Google signup: dob is
                never required there (only prefilled if Google actually provided one — see the strip
                above), and gender isn't collected on that path at all. */}
            {isFreelancer && !googleProfile && step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label={t("Date of birth")} type="date" name="bday" autoComplete="bday" required
                  min={dobLimits.min} max={dobLimits.max}
                  hint={t("auth.dob_hint")}
                  value={form.dob} onChange={set("dob")} error={errors.dob} />
                <div>
                  <div className="mb-1.5 flex items-center">
                    <span className="text-[13px] font-semibold text-ds-ink-2">{t("Gender")}<span aria-hidden="true" className="ms-0.5 text-ds-bad">*</span></span>
                  </div>
                  <div data-invalid={errors.gender ? "true" : undefined} tabIndex={errors.gender ? -1 : undefined}>
                    <Segmented size="sm" className="min-h-12" label={t("Gender")} value={form.gender}
                      onChange={g => { setForm(f => ({ ...f, gender: g })); setErrors(err => ({ ...err, gender: "" })); }}
                      options={[{ value: "male", label: t("Male"), icon: "male" }, { value: "female", label: t("Female"), icon: "female" }]} />
                  </div>
                  <FieldError>{errors.gender}</FieldError>
                </div>
              </div>
            )}

            {/* Region — all signup roles */}
            {mode === "signup" && step === 1 && (
              <AuthSelect label={t("Region")} name="region" required icon="location_on"
                value={form.region} error={errors.region}
                onChange={e => { setForm(f => ({ ...f, region: e.target.value })); setErrors(err => ({ ...err, region: "" })); }}
                placeholder={t("Select your governorate")} options={TUNISIAN_REGIONS} />
            )}

            {/* Skills — freelancer signup only. Bio was dropped from signup
                per request; freelancers can still add one later from their
                profile. */}
            {isFreelancer && step === 1 && (
              <AuthField label={t("Your skills")} name="skills" placeholder={t("e.g. React, Figma, SEO")} icon="bolt" required
                value={form.skills} onChange={set("skills")} error={errors.skills} />
            )}

            {/* Identity document — freelancer sign-up, step 2: the national ID card, a passport, a driving
                licence or a birth certificate, with the photo(s) that kind needs. Clients need no identity
                verification, so this is skipped for them entirely (no upload, no admin review queue,
                no pending-approval gate). */}
            {isFreelancer && step === 2 && (
              <DocumentStep docType={docType} onDocType={chooseDocType} previews={docPreviews} onFile={handleDocFile}
                invalid={!!errors.doc} error={errors.doc} />
            )}

            {/* Security check — Cloudflare Turnstile, a small visible box that turns to "Success" on its own
                (Cloudflare only asks for a tick when it is unsure). The form takes a token from it when the
                request is sent (takeCaptcha). */}
            {!IS_DEV && isFinalStep && (
              <div>
                <Turnstile ref={captchaRef} action={isLogin ? "login" : googleProfile ? "google_signup" : "signup"} />
                <FieldError>{errors.captcha}</FieldError>
              </div>
            )}

            {/* Terms checkbox — signup only. The links open in a new tab so what has been typed is kept. */}
            {mode === "signup" && isFinalStep && (
              <AuthCheck checked={termsAccepted} error={errors.terms}
                onChange={() => { setTermsAccepted(v => !v); setErrors(e => ({ ...e, terms: "" })); }}>
                <Trans i18nKey="auth.terms_full"
                  components={{
                    terms:   <LegalLink href="/terms" />,
                    privacy: <LegalLink href="/privacy" />,
                  }} />
              </AuthCheck>
            )}

            {/* Actions */}
            {isFreelancer && step === 2 ? (
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setErrors({}); setStep(1); }} className="ds-btn ds-btn-glass ds-btn-lg flex-none">
                  <Icon name="arrow_back" size={18} flip />{t("Back")}
                </button>
                <AuthButton loading={loading} className="min-w-0 flex-1">{loading ? t("Processing…") : t("auth.signup_cta")}</AuthButton>
              </div>
            ) : (
              <div className="pt-1">
                <AuthButton loading={loading}>
                  {loading ? t("Processing…") : isLogin ? t("auth.login_cta") : isFreelancer ? t("auth.next") : t("auth.signup_cta")}
                </AuthButton>
              </div>
            )}
          </form>

          {/* Under the form */}
          {isLogin ? (
            <div className="mt-6 space-y-4 text-center">
              <p className="m-0 text-[12px] leading-relaxed text-ds-faint">
                <Trans i18nKey="auth.legal_login"
                  components={{
                    terms:   <Link to="/terms" onClick={onClose} className="font-semibold text-ds-accent underline underline-offset-2" />,
                    privacy: <Link to="/privacy" onClick={onClose} className="font-semibold text-ds-accent underline underline-offset-2" />,
                  }} />
              </p>
              <p className="m-0 text-[13.5px] text-ds-mute">
                {t("auth.no_account")}{" "}
                <button type="button" onClick={() => switchMode("signup")} className="-my-2 py-2 font-semibold text-ds-ink underline underline-offset-2 transition-colors hover:text-ds-accent">{t("auth.go_signup")}</button>
              </p>
            </div>
          ) : (
            <p className="mb-0 mt-6 text-center text-[13.5px] text-ds-mute">
              {t("auth.have_account")}{" "}
              <button type="button" onClick={() => switchMode("login")} className="-my-2 py-2 font-semibold text-ds-ink underline underline-offset-2 transition-colors hover:text-ds-accent">{t("auth.go_login")}</button>
            </p>
          )}

          {/* What the platform checks — the brand panel is hidden on a phone, so the three points are summed up here */}
          <ul className="m-0 mt-7 flex list-none flex-wrap justify-center gap-x-5 gap-y-2 border-t border-ds-line p-0 pt-5 text-[12px] font-medium text-ds-faint lg:hidden">
            {[["badge", "ap.t1.title"], ["payments", "ap.t2.title"], ["percent", "ap.t3.title"]].map(([icon, key]) => (
              <li key={key} className="inline-flex items-center gap-1.5"><Icon name={icon} size={15} className="text-ds-accent" />{t(key)}</li>
            ))}
          </ul>

          <p className="mb-0 mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-ds-faint">
            <Icon name="support_agent" size={16} />{t("auth.help_prefix")}{" "}
            <Link to="/help" onClick={onClose} className="font-semibold text-ds-accent hover:underline">{t("auth.help_link")}</Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
