'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Line, LineChart, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  salesTrend: Array<{ month: string; total: number }>;
  topCustomers: Array<{ name: string; total: number }>;
  cashflow: Array<{ month: string; inflow: number; outflow: number }>;
}

export function DashboardCharts() {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/charts').then((r) => r.json()).then(setData).catch(() => null);
  }, []);

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t('loadingCharts')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('salesTrend')}</CardTitle>
          <CardDescription>{t('salesTrendCaption')}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#22574b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('cashflow')}</CardTitle>
          <CardDescription>{t('cashflowCaption')}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.cashflow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="inflow" name={t('inflow')} fill="#16a34a" />
              <Bar dataKey="outflow" name={t('outflow')} fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('topCustomers')}</CardTitle>
          <CardDescription>{t('topCustomersCaption')}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} width={140} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
              <Tooltip />
              <Bar dataKey="total" fill="#22574b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
