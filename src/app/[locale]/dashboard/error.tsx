'use client';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-md border border-destructive bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold text-destructive">Error / خطأ</h2>
      <p className="mt-2 text-sm">{error.message}</p>
      <Button className="mt-4" onClick={() => reset()}>Retry</Button>
    </div>
  );
}
