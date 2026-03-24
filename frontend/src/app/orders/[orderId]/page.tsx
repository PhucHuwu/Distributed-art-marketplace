'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { StatusBadge } from '@/components/status-badge';
import { ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { getOrder } from '@/lib/api/order-api';
import { formatCurrency, formatDate } from '@/lib/format';
import { usePolling } from '@/lib/polling';
import { Order } from '@/types/order';

export default function OrderDetailPage() {
  const auth = useAuth();
  const params = useParams<{ orderId: string }>();
  const orderId = useMemo(() => String(params.orderId || ''), [params.orderId]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchOrder = useCallback(async () => {
    if (!auth.session || !orderId) {
      return;
    }
    try {
      const next = await getOrder(auth.session.token, orderId);
      setOrder(next);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session, orderId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  usePolling(fetchOrder, 5000, order?.status === 'PENDING' || order?.status === 'AWAITING_PAYMENT');

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Chi tiết đơn hàng</h1>
        {loading ? <LoadingBlock label="Đang tải chi tiết đơn" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchOrder()} /> : null}

        {!loading && !error && order ? (
          <section className="grid" style={{ gap: 16 }}>
            <article className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <h2>Đơn #{order.id.slice(0, 8)}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="muted" style={{ marginTop: 0 }}>
                Tạo lúc {formatDate(order.createdAt)}
              </p>
              <p style={{ fontWeight: 700, fontSize: 20 }}>{formatCurrency(order.totalAmount, order.currency)}</p>
            </article>

            <article className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Sản phẩm</h3>
              <div className="grid" style={{ gap: 8 }}>
                {order.items.map((item) => (
                  <div key={item.id} className="card" style={{ padding: 10 }}>
                    <p style={{ margin: 0 }}>Tác phẩm #{item.artworkId.slice(0, 8)}</p>
                    <p className="muted" style={{ margin: 0 }}>
                      Số lượng {item.quantity} x {formatCurrency(item.unitPrice, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Địa chỉ giao hàng</h3>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {JSON.stringify(order.shippingAddress, null, 2)}
              </pre>
            </article>
          </section>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
