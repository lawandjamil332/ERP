'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Product { id: string; sku: string; nameAr: string; nameEn: string }
interface Warehouse { id: string; nameAr: string; nameEn: string }

const today = () => new Date().toISOString().slice(0, 10);

export default function NewStockOrderPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    kind: 'TRANSFER' as 'TRANSFER' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'WRITE_OFF' | 'OPENING_BALANCE',
    fromWarehouseId: '', toWarehouseId: '', date: today(), notes: '',
  });
  const [lines, setLines] = useState([{ productId: '', qty: '0', unitCost: '', notes: '' }]);

  useEffect(() => {
    fetch('/api/products').then((r) => r.ok ? r.json() : { data: [] }).then((b) => setProducts(b.data ?? []));
    fetch('/api/warehouses').then((r) => r.ok ? r.json() : { data: [] }).then((b) => setWarehouses(b.data ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/stock-orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: form.kind, date: form.date, notes: form.notes,
        fromWarehouseId: form.fromWarehouseId || undefined,
        toWarehouseId: form.toWarehouseId || undefined,
        lines: lines.filter((l) => l.productId && parseFloat(l.qty) > 0).map((l) => ({
          productId: l.productId, qty: parseFloat(l.qty),
          unitCost: l.unitCost ? parseFloat(l.unitCost) : undefined,
          notes: l.notes || undefined,
        })),
      }),
    });
    setBusy(false);
    if (res.ok) { toast.success(isAr ? 'تم الحفظ' : 'Saved'); router.push(`/${locale}/dashboard/stock-orders`); }
    else toast.error('failed');
  }

  return (
    <div className="space-y-6">
      <PageHeader title={isAr ? 'أمر مخزون جديد' : 'New stock order'} />

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'تفاصيل الأمر' : 'Order details'}</CardTitle>
            <CardDescription>{isAr ? 'يُولَّد المرجع تلقائياً بصيغة TRF-2026-00001 / ADJ-2026-00001' : 'Reference auto-generated as TRF-2026-00001 / ADJ-2026-00001'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{isAr ? 'النوع' : 'Kind'}</Label>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as never })}>
                <option value="TRANSFER">{isAr ? 'نقل بين المخازن' : 'Transfer'}</option>
                <option value="ADJUSTMENT_IN">{isAr ? 'تسوية إضافة' : 'Adjustment in'}</option>
                <option value="ADJUSTMENT_OUT">{isAr ? 'تسوية خصم' : 'Adjustment out'}</option>
                <option value="WRITE_OFF">{isAr ? 'إتلاف' : 'Write-off'}</option>
                <option value="OPENING_BALANCE">{isAr ? 'رصيد افتتاحي' : 'Opening balance'}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'التاريخ' : 'Date'}</Label>
              <Input type="date" dir="ltr" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            {(form.kind === 'TRANSFER' || form.kind === 'ADJUSTMENT_OUT' || form.kind === 'WRITE_OFF') && (
              <div className="space-y-1.5">
                <Label>{isAr ? 'من مخزن' : 'From warehouse'}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}>
                  <option value="">—</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{isAr ? w.nameAr : w.nameEn}</option>)}
                </select>
              </div>
            )}
            {(form.kind === 'TRANSFER' || form.kind === 'ADJUSTMENT_IN' || form.kind === 'OPENING_BALANCE') && (
              <div className="space-y-1.5">
                <Label>{isAr ? 'إلى مخزن' : 'To warehouse'}</Label>
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}>
                  <option value="">—</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{isAr ? w.nameAr : w.nameEn}</option>)}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isAr ? 'البنود' : 'Items'}</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { productId: '', qty: '0', unitCost: '', notes: '' }])}>
              <Plus className="h-3.5 w-3.5" /> {isAr ? 'بند' : 'Line'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_120px_120px_40px]">
                <select className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={l.productId} onChange={(e) => setLines(lines.map((x, j) => i === j ? { ...x, productId: e.target.value } : x))}>
                  <option value="">{isAr ? 'اختر المنتج…' : 'Select product…'}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {isAr ? p.nameAr : p.nameEn}</option>)}
                </select>
                <Input type="number" min={0} step="0.01" dir="ltr" placeholder="qty"
                  value={l.qty} onChange={(e) => setLines(lines.map((x, j) => i === j ? { ...x, qty: e.target.value } : x))} />
                <Input type="number" min={0} step="0.01" dir="ltr" placeholder="unit cost"
                  value={l.unitCost} onChange={(e) => setLines(lines.map((x, j) => i === j ? { ...x, unitCost: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{isAr ? 'ملاحظات' : 'Notes'}</CardTitle></CardHeader>
          <CardContent>
            <textarea className="min-h-[80px] w-full rounded-md border bg-background p-3 text-sm"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button type="submit" disabled={busy}><Save className="h-4 w-4" /> {busy ? '…' : (isAr ? 'حفظ' : 'Save')}</Button>
        </div>
      </form>
    </div>
  );
}
