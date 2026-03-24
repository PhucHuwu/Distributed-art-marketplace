import { OrderStatus } from '@prisma/client';

type TransitionInput = {
  currentStatus: OrderStatus;
  eventType: string;
  payload: Record<string, unknown>;
};

export type TransitionResult = {
  nextStatus: OrderStatus;
  reason: string;
  publishEventType?: 'order.completed' | 'order.failed';
  publishPayload?: Record<string, unknown>;
} | null;

export function resolveLifecycleTransition(input: TransitionInput): TransitionResult {
  if (input.eventType === 'inventory.reserved' && input.currentStatus === OrderStatus.PENDING) {
    return {
      nextStatus: OrderStatus.AWAITING_PAYMENT,
      reason: 'Inventory reserved',
    };
  }

  if (
    input.eventType === 'inventory.failed' &&
    (input.currentStatus === OrderStatus.PENDING || input.currentStatus === OrderStatus.AWAITING_PAYMENT)
  ) {
    const reason =
      typeof input.payload.reason === 'string' ? input.payload.reason : 'Inventory reservation failed';

    return {
      nextStatus: OrderStatus.FAILED,
      reason,
      publishEventType: 'order.failed',
      publishPayload: {
        reason,
      },
    };
  }

  if (input.eventType === 'payment.success' && input.currentStatus === OrderStatus.AWAITING_PAYMENT) {
    return {
      nextStatus: OrderStatus.COMPLETED,
      reason: 'Payment successful',
      publishEventType: 'order.completed',
      publishPayload: {
        paymentId: input.payload.paymentId,
      },
    };
  }

  if (input.eventType === 'payment.failed' && input.currentStatus === OrderStatus.AWAITING_PAYMENT) {
    return {
      nextStatus: OrderStatus.FAILED,
      reason: typeof input.payload.reason === 'string' ? input.payload.reason : 'Payment failed',
      publishEventType: 'order.failed',
      publishPayload: {
        reason: typeof input.payload.reason === 'string' ? input.payload.reason : 'Payment failed',
      },
    };
  }

  return null;
}
