'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ShieldCheck, Download } from 'lucide-react';

export default function DiwanAuditPackPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [year, setYear] = useState(new Date().getUTCFullYear() - 1);

  const isAr = locale === 'ar';
  const title = isAr ? 'حزمة تدقيق ديوان الرقابة المالية' : 'Diwan al-Riqaba audit pack';
  const desc = isAr
    ? 'تصدير حزمة كاملة لمتطلبات تدقيق ديوان الرقابة المالية الاتحادي'
    : 'One-click export of trial balance, journal vouchers, fixed-asset register, and aged AR/AP for the Federal Board of Supreme Audit';

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={desc} />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{isAr ? 'إعداد الحزمة' : 'Generate pack'}</CardTitle>
              <CardDescription>
                {isAr
                  ? 'تشمل: ميزان المراجعة، دفتر اليومية بالكامل، سجل الأصول الثابتة، وتقارير أعمار الذمم.'
                  : 'Includes: trial balance · full journal voucher register · fixed asset register · aged AR & AP.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 sm:w-64">
            <Label>{isAr ? 'السنة المالية' : 'Fiscal year'}</Label>
            <Input type="number" min={2010} max={2099} value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))} dir="ltr" />
          </div>
          <Button asChild>
            <a href={`/api/reports/diwan-audit-pack?year=${year}`} download>
              <Download className="h-4 w-4" />
              {isAr ? `تنزيل حزمة السنة ${year}` : `Download FY${year} pack`}
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'الملف بصيغة CSV متعدد الأقسام مع BOM لاستخدامه مباشرة في Excel.'
              : 'Multi-section CSV with UTF-8 BOM — opens directly in Excel.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
