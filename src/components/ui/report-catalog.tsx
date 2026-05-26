'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { FileText, ArrowLeft, type LucideIcon } from 'lucide-react';

export interface ReportItem {
  href: string;
  titleAr: string; titleEn: string;
  descAr: string; descEn: string;
  Icon?: LucideIcon;
}
export interface ReportSection {
  labelAr: string; labelEn: string;
  items: ReportItem[];
}

export function ReportCatalog({
  bannerTone, bannerTitleAr, bannerTitleEn, bannerDescAr, bannerDescEn,
  BannerIcon, sections,
}: {
  bannerTone: string;
  bannerTitleAr: string; bannerTitleEn: string;
  bannerDescAr: string; bannerDescEn: string;
  BannerIcon: LucideIcon;
  sections: ReportSection[];
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'التقارير والتحليلات' : 'Reports & Analytics'}
        description={isAr ? 'اختر تقريراً من الفئة المعروضة' : 'Pick a report from this category'}
      />

      <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${bannerTone} p-4 text-white shadow-sm`}>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 backdrop-blur">
          <BannerIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{isAr ? bannerTitleAr : bannerTitleEn}</p>
          <p className="text-xs text-white/85">{isAr ? bannerDescAr : bannerDescEn}</p>
        </div>
      </div>

      {sections.map((sec) => (
        <div key={sec.labelEn} className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? sec.labelAr : sec.labelEn}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sec.items.map((it) => {
              const Icon = it.Icon ?? FileText;
              return (
                <Link key={it.href} href={`/${locale}/dashboard/${it.href}`}>
                  <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-sm font-semibold leading-tight">{isAr ? it.titleAr : it.titleEn}</p>
                          <p className="text-xs text-muted-foreground">{isAr ? it.descAr : it.descEn}</p>
                        </div>
                      </div>
                      <p className="flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
                        {isAr ? 'فتح التقرير' : 'Open report'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
