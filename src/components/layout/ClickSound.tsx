'use client';

import { useEffect } from 'react';
import { initSoundPref, isSoundEnabled, playClick } from '@/lib/sound/click';

/**
 * Global click-sound layer. Plays a premium tick on pointerdown over any
 * interactive element. Mounted once in the dashboard layout.
 */
const INTERACTIVE = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  'summary',
  'label',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '.clickable',
].join(',');

export function ClickSound() {
  useEffect(() => {
    initSoundPref();
    function onPointerDown(e: PointerEvent) {
      if (!isSoundEnabled()) return;
      if (e.button !== 0) return; // primary button only
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(INTERACTIVE) as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      const variant = el.matches('input[type="checkbox"], input[type="radio"], [role="switch"]') ? 'toggle' : 'tap';
      playClick(variant);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return null;
}
