'use client';

import { use, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Save, Eye, LayoutGrid, Palette, Type } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

type Sections = Record<string, boolean>;
type Styles = Record<string, string>;
type TextMap = Record<string, string>;
interface Layout { sections: Sections; styles: Styles; text: TextMap }

const DEFAULT_SECTIONS: Sections = {
  companyHeader: true, companyLogo: true, invoiceTitle: true, statusBadge: true,
  billTo: true, invoiceDetails: true, itemsTable: true, totalsSection: true,
  shippingInfo: false, notesAndTerms: true, footer: true,
};
const DEFAULT_HIDE: Sections = {
  hideDiscount: false, hideTax: false, hideCompanyEmail: false, hideCustomerEmail: false,
  hidePaidAmount: false, hideRemainingAmount: false, hidePartyBalance: false,
  hideTotalAmount: false, hideDueDate: false,
};
const DEFAULT_STYLES: Styles = {
  primaryColor: '#059669', headingFont: 'Inter', bodyFont: 'Inter', fontSize: '14',
};
const DEFAULT_TEXT: TextMap = {
  invoiceTitle: 'INVOICE', billToLabel: 'Bill To', detailsLabel: 'Details',
  itemsLabel: 'Invoice Items', subtotalLabel: 'Subtotal', grandTotalLabel: 'Grand Total',
  paidLabel: 'Paid Amount', remainingLabel: 'Remaining Amount', footerText: 'Thank you for your business',
};

const KIND_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  sales_invoice: { ar: 'فاتورة بيع', ku: 'پسوڵەی فرۆشتن', en: 'Sales invoice' },
  purchase_invoice: { ar: 'فاتورة شراء', ku: 'پسوڵەی کڕین', en: 'Purchase invoice' },
  quotation: { ar: 'عرض سعر', ku: 'نرخاندن', en: 'Quotation' },
  payment_receipt: { ar: 'إيصال قبض', ku: 'پسووڵەی وەرگرتن', en: 'Payment receipt' },
  expense_voucher: { ar: 'سند صرف', ku: 'سەنەدی خەرجکردن', en: 'Expense voucher' },
  delivery_note: { ar: 'إذن تسليم', ku: 'مۆڵەتی گەیاندن', en: 'Delivery note' },
};

interface Tpl { id: string; name: string; layout: Layout; isDefault: boolean }

