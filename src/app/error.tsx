'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/observability/logger';

export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error({ digest: error.digest, message: error.message }, 'unhandled error');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong / حدث خطأ</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred. Try again, or contact support.'}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
