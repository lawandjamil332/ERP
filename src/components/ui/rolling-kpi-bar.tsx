'use client';

import { useLocale } from 'next-intl';
import { tri } from '@/lib/i18n/tri';

interface Props {
  /** Last 7 / 30 / 365 day totals as raw numbers. */
  d7: number;
  d30: number;
  d365: number;
  /** Currency code (IQD / USD / etc.) */
  currency?: string;
  /** Visual tint — emerald (positive/receipts) or rose (negative/expenses) */
  tone?: 'emerald' | 'rose' | 'sky';
}

const TONE: Record<NonNullable<Props['tone']>, string> = {
  emerald: 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-emerald-50',
  rose: 'bg-gradient-to-br from-rose-600 to-rose-700 text-rose-50',
  sky: 'bg-gradient-to-br from-sky-600 to-sky-700 text-sky-50',
};

export function RollingKpiBar({ d7, d30, d365, currency = 'IQD', tone = 'emerald' }: Props) {
  const locale = useLocale();
  const fmt = (n: number) => `${n.toLocaleString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en')} ${currency}`;
  const cls = TONE[tone];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={`rounded-xl ${cls} p-4 shadow-sm`}>
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {tri(locale, { ar: 'مجموع آخر ٧ أيام', ku: 'کۆی 7 ڕۆژی ڕابردوو', en: 'Last 7 days total' })}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{fmt(d7)}</p>
      </div>
      <div className={`rounded-xl ${cls} p-4 shadow-sm`}>
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {tri(locale, { ar: 'مجموع آخر ٣٠ يوماً', ku: 'کۆی 30 ڕۆژی ڕابردوو', en: 'Last 30 days total' })}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{fmt(d30)}</p>
      </div>
      <div className={`rounded-xl ${cls} p-4 shadow-sm`}>
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {tri(locale, { ar: 'مجموع آخر ٣٦٥ يوماً', ku: 'کۆی 365 ڕۆژی ڕابردوو', en: 'Last 365 days total' })}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{fmt(d365)}</p>
      </div>
    </div>
  );
}
