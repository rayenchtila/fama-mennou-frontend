// VideoUpload — Professional MP4 upload component
// Usage: <VideoUpload onUpload={(url) => setVideoUrl(url)} />

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadVideo, validateVideoFile, formatFileSize } from '../utils/upload';

export default function VideoUpload({ onUpload, folder = 'famamennou/videos', disabled = false }) {
  const { t } = useTranslation();
  const [state,     setState]    = useState('idle'); // idle | uploading | done | error
  const [progress,  setProgress] = useState(0);
  const [fileName,  setFileName] = useState('');
  const [fileSize,  setFileSize] = useState('');
  const [error,     setError]    = useState('');
  const [videoUrl,  setVideoUrl] = useState('');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    try { validateVideoFile(file); } catch (err) { setError(err.message); return; }

    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setError('');
    setState('uploading');
    setProgress(0);

    try {
      const res = await uploadVideo(file, folder, pct => setProgress(pct));
      setVideoUrl(res.secure_url);
      setState('done');
      onUpload?.(res.secure_url, res);
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setProgress(0);
    setFileName('');
    setFileSize('');
    setError('');
    setVideoUrl('');
    if (inputRef.current) inputRef.current.value = '';
    onUpload?.(null);
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || state === 'uploading'}
      />

      {/* IDLE — click to upload */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold">{t('vu.click_to_upload')}</p>
            <p className="text-xs opacity-60 mt-0.5">{t('vu.formats_hint')}</p>
          </div>
        </button>
      )}

      {/* UPLOADING — progress bar */}
      {state === 'uploading' && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</span>
              <span className="text-xs text-slate-400 shrink-0">{fileSize}</span>
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 ml-2">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center">
            {progress < 100 ? t('vu.uploading') : t('vu.processing')}
          </p>
        </div>
      )}

      {/* DONE — success + preview */}
      {state === 'done' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t('vu.uploaded')}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 truncate">{fileName}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
              title={t('vu.remove_choose_other')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Mini preview */}
          {videoUrl && (
            <video
              src={videoUrl}
              className="w-full rounded-xl bg-black aspect-video"
              controls
              preload="metadata"
              playsInline
            />
          )}
        </div>
      )}

      {/* ERROR */}
      {state === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-rose-700 dark:text-rose-400 flex-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            {t('vu.retry')}
          </button>
        </div>
      )}
    </div>
  );
}
