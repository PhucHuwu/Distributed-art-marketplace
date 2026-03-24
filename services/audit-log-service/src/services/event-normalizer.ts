import { EventEnvelopeV1, NormalizedAuditEvent, PrismaJsonObject } from '../types/event';

function getAggregateId(payload: PrismaJsonObject): string | null {
  const candidates = ['aggregateId', 'orderId', 'paymentId', 'artworkId', 'userId'];

  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return null;
}

export function normalizeEvent(input: EventEnvelopeV1): NormalizedAuditEvent {
  if (!input.eventId || !input.eventType || !input.producer || !input.correlationId) {
    throw new Error('Invalid event envelope required fields');
  }

  const payload = input.payload || {};
  const orderId = typeof payload.orderId === 'string' ? payload.orderId : null;
  const userId = typeof payload.userId === 'string' ? payload.userId : null;

  return {
    eventId: input.eventId,
    eventType: input.eventType,
    serviceName: input.producer,
    aggregateId: getAggregateId(payload),
    orderId,
    userId,
    payload,
    occurredAt: new Date(input.occurredAt),
    correlationId: input.correlationId,
    version: input.version || 'v1',
  };
}
