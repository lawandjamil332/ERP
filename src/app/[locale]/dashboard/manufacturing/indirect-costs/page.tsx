'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Coins, Plus } from 'lucide-react';

export default function IndirectCostsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'التكاليف غير المباشرة' : 'Indirect costs'}
        description={isAr ? 'الكهرباء، الإيجار، الإهلاك، أجور غير مباشرة' : 'Electricity, rent, depreciation, indirect labor'}
        actions={<Button><Plus className="h-4 w-4" /> {isAr ? 'تكلفة جديدة' : 'New indirect cost'}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'إدارة التكاليف غير المباشرة' : 'Manage indirect costs'}</CardTitle>
          <CardDescription>{isAr ? 'تُحمَّل تلقائياً على تكلفة المنتج النهائي' : 'Allocated automatically to finished goods cost'}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Coins}
            title={isAr ? 'لا توجد تكاليف' : 'No indirect costs'}
            description={isAr ? 'ابدأ بإضافة بند تكلفة' : 'Get started by adding a cost item'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
