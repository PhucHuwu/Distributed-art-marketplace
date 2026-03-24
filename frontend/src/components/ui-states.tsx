import { ApiError } from '@/types/api';

export function LoadingBlock({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ height: 10, borderRadius: 999, background: '#dbeafe', marginBottom: 10 }} />
      <div style={{ height: 10, borderRadius: 999, background: '#bfdbfe', width: '75%', marginBottom: 10 }} />
      <p className="muted" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="muted" style={{ margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = isApiError(error) ? error : null;
  const message = apiError?.message || 'Không thể xử lý yêu cầu.';

  return (
    <div className="card" style={{ padding: 16, borderColor: 'rgba(220,38,38,0.25)' }}>
      <h3 className="error-text" style={{ marginBottom: 8 }}>
        Đã xảy ra lỗi
      </h3>
      <p style={{ marginTop: 0 }}>{message}</p>
      {apiError?.correlationId ? (
        <p className="muted" style={{ marginTop: 0 }}>
          correlationId: <code>{apiError.correlationId}</code>
        </p>
      ) : null}
      {onRetry ? (
        <button className="btn btn-ghost" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
