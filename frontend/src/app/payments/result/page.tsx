'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { StatusBadge } from '@/components/status-badge';
import { ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { getOrder } from '@/lib/api/order-api';
import { getPayment } from '@/lib/api/payment-api';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePolling } from '@/lib/polling';
import { Order } from '@/types/order';
import { PaymentDetail } from '@/types/payment';

export default function PaymentResultPage() {
  const auth = useAuth();
  const params = useSearchParams();
  const paymentId = useMemo(() => params.get('paymentId') || '', [params]);
  const orderId = useMemo(() => params.get('orderId') || '', [params]);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchResult = useCallback(async () => {
    if (!auth.session || !paymentId || !orderId) {
      return;
    }
    try {
      const [nextPayment, nextOrder] = await Promise.all([
        getPayment(auth.session.token, paymentId),
        getOrder(auth.session.token, orderId),
      ]);
      setPayment(nextPayment);
      setOrder(nextOrder);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session, orderId, paymentId]);

  useEffect(() => {
    void fetchResult();
  }, [fetchResult]);

  const shouldPoll = payment?.payment.status === 'PROCESSING' || order?.status === 'AWAITING_PAYMENT';
  usePolling(fetchResult, 5000, Boolean(shouldPoll));

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Kết quả thanh toán</h1>
        {loading ? <LoadingBlock label="Đang đồng bộ trạng thái đơn hàng" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchResult()} /> : null}

        {!loading && !error && payment && order ? (
          <div className="grid" style={{ gap: 16 }}>
            <article className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 10 }}>Thông tin giao dịch</h2>
              <p>
                Giao dịch: <code>{payment.payment.id}</code>
              </p>
              <p>
                Đơn hàng: <code>{order.id}</code>
              </p>
              <p>
                Trạng thái thanh toán: <StatusBadge status={payment.payment.status} />
              </p>
              <p>
                Trạng thái đơn: <StatusBadge status={order.status} />
              </p>
              <p>
                Số tiền: {formatCurrency(payment.payment.amount, payment.payment.currency)} ({payment.payment.provider})
              </p>
              {payment.payment.failureMessage ? (
                <p className="error-text" style={{ marginBottom: 0 }}>
                  {payment.payment.failureMessage}
                </p>
              ) : null}
              <p className="muted" style={{ marginBottom: 0 }}>
                correlationId: <code>{payment.payment.correlationId}</code>
              </p>
            </article>

            <article className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Lịch sử xử lý</h3>
              <div className="grid" style={{ gap: 8 }}>
                {payment.history.map((entry) => (
                  <div key={entry.id} className="card" style={{ padding: 10 }}>
                    <p style={{ margin: 0 }}>
                      {entry.fromStatus || 'BẮT ĐẦU'} {'->'} <strong>{entry.toStatus}</strong>
                    </p>
                    <p className="muted" style={{ margin: 0 }}>
                      {entry.reason} - {formatDate(entry.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href={`/orders/${order.id}`}>
                Xem chi tiết đơn
              </Link>
              <Link className="btn btn-ghost" href="/orders/me">
                Về lịch sử đơn hàng
              </Link>
            </div>
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
