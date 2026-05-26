'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Coins, Plus } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

export default function IndirectCostsPage() {
  const locale = useLocale();
  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'التكاليف غير المباشرة', ku: 'تێچووە ناڕاستەوخۆکان', en: 'Indirect costs' })}
        description={tri(locale, { ar: 'الكهرباء، الإيجار، الإهلاك، أجور غير مباشرة', ku: 'کارەبا، کرێ، فەرسوودەبوون، کرێی ناڕاستەوخۆ', en: 'Electricity, rent, depreciation, indirect labor' })}
        actions={<Button><Plus className="h-4 w-4" /> {tri(locale, { ar: 'تكلفة جديدة', ku: 'تێچووی نوێ', en: 'New indirect cost' })}</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>{tri(locale, { ar: 'إدارة التكاليف غير المباشرة', ku: 'بەڕێوەبردنی تێچووە ناڕاستەوخۆکان', en: 'Manage indirect costs' })}</CardTitle>
          <CardDescription>{tri(locale, { ar: 'تُحمَّل تلقائياً على تكلفة المنتج النهائي', ku: 'بەشێوەی خۆکار دەخرێتە سەر تێچووی بەرهەمی کۆتایی', en: 'Allocated automatically to finished goods cost' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Coins}
            title={tri(locale, { ar: 'لا توجد تكاليف', ku: 'هیچ تێچوویەک نییە', en: 'No indirect costs' })}
            description={tri(locale, { ar: 'ابدأ بإضافة بند تكلفة', ku: 'دەست پێبکە بە زیادکردنی بڕگەی تێچوو', en: 'Get started by adding a cost item' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
