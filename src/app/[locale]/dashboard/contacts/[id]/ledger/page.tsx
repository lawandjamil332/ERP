'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Wallet, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

interface Entry {
  date: string; type: string; reference: string; description: string;
  currency: string; debit: string; credit: string; balance: string;
}
interface Data {
  contact: { nameAr: string; nameEn: string | null; taxNumber: string | null; currency: string; creditLimit: string };
  totals: { debit: string; credit: string; balance: string };
  entries: Entry[];
}

export default function ContactLedgerPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const res = await fetch(`/api/contacts/${params.id}/ledger?${qs.toString()}`);
    if (res.ok) setData(await res.json());
    setBusy(false);
  }

  useEffect(() => { load(); }, [params.id]);

  if (!data) {
    return <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  const contactName = locale === 'ar' ? data.contact.nameAr : (data.contact.nameEn ?? data.contact.nameAr);
  const balanceNum = parseFloat(data.totals.balance);

  return (
    <div className="space-y-6">
      <PageHeader
        title={contactName}
        description={
          locale === 'ar' ? 'كشف حساب — بضاعة على الحساب' :
          locale === 'ku' ? 'لیستی هەژمار — کاڵا بەسەر هەژمار' :
          'Statement of account — goods on credit ledger'
        }
        actions={
          <Button asChild variant="outline">
            <a href={`/api/contacts/${params.id}/ledger${from || to ? '?' + new URLSearchParams({ from, to }).toString() : ''}`} target="_blank" rel="noreferrer">
              {t('report.exportCsv')}
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone={balanceNum >= 0 ? 'success' : 'destructive'}
          icon={Wallet}
          label={locale === 'ar' ? 'الرصيد الحالي' : 'Current balance'}
          value={`${parseFloat(data.totals.balance).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')} ${data.contact.currency}`}
        />
        <StatCard
          tone="primary"
          icon={TrendingUp}
          label={locale === 'ar' ? 'إجمالي المدين' : 'Total debit'}
          value={parseFloat(data.totals.debit).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')}
        />
        <StatCard
          tone="warning"
          icon={TrendingDown}
          label={locale === 'ar' ? 'إجمالي الدائن' : 'Total credit'}
          value={parseFloat(data.totals.credit).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')}
        />
        <StatCard
          tone="default"
          icon={BookOpen}
          label={locale === 'ar' ? 'سقف الائتمان' : 'Credit limit'}
          value={parseFloat(data.contact.creditLimit).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'تصفية' : 'Filter'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>{t('common.from')}</Label>
            <Input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('common.to')}</Label>
            <Input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={load} disabled={busy}>{t('common.search')}</Button>
        </CardContent>
      </Card>

      {data.entries.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('common.noData')} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t('common.date')}</TH>
                <TH>{locale === 'ar' ? 'النوع' : 'Type'}</TH>
                <TH>{locale === 'ar' ? 'المرجع' : 'Reference'}</TH>
                <TH>{locale === 'ar' ? 'البيان' : 'Description'}</TH>
                <TH className="text-end">{t('accounting.debit')}</TH>
                <TH className="text-end">{t('accounting.credit')}</TH>
                <TH className="text-end">{locale === 'ar' ? 'الرصيد' : 'Balance'}</TH>
              </TR>
            </THead>
            <TBody>
              {data.entries.map((e, i) => (
                <TR key={i}>
                  <TD className="tabular-nums">{e.date}</TD>
                  <TD><TypeBadge type={e.type} /></TD>
                  <TD className="font-mono text-xs">{e.reference}</TD>
                  <TD>{e.description}</TD>
                  <TD className="text-end tabular-nums">{e.debit !== '0.00' ? e.debit : ''}</TD>
                  <TD className="text-end tabular-nums">{e.credit !== '0.00' ? e.credit : ''}</TD>
                  <TD className="text-end font-medium tabular-nums">{e.balance}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, 'default' | 'success' | 'destructive' | 'outline' | 'warning'> = {
    INVOICE: 'default',
    BILL: 'destructive',
    PAYMENT_IN: 'success',
    PAYMENT_OUT: 'warning',
    CREDIT_NOTE: 'outline',
  };
  return <Badge variant={(colors[type] ?? 'outline') as any}>{type.replace('_', ' ')}</Badge>;
}
