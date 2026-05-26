'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface Milestone { name: string; percentage: number; retentionPct: number }

export default function NewProjectPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState('ar');
  const [form, setForm] = useState({
    code: '', nameAr: '', nameEn: '', contractValue: 0, currency: 'IQD',
    startDate: new Date().toISOString().slice(0, 10), endDate: '',
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: 'Down payment / دفعة مقدمة', percentage: 20, retentionPct: 0 },
    { name: 'Progress milestone / إنجاز', percentage: 60, retentionPct: 0.10 },
    { name: 'Final / نهائية', percentage: 20, retentionPct: 0.10 },
  ]);
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { params.then(({ locale }) => setLocale(locale)); }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/projects', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form, contractValue: Number(form.contractValue),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        milestones: milestones.map((m) => ({ ...m, percentage: Number(m.percentage), retentionPct: Number(m.retentionPct) })),
      }),
    });
    setBusy(false);
    if (res.ok) { router.push(`/${locale}/dashboard/projects`); router.refresh(); }
    else setErr((await res.json().catch(() => ({}))).error ?? 'Failed');
  }

  const totalPct = milestones.reduce((s, m) => s + Number(m.percentage), 0);

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New project / مشروع جديد</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={busy || !form.code || !form.nameAr || totalPct !== 100}>Save</Button>
        </div>
      </div>
      {err && <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{err}</div>}
      <Card>
        <CardHeader><CardTitle>Project</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Fld label="Code" req><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Fld>
          <Fld label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Fld>
          <Fld label="Name (AR)" req><Input dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required /></Fld>
          <Fld label="Name (EN)" req><Input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required /></Fld>
          <Fld label="Contract value" req>
            <Input type="number" min="0" dir="ltr" value={form.contractValue}
              onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })} required /></Fld>
          <Fld label="Start date"><Input type="date" dir="ltr" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Fld>
          <Fld label="End date"><Input type="date" dir="ltr" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Fld>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Milestones (must sum to 100%)</CardTitle>
            <Button type="button" variant="outline" size="sm"
              onClick={() => setMilestones([...milestones, { name: '', percentage: 0, retentionPct: 0.10 }])}>
              <Plus className="h-4 w-4" /> Add milestone
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Current sum: {totalPct}% · Iraq construction retention is typically 5–10%.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-5">
              <Fld label="Name"><Input value={m.name}
                onChange={(e) => setMilestones(milestones.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} required /></Fld>
              <Fld label="% of contract">
                <Input type="number" min="0" max="100" step="1" dir="ltr" value={m.percentage}
                  onChange={(e) => setMilestones(milestones.map((x, idx) => idx === i ? { ...x, percentage: Number(e.target.value) } : x))} required />
              </Fld>
              <Fld label="Retention (decimal)">
                <Input type="number" min="0" max="0.5" step="0.01" dir="ltr" value={m.retentionPct}
                  onChange={(e) => setMilestones(milestones.map((x, idx) => idx === i ? { ...x, retentionPct: Number(e.target.value) } : x))} />
              </Fld>
              <div className="col-span-2 text-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}

function Fld({ label, children, req }: { label: string; children: React.ReactNode; req?: boolean }) {
  return <div className="space-y-1.5"><Label>{label}{req && <span className="text-destructive"> *</span>}</Label>{children}</div>;
}
