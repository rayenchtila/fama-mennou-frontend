// VideoPlayer — Professional HTML5 video player
// Supports: Cloudinary URLs, direct MP4, Mux HLS streams, YouTube
// Optimized for: slow internet, mobile, buffering, autoplay policies

import { useRef, useState, useEffect } from 'react';
import { cldVideo } from '../utils/cloudinary';

export default function VideoPlayer({ url, title = '', autoPlay = false, className = '' }) {
  const videoRef  = useRef(null);
  const [error,   setError]   = useState(false);
  const [loading, setLoading] = useState(true);

  const isMux     = (url || '').startsWith('mux:');
  const isYoutube = /youtube\.com|youtu\.be/.test(url || '');
  const isDirect  = /^https?:\/\//i.test(url || '') && !isYoutube && !isMux;

  // ── Mux HLS setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMux || !videoRef.current) return;
    const video     = videoRef.current;
    const playbackId = (url || '').replace('mux:', '');
    const src       = `https://stream.mux.com/${playbackId}.m3u8`;

    // iOS Safari — native HLS
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // Other browsers — HLS.js
    const initHls = () => {
      if (!window.Hls?.isSupported()) return;
      const hls = new window.Hls({
        maxBufferLength:     20,
        maxMaxBufferLength:  40,
        startLevel:          -1,
        abrEwmaDefaultEstimate: 500000,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (data.fatal) hls.destroy();
      });
    };

    if (window.Hls) { initHls(); return; }
    const s   = document.createElement('script');
    s.src     = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.onload  = initHls;
    document.head.appendChild(s);
    return () => { if (video) video.src = ''; };
  }, [isMux, url]);

  if (!url) {
    return (
      <div className={`w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
          <p className="text-slate-500 text-sm">Aucune vidéo disponible</p>
        </div>
      </div>
    );
  }

  // YouTube embed
  if (isYoutube) {
    const videoId = (url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]) || '';
    return (
      <iframe
        className={`w-full aspect-video rounded-xl bg-black ${className}`}
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title}
      />
    );
  }

  // Mux HLS — video element populated by useEffect above
  if (isMux) {
    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          title={title}
          onCanPlay={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-sm">Erreur de lecture vidéo</p>
          </div>
        )}
      </div>
    );
  }

  // Direct URL — Cloudinary MP4 or any direct video URL
  if (isDirect) {
    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
        <video
          className="w-full h-full"
          src={cldVideo(url)}
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          title={title}
          onCanPlay={() => setLoading(false)}
          onLoadedData={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          style={{ maxHeight: '100%' }}
        >
          <p className="text-white text-sm p-4">
            Votre navigateur ne supporte pas la lecture vidéo.
          </p>
        </video>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-sm">Impossible de charger la vidéo</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center ${className}`}>
      <p className="text-slate-500 text-sm">Format vidéo non supporté</p>
    </div>
  );
}
