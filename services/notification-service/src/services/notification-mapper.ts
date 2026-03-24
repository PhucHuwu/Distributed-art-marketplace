import { EventEnvelopeV1, NotificationMessage, PrismaJsonObject } from '../types/event';
import { HttpError } from '../utils/http-error';

function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveDestination(payload: PrismaJsonObject): { email: string; phone: string } {
  const email = stringOrNull(payload.email) || 'unknown-user@example.local';
  const phone = stringOrNull(payload.phone) || '0000000000';

  return { email, phone };
}

export function mapEventToNotifications(envelope: EventEnvelopeV1): NotificationMessage[] {
  if (!envelope.eventId || !envelope.eventType || !envelope.correlationId) {
    throw new HttpError(400, 'INVALID_EVENT', 'Invalid event envelope required fields');
  }

  const payload = envelope.payload || {};
  const { email, phone } = resolveDestination(payload);
  const orderId = stringOrNull(payload.orderId) || 'unknown-order';
  const paymentId = stringOrNull(payload.paymentId) || 'unknown-payment';
  const failureMessage = stringOrNull(payload.failureMessage) || 'Unknown reason';

  if (envelope.eventType === 'order.completed') {
    return [
      {
        channel: 'email',
        to: email,
        subject: 'Order completed',
        body: `Your order ${orderId} has been completed successfully.`,
      },
      {
        channel: 'sms',
        to: phone,
        subject: 'Order completed',
        body: `Order ${orderId} completed. Thank you for your purchase.`,
      },
    ];
  }

  if (envelope.eventType === 'order.failed') {
    return [
      {
        channel: 'email',
        to: email,
        subject: 'Order failed',
        body: `Your order ${orderId} failed. Please try again or contact support.`,
      },
    ];
  }

  if (envelope.eventType === 'payment.failed') {
    return [
      {
        channel: 'email',
        to: email,
        subject: 'Payment failed',
        body: `Payment ${paymentId} failed for order ${orderId}. Reason: ${failureMessage}.`,
      },
    ];
  }

  throw new HttpError(400, 'UNSUPPORTED_EVENT_TYPE', `Unsupported event type: ${envelope.eventType}`);
}
