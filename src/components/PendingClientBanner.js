import { useTranslation } from "react-i18next";

// Short inline explanation shown next to any actionable control (post a
// project, send a message, accept/reject a proposal, buy a course...) that's
// disabled for a pending client. Purely explanatory — the actual block is
// enforced by usePendingClientReadOnly on the frontend and requireApprovedClient
// on the backend; this component never decides access on its own.
export default function PendingClientBanner({ compact = false, className = "" }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center gap-2 ${compact ? "text-xs px-3 py-2" : "text-sm px-4 py-3"} rounded-xl ${className}`}
      style={{ background: "var(--fm-warning-bg)", border: "1px solid color-mix(in srgb, var(--fm-warning) 30%, transparent)", color: "var(--fm-warning)" }}
    >
      <svg width={compact ? 14 : 16} height={compact ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
      <span>{t("Your account is pending approval — you can browse, but this action isn't available yet.")}</span>
    </div>
  );
}
