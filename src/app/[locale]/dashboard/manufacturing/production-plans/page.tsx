'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarCheck, Plus } from 'lucide-react';

export default function ProductionPlansPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'خطط الإنتاج' : 'Production plans'}
        description={isAr ? 'جدولة دفعات الإنتاج المستقبلية' : 'Schedule upcoming production batches'}
        actions={<Button><Plus className="h-4 w-4" /> {isAr ? 'خطة جديدة' : 'New plan'}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'إدارة خطط الإنتاج' : 'Manage plans'}</CardTitle>
          <CardDescription>{isAr ? 'مدخل لـ MRP — تخطيط الاحتياجات من المواد' : 'Feeds MRP — material requirements planning'}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={CalendarCheck}
            title={isAr ? 'لا توجد خطط' : 'No production plans'}
            description={isAr ? 'ابدأ بإنشاء خطة إنتاج' : 'Get started by creating a plan'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
