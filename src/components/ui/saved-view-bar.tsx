'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface SavedView { id: string; name: string; filters: Record<string, unknown> }

interface SavedViewBarProps {
  page: string;
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
}

export function SavedViewBar({ page, currentFilters, onApply }: SavedViewBarProps) {
  const locale = useLocale();
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`/api/saved-views?page=${encodeURIComponent(page)}`);
    if (r.ok) setViews((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, [page]);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/saved-views', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page, name: name.trim(), filters: currentFilters }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم حفظ العرض', ku: 'نیشاندان پاشەکەوت کرا', en: 'View saved' }));
      setShowSave(false); setName('');
      load();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/saved-views?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (views.length === 0 && !showSave) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowSave(true)} className="text-xs text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" /> {tri(locale, { ar: 'حفظ عرض', ku: 'نیشاندان پاشەکەوت بکە', en: 'Save view' })}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Bookmark className="h-4 w-4 text-muted-foreground" />
      {views.map((v) => (
        <div key={v.id} className="group flex items-center gap-0.5 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
          <button type="button" onClick={() => onApply(v.filters as Record<string, unknown>)} className="hover:underline">
            {v.name}
          </button>
          <button type="button" onClick={() => remove(v.id)} className="ml-0.5 opacity-0 group-hover:opacity-60">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      {showSave ? (
        <div className="flex items-center gap-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tri(locale, { ar: 'اسم العرض', ku: 'ناوی نیشاندان', en: 'View name' })}
            className="h-7 w-32 text-xs" onKeyDown={(e) => e.key === 'Enter' && save()} />
          <Button size="sm" variant="ghost" onClick={save} disabled={busy} className="h-7 px-2"><Plus className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSave(false)} className="h-7 px-2"><X className="h-3 w-3" /></Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowSave(true)} className="h-7 px-2 text-xs text-muted-foreground">
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
