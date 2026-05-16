'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Wrench, Plus } from 'lucide-react';

export default function WorkstationsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'محطات العمل' : 'Workstations'}
        description={isAr ? 'محطات الإنتاج والآلات' : 'Production stations and machines'}
        actions={<Button><Plus className="h-4 w-4" /> {isAr ? 'محطة جديدة' : 'New workstation'}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'إدارة محطات العمل' : 'Manage workstations'}</CardTitle>
          <CardDescription>{isAr ? 'أضف محطات الإنتاج لتخصيصها لأوامر التصنيع' : 'Add stations to assign to manufacturing orders'}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Wrench}
            title={isAr ? 'لا توجد محطات' : 'No workstations'}
            description={isAr ? 'ابدأ بإضافة محطة عمل' : 'Get started by creating a workstation'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
