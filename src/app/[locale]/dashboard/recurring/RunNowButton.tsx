'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { toast } from '@/lib/toast';

export function RunNowButton() {
  const t = useTranslations('recurring');
  const tc = useTranslations('common');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch('/api/recurring-invoices/run', { method: 'POST' });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        toast.error(body.error ?? `HTTP ${res.status}`);
        return;
      }
      const n = body?.data?.generated ?? 0;
      toast.success(`${t('runNow')} — ${n}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? tc('errors.network'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={busy}>
      <Play className="h-4 w-4" /> {busy ? tc('loading') : t('runNow')}
    </Button>
  );
}
