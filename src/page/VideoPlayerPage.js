import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

function isYouTube(url = '') {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeId(url = '') {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : '';
}

function MuxPlayer({ playbackId }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const video = ref.current;
    if (!video || !playbackId) return;
    const src = `https://stream.mux.com/${playbackId}.m3u8`;

    // iOS Safari — native HLS, no JS needed
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    const init = () => {
      if (!window.Hls?.isSupported()) return;
      const hls = new window.Hls({
        enableWorker:           true,
        startLevel:             -1,
        autoStartLoad:          true,
        maxBufferLength:        20,          // low for budget phones
        maxMaxBufferLength:     40,
        maxBufferSize:          20*1000*1000, // 20MB — fits A06's 3GB RAM
        lowLatencyMode:         false,
        backBufferLength:       10,
        abrEwmaDefaultEstimate: 300000,      // start at 300kbps for slow networks
        abrBandWidthFactor:     0.8,
        abrBandWidthUpFactor:   0.5,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (d.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
    };

    // Load HLS.js once (regular script, not module — works on ALL Android)
    if (window.Hls) { init(); return; }
    const existing = document.getElementById('hls-js');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.id  = 'hls-js';
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.onload = init;
    document.head.appendChild(s);

    return () => { if (video) video.src = ''; };
  }, [playbackId]);

  return (
    <video
      ref={ref}
      className="w-full aspect-video bg-black"
      controls
      playsInline
      preload="auto"
      controlsList="nodownload nofullscreen"
      onContextMenu={e => e.preventDefault()}
      draggable={false}
    />
  );
}

function VideoPlayer({ url }) {
  const isMux      = (url || '').startsWith('mux:');
  const isYT       = isYouTube(url || '');
  const isStream   = /^https?:\/\//i.test(url || '');
  const isB64      = (url || '').startsWith('data:video');

  if (isMux) {
    const playbackId = (url || '').replace('mux:', '');
    return <MuxPlayer playbackId={playbackId} />;
  }

  if (!url) return (
    <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Aucune vidéo disponible</p>
    </div>
  );

  if (isYT) {
    const id = getYouTubeId(url);
    return (
      <iframe
        className="w-full aspect-video"
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Lesson video"
      />
    );
  }

  return (
    <video
      className="w-full aspect-video bg-black"
      src={url}
      controls
      playsInline
      controlsList="nodownload nofullscreen"
      onContextMenu={e => e.preventDefault()}
      draggable={false}
    />
  );
}

function CertificateCard({ cert }) {
  return (
    <div className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 text-center">
      <div className="text-4xl mb-2">🏆</div>
      <h3 className="text-lg font-extrabold text-amber-800 dark:text-amber-300 mb-1">Certificate of Completion</h3>
      <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
        Awarded to <span className="font-bold">{cert.student_name}</span> for completing<br />
        <span className="font-bold">{cert.course_title}</span>
      </p>
      <p className="text-[11px] text-amber-600 dark:text-amber-500 font-mono bg-amber-100 dark:bg-amber-900/40 rounded-lg px-3 py-1.5 inline-block mb-3">
        {cert.certificate_uid}
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-500">
        Issued {new Date(cert.issued_at).toLocaleDateString()}
        {cert.instructor_name ? ` · Instructor: ${cert.instructor_name}` : ''}
      </p>
    </div>
  );
}

export default function VideoPlayerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lessons,      setLessons]      = useState([]);
  const [lesson,       setLesson]       = useState(null);
  const [course,       setCourse]       = useState(null);
  const [progress,     setProgress]     = useState({ completed_ids: [], pct: 0 });
  const [cert,         setCert]         = useState(null);
  const [marking,      setMarking]      = useState(false);
  const [certLoading,  setCertLoading]  = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [purchases,    setPurchases]    = useState([]);

  const email = user?.email;

  const fetchAll = useCallback(async () => {
    try {
      const [lsRes, cRes, pRes, certRes, purchRes] = await Promise.all([
        fetch(`${API}/lessons/course/${courseId}`),
        fetch(`${API}/courses/${courseId}`),
        fetch(`${API}/progress/${email}/${courseId}`),
        fetch(`${API}/certificates/${email}/${courseId}`),
        email ? fetch(`${API}/course-purchases/user/${email}`) : Promise.resolve({ json: () => [] }),
      ]);
      const [ls, c, p, certData, purch] = await Promise.all([
        lsRes.json(), cRes.json(), pRes.json(), certRes.json(),
        email ? purchRes.json() : [],
      ]);
      if (Array.isArray(ls)) setLessons(ls);
      if (c && c.id)         setCourse(c);
      if (p && p.completed_ids) setProgress(p);
      if (certData && certData.id) setCert(certData);
      if (Array.isArray(purch)) {
        setPurchases(purch.filter(p => Number(p.course_id) === Number(courseId)));
      }
    } catch {}
  }, [courseId, email]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasFull       = purchases.some(p => !p.lesson_id);
  const isInstructor  = course && user?.email === course.creator_email;

  function canWatch(l) {
    if (!l) return false;
    if (l.is_free_preview) return true;
    if (!user) return false;
    if (user.isAdmin) return true;
    if (isInstructor) return true;
    if (hasFull) return true;
    return false;
  }

  useEffect(() => {
    if (lessons.length && lessonId) {
      const found = lessons.find(l => String(l.id) === String(lessonId));
      setLesson(found || lessons[0]);
    } else if (lessons.length) {
      setLesson(lessons[0]);
    }
  }, [lessons, lessonId]);

  const currentIndex = lessons.findIndex(l => l.id === lesson?.id);
  const prevLesson   = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson   = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const isCompleted  = progress.completed_ids.includes(lesson?.id);

  const markComplete = async () => {
    if (!lesson || marking || isCompleted) return;
    setMarking(true);
    try {
      await fetch(`${API}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, lesson_id: lesson.id, course_id: Number(courseId) }),
      });
      await fetchAll();
    } catch {}
    setMarking(false);
  };

  const claimCert = async () => {
    if (cert || certLoading) return;
    setCertLoading(true);
    try {
      const r = await fetch(`${API}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, course_id: Number(courseId) }),
      });
      const d = await r.json();
      if (d.id) setCert(d);
    } catch {}
    setCertLoading(false);
  };

  const goToLesson = (l) => {
    navigate(`/courses/${courseId}/lesson/${l.id}`);
    setLesson(l);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-16">

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(`/courses/${courseId}`)}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm shrink-0 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="flex-1 min-w-0 order-3 sm:order-none basis-full sm:basis-auto">
          <p className="text-white text-sm font-semibold truncate">{course?.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">{Math.round(progress.pct)}%</span>
          <div className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
        <button onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* Main video area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <div className="bg-black">
            {canWatch(lesson) ? (
              <div
                className="relative select-none"
                onContextMenu={e => e.preventDefault()}
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              >
                <VideoPlayer url={lesson?.video_url} />
                {/* Floating watermark — deters screen recording by embedding user identity */}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 10 }}
                >
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.10)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      transform: 'rotate(-25deg)',
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    {user?.name || user?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-slate-900 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-base mb-1">Leçon verrouillée</p>
                  <p className="text-slate-400 text-sm max-w-xs">Vous devez acheter le cours complet pour accéder aux leçons payantes.</p>
                </div>
                <button onClick={() => navigate(`/courses/${courseId}`)}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">
                  Acheter le cours →
                </button>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
            {/* Lesson header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white mb-1">{lesson?.title}</h1>
                {lesson?.description && (
                  <p className="text-sm text-slate-400">{lesson.description}</p>
                )}
              </div>
              <button
                onClick={markComplete}
                disabled={marking || isCompleted}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}>
                {isCompleted ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Completed</>
                ) : marking ? 'Saving…' : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Mark Complete</>
                )}
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => prevLesson && goToLesson(prevLesson)}
                disabled={!prevLesson}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                Previous
              </button>
              <button onClick={() => nextLesson && goToLesson(nextLesson)}
                disabled={!nextLesson}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto">
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Certificate section */}
            {progress.pct === 100 && (
              cert ? <CertificateCard cert={cert} /> : (
                <div className="bg-amber-900/20 border border-amber-700/50 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-amber-300 font-bold mb-3">You've completed all lessons! Claim your certificate.</p>
                  <button onClick={claimCert} disabled={certLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors disabled:opacity-50">
                    {certLoading ? 'Generating…' : '🏆 Get Certificate'}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-hidden shrink-0 max-h-[60vh] lg:max-h-none">
            <div className="p-4 border-b border-slate-800">
              <p className="text-white font-bold text-sm">Course Content</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {progress.completed_ids.length} / {lessons.length} lessons completed
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {lessons.map((l, i) => {
                const done      = progress.completed_ids.includes(l.id);
                const active    = l.id === lesson?.id;
                const watchable = canWatch(l);
                return (
                  <button key={l.id}
                    onClick={() => watchable ? goToLesson(l) : navigate(`/courses/${courseId}`)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-slate-800/50 ${
                      active ? 'bg-indigo-900/40 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/60'
                    }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      !watchable  ? 'bg-slate-800 text-slate-600' :
                      done        ? 'bg-emerald-600 text-white' :
                      active      ? 'bg-indigo-600 text-white' :
                                    'bg-slate-700 text-slate-400'
                    }`}>
                      {!watchable ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      ) : done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold line-clamp-2 ${
                        !watchable ? 'text-slate-600' :
                        active     ? 'text-indigo-300' :
                        done       ? 'text-slate-400' : 'text-slate-200'
                      }`}>
                        {l.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {l.duration_min > 0 && (
                          <p className="text-[10px] text-slate-500">{l.duration_min} min</p>
                        )}
                        {!watchable && (
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Payant</span>
                        )}
                        {l.is_free_preview && (
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Gratuit</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
