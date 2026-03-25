'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import type { Order } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState, ErrorState, StatusBadge } from '@/components/ui-states';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.listMyOrders();
      setOrders(data);
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Failed to load orders.' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading)
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );

  if (error)
    return (
      <div className="py-20">
        <ErrorState
          message={error.message}
          correlationId={error.correlationId}
          onRetry={loadOrders}
        />
      </div>
    );

  if (orders.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          title="No orders yet"
          description="When you place an order it will appear here."
          action={
            <Link href="/">
              <Button size="lg" className="mt-4">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 fade-in">
      {orders.map((order, index) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="group bg-card border border-border p-6 hover:border-foreground/20 transition-all hover-lift"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-serif text-lg font-medium text-foreground mb-1">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.items?.length ?? 0} {(order.items?.length ?? 0) === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 md:gap-8">
              <StatusBadge status={order.status} />
              <span className="font-serif text-lg font-medium text-foreground">
                {formatPrice(Number(order.totalAmount), order.currency)}
              </span>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RouteGuard>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">Account</p>
          <h1 className="text-4xl font-serif font-medium text-foreground">Order History</h1>
        </div>
        <OrdersContent />
      </div>
    </RouteGuard>
  );
}
