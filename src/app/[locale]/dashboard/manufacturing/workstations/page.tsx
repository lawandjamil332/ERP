'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Wrench, Plus } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

export default function WorkstationsPage() {
  const locale = useLocale();
  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'محطات العمل', ku: 'وێستگەکانی کار', en: 'Workstations' })}
        description={tri(locale, { ar: 'محطات الإنتاج والآلات', ku: 'وێستگەکانی بەرهەمهێنان و ئامێرەکان', en: 'Production stations and machines' })}
        actions={<Button><Plus className="h-4 w-4" /> {tri(locale, { ar: 'محطة جديدة', ku: 'وێستگەی نوێ', en: 'New workstation' })}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'إدارة محطات العمل', ku: 'بەڕێوەبردنی وێستگەکانی کار', en: 'Manage workstations' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'أضف محطات الإنتاج لتخصيصها لأوامر التصنيع', ku: 'وێستگەکانی بەرهەمهێنان زیاد بکە بۆ تەرخانکردنیان بۆ فەرمانەکانی بەرهەمهێنان', en: 'Add stations to assign to manufacturing orders' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Wrench}
            title={tri(locale, { ar: 'لا توجد محطات', ku: 'هیچ وێستگەیەک نییە', en: 'No workstations' })}
            description={tri(locale, { ar: 'ابدأ بإضافة محطة عمل', ku: 'دەست پێبکە بە زیادکردنی وێستگەیەکی کار', en: 'Get started by creating a workstation' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
