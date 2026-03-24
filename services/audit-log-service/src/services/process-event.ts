import { logger } from '../lib/logger';
import { normalizeEvent } from './event-normalizer';
import { EventEnvelopeV1 } from '../types/event';

export async function processEventEnvelope(
  envelope: EventEnvelopeV1,
  persistFn: (normalized: ReturnType<typeof normalizeEvent>) => Promise<boolean>,
): Promise<{ inserted: boolean; eventId: string; correlationId: string }> {
  const normalized = normalizeEvent(envelope);
  const inserted = await persistFn(normalized);

  if (!inserted) {
    logger.info(
      {
        eventId: normalized.eventId,
        correlationId: normalized.correlationId,
      },
      'Duplicate event skipped by idempotency guard',
    );
  } else {
    logger.info(
      {
        eventId: normalized.eventId,
        eventType: normalized.eventType,
        correlationId: normalized.correlationId,
      },
      'Event log persisted',
    );
  }

  return {
    inserted,
    eventId: normalized.eventId,
    correlationId: normalized.correlationId,
  };
}
