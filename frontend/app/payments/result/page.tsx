'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { paymentsApi, ordersApi } from '@/lib/api';
import type { PaymentDetail, Order } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, ErrorState, StatusBadge } from '@/components/ui-states';

const POLL_INTERVAL = 3000;
const POLL_MAX = 40;

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString();
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const paymentId = searchParams.get('paymentId') ?? '';

  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldPoll = (pd: PaymentDetail | null, o: Order | null) => {
    if (!pd || !o) return false;
    const payStatus = pd.payment.status;
    const ordStatus = o.status;
    return (
      payStatus === 'PROCESSING' || payStatus === 'INITIATED' || ordStatus === 'AWAITING_PAYMENT'
    );
  };

  const fetchData = useCallback(async () => {
    try {
      const [pd, o] = await Promise.all([
        paymentsApi.getPayment(paymentId),
        ordersApi.getOrder(orderId),
      ]);
      setPaymentDetail(pd);
      setOrder(o);
      setLoading(false);

      if (shouldPoll(pd, o) && pollCount.current < POLL_MAX) {
        pollCount.current += 1;
        pollTimer.current = setTimeout(fetchData, POLL_INTERVAL);
      }
    } catch (err) {
      setLoading(false);
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Không thể tải kết quả thanh toán.' });
      }
    }
  }, [paymentId, orderId]);

  useEffect(() => {
    if (!paymentId || !orderId) {
      setError({ message: 'Thiếu mã thanh toán hoặc mã đơn hàng.' });
      setLoading(false);
      return;
    }
    fetchData();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [fetchData, paymentId, orderId]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <ErrorState message={error.message} correlationId={error.correlationId} onRetry={fetchData} />
    );
  if (!paymentDetail || !order) return null;

  const payment = paymentDetail.payment;
  const history = paymentDetail.history ?? [];
  const isSuccess = payment.status === 'SUCCESS' && order.status === 'COMPLETED';
  const isFailed =
    payment.status === 'FAILED' || order.status === 'FAILED' || order.status === 'CANCELLED';
  const isPolling = shouldPoll(paymentDetail, order);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status banner */}
      <div
        className={`rounded-xl p-8 text-center mb-8 border ${
          isSuccess
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : isFailed
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-card border-border'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
        ) : isFailed ? (
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        ) : (
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {isSuccess ? 'Thanh toán thành công!' : isFailed ? 'Thanh toán thất bại' : 'Đang xử lý thanh toán…'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isSuccess
            ? 'Đơn hàng của bạn đã được xác nhận. Cảm ơn bạn đã mua hàng!'
            : isFailed
              ? 'Không thể hoàn tất thanh toán. Vui lòng thử lại.'
              : 'Vui lòng chờ trong khi chúng tôi xác nhận thanh toán.'}
        </p>
        {isPolling && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Đang kiểm tra trạng thái…
          </div>
        )}
      </div>

      {/* Payment info */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Thông tin thanh toán</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Mã thanh toán</dt>
          <dd className="font-mono text-xs text-foreground truncate">{payment.id}</dd>
          <dt className="text-muted-foreground">Mã đơn hàng</dt>
          <dd className="font-mono text-xs text-foreground truncate">{payment.orderId}</dd>
          <dt className="text-muted-foreground">Số tiền</dt>
          <dd className="text-foreground font-semibold">
            {formatPrice(Number(payment.amount), payment.currency)}
          </dd>
          <dt className="text-muted-foreground">Trạng thái thanh toán</dt>
          <dd>
            <StatusBadge status={payment.status} />
          </dd>
          <dt className="text-muted-foreground">Trạng thái đơn hàng</dt>
          <dd>
            <StatusBadge status={order.status} />
          </dd>
          <dt className="text-muted-foreground">Cổng thanh toán</dt>
          <dd className="text-foreground">{payment.provider}</dd>
          <dt className="text-muted-foreground">Thời gian</dt>
          <dd className="text-foreground">{formatDate(payment.createdAt)}</dd>
        </dl>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Lịch sử xử lý</h2>
          <ol className="relative border-l border-border ml-2 flex flex-col gap-5">
            {history.map((entry, i) => (
              <li key={i} className="pl-6 relative">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" />
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={entry.toStatus} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
                {entry.correlationId && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Mã: {entry.correlationId}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/orders/${orderId}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Xem đơn hàng
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button className="w-full">Tiếp tục mua sắm</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <RouteGuard>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PaymentResultContent />
      </div>
    </RouteGuard>
  );
}
