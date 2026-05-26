'use client';

import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface Props {
  value?: 'desktop' | 'mobile';
  onChange?: (v: 'desktop' | 'mobile') => void;
}

export function ViewToggle({ value, onChange }: Props) {
  const [internal, setInternal] = useState<'desktop' | 'mobile'>(value ?? 'desktop');
  const v = value ?? internal;
  function set(next: 'desktop' | 'mobile') { setInternal(next); onChange?.(next); }
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      <button type="button" onClick={() => set('desktop')}
        className={`grid h-7 w-7 place-items-center rounded ${v === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        aria-label="Desktop view"><Monitor className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={() => set('mobile')}
        className={`grid h-7 w-7 place-items-center rounded ${v === 'mobile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        aria-label="Mobile view"><Smartphone className="h-3.5 w-3.5" /></button>
    </div>
  );
}
