'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarCheck, Plus } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

export default function ProductionPlansPage() {
  const locale = useLocale();
  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'خطط الإنتاج', ku: 'پلانەکانی بەرهەمهێنان', en: 'Production plans' })}
        description={tri(locale, { ar: 'جدولة دفعات الإنتاج المستقبلية', ku: 'خشتەکردنی بەشە بەرهەمهێنانە داهاتووەکان', en: 'Schedule upcoming production batches' })}
        actions={<Button><Plus className="h-4 w-4" /> {tri(locale, { ar: 'خطة جديدة', ku: 'پلانی نوێ', en: 'New plan' })}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'إدارة خطط الإنتاج', ku: 'بەڕێوەبردنی پلانەکان', en: 'Manage plans' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'مدخل لـ MRP — تخطيط الاحتياجات من المواد', ku: 'دەرامەت بۆ MRP — پلانی پێداویستی کەرەستەکان', en: 'Feeds MRP — material requirements planning' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={CalendarCheck}
            title={tri(locale, { ar: 'لا توجد خطط', ku: 'هیچ پلانێک نییە', en: 'No production plans' })}
            description={tri(locale, { ar: 'ابدأ بإنشاء خطة إنتاج', ku: 'دەست پێبکە بە دروستکردنی پلانێک', en: 'Get started by creating a plan' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
