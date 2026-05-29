'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInlineEditOptions<T> {
  onSave: (id: string, field: string, value: T) => Promise<boolean>;
}

export function useInlineEdit<T = string>({ onSave }: UseInlineEditOptions<T>) {
  const [editing, setEditing] = useState<{ id: string; field: string } | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const startEdit = useCallback((id: string, field: string, currentValue: T) => {
    setEditing({ id, field });
    setDraft(currentValue);
  }, []);

  const cancel = useCallback(() => {
    setEditing(null);
    setDraft(null);
  }, []);

  const save = useCallback(async () => {
    if (!editing || draft === null) return;
    setSaving(true);
    const ok = await onSave(editing.id, editing.field, draft);
    setSaving(false);
    if (ok) { setEditing(null); setDraft(null); }
  }, [editing, draft, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') cancel();
  }, [save, cancel]);

  const isEditing = useCallback((id: string, field: string) =>
    editing?.id === id && editing?.field === field, [editing]);

  return { editing, draft, setDraft, saving, inputRef, startEdit, cancel, save, handleKeyDown, isEditing };
}
