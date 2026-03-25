import { AlertCircle, PackageSearch, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 border-2 border-border rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground mt-4 animate-pulse">Đang tải...</p>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center fade-in">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
        <PackageSearch className="w-10 h-10 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-serif text-2xl font-medium text-foreground mb-2">{title}</h3>
        {description && <p className="text-muted-foreground max-w-sm mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
export function ErrorState({
  message,
  correlationId,
  onRetry,
}: {
  message?: string;
  correlationId?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center fade-in">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <div>
        <h3 className="font-serif text-2xl font-medium text-foreground mb-2">
          Đã xảy ra lỗi
        </h3>
        {message && <p className="text-muted-foreground max-w-md mx-auto">{message}</p>}
        {correlationId && (
          <p className="text-xs text-muted-foreground mt-3 font-mono bg-muted px-3 py-1.5 rounded inline-block">
            Mã tham chiếu: {correlationId}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" /> Thử lại
        </Button>
      )}
    </div>
  );
}

// ─── Inline error message ─────────────────────────────────────────────────────
export function InlineError({
  message,
  correlationId,
}: {
  message?: string;
  correlationId?: string | null;
}) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium">{message}</p>
          {correlationId && (
            <p className="text-xs mt-1 text-muted-foreground font-mono">Mã: {correlationId}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  AWAITING_PAYMENT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  INITIATED: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  CANCELLED: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
