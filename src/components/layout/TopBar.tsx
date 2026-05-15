'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import { LogOut, Languages } from 'lucide-react';

export function TopBar({ locale, userEmail, tenantName }: {
  locale: string; userEmail: string; tenantName: string;
}) {
  const t = useTranslations('nav');
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  function switchLocale(target: string) {
    if (target === locale) return;
    const path = window.location.pathname.replace(/^\/(ar|ku|en)/, `/${target}`);
    window.location.href = path;
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        <p className="text-sm font-semibold">{tenantName}</p>
        <p className="text-xs text-muted-foreground">{userEmail}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border bg-background p-1 text-xs">
          <Languages className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
          {LOCALES.map((l: Locale) => (
            <button key={l} onClick={() => switchLocale(l)} className={`rounded px-2 py-1 ${l === locale ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
