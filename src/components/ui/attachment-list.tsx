'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, FileText, Image, File } from 'lucide-react';
import { toast } from '@/lib/toast';
import { tri } from '@/lib/i18n/tri';

interface Attachment {
  id: string; fileName: string; fileSize: number; mimeType: string; createdAt: string;
}

interface AttachmentListProps {
  entity: string;
  entityId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-rose-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function AttachmentList({ entity, entityId }: AttachmentListProps) {
  const locale = useLocale();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch(`/api/attachments?entity=${entity}&entityId=${entityId}`);
    if (r.ok) setAttachments((await r.json()).data ?? []);
  }
  useEffect(() => { load(); }, [entity, entityId]);

  async function upload(file: globalThis.File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('entity', entity);
    fd.append('entityId', entityId);
    fd.append('file', file);
    const res = await fetch('/api/attachments', { method: 'POST', body: fd });
    setUploading(false);
    if (res.ok) {
      toast.success(tri(locale, { ar: 'تم الرفع', ku: 'بارکرا', en: 'Uploaded' }));
      load();
    } else toast.error(tri(locale, { ar: 'فشل الرفع', ku: 'بارکردن نەکرا', en: 'Upload failed' }));
  }

  async function remove(id: string) {
    await fetch('/api/attachments', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{tri(locale, { ar: 'المرفقات', ku: 'هاوپێچەکان', en: 'Attachments' })}</span>
        <span className="text-xs text-muted-foreground">({attachments.length})</span>
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-3 w-3" /> {tri(locale, { ar: 'رفع', ku: 'بارکردن', en: 'Upload' })}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((a) => (
            <div key={a.id} className="group flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
              <FileIcon mimeType={a.mimeType} />
              <span className="flex-1 truncate">{a.fileName}</span>
              <span className="text-xs text-muted-foreground">{formatSize(a.fileSize)}</span>
              <button type="button" onClick={() => remove(a.id)} className="opacity-0 group-hover:opacity-60">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
