'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Approval {
  id: string; entity: string; entityId: string; amount: string; currency: string;
  approverRole: string; currentStep: number; maxSteps: number; escalateAt: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string; decidedAt: string | null; note: string | null;
}

export default function ApprovalsPage() {
  const locale = useLocale();
  const [pending, setPending] = useState<Approval[] | null>(null);
  const [decided, setDecided] = useState<Approval[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch('/api/approvals');
    if (r.ok) { const b = await r.json(); setPending(b.pending ?? []); setDecided(b.decided ?? []); }
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    setBusy(id);
    const res = await fetch('/api/approvals', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(decision === 'APPROVED'
        ? tri(locale, { ar: 'تمت الموافقة', ku: 'پەسەند کرا', en: 'Approved' })
        : tri(locale, { ar: 'تم الرفض', ku: 'ڕەتکرایەوە', en: 'Rejected' }));
      load();
    } else toast.error(tri(locale, { ar: 'فشل', ku: 'سەرکەوتوو نەبوو', en: 'Failed' }));
  }

  const fmt = (a: Approval) => `${parseFloat(a.amount).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')} ${a.currency}`;
  const entityLabel = (e: string) => tri(locale, {
    ar: e === 'Payment' ? 'دفعة' : e === 'Invoice' ? 'فاتورة' : 'فاتورة شراء',
    ku: e === 'Payment' ? 'پارەدان' : e === 'Invoice' ? 'پسوڵە' : 'پسوڵەی کڕین',
    en: e,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'الموافقات', ku: 'پەسەندکردنەکان', en: 'Approvals' })}
        description={tri(locale, { ar: 'المعاملات التي تجاوزت حد الموافقة وتنتظر قرارك', ku: 'ئەو مامەڵانەی لە سنووری پەسەندکردن تێپەڕیون و چاوەڕێی بڕیارتن', en: 'Transactions over the approval threshold awaiting your decision' })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {tri(locale, { ar: 'بانتظار الموافقة', ku: 'چاوەڕێی پەسەندکردن', en: 'Pending' })}
            {pending && pending.length > 0 && <Badge>{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{tri(locale, { ar: 'جارٍ التحميل…', ku: 'بارکردن…', en: 'Loading…' })}</p>
          ) : pending.length === 0 ? (
            <EmptyState icon={CheckCircle2}
              title={tri(locale, { ar: 'لا توجد موافقات معلّقة', ku: 'هیچ پەسەندکردنێکی چاوەڕوان نییە', en: 'Nothing awaiting approval' })}
              description={tri(locale, { ar: 'كل شيء على ما يرام', ku: 'هەموو شتێک باشە', en: 'You are all caught up' })} />
          ) : (
            <ul className="divide-y">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{entityLabel(a.entity)} · <span className="tabular-nums">{fmt(a)}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {tri(locale, { ar: 'دور المعتمِد', ku: 'ڕۆڵی پەسەندکار', en: 'Approver role' })}: {a.approverRole} ·{' '}
                      {new Intl.DateTimeFormat(locale).format(new Date(a.createdAt))}
                    </p>
                    {a.maxSteps > 1 && (
                      <p className="mt-1 text-xs font-medium text-blue-600">
                        {tri(locale, {
                          ar: `الخطوة ${a.currentStep} من ${a.maxSteps}`,
                          ku: `هەنگاوی ${a.currentStep} لە ${a.maxSteps}`,
                          en: `Step ${a.currentStep} of ${a.maxSteps}`,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={busy === a.id}
                      onClick={() => decide(a.id, 'REJECTED')}>
                      <XCircle className="h-4 w-4 text-destructive" />
                      {tri(locale, { ar: 'رفض', ku: 'ڕەتکردنەوە', en: 'Reject' })}
                    </Button>
                    <Button size="sm" disabled={busy === a.id}
                      onClick={() => decide(a.id, 'APPROVED')}>
                      <CheckCircle2 className="h-4 w-4" />
                      {tri(locale, { ar: 'موافقة', ku: 'پەسەندکردن', en: 'Approve' })}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {decided.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'قرارات سابقة', ku: 'بڕیارە پێشووەکان', en: 'Recent decisions' })}</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {decided.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{entityLabel(a.entity)} · <span className="tabular-nums">{fmt(a)}</span></span>
                  <Badge variant={a.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {a.status === 'APPROVED'
                      ? tri(locale, { ar: 'موافَق', ku: 'پەسەندکراو', en: 'Approved' })
                      : tri(locale, { ar: 'مرفوض', ku: 'ڕەتکراوە', en: 'Rejected' })}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
