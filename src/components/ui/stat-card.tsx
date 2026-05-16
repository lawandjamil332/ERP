import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  tone = 'default',
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}) {
  const tones: Record<typeof tone, string> = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className={cn('group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums leading-tight">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 font-medium',
                trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend * 100).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
