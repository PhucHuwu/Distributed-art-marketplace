'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { adminAuditApi, catalogApi } from '@/lib/api';
import type { AdminAuditLog } from '@/lib/types';
import { ErrorState, LoadingSpinner } from '@/components/ui-states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type DashboardState = {
  artworks: number;
  artists: number;
  categories: number;
  auditEvents: number;
  activeUsers: number;
  orderEventCount: number;
  logs: AdminAuditLog[];
};

const chartConfig = {
  count: { label: 'Số lượng', color: 'var(--chart-1)' },
  orders: { label: 'Đơn hàng', color: 'var(--chart-2)' },
  users: { label: 'Người dùng hoạt động', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function orderStatusColor(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('thất bại') || value.includes('hủy')) return '#dc2626';
  if (value.includes('hoàn tất')) return '#16a34a';
  if (value.includes('đang xử lý')) return '#d97706';
  return '#3b82f6';
}

function serviceColor(serviceName: string): string {
  const value = serviceName.toLowerCase();
  if (value.includes('payment')) return '#7c3aed';
  if (value.includes('inventory')) return '#0891b2';
  if (value.includes('order')) return '#ea580c';
  if (value.includes('auth')) return '#475569';
  if (value.includes('catalog')) return '#1d4ed8';
  if (value.includes('user')) return '#0f766e';
  if (value.includes('notification')) return '#16a34a';
  if (value.includes('audit')) return '#78716c';
  return '#6b7280';
}

function normalizeDateLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function extractOrderBucket(eventType: string): string {
  const value = eventType.toLowerCase();
  if (value.includes('completed')) return 'Hoàn tất';
  if (value.includes('failed')) return 'Thất bại';
  if (value.includes('cancelled')) return 'Đã hủy';
  if (value.includes('awaiting') || value.includes('pending') || value.includes('created')) return 'Đang xử lý';
  return 'Khác';
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<DashboardState>({
    artworks: 0,
    artists: 0,
    categories: 0,
    auditEvents: 0,
    activeUsers: 0,
    orderEventCount: 0,
    logs: [],
  });

  useEffect(() => {
    Promise.all([
      catalogApi.listArtworks({ page: 1, limit: 1 }),
      catalogApi.listArtists(),
      catalogApi.listCategories(),
      adminAuditApi.listLogs({ limit: 200 }),
    ])
      .then(([artworks, artists, categories, logs]) => {
        const uniqueUsers = new Set(logs.items.map((item) => item.userId).filter(Boolean));
        const orderEvents = logs.items.filter((item) => item.eventType.toLowerCase().startsWith('order.'));

        setState({
          artworks: artworks.meta.total,
          artists: artists.length,
          categories: categories.length,
          auditEvents: logs.meta.count,
          activeUsers: uniqueUsers.size,
          orderEventCount: orderEvents.length,
          logs: logs.items,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan quản trị.');
      })
      .finally(() => setLoading(false));
  }, []);

  const serviceData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of state.logs) {
      grouped.set(item.serviceName, (grouped.get(item.serviceName) || 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [state.logs]);

  const orderStatusData = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of state.logs) {
      if (!item.eventType.toLowerCase().startsWith('order.')) {
        continue;
      }

      const bucket = extractOrderBucket(item.eventType);
      grouped.set(bucket, (grouped.get(bucket) || 0) + 1);
    }

    return Array.from(grouped.entries()).map(([status, count]) => ({ status, count }));
  }, [state.logs]);

  const timelineData = useMemo(() => {
    const grouped = new Map<string, { count: number; users: Set<string> }>();
    for (const item of state.logs) {
      const key = new Date(item.occurredAt).toISOString().slice(0, 10);
      if (!grouped.has(key)) {
        grouped.set(key, { count: 0, users: new Set<string>() });
      }

      const entry = grouped.get(key)!;
      entry.count += 1;
      if (item.userId) {
        entry.users.add(item.userId);
      }
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, value]) => ({
        date: normalizeDateLabel(date),
        count: value.count,
        users: value.users.size,
      }));
  }, [state.logs]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const cards = [
    { label: 'Sản phẩm', value: state.artworks, hint: `${state.categories} danh mục` },
    { label: 'Họa sĩ', value: state.artists, hint: 'Dữ liệu catalog' },
    { label: 'Sự kiện audit', value: state.auditEvents, hint: '200 log gần nhất' },
    { label: 'Người dùng hoạt động', value: state.activeUsers, hint: 'Theo audit log' },
    { label: 'Sự kiện đơn hàng', value: state.orderEventCount, hint: 'Theo event order.*' },
  ];

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="py-4 gap-3">
            <CardHeader className="px-4 pb-0">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl font-serif">{card.value.toLocaleString('vi-VN')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-xs text-muted-foreground">{card.hint}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle>Phân bố sự kiện theo service</CardTitle>
            <CardDescription>Top service phát sinh log nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={serviceData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="count" hide />
                <YAxis
                  dataKey="serviceName"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <>
                          <span className="text-muted-foreground">{item.payload.serviceName}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums ml-auto">
                            {Number(value).toLocaleString('vi-VN')} sự kiện
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="count" radius={4}>
                  {serviceData.map((entry) => (
                    <Cell key={entry.serviceName} fill={serviceColor(entry.serviceName)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4">
            <CardTitle>Trạng thái vòng đời đơn hàng</CardTitle>
            <CardDescription>Tổng hợp từ event `order.*`</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={orderStatusData} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100}>
                  {orderStatusData.map((entry) => (
                    <Cell key={entry.status} fill={orderStatusColor(entry.status)} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="py-4">
        <CardHeader className="px-4">
          <CardTitle>Xu hướng hoạt động 7 ngày gần nhất</CardTitle>
          <CardDescription>So sánh số log và người dùng hoạt động theo ngày</CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={timelineData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
