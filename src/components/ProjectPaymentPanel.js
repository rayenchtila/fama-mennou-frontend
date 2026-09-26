import { useState, useEffect, useRef } from 'react';
import d17Logo from '../CARTE/D17.png';
import flouciLogo from '../CARTE/FLOUCI.png';
import ribLogo from '../CARTE/RIB.png';

const API   = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX   = 10 * 1024 * 1024;

const METHODS = [
  { key: 'd17',    label: 'D17',                    logo: d17Logo },
  { key: 'flouci', label: 'Flouci',                 logo: flouciLogo },
  { key: 'rib',    label: 'Virement (RIB)',          logo: ribLogo },
];

// Signed direct-to-Cloudinary upload for a PRIVATE payment_proof asset.
// Not src/utils/upload.js's uploadImage() — that always signs a PUBLIC
// delivery. A payment screenshot can show a phone number or account
// number, so it needs the same private/signed-read path as CIN documents:
// /uploads/sign with upload_type (see services/cloudinary.js signUpload()).
async function uploadPaymentProof(file) {
  const signRes = await fetch(`${API}/uploads/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_type: 'payment_proof', content_type: file.type, file_size: file.size }),
  });
  const sign = await signRes.json();
  if (!signRes.ok || !sign.success) throw new Error(sign.error || 'Signature Cloudinary échouée.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sign.api_key);
  formData.append('timestamp', sign.timestamp);
  formData.append('signature', sign.signature);
  formData.append('folder', sign.folder);
  formData.append('type', sign.type);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloud_name}/${sign.resource_type}/upload`, {
    method: 'POST', body: formData,
  });
  const result = await uploadRes.json();
  if (result.error) throw new Error(result.error.message || 'Envoi de la capture échoué.');
  return { public_id: result.public_id, secure_url: result.secure_url };
}

/* ══════════════════════════════════════════════════════════════
   PROJECT PAYMENT PANEL — inline, embedded directly on the
   client's project card once a freelancer is accepted. Client
   enters the amount (must be >= the project's agreed amount),
   picks D17 / Flouci / RIB, copies the number, uploads a proof
   screenshot (camera or gallery), then Valider / Annuler.
   ══════════════════════════════════════════════════════════════ */
