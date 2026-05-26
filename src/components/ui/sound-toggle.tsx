'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { initSoundPref, isSoundEnabled, setSoundEnabled } from '@/lib/sound/click';

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    initSoundPref();
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  }

  const Icon = on ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title={on ? 'Sound on' : 'Sound off'}
      aria-label={on ? 'Mute interface sounds' : 'Enable interface sounds'}
      aria-pressed={on}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
