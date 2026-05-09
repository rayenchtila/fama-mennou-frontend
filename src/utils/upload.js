// Professional Cloudinary Upload Utility
// Architecture: Browser → sign(backend) → upload(Cloudinary directly) → save URL(Supabase)
// NO localStorage for files. NO base64. NO unsigned preset issues.

const SIGN_API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : 'https://famamennou-server.onrender.com/api';

const CLOUD = 'dcantqizj';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/** Upload an MP4 video file to Cloudinary */
export function uploadVideo(file, folder = 'famamennou/videos', onProgress = null) {
  return signedUpload(file, 'video', folder, onProgress);
}

/** Upload an image file to Cloudinary */
export function uploadImage(file, folder = 'famamennou/images', onProgress = null) {
  return signedUpload(file, 'image', folder, onProgress);
}

/** Upload a PDF or document to Cloudinary */
export function uploadDocument(file, folder = 'famamennou/docs', onProgress = null) {
  return signedUpload(file, 'raw', folder, onProgress);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Signed upload flow
// ─────────────────────────────────────────────────────────────────────────────

async function signedUpload(file, resourceType, folder, onProgress) {
  // Step 1: Get Cloudinary signature from our backend (uses API secret, secure)
  const signRes = await fetch(`${SIGN_API}/uploads/sign-direct`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ resource_type: resourceType, folder }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || 'Impossible d\'obtenir la signature Cloudinary');
  }

  const sign = await signRes.json();

  // Step 2: Upload directly to Cloudinary using the signature (no upload_preset needed)
  const formData = new FormData();
  formData.append('file',      file);
  formData.append('api_key',   sign.api_key);
  formData.append('timestamp', sign.timestamp);
  formData.append('signature', sign.signature);
  formData.append('folder',    sign.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`;
  const result    = await xhrWithProgress(uploadUrl, formData, onProgress);

  if (result.error) throw new Error(result.error.message || 'Upload Cloudinary échoué');

  return {
    secure_url: result.secure_url,
    public_id:  result.public_id,
    duration:   result.duration   || null,
    width:      result.width      || null,
    height:     result.height     || null,
    format:     result.format     || null,
    bytes:      result.bytes      || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// XHR with progress tracking
// ─────────────────────────────────────────────────────────────────────────────

function xhrWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress tracking (0 → 100)
    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve(data);
      } catch {
        reject(new Error('Réponse invalide de Cloudinary'));
      }
    });

    xhr.addEventListener('error',   () => reject(new Error('Erreur réseau pendant l\'upload')));
    xhr.addEventListener('abort',   () => reject(new Error('Upload annulé')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload expiré')));

    xhr.timeout = 30 * 60 * 1000; // 30 minutes (for large videos)
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

export function validateVideoFile(file) {
  const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const MAX_MB  = 500;

  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Format non supporté. Utilisez MP4, WebM ou MOV.`);
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Vidéo trop grande. Maximum ${MAX_MB}MB.`);
  }
  return true;
}

export function validateImageFile(file) {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_MB  = 10;

  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Format non supporté. Utilisez JPG, PNG ou WebP.`);
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image trop grande. Maximum ${MAX_MB}MB.`);
  }
  return true;
}

export function formatFileSize(bytes) {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Legacy compat — used by older components
export async function uploadFile({ file, upload_type, onProgress }) {
  if (upload_type === 'course_video') return uploadVideo(file, 'famamennou/videos', onProgress);
  if (upload_type === 'course_thumb') return uploadImage(file, 'famamennou/thumbnails', onProgress);
  if (upload_type === 'profile')      return uploadImage(file, 'famamennou/profiles', onProgress);
  return uploadImage(file, `famamennou/${upload_type}`, onProgress);
}
