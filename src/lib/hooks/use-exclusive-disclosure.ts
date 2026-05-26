'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const EVT = 'erp:popover-open';

/**
 * Disclosure state with three guarantees:
 *   1. Only one popover open at a time (shared broadcast channel).
 *   2. Closes on outside click — WITHOUT a full-screen backdrop that would
 *      block sibling trigger buttons (that was the "needs two clicks" bug).
 *   3. Closes on Escape.
 *
 * Attach the returned `ref` to the popover's wrapper element (the one that
 * contains BOTH the trigger and the menu).
 */
export function useExclusiveDisclosure<T extends HTMLElement = HTMLDivElement>(id: string) {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  // Close myself when a different popover announces it opened.
  useEffect(() => {
    function onOther(e: Event) {
      if ((e as CustomEvent<string>).detail !== id) setOpen(false);
    }
    window.addEventListener(EVT, onOther);
    return () => window.removeEventListener(EVT, onOther);
  }, [id]);

  // Announce when I open so the others close.
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
    }
  }, [open, id]);

  // Outside-click + Escape — only while open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, close, ref };
}
