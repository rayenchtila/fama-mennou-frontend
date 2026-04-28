import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://famamennou-server.onrender.com/api';

function StarRating({ rating = 0, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  const display = interactive ? (hover || rating) : rating;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => interactive && onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
          <svg className={`w-5 h-5 ${s <= Math.round(display) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  );
}

export default function CourseDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [purchases,    setPurchases]    = useState([]);  // user's purchases for this course
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('curriculum');
  const [buying,       setBuying]       = useState(false);
  const [buyingLesson, setBuyingLesson] = useState(null);
  const [buyMsg,       setBuyMsg]       = useState('');

  // Review form
  const [myRating,     setMyRating]     = useState(0);
  const [myReview,     setMyReview]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  // Add lesson inline (instructor only)
  const [showAddLesson,    setShowAddLesson]    = useState(false);
  const [lessonSubmitted,  setLessonSubmitted]  = useState(false);
  const [newLesson,        setNewLesson]        = useState({ title:'', video_url:'' });
  const [addingLesson,     setAddingLesson]     = useState(false);
  const [uploadState,      setUploadState]      = useState('idle'); // idle | uploading | processing | done | error
  const [uploadProgress,   setUploadProgress]   = useState(0);
  const [uploadFileName,   setUploadFileName]   = useState('');
  const muxFileRef = { current: null };

  const isInstructor = course && user?.email === course.creator_email;

  // What has the user purchased?
  const hasFull     = purchases.some(p => !p.lesson_id);
  const ownedLesson = id => purchases.some(p => Number(p.lesson_id) === Number(id));

  function canWatch(lesson) {
    if (!user) return false;
    return true; // all logged-in users can watch all videos
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Phase 1 — course + purchases only (fast, enough to decide paywall)
    Promise.all([
      fetch(`${API}/courses/${id}`).then(r => r.json()),
      user?.email
        ? fetch(`${API}/course-purchases/user/${user.email}`).then(r => r.json())
        : Promise.resolve([]),
    ]).then(([c, myPurch]) => {
      setCourse(c);
      const filteredPurch = Array.isArray(myPurch)
        ? myPurch.filter(p => Number(p.course_id) === Number(id))
        : [];
      setPurchases(filteredPurch);
      setLoading(false); // ← paywall or hero renders immediately here

      // Phase 2 — rest only if user can access the course
      const paid         = Number(c?.full_price) > 0;
      const isOwner      = c && user?.email === c.creator_email;
      const hasPurchased = filteredPurch.some(p => !p.lesson_id);
      if (!paid || isOwner || hasPurchased || user?.isAdmin) {
        Promise.all([
          fetch(`${API}/lessons/course/${id}`).then(r => r.json()),
          fetch(`${API}/course-reviews/course/${id}`).then(r => r.json()),
          fetch(`${API}/live-sessions/course/${id}`).then(r => r.json()),
        ]).then(([ls, rv, live]) => {
          setLessons(Array.isArray(ls)   ? ls   : []);
          setReviews(Array.isArray(rv)   ? rv   : []);
          setLiveSessions(Array.isArray(live) ? live : []);
        }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [id, user?.email]);

  async function buyFull() {
    if (!user) return;
    setBuying(true); setBuyMsg('');
    try {
      const r = await fetch(`${API}/course-purchases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_email: user.email, course_id: id }),
      });
      const d = await r.json();
      if (d.success) {
        setBuyMsg('🎉 Course unlocked!');
        setPurchases(prev => [...prev, { course_id: id, lesson_id: null }]);
      }
    } catch { setBuyMsg('Purchase failed. Try again.'); }
    finally { setBuying(false); }
  }

  async function buyLesson(lesson) {
    if (!user) return;
    setBuyingLesson(lesson.id); setBuyMsg('');
    try {
      const r = await fetch(`${API}/course-purchases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_email: user.email, course_id: id, lesson_id: lesson.id }),
      });
      const d = await r.json();
      if (d.success) {
        setBuyMsg(`✅ Lesson "${lesson.title}" unlocked!`);
        setPurchases(prev => [...prev, { course_id: id, lesson_id: lesson.id }]);
      }
    } catch { setBuyMsg('Purchase failed.'); }
    finally { setBuyingLesson(null); }
  }

  async function submitReview() {
    if (!myRating || !user) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/course-reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: id, reviewer_email: user.email, rating: myRating, review_text: myReview }),
      });
      const d = await r.json();
      if (d.id) {
        setReviews(prev => [{ ...d, reviewer_name: user.name }, ...prev.filter(r => r.reviewer_email !== user.email)]);
        setMyRating(0); setMyReview('');
        // refresh avg_rating
        setCourse(prev => ({ ...prev, avg_rating: d.rating }));
      } else {
        alert(d.error || 'Failed to submit review');
      }
    } catch {} finally { setSubmitting(false); }
  }

  async function handleMuxUpload(file) {
    if (!file) return;
    setUploadFileName(file.name);
    setUploadState('uploading');
    setUploadProgress(0);
    try {
      // 1. Get upload URL from our backend
      const r = await fetch(`${API}/mux/upload-url`, { method: 'POST' });
      const { upload_id, url } = await r.json();

      // 2. Upload file directly to Mux with XHR for progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 100));
        };
        xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error('Upload failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      // 3. Poll until Mux finishes processing
      setUploadState('processing');
      setUploadProgress(100);
      let playbackId = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`${API}/mux/upload/${upload_id}`).then(r => r.json());
        if (poll.playback_id) { playbackId = poll.playback_id; break; }
        if (poll.status === 'errored') throw new Error('Mux processing failed');
      }
      if (!playbackId) throw new Error('Timeout waiting for Mux');

      // 4. Store as mux:{playback_id}
      setNewLesson(p => ({ ...p, video_url: `mux:${playbackId}` }));
      setUploadState('done');
    } catch (err) {
      console.error('Mux upload error:', err);
      setUploadState('error');
    }
  }

  async function addLesson(e) {
    e.preventDefault();
    if (!newLesson.title.trim() || !newLesson.video_url) return;
    setAddingLesson(true);
    try {
      const r = await fetch(`${API}/lessons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: id,
          title: newLesson.title.trim(),
          video_url: newLesson.video_url || '',
        }),
      });
      const d = await r.json();
      if (d.id) {
        setLessons(prev => [...prev, d]);
        setNewLesson({ title:'', video_url:'' });
        setUploadFileName('');
        setShowAddLesson(false);
        setLessonSubmitted(true);
        setTimeout(() => setLessonSubmitted(false), 6000);
      }
    } catch {}
    setAddingLesson(false);
  }

  async function messageInstructor() {
    if (!course || !user) return;
    navigate(`/messages?with=${encodeURIComponent(course.creator_email)}`);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading course…
      </div>
    </div>
  );

  if (!course || course.error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 flex flex-col items-center justify-center gap-4">
      <span className="text-4xl">😕</span>
      <p className="font-bold text-slate-900 dark:text-white">Course not found</p>
      <button onClick={() => navigate('/courses')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">← Browse courses</button>
    </div>
  );

  const isFree       = Number(course.full_price) === 0;
  const totalMinutes = lessons.reduce((s, l) => s + (Number(l.duration_min) || 0), 0);

  // ── Paywall — paid course, user hasn't purchased, not instructor, not admin ──
  if (!isFree && !isInstructor && !hasFull && !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30">
            {(course.photo_url || course.thumbnail_url)
              ? <img src={course.photo_url || course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl">📚</div>
            }
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
              🔒 Cours payant
            </span>
          </div>

          {/* Info */}
          <div className="p-6">
            <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">{course.category}</p>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 leading-snug">{course.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              par <span className="font-semibold">{course.instructor_name || course.creator_email?.split('@')[0]}</span>
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-4 text-center mb-5">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-0.5">
                {Number(course.full_price).toFixed(2)} TND
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                🔒 Accès complet requis pour voir ce cours
              </p>
            </div>

            {buyMsg && (
              <p className="text-sm font-semibold text-center text-emerald-600 dark:text-emerald-400 mb-3">{buyMsg}</p>
            )}

            <button onClick={buyFull} disabled={buying}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold transition-all active:scale-[.98] shadow-sm shadow-indigo-500/25 disabled:opacity-60 mb-3">
              {buying ? 'Traitement…' : `Acheter ce cours — ${Number(course.full_price).toFixed(2)} TND`}
            </button>

            <button onClick={() => navigate('/courses')}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              ← Retour aux cours
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate('/courses')}
              className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold mb-5 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              All Courses
            </button>

            <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold mb-4">
              {course.category}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
              {course.title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-2xl">
              {course.description}
            </p>

            <div className="flex items-center gap-4 flex-wrap text-sm text-slate-300 mb-5">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
                </svg>
                {Number(course.avg_rating).toFixed(1)} ({reviews.length} reviews)
              </span>
              <span>👥 {course.total_students} students</span>
              <span>📖 {lessons.length} lessons</span>
              {totalMinutes > 0 && <span>⏱ {Math.floor(totalMinutes/60)}h {totalMinutes%60}m total</span>}
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                {course.instructor_photo
                  ? <img src={course.instructor_photo} alt="" className="w-full h-full object-cover" />
                  : (course.instructor_name || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Instructor</p>
                <p className="text-sm font-semibold text-white">{course.instructor_name || course.creator_email}</p>
              </div>
            </div>
          </div>

          {/* Right: Buy card */}
          <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {course.thumbnail_url && (
              <div className="aspect-video overflow-hidden">
                <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              {/* Price */}
              <p className={`text-3xl font-extrabold mb-4 ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {isFree ? 'Gratuit' : `${Number(course.full_price).toFixed(2)} TND`}
              </p>

              {buyMsg && (
                <div className={`text-xs rounded-xl px-3 py-2 mb-3 ${buyMsg.startsWith('🎉') || buyMsg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                  {buyMsg}
                </div>
              )}

              {isInstructor ? (
                <div className="text-xs text-center text-slate-500 dark:text-slate-400 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  You are the instructor of this course
                </div>
              ) : hasFull ? (
                <div className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-bold py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  ✅ You own this course
                </div>
              ) : (
                <>
                  <button onClick={buyFull} disabled={buying}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-sm shadow-indigo-500/30 mb-3">
                    {buying ? 'Processing…' : isFree ? 'Enroll for Free' : `Acheter — ${Number(course.full_price).toFixed(2)} TND`}
                  </button>
                  {!isFree && (
                    <p className="text-[10px] text-center text-slate-400">or purchase lessons individually below</p>
                  )}
                </>
              )}

              <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Full lifetime access
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Certificate of completion
                </div>
                {course.first_lesson_free && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    First lesson free preview
                  </div>
                )}
              </div>

              <button onClick={messageInstructor}
                className="w-full mt-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Message Instructor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6">
          {[
            { id: 'curriculum', label: `Curriculum (${lessons.length})` },
            { id: 'reviews',    label: `Reviews (${reviews.length})` },
            { id: 'live',       label: `Live Sessions (${liveSessions.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Curriculum ────────────────────────────────────────────────────── */}
        {activeTab === 'curriculum' && (
          <div className="space-y-2 mb-10">
            {/* Lesson submitted banner */}
            {lessonSubmitted && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-2">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300">Leçon envoyée à l'admin</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">En attente de vérification · Résultat sous 24h max · Vous serez notifié</p>
                </div>
              </div>
            )}

            {/* Add lesson button — instructor only */}
            {isInstructor && (
              <div className="mb-4">
                {!showAddLesson ? (
                  <button onClick={() => setShowAddLesson(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-[.99] transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Ajouter une leçon
                  </button>
                ) : (
                  <form onSubmit={addLesson} className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4 space-y-3">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">Nouvelle leçon</p>
                    {/* Title */}
                    <input required placeholder="Titre de la leçon *" value={newLesson.title}
                      onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    {/* Mux video upload */}
                    <input type="file" accept="video/mp4,video/*" className="hidden"
                      ref={r => { muxFileRef.current = r; }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleMuxUpload(f); }} />

                    {uploadState === 'idle' && (
                      <button type="button" onClick={() => muxFileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        Importer une vidéo MP4 *
                      </button>
                    )}

                    {uploadState === 'uploading' && (
                      <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold truncate flex-1 mr-2">{uploadFileName}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400">Envoi en cours…</p>
                      </div>
                    )}

                    {uploadState === 'processing' && (
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <svg className="w-5 h-5 text-amber-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Traitement Mux en cours…</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500">Peut prendre 1–2 minutes</p>
                        </div>
                      </div>
                    )}

                    {uploadState === 'done' && (
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Vidéo prête ✅</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 truncate">{uploadFileName}</p>
                        </div>
                        <button type="button" onClick={() => { setUploadState('idle'); setUploadProgress(0); setUploadFileName(''); setNewLesson(p => ({ ...p, video_url: '' })); if(muxFileRef.current) muxFileRef.current.value=''; }}
                          className="text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    )}

                    {uploadState === 'error' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <span className="text-amber-500 text-sm">⚠️</span>
                          <p className="text-xs text-amber-700 dark:text-amber-400">Upload MP4 indisponible. Utilisez un lien vidéo :</p>
                        </div>
                        <input
                          placeholder="Lien YouTube ou URL directe (https://...)"
                          value={newLesson.video_url.startsWith('mux:') ? '' : newLesson.video_url}
                          onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        <button type="button" onClick={() => { setUploadState('idle'); setNewLesson(p => ({ ...p, video_url: '' })); }}
                          className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                          ↩ Réessayer l'upload MP4
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setShowAddLesson(false); setUploadFileName(''); setUploadState('idle'); setUploadProgress(0); setNewLesson({ title:'', video_url:'' }); if(muxFileRef.current) muxFileRef.current.value=''; }}
                        className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Annuler
                      </button>
                      <button type="submit"
                        disabled={addingLesson || !newLesson.title.trim() || !newLesson.video_url || uploadState === 'uploading' || uploadState === 'processing'}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                        {addingLesson ? 'Ajout…' : uploadState === 'uploading' ? 'Upload…' : uploadState === 'processing' ? 'Traitement…' : 'Ajouter'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {lessons.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-3xl mb-2">📂</p>
                <p className="text-sm">No lessons added yet</p>
              </div>
            ) : lessons.map((lesson, idx) => {
              const watchable = canWatch(lesson);
              return (
                <div key={lesson.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    watchable
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50'
                  }`}
                  onClick={() => watchable && navigate(`/courses/${id}/lesson/${lesson.id}`)}>
                  {/* Index */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    watchable ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {watchable ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                    ) : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${watchable ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {lesson.title}
                      </p>
                      {lesson.status === 'pending' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">⏳ En attente</span>
                      )}
                      {lesson.status === 'rejected' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">❌ Refusée</span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{lesson.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {lesson.is_free_preview && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        Free
                      </span>
                    )}
                    {lesson.duration_min > 0 && (
                      <span className="text-xs text-slate-400">{lesson.duration_min}m</span>
                    )}
                    {!watchable && Number(lesson.price) > 0 && !hasFull && (
                      <button onClick={e => { e.stopPropagation(); buyLesson(lesson); }}
                        disabled={buyingLesson === lesson.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60">
                        {buyingLesson === lesson.id ? '…' : `${Number(lesson.price).toFixed(2)} TND`}
                      </button>
                    )}
                    {!watchable && (Number(lesson.price) === 0 || !lesson.price) && (
                      <LockIcon />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div className="space-y-5 mb-10">
            {/* Rating summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-slate-900 dark:text-white">{Number(course.avg_rating).toFixed(1)}</p>
                <div className="mt-1"><StarRating rating={course.avg_rating} /></div>
                <p className="text-xs text-slate-400 mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(s => {
                  const count = reviews.filter(r => r.rating === s).length;
                  const pct   = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-3">{s}</span>
                      <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/>
                      </svg>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave a review */}
            {hasFull && !isInstructor && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Leave a Review</p>
                <StarRating rating={myRating} interactive onRate={setMyRating} />
                <textarea value={myReview} onChange={e => setMyReview(e.target.value)} rows={3}
                  placeholder="Share your experience…"
                  className="mt-3 w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={submitReview} disabled={!myRating || submitting}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">No reviews yet — be the first!</p>
              </div>
            ) : reviews.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {r.reviewer_photo
                    ? <img src={r.reviewer_photo} alt="" className="w-full h-full object-cover" />
                    : (r.reviewer_name || r.reviewer_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.reviewer_name || r.reviewer_email}</p>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.review_text && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.review_text}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Live Sessions ─────────────────────────────────────────────────── */}
        {activeTab === 'live' && (
          <div className="space-y-4 mb-10">
            {liveSessions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-3xl mb-2">📡</p>
                <p className="text-sm">No live sessions scheduled</p>
              </div>
            ) : liveSessions.map(s => {
              const isPast = s.scheduled_at && new Date(s.scheduled_at) < new Date();
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl shrink-0">
                    {s.is_recorded ? '🎬' : '📡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
                    {s.scheduled_at && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(s.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        {isPast && ' (ended)'}
                      </p>
                    )}
                    {s.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className={`text-sm font-extrabold ${Number(s.price) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {Number(s.price) === 0 ? 'Gratuit' : `${Number(s.price).toFixed(2)} TND`}
                    </span>
                    {s.is_recorded && s.recording_url && (
                      <a href={s.recording_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
                        Watch Recording
                      </a>
                    )}
                    {!s.is_recorded && s.join_url && !isPast && (
                      <a href={s.join_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                        Join Live →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
