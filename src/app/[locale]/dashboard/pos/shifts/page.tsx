'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, Plus } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

export default function PosShiftsPage() {
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'ورديات نقطة البيع', ku: 'شیفتەکانی خاڵی فرۆشتن', en: 'POS shifts' })}
        description={tri(locale, { ar: 'إدارة ورديات العمل ومسؤوليها', ku: 'بەڕێوەبردنی شیفتەکانی کار و بەرپرسانیان', en: 'Manage work shifts and responsible staff' })}
        actions={<Button><Plus className="h-4 w-4" /> {tri(locale, { ar: 'وردية جديدة', ku: 'شیفتی نوێ', en: 'New shift' })}</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'إعداد الورديات', ku: 'خشتەی شیفتەکان', en: 'Shift schedule' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'مواعيد البدء والانتهاء، الموظف المسؤول', ku: 'کاتەکانی دەستپێک و کۆتایی، کارمەندی بەرپرس', en: 'Start and end times, responsible staff' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Clock}
            title={tri(locale, { ar: 'لا توجد ورديات', ku: 'هێشتا هیچ شیفتێک نییە', en: 'No shifts yet' })}
            description={tri(locale, { ar: 'أنشئ وردية للسماح بفتح الجلسات', ku: 'شیفتێک دروست بکە بۆ ڕێگەدان بە کردنەوەی دانیشتنەکان', en: 'Create a shift to allow session opening' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