// projects.budget is the client's own published amount (free text, e.g.
// "500" or "500 DT") — the reference the payment must meet or exceed, per
// spec. Same digit-stripping convention as the backend (routes/
// projectPayments.js's parseBudget) and as routes/projects.js's existing
// sort-by-budget.
function parseBudget(budgetText) {
  const n = parseFloat(String(budgetText || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function ProjectPaymentPanel({ project }) {
  const projectAmount = parseBudget(project.budget);

  const [methods, setMethods]           = useState(null);
  const [activeMethod, setActiveMethod] = useState(null);
  const [copied, setCopied]             = useState(false);
  const [amount, setAmount]             = useState(projectAmount ? String(projectAmount) : '');
  const [file, setFile]                 = useState(null);
  const [preview, setPreview]           = useState(null);
  const [current, setCurrent]           = useState(null); // latest project_payments row, if any
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending]           = useState(false);
  const [err, setErr]                   = useState('');
  const [showCaptureChoice, setShowCaptureChoice] = useState(false);
  const cameraInputRef  = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/project-payments/methods`).then(r => r.json()).then(setMethods).catch(() => setMethods({}));
    fetch(`${API}/project-payments/project/${project.id}`).then(r => r.json())
      .then(rows => setCurrent(Array.isArray(rows) && rows.length ? rows[0] : null))
      .catch(() => setCurrent(null))
      .finally(() => setLoadingStatus(false));
  }, [project.id]);

  function resetForm() {
    setAmount(projectAmount ? String(projectAmount) : '');
    setActiveMethod(null);
    setFile(null);
    setPreview(null);
    setErr('');
    setShowCaptureChoice(false);
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) { setErr('Format non supporté. Utilisez JPG, PNG ou WebP.'); return; }
    if (f.size > IMAGE_MAX) { setErr('Image trop grande (max 10MB).'); return; }
    setErr('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowCaptureChoice(false);
  }

  function copyNumber(number) {
    navigator.clipboard?.writeText(number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const amountNum = Number(amount);
  const amountInvalid = amount !== '' && (!Number.isFinite(amountNum) || amountNum < projectAmount);

  async function submit() {
    if (!amountNum || amountInvalid) { setErr('Montant incorrect'); return; }
    if (!activeMethod) { setErr('Choisissez un mode de paiement.'); return; }
    if (!file) { setErr('Ajoutez une capture d’écran du paiement.'); return; }
    setSending(true); setErr('');
    try {
      const { public_id, secure_url } = await uploadPaymentProof(file);
      const res = await fetch(`${API}/project-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, amount: amountNum, method: activeMethod, proof_public_id: public_id, proof_url: secure_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error === 'payment_already_pending'
          ? 'Un paiement est déjà en attente de vérification pour ce projet.'
          : (data.message || 'Échec de l’envoi du paiement.'));
        return;
      }
      setCurrent(data);
    } catch (e) {
      setErr(e.message || 'Erreur réseau — réessayez.');
    } finally {
      setSending(false);
    }
  }

  const showForm = !loadingStatus && current?.status !== 'approved' && current?.status !== 'pending';
  const activeMethodInfo = METHODS.find(m => m.key === activeMethod);
  const activeNumber = activeMethod === 'd17' ? methods?.d17_number : activeMethod === 'flouci' ? methods?.flouci_number : activeMethod === 'rib' ? methods?.rib : null;

  return (
    <div style={{ borderTop: '1px solid var(--fm-border)', padding: '18px 24px', background: 'rgba(124,108,246,0.04)' }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Paiement du projet</p>

      {loadingStatus ? (
        <p style={{ fontSize: 13, color: 'var(--fm-text-6)' }}>Chargement…</p>
      ) : current?.status === 'approved' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fm-success)' }}>✓ Paiement vérifié — {Number(current.amount).toFixed(2)} TND</span>
        </div>
      ) : current?.status === 'pending' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fm-warning)' }}>⏳ Ta demande est en cours de traitement</span>
        </div>
      ) : showForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
          {current?.status === 'rejected' && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--fm-danger)', margin: '0 0 2px' }}>Paiement refusé</p>
              <p style={{ fontSize: 12, color: 'var(--fm-text-5)', margin: 0 }}>{current.rejection_reason || 'Aucune raison fournie.'} Vous pouvez soumettre une nouvelle preuve.</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Montant <span style={{ color: 'var(--fm-danger)' }}>*</span></p>
            <input type="number" min={projectAmount} step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--fm-border-soft)',
                border: `1.5px solid ${amountInvalid ? 'var(--fm-danger)' : 'var(--fm-border)'}`,
                borderRadius: 12, color: amountInvalid ? 'var(--fm-danger)' : 'var(--fm-text-2)',
                padding: '10px 12px', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit',
              }} />
            <p style={{ fontSize: 11, margin: '5px 0 0', color: amountInvalid ? 'var(--fm-danger)' : 'var(--fm-text-7)', fontWeight: amountInvalid ? 700 : 400 }}>
              {amountInvalid ? 'Montant incorrect' : `Minimum : ${projectAmount.toFixed(2)} TND`}
            </p>
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Mode de paiement <span style={{ color: 'var(--fm-danger)' }}>*</span></p>
            <div style={{ display: 'flex', gap: 8 }}>
              {METHODS.map(m => (
                <button key={m.key} type="button" onClick={() => { setActiveMethod(m.key); setCopied(false); }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                    background: activeMethod === m.key ? 'rgba(124,108,246,0.14)' : 'var(--fm-border-soft)',
                    border: `1.5px solid ${activeMethod === m.key ? 'rgba(124,108,246,0.5)' : 'var(--fm-border)'}` }}>
                  <img src={m.logo} alt={m.label} style={{ height: 36, objectFit: 'contain' }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: activeMethod === m.key ? 'var(--fm-primary-light)' : 'var(--fm-text-5)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeMethod && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--fm-border-soft)', border: '1px solid var(--fm-border)', borderRadius: 12, padding: '10px 14px' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', margin: '0 0 2px', textTransform: 'uppercase' }}>{activeMethodInfo.label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--fm-text-1)', margin: 0, letterSpacing: '0.02em' }}>{activeNumber || 'Non configuré'}</p>
              </div>
              {activeNumber && (
                <button type="button" onClick={() => copyNumber(activeNumber)}
                  style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(124,108,246,0.12)',
                    color: copied ? 'var(--fm-success)' : 'var(--fm-primary-light)',
                    border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(124,108,246,0.3)'}` }}>
                  {copied ? 'Copié ✓' : 'Copier'}
                </button>
              )}
            </div>
          )}

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Capture d'écran du paiement <span style={{ color: 'var(--fm-danger)' }}>*</span></p>

            {/* Two separate hidden inputs — one forces the camera
                (capture="environment"), one opens the plain gallery/file
                picker. A single input with `capture` set removes the
                "choose from library" option on several mobile browsers, so
                the explicit choice below is what guarantees both paths
                actually work regardless of which the user picks. */}
            <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

            {preview ? (
              <div onClick={() => setShowCaptureChoice(true)}
                style={{ borderRadius: 12, border: '1.5px dashed var(--fm-border)', cursor: 'pointer', overflow: 'hidden', background: 'var(--fm-border-soft)' }}>
                <img src={preview} alt="Aperçu du paiement" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
              </div>
            ) : showCaptureChoice ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => cameraInputRef.current?.click()}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 8px', borderRadius: 12, cursor: 'pointer', background: 'var(--fm-border-soft)', border: '1.5px solid var(--fm-border)', color: 'var(--fm-text-4)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Prendre une photo</span>
                </button>
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 8px', borderRadius: 12, cursor: 'pointer', background: 'var(--fm-border-soft)', border: '1.5px solid var(--fm-border)', color: 'var(--fm-text-4)' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Choisir un fichier</span>
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCaptureChoice(true)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', minHeight: 90, borderRadius: 12, border: '1.5px dashed var(--fm-border)', cursor: 'pointer', background: 'var(--fm-border-soft)', color: 'var(--fm-text-6)', fontFamily: 'inherit' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Ajouter une capture d'écran</span>
              </button>
            )}
          </div>

          {err && <p style={{ fontSize: 12, color: 'var(--fm-danger)', margin: 0, fontWeight: 700 }}>{err}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={submit} disabled={sending}
              style={{ flex: 1, padding: '11px', borderRadius: 12, background: '#10b981', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Envoi…' : 'Valider'}
            </button>
            <button type="button" onClick={resetForm} disabled={sending}
              style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'transparent', border: '1.5px solid var(--fm-danger)', color: 'var(--fm-danger)', fontSize: 13.5, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
