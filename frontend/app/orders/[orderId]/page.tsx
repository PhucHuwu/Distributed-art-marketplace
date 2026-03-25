'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import type { Order, ShippingAddress } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, ErrorState, StatusBadge } from '@/components/ui-states';
import { MapPin, Package } from 'lucide-react';

const POLL_INTERVAL = 3000;
const POLL_MAX = 30;

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString();
}

function getShippingAddress(input: Record<string, unknown>): ShippingAddress {
  return {
    recipient: String(input.recipient || ''),
    phoneNumber: String(input.phoneNumber || ''),
    line1: String(input.line1 || ''),
    line2: input.line2 ? String(input.line2) : undefined,
    ward: String(input.ward || ''),
    district: String(input.district || ''),
    city: String(input.city || ''),
    postalCode: input.postalCode ? String(input.postalCode) : undefined,
  };
}

const INTERMEDIATE_STATUSES = new Set(['PENDING', 'AWAITING_PAYMENT']);

function OrderDetailContent() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await ordersApi.getOrder(orderId);
      setOrder(data);
      setLoading(false);

      if (INTERMEDIATE_STATUSES.has(data.status) && pollCount.current < POLL_MAX) {
        pollCount.current += 1;
        pollTimer.current = setTimeout(fetchOrder, POLL_INTERVAL);
      }
    } catch (err) {
      setLoading(false);
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Failed to load order.' });
      }
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [fetchOrder]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        correlationId={error.correlationId}
        onRetry={fetchOrder}
      />
    );
  if (!order) return null;

  const isPolling = INTERMEDIATE_STATUSES.has(order.status);
  const address = getShippingAddress(order.shippingAddress);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">{order.id}</p>
            <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {isPolling && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Updating…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-accent" /> Items
        </h2>
        <div className="flex flex-col gap-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 items-center">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Artwork
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground line-clamp-1">
                  Artwork #{item.artworkId.slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-foreground shrink-0">
                {formatPrice(Number(item.unitPrice) * item.quantity, order.currency)}
              </p>
            </div>
          ))}
          <div className="border-t border-border pt-4 flex justify-between font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-accent">
              {formatPrice(Number(order.totalAmount), order.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping */}
      {order.shippingAddress && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> Shipping address
          </h2>
          <div className="text-sm text-muted-foreground flex flex-col gap-1">
            <p className="font-medium text-foreground">{address.recipient}</p>
            <p>{address.phoneNumber}</p>
            <p>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
            </p>
            <p>
              {address.ward}, {address.district}, {address.city}
            </p>
            {address.postalCode && <p>{address.postalCode}</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/orders/me">
          <Button variant="outline">Back to orders</Button>
        </Link>
        <Link href="/">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RouteGuard>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Order details</h1>
        <OrderDetailContent />
      </div>
    </RouteGuard>
  );
}
