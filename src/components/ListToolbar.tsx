'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

export function ListToolbar({
  placeholder = 'Search…',
  hasMore = false,
  prevCursor,
  nextCursor,
}: {
  placeholder?: string;
  hasMore?: boolean;
  prevCursor?: string | null;
  nextCursor?: string | null;
}) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  useEffect(() => {
    const cur = sp.get('q') ?? '';
    if (q === cur) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp);
      if (q) params.set('q', q); else params.delete('q');
      params.delete('cursor');
      router.push(`${path}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  function go(cursor: string | null | undefined) {
    if (!cursor) return;
    const params = new URLSearchParams(sp);
    params.set('cursor', cursor);
    router.push(`${path}?${params.toString()}`);
  }

  function clearAll() {
    setQ('');
    router.push(path);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="ps-9 pe-9"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(prevCursor || nextCursor || sp.get('q')) && (
          <Button variant="ghost" size="sm" onClick={clearAll}>Reset</Button>
        )}
        <Button variant="outline" size="sm" disabled={!prevCursor} onClick={() => go(prevCursor)}>
          <ChevronLeft className="h-4 w-4 flip-rtl" />
        </Button>
        <Button variant="outline" size="sm" disabled={!hasMore || !nextCursor} onClick={() => go(nextCursor)}>
          <ChevronRight className="h-4 w-4 flip-rtl" />
        </Button>
      </div>
    </div>
  );
}
