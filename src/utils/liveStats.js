// Loaders for the public, server-cached counters shown on Home, Freelancers,
// Clients and Courses. Every number on those pages comes from here (or from the
// paginated list's own `total`) — nothing is typed in by hand — and each loader
// throws on a bad response so useLivePoll keeps the previous numbers instead of
// replacing them with zeros.
const API = process.env.REACT_APP_API_URL || 'https://famamennou-server.onrender.com/api';

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== 'object' || data.error) throw new Error(`${path} → bad payload`);
  return data;
}

const n = v => Number(v) || 0;

export async function loadFreelancerStats() {
  const r = await getJson('/users/public/freelancers/stats');
  return { verified: n(r.verified_freelancers), regions: n(r.regions_covered), reviews: n(r.reviews_received) };
}

export async function loadProjectStats() {
  const r = await getJson('/projects/browse/open/stats');
  return { openProjects: n(r.open_projects), activeClients: n(r.active_clients), regionsCovered: n(r.regions_covered), proposalsSent: n(r.proposals_sent) };
}

// Every project the Clients page can list (open and already taken) — the figure
// on its "All" chip. The paginated list reports it as `total`, so one row is enough.
export async function loadProjectsTotal() {
  const r = await getJson('/projects/browse/open?page=1&limit=1');
  return n(r.total);
}

// /courses/stats returns the distinct-instructor count and, on current
// backends, the catalog-wide course, category and enrollment counts too. On an older
// backend only `instructors` exists, so the missing figures are derived from the
// catalog itself: the course total is the unfiltered list's own `total`, the category
// count is the number of distinct categories on its first page, and the enrollment
// count is the sum of `total_students` over that page (50 rows, the server's cap —
// exact for any catalog up to that size). Either way the number reflects what is
// actually published, never a fixed taxonomy size.
export async function loadCourseStats() {
  const r = await getJson('/courses/stats');
  let { courses, categories, enrollments } = r;
  if (courses == null || categories == null || enrollments == null) {
    try {
      const list = await getJson('/courses?page=1&limit=50');
      const rows = list.rows || [];
      if (courses == null) courses = list.total;
      if (categories == null) categories = new Set(rows.map(c => String(c.category || '').trim()).filter(Boolean)).size;
      if (enrollments == null) enrollments = rows.reduce((sum, c) => sum + n(c.total_students), 0);
    } catch { /* leave whatever is still unknown as null → shown as "—" */ }
  }
  return {
    courses: courses == null ? null : n(courses),
    categories: categories == null ? null : n(categories),
    instructors: n(r.instructors),
    enrollments: enrollments == null ? null : n(enrollments),
  };
}

// The three live figures on the login / sign-up brand panel: verified freelancers, active
// clients and regions covered — the same public counters Home and the directories use.
export async function loadAuthStats() {
  const [fl, pr] = await Promise.all([loadFreelancerStats(), loadProjectStats()]);
  return { verified: fl.verified, regions: fl.regions, clients: pr.activeClients };
}
