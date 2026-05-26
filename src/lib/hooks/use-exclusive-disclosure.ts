'use client';

import { useCallback, useEffect, useState } from 'react';

const EVT = 'erp:popover-open';

/**
 * Disclosure state that auto-closes all other disclosures when this one opens.
 * Every popover/dropdown/menu in the app shares one channel, so only one can be
 * open at a time — opening any one broadcasts and the rest close themselves.
 */
export function useExclusiveDisclosure(id: string) {
  const [open, setOpen] = useState(false);

  // Close myself when a different popover announces it opened.
  useEffect(() => {
    function onOther(e: Event) {
      const who = (e as CustomEvent<string>).detail;
      if (who !== id) setOpen(false);
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

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, close };
}
