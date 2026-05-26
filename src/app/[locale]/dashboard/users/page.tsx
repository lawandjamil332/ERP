import Link from 'next/link';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ShieldCheck, Users } from 'lucide-react';
import { tri } from '@/lib/i18n/tri';

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);

  const rows = await db.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6" /> {tri(locale, { ar: 'المستخدمون', ku: 'بەکارهێنەران', en: 'Users' })}
          </h1>
          <p className="text-sm text-muted-foreground">{tri(locale, { ar: 'إدارة حسابات الدخول للنظام', ku: 'بەڕێوەبردنی هەژمارەکانی چوونەژوورەوەی سیستەم', en: 'Manage system access accounts' })}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard/users/roles`}>
              <ShieldCheck className="h-4 w-4" /> {tri(locale, { ar: 'الأدوار', ku: 'ڕۆڵەکان', en: 'Roles' })}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/users/new`}>
              <Plus className="h-4 w-4" /> {tri(locale, { ar: 'مستخدم جديد', ku: 'بەکارهێنەری نوێ', en: 'New user' })}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{tri(locale, { ar: 'الاسم', ku: 'ناو', en: 'Name' })}</TH>
              <TH>{tri(locale, { ar: 'البريد', ku: 'ئیمەیل', en: 'Email' })}</TH>
              <TH>{tri(locale, { ar: 'الدور', ku: 'ڕۆڵ', en: 'Role' })}</TH>
              <TH>{tri(locale, { ar: 'الحالة', ku: 'دۆخ', en: 'Status' })}</TH>
              <TH>{tri(locale, { ar: 'آخر دخول', ku: 'دوایین چوونەژوورەوە', en: 'Last login' })}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR><TD colSpan={5} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا يوجد مستخدمون', ku: 'هیچ بەکارهێنەرێک نییە', en: 'No users yet' })}</TD></TR>
            ) : rows.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.fullName}</TD>
                <TD dir="ltr" className="text-sm">{u.email}</TD>
                <TD><Badge variant="outline">{u.role}</Badge></TD>
                <TD><Badge variant={u.isActive ? 'default' : 'secondary'}>{u.isActive ? tri(locale, { ar: 'نشط', ku: 'چالاک', en: 'Active' }) : tri(locale, { ar: 'متوقف', ku: 'ناچالاک', en: 'Inactive' })}</Badge></TD>
                <TD className="text-sm text-muted-foreground">{u.lastLoginAt ? new Intl.DateTimeFormat(locale).format(u.lastLoginAt) : '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
