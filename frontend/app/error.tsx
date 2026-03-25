'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">An unexpected error occurred</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {error.message || 'Please try again. If the problem persists, contact support.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">Ref: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" /> Try again
      </Button>
    </div>
  );
}
