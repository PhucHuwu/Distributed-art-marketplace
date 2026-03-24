'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { EmptyState, ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import { createOrder, getCart, getOrder } from '@/lib/api/order-api';
import { createPayment } from '@/lib/api/payment-api';
import { createAddress, listMyAddresses } from '@/lib/api/profile-api';
import { formatCurrency } from '@/lib/format';
import { addressSchema, getFirstError } from '@/lib/validation';
import { Cart } from '@/types/order';
import { UserAddress } from '@/types/user';

export default function CheckoutPage() {
  const auth = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState('');
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [newAddress, setNewAddress] = useState({
    recipient: '',
    phoneNumber: '',
    line1: '',
    line2: '',
    ward: '',
    district: '',
    city: '',
    postalCode: '',
  });

  const fetchData = useCallback(async () => {
    if (!auth.session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextCart, nextAddresses] = await Promise.all([
        getCart(auth.session.token),
        listMyAddresses(auth.session.token),
      ]);
      setCart(nextCart);
      setAddresses(nextAddresses);
      const defaultAddress = nextAddresses.find((item) => item.isDefault);
      setSelectedAddressId(defaultAddress?.id || nextAddresses[0]?.id || '');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (auth.session) {
      void fetchData();
    }
  }, [auth.session, fetchData]);

  const totalValue = useMemo(() => {
    if (!cart) {
      return 0;
    }
    return cart.items.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
  }, [cart]);

  async function onCreateAddress() {
    if (!auth.session) {
      return;
    }
    setAddressError('');
    const parsed = addressSchema.safeParse(newAddress);
    if (!parsed.success) {
      setAddressError(getFirstError(parsed.error));
      return;
    }

    setCreatingAddress(true);
    try {
      const created = await createAddress(auth.session.token, {
        ...parsed.data,
        isDefault: addresses.length === 0,
      });
      const next = [created, ...addresses];
      setAddresses(next);
      setSelectedAddressId(created.id);
      setNewAddress({
        recipient: '',
        phoneNumber: '',
        line1: '',
        line2: '',
        ward: '',
        district: '',
        city: '',
        postalCode: '',
      });
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Không thể tạo địa chỉ');
    } finally {
      setCreatingAddress(false);
    }
  }

  async function handleCheckout() {
    if (!auth.session || !cart) {
      return;
    }
    const shippingAddress = addresses.find((item) => item.id === selectedAddressId);
    if (!shippingAddress) {
      setError(new Error('Vui lòng chọn địa chỉ giao hàng'));
      return;
    }

    setSubmitting(true);
    setSubmittingStep('Đang tạo đơn hàng');
    setError(null);
    try {
      const order = await createOrder(auth.session.token, {
        recipient: shippingAddress.recipient,
        phoneNumber: shippingAddress.phoneNumber,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        ward: shippingAddress.ward,
        district: shippingAddress.district,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
      });

      setSubmittingStep('Đang xác nhận tồn kho');

      let latestOrder = order;
      for (let i = 0; i < 12; i += 1) {
        if (
          latestOrder.status === 'AWAITING_PAYMENT' ||
          latestOrder.status === 'FAILED' ||
          latestOrder.status === 'CANCELLED'
        ) {
          break;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 1000);
        });

        latestOrder = await getOrder(auth.session.token, order.id);
      }

      if (latestOrder.status === 'FAILED' || latestOrder.status === 'CANCELLED') {
        router.push(`/orders/${order.id}`);
        return;
      }

      if (latestOrder.status !== 'AWAITING_PAYMENT') {
        setError(new Error('Đơn hàng chưa sẵn sàng thanh toán. Vui lòng thử lại sau.'));
        router.push(`/orders/${order.id}`);
        return;
      }

      setSubmittingStep('Đang tạo giao dịch thanh toán');
      const payment = await createPayment(auth.session.token, {
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: order.currency,
        provider: 'mock-provider',
      });

      router.push(`/payments/result?orderId=${order.id}&paymentId=${payment.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
      setSubmittingStep('');
    }
  }

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Thanh toán</h1>
        {loading ? <LoadingBlock label="Đang tải thông tin thanh toán" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchData()} /> : null}

        {!loading && !error && cart && cart.items.length === 0 ? (
          <EmptyState title="Giỏ hàng rỗng" description="Thêm tác phẩm trước khi tiến hành thanh toán." />
        ) : null}

        {!loading && !error && cart && cart.items.length > 0 ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <section className="grid">
              <article className="card" style={{ padding: 16 }}>
                <h2 style={{ marginBottom: 8 }}>Địa chỉ giao hàng</h2>
                {addresses.length === 0 ? (
                  <p className="muted" style={{ marginTop: 0 }}>
                    Bạn chưa có địa chỉ. Vui lòng thêm địa chỉ mới bên dưới.
                  </p>
                ) : (
                  <div className="grid" style={{ gap: 10 }}>
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className="card"
                        style={{
                          padding: 10,
                          borderColor:
                            selectedAddressId === address.id
                              ? 'rgba(13,148,136,0.45)'
                              : 'rgba(148,163,184,0.25)',
                        }}
                      >
                        <input
                          type="radio"
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                        />{' '}
                        <strong>{address.recipient}</strong> - {address.phoneNumber}
                        <p className="muted" style={{ margin: '6px 0 0' }}>
                          {address.line1}, {address.ward}, {address.district}, {address.city}
                        </p>
                      </label>
                    ))}
                  </div>
                )}
              </article>

              <article className="card" style={{ padding: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Thêm địa chỉ nhanh</h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <label className="field">
                    Người nhận
                    <input
                      value={newAddress.recipient}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient: e.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Số điện thoại
                    <input
                      value={newAddress.phoneNumber}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </label>
                  <label className="field" style={{ gridColumn: '1 / -1' }}>
                    Địa chỉ
                    <input
                      value={newAddress.line1}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, line1: e.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Phường/Xã
                    <input
                      value={newAddress.ward}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, ward: e.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Quận/Huyện
                    <input
                      value={newAddress.district}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, district: e.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Tỉnh/Thành
                    <input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </label>
                </div>
                {addressError ? <p className="error-text">{addressError}</p> : null}
                <button className="btn btn-ghost" disabled={creatingAddress} onClick={() => void onCreateAddress()}>
                  {creatingAddress ? 'Đang tạo...' : 'Thêm địa chỉ'}
                </button>
              </article>
            </section>

            <aside className="card" style={{ padding: 16, alignSelf: 'start' }}>
              <h2 style={{ marginBottom: 12 }}>Tổng đơn</h2>
              <p style={{ marginTop: 0 }}>Số lượng: {cart.items.length}</p>
              <p style={{ marginTop: 0, fontWeight: 700, fontSize: 20 }}>{formatCurrency(totalValue)}</p>
              <button
                className="btn btn-primary"
                disabled={submitting || !selectedAddressId || addresses.length === 0}
                onClick={() => void handleCheckout()}
              >
                {submitting ? submittingStep || 'Đang xử lý...' : 'Tạo đơn và thanh toán'}
              </button>
            </aside>
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
