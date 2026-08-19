import { useAuth } from "../context/AuthContext";

// True only for a CLIENT account whose approval is still pending — never for
// freelancers or admins, and never for an approved/rejected client. Used to
// disable actionable UI (post a project, send a message, accept/reject a
// proposal, buy a course, etc.) while the account is read-only-browse. The
// real restriction is enforced on the backend (requireApprovedClient) — this
// hook only drives the frontend's disabled/explained state, it is not the
// security boundary itself.
export default function usePendingClientReadOnly() {
  const { user } = useAuth();
  return user?.role === "client" && user?.cinStatus === "pending";
}
