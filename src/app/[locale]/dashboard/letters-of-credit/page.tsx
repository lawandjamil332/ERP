'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Banknote } from 'lucide-react';

interface LC {
  id: string; lcNumber: string; issuingBank: string; beneficiary: string;
  currency: string; amount: string; drawnAmount: string;
  issueDate: string; expiryDate: string; status: string;
}

export default function LcListPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [rows, setRows] = useState<LC[] | null>(null);

  useEffect(() => {
    fetch('/api/letters-of-credit')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((b) => setRows(b.data ?? []))
      .catch(() => setRows([]));
  }, []);

  const title = locale === 'ar' ? 'الاعتمادات المستندية' : locale === 'ku' ? 'متمانە بەڵگەییەکان' : 'Letters of credit';
  const desc = locale === 'ar' ? 'اعتمادات استيراد عبر نافذة العملة الأجنبية للبنك المركزي العراقي' :
               locale === 'ku' ? 'متمانە بەڵگەییەکانی هاوردە لە پەنجەرەی دراوی بیانی بانکی ناوەندی عێراق' :
               'Import LCs via the CBI foreign-currency window';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={desc}
        actions={
          <Button asChild>
            <Link href={`/${locale}/dashboard/letters-of-credit/new`}>
              <Plus className="h-4 w-4" /> {locale === 'ar' ? 'فتح اعتماد جديد' : 'Open LC'}
            </Link>
          </Button>
        }
      />

      {rows === null ? (
        <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={t('common.noData')}
          description={desc}
          action={
            <Button asChild>
              <Link href={`/${locale}/dashboard/letters-of-credit/new`}>
                <Plus className="h-4 w-4" /> {locale === 'ar' ? 'فتح اعتماد جديد' : 'Open LC'}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{locale === 'ar' ? 'رقم الاعتماد' : 'LC #'}</TH>
                <TH>{locale === 'ar' ? 'البنك المُصدِر' : 'Issuing bank'}</TH>
                <TH>{locale === 'ar' ? 'المستفيد' : 'Beneficiary'}</TH>
                <TH className="text-end">{locale === 'ar' ? 'القيمة' : 'Amount'}</TH>
                <TH className="text-end">{locale === 'ar' ? 'المسحوب' : 'Drawn'}</TH>
                <TH>{locale === 'ar' ? 'الاستحقاق' : 'Expiry'}</TH>
                <TH>{t('invoice.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((lc) => (
                <TR key={lc.id}>
                  <TD className="font-mono text-xs">{lc.lcNumber}</TD>
                  <TD>{lc.issuingBank}</TD>
                  <TD>{lc.beneficiary}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(lc.amount).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')} {lc.currency}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(lc.drawnAmount).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en')}</TD>
                  <TD className="tabular-nums">{new Intl.DateTimeFormat(locale).format(new Date(lc.expiryDate))}</TD>
                  <TD><LcStatusBadge status={lc.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function LcStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
    OPEN: 'default', PARTIALLY_DRAWN: 'warning', FULLY_DRAWN: 'success', EXPIRED: 'destructive', CANCELLED: 'outline',
  };
  return <Badge variant={(variants[status] ?? 'outline') as any}>{status.replace('_', ' ')}</Badge>;
}
