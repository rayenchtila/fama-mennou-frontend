import { useState, useEffect } from 'react';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const API   = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_MAX   = 10 * 1024 * 1024;

const METHODS = [
  { key: 'd17',    label: 'D17' },
  { key: 'flouci', label: 'Flouci' },
  { key: 'rib',    label: 'Virement (RIB)' },
];

const MI = { background: 'var(--fm-border-soft)', border: '1px solid var(--fm-border)', borderRadius: 12, color: 'var(--fm-text-2)', padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };

const IcX     = ({ s = 14 }) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const IcCheck = ({ s = 20 }) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IcClock = ({ s = 20 }) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
const IcUpload = ({ s = 20 }) => <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;

// Signed direct-to-Cloudinary upload for a PRIVATE payment_proof asset.
// Deliberately not src/utils/upload.js's uploadImage() — that helper always
// goes through /uploads/sign-direct, which signs a PUBLIC ('upload' type)
// delivery. A payment screenshot can show a phone number, an account
// number or a transaction id, so it needs the same private/signed-read
// path as CIN documents: /uploads/sign with upload_type, which signs
// type:'private' (see services/cloudinary.js signUpload()).
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

const STATUS_LABEL = {
  approved: 'Paiement vérifié',
  rejected: 'Paiement refusé',
};

/* ══════════════════════════════════════════════════════════════
   PROJECT PAYMENT MODAL — client pays the agreed amount for an
   accepted freelancer (D17 / Flouci / RIB + proof screenshot).
   ══════════════════════════════════════════════════════════════ */
