import { useEffect } from "react";

// Pins the background page in place behind any open modal/overlay/drawer —
// the page becomes visually "frozen" (no scroll-through), while the modal's
// own content (rendered elsewhere, with its own overflow-y:auto) still
// scrolls normally. Plain `overflow:hidden` on body is NOT enough on iOS
// Safari: a touch drag that starts on a short modal can still scroll the
// page behind it through to the body. Locking body to `position:fixed` at
// its current scroll offset (and restoring both the styles and the exact
// scroll position on close) is the reliable cross-device fix — same
// technique used by every major modal library (react-modal, body-scroll-
// lock, Radix, etc.).
//
// Usage: `useBodyScrollLock(isOpen)` — pass the modal's own open/visible
// boolean. Safe to call unconditionally on every render.
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
