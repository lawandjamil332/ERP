'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users, Wallet,
  ScrollText, BarChart3, Settings, Building2, Store, Briefcase,
  Receipt, CreditCard, Factory, Hotel, ShieldCheck, Repeat,
  CalendarCheck, BanknoteIcon, Boxes, TrendingDown, Upload, Lock,
  Banknote, Calculator, FileBadge, ShieldQuestion,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; icon: LucideIcon }
interface NavGroup { id: string; label: string; items: NavItem[] }

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      id: 'overview', label: t('dashboard'),
      items: [{ href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard }],
    },
    {
      id: 'sales', label: t('sales'),
      items: [
        { href: `/${locale}/dashboard/invoices`,    label: t('invoices'),    icon: FileText },
        { href: `/${locale}/dashboard/quotations`,  label: t('quotations'),  icon: ScrollText },
        { href: `/${locale}/dashboard/recurring`,   label: t('recurring'),   icon: Repeat },
        { href: `/${locale}/dashboard/installments`,label: t('installments'),icon: CreditCard },
      ],
    },
    {
      id: 'purchases', label: t('purchases'),
      items: [
        { href: `/${locale}/dashboard/bills`,              label: t('bills'),              icon: ShoppingCart },
        { href: `/${locale}/dashboard/letters-of-credit`,  label: t('lettersOfCredit'),    icon: Banknote },
      ],
    },
    {
      id: 'money', label: t('payments'),
      items: [
        { href: `/${locale}/dashboard/payments`, label: t('payments'), icon: CreditCard },
        { href: `/${locale}/dashboard/cheques`,  label: t('cheques'),  icon: Receipt },
        { href: `/${locale}/dashboard/pos`,      label: t('pos'),      icon: Store },
      ],
    },
    {
      id: 'inventory', label: t('inventory'),
      items: [
        { href: `/${locale}/dashboard/inventory`, label: t('inventory'), icon: Package },
        { href: `/${locale}/dashboard/lots`,      label: t('lots'),      icon: Boxes },
      ],
    },
    {
      id: 'people', label: t('hr'),
      items: [
        { href: `/${locale}/dashboard/hr`,              label: t('hr'),              icon: Briefcase },
        { href: `/${locale}/dashboard/payroll`,         label: t('payroll'),         icon: ScrollText },
        { href: `/${locale}/dashboard/salary-advances`, label: t('salaryAdvances'),  icon: BanknoteIcon },
        { href: `/${locale}/dashboard/leave`,           label: t('leave'),           icon: CalendarCheck },
        { href: `/${locale}/dashboard/hr/eosi`,         label: t('eosi'),            icon: Calculator },
      ],
    },
    {
      id: 'operations', label: t('manufacturing'),
      items: [
        { href: `/${locale}/dashboard/projects`,       label: t('projects'),      icon: Building2 },
        { href: `/${locale}/dashboard/manufacturing`,  label: t('manufacturing'), icon: Factory },
        { href: `/${locale}/dashboard/hospitality`,    label: t('hospitality'),   icon: Hotel },
      ],
    },
    {
      id: 'books', label: t('accounting'),
      items: [
        { href: `/${locale}/dashboard/accounting`,        label: t('accounting'),  icon: Wallet },
        { href: `/${locale}/dashboard/accounting/close`,  label: t('yearEndClose'),icon: Lock },
        { href: `/${locale}/dashboard/audit`,             label: t('audit'),       icon: ShieldCheck },
      ],
    },
    {
      id: 'insights', label: t('reports'),
      items: [
        { href: `/${locale}/dashboard/reports`,        label: t('reports'),    icon: BarChart3 },
        { href: `/${locale}/dashboard/reports/aging`,  label: t('aging'),      icon: TrendingDown },
        { href: `/${locale}/dashboard/reports/diwan`,  label: t('diwanAudit'), icon: ShieldQuestion },
      ],
    },
    {
      id: 'system', label: t('settings'),
      items: [
        { href: `/${locale}/dashboard/contacts`, label: t('contacts'), icon: Users },
        { href: `/${locale}/dashboard/import`,   label: t('import'),   icon: Upload },
        { href: `/${locale}/dashboard/settings`, label: t('settings'), icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e bg-card md:flex">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-bold text-white shadow-sm">
          ع
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">{tApp('shortName')}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{tApp('version')} 0.4</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-5">
          {groups.map((group) => (
            <li key={group.id}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((it) => {
                  const active = isActive(it.href);
                  const Icon = it.icon;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />
                        )}
                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                        <span className="truncate">{it.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t p-3">
        <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {tApp('tagline')}
        </p>
      </div>
    </aside>
  );
}
