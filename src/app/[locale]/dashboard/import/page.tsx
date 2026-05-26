'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';

const SAMPLES: Record<string, string> = {
  contacts: `kind,nameAr,nameEn,taxNumber,commercialReg,phone,email,addressAr,governorate,currency,creditLimit
CUSTOMER,شركة بغداد التجارية,Baghdad Trading Co.,IQ-001-234,CR-001,07901234567,bag@example.iq,شارع الرشيد,Baghdad,IQD,5000000
SUPPLIER,شركة الموردين,Suppliers Inc.,IQ-002-001,CR-099,07811223344,sup@example.iq,أربيل,Erbil,USD,0`,
  products: `sku,barcode,nameAr,nameEn,hsCode,countryOfOrigin,trademark,unitOfMeasure,category,salePrice,cost,isService
SKU-001,1234567890123,منتج 1,Product 1,8471.30,CN,Brand,PCS,Electronics,150000,100000,false
SVC-001,,خدمة استشارية,Consulting,,,,HOUR,Services,75000,0,true`,
  openings: `accountCode,debit,credit,memo
1111,1000000,,Cash on hand opening
1121,500000,,AR opening
33,,1500000,Retained earnings opening`,
};

const ENDPOINTS: Record<string, string> = {
  contacts: '/api/import/contacts',
  products: '/api/import/products',
  openings: '/api/import/opening-balances',
};

export default function ImportPage() {
  const t = useTranslations('import');
  const tc = useTranslations('common');
  const [tab, setTab] = useState<keyof typeof SAMPLES>('contacts');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function onUpload(file: File) {
    setText(await file.text());
  }

  async function submit() {
    if (!text.trim()) {
      toast.error(t('needCsv'));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(ENDPOINTS[tab], {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: text,
      });
      const body = await res.json();
      setResult(body);
      if (res.ok) toast.success(t('importedCount', { count: (body.inserted ?? 0) + (body.updated ?? 0) }));
      else toast.error(body.error ?? `HTTP ${res.status}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  function useSample() {
    setText(SAMPLES[tab]);
    toast.success(t('loadSample'));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
      </div>

      <Tabs value={tab} onValueChange={(v: string) => { setTab(v as keyof typeof SAMPLES); setText(''); setResult(null); }}>
        <TabsList>
          <TabsTrigger value="contacts">{t('tabContacts')}</TabsTrigger>
          <TabsTrigger value="products">{t('tabProducts')}</TabsTrigger>
          <TabsTrigger value="openings">{t('tabOpenings')}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {tab === 'contacts' && t('tabContacts')}
                {tab === 'products' && t('tabProducts')}
                {tab === 'openings' && t('tabOpenings')}
              </CardTitle>
              <CardDescription>
                {tab === 'contacts' && t('helpContacts')}
                {tab === 'products' && t('helpProducts')}
                {tab === 'openings' && t('helpOpenings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={useSample}>{t('loadSample')}</Button>
                <label className="inline-flex items-center">
                  <input type="file" accept=".csv,text/csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                  <Button variant="outline" type="button" asChild>
                    <span>{t('uploadCsv')}</span>
                  </Button>
                </label>
              </div>
              <textarea
                className="h-72 w-full rounded-md border bg-background p-3 font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('placeholder')}
                dir="ltr"
              />
              <Button onClick={submit} disabled={busy}>{busy ? t('importing') : t('submit')}</Button>

              {result && (
                <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs" dir="ltr">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
