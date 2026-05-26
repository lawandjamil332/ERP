'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { Banknote, Plus, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

interface Schedule {
  id: string; sequence: number; dueDate: string;
  amount: string; paidAmount: string; paidDate: string | null; status: string;
}
interface Plan {
  id: string; reference: string; contactId: string; productSummary: string;
  totalAmount: string; downPayment: string; financedAmount: string;
  numberOfInstallments: number; interestRatePct: string;
  installmentAmount: string; currency: string;
  startDate: string; status: string;
  guarantorName: string | null;
  schedule: Schedule[];
}

const STATUS_AR: Record<string, string> = {
  ACTIVE: 'نشط', COMPLETED: 'مكتمل', DEFAULTED: 'متعثر', CANCELLED: 'ملغى',
};

const STATUS_KU: Record<string, string> = {
  ACTIVE: 'چالاک', COMPLETED: 'تەواوبوو', DEFAULTED: 'دەرنەچوو', CANCELLED: 'هەڵوەشاوەتەوە',
};

export default function InstallmentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    fetch('/api/installments').then((r) => r.ok ? r.json() : { data: [] }).then((b) => setPlans(b.data ?? []));
  }, []);

  const totals = plans?.reduce(
    (s, p) => {
      s.activeCount += p.status === 'ACTIVE' ? 1 : 0;
      s.outstanding += p.schedule.reduce(
        (sum, r) => sum + Math.max(0, parseFloat(r.amount) - parseFloat(r.paidAmount)), 0
      );
      const today = new Date();
      s.overdue += p.schedule.filter((r) =>
        r.status !== 'PAID' && new Date(r.dueDate) < today
      ).length;
      s.completed += p.status === 'COMPLETED' ? 1 : 0;
      return s;
    },
    { activeCount: 0, outstanding: 0, overdue: 0, completed: 0 }
  ) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'إدارة التقسيط', ku: 'پلانەکانی قیست', en: 'Installment plans' })}
        description={tri(locale, {
          ar: 'بيع بالتقسيط للأجهزة والأثاث — جداول دفعات، ضامنون، تنبيهات استحقاق',
          ku: 'فرۆشتن بە قیست بۆ ئامێر و کەلوپەل — خشتەی پارەدان، کەفیل، ئاگاداری کاتی پێویست',
          en: 'Sell on installments — payment schedules, guarantors, due-date alerts' })}
        actions={
          <Button asChild>
            <Link href={`/${locale}/dashboard/installments/new`}>
              <Plus className="h-4 w-4" /> {tri(locale, { ar: 'خطة تقسيط جديدة', ku: 'پلانی قیستی نوێ', en: 'New plan' })}
            </Link>
          </Button>
        }
      />

      {totals && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard tone="primary" icon={CreditCard}
            label={tri(locale, { ar: 'خطط نشطة', ku: 'پلانە چالاکەکان', en: 'Active plans' })} value={totals.activeCount.toString()} />
          <StatCard tone="warning" icon={Banknote}
            label={tri(locale, { ar: 'المتبقّي المستحَق', ku: 'ماوەی پێویست', en: 'Outstanding' })}
            value={`${totals.outstanding.toLocaleString(isAr ? 'ar-IQ' : 'en')} IQD`} />
          <StatCard tone={totals.overdue > 0 ? 'destructive' : 'default'} icon={AlertTriangle}
            label={tri(locale, { ar: 'دفعات متأخرة', ku: 'پارەدانی دواکەوتوو', en: 'Overdue payments' })} value={totals.overdue.toString()} />
          <StatCard tone="success" icon={CheckCircle2}
            label={tri(locale, { ar: 'خطط مكتملة', ku: 'پلانە تەواوبووەکان', en: 'Completed' })} value={totals.completed.toString()} />
        </div>
      )}

      {plans === null ? (
        <div className="py-12 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('common.noData')}
          description={tri(locale, { ar: 'لا توجد خطط تقسيط حتى الآن.', ku: 'تا ئێستا هیچ پلانێکی قیست نییە.', en: 'No installment plans yet.' })}
          action={
            <Button asChild>
              <Link href={`/${locale}/dashboard/installments/new`}>
                <Plus className="h-4 w-4" /> {tri(locale, { ar: 'خطة تقسيط جديدة', ku: 'پلانی قیستی نوێ', en: 'New plan' })}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{tri(locale, { ar: 'الرقم', ku: 'ژمارەی ئاماژە', en: 'Reference' })}</TH>
                <TH>{tri(locale, { ar: 'المنتج', ku: 'کاڵا', en: 'Product' })}</TH>
                <TH className="text-end">{tri(locale, { ar: 'الإجمالي', ku: 'کۆی گشتی', en: 'Total' })}</TH>
                <TH>{tri(locale, { ar: 'الأقساط', ku: 'قیستەکان', en: 'Plan' })}</TH>
                <TH className="text-end">{tri(locale, { ar: 'القسط الشهري', ku: 'قیستی مانگانە', en: 'Monthly' })}</TH>
                <TH>{tri(locale, { ar: 'الضامن', ku: 'کەفیل', en: 'Guarantor' })}</TH>
                <TH>{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</TH>
              </TR>
            </THead>
            <TBody>
              {plans.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-xs">
                    <Link href={`/${locale}/dashboard/installments/${p.id}`} className="hover:underline">
                      {p.reference}
                    </Link>
                  </TD>
                  <TD className="max-w-xs truncate">{p.productSummary}</TD>
                  <TD className="text-end tabular-nums">{parseFloat(p.totalAmount).toLocaleString(isAr ? 'ar-IQ' : 'en')} {p.currency}</TD>
                  <TD className="tabular-nums">
                    {p.numberOfInstallments} {tri(locale, { ar: 'شهر', ku: 'مانگ', en: 'mo' })}
                    {parseFloat(p.interestRatePct) > 0 && (
                      <span className="text-xs text-muted-foreground"> @ {(parseFloat(p.interestRatePct) * 100).toFixed(1)}%</span>
                    )}
                  </TD>
                  <TD className="text-end tabular-nums">{parseFloat(p.installmentAmount).toLocaleString(isAr ? 'ar-IQ' : 'en')}</TD>
                  <TD>{p.guarantorName ?? '—'}</TD>
                  <TD>
                    <Badge variant={
                      p.status === 'ACTIVE' ? 'default' :
                      p.status === 'COMPLETED' ? 'success' :
                      p.status === 'DEFAULTED' ? 'destructive' : 'outline'
                    }>
                      {tri(locale, { ar: STATUS_AR[p.status] ?? p.status, ku: STATUS_KU[p.status] ?? p.status, en: p.status })}
                    </Badge>
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
