'use client';

export function PrintButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className ?? 'rounded-md border bg-card px-4 py-2 text-sm hover:bg-accent'}
    >
      {children}
    </button>
  );
}
