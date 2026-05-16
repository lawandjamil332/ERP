'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, Plus } from 'lucide-react';

export default function PosShiftsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'ورديات نقطة البيع' : 'POS shifts'}
        description={isAr ? 'إدارة ورديات العمل ومسؤوليها' : 'Manage work shifts and responsible staff'}
        actions={<Button><Plus className="h-4 w-4" /> {isAr ? 'وردية جديدة' : 'New shift'}</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? 'إعداد الورديات' : 'Shift schedule'}</CardTitle>
          <CardDescription>{isAr ? 'مواعيد البدء والانتهاء، الموظف المسؤول' : 'Start and end times, responsible staff'}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Clock}
            title={isAr ? 'لا توجد ورديات' : 'No shifts yet'}
            description={isAr ? 'أنشئ وردية للسماح بفتح الجلسات' : 'Create a shift to allow session opening'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
