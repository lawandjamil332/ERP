'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollText, Plus, ArrowRight } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Q {
  id: string; number: string; date: string; validUntil: string | null;
  contactId: string; currency: string; total: string; status: string;
}

const STATUS_AR: Record<string, string> = {
  DRAFT: 'مسودة', SENT: 'مُرسَلة', ACCEPTED: 'مقبولة',
  REJECTED: 'مرفوضة', EXPIRED: 'منتهية', CONVERTED: 'محوّلة لفاتورة',
};

export default function QuotationsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<Q[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch('/api/quotations');
    if (r.ok) setRows((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function convert(id: string) {
    setBusy(id);
    const res = await fetch(`/api/quotations/${id}/convert`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { toast.error(body.error ?? 'failed'); return; }
    toast.success(isAr ? 'تم التحويل إلى فاتورة' : 'Converted to invoice');
    router.push(`/${locale}/dashboard/invoices`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'عروض الأسعار' : 'Quotations'}
        description={isAr
          ? 'عروض أسعار قبل البيع — قابلة للتحويل إلى فاتورة بنقرة'
          : 'Pre-sale price quotations — convert to invoice in one click'}
        actions={
          <Button asChild>
            <Link href={`/${locale}/dashboard/quotations/new`}>
              <Plus className="h-4 w-4" /> {isAr ? 'عرض سعر جديد' : 'New quotation'}
            </Link>
          </Button>
        }
      />

      {rows === null ? (
        <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={t('common.noData')}
          action={
            <Button asChild>
              <Link href={`/${locale}/dashboard/quotations/new`}>
                <Plus className="h-4 w-4" /> {isAr ? 'عرض سعر جديد' : 'New quotation'}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{isAr ? 'الرقم' : 'Number'}</TH>
                <TH>{isAr ? 'التاريخ' : 'Date'}</TH>
                <TH>{isAr ? 'صالح حتى' : 'Valid until'}</TH>
                <TH className="text-end">{isAr ? 'الإجمالي' : 'Total'}</TH>
                <TH>{isAr ? 'الحالة' : 'Status'}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((q) => (
                <TR key={q.id}>
                  <TD className="font-mono text-xs">{q.number}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(q.date))}</TD>
                  <TD className="tabular-nums">{q.validUntil ? new Intl.DateTimeFormat(locale).format(new Date(q.validUntil)) : '—'}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(q.total).toLocaleString(isAr ? 'ar-IQ' : 'en')} {q.currency}</TD>
                  <TD>
                    <Badge variant={
                      q.status === 'ACCEPTED' || q.status === 'CONVERTED' ? 'success' :
                      q.status === 'REJECTED' || q.status === 'EXPIRED' ? 'destructive' :
                      q.status === 'SENT' ? 'default' : 'outline'
                    }>
                      {isAr ? STATUS_AR[q.status] ?? q.status : q.status}
                    </Badge>
                  </TD>
                  <TD>
                    {q.status !== 'CONVERTED' && q.status !== 'REJECTED' && (
                      <Button size="sm" variant="outline" onClick={() => convert(q.id)} disabled={busy === q.id}>
                        {busy === q.id ? '…' : (isAr ? 'تحويل لفاتورة' : 'To invoice')}
                        <ArrowRight className="h-3.5 w-3.5 flip-rtl" />
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
