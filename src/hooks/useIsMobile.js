import { useState, useEffect } from 'react';

export const MOBILE_BREAKPOINT = 768;

// Drives the split between the desktop shell (fixed sidebar, tables,
// drag-and-drop Kanban) and the mobile shell (bottom nav, card lists,
// tap-to-move Kanban) — see MobileShell.jsx and the per-view mobile
// branches. Uses matchMedia (not window.innerWidth on resize) so it also
// reacts correctly to devtools device toolbar toggles and orientation
// changes, not just window resizes.
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
