'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Pencil, Check, X, Search } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';
import { useInlineEdit } from '@/lib/hooks/use-inline-edit';
import { SavedViewBar } from '@/components/ui/saved-view-bar';

interface Contact {
  id: string; nameAr: string; nameEn: string | null; kind: string;
  taxNumber: string | null; phone: string | null; governorate: string | null; currency: string;
}

const KIND_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  CUSTOMER: { ar: 'عميل', ku: 'کڕیار', en: 'Customer' },
  SUPPLIER: { ar: 'مورد', ku: 'دابینکەر', en: 'Supplier' },
  BOTH: { ar: 'عميل/مورد', ku: 'کڕیار/دابینکەر', en: 'Both' },
};

export default function ContactsPage() {
  const locale = useLocale();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  async function load() {
    const r = await fetch('/api/contacts');
    if (r.ok) setContacts((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, []);

  const onSave = useCallback(async (id: string, field: string, value: string) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
      toast.success(tri(locale, { ar: 'تم الحفظ', ku: 'پاشەکەوت کرا', en: 'Saved' }));
      return true;
    }
    toast.error(tri(locale, { ar: 'فشل الحفظ', ku: 'پاشەکەوت نەکرا', en: 'Save failed' }));
    return false;
  }, [locale]);

  const { draft, setDraft, inputRef, startEdit, cancel, save, handleKeyDown, isEditing, saving } = useInlineEdit<string>({ onSave });

  const filtered = search
    ? contacts.filter((c) => (c.nameAr + (c.nameEn ?? '') + (c.phone ?? '') + (c.taxNumber ?? '')).toLowerCase().includes(search.toLowerCase()))
    : contacts;

  function EditableCell({ contact, field, value, dir, mono }: { contact: Contact; field: string; value: string; dir?: string; mono?: boolean }) {
    if (isEditing(contact.id, field)) {
      return (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft ?? ''} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown} onBlur={save}
            dir={dir} className={`h-7 text-xs ${mono ? 'font-mono' : ''}`}
            disabled={saving}
          />
        </div>
      );
    }
    return (
      <span className={`group/cell cursor-pointer hover:underline ${mono ? 'font-mono text-xs' : ''}`}
        onDoubleClick={() => startEdit(contact.id, field, value)}>
        {value || '—'}
        <Pencil className="ml-1 inline-block h-3 w-3 opacity-0 group-hover/cell:opacity-40" />
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tri(locale, { ar: 'جهات الاتصال', ku: 'پەیوەندییەکان', en: 'Contacts' })}
        actions={
          <Button asChild>
            <Link href={`/${locale}/dashboard/contacts/new`}>
              <Plus className="h-4 w-4" /> {tri(locale, { ar: 'جديد', ku: 'نوێ', en: 'New' })}
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={tri(locale, { ar: 'بحث…', ku: 'گەڕان…', en: 'Search…' })} value={search} onChange={(e) => setSearch(e.target.value)}
            className="ps-9" />
        </div>
        <SavedViewBar page="contacts" currentFilters={{ search }} onApply={(f) => setSearch((f.search as string) ?? '')} />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'الاسم', ku: 'ناو', en: 'Name' })}</th>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'النوع', ku: 'جۆر', en: 'Type' })}</th>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'الرقم الضريبي', ku: 'ژمارەی باج', en: 'Tax #' })}</th>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'الهاتف', ku: 'تەلەفۆن', en: 'Phone' })}</th>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'المحافظة', ku: 'پارێزگا', en: 'Governorate' })}</th>
              <th className="px-3 py-2.5 text-start font-semibold">{tri(locale, { ar: 'العملة', ku: 'دراو', en: 'Currency' })}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">{tri(locale, { ar: 'لا توجد جهات اتصال', ku: 'هیچ پەیوەندییەک نییە', en: 'No contacts yet' })}</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2">
                  <EditableCell contact={c} field={locale === 'ar' ? 'nameAr' : 'nameEn'} value={locale === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr)} />
                </td>
                <td className="px-3 py-2">
                  <Badge variant={c.kind === 'CUSTOMER' ? 'default' : c.kind === 'SUPPLIER' ? 'secondary' : 'outline'}>
                    {tri(locale, KIND_LABELS[c.kind] ?? { ar: c.kind, ku: c.kind, en: c.kind })}
                  </Badge>
                </td>
                <td className="px-3 py-2"><EditableCell contact={c} field="taxNumber" value={c.taxNumber ?? ''} dir="ltr" mono /></td>
                <td className="px-3 py-2"><EditableCell contact={c} field="phone" value={c.phone ?? ''} dir="ltr" mono /></td>
                <td className="px-3 py-2"><EditableCell contact={c} field="governorate" value={c.governorate ?? ''} /></td>
                <td className="px-3 py-2">{c.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted-foreground">{tri(locale, { ar: 'انقر مرتين على خلية للتعديل المباشر', ku: 'دوو جار کلیک بکە لەسەر خانەیەک بۆ دەستکاریکردنی ڕاستەوخۆ', en: 'Double-click a cell to edit inline' })}</p>
    </div>
  );
}
