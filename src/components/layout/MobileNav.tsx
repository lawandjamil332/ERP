'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase,
  Receipt, CreditCard, Factory, Hotel, ShieldCheck, Repeat, CalendarCheck,
  BanknoteIcon, Boxes, TrendingDown, Upload, Lock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function MobileNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const pathname = usePathname();

  const items = [
    { href: `/${locale}/dashboard`,                  label: t('dashboard'),      icon: LayoutDashboard },
    { href: `/${locale}/dashboard/invoices`,         label: t('invoices'),       icon: FileText },
    { href: `/${locale}/dashboard/bills`,            label: t('bills'),          icon: ShoppingCart },
    { href: `/${locale}/dashboard/payments`,         label: t('payments'),       icon: CreditCard },
    { href: `/${locale}/dashboard/cheques`,          label: t('cheques'),        icon: Receipt },
    { href: `/${locale}/dashboard/recurring`,        label: t('recurring'),      icon: Repeat },
    { href: `/${locale}/dashboard/inventory`,        label: t('inventory'),      icon: Package },
    { href: `/${locale}/dashboard/lots`,             label: t('lots'),           icon: Boxes },
    { href: `/${locale}/dashboard/contacts`,         label: t('contacts'),       icon: Users },
    { href: `/${locale}/dashboard/accounting`,       label: t('accounting'),     icon: Wallet },
    { href: `/${locale}/dashboard/payroll`,          label: t('payroll'),        icon: ScrollText },
    { href: `/${locale}/dashboard/salary-advances`,  label: t('salaryAdvances'), icon: BanknoteIcon },
    { href: `/${locale}/dashboard/leave`,            label: t('leave'),          icon: CalendarCheck },
    { href: `/${locale}/dashboard/hr`,               label: t('hr'),             icon: Briefcase },
    { href: `/${locale}/dashboard/pos`,              label: t('pos'),            icon: Store },
    { href: `/${locale}/dashboard/projects`,         label: t('projects'),       icon: Building2 },
    { href: `/${locale}/dashboard/manufacturing`,    label: t('manufacturing'),  icon: Factory },
    { href: `/${locale}/dashboard/hospitality`,      label: t('hospitality'),    icon: Hotel },
    { href: `/${locale}/dashboard/reports`,          label: t('reports'),        icon: BarChart3 },
    { href: `/${locale}/dashboard/reports/aging`,    label: t('aging'),          icon: TrendingDown },
    { href: `/${locale}/dashboard/audit`,            label: t('audit'),          icon: ShieldCheck },
    { href: `/${locale}/dashboard/import`,           label: t('import'),         icon: Upload },
    { href: `/${locale}/dashboard/accounting/close`, label: t('yearEndClose'),   icon: Lock },
    { href: `/${locale}/dashboard/settings`,         label: t('settings'),       icon: Settings },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground">ع</div>
                <span className="text-sm font-semibold">{tApp('shortName')}</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-accent" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
