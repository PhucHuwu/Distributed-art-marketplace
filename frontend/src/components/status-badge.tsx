import { OrderStatus } from '@/types/order';
import { PaymentStatus } from '@/types/payment';

type KnownStatus = OrderStatus | PaymentStatus;

const statusColor: Record<KnownStatus, string> = {
  PENDING: '#ca8a04',
  AWAITING_PAYMENT: '#2563eb',
  COMPLETED: '#16a34a',
  FAILED: '#dc2626',
  CANCELLED: '#6b7280',
  INITIATED: '#0ea5e9',
  PROCESSING: '#8b5cf6',
  SUCCESS: '#16a34a',
};

export function StatusBadge({ status }: { status: KnownStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '4px 10px',
        fontWeight: 700,
        fontSize: 12,
        color: 'white',
        backgroundColor: statusColor[status],
      }}
    >
      {status}
    </span>
  );
}
