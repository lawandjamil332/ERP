'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { Calculator } from 'lucide-react';

interface Emp { id: string; empNo: string; fullNameAr: string; fullNameEn: string | null; hireDate: string; baseSalary: string }
interface Result {
  employee: Emp;
  yearsOfService: number;
  monthsExtra: number;
  factorPerYear: number;
  amount: string;
  notes: string;
}

const REASONS = [
  { code: 'TERMINATION_WITHOUT_CAUSE', labelAr: 'إنهاء بدون سبب من قبل صاحب العمل', labelEn: 'Termination by employer (no cause)' },
  { code: 'END_OF_CONTRACT',           labelAr: 'انتهاء العقد',                      labelEn: 'End of fixed-term contract' },
  { code: 'DEATH_OR_DISABILITY',       labelAr: 'وفاة أو عجز',                       labelEn: 'Death or disability' },
  { code: 'RESIGNATION',               labelAr: 'استقالة',                            labelEn: 'Resignation' },
  { code: 'TERMINATION_FOR_CAUSE',     labelAr: 'إنهاء لسبب جسيم',                    labelEn: 'Termination for gross misconduct' },
];

export default function EosiPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<typeof REASONS[number]['code']>('TERMINATION_WITHOUT_CAUSE');
  const [overrideSalary, setOverrideSalary] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    fetch('/api/employees').then((r) => r.ok ? r.json() : { data: [] }).then((b) =>
      setEmployees((b.data ?? []).map((e: any) => ({
        id: e.id, empNo: e.empNo,
        fullNameAr: e.fullNameAr, fullNameEn: e.fullNameEn,
        hireDate: e.hireDate, baseSalary: String(e.baseSalary),
      })))
    ).catch(() => null);
  }, []);

  async function calc() {
    if (!employeeId) { toast.error(t('common.required')); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/hr/eosi', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employeeId, endDate, reason,
          lastMonthlySalary: overrideSalary || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(body);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={locale === 'ar' ? 'حاسبة مكافأة نهاية الخدمة' : locale === 'ku' ? 'هەژمێرەری پاداشتی کۆتایی خزمەت' : 'End-of-service indemnity calculator'}
        description={locale === 'ar'
          ? 'وفقاً لقانون العمل العراقي رقم ٣٧ لسنة ٢٠١٥'
          : locale === 'ku' ? 'بەپێی یاسای کاری عێراق ژمارە ٣٧ی ساڵی ٢٠١٥' : 'Per Iraqi Labor Law 37/2015'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'البيانات' : locale === 'ku' ? 'داتا' : 'Inputs'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('payroll.employee')}</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.empNo} · {locale === 'ar' ? e.fullNameAr : (e.fullNameEn ?? e.fullNameAr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'تاريخ انتهاء الخدمة' : locale === 'ku' ? 'بەرواری کۆتایی' : 'End date'}</Label>
                <Input type="date" dir="ltr" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'سبب الإنهاء' : locale === 'ku' ? 'هۆکار' : 'Reason'}</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {locale === 'ar' ? r.labelAr : r.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'تجاوز الراتب الشهري (اختياري)' : 'Override monthly salary (optional)'}</Label>
              <Input type="number" dir="ltr" value={overrideSalary}
                onChange={(e) => setOverrideSalary(e.target.value)}
                placeholder={locale === 'ar' ? 'يستخدم الراتب الأساسي افتراضياً' : 'Defaults to base salary'} />
            </div>
            <Button onClick={calc} disabled={busy || !employeeId}>
              <Calculator className="h-4 w-4" />
              {busy ? t('common.loading') : t('payroll.calculate')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'النتيجة' : locale === 'ku' ? 'ئەنجام' : 'Result'}</CardTitle>
            <CardDescription>
              {locale === 'ar' ? 'بالدينار العراقي' : 'In Iraqi Dinars'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">{locale === 'ar' ? 'سنوات الخدمة' : 'Years of service'}</dt>
                  <dd className="font-medium tabular-nums">{result.yearsOfService} {locale === 'ar' ? 'سنة' : 'yr'} {result.monthsExtra} {locale === 'ar' ? 'شهر' : 'mo'}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">{locale === 'ar' ? 'المعامل' : 'Factor per year'}</dt>
                  <dd className="font-medium tabular-nums">{result.factorPerYear}</dd>
                </div>
                <div className="flex flex-col gap-2 rounded-md bg-primary/10 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-primary">
                    {locale === 'ar' ? 'مبلغ المكافأة' : 'Indemnity amount'}
                  </dt>
                  <dd className="text-2xl font-bold tabular-nums text-primary">{result.amount} IQD</dd>
                </div>
                <p className="text-xs text-muted-foreground">{result.notes}</p>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'اختر موظفاً واضغط احتساب' : 'Select an employee and click Calculate'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
