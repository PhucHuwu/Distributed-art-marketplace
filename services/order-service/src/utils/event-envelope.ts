import { randomUUID } from 'node:crypto';
import { EventEnvelopeV1 } from '../types/event';

export function createEventEnvelope<TPayload>(input: {
  eventType: string;
  payload: TPayload;
  correlationId: string;
  producer: string;
}): EventEnvelopeV1<TPayload> {
  return {
    eventId: randomUUID(),
    eventType: input.eventType,
    occurredAt: new Date().toISOString(),
    producer: input.producer,
    correlationId: input.correlationId,
    version: 'v1',
    payload: input.payload,
  };
}