export default function ProjectPaymentModal({ project, onClose, onDone }) {
  useBodyScrollLock(true);

  const amount = Number(project.amount || 0);

  const [methods, setMethods]           = useState(null);
  const [activeMethod, setActiveMethod] = useState('d17');
  const [file, setFile]                 = useState(null);
  const [preview, setPreview]           = useState(null);
  const [current, setCurrent]           = useState(null); // latest project_payments row, if any
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending]           = useState(false);
  const [err, setErr]                   = useState('');

  useEffect(() => {
    fetch(`${API}/project-payments/methods`).then(r => r.json()).then(setMethods).catch(() => setMethods({}));
    fetch(`${API}/project-payments/project/${project.id}`).then(r => r.json())
      .then(rows => setCurrent(Array.isArray(rows) && rows.length ? rows[0] : null))
      .catch(() => setCurrent(null))
      .finally(() => setLoadingStatus(false));
  }, [project.id]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) { setErr('Format non supporté. Utilisez JPG, PNG ou WebP.'); return; }
    if (f.size > IMAGE_MAX) { setErr('Image trop grande (max 10MB).'); return; }
    setErr('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file) { setErr('Ajoutez une capture d’écran du paiement.'); return; }
    setSending(true); setErr('');
    try {
      const { public_id, secure_url } = await uploadPaymentProof(file);
      const res = await fetch(`${API}/project-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, method: activeMethod, proof_public_id: public_id, proof_url: secure_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error === 'payment_already_pending'
          ? 'Un paiement est déjà en attente de vérification pour ce projet.'
          : (data.message || 'Échec de l’envoi du paiement.'));
        return;
      }
      setCurrent(data);
      onDone && onDone(data);
    } catch (e) {
      setErr(e.message || 'Erreur réseau — réessayez.');
    } finally {
      setSending(false);
    }
  }

  const showForm = !loadingStatus && current?.status !== 'approved' && current?.status !== 'pending';

  return (
    <div className="fm-backdrop-blur-in" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--fm-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'var(--fm-surface)', border: '1px solid rgba(124,108,246,0.3)', borderRadius: 22, padding: '28px 28px 24px', boxShadow: '0 24px 80px -12px var(--fm-overlay)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--fm-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Paiement du projet</p>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--fm-text-1)', margin: 0, lineHeight: 1.3 }}>{project.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'var(--fm-surface-hover)', border: '1px solid var(--fm-border)', borderRadius: 10, padding: 6, cursor: 'pointer', color: 'var(--fm-text-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcX s={14} /></button>
        </div>

        {loadingStatus ? (
          <p style={{ fontSize: 13, color: 'var(--fm-text-6)', textAlign: 'center', padding: '20px 0' }}>Chargement…</p>
        ) : current?.status === 'approved' ? (
          <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-success)', margin: '0 auto 14px' }}><IcCheck /></div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--fm-text-1)', margin: '0 0 4px' }}>{STATUS_LABEL.approved}</p>
            <p style={{ fontSize: 13, color: 'var(--fm-text-6)', margin: 0 }}>{amount.toFixed(2)} TND confirmé pour ce projet.</p>
          </div>
        ) : current?.status === 'pending' ? (
          <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fm-warning)', margin: '0 auto 14px' }}><IcClock /></div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--fm-text-1)', margin: '0 0 4px' }}>En attente de vérification</p>
            <p style={{ fontSize: 13, color: 'var(--fm-text-6)', margin: 0 }}>Votre preuve de paiement de {amount.toFixed(2)} TND a été envoyée à l'équipe Fama Mennou.</p>
          </div>
        ) : showForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {current?.status === 'rejected' && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--fm-danger)', margin: '0 0 2px' }}>Paiement refusé</p>
                <p style={{ fontSize: 12, color: 'var(--fm-text-5)', margin: 0 }}>{current.rejection_reason || 'Aucune raison fournie.'} Vous pouvez soumettre une nouvelle preuve.</p>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--fm-border-soft)', border: '1px solid var(--fm-border)', borderRadius: 12, padding: '12px 14px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fm-text-6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant à payer</span>
              <strong style={{ fontSize: 18, fontWeight: 900, color: 'var(--fm-text-1)' }}>{amount.toFixed(2)} TND</strong>
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Méthode de paiement</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {METHODS.map(m => (
                  <button key={m.key} type="button" onClick={() => setActiveMethod(m.key)}
                    style={{ flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: activeMethod === m.key ? 'rgba(124,108,246,0.14)' : 'var(--fm-border-soft)',
                      border: `1px solid ${activeMethod === m.key ? 'rgba(124,108,246,0.5)' : 'var(--fm-border)'}`,
                      color: activeMethod === m.key ? 'var(--fm-primary-light)' : 'var(--fm-text-5)' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--fm-border-soft)', border: '1px solid var(--fm-border)', borderRadius: 12, padding: '12px 14px' }}>
              {activeMethod === 'd17' && <p style={{ fontSize: 13, color: 'var(--fm-text-3)', margin: 0 }}>Numéro D17 : <strong style={{ color: 'var(--fm-text-1)' }}>{methods?.d17_number || 'Non configuré'}</strong></p>}
              {activeMethod === 'flouci' && <p style={{ fontSize: 13, color: 'var(--fm-text-3)', margin: 0 }}>Numéro Flouci : <strong style={{ color: 'var(--fm-text-1)' }}>{methods?.flouci_number || 'Non configuré'}</strong></p>}
              {activeMethod === 'rib' && <p style={{ fontSize: 13, color: 'var(--fm-text-3)', margin: 0 }}>RIB : <strong style={{ color: 'var(--fm-text-1)' }}>{methods?.rib || 'Non configuré'}</strong></p>}
            </div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fm-text-7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Capture d'écran du paiement <span style={{ color: 'var(--fm-danger)' }}>*</span></p>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 100, borderRadius: 12, border: '1.5px dashed var(--fm-border)', cursor: 'pointer', overflow: 'hidden', background: 'var(--fm-border-soft)' }}>
                <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                {preview ? (
                  <img src={preview} alt="Aperçu du paiement" style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--fm-text-6)', padding: '18px 0' }}>
                    <IcUpload />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Cliquez pour ajouter une image</span>
                  </div>
                )}
              </label>
            </div>

            {err && <p style={{ fontSize: 12, color: 'var(--fm-danger)', margin: 0 }}>{err}</p>}

            <button type="button" onClick={submit} disabled={sending}
              style={{ padding: '12px', borderRadius: 13, background: 'linear-gradient(135deg,#7c6cf6,#6254d4)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, boxShadow: '0 6px 20px -4px rgba(124,108,246,0.5)', transition: 'opacity .15s' }}>
              {sending ? 'Envoi…' : 'Valider le paiement'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
