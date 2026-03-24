'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { listMyOrders } from '@/lib/api/order-api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Order } from '@/types/order';

export default function MyOrdersPage() {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchOrders = useCallback(async () => {
    if (!auth.session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await listMyOrders(auth.session.token);
      setOrders(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (auth.session) {
      void fetchOrders();
    }
  }, [auth.session, fetchOrders]);

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Lịch sử đơn hàng</h1>
        {loading ? <LoadingBlock label="Đang tải danh sách đơn" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchOrders()} /> : null}
        {!loading && !error && orders.length === 0 ? (
          <EmptyState title="Chưa có đơn hàng" description="Khi bạn checkout, đơn hàng sẽ xuất hiện tại đây." />
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <section className="grid">
            {orders.map((order) => (
              <article key={order.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginBottom: 6 }}>Đơn #{order.id.slice(0, 8)}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      Tạo lúc {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <p style={{ fontWeight: 700 }}>{formatCurrency(order.totalAmount, order.currency)}</p>
                <Link className="btn btn-ghost" href={`/orders/${order.id}`}>
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </section>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
