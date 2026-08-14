import { useLayoutEffect, useState } from 'react';

// Computes fixed-viewport coordinates for a floating panel (dropdown,
// calendar, menu) anchored to a trigger element. Meant to be paired with a
// portal that renders the panel straight into <body> — that way it escapes
// whatever scrollable/overflow container it's opened inside (a modal, a
// card, a table row) instead of stretching that container's own scrollbar
// to make room for it. Flips upward automatically when there isn't enough
// room below the trigger.
export default function useFloatingPosition(triggerRef, isOpen, { maxHeight = 280, gap = 6 } = {}) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      setPosition({
        left: rect.left,
        width: rect.width,
        openUp,
        top: openUp ? null : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : null
      });
    };

    update();
    // Capture phase so this also fires for scrolls inside nested scroll
    // containers (e.g. a modal body), which don't bubble to window.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, triggerRef, maxHeight, gap]);

  return position;
}
