import Link from 'next/link';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/iraq/money';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireSession();
  const projects = await db.project.findMany({
    where: { tenantId: session.tenantId },
    include: { milestones: true },
    orderBy: { code: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects / المشاريع</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/projects/new`}><Plus className="h-4 w-4" /> New project</Link>
        </Button>
      </div>

      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects yet — common for construction & service contracts.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.code} · {locale === 'ar' ? p.nameAr : p.nameEn}</CardTitle>
              <p className="text-sm text-muted-foreground">{p.status}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contract value</span>
                <span className="tabular-nums">{formatMoney(Number(p.contractValue), p.currency as 'IQD', locale as 'ar')}</span>
              </div>
              <div className="text-xs text-muted-foreground">Milestones</div>
              {p.milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
                  <span>{m.name} · {(Number(m.percentage) * 100).toFixed(0)}%</span>
                  <span className="tabular-nums">
                    {formatMoney(Number(m.amount), p.currency as 'IQD', locale as 'ar')}
                    {Number(m.retention) > 0 && (
                      <span className="ms-2 text-amber-600">
                        (retention {formatMoney(Number(m.retention), p.currency as 'IQD', locale as 'ar')})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
