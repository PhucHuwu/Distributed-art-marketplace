'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { EmptyState, ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api/order-api';
import { formatCurrency } from '@/lib/format';
import { Cart } from '@/types/order';

export default function CartPage() {
  const auth = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!auth.session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await getCart(auth.session.token);
      setCart(next);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (auth.session) {
      void fetchCart();
    }
  }, [auth.session, fetchCart]);

  const summary = useMemo(() => {
    if (!cart) {
      return { totalQty: 0, totalValue: 0 };
    }
    return cart.items.reduce(
      (acc, item) => {
        acc.totalQty += item.quantity;
        acc.totalValue += Number(item.unitPrice) * item.quantity;
        return acc;
      },
      { totalQty: 0, totalValue: 0 },
    );
  }, [cart]);

  async function changeQty(itemId: string, quantity: number) {
    if (!auth.session) {
      return;
    }
    setBusyItemId(itemId);
    try {
      const next = await updateCartItem(auth.session.token, itemId, quantity);
      setCart(next);
    } catch (err) {
      setError(err);
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(itemId: string) {
    if (!auth.session) {
      return;
    }
    setBusyItemId(itemId);
    try {
      const next = await removeCartItem(auth.session.token, itemId);
      setCart(next);
    } catch (err) {
      setError(err);
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Giỏ hàng của bạn</h1>

        {loading ? <LoadingBlock label="Đang tải giỏ hàng" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchCart()} /> : null}
        {!loading && !error && (!cart || cart.items.length === 0) ? (
          <EmptyState
            title="Giỏ hàng đang trống"
            description="Thêm một vài tác phẩm để bắt đầu thanh toán đơn hàng."
          />
        ) : null}

        {!loading && !error && cart && cart.items.length > 0 ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div className="grid">
              {cart.items.map((item) => (
                <article key={item.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 18, marginBottom: 6 }}>Tác phẩm #{item.artworkId.slice(0, 8)}</h3>
                      <p className="muted" style={{ margin: 0 }}>
                        Đơn giá: {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost"
                        disabled={busyItemId === item.id || item.quantity <= 1}
                        onClick={() => void changeQty(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <strong>{item.quantity}</strong>
                      <button
                        className="btn btn-ghost"
                        disabled={busyItemId === item.id}
                        onClick={() => void changeQty(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={busyItemId === item.id}
                        onClick={() => void removeItem(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="card" style={{ padding: 16, alignSelf: 'start' }}>
              <h2 style={{ marginBottom: 12 }}>Tổng kết</h2>
              <p style={{ marginTop: 0 }}>Số lượng: {summary.totalQty}</p>
              <p style={{ fontWeight: 700, fontSize: 20, marginTop: 0 }}>
                {formatCurrency(summary.totalValue)}
              </p>
              <Link className="btn btn-primary" href="/checkout">
                Tiếp tục thanh toán
              </Link>
            </aside>
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
