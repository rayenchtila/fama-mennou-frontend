// useUpload — React hook for Cloudflare R2 file uploads
// Handles progress, errors, loading state, and cancel

import { useState, useRef, useCallback } from 'react';
import { uploadFile, validateFile, formatSize } from '../utils/upload';

export default function useUpload() {
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [result,    setResult]    = useState(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setResult(null);
    abortRef.current = false;
  }, []);

  // ── Main upload function ──────────────────────────────────────────────────
  const upload = useCallback(async ({
    file,
    upload_type,
    user_email,
    reference_id = null,
    validate_as  = null,   // 'image' | 'video' | 'doc' — client-side validation
  }) => {
    reset();
    setUploading(true);
    setError(null);

    try {
      // Client-side validation first (instant feedback)
      if (validate_as) validateFile(file, validate_as);

      const res = await uploadFile({
        file,
        upload_type,
        user_email,
        reference_id,
        onProgress: (pct) => {
          if (!abortRef.current) setProgress(pct);
        },
      });

      if (!abortRef.current) {
        setResult(res);
        setProgress(100);
      }
      return res;
    } catch (err) {
      if (!abortRef.current) setError(err.message);
      throw err;
    } finally {
      if (!abortRef.current) setUploading(false);
    }
  }, [reset]);

  return { upload, progress, uploading, error, result, reset };
}

// ── Usage examples ────────────────────────────────────────────────────────────
//
// PROFILE PHOTO:
//   const { upload, progress, uploading, error } = useUpload();
//   const handlePhoto = async (e) => {
//     const file = e.target.files[0];
//     const res = await upload({ file, upload_type: 'profile', user_email: user.email, validate_as: 'image' });
//     console.log('Photo URL:', res.file_url);
//   };
//
// COURSE VIDEO (with progress bar):
//   const res = await upload({ file, upload_type: 'course_video', user_email: user.email, reference_id: lessonId, validate_as: 'video' });
//   // <div style={{ width: `${progress}%` }} /> — shows progress bar
//
// CIN DOCUMENT (private):
//   const res = await upload({ file, upload_type: 'cin_front', user_email: user.email, validate_as: 'image' });
//   // res.file_url is null (private file) — use readPrivateFile(res.key, user.email) to view it
