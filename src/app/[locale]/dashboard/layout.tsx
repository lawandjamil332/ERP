import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ClickSound } from '@/components/layout/ClickSound';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await verifySession();
  if (!session) redirect(`/${locale}/auth/login`);

  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId } });
  const tenantName =
    locale === 'ar' ? tenant?.nameAr : locale === 'ku' ? (tenant?.nameKu ?? tenant?.nameAr) : tenant?.nameEn;
  const isAr = locale === 'ar';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ClickSound />
      <CommandPalette locale={locale} />
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center border-b bg-card px-3 py-2 md:hidden">
          <MobileNav locale={locale} />
          <span className="ms-2 text-sm font-semibold">{tenantName ?? ''}</span>
          <span className="ms-auto flex items-center gap-0.5"><SoundToggle /><ThemeToggle /></span>
        </div>
        <div className="flex items-center justify-between border-b bg-card">
          <TopBar locale={locale} userEmail={session.email} tenantName={tenantName ?? ''} />
          <div className="hidden items-center gap-0.5 pe-3 md:flex">
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
          <footer className="mx-auto mt-12 w-full max-w-7xl border-t px-4 py-4 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} {tenantName ?? 'Iraq ERP'}</p>
              <nav className="flex items-center gap-3">
                <Link href={`/${locale}/legal/privacy`} className="hover:text-foreground">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
                <span>|</span>
                <Link href={`/${locale}/legal/terms`} className="hover:text-foreground">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link>
              </nav>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