export default function TemplateEditorPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = use(params);
  const locale = useLocale();
  const dbKind = kind.toUpperCase() as 'SALES_INVOICE';
  const label = KIND_LABELS[kind] ?? { ar: kind, ku: kind, en: kind };

  const [templates, setTemplates] = useState<Tpl[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('Default');
  const [layout, setLayout] = useState<Layout>({
    sections: { ...DEFAULT_SECTIONS, ...DEFAULT_HIDE },
    styles: { ...DEFAULT_STYLES },
    text: { ...DEFAULT_TEXT },
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/printable-templates?kind=${dbKind}`).then((r) => r.ok ? r.json() : { data: [] }).then((b) => {
      setTemplates(b.data ?? []);
      const def = b.data?.find((t: Tpl) => t.isDefault) ?? b.data?.[0];
      if (def) {
        setSelectedId(def.id);
        setName(def.name);
        setLayout({
          sections: { ...DEFAULT_SECTIONS, ...DEFAULT_HIDE, ...(def.layout?.sections ?? {}) },
          styles: { ...DEFAULT_STYLES, ...(def.layout?.styles ?? {}) },
          text: { ...DEFAULT_TEXT, ...(def.layout?.text ?? {}) },
        });
      }
    });
  }, [dbKind]);

  async function save() {
    setBusy(true);
    const payload = { name, layout, isDefault: true, isActive: true, paperSize: 'A4', kind: dbKind };
    let res: Response;
    if (selectedId) {
      res = await fetch(`/api/printable-templates/${selectedId}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, layout, isDefault: true }),
      });
    } else {
      res = await fetch('/api/printable-templates', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const body = await res.json();
        setSelectedId(body.data.id);
      }
    }
    setBusy(false);
    if (res.ok) toast.success(tri(locale, { ar: 'تم حفظ القالب', ku: 'قاڵب پاشەکەوتکرا', en: 'Template saved' }));
    else toast.error('failed');
  }

  const set = (key: keyof Layout, kk: string, v: unknown) =>
    setLayout({ ...layout, [key]: { ...layout[key], [kk]: v } });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: `قالب ${label.ar}`, ku: `قاڵبی ${label.ku}`, en: `${label.en} template` })}
        description={tri(locale, { ar: 'حرر تخطيط القالب مع معاينة فورية', ku: 'ڕووکاری قاڵب دەستکاری بکە لەگەڵ پێشبینینی ڕاستەوخۆ', en: 'Edit layout with live preview' })}
        actions={
          <Button onClick={save} disabled={busy}>
            <Save className="h-4 w-4" /> {busy ? tri(locale, { ar: 'جارٍ الحفظ…', ku: 'پاشەکەوتکردن…', en: 'Saving…' }) : tri(locale, { ar: 'حفظ القالب', ku: 'پاشەکەوتی قاڵب', en: 'Save layout' })}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{tri(locale, { ar: 'تحرير القالب', ku: 'دەستکاری قاڵب', en: 'Edit layout' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{tri(locale, { ar: 'اسم القالب', ku: 'ناوی قاڵب', en: 'Layout name' })}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <Tabs defaultValue="sections" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sections"><LayoutGrid className="me-1 h-3 w-3" /> {tri(locale, { ar: 'الأقسام', ku: 'بەشەکان', en: 'Sections' })}</TabsTrigger>
                  <TabsTrigger value="styles"><Palette className="me-1 h-3 w-3" /> {tri(locale, { ar: 'الأنماط', ku: 'شێوازەکان', en: 'Styles' })}</TabsTrigger>
                  <TabsTrigger value="text"><Type className="me-1 h-3 w-3" /> {tri(locale, { ar: 'النصوص', ku: 'دەقەکان', en: 'Text' })}</TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="space-y-4">
                  <Section title={tri(locale, { ar: 'إظهار / إخفاء أقسام', ku: 'پیشاندان / شاردنەوەی بەشەکان', en: 'Show/Hide sections' })}>
                    {SECTION_TOGGLES.map((s) => (
                      <Toggle key={s.k} label={tri(locale, { ar: s.ar, ku: s.ku, en: s.en })}
                        checked={!!layout.sections[s.k]}
                        onChange={(v) => set('sections', s.k, v)} />
                    ))}
                  </Section>
                  <Section title={tri(locale, { ar: 'إخفاء أعمدة وحقول', ku: 'شاردنەوەی ستوون و خانەکان', en: 'Hide columns & fields' })}>
                    {HIDE_TOGGLES.map((s) => (
                      <Toggle key={s.k} label={tri(locale, { ar: s.ar, ku: s.ku, en: s.en })}
                        hint={tri(locale, { ar: s.ar2, ku: s.ku2, en: s.en2 })}
                        checked={!!layout.sections[s.k]}
                        onChange={(v) => set('sections', s.k, v)} />
                    ))}
                  </Section>
                </TabsContent>

                <TabsContent value="styles" className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>{tri(locale, { ar: 'اللون الرئيسي', ku: 'ڕەنگی سەرەکی', en: 'Primary color' })}</Label>
                    <input type="color" className="h-10 w-full rounded-md border"
                      value={layout.styles.primaryColor ?? '#059669'}
                      onChange={(e) => set('styles', 'primaryColor', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tri(locale, { ar: 'حجم الخط', ku: 'قەبارەی فۆنت', en: 'Font size (px)' })}</Label>
                    <Input type="number" min={10} max={24}
                      value={layout.styles.fontSize ?? '14'}
                      onChange={(e) => set('styles', 'fontSize', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tri(locale, { ar: 'الخط', ku: 'فۆنت', en: 'Font family' })}</Label>
                    <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={layout.styles.bodyFont ?? 'Inter'}
                      onChange={(e) => set('styles', 'bodyFont', e.target.value)}>
                      <option>Inter</option><option>Tajawal</option>
                      <option>Cairo</option><option>Roboto</option><option>Arial</option>
                    </select>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-3">
                  {TEXT_FIELDS.map((f) => (
                    <div key={f.k} className="space-y-1.5">
                      <Label>{tri(locale, { ar: f.ar, ku: f.ku, en: f.en })}</Label>
                      <Input value={layout.text[f.k] ?? ''} onChange={(e) => set('text', f.k, e.target.value)} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> {tri(locale, { ar: 'معاينة فورية', ku: 'پێشبینینی ڕاستەوخۆ', en: 'Live preview' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <LivePreview layout={layout} kindLabel={tri(locale, { ar: label.ar, ku: label.ku, en: label.en })} />
          </CardContent>
        </Card>
      </div>

      {templates && templates.length > 1 && (
        <Card>
          <CardHeader><CardTitle>{tri(locale, { ar: 'قوالب محفوظة', ku: 'قاڵبە پاشەکەوتکراوەکان', en: 'Saved layouts' })}</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <button type="button" onClick={() => { setSelectedId(t.id); setName(t.name); setLayout(t.layout); }}
                    className={`text-sm font-medium ${selectedId === t.id ? 'text-primary' : ''}`}>{t.name}</button>
                  {t.isDefault && <span className="text-xs text-muted-foreground">{tri(locale, { ar: 'افتراضي', ku: 'بنەڕەت', en: 'Default' })}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-background p-2.5">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'start-[18px]' : 'start-0.5'}`} />
      </button>
    </div>
  );
}

function LivePreview({ layout, kindLabel }: { layout: Layout; kindLabel: string }) {
  const s = layout.sections;
  const t = layout.text;
  const st = layout.styles;
  const primary = st.primaryColor ?? '#059669';

  return (
    <div className="overflow-hidden rounded-lg border bg-white p-6 text-sm text-gray-900 shadow-inner" style={{ fontFamily: st.bodyFont, fontSize: `${st.fontSize}px` }}>
      {s.companyHeader && (
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            {s.companyLogo && <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ background: primary }}>ع</div>}
            <div>
              <p className="font-bold">Company Name</p>
              {!s.hideCompanyEmail && <p className="text-xs text-gray-500">company@example.com</p>}
            </div>
          </div>
          {s.invoiceTitle && (
            <div className="text-end">
              <p className="text-xl font-bold uppercase tracking-wide" style={{ color: primary }}>{t.invoiceTitle ?? kindLabel}</p>
              <p className="text-xs">001</p>
              {s.statusBadge && <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">paid</span>}
            </div>
          )}
        </div>
      )}

      {s.billTo && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: primary }}>{t.billToLabel ?? 'Bill To'}</p>
            <p className="mt-1 font-medium">John Doe</p>
            <p className="text-xs">+1 234 567 890</p>
            {!s.hideCustomerEmail && <p className="text-xs text-gray-500">john@example.com</p>}
            <p className="text-xs">123 Main St, City</p>
          </div>
          {s.invoiceDetails && (
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: primary }}>{t.detailsLabel ?? 'Details'}</p>
              <div className="mt-1 space-y-0.5 text-xs">
                <div className="flex justify-between"><span>Issue:</span><span>01/03/2026</span></div>
                {!s.hideDueDate && <div className="flex justify-between"><span>Due:</span><span>31/03/2026</span></div>}
                <div className="flex justify-between"><span>Terms:</span><span>30 day</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {s.itemsTable && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase" style={{ color: primary }}>{t.itemsLabel ?? 'Items'}</p>
          <table className="w-full text-xs">
            <thead className="border-b">
              <tr><th className="py-1.5 text-start">Name</th><th className="text-end">Qty</th><th className="text-end">Price</th>
                {!s.hideDiscount && <th className="text-end">Disc</th>}
                {!s.hideTax && <th className="text-end">Tax</th>}
                <th className="text-end">Total</th></tr>
            </thead>
            <tbody>
              <tr><td className="py-1">Web Development</td><td className="text-end">1</td><td className="text-end">5,000</td>
                {!s.hideDiscount && <td className="text-end">0</td>}
                {!s.hideTax && <td className="text-end">15%</td>}
                <td className="text-end">5,750</td></tr>
              <tr><td className="py-1">UI/UX Design</td><td className="text-end">2</td><td className="text-end">1,500</td>
                {!s.hideDiscount && <td className="text-end">0</td>}
                {!s.hideTax && <td className="text-end">3.5%</td>}
                <td className="text-end">3,105</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {s.totalsSection && (
        <div className="mt-4 space-y-1 text-end text-xs">
          <div className="flex justify-end gap-6"><span className="text-gray-500">Subtotal:</span><span>8,000</span></div>
          {!s.hideTotalAmount && <div className="flex justify-end gap-6 font-bold" style={{ color: primary }}><span>{t.grandTotalLabel ?? 'Grand Total'}:</span><span>8,855</span></div>}
          {!s.hidePaidAmount && <div className="flex justify-end gap-6 text-gray-500"><span>{t.paidLabel ?? 'Paid'}:</span><span>3,500</span></div>}
          {!s.hideRemainingAmount && <div className="flex justify-end gap-6 text-rose-600"><span>{t.remainingLabel ?? 'Remaining'}:</span><span>5,355</span></div>}
        </div>
      )}

      {s.notesAndTerms && <div className="mt-4 border-t pt-3 text-xs text-gray-500">Notes & Terms</div>}
      {s.footer && <div className="mt-4 border-t pt-3 text-center text-xs text-gray-500">{t.footerText ?? ''}</div>}
    </div>
  );
}

const SECTION_TOGGLES = [
  { k: 'companyHeader', ar: 'ترويسة الشركة', ku: 'سەردێڕی کۆمپانیا', en: 'Company header' },
  { k: 'companyLogo', ar: 'شعار الشركة', ku: 'لۆگۆی کۆمپانیا', en: 'Company logo' },
  { k: 'invoiceTitle', ar: 'عنوان وحالة الفاتورة', ku: 'ناونیشان و دۆخی پسوڵە', en: 'Invoice title & status' },
  { k: 'statusBadge', ar: 'شارة الحالة', ku: 'نیشانەی دۆخ', en: 'Status badge' },
  { k: 'billTo', ar: 'قسم العميل', ku: 'بەشی کڕیار', en: 'Bill-to section' },
  { k: 'invoiceDetails', ar: 'تفاصيل الفاتورة', ku: 'وردەکارییەکانی پسوڵە', en: 'Invoice details' },
  { k: 'itemsTable', ar: 'جدول البنود', ku: 'خشتەی کاڵاکان', en: 'Items table' },
  { k: 'totalsSection', ar: 'قسم الإجماليات', ku: 'بەشی کۆکان', en: 'Totals section' },
  { k: 'shippingInfo', ar: 'بيانات الشحن', ku: 'زانیاری گەیاندن', en: 'Shipping information' },
  { k: 'notesAndTerms', ar: 'ملاحظات وشروط', ku: 'تێبینی و مەرجەکان', en: 'Notes & terms' },
  { k: 'footer', ar: 'التذييل', ku: 'پاوان', en: 'Footer' },
];

const HIDE_TOGGLES = [
  { k: 'hideDiscount', ar: 'إخفاء عمود الخصم', ku: 'شاردنەوەی ستوونی داشکاندن', en: 'Hide discount column', ar2: 'إخفاء عمود الخصم في الفاتورة', ku2: 'شاردنەوەی ستوونی داشکاندن لە پسوڵەدا', en2: 'Hide discount column in invoice' },
  { k: 'hideTax', ar: 'إخفاء عمود الضريبة', ku: 'شاردنەوەی ستوونی باج', en: 'Hide tax column', ar2: 'إخفاء عمود الضريبة في الفاتورة', ku2: 'شاردنەوەی ستوونی باج لە پسوڵەدا', en2: 'Hide tax column in invoice' },
  { k: 'hideCompanyEmail', ar: 'إخفاء إيميل الشركة', ku: 'شاردنەوەی ئیمەیڵی کۆمپانیا', en: 'Hide company email', ar2: 'إخفاء البريد الإلكتروني للشركة', ku2: 'شاردنەوەی ئیمەیڵی کۆمپانیا لە پسوڵەدا', en2: 'Hide company email in invoice' },
  { k: 'hideCustomerEmail', ar: 'إخفاء إيميل العميل', ku: 'شاردنەوەی ئیمەیڵی کڕیار', en: 'Hide customer email', ar2: 'إخفاء البريد الإلكتروني للعميل', ku2: 'شاردنەوەی ئیمەیڵی کڕیار لە پسوڵەدا', en2: 'Hide customer email in invoice' },
  { k: 'hidePaidAmount', ar: 'إخفاء المبلغ المدفوع', ku: 'شاردنەوەی بڕی پارەدراو', en: 'Hide paid amount', ar2: 'إخفاء المبلغ المسدّد', ku2: 'شاردنەوەی ڕیزی بڕی پارەدراو', en2: 'Hide paid amount row' },
  { k: 'hideRemainingAmount', ar: 'إخفاء المتبقي', ku: 'شاردنەوەی بڕی ماوە', en: 'Hide remaining amount', ar2: 'إخفاء صف المتبقي', ku2: 'شاردنەوەی ڕیزی بڕی ماوە', en2: 'Hide remaining amount row' },
  { k: 'hidePartyBalance', ar: 'إخفاء رصيد الجهة', ku: 'شاردنەوەی باڵانسی لایەن', en: 'Hide party balance', ar2: 'إخفاء رصيد العميل / المورد', ku2: 'شاردنەوەی باڵانسی کڕیار / دابینکەر', en2: 'Hide customer/supplier balance' },
  { k: 'hideTotalAmount', ar: 'إخفاء الإجمالي', ku: 'شاردنەوەی کۆی گشتی', en: 'Hide total amount', ar2: 'إخفاء صف الإجمالي', ku2: 'شاردنەوەی ڕیزی کۆی گشتی', en2: 'Hide total amount row' },
  { k: 'hideDueDate', ar: 'إخفاء تاريخ الاستحقاق', ku: 'شاردنەوەی بەرواری کاتی پارەدان', en: 'Hide due date', ar2: 'إخفاء تاريخ الاستحقاق في الفاتورة', ku2: 'شاردنەوەی بەرواری کاتی پارەدان لە پسوڵەدا', en2: 'Hide due date in invoice' },
];

const TEXT_FIELDS = [
  { k: 'invoiceTitle', ar: 'عنوان الفاتورة', ku: 'ناونیشانی پسوڵە', en: 'Invoice title' },
  { k: 'billToLabel', ar: 'تسمية المستلم', ku: 'ناونیشانی وەرگر', en: 'Bill To label' },
  { k: 'detailsLabel', ar: 'تسمية التفاصيل', ku: 'ناونیشانی وردەکارییەکان', en: 'Details label' },
  { k: 'itemsLabel', ar: 'تسمية البنود', ku: 'ناونیشانی کاڵاکان', en: 'Items label' },
  { k: 'subtotalLabel', ar: 'تسمية المجموع قبل الضريبة', ku: 'ناونیشانی کۆی پێش باج', en: 'Subtotal label' },
  { k: 'grandTotalLabel', ar: 'تسمية الإجمالي', ku: 'ناونیشانی کۆی گشتی', en: 'Grand Total label' },
  { k: 'paidLabel', ar: 'تسمية المدفوع', ku: 'ناونیشانی پارەدراو', en: 'Paid label' },
  { k: 'remainingLabel', ar: 'تسمية المتبقي', ku: 'ناونیشانی ماوە', en: 'Remaining label' },
  { k: 'footerText', ar: 'نص التذييل', ku: 'دەقی پاوان', en: 'Footer text' },
];
