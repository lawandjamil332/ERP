'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase,
  Receipt, CreditCard, Factory, Hotel, ShieldCheck, Repeat,
  CalendarCheck, BanknoteIcon, Boxes, TrendingDown, Upload, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const pathname = usePathname();

  const items = [
    { href: `/${locale}/dashboard`,                     label: t('dashboard'),       icon: LayoutDashboard },
    { href: `/${locale}/dashboard/invoices`,            label: t('invoices'),        icon: FileText },
    { href: `/${locale}/dashboard/bills`,               label: t('bills'),           icon: ShoppingCart },
    { href: `/${locale}/dashboard/payments`,            label: t('payments'),        icon: CreditCard },
    { href: `/${locale}/dashboard/cheques`,             label: t('cheques'),         icon: Receipt },
    { href: `/${locale}/dashboard/recurring`,           label: t('recurring'),       icon: Repeat },
    { href: `/${locale}/dashboard/inventory`,           label: t('inventory'),       icon: Package },
    { href: `/${locale}/dashboard/lots`,                label: t('lots'),            icon: Boxes },
    { href: `/${locale}/dashboard/contacts`,            label: t('contacts'),        icon: Users },
    { href: `/${locale}/dashboard/accounting`,          label: t('accounting'),      icon: Wallet },
    { href: `/${locale}/dashboard/payroll`,             label: t('payroll'),         icon: ScrollText },
    { href: `/${locale}/dashboard/salary-advances`,     label: t('salaryAdvances'),  icon: BanknoteIcon },
    { href: `/${locale}/dashboard/leave`,               label: t('leave'),           icon: CalendarCheck },
    { href: `/${locale}/dashboard/hr`,                  label: t('hr'),              icon: Briefcase },
    { href: `/${locale}/dashboard/pos`,                 label: t('pos'),             icon: Store },
    { href: `/${locale}/dashboard/projects`,            label: t('projects'),        icon: Building2 },
    { href: `/${locale}/dashboard/manufacturing`,       label: t('manufacturing'),   icon: Factory },
    { href: `/${locale}/dashboard/hospitality`,         label: t('hospitality'),     icon: Hotel },
    { href: `/${locale}/dashboard/reports`,             label: t('reports'),         icon: BarChart3 },
    { href: `/${locale}/dashboard/reports/aging`,       label: t('aging'),           icon: TrendingDown },
    { href: `/${locale}/dashboard/audit`,               label: t('audit'),           icon: ShieldCheck },
    { href: `/${locale}/dashboard/import`,              label: t('import'),          icon: Upload },
    { href: `/${locale}/dashboard/accounting/close`,    label: t('yearEndClose'),    icon: Lock },
    { href: `/${locale}/dashboard/settings`,            label: t('settings'),        icon: Settings },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-e bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
          ع
        </div>
        <div>
          <p className="text-sm font-semibold">{tApp('shortName')}</p>
          <p className="text-xs text-muted-foreground">v0.4</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
