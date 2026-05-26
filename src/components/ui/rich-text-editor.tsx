'use client';

import { useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link2, Undo2, Redo2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function onInput() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <select onChange={(e) => exec('formatBlock', e.target.value)} defaultValue=""
          className="me-1 h-7 rounded border bg-background px-2 text-xs">
          <option value="">Format</option>
          <option value="<h1>">H1</option>
          <option value="<h2>">H2</option>
          <option value="<h3>">H3</option>
          <option value="<p>">Paragraph</option>
        </select>
        <Btn onClick={() => exec('bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('underline')} title="Underline"><Underline className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => exec('justifyLeft')} title="Left"><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Center"><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('justifyRight')} title="Right"><AlignRight className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => {
          const url = window.prompt('URL');
          if (url) exec('createLink', url);
        }} title="Link"><Link2 className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn onClick={() => exec('undo')} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('redo')} title="Redo"><Redo2 className="h-3.5 w-3.5" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        className="prose prose-sm max-w-none p-3 outline-none focus:ring-0"
        style={{ minHeight }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function Btn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
      {children}
    </button>
  );
}
function Sep() { return <div className="mx-0.5 h-5 w-px bg-border" />; }
