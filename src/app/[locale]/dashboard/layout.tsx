import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const tenantName =
    locale === 'ar' ? tenant?.nameAr : locale === 'ku' ? (tenant?.nameKu ?? tenant?.nameAr) : tenant?.nameEn;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar locale={locale} userEmail={session.email} tenantName={tenantName ?? ''} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
