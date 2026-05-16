import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Landmark, Plus } from 'lucide-react';

export default async function BankAccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);
  const isAr = locale === 'ar';

  const rows = await db.bankAccount.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { bankName: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'حسابات البنوك والخزائن' : 'Bank accounts & safes'}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? 'إدارة الحسابات البنكية والخزائن النقدية' : 'Manage bank accounts and cash safes'}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/finance/bank-accounts/new`}>
            <Plus className="h-4 w-4" /> {isAr ? 'حساب جديد' : 'New account'}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Landmark}
          title={isAr ? 'لا توجد حسابات' : 'No bank accounts'}
          description={isAr ? 'سجّل حسابات البنوك والخزائن' : 'Register bank accounts and cash safes'}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id}>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{b.bankName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{b.accountNumber}</p>
                    </div>
                  </div>
                  <Badge variant={b.isActive ? 'default' : 'secondary'}>
                    {b.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'متوقف' : 'Inactive')}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? 'الرمز' : 'Code'}</p>
                    <p className="font-mono text-sm">{b.code}</p>
                    {b.iban && <p className="mt-1 font-mono text-[10px] text-muted-foreground">IBAN: {b.iban}</p>}
                  </div>
                  <Badge variant="outline">{b.currency}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
