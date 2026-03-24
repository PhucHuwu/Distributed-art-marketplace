import { randomUUID } from 'crypto';

import type { EventEnvelope } from './event.types';

export const createEventEnvelope = <TPayload>(
  eventType: string,
  payload: TPayload,
): EventEnvelope<TPayload> => {
  return {
    eventId: randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    source: 'auth-service',
    payload,
  };
};
