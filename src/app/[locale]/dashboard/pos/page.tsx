import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function PosPage() {
  const t = await getTranslations('nav');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('pos')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Point of Sale</CardTitle>
          <CardDescription>
            POS terminals for retail counters. Configure terminals in Settings → POS, then open a session on the device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active terminals yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
