// Shared with AuthContext.js so any user row fetched anywhere in the app —
// the global directory, a paginated browse endpoint, etc. — normalizes to
// the exact same camelCase shape every component already expects.
export function safeParseJson(val, fallback) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.startsWith('[')) {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val ?? fallback;
}

export function normalizeUser(r, trustCin = true) {
  return {
    email:              r.email,
    password:           r.password,
    name:               r.name,
    role:               r.role,
    dob:                r.dob,
    region:             r.region,
    gender:             r.gender     ?? null,
    photo:              r.photo      ?? null,
    skills:             safeParseJson(r.skills, null),
    bio:                r.bio           ?? null,
    portfolio_url:      r.portfolio_url ?? null,
    hourly_rate:        r.hourly_rate   ?? null,
    title:              r.title         ?? null,
    portfolio:          safeParseJson(r.portfolio, []),
    cin:                r.cin,
    cinFront:           r.cin_front,
    cinBack:            r.cin_back,
    cinVerified:        r.cin_verified,
    cinStatus:          r.cin_status ?? (r.cin_verified ? "approved" : "pending"),
    cinRejectionReason: r.cin_rejection_reason ?? null,
    cinApprovalReason:  r.cin_approval_reason  ?? null,
    // Public (unauthenticated) listings never include cin_status/rejection/approval
    // reason — only an admin-sourced fetch or the login response itself can be
    // trusted for those specific fields.
    _cinTrusted:        trustCin || r.cin_status !== undefined,
    statusSeen:         r.status_seen ?? false,
    availability:       r.availability ?? 'available',
    company:            r.company      ?? null,
    registeredAt:       r.registered_at,
    lastSeen:           r.last_seen    ?? null,
    isAdmin:            r.role === 'admin',
    rating:             Number(r.rating) || 0,
    completedProjects:  Number(r.completed_projects) || 0,
  };
}
