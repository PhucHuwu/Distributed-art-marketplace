'use client';

import { useEffect, useState } from 'react';
import { adminAuditApi } from '@/lib/api';
import type { AdminAuditLog } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineError, LoadingSpinner } from '@/components/ui-states';

function eventTypeClassName(eventType: string): string {
  const value = eventType.toLowerCase();

  if (value.includes('failed') || value.includes('cancelled')) {
    return 'bg-red-50 text-red-700';
  }

  if (value.includes('success') || value.includes('completed') || value.includes('reserved')) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (value.includes('pending') || value.includes('processing') || value.includes('awaiting')) {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-blue-50 text-blue-700';
}

function serviceClassName(serviceName: string): string {
  const value = serviceName.toLowerCase();

  if (value.includes('payment')) {
    return 'bg-violet-50 text-violet-700';
  }

  if (value.includes('inventory')) {
    return 'bg-cyan-50 text-cyan-700';
  }

  if (value.includes('order')) {
    return 'bg-orange-50 text-orange-700';
  }

  if (value.includes('auth')) {
    return 'bg-slate-100 text-slate-700';
  }

  return 'bg-stone-100 text-stone-700';
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [service, setService] = useState('');
  const [eventType, setEventType] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAuditApi.listLogs({
        userId: userId || undefined,
        orderId: orderId || undefined,
        service: service || undefined,
        eventType: eventType || undefined,
        limit: 200,
      });
      setItems(result.items);
      setPage(1);
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Không thể tải nhật ký hệ thống.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6 fade-in">
      <section className="bg-card border border-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2">
          <Label>User ID</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Order ID</Label>
          <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Service</Label>
          <Input value={service} onChange={(e) => setService(e.target.value)} placeholder="order-service" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Event Type</Label>
          <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="order.created" />
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <Button onClick={loadLogs}>Lọc nhật ký</Button>
        </div>
      </section>

      {error && <InlineError message={error.message} correlationId={error.correlationId} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <section className="bg-card border border-border p-6 overflow-x-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-serif">Danh sách sự kiện audit</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-muted-foreground">/ trang</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4">Thời điểm</th>
                <th className="py-2 pr-4">Event Type</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Order ID</th>
                <th className="py-2 pr-4">User ID</th>
                <th className="py-2 pr-4">Correlation ID</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(item.occurredAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${eventTypeClassName(item.eventType)}`}
                    >
                      {item.eventType}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${serviceClassName(item.serviceName)}`}
                    >
                      {item.serviceName}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.orderId || '-'}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.userId || '-'}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.correlationId}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Trang {currentPage}/{totalPages} - Hiển thị {pagedItems.length} trên tổng {items.length} sự kiện
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
